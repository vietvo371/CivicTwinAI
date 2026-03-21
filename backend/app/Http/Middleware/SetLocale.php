<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('Accept-Language', 'vi');

        // Extract primary language tag (e.g., "en-US,en;q=0.9" → "en")
        $locale = strtolower(substr($locale, 0, 2));

        if (!in_array($locale, ['vi', 'en'])) {
            $locale = 'vi';
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
