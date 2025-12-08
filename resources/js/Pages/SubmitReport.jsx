import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import RoleBasedLayout from "../Components/Layouts/RoleBasedLayout";
import AppLayout from "../Components/Layouts/AppLayout";
import Breadcrumbs from "../Components/Breadcrumbs";
import MultiFileUpload from "../Components/MultiFileUpload";
import { useUploadSettings } from "../hooks/useUploadSettings";
import apiService from "../services/api";

const SubmitReport = () => {
    const { user } = useAuth();
    const { props } = usePage();
    const currentUser = user || props?.auth?.user;
    
    const { maxFileSizeMB, loading: settingsLoading } = useUploadSettings();
    
    const [searchQuery, setSearchQuery] = useState("");
    const [proposals, setProposals] = useState([]);
    const [filteredProposals, setFilteredProposals] = useState([]);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [reportFiles, setReportFiles] = useState([]);
    const [description, setDescription] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Fetch user's proposals
    useEffect(() => {
        const fetchProposals = async () => {
            if (!currentUser) return;
            
            setIsLoading(true);
            try {
                const response = await apiService.get("/proposals");
                if (response.success && Array.isArray(response.data)) {
                    // Filter to only proposals with 100% progress (fully endorsed)
                    const fullyEndorsed = response.data.filter((p) => {
                        // Check if has both CM and RDD endorsements
                        const hasCmEndorsement = Array.isArray(p.endorsements) &&
                            p.endorsements.some(
                                (e) =>
                                    e.endorser?.role?.userRole === "CM" &&
                                    e.endorsementStatus === "approved"
                            );
                        const hasRddEndorsement = Array.isArray(p.endorsements) &&
                            p.endorsements.some(
                                (e) =>
                                    e.endorser?.role?.userRole === "RDD" &&
                                    e.endorsementStatus === "approved"
                            );
                        return hasCmEndorsement && hasRddEndorsement;
                    });
                    setProposals(fullyEndorsed);
                    setFilteredProposals(fullyEndorsed);
                }
            } catch (err) {
                console.error("Failed to fetch proposals:", err);
                setError("Failed to load proposals");
            } finally {
                setIsLoading(false);
            }
        };

        fetchProposals();
    }, [currentUser]);

    // Filter proposals based on search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProposals(proposals);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = proposals.filter(
            (p) =>
                p.custom_proposal_id?.toLowerCase().includes(query) ||
                p.researchTitle?.toLowerCase().includes(query) ||
                p.proposalID?.toString().includes(query)
        );
        setFilteredProposals(filtered);
    }, [searchQuery, proposals]);

    const handleFileSelect = (files) => {
        // MultiFileUpload sends an array of File objects
        setReportFiles(files);
    };

    const handleProposalSelect = (proposal) => {
        setSelectedProposal(proposal);
        setShowDropdown(false);
        setSearchQuery(
            `${proposal.custom_proposal_id || proposal.proposalID} - ${proposal.researchTitle}`
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!selectedProposal) {
            setError("Please select a proposal");
            return;
        }

        if (!reportFiles || reportFiles.length === 0) {
            setError("Please upload at least one report file");
            return;
        }

        if (!description.trim()) {
            setError("Please add a description");
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("proposalID", selectedProposal.proposalID);
            formData.append("reportType", "General");
            formData.append("reportPeriod", "N/A");
            formData.append("progressPercentage", 0);
            formData.append("achievements", description);
            formData.append("nextMilestone", "N/A");
            if (additionalNotes) formData.append("additionalNotes", additionalNotes);
            reportFiles.forEach((file) => {
                formData.append("files[]", file);
            });

            const response = await apiService.post("/progress-reports", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    // Stay on the submit report page so proponents can submit another report
                    router.visit(window.location.pathname);
                }, 2000);
            } else {
                setError(response.message || "Failed to submit report");
            }
        } catch (err) {
            console.error("Error submitting report:", err);
            setError(err.message || "Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex justify-center">
                <div className="max-w-4xl w-full">
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-8 h-8 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Report Submitted Successfully!
                        </h1>
                        <p className="text-gray-600 mb-4">
                            Your progress report has been submitted.
                        </p>
                        <p className="text-sm text-gray-500">
                            Redirecting to tracker page...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center">
            <div className="max-w-4xl w-full">
                <div className="mb-4">
                    <Breadcrumbs
                        items={[{ label: "Submit Report", href: null }]}
                    />
                </div>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Submit Progress Report
                    </h1>
                    <p className="text-gray-600">
                        Submit a progress report for your approved proposal
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-red-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Error
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-lg shadow-md p-8"
                >
                    {/* Search Proposal */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Proposal <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                placeholder="Search by Proposal ID or Title..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            {showDropdown && filteredProposals.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredProposals.map((proposal) => (
                                        <button
                                            key={proposal.proposalID}
                                            type="button"
                                            onClick={() => handleProposalSelect(proposal)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="font-medium text-gray-900">
                                                {proposal.custom_proposal_id || proposal.proposalID}
                                            </div>
                                            <div className="text-sm text-gray-600 truncate">
                                                {proposal.researchTitle}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedProposal && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    <strong>Selected:</strong> {selectedProposal.custom_proposal_id || selectedProposal.proposalID} - {selectedProposal.researchTitle}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Upload Report File */}
                    {/* Description */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Describe the report details..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Additional Notes */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            rows={3}
                            placeholder="Any additional information..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Upload Report Files */}
                    <div className="mb-8">
                        <MultiFileUpload
                            label="Upload Report Files"
                            description="Attach your report documents."
                            files={reportFiles}
                            onChange={handleFileSelect}
                            maxFiles={10}
                            maxSizeMB={maxFileSizeMB}
                            accept={[".pdf", ".doc", ".docx"]}
                        />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => router.visit("/proponent/tracker")}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {isSubmitting ? "Submitting..." : "Submit Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

SubmitReport.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Proponent">
            {page}
        </RoleBasedLayout>
    </AppLayout>
);

export default SubmitReport;
