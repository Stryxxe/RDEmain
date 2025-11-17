import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import axios from "axios";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const CMSubmitReport = () => {
    const { user } = useAuth();
    const [proposals, setProposals] = useState([]);
    const [loadingProposals, setLoadingProposals] = useState(true);
    const [formData, setFormData] = useState({
        proposalID: "",
        reportType: "",
        title: "",
        description: "",
        attachments: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch proposals that can have reports submitted
    useEffect(() => {
        const fetchProposals = async () => {
            if (!user) return;

            try {
                setLoadingProposals(true);
                // Fetch proposals from the same department that have been endorsed/approved
                const response = await axiosInstance.get("/proposals", {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });

                if (response.data.success) {
                    // Filter proposals that are from the same department (for monitoring purposes)
                    // CMs can submit reports for any proposal in their department regardless of status
                    const filteredProposals = response.data.data.filter(
                        (proposal) => {
                            // Only show proposals from the same department
                            return (
                                proposal.user?.departmentID ===
                                user.departmentID
                            );
                        }
                    );
                    setProposals(filteredProposals);
                }
            } catch (error) {
                console.error("Error fetching proposals:", error);
            } finally {
                setLoadingProposals(false);
            }
        };

        if (user) {
            fetchProposals();
        }
    }, [user]);

    // Count words in text
    const countWords = (text) => {
        if (!text || !text.trim()) return 0;
        return text
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
    };

    const descriptionWordCount = countWords(formData.description);
    const maxWords = 250;

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Enforce word limit for description field
        if (name === "description") {
            const words = value
                .trim()
                .split(/\s+/)
                .filter((word) => word.length > 0);
            if (words.length > maxWords) {
                // Get the text up to the maxWords limit
                let limitedText = "";
                let wordCount = 0;
                const textParts = value.split(/\s+/);

                for (let i = 0; i < textParts.length; i++) {
                    if (textParts[i].trim().length > 0) {
                        if (wordCount >= maxWords) {
                            break;
                        }
                        wordCount++;
                    }
                    limitedText += (i > 0 ? " " : "") + textParts[i];
                }

                setFormData((prev) => ({
                    ...prev,
                    [name]: limitedText,
                }));
                return;
            }
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prev) => ({
            ...prev,
            attachments: [...prev.attachments, ...files],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.proposalID) {
            alert("Please select a project to submit a report for.");
            return;
        }

        // Validate word count
        if (descriptionWordCount > maxWords) {
            alert(
                `Description must not exceed ${maxWords} words. Please reduce your text.`
            );
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare form data for submission
            const submitData = new FormData();
            submitData.append("proposalID", formData.proposalID);
            submitData.append("reportType", formData.reportType || "Interim");
            submitData.append(
                "reportPeriod",
                formData.title || "Progress Report"
            );
            submitData.append("progressPercentage", 0); // Default, can be updated later
            submitData.append("achievements", formData.description || "");
            submitData.append("nextMilestone", "Ongoing");

            // Add attachments
            if (formData.attachments && formData.attachments.length > 0) {
                formData.attachments.forEach((file) => {
                    submitData.append("files[]", file);
                });
            }

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
                alert("Report submitted successfully!");
                setFormData({
                    proposalID: "",
                    reportType: "",
                    title: "",
                    description: "",
                    attachments: [],
                });
            } else {
                alert(
                    "Failed to submit report: " +
                        (response.data.message || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Unknown error";
            alert("Error submitting report: " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeAttachment = (index) => {
        setFormData((prev) => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Progress Report Submission
                    </h1>
                </div>

                {/* Important Notice */}
                <div className="bg-gray-100 border-l-4 border-blue-500 p-4 mb-8">
                    <h3 className="font-semibold text-gray-800 mb-2">
                        Important Notice
                    </h3>
                    <p className="text-gray-700 text-sm">
                        Fields marked with an asterisk (*) are mandatory and
                        must be filled out before submission.
                    </p>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    {/* Project Selection */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Select Project{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        {loadingProposals ? (
                            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                Loading projects...
                            </div>
                        ) : (
                            <select
                                value={formData.proposalID}
                                onChange={handleInputChange}
                                name="proposalID"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">-- Select a project --</option>
                                {proposals.map((proposal) => (
                                    <option
                                        key={proposal.proposalID}
                                        value={proposal.proposalID}
                                    >
                                        {proposal.researchTitle} (ID: PRO-
                                        {proposal.proposalID
                                            .toString()
                                            .padStart(6, "0")}
                                        )
                                    </option>
                                ))}
                            </select>
                        )}
                        {!loadingProposals && proposals.length === 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                                No projects found in your department.
                            </p>
                        )}
                    </div>

                    {/* Report Type */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Report Type
                        </label>
                        <select
                            value={formData.reportType}
                            onChange={handleInputChange}
                            name="reportType"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Interim">Interim</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annual">Annual</option>
                            <option value="Final">Final</option>
                        </select>
                    </div>

                    {/* File Upload Section */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Upload Monitoring and Evaluation Minutes{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                            <input
                                type="file"
                                onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx"
                                className="hidden"
                                id="file-upload"
                                required
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer"
                            >
                                <div className="space-y-2">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="text-gray-600">
                                        <span className="font-medium text-blue-600 hover:text-blue-500">
                                            Click to upload
                                        </span>
                                        <span className="text-gray-500">
                                            {" "}
                                            or drag and drop
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        PDF, DOC, DOCX up to 10MB
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Selected File Display */}
                        {formData.attachments.length > 0 && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-center">
                                    <svg
                                        className="w-5 h-5 text-green-500 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="text-sm text-green-700">
                                        Selected: {formData.attachments[0].name}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Additional Fields (Optional) */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Report Title
                        </label>
                        <input
                            type="text"
                            placeholder="Enter report title"
                            value={formData.title}
                            onChange={handleInputChange}
                            name="title"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 font-medium mb-2">
                            Description
                            <span className="text-xs font-normal text-gray-500 ml-2">
                                ({descriptionWordCount}/{maxWords} words)
                            </span>
                        </label>
                        <textarea
                            placeholder="Enter report description"
                            rows={4}
                            value={formData.description}
                            onChange={handleInputChange}
                            name="description"
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                                descriptionWordCount > maxWords
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            }`}
                        />
                        {descriptionWordCount > maxWords && (
                            <p className="text-xs text-red-500 mt-1">
                                Maximum {maxWords} words allowed. Please reduce
                                your text.
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.proposalID}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

CMSubmitReport.layout = (page) => (
    <RoleBasedLayout roleName="Center Manager">{page}</RoleBasedLayout>
);

export default CMSubmitReport;
