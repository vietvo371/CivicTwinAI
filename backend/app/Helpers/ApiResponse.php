<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * ApiResponse — Standardized JSON response for CivicTwinAI
 *
 * All controller responses MUST use this class.
 * Messages are auto-translated via Laravel's __() helper.
 */
class ApiResponse
{
    public static function success(
        mixed $data = null,
        string $message = 'api.success',
        int $status = 200
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => __($message),
            'data'    => $data,
        ], $status);
    }

    public static function error(
        string $message = 'api.error',
        int $status = 400,
        mixed $errors = null
    ): JsonResponse {
        $payload = [
            'success' => false,
            'message' => __($message),
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }

    public static function paginate(
        LengthAwarePaginator $paginator,
        string $message = 'api.success'
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => __($message),
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

    public static function notFound(string $message = 'api.not_found'): JsonResponse
    {
        return self::error($message, 404);
    }

    public static function unauthorized(string $message = 'api.unauthorized'): JsonResponse
    {
        return self::error($message, 401);
    }

    public static function forbidden(string $message = 'api.forbidden'): JsonResponse
    {
        return self::error($message, 403);
    }

    public static function validationError(
        mixed $errors,
        string $message = 'api.validation_error'
    ): JsonResponse {
        return self::error($message, 422, $errors);
    }

    public static function created(
        mixed $data = null,
        string $message = 'api.created'
    ): JsonResponse {
        return self::success($data, $message, 201);
    }

    public static function deleted(string $message = 'api.deleted'): JsonResponse
    {
        return self::success(null, $message, 200);
    }

    public static function serverError(string $message = 'api.server_error'): JsonResponse
    {
        return self::error($message, 500);
    }
}
