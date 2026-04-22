<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIAssistController extends Controller
{
    private function groqKey(): string
    {
        return config('services.groq.api_key', env('GROQ_API_KEY', ''));
    }

    /**
     * Groq: base64 trong request tối đa ~4MB → ảnh lớn / PNG cần nén JPEG trước khi gửi.
     *
     * @return array{mime: string, base64: string}
     */
    private function encodeImageForGroqVision(\Illuminate\Http\UploadedFile $file): array
    {
        $path = $file->getRealPath();
        if ($path === false || ! is_readable($path)) {
            throw new \RuntimeException('Cannot read uploaded image.');
        }

        $binary = file_get_contents($path);
        if ($binary === false || $binary === '') {
            throw new \RuntimeException('Empty image file.');
        }

        $mime = $file->getMimeType() ?: 'image/jpeg';
        $maxB64Len = 3_500_000;

        $b64 = base64_encode($binary);
        if (strlen($b64) <= $maxB64Len) {
            return ['mime' => $mime, 'base64' => $b64];
        }

        if (! extension_loaded('gd')) {
            Log::error('AI analyze-image: image exceeds Groq base64 limit and GD extension missing', [
                'base64_len' => strlen($b64),
                'file_bytes' => strlen($binary),
            ]);
            throw new \RuntimeException('Image too large for vision API (max ~4MB base64). Enable PHP GD or use a smaller photo.');
        }

        $img = @imagecreatefromstring($binary);
        if ($img === false) {
            throw new \RuntimeException('Could not decode image for resizing.');
        }

        $w = imagesx($img);
        $h = imagesy($img);
        $maxEdge = 1024;
        if ($w > $maxEdge || $h > $maxEdge) {
            if ($w >= $h) {
                $nw = $maxEdge;
                $nh = max(1, (int) round($h * ($maxEdge / $w)));
            } else {
                $nh = $maxEdge;
                $nw = max(1, (int) round($w * ($maxEdge / $h)));
            }
            $scaled = imagescale($img, $nw, $nh);
            imagedestroy($img);
            if ($scaled === false) {
                throw new \RuntimeException('Image scale failed.');
            }
            $img = $scaled;
        }

        $quality = 82;
        $jpeg = $this->imageToJpegString($img, $quality);
        imagedestroy($img);

        while ($jpeg !== null && strlen(base64_encode($jpeg)) > $maxB64Len && $quality > 45) {
            $quality -= 12;
            $im = @imagecreatefromstring($jpeg);
            if ($im === false) {
                break;
            }
            $jpeg = $this->imageToJpegString($im, $quality);
            imagedestroy($im);
        }

        if ($jpeg === null || $jpeg === '') {
            throw new \RuntimeException('Could not compress image for vision API.');
        }

        $finalB64 = base64_encode($jpeg);
        Log::info('AI analyze-image: resized for Groq', [
            'original_b64_len' => strlen($b64),
            'new_b64_len' => strlen($finalB64),
            'jpeg_quality' => $quality,
        ]);

        return ['mime' => 'image/jpeg', 'base64' => $finalB64];
    }

    private function imageToJpegString(\GdImage $img, int $quality): ?string
    {
        ob_start();
        imagejpeg($img, null, max(1, min(100, $quality)));
        $out = ob_get_clean();

        return $out !== false ? $out : null;
    }

    /**
     * Groq đôi khi trả JSON rỗng / mảng / lỗi parse → luôn trả object cho mobile/web.
     *
     * @param  mixed  $parsed  Kết quả json_decode
     * @return array{type: string, severity: string, description: string, confidence: float, unclear: bool, user_hint?: string}
     */
    private function normalizeVisionResult(mixed $parsed, bool $isVi = true): array
    {
        $allowedTypes = ['accident', 'congestion', 'construction', 'weather', 'other'];
        $allowedSev = ['low', 'medium', 'high', 'critical'];

        // Fallback text theo locale
        $fallbackVi = [
            'description' => 'Không thể phân tích hình ảnh. Vui lòng mô tả thủ công.',
            'user_hint' => 'Thử chụp ảnh rõ hơn hoặc nhập mô tả thủ công.',
        ];
        $fallbackEn = [
            'description' => 'Unable to analyze the image. Please provide a manual description.',
            'user_hint' => 'Try taking a clearer photo or enter a manual description.',
        ];
        $fallback = $isVi ? $fallbackVi : $fallbackEn;
        $fallback['type'] = 'other';
        $fallback['severity'] = 'low';
        $fallback['confidence'] = 0.0;
        $fallback['unclear'] = true;

        if (! is_array($parsed) || $parsed === [] || array_is_list($parsed)) {
            return $fallback;
        }

        $description = isset($parsed['description']) ? trim((string) $parsed['description']) : '';
        if ($description === '') {
            $type = in_array($parsed['type'] ?? '', $allowedTypes, true) ? $parsed['type'] : 'other';
            $severity = in_array($parsed['severity'] ?? '', $allowedSev, true) ? $parsed['severity'] : 'low';

            return array_merge($fallback, [
                'type' => $type,
                'severity' => $severity,
            ]);
        }

        $type = in_array($parsed['type'] ?? '', $allowedTypes, true) ? $parsed['type'] : 'other';
        $severity = in_array($parsed['severity'] ?? '', $allowedSev, true) ? $parsed['severity'] : 'medium';

        $confidence = isset($parsed['confidence']) ? (float) $parsed['confidence'] : 0.5;
        if ($confidence < 0 || $confidence > 1) {
            $confidence = 0.5;
        }

        return [
            'type' => $type,
            'severity' => $severity,
            'description' => $description,
            'confidence' => $confidence,
            'unclear' => false,
        ];
    }

    /**
     * Read locale from request header.
     * Supports both `Accept-Language` (web) and `x-Language` (mobile).
     * x-Language takes priority over Accept-Language.
     */
    private function getLocale(Request $request): string
    {
        // x-Language (mobile) takes priority
        if ($request->header('x-Language')) {
            return $request->header('x-Language');
        }
        // Accept-Language (web)
        $acceptLang = $request->header('Accept-Language');
        if ($acceptLang) {
            // Parse "en-US,en;q=0.9" → extract primary language
            $parts = explode(',', strtolower($acceptLang));
            $primary = trim(explode(';', $parts[0])[0]);
            return $primary;
        }
        return 'vi';
    }

    /**
     * Module 2: Parse natural language text into structured incident data.
     * POST /api/ai/parse-report
     *
     * Respects Accept-Language (web) / x-Language (mobile) header and returns
     * title/summary in the user's language so the frontend can display immediately.
     */
    public function parseReport(Request $request)
    {
        $request->validate(['text' => 'required|string|min:3|max:1000']);
        $text = $request->input('text');
        $locale = $this->getLocale($request);
        $isVi = str_starts_with(strtolower($locale), 'vi');

        $systemVi = 'Bạn là trợ lý phân tích sự cố giao thông. Từ mô tả của người dân, hãy trích xuất JSON với các trường:
- "type": một trong ["accident","congestion","construction","weather","other"]
- "severity": một trong ["low","medium","high","critical"]
- "location": tên đường/địa điểm (nếu có)
- "title": tiêu đề ngắn gọn cho sự cố bằng TIẾNG VIỆT (tối đa 60 ký tự)
- "summary": tóm tắt tình huống 1 câu bằng TIẾNG VIỆT

Nếu mô tả quá ngắn hoặc vô nghĩa (ví dụ: "asdasd", "abc"), hãy trả về: {"error": "NOT_ENOUGH_INFO", "message": "Mô tả chưa đủ thông tin để phân tích."}.
Chỉ trả về JSON, không giải thích thêm.';

        $systemEn = 'You are a traffic incident analysis assistant. From the citizen description, extract a JSON with these fields:
- "type": one of ["accident","congestion","construction","weather","other"]
- "severity": one of ["low","medium","high","critical"]
- "location": street/place name (if any)
- "title": short title for the incident in ENGLISH (max 60 characters)
- "summary": one-sentence summary in ENGLISH

If the description is too short or meaningless (e.g. "asdasd", "abc"), return: {"error": "NOT_ENOUGH_INFO", "message": "Description not enough info to analyze."}.
Return JSON only, no explanations.';

        $system = $isVi ? $systemVi : $systemEn;

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqKey(),
                'Content-Type' => 'application/json',
            ])->timeout(15)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.1-8b-instant',
                'temperature' => 0.1,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $text],
                ],
            ]);

            if (!$response->successful()) {
                throw new \RuntimeException("Groq returned {$response->status()}");
            }

            $content = $response->json('choices.0.message.content', '{}');
            $parsed = json_decode($content, true) ?? [];

            if (!($parsed['error'] ?? false)) {
                $parsed['title_vi'] = $parsed['title'] ?? null;
                $parsed['summary_vi'] = $parsed['summary'] ?? null;
            }

            return ApiResponse::success($parsed, 'AI analysis completed.');
        } catch (\Exception $e) {
            Log::error("AI parse-report failed: {$e->getMessage()}");
            return ApiResponse::error('AI analysis failed. Please fill in manually.', 500);
        }
    }

    /**
     * Module 3: Analyze uploaded image to detect incident severity.
     * POST /api/ai/analyze-image
     *
     * Respects Accept-Language header (vi | en) and returns description in the
     * user's language so it can be displayed directly in the Vision card.
     */
    public function analyzeImage(Request $request)
    {
        $request->validate(['image' => 'required|image|mimes:jpeg,png,jpg|max:5120']);

        $locale = $this->getLocale($request);
        $isVi = str_starts_with(strtolower($locale), 'vi');

        try {
            $encoded = $this->encodeImageForGroqVision($request->file('image'));
            $imageData = $encoded['base64'];
            $mimeType = $encoded['mime'];

            // Bilingual system prompt — language portion matches Accept-Language
            $langInstruction = $isVi
                ? '"description" (1–2 short sentences in Vietnamese: vehicles, road, crash, jam, flood, worksite, etc.)'
                : '"description" (1–2 short sentences in English: vehicles, road, crash, jam, flood, worksite, etc.)';

            $unclearHint = $isVi
                ? 'description explaining in Vietnamese'
                : 'description explaining in English';

            // User prompt text theo locale
            $userPromptVi = 'Phân tích ảnh cho báo cáo sự cố giao thông. Trả về đúng một JSON object theo schema.';
            $userPromptEn = 'Analyze this image for a traffic incident report. Return exactly one JSON object following the schema.';
            $userPrompt = $isVi ? $userPromptVi : $userPromptEn;

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqKey(),
                'Content-Type' => 'application/json',
            ])->timeout(55)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'meta-llama/llama-4-scout-17b-16e-instruct',
                'temperature' => 0.15,
                'max_tokens' => 600,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are a vision analyst for citizen traffic-incident reports in Vietnam. '
                            .'Reply with ONE JSON object only (no markdown). Keys: '
                            .'"type" (accident|congestion|construction|weather|other), '
                            .'"severity" (low|medium|high|critical), '
                            .$langInstruction.', '
                            .'"confidence" (0 to 1). '
                            .'If the image is unrelated, too dark, indoor, selfie, or not showing streets/traffic: still return valid JSON with type "other", severity "low", '.$unclearHint.', confidence at most 0.25.',
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $userPrompt,
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => "data:{$mimeType};base64,{$imageData}",
                                ],
                            ],
                        ],
                    ],
                ],
            ]);

            if (! $response->successful()) {
                Log::error('Groq Vision HTTP error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \RuntimeException("Groq Vision returned {$response->status()}: {$response->body()}");
            }

            $body = $response->json();
            $choice = $body['choices'][0] ?? null;
            $content = is_array($choice) ? ($choice['message']['content'] ?? null) : null;
            $finishReason = is_array($choice) ? ($choice['finish_reason'] ?? null) : null;

            if ($content === null || $content === '') {
                Log::warning('AI analyze-image: Groq returned empty content', [
                    'finish_reason' => $finishReason,
                    'model' => $body['model'] ?? null,
                    'usage' => $body['usage'] ?? null,
                    'choice' => $choice,
                ]);
                $parsed = [];
            } else {
                $content = preg_replace('/^```json\s*|\s*```$/s', '', trim((string) $content));
                $parsed = json_decode($content, true);
                if (! is_array($parsed)) {
                    Log::warning('AI analyze-image: json_decode failed', [
                        'finish_reason' => $finishReason,
                        'raw_preview' => mb_substr((string) $content, 0, 800),
                    ]);
                    $parsed = [];
                }
            }

            $normalized = $this->normalizeVisionResult($parsed, $isVi);

            if ($normalized['unclear'] ?? false) {
                Log::warning('AI analyze-image: normalized to unclear fallback', [
                    'finish_reason' => $finishReason,
                    'parsed_before_normalize' => $parsed,
                    'raw_content_preview' => isset($content) && is_string($content) ? mb_substr($content, 0, 600) : null,
                    'base64_len_sent' => strlen($imageData),
                ]);
            } else {
                Log::info('AI analyze-image: OK', [
                    'type' => $normalized['type'],
                    'severity' => $normalized['severity'],
                    'confidence' => $normalized['confidence'],
                    'description_len' => strlen($normalized['description']),
                ]);
            }

            $messageKey = ($normalized['unclear'] ?? false)
                ? 'api.ai_image_unclear'
                : 'api.ai_image_analysis_completed';

            return ApiResponse::success($normalized, $messageKey);
        } catch (\Exception $e) {
            Log::error("AI analyze-image failed: {$e->getMessage()}");
            return ApiResponse::error('Image analysis failed.', 500);
        }
    }
}
