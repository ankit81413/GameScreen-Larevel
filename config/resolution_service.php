<?php

return [
    'enabled' => (bool) env('RESOLUTION_SERVICE_ENABLED', false),
    'base_url' => rtrim((string) env('RESOLUTION_SERVICE_BASE_URL', 'http://127.0.0.1:9000'), '/'),
    'request_token' => (string) env('RESOLUTION_SERVICE_REQUEST_TOKEN', ''),
    'callback_token' => (string) env('RESOLUTION_SERVICE_CALLBACK_TOKEN', ''),
    'source_disk' => (string) env('RESOLUTION_SERVICE_SOURCE_DISK', 'public'),
];

