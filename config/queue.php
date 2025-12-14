<?php

return [
    /* Minimal queue config placeholder */
    'default' => env('QUEUE_CONNECTION', 'sync'),

    'connections' => [
        'sync' => [
            'driver' => 'sync',
        ],
    ],

    'failed' => [
        'driver' => env('QUEUE_FAILED_DRIVER', 'database'),
        'database' => env('DB_CONNECTION', 'sqlite'),
        'table' => env('QUEUE_FAILED_TABLE', 'failed_jobs'),
    ],

];
