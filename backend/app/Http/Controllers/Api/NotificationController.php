<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Incident;
use App\Helpers\ApiResponse;

class NotificationController extends Controller
{
    private function formatDatabaseNotification($notification)
    {
        $data = $notification->data;
        $actualTime = $data['metadata']['created_at'] ?? $notification->created_at;

        return [
            'id' => $notification->id,
            // Standard Keys
            'title' => $data['title'] ?? 'Thông báo',
            'message' => $data['message'] ?? '',
            'type' => $data['type'] ?? 'system',
            'read' => !is_null($notification->read_at),
            'data' => $data['metadata'] ?? $data,
            'created_at' => $actualTime,
            
            // Legacy Keys (Backward Compatibility)
            'tieu_de' => $data['title'] ?? 'Thông báo',
            'noi_dung' => $data['message'] ?? '',
            'loai' => $data['type'] ?? 'system',
            'da_doc' => !is_null($notification->read_at),
            'du_lieu_mo_rong' => $data['metadata'] ?? $data,
            'ngay_tao' => $actualTime,
        ];
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 50));
            
        return ApiResponse::success(
            collect($notifications->items())->map(fn($n) => $this->formatDatabaseNotification($n)), 
            'api.notifications_retrieved'
        );
    }

    public function unread(Request $request)
    {
        $user = $request->user();
        $notifications = $user->unreadNotifications()
            ->orderBy('created_at', 'desc')
            ->take($request->input('per_page', 50))
            ->get();
            
        return ApiResponse::success(
            $notifications->map(fn($n) => $this->formatDatabaseNotification($n)), 
            'api.unread_notifications_retrieved'
        );
    }

    public function unreadCount(Request $request)
    {
        $count = $request->user()->unreadNotifications()->count();
        return ApiResponse::success(['count' => $count], 'api.unread_count_retrieved');
    }

    public function markAsRead($id, Request $request)
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();
        
        if ($notification) {
            $notification->markAsRead();
            return ApiResponse::success(null, 'api.notification_read');
        }
        
        return ApiResponse::error('api.notification_not_found', 404);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return ApiResponse::success(null, 'api.notifications_read');
    }
}
