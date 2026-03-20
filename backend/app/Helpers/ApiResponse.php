<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * ApiResponse — Chuẩn hóa toàn bộ JSON response cho CivicTwinAI
 * 
 * ⚠️ QUAN TRỌNG: Mọi response trong Controller đều phải dùng class này.
 * Không sử dụng response()->json() trực tiếp. Ngoại trừ Mapbox GeoJSON endpoint.
 */
class ApiResponse
{
    /**
     * Response thành công cơ bản (200 OK).
     */
    public static function success(
        mixed $data = null,
        string $message = 'Success',
        int $status = 200
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    /**
     * Response lỗi cơ bản (400 Bad Request / 500 / v.v.).
     */
    public static function error(
        string $message = 'An error occurred',
        int $status = 400,
        mixed $errors = null
    ): JsonResponse {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }

    /**
     * Response có phân trang.
     */
    public static function paginate(
        LengthAwarePaginator $paginator,
        string $message = 'Success'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last'  => $paginator->url($paginator->lastPage()),
                'prev'  => $paginator->previousPageUrl(),
                'next'  => $paginator->nextPageUrl(),
            ],
        ], 200);
    }

    /**
     * 404 Not Found.
     */
    public static function notFound(string $message = 'Data not found'): JsonResponse
    {
        return self::error($message, 404);
    }

    /**
     * 401 Unauthorized.
     */
    public static function unauthorized(string $message = 'Unauthorized. Please log in first.'): JsonResponse
    {
        return self::error($message, 401);
    }

    /**
     * 403 Forbidden.
     */
    public static function forbidden(string $message = 'You do not have permission to perform this action'): JsonResponse
    {
        return self::error($message, 403);
    }

    /**
     * 422 Validation Error.
     */
    public static function validationError(
        mixed $errors,
        string $message = 'Validation Error'
    ): JsonResponse {
        return self::error($message, 422, $errors);
    }

    /**
     * 201 Created.
     */
    public static function created(
        mixed $data = null,
        string $message = 'Created successfully'
    ): JsonResponse {
        return self::success($data, $message, 201);
    }

    /**
     * 200 Deleted (with null data).
     */
    public static function deleted(string $message = 'Deleted successfully'): JsonResponse
    {
        return self::success(null, $message, 200);
    }

    /**
     * 500 Server Error.
     */
    public static function serverError(string $message = 'Internal server error'): JsonResponse
    {
        return self::error($message, 500);
    }
}
