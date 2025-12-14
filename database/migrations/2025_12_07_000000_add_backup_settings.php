<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Setting;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add backup-related settings if they don't exist
        $settings = [
            [
                'key' => 'backupFrequency',
                'value' => 'daily',
                'type' => 'string',
                'description' => 'Frequency of automatic backups (hourly, daily, weekly, monthly)',
            ],
            [
                'key' => 'backupStorageLocation',
                'value' => '',
                'type' => 'string',
                'description' => 'Directory path where backups will be stored',
            ],
            [
                'key' => 'lastBackupTime',
                'value' => '',
                'type' => 'string',
                'description' => 'Timestamp of the last successful backup',
            ],
            [
                'key' => 'backupEnabled',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Whether automated backups are enabled',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Setting::whereIn('key', [
            'backupFrequency',
            'backupStorageLocation',
            'lastBackupTime',
            'backupEnabled',
        ])->delete();
    }
};
