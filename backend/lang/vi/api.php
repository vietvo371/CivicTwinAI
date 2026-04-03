<?php

return [
    // General
    'success' => 'Thành công',
    'error' => 'Đã xảy ra lỗi',
    'not_found' => 'Không tìm thấy dữ liệu',
    'unauthorized' => 'Bạn chưa đăng nhập. Vui lòng đăng nhập trước.',
    'forbidden' => 'Bạn không có quyền thực hiện thao tác này',
    'validation_error' => 'Dữ liệu không hợp lệ',
    'created' => 'Tạo thành công',
    'deleted' => 'Xóa thành công',
    'server_error' => 'Lỗi máy chủ',
    'geocode_fallback_coordinates' => 'Chỉ lấy được tọa độ; hãy thử chọn điểm trên bản đồ hoặc nhập địa chỉ tay.',

    // Auth
    'login_success' => 'Đăng nhập thành công',
    'register_success' => 'Đăng ký thành công',
    'logout_success' => 'Đăng xuất thành công',
    'profile_retrieved' => 'Lấy thông tin người dùng thành công',
    'invalid_credentials' => 'Email hoặc mật khẩu không đúng.',
    'account_deactivated' => 'Tài khoản đã bị vô hiệu hóa.',
    'google_login_failed' => 'Không thể đăng nhập bằng Google. Vui lòng thử lại.',

    // Users
    'users_retrieved' => 'Danh sách người dùng',
    'user_created' => 'Tạo người dùng thành công',
    'user_updated' => 'Cập nhật người dùng thành công',
    'user_deactivated' => 'Đã vô hiệu hóa tài khoản',

    // Incidents
    'incidents_retrieved' => 'Danh sách sự cố',
    'incident_created' => 'Báo cáo sự cố thành công',
    'incident_updated' => 'Cập nhật sự cố thành công',
    'incident_details' => 'Chi tiết sự cố',

    // Predictions
    'predictions_retrieved' => 'Danh sách dự đoán',
    'prediction_details' => 'Chi tiết dự đoán',
    'prediction_triggered' => 'Đã kích hoạt dự đoán AI',

    // Recommendations
    'recommendations_retrieved' => 'Danh sách đề xuất',
    'recommendation_details' => 'Chi tiết đề xuất',
    'recommendation_approved' => 'Đề xuất đã được phê duyệt',
    'recommendation_rejected' => 'Đề xuất đã bị từ chối',
    'only_pending' => 'Chỉ có thể thao tác với đề xuất đang ở trạng thái pending.',

    // Master Data
    'nodes_retrieved' => 'Danh sách nút giao',
    'node_details' => 'Chi tiết nút giao',
    'edges_retrieved' => 'Danh sách đoạn đường',
    'edge_details' => 'Chi tiết đoạn đường',
    'sensors_retrieved' => 'Danh sách cảm biến',
    'sensor_data_processed' => 'Dữ liệu cảm biến đã được xử lý',
    'sensor_stats' => 'Thống kê cảm biến',

    // Admin
    'stats_retrieved' => 'Thống kê hệ thống',
    'logs_retrieved' => 'Nhật ký hệ thống',

    // Mobile reports (citizen DTO → incidents)
    'reports_retrieved' => 'Danh sách phản ánh',
    'my_reports_retrieved' => 'Phản ánh của bạn',
    'report_retrieved' => 'Chi tiết phản ánh',
    'report_created' => 'Tạo phản ánh thành công',
    'report_updated' => 'Cập nhật phản ánh thành công',
    'report_stats_retrieved' => 'Thống kê phản ánh',
    'nearby_reports_retrieved' => 'Phản ánh lân cận',
    'trending_reports_retrieved' => 'Phản ánh đang được quan tâm',
    'viewed' => 'Đã ghi nhận lượt xem',
    'vote_recorded' => 'Đã ghi nhận bình chọn',
    'rating_recorded' => 'Đã ghi nhận đánh giá',
    'comment_added' => 'Đã thêm bình luận',

    // AI vision (analyze-image)
    'ai_image_analysis_completed' => 'Phân tích ảnh hoàn tất.',
    'ai_image_unclear' => 'Ảnh chưa đủ rõ để tự điền form.',
    'ai_vision_unclear_description' => 'Không nhận diện được tình huống giao thông từ ảnh (AI không trả dữ liệu hoặc ảnh mờ/quá xa).',
    'ai_vision_user_hint' => 'Hãy xóa ảnh này và chụp lại: gần hơn, đủ sáng, thấy rõ đường hoặc phương tiện / sự cố.',
];
