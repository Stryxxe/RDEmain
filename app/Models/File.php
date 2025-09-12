<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class File extends Model
{
    use HasFactory;

    protected $table = 'files';
    protected $primaryKey = 'fileID';
    public $incrementing = true;
    public $timestamps = true;

    protected $fillable = [
        'proposalID',
        'fileName',
        'filePath',
        'fileType',
        'fileSize',
        'uploadedAt'
    ];

    protected $casts = [
        'uploadedAt' => 'datetime',
        'fileSize' => 'integer'
    ];

    /**
     * Get the proposal that owns the file
     */
    public function proposal(): BelongsTo
    {
        return $this->belongsTo(Proposal::class, 'proposalID', 'proposalID');
    }

    /**
     * Get formatted file size
     */
    public function getFormattedSizeAttribute()
    {
        $bytes = $this->fileSize;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get file extension
     */
    public function getExtensionAttribute()
    {
        return pathinfo($this->fileName, PATHINFO_EXTENSION);
    }

    /**
     * Check if file is an image
     */
    public function getIsImageAttribute()
    {
        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        return in_array(strtolower($this->extension), $imageExtensions);
    }

    /**
     * Check if file is a document
     */
    public function getIsDocumentAttribute()
    {
        $documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
        return in_array(strtolower($this->extension), $documentExtensions);
    }
}
