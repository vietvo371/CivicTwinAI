<?php

return [
    // General
    'success' => 'Success',
    'error' => 'An error occurred',
    'not_found' => 'Data not found',
    'unauthorized' => 'Unauthorized. Please log in first.',
    'forbidden' => 'You do not have permission to perform this action',
    'validation_error' => 'Validation Error',
    'created' => 'Created successfully',
    'deleted' => 'Deleted successfully',
    'server_error' => 'Internal server error',
    'geocode_fallback_coordinates' => 'Only coordinates available; try the map picker or enter the address manually.',

    // Auth
    'login_success' => 'Login successful',
    'register_success' => 'Registration successful',
    'logout_success' => 'Logged out successfully',
    'profile_retrieved' => 'User profile retrieved',
    'invalid_credentials' => 'Invalid email or password.',
    'account_deactivated' => 'This account has been deactivated.',
    'google_login_failed' => 'Unable to login with Google. Please try again.',

    // Users
    'users_retrieved' => 'Users retrieved',
    'user_created' => 'User created successfully',
    'user_updated' => 'User updated successfully',
    'user_deactivated' => 'User deactivated successfully',

    // Incidents
    'incidents_retrieved' => 'Incidents retrieved',
    'incident_created' => 'Incident reported successfully',
    'incident_updated' => 'Incident updated successfully',
    'incident_details' => 'Incident details retrieved',

    // Predictions
    'predictions_retrieved' => 'Predictions retrieved',
    'prediction_details' => 'Prediction details retrieved',
    'prediction_triggered' => 'AI prediction job dispatched',

    // Recommendations
    'recommendations_retrieved' => 'Recommendations retrieved',
    'recommendation_details' => 'Recommendation details retrieved',
    'recommendation_approved' => 'Recommendation approved',
    'recommendation_rejected' => 'Recommendation rejected',
    'only_pending' => 'Only pending recommendations can be processed.',

    // Master Data
    'nodes_retrieved' => 'Nodes retrieved',
    'node_details' => 'Node details retrieved',
    'edges_retrieved' => 'Traffic edges retrieved',
    'edge_details' => 'Edge details retrieved',
    'sensors_retrieved' => 'Sensors retrieved',
    'sensor_data_processed' => 'Sensor data processed',
    'sensor_stats' => 'Sensor statistics retrieved',

    // Admin
    'stats_retrieved' => 'System statistics retrieved',
    'logs_retrieved' => 'Activity logs retrieved',

    // Mobile reports (citizen DTO → incidents)
    'reports_retrieved' => 'Reports retrieved',
    'my_reports_retrieved' => 'Your reports retrieved',
    'report_retrieved' => 'Report retrieved',
    'report_created' => 'Report created successfully',
    'report_updated' => 'Report updated successfully',
    'report_stats_retrieved' => 'Report statistics retrieved',
    'nearby_reports_retrieved' => 'Nearby reports retrieved',
    'trending_reports_retrieved' => 'Trending reports retrieved',
    'viewed' => 'View recorded',
    'vote_recorded' => 'Vote recorded',
    'rating_recorded' => 'Rating recorded',
    'comment_added' => 'Comment added',

    // AI vision (analyze-image)
    'ai_image_analysis_completed' => 'Image analysis completed.',
    'ai_image_unclear' => 'The photo is not clear enough to auto-fill the form.',
    'ai_vision_unclear_description' => 'Could not detect a traffic situation from the image (empty AI response or photo too dark/far).',
    'ai_vision_user_hint' => 'Remove this photo and take another: closer, well lit, with the road or incident clearly visible.',
];
