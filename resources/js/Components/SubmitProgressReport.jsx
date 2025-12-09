import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePage } from "@inertiajs/react";
import { useRouteParams } from "./RoleBased/InertiaRoleRouter";
import { BiUpload, BiFile, BiCheck, BiX } from "react-icons/bi";
import axios from "axios";

// Create axios instance with proper configuration
const createAxiosInstance = () => {
    if (window.axios) {
        return window.axios;
    }
    
    // Fallback: create new instance if window.axios not available
    const instance = axios.create({
        baseURL: `${window.location.origin}/api`,
        withCredentials: true,
    });
    return instance;
};

const SubmitProgressReport = ({ onSuccess, proposalID: propProposalID, redirectUrl }) => {
    const { user: authUser } = useAuth();
    const { props } = usePage();
    const routeParams = useRouteParams();
    // Get proposalID from props, route params, or query string
    const initialProposalId = propProposalID || routeParams.proposalID || props?.proposalID || 
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('proposalID') : null);
    // Get user from Inertia props (more reliable than context on initial load)
    const user = authUser || props?.auth?.user;
    const [error, setError] = useState(null);
    const [resolvedProposalID, setResolvedProposalID] = useState(initialProposalId ? Number(initialProposalId) : null);
    const [proposalLookupLoading, setProposalLookupLoading] = useState(false);
    const [description, setDescription] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [uploadSettings, setUploadSettings] = useState({
        maxFileSizeMB: 10,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
        maxFiles: 10
    });
    const [settingsLoading, setSettingsLoading] = useState(true);

    // Fallback: auto-pick a proposal when none provided (for CM submit page without input)
    useEffect(() => {
        const loadFallbackProposal = async () => {
            // Don't auto-load for CM users - they can submit without a proposal
            const isCMUser = user?.role?.roleName === 'Center Manager' || 
                             (user?.departmentID || user?.researchCenterID);
            
            if (resolvedProposalID || proposalLookupLoading || isCMUser) return;
            
            setProposalLookupLoading(true);
            try {
                const axiosInstance = createAxiosInstance();
                const resp = await axiosInstance.get("/proposals", {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
                const proposals = resp.data?.data || [];
                // Prefer proposals within the same research center, else first available
                const preferred = proposals.find((p) => p.user?.researchCenterID && user?.researchCenterID && p.user.researchCenterID === user.researchCenterID);
                const chosen = preferred || proposals[0];
                if (chosen?.proposalID) {
                    setResolvedProposalID(chosen.proposalID);
                }
            } catch (err) {
                console.error("Unable to auto-select a proposal for submission", err);
            } finally {
                setProposalLookupLoading(false);
            }
        };

        loadFallbackProposal();
    }, [resolvedProposalID, proposalLookupLoading, user]);

    // Fetch upload settings from admin settings
    useEffect(() => {
        const fetchUploadSettings = async () => {
            try {
                const axiosInstance = createAxiosInstance();
                const response = await axiosInstance.get("/upload-settings");
                
                if (response.data?.maxFileSizeMB) {
                    setUploadSettings({
                        maxFileSizeMB: response.data.maxFileSizeMB || 10,
                        allowedFileTypes: response.data.allowedFileTypes || ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
                        maxFiles: 10
                    });
                }
            } catch (err) {
                console.error("Failed to fetch upload settings, using defaults:", err);
                // Use default settings on error
            } finally {
                setSettingsLoading(false);
            }
        };
        
        fetchUploadSettings();
    }, []);

    const validateFile = (file) => {
        const maxSizeBytes = uploadSettings.maxFileSizeMB * 1024 * 1024;
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!uploadSettings.allowedFileTypes.includes(fileExtension)) {
            return `"${file.name}" is not an allowed file type. Allowed types: ${uploadSettings.allowedFileTypes.map(t => t.toUpperCase()).join(', ')}`;
        }
        
        if (file.size > maxSizeBytes) {
            return `"${file.name}" exceeds the ${uploadSettings.maxFileSizeMB}MB limit.`;
        }
        
        return null;
    };

    const handleFileUpload = (files) => {
        const newFiles = Array.from(files);
        const errors = [];
        const validFiles = [];

        // Check if we've reached max files
        if (uploadedFiles.length + newFiles.length > uploadSettings.maxFiles) {
            setError(`Maximum of ${uploadSettings.maxFiles} files allowed. You can upload ${uploadSettings.maxFiles - uploadedFiles.length} more.`);
            return;
        }

        newFiles.forEach((file) => {
            const validationError = validateFile(file);
            if (validationError) {
                errors.push(validationError);
            } else {
                validFiles.push(file);
            }
        });

        if (errors.length > 0) {
            setError(errors[0]); // Show first error
            return;
        }

        if (validFiles.length > 0) {
            setUploadedFiles((prev) => [...prev, ...validFiles]);
            setError(null);
        }
    };

    const removeFile = (index) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if user is a CM (has departmentID and/or researchCenterID)
        const isCMUser = user?.role?.roleName === 'Center Manager' || 
                         (user?.departmentID || user?.researchCenterID);

        // CM users don't need a proposalID, but other users do
        if (!resolvedProposalID && !isCMUser) {
            setError("Project ID is required. Please navigate from a project or include ?proposalID= in the URL.");
            return;
        }

        if (!description.trim()) {
            setError("Please provide a description");
            return;
        }

        if (uploadedFiles.length === 0) {
            setError("Please upload at least one document");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Validate proposalID if provided
            if (resolvedProposalID && isNaN(resolvedProposalID)) {
                setError("Invalid project ID");
                setIsSubmitting(false);
                return;
            }

            // Prepare form data
            const submitData = new FormData();
            
            // Only add proposalID if it's available
            if (resolvedProposalID) {
                submitData.append("proposalID", resolvedProposalID);
            }
            
            submitData.append("reportType", "Interim");
            submitData.append("reportPeriod", new Date().toLocaleDateString());
            submitData.append("progressPercentage", 0);
            submitData.append("achievements", description);
            submitData.append("challenges", "");
            submitData.append("nextMilestone", "Ongoing");
            submitData.append("additionalNotes", "");

            // Add files
            uploadedFiles.forEach((file) => {
                submitData.append("files[]", file);
            });

            const axiosInstance = createAxiosInstance();
            const response = await axiosInstance.post(
                "/progress-reports",
                submitData,
                {
                    headers: {
                        Accept: "application/json",
                    },
                    withCredentials: true,
                }
            );

            if (response.data.success) {
                setSubmitSuccess(true);
                // Reset form
                setDescription("");
                setUploadedFiles([]);

                // Redirect or refresh based on provided URL or callback
                setTimeout(() => {
                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else if (onSuccess) {
                        onSuccess(response.data.data);
                    } else {
                        window.location.reload();
                    }
                }, 2000);

                // Hide success message after 5 seconds
                setTimeout(() => {
                    setSubmitSuccess(false);
                }, 5000);
            } else {
                setError(response.data.message || "Failed to submit report");
            }
        } catch (err) {
            console.error("Error submitting report:", err);
            setError(
                err.response?.data?.message ||
                    "Error submitting report. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {submitSuccess && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                        <BiCheck className="text-green-600 text-xl mr-2" />
                        <span>Progress report submitted successfully!</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">

                {/* Description */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter a description of the progress report..."
                        required
                        disabled={isSubmitting || settingsLoading}
                    />
                </div>

                {/* File Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Document <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={(e) => {
                            if (e.target.files) {
                                handleFileUpload(e.target.files);
                            }
                        }}
                        className="hidden"
                        accept={`.${uploadSettings.allowedFileTypes.join(',.')}`}
                        disabled={isSubmitting || settingsLoading || uploadedFiles.length >= uploadSettings.maxFiles}
                    />
                    <label
                        htmlFor="file-upload"
                        className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer?.files) {
                                handleFileUpload(e.dataTransfer.files);
                            }
                        }}
                    >
                        <BiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="text-sm text-gray-600 mb-4">
                            <span className="font-medium text-red-600 hover:text-red-500">
                                Click to upload
                            </span>{" "}
                            or drag and drop
                        </div>
                        <p className="text-xs text-gray-500">
                            {uploadSettings.allowedFileTypes.map(t => t.toUpperCase()).join(', ')} files up to {uploadSettings.maxFileSizeMB}MB each • Max {uploadSettings.maxFiles} files
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            {uploadedFiles.length}/{uploadSettings.maxFiles} files uploaded
                        </p>
                    </label>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Uploaded Files:
                            </h4>
                            <div className="space-y-2">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                    >
                                        <div className="flex items-center">
                                            <BiFile className="h-5 w-5 text-gray-400 mr-2" />
                                            <span className="text-sm text-gray-700">
                                                {file.name}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                (
                                                {(
                                                    file.size /
                                                    1024 /
                                                    1024
                                                ).toFixed(2)}{" "}
                                                MB)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-red-500 hover:text-red-700"
                                            disabled={isSubmitting}
                                        >
                                            <BiX className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting || settingsLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <BiCheck className="text-lg" />
                                Submit Report
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubmitProgressReport;

