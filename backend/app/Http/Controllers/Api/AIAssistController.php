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
     * Module 2: Parse natural language text into structured incident data.
     * POST /api/ai/parse-report
     */
    public function parseReport(Request $request)
    {
        $request->validate(['text' => 'required|string|min:3|max:1000']);
        $text = $request->input('text');

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqKey(),
                'Content-Type' => 'application/json',
            ])->timeout(15)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.1-8b-instant',
                'temperature' => 0.1,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Bạn là trợ lý phân tích sự cố giao thông. Từ mô tả của người dân, hãy trích xuất JSON với các trường:
- "type": một trong ["accident","congestion","construction","weather","other"]
- "severity": một trong ["low","medium","high","critical"]
- "location": tên đường/địa điểm (nếu có)
- "title": tiêu đề ngắn gọn cho sự cố (tối đa 60 ký tự)
- "summary": tóm tắt tình huống 1 câu

Nếu mô tả quá ngắn hoặc vô nghĩa (ví dụ: "asdasd", "abc"), hãy trả về: {"error": "NOT_ENOUGH_INFO", "message": "Mô tả chưa đủ thông tin để phân tích."}.
Chỉ trả về JSON, không giải thích thêm.'
                    ],
                    ['role' => 'user', 'content' => $text],
                ],
            ]);

            if (!$response->successful()) {
                throw new \RuntimeException("Groq returned {$response->status()}");
            }

            $content = $response->json('choices.0.message.content', '{}');
            $parsed = json_decode($content, true) ?? [];

            return ApiResponse::success($parsed, 'AI analysis completed.');
        } catch (\Exception $e) {
            Log::error("AI parse-report failed: {$e->getMessage()}");
            return ApiResponse::error('AI analysis failed. Please fill in manually.', 500);
        }
    }

    /**
     * Module 3: Analyze uploaded image to detect incident severity.
     * POST /api/ai/analyze-image
     */
    public function analyzeImage(Request $request)
    {
        $request->validate(['image' => 'required|image|mimes:jpeg,png,jpg|max:5120']);

        try {
            $imageData = base64_encode(file_get_contents($request->file('image')->getRealPath()));
            $mimeType = $request->file('image')->getMimeType();

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqKey(),
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'meta-llama/llama-4-scout-17b-16e-instruct',
                'temperature' => 0.2,
                'max_tokens' => 500,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => 'Bạn là hệ thống phân tích sự cố giao thông từ ảnh. Hãy phân tích bức ảnh và trả về JSON với các trường:
- "type": một trong ["accident","congestion","construction","weather","other"]
- "severity": một trong ["low","medium","high","critical"]
- "description": mô tả ngắn tình huống trong ảnh (1-2 câu tiếng Việt)
- "confidence": độ tin cậy từ 0 đến 1

Nếu ảnh không liên quan đến giao thông, trả về: {"type":"other","severity":"low","description":"Ảnh không rõ tình huống giao thông.","confidence":0.1}
Chỉ trả về JSON, không giải thích.'
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

            if (!$response->successful()) {
                Log::error('Groq Vision error body: ' . $response->body());
                throw new \RuntimeException("Groq Vision returned {$response->status()}: {$response->body()}");
            }

            $content = $response->json('choices.0.message.content', '{}');
            // Strip markdown code fences if present
            $content = preg_replace('/^```json\s*|\s*```$/s', '', trim($content));
            $parsed = json_decode($content, true) ?? [];

            return ApiResponse::success($parsed, 'Image analysis completed.');
        } catch (\Exception $e) {
            Log::error("AI analyze-image failed: {$e->getMessage()}");
            return ApiResponse::error('Image analysis failed.', 500);
        }
    }
}
