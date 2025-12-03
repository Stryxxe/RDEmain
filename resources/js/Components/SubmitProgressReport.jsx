import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePage } from "@inertiajs/react";
import { useRouteParams } from "./RoleBased/InertiaRoleRouter";
import { BiUpload, BiFile, BiCheck, BiX } from "react-icons/bi";
import axios from "axios";

// Use window.axios which has session-based auth configured
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const SubmitProgressReport = ({ onSuccess, proposalID: propProposalID }) => {
    const { user: authUser } = useAuth();
    const { props } = usePage();
    const routeParams = useRouteParams();
    // Get proposalID from props, route params, or query string
    const proposalID = propProposalID || routeParams.proposalID || props?.proposalID || 
        (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('proposalID') : null);
    // Get user from Inertia props (more reliable than context on initial load)
    const user = authUser || props?.auth?.user;
    const [error, setError] = useState(null);
    const [description, setDescription] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleFileUpload = (files) => {
        setUploadedFiles((prev) => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!proposalID) {
            setError("Project ID is required");
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
            const proposalId = typeof proposalID === 'string' ? parseInt(proposalID) : proposalID;

            if (isNaN(proposalId)) {
                setError("Invalid project ID");
                setIsSubmitting(false);
                return;
            }

            // Prepare form data
            const submitData = new FormData();
            submitData.append("proposalID", proposalId);
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

            const response = await axiosInstance.post(
                "/progress-reports",
                submitData,
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "multipart/form-data",
                    },
                    withCredentials: true,
                }
            );

            if (response.data.success) {
                setSubmitSuccess(true);
                // Reset form
                setDescription("");
                setUploadedFiles([]);

                // Call onSuccess callback if provided
                if (onSuccess) {
                    onSuccess(response.data.data);
                } else {
                    // If no callback, refresh the page after a short delay to show new report
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }

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
                        disabled={isSubmitting}
                    />
                </div>

                {/* File Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Document <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <BiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="text-sm text-gray-600 mb-4">
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer"
                            >
                                <span className="font-medium text-red-600 hover:text-red-500">
                                    Click to upload
                                </span>{" "}
                                or drag and drop
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files);
                                    handleFileUpload(files);
                                }}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                disabled={isSubmitting}
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX files up to
                            10MB each
                        </p>
                    </div>

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
                        disabled={isSubmitting}
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

