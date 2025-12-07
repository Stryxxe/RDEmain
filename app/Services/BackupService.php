<?php

namespace App\Services;

use App\Models\Proposal;
use App\Models\User;
use App\Models\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Exception;

class BackupService
{
    /**
     * File type categories for backup
     */
    private const BACKUP_FILE_TYPES = [
        'research_proposal' => ['pdf', 'docx', 'doc'],
        'seti' => ['seti', 'pdf', 'docx', 'doc'],
        'gad' => ['gad', 'pdf', 'docx', 'doc'],
        'moc' => ['moc', 'matrix', 'pdf', 'xlsx', 'xls', 'docx', 'doc'],
    ];

    /**
     * Files to exclude from backup
     */
    private const EXCLUDED_TYPES = ['supporting_documents'];

    /**
     * Create backup of all proposals organized by user and proposal ID
     * 
     * @param string $backupPath The base path where backups will be stored
     * @param bool $scanForDuplicates Whether to scan and avoid duplicates
     * @return array Result with status and message
     */
    public function createBackup(string $backupPath, bool $scanForDuplicates = true): array
    {
        try {
            // Validate backup path
            if (!$this->validateBackupPath($backupPath)) {
                return $this->errorResponse('Invalid or inaccessible backup path');
            }

            // Create backup directory if it doesn't exist
            if (!is_dir($backupPath)) {
                mkdir($backupPath, 0755, true);
            }

            // Scan for existing backups to avoid per-file duplicates while still refreshing folders
            $existingBackups = [];
            if ($scanForDuplicates) {
                $existingBackups = $this->scanExistingBackups($backupPath);
            }

            // Get all proposals (active and inactive)
            $proposals = Proposal::with(['user', 'files'])->get();

            $backupStats = [
                'total_proposals' => 0,
                'backed_up' => 0,
                'files_skipped_duplicates' => 0,
                'errors' => [],
                'user_folders_created' => 0,
                'proposal_folders_created' => 0,
                'files_copied' => 0,
                'proposals_without_files' => 0,
                'files_missing_on_disk' => 0,
                'file_types_found' => [],
            ];

            // Group proposals by user
            $proposalsByUser = $proposals->groupBy('userID');

            foreach ($proposalsByUser as $userId => $userProposals) {
                try {
                    $user = $userProposals->first()->user;
                    if (!$user) {
                        continue;
                    }

                    // Create user folder
                    $userFolderName = $this->generateUserFolderName($user);
                    $userPath = $this->joinPaths($backupPath, $userFolderName);

                    if (!is_dir($userPath)) {
                        mkdir($userPath, 0755, true);
                        $backupStats['user_folders_created']++;
                    }

                    // Process each proposal for this user
                    foreach ($userProposals as $proposal) {
                        $backupStats['total_proposals']++;

                        // Gather existing files to avoid duplicate copies while allowing refresh
                        $proposalKey = "{$userId}_{$proposal->proposalID}";
                        $existingFiles = $existingBackups[$proposalKey] ?? [];

                        // Create proposal folder
                        $proposalFolderName = $this->generateProposalFolderName($proposal);
                        $proposalPath = $this->joinPaths($userPath, $proposalFolderName);

                        if (!is_dir($proposalPath)) {
                            mkdir($proposalPath, 0755, true);
                            $backupStats['proposal_folders_created']++;
                        }

                        // Copy proposal files (excluding supporting documents)
                        $copiedCount = $this->copyProposalFiles($proposal, $proposalPath, $existingFiles, $backupStats);
                        $backupStats['files_copied'] += $copiedCount;
                        if ($copiedCount === 0) {
                            $backupStats['proposals_without_files']++;
                        }
                        $backupStats['backed_up']++;
                    }
                } catch (Exception $e) {
                    $backupStats['errors'][] = "User {$userId}: " . $e->getMessage();
                    Log::error("Backup error for user {$userId}", ['error' => $e->getMessage()]);
                }
            }

            return $this->successResponse('Backup completed successfully', $backupStats);
        } catch (Exception $e) {
            Log::error('Backup service error', ['error' => $e->getMessage()]);
            return $this->errorResponse('Backup failed: ' . $e->getMessage());
        }
    }

    /**
     * Copy proposal files to backup location, excluding supporting documents
     * 
     * @param Proposal $proposal
     * @param string $proposalPath
     * @param array $existingFiles File names already present in the destination (for duplicate avoidance)
     * @param array $backupStats Stats tracker passed by reference
     * @return int Number of files copied
     */
    private function copyProposalFiles(Proposal $proposal, string $proposalPath, array $existingFiles, array &$backupStats): int
    {
        $copiedCount = 0;
        $files = $proposal->files()
            ->where(function($q) {
                $q->whereNull('fileType')->orWhereNotIn('fileType', self::EXCLUDED_TYPES);
            })
            ->get();

        if ($files->isEmpty()) {
            // No files attached to this proposal
            return 0;
        }

        foreach ($files as $file) {
            try {
                // Files are stored on the 'public' disk; resolve the absolute path
                $sourcePath = Storage::disk('public')->path($file->filePath);

                if (file_exists($sourcePath)) {
                    $fileName = basename($file->filePath);
                    $destinationPath = $this->joinPaths($proposalPath, $fileName);

                    // Skip if destination already has this file when scanning for duplicates
                    if (in_array($fileName, $existingFiles, true) || file_exists($destinationPath)) {
                        $backupStats['files_skipped_duplicates']++;
                        continue;
                    }

                    // Copy file
                    if (copy($sourcePath, $destinationPath)) {
                        $copiedCount++;
                        // Track file types encountered
                        $type = $file->fileType ?? 'unknown';
                        $this->fileTypeCount[$type] = ($this->fileTypeCount[$type] ?? 0) + 1;
                    }
                } else {
                    $this->missingFileCount++;
                }
            } catch (Exception $e) {
                Log::warning("Could not copy file {$file->fileID}", ['error' => $e->getMessage()]);
            }
        }

        return $copiedCount;
    }

