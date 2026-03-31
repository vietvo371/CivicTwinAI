<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Helpers\ApiResponse;

class MediaController extends Controller
{
    /**
     * Upload an image or video from mobile device
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:10240', // 10MB max
            'type' => 'nullable|in:image,video',
            'lien_ket_den' => 'nullable|string',
        ]);

        $file = $request->file('file');
        $type = $request->input('type', 'image');

        if ($file->isValid()) {
            $path = $file->store('media', 'public');
            
            // Generate a random ID since we don't have a dedicated Media table yet.
            // If the system scales, create a `media` table and eloquent model to store this.
            $mediaId = rand(1000, 9999);
            
            $url = url('storage/' . $path);

            $media = [
                'id' => $mediaId,
                'url' => $url,
                'type' => $type,
                'thumbnail_url' => $url, // If we had actual thumbnail generation
                'path' => $path, // internal
            ];

            return ApiResponse::success($media, 'api.media_uploaded');
        }

        return ApiResponse::error('api.upload_failed', 500);
    }

    /**
     * Get user's uploaded media
     */
    public function my(Request $request)
    {
        // Placeholder for querying from DB
        return ApiResponse::success([], 'api.media_retrieved');
    }

    /**
     * Get specific media details
     */
    public function show($id)
    {
        // Placeholder
        return ApiResponse::success([
            'id' => $id,
            'url' => url('storage/media/placeholder.jpg'),
            'type' => 'image',
        ], 'api.media_retrieved');
    }

    /**
     * Delete a media file
     */
    public function destroy($id, Request $request)
    {
        // Placeholder logical deletion
        return ApiResponse::success(null, 'api.media_deleted');
    }
}
