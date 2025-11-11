<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://192.168.1.38:8000',
        'http://192.168.23.104:8000',
    ],

    'allowed_origins_patterns' => [
        '/^http:\/\/192\.168\.\d+\.\d+:8000$/', // Allow any 192.168.x.x IP
        '/^http:\/\/10\.\d+\.\d+\.\d+:8000$/', // Allow any 10.x.x.x IP (common local network)
        '/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:8000$/', // Allow 172.16-31.x.x IPs
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