    private int $missingFileCount = 0;
    private array $fileTypeCount = [];

    private function incrementMissingFile(): void
    {
        $this->missingFileCount++;
    }

    private function incrementFileTypeCount(string $type): void
    {
        $this->fileTypeCount[$type] = ($this->fileTypeCount[$type] ?? 0) + 1;
    }

    /**
     * Scan existing backups to identify user and proposal combinations
     * 
     * @param string $backupPath
     * @return array Array of existing backups in format [userId_proposalId => true]
     */
    public function scanExistingBackups(string $backupPath): array
    {
        $existing = [];

        if (!is_dir($backupPath)) {
            return $existing;
        }

        $userFolders = array_diff(scandir($backupPath), ['.', '..']);

        foreach ($userFolders as $userFolder) {
            $userPath = $this->joinPaths($backupPath, $userFolder);

            if (!is_dir($userPath)) {
                continue;
            }

            // Extract userId from folder name (format: userId_FirstName_LastName)
            $parts = explode('_', $userFolder);
            if (count($parts) < 2) {
                continue;
            }

            $userId = (int) $parts[0];
            $proposalFolders = array_diff(scandir($userPath), ['.', '..']);

            foreach ($proposalFolders as $proposalFolder) {
                $proposalPath = $this->joinPaths($userPath, $proposalFolder);

                if (!is_dir($proposalPath)) {
                    continue;
                }

                // Extract proposalID from folder name (format: proposalID_customProposalId)
                $proposalParts = explode('_', $proposalFolder);
                if (count($proposalParts) >= 1) {
                    $proposalId = (int) $proposalParts[0];

                    // Record existing files under this proposal to skip duplicates
                    $files = array_values(array_filter(
                        scandir($proposalPath) ?: [],
                        fn($f) => $f !== '.' && $f !== '..' && !is_dir($this->joinPaths($proposalPath, $f))
                    ));

                    $existing["{$userId}_{$proposalId}"] = $files;
                }
            }
        }

        return $existing;
    }

    /**
     * Generate user folder name
     * 
     * @param User $user
     * @return string
     */
    private function generateUserFolderName(User $user): string
    {
        $firstName = preg_replace('/[^a-zA-Z0-9]/', '', $user->firstName ?? 'Unknown');
        $lastName = preg_replace('/[^a-zA-Z0-9]/', '', $user->lastName ?? '');
        return "{$user->userID}_{$firstName}_{$lastName}";
    }

    /**
     * Generate proposal folder name
     * 
     * @param Proposal $proposal
     * @return string
     */
    private function generateProposalFolderName(Proposal $proposal): string
    {
        $customId = preg_replace('/[^a-zA-Z0-9]/', '', $proposal->custom_proposal_id ?? 'Proposal');
        $title = preg_replace('/[^a-zA-Z0-9]/', '', substr($proposal->researchTitle ?? 'Untitled', 0, 30));
        return "{$proposal->proposalID}_{$customId}_{$title}";
    }

    /**
     * Validate backup path
     * 
     * @param string $path
     * @return bool
     */
    private function validateBackupPath(string $path): bool
    {
        if (empty($path)) {
            return false;
        }

        $parentDir = dirname($path);
        return is_writable($parentDir) || is_writable($path);
    }

    /**
     * Join path components
     * 
     * @param string $basePath
     * @param string $append
     * @return string
     */
    private function joinPaths(string $basePath, string $append): string
    {
        $basePath = rtrim($basePath, DIRECTORY_SEPARATOR);
        $append = ltrim($append, DIRECTORY_SEPARATOR);
        return $basePath . DIRECTORY_SEPARATOR . $append;
    }

    /**
     * Format success response
     * 
     * @param string $message
     * @param array $data
     * @return array
     */
    private function successResponse(string $message, array $data = []): array
    {
        // Attach diagnostics for visibility in API response
        $data['files_missing_on_disk'] = $this->missingFileCount;
        $data['file_types_found'] = $this->fileTypeCount;

        return [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];
    }

    /**
     * Format error response
     * 
     * @param string $message
     * @return array
     */
    private function errorResponse(string $message): array
    {
        return [
            'success' => false,
            'message' => $message,
            'data' => [],
        ];
    }
}
