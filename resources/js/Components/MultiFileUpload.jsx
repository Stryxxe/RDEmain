import React, { useRef, useState } from "react";
import { Upload, Paperclip, X, AlertTriangle } from "lucide-react";
import { useUploadSettings } from "../hooks/useUploadSettings";

const MultiFileUpload = ({
    label = "Supporting Documents",
    description = "Attach supplementary files such as SETI Scorecard, GAD Certificate, Matrix of Compliance, and other approvals.",
    files = [],
    onChange,
    accept, // Optional override
    maxSizeMB, // Optional override
    maxFiles = 10,
    existingFiles = [],
    onRemoveExisting,
}) => {
    const uploadSettings = useUploadSettings();
    
    // Use props if provided, otherwise use settings from backend
    const effectiveAccept = accept || uploadSettings.allowedFileTypes.map(type => `.${type}`);
    const effectiveMaxSizeMB = maxSizeMB || uploadSettings.maxFileSizeMB;
    
    const [isDragOver, setIsDragOver] = useState(false);
    const [feedback, setFeedback] = useState("");
    const inputRef = useRef(null);

    const existing = Array.isArray(existingFiles) ? existingFiles : [];
    const totalFiles = (Array.isArray(files) ? files.length : 0) + existing.length;

    const bytesLimit = effectiveMaxSizeMB * 1024 * 1024;

    const getFileKey = (file) =>
        [file.name, file.size, file.lastModified]
            .filter(Boolean)
            .join("-");

    const isValidType = (file) => {
        const extension = "." + file.name.split(".").pop().toLowerCase();
        return effectiveAccept.includes(extension);
    };

    const validateFile = (file) => {
        if (!isValidType(file)) {
            return `"${file.name}" is not an accepted format. Only ${effectiveAccept
                .map((type) => type.replace(".", "").toUpperCase())
                .join(", ")} are allowed.`;
        }
        if (file.size > bytesLimit) {
            return `"${file.name}" exceeds the ${effectiveMaxSizeMB}MB limit.`;
        }
        if (file.size === 0) {
            return `“${file.name}” appears to be empty.`;
        }
        return null;
    };

    const addFiles = (fileList) => {
        if (!onChange) return;

        const currentFiles = Array.isArray(files) ? [...files] : [];
        const incomingFiles = Array.from(fileList);
        const validFiles = [];
        const errors = [];

        incomingFiles.forEach((file) => {
            // Check if we've reached the limit
            if (existing.length + currentFiles.length + validFiles.length >= maxFiles) {
                errors.push(`Maximum of ${maxFiles} files reached.`);
                return;
            }

            // Validate file type and size
            const error = validateFile(file);
            if (error) {
                errors.push(error);
                return;
            }

            // Check for duplicates
            if (
                currentFiles.some((existing) => getFileKey(existing) === getFileKey(file)) ||
                validFiles.some((existing) => getFileKey(existing) === getFileKey(file))
            ) {
                errors.push(`"${file.name}" is a duplicate.`);
                return;
            }

            validFiles.push(file);
        });

        if (validFiles.length) {
            onChange([...currentFiles, ...validFiles]);
            setFeedback("");
        } else if (errors.length) {
            // Show only the first error to avoid cluttering
            setFeedback(errors[0]);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragOver(false);
        if (event.dataTransfer?.files?.length) {
            addFiles(event.dataTransfer.files);
        }
    };

    const handleInputChange = (event) => {
        if (event.target.files?.length) {
            addFiles(event.target.files);
        }
        // Reset input so same file can be selected again if removed
        event.target.value = "";
    };

    const handleBrowseClick = () => {
        inputRef.current?.click();
    };

    const handleRemove = (index) => {
        if (!onChange) return;
        const nextFiles = files.filter((_, idx) => idx !== index);
        onChange(nextFiles);
    };

    const handleRemoveExisting = (index) => {
        onRemoveExisting?.(index);
    };

    const closeFeedback = () => setFeedback("");

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <p className="text-base font-semibold text-gray-900">
                        {label}
                    </p>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
                <span className="text-sm text-gray-500">
                    {totalFiles}/{maxFiles} files
                </span>
            </div>

            <div
                className={`border-2 border-dashed rounded-2xl p-8 transition-colors duration-200 cursor-pointer ${
                    isDragOver
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 bg-gray-50 hover:border-red-400"
                }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                }}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
            >
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <Upload className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-sm text-gray-600">
                        <span className="text-red-600 font-semibold">
                            Click to browse
                        </span>{" "}
                        or drag and drop your documents
                    </p>
                    <p className="text-xs text-gray-500">
                        Accepted formats:{" "}
                        {effectiveAccept
                            .map((ext) => ext.replace(".", "").toUpperCase())
                            .join(", ")}{" "}
                        • Max {effectiveMaxSizeMB}MB per file
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={effectiveAccept.join(",")}
                        className="hidden"
                        onChange={handleInputChange}
                    />
                </div>
            </div>

            {feedback && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={closeFeedback}
                >
                    <div
                        className="w-full max-w-md rounded-lg bg-white shadow-xl border border-red-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 border-b border-red-100 px-5 py-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-red-700">Upload issue</p>
                                <p className="text-xs text-gray-500">
                                    Max {effectiveMaxSizeMB}MB per file · Allowed: {effectiveAccept.map((ext) => ext.replace('.', '').toUpperCase()).join(', ')}
                                </p>
                            </div>
                        </div>
                        <div className="px-5 py-4 text-sm text-gray-800 space-y-2">
                            <p>{feedback}</p>
                            <p className="text-xs text-gray-600">Try another file within the limits, then upload again.</p>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
                            <button
                                type="button"
                                onClick={closeFeedback}
                                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {existing.length > 0 && (
                <div className="space-y-3">
                    {existing.map((file, index) => (
                        <div
                            key={`${file.filePath || file.fileName || 'existing'}-${index}`}
                            className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-red-50 p-2 rounded-lg">
                                    <Paperclip className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {file.fileName || file.fileType || 'Existing file'}
                                    </p>
                                    {file.fileSize && (
                                        <p className="text-xs text-gray-500">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                    )}
                                    {file.filePath && (
                                        <a
                                            href={`/storage/${file.filePath}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                                        >
                                            <Paperclip className="w-3 h-3" />
                                            Open current file
                                        </a>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveExisting(index);
                                }}
                                className="text-sm text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
                            >
                                <X className="w-4 h-4" />
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {files.length > 0 && (
                <ul className="space-y-3">
                    {files.map((file, index) => (
                        <li
                            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                            className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-red-50 p-2 rounded-lg">
                                    <Paperclip className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                        MB
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="text-sm text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
                            >
                                <X className="w-4 h-4" />
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MultiFileUpload;

