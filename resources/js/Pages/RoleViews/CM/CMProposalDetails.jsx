import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import PDFViewer from "../../../Components/PDFViewer";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { updateProposal } from "../../../services/proposalService";
import Breadcrumbs from "../../../Components/Breadcrumbs";

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const CMProposalDetails = ({ proposal, onBack, onEndorsed }) => {
    const { user } = useAuth();
    const { refreshAllNotifications } = useNotifications();
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [isEndorsing, setIsEndorsing] = useState(false);
    const [endorsementComments, setEndorsementComments] = useState("");
    const [showEndorsementModal, setShowEndorsementModal] = useState(false);
    const [isEndorsed, setIsEndorsed] = useState(false);
    const [endorsementData, setEndorsementData] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [revisionComments, setRevisionComments] = useState("");
    const [isSendingForRevision, setIsSendingForRevision] = useState(false);

    const [fullProposal, setFullProposal] = useState(proposal);

    // Fetch full proposal with files if not already loaded
    useEffect(() => {
        const fetchFullProposal = async () => {
            if (!proposal || !user) return;

            // CRITICAL: Always fetch the full proposal with force_refresh to ensure we get ALL files
            // including "Other Supporting Documents" (supporting_document type files)
            // The proposal passed from the list might not have all files loaded, especially
            // when coming from localStorage or the proposals index endpoint
            try {
                const response = await axiosInstance.get(
                    `/proposals/${proposal.proposalID || proposal.id}`,
                    {
                        headers: { Accept: "application/json" },
                        withCredentials: true,
                        params: { force_refresh: true },
                    }
                );

                if (response.data.success && response.data.data) {
                    const fetchedProposal = response.data.data;
                    setFullProposal(fetchedProposal);

                    // Debug logging to verify files are loaded
                    if (process.env.NODE_ENV === "development") {
                        console.log("Full proposal fetched with files:", {
                            proposal_id:
                                fetchedProposal.proposalID ||
                                fetchedProposal.id,
                            total_files: fetchedProposal.files?.length || 0,
                            file_types:
                                fetchedProposal.files?.map((f) => f.fileType) ||
                                [],
                            supporting_documents:
                                fetchedProposal.files?.filter(
                                    (f) => f.fileType === "supporting_document"
                                ) || [],
                        });
                    }
                } else {
                    // Fallback to original proposal if fetch fails
                    console.warn(
                        "Failed to fetch full proposal, using original data"
                    );
                    setFullProposal(proposal);
                }
            } catch (error) {
                // If fetch fails, use the original proposal but log the error
                console.error("Error fetching full proposal:", error);
                setFullProposal(proposal);
            }
        };

        if (proposal && user) {
            fetchFullProposal();
        }

        // Refresh proposal data every 30 seconds to catch updates
        const interval = setInterval(() => {
            if (proposal && user) {
                fetchFullProposal();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [proposal, user]);

    // Check if proposal has been endorsed by the current user
    useEffect(() => {
        const checkEndorsementStatus = async () => {
            if (!fullProposal || !user) return;

            try {
                const response = await axiosInstance.get(
                    `/endorsements/proposal/${
                        fullProposal.proposalID || fullProposal.id
                    }`,
                    {
                        headers: { Accept: "application/json" },
                        withCredentials: true,
                    }
                );

                if (
                    response.data.success &&
                    response.data.data &&
                    response.data.data.length > 0
                ) {
                    // Check if the current user has already endorsed this proposal
                    const userEndorsement = response.data.data.find(
                        (endorsement) =>
                            endorsement.endorserID === user.userID ||
                            endorsement.endorser?.userID === user.userID
                    );

                    if (userEndorsement) {
                        setIsEndorsed(true);
                        setEndorsementData(userEndorsement);
                    } else {
                        setIsEndorsed(false);
                        setEndorsementData(null);
                    }
                } else {
                    setIsEndorsed(false);
                    setEndorsementData(null);
                }
            } catch (error) {
                // Only log error if it's not a 401 (unauthorized)
                if (error.response?.status !== 401) {
                    console.error("Error checking endorsement status:", error);
                }
                setIsEndorsed(false);
                setEndorsementData(null);
            }
        };

        if (fullProposal && user) {
            checkEndorsementStatus();
        }
    }, [fullProposal, refreshKey, user]);

    // Force refresh function
    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    // Get the research paper PDF path from uploaded files
    const getResearchPaperPath = () => {
        if (fullProposal?.files && fullProposal.files.length > 0) {
            // Look specifically for research paper/concept paper file
            // IMPORTANT: Only check fileType, NOT filename keywords to avoid false positives
            const researchPaper = fullProposal.files.find((f) => {
                const fileType = f.fileType?.toLowerCase() || "";
                return fileType === "concept_paper" || fileType === "report";
            });

            if (researchPaper && researchPaper.filePath) {
                // Only return path if it's a PDF file
                const isPDF =
                    researchPaper.fileName?.toLowerCase().endsWith(".pdf") ||
                    researchPaper.filePath?.toLowerCase().endsWith(".pdf");
                if (isPDF) {
                    return `/storage/${researchPaper.filePath}`;
                }
            }
        }
        // Return null if no research paper found - don't show fallback
        return null;
    };

    const researchPaperPath = getResearchPaperPath();

    // Helper function to check if a file is a research proposal file
    // IMPORTANT: Only check fileType, NOT filename keywords to avoid false positives
    // Supporting documents with names like "research_support.pdf" should NOT be classified as research proposals
    const isResearchProposalFile = (file) => {
        if (!file) return false;
        const fileType = file.fileType?.toLowerCase() || "";
        // Only match specific file types that are research proposals
        // Do NOT use filename matching as it causes supporting documents to be misclassified
        return fileType === "concept_paper" || fileType === "report";
    };

    // Get attached documents dynamically from uploaded files
    const getAttachedDocuments = () => {
        if (
            !fullProposal?.files ||
            !Array.isArray(fullProposal.files) ||
            fullProposal.files.length === 0
        ) {
            return [];
        }

        // Map file types to display names
        const fileTypeMap = {
            report: "Research Paper/Concept Paper",
            concept_paper: "Research Paper/Concept Paper",
            seti_scorecard: "SETI Scorecard",
            gad_certificate: "GAD Checklist and Certificate",
            matrix_compliance: "Matrix of Compliance",
            supporting_document: "Supporting Document",
        };

        // Create document list from actual uploaded files
        const documents = fullProposal.files
            .filter((file) => file.filePath) // Only include files with valid paths
            .map((file) => {
                const fileType = file.fileType || "";
                const displayName =
                    fileTypeMap[fileType] || file.fileName || "Document";
                const pdfPath = `/storage/${file.filePath}`;

                return {
                    name: displayName,
                    fileName: file.fileName,
                    available: true,
                    pdfPath: pdfPath,
                    fileType: fileType,
                    fileSize: file.fileSize,
                };
            });

        // Debug logging to help identify issues with supporting documents
        if (process.env.NODE_ENV === "development") {
            const supportingDocs = documents.filter(
                (d) => d.fileType === "supporting_document"
            );
            if (supportingDocs.length > 0) {
                console.log("Supporting documents found:", {
                    count: supportingDocs.length,
                    files: supportingDocs.map((d) => ({
                        fileName: d.fileName,
                        fileType: d.fileType,
                    })),
                });
            }
        }

        return documents;
    };

    const attachedDocuments = getAttachedDocuments();

    const handleEndorse = () => {
        // Prevent opening modal if already endorsed
        if (isEndorsed) {
            alert("This proposal has already been endorsed by you.");
            return;
        }
        setShowEndorsementModal(true);
    };

    const handleEndorsementSubmit = async () => {
        // Prevent duplicate submissions
        if (isEndorsing) return;

        // Check if already endorsed before submitting
        if (isEndorsed) {
            await window.customAlert(
                "This proposal has already been endorsed by you."
            );
            setShowEndorsementModal(false);
            return;
        }

        try {
            setIsEndorsing(true);

            const endorsementData = {
                proposalID: fullProposal.proposalID || fullProposal.id,
                endorsementComments: endorsementComments,
                endorsementStatus: "approved",
            };

            const response = await axiosInstance.post(
                "/endorsements",
                endorsementData,
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    withCredentials: true,
                }
            );

            const responseData = response.data;

            if (responseData.success) {
                const proposalId = fullProposal.proposalID || fullProposal.id;
                const isFinalEndorsement =
                    responseData.is_final_endorsement === true;

                // Close the endorsement modal first
                setShowEndorsementModal(false);
                setEndorsementComments("");
                setIsEndorsed(true);
                setEndorsementData(responseData.data);

                // Immediately refresh notifications to show new notification
                refreshAllNotifications();

                // CRITICAL: Immediately notify parent to remove proposal from list
                // This ensures the proposal disappears from the current view instantly
                if (onEndorsed && proposalId) {
                    onEndorsed(proposalId);
                }

                if (isFinalEndorsement) {
                    // FINAL ENDORSEMENT: Proposal forwarded to RDD
                    // Clear any cached data
                    localStorage.removeItem("selectedProjectForEndorsement");

                    // Show success message
                    window.customAlert(
                        "",
                        responseData.message ||
                            "Proposal successfully forwarded to RDD! It will no longer appear in your views.",
                        3000
                    );

                    // CRITICAL: Force refresh all CM pages by redirecting to dashboard
                    // This ensures:
                    // 1. Proposal is removed from all CM views (Dashboard, Endorsement, For Revision)
                    // 2. Dashboard cards are updated
                    // 3. All data is fresh from backend
                    setTimeout(() => {
                        // Go back to list first if we have onBack callback (removes from current view)
                        if (onBack) {
                            onBack();
                        }

                        // Redirect to dashboard to refresh all data
                        // Using replace: true ensures browser history is clean
                        // preserveState: false ensures all data is fresh
                        router.visit("/cm/dashboard", {
                            replace: true,
                            preserveState: false, // Clear state to ensure fresh data
                        });
                    }, 1500);
                } else {
                    // First endorsement - show success and redirect to review-proposal page
                    window.customAlert("", "Endorsed Successfully!", 3000);

                    setTimeout(() => {
                        router.visit("/cm/review-proposal", {
                            replace: true,
                        });
                    }, 3500);
                }
            } else {
                await window.customAlert(
                    "Failed to endorse proposal: " +
                        (responseData.message || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error endorsing proposal:", error);

            // Extract error message from response
            let errorMessage = "Unknown error";

            if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                const data = error.response.data;

                if (status === 409) {
                    errorMessage =
                        data.message ||
                        "This proposal has already been endorsed by you.";
                } else if (status === 403) {
                    errorMessage =
                        data.message ||
                        "You do not have permission to endorse this proposal.";
                } else if (status === 404) {
                    errorMessage = data.message || "Proposal not found.";
                } else if (data && data.message) {
                    errorMessage = data.message;
                } else if (data && data.errors) {
                    // Validation errors
                    const errorMessages = Object.values(data.errors).flat();
                    errorMessage = errorMessages.join(", ");
                } else {
                    errorMessage = `Server error (${status})`;
                }
            } else if (error.request) {
                errorMessage = "Network error. Please check your connection.";
            } else {
                errorMessage = error.message || "Unknown error occurred";
            }

            await window.customAlert(
                "Error endorsing proposal: " + errorMessage
            );

            // If it's a 409 conflict, refresh the endorsement status
            if (error.response?.status === 409) {
                handleRefresh();
            }
        } finally {
            setIsEndorsing(false);
        }
    };

    const handleEndorsementCancel = () => {
        setShowEndorsementModal(false);
        setEndorsementComments("");
    };

    const handleForRevision = () => {
        setShowRevisionModal(true);
    };

    const handleRevisionCancel = () => {
        setShowRevisionModal(false);
        setRevisionComments("");
    };

    const handleRevisionCommentsChange = (e) => {
        setRevisionComments(e.target.value);
    };

    const handleSendForRevision = async () => {
        if (isSendingForRevision) return;

        try {
            setIsSendingForRevision(true);

            const updateData = {
                statusID: 4, // Revisions Required status
                revisionComments: revisionComments,
            };

            const response = await updateProposal(
                fullProposal.proposalID || fullProposal.id,
                updateData
            );

            if (response && response.success) {
                setShowRevisionModal(false);
                setRevisionComments("");

                await window.customAlert(
                    "",
                    "Proposal sent for revision successfully!",
                    3000
                );

                setTimeout(() => {
                    router.visit("/cm/review-proposal", { replace: true });
                }, 3500);
            } else {
                await window.customAlert(
                    "Failed to send proposal for revision: " +
                        (response?.message || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error sending proposal for revision:", error);
            let errorMessage = "Unknown error";

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            await window.customAlert(
                "Error sending proposal for revision: " + errorMessage
            );
        } finally {
            setIsSendingForRevision(false);
        }
    };

    const handleDocumentClick = (document) => {
        if (document && document.pdfPath) {
            // Check if file is PDF by extension
            const isPDF =
                document.fileName?.toLowerCase().endsWith(".pdf") ||
                document.pdfPath?.toLowerCase().endsWith(".pdf");

            if (isPDF) {
                // Open PDF in modal
                setSelectedDocument(document);
                setShowDocumentModal(true);
            } else {
                // For non-PDF files, open in new tab (browser will handle download)
                window.open(document.pdfPath, "_blank", "noopener");
            }
        }
    };

    const handleCloseModal = () => {
        setShowDocumentModal(false);
        setSelectedDocument(null);
    };

    // Document Modal Component
    const DocumentModal = () => {
        if (!selectedDocument) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-fadeIn">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {selectedDocument.name}
                                </h2>
                                {selectedDocument.fileName && (
                                    <p className="text-sm text-gray-600">
                                        {selectedDocument.fileName}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleCloseModal}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Modal Content - All documents show as PDFs */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] bg-gray-50">
                        <div className="h-full bg-white rounded-lg shadow-inner p-2">
                            {selectedDocument.pdfPath ? (
                                <PDFViewer
                                    pdfPath={selectedDocument.pdfPath}
                                    title={
                                        selectedDocument.name ||
                                        selectedDocument.fileName ||
                                        "Document"
                                    }
                                />
                            ) : (
                                <div className="text-center py-16 text-gray-500">
                                    <svg
                                        className="w-16 h-16 text-gray-400 mx-auto mb-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <p className="font-medium text-lg">
                                        Document path not available.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end items-center space-x-3 p-6 border-t border-gray-200 bg-gradient-to-r from-white to-gray-50">
                        <button
                            onClick={handleCloseModal}
                            className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        >
                            Close
                        </button>
                        {selectedDocument.pdfPath && (
                            <button
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = selectedDocument.pdfPath;
                                    link.download =
                                        selectedDocument.fileName ||
                                        selectedDocument.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-lg hover:shadow-xl"
                            >
                                <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                                Download PDF
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Memoize the endorsement modal handlers to prevent re-creation
    const handleEndorsementCommentsChange = React.useCallback((e) => {
        setEndorsementComments(e.target.value);
    }, []);

    // Format date to be easily understood
    const formatDate = (dateString) => {
        if (!dateString) return "Not available";

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid date";

            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch (error) {
            return "Invalid date";
        }
    };

    // Format date with time
    const formatDateTime = (dateString) => {
        if (!dateString) return "Not available";

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid date";

            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (error) {
            return "Invalid date";
        }
    };

    const handleSaveProposal = async (formData) => {
        try {
            // Show loading state
            setIsEndorsing(true);

            // Prepare data for API
            const updateData = {
                researchAgenda: formData.researchAgenda || [],
                dostSPs: formData.dostSPs || [],
                sustainableDevelopmentGoals:
                    formData.sustainableDevelopmentGoals || [],
                proposedBudget:
                    formData.proposedBudget ||
                    fullProposal?.proposedBudget ||
                    0,
            };

            // Add file if present
            if (formData.updatedForm) {
                updateData.updatedForm = formData.updatedForm;
            }

            console.log("Saving proposal with data:", updateData);

            // Call API
            const response = await updateProposal(
                fullProposal.proposalID || fullProposal.id,
                updateData
            );

            if (response.success) {
                // Update local state with new data
                setFullProposal(response.data);

                // Show success message
                alert("Proposal updated successfully!");

                // Refresh data
                handleRefresh();
            } else {
                throw new Error(
                    response.message || "Failed to update proposal"
                );
            }
        } catch (error) {
            console.error("Error saving proposal:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Failed to save proposal";
            alert(`Error: ${errorMessage}`);
        } finally {
            setIsEndorsing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <>
                <div className="max-w-7xl mx-auto px-6 pt-6">
                    <Breadcrumbs
                        items={[
                            { label: "Dashboard", href: "/cm/dashboard" },
                            { label: "Proposal Details", href: null },
                        ]}
                    />
                </div>
                <div className="max-w-7xl mx-auto p-6 space-y-8">
                    {/* Back Button */}
                    <div className="flex items-center">
                        <button
                            onClick={onBack}
                            className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl transition-all duration-200 group"
                        >
                            <svg
                                className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            <span className="font-medium">
                                Back to Proposals
                            </span>
                        </button>
                    </div>

                    {/* Research Information Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Header with Title and ID */}
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-8 py-6">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex flex-col gap-2">
                                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                                            {fullProposal?.researchTitle ||
                                                fullProposal?.title ||
                                                proposal?.researchTitle ||
                                                proposal?.title}
                                        </h1>
                                        {fullProposal?.resubmittedAfterRevision && (
                                            <span className="inline-flex items-center px-3 py-1 w-fit rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                                <svg
                                                    className="w-4 h-4 mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                    />
                                                </svg>
                                                For Resubmission
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-gray-600 mt-4">
                                        <div className="flex items-center">
                                            <svg
                                                className="w-5 h-5 mr-2 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                            <span className="font-medium">
                                                ID:
                                            </span>
                                            <span className="ml-1">
                                                {fullProposal?.custom_proposal_id ||
                                                    proposal?.custom_proposal_id ||
                                                    `PRO-${String(
                                                        fullProposal?.proposalID ||
                                                            fullProposal?.id ||
                                                            proposal?.proposalID ||
                                                            proposal?.id ||
                                                            "0"
                                                    ).padStart(6, "0")}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                {isEndorsed && endorsementData && (
                                    <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-lg">
                                        <div className="flex items-center space-x-2">
                                            <svg
                                                className="w-6 h-6"
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
                                            <div>
                                                <p className="font-bold text-sm">
                                                    ENDORSED
                                                </p>
                                                <p className="text-xs opacity-90">
                                                    {formatDate(
                                                        endorsementData.endorsementDate
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Research Center */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                                Research Center
                                            </p>
                                            <p className="text-base font-semibold text-slate-900 truncate">
                                                {fullProposal?.researchCenter ||
                                                    proposal?.researchCenter ||
                                                    "Not specified"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Funding Status */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                                                Funding Status
                                            </p>
                                            <p className="text-base font-semibold text-amber-900 truncate">
                                                {fullProposal?.status
                                                    ?.statusName ||
                                                    proposal?.status
                                                        ?.statusName ||
                                                    "Pending Approval"}
                                            </p>
                                            <p className="text-sm text-amber-700 mt-1">
                                                ₱
                                                {(
                                                    fullProposal?.proposedBudget ||
                                                    proposal?.proposedBudget ||
                                                    0
                                                ).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submission Date */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                            <svg
                                                className="w-5 h-5 text-white"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                                                Submission Date
                                            </p>
                                            <p className="text-base font-semibold text-emerald-900">
                                                {formatDate(
                                                    fullProposal?.dateSubmitted ||
                                                        fullProposal?.uploadedAt ||
                                                        proposal?.dateSubmitted ||
                                                        fullProposal?.created_at ||
                                                        proposal?.created_at
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Research Classifications */}
                            <div className="space-y-6">
                                {/* Research Agenda */}
                                <div className="border-l-4 border-blue-500 pl-6 py-2">
                                    <div className="flex items-center mb-3">
                                        <svg
                                            className="w-5 h-5 text-blue-600 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                            />
                                        </svg>
                                        <h4 className="text-lg font-bold text-gray-900">
                                            Research Agenda
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {fullProposal?.researchAgenda &&
                                        Array.isArray(
                                            fullProposal.researchAgenda
                                        ) &&
                                        fullProposal.researchAgenda.length >
                                            0 ? (
                                            fullProposal.researchAgenda.map(
                                                (agenda, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium border border-blue-200"
                                                    >
                                                        {agenda}
                                                    </span>
                                                )
                                            )
                                        ) : proposal?.researchAgenda &&
                                          Array.isArray(
                                              proposal.researchAgenda
                                          ) &&
                                          proposal.researchAgenda.length > 0 ? (
                                            proposal.researchAgenda.map(
                                                (agenda, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium border border-blue-200"
                                                    >
                                                        {agenda}
                                                    </span>
                                                )
                                            )
                                        ) : (
                                            <>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium border border-blue-200">
                                                    Environment and Natural
                                                    Resources
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium border border-blue-200">
                                                    Engineering and Technology
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-md text-sm font-medium border border-blue-200">
                                                    Social Sciences and
                                                    Education
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* DOST Strategic Programs */}
                                <div className="border-l-4 border-green-500 pl-6 py-2">
                                    <div className="flex items-center mb-3">
                                        <svg
                                            className="w-5 h-5 text-green-600 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                                            />
                                        </svg>
                                        <h4 className="text-lg font-bold text-gray-900">
                                            DOST Strategic Programs
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {fullProposal?.dostSPs &&
                                        Array.isArray(fullProposal.dostSPs) &&
                                        fullProposal.dostSPs.length > 0 ? (
                                            fullProposal.dostSPs.map(
                                                (dost, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-medium border border-green-200"
                                                    >
                                                        {dost}
                                                    </span>
                                                )
                                            )
                                        ) : proposal?.dostSPs &&
                                          Array.isArray(proposal.dostSPs) &&
                                          proposal.dostSPs.length > 0 ? (
                                            proposal.dostSPs.map(
                                                (dost, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-medium border border-green-200"
                                                    >
                                                        {dost}
                                                    </span>
                                                )
                                            )
                                        ) : (
                                            <>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-medium border border-green-200">
                                                    Product
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-medium border border-green-200">
                                                    Patent
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-medium border border-green-200">
                                                    Publication
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-md text-sm font-medium border border-green-200">
                                                    People Services
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Sustainable Development Goals */}
                                <div className="border-l-4 border-purple-500 pl-6 py-2">
                                    <div className="flex items-center mb-3">
                                        <svg
                                            className="w-5 h-5 text-purple-600 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <h4 className="text-lg font-bold text-gray-900">
                                            Sustainable Development Goals
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {fullProposal?.sustainableDevelopmentGoals &&
                                        Array.isArray(
                                            fullProposal.sustainableDevelopmentGoals
                                        ) &&
                                        fullProposal.sustainableDevelopmentGoals
                                            .length > 0 ? (
                                            fullProposal.sustainableDevelopmentGoals.map(
                                                (sdg, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md text-sm font-medium border border-purple-200"
                                                    >
                                                        {sdg}
                                                    </span>
                                                )
                                            )
                                        ) : proposal?.sustainableDevelopmentGoals &&
                                          Array.isArray(
                                              proposal.sustainableDevelopmentGoals
                                          ) &&
                                          proposal.sustainableDevelopmentGoals
                                              .length > 0 ? (
                                            proposal.sustainableDevelopmentGoals.map(
                                                (sdg, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md text-sm font-medium border border-purple-200"
                                                    >
                                                        {sdg}
                                                    </span>
                                                )
                                            )
                                        ) : (
                                            <>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md text-sm font-medium border border-purple-200">
                                                    Clean Water and Sanitation
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md text-sm font-medium border border-purple-200">
                                                    Decent Work and Economic
                                                    Growth
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md text-sm font-medium border border-purple-200">
                                                    Reduced Inequalities
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md text-sm font-medium border border-purple-200">
                                                    Responsible Consumption and
                                                    Production
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md text-sm font-medium border border-purple-200">
                                                    Affordable and Clean Energy
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-800 rounded-md text-sm font-medium border border-purple-200">
                                                    Gender Equality
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Research Description & Objectives */}
                            {(fullProposal?.description ||
                                proposal?.description ||
                                fullProposal?.objectives ||
                                proposal?.objectives) && (
                                <div className="mt-8 pt-8 border-t border-gray-200">
                                    <div className="bg-slate-50 rounded-xl p-6 space-y-6">
                                        {(fullProposal?.description ||
                                            proposal?.description) && (
                                            <div>
                                                <h5 className="flex items-center text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                                                    <svg
                                                        className="w-4 h-4 mr-2"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 6h16M4 12h16M4 18h7"
                                                        />
                                                    </svg>
                                                    Description
                                                </h5>
                                                <p className="text-gray-700 leading-relaxed text-justify">
                                                    {fullProposal?.description ||
                                                        proposal?.description}
                                                </p>
                                            </div>
                                        )}

                                        {(fullProposal?.objectives ||
                                            proposal?.objectives) && (
                                            <div>
                                                <h5 className="flex items-center text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                                                    <svg
                                                        className="w-4 h-4 mr-2"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                                        />
                                                    </svg>
                                                    Objectives
                                                </h5>
                                                <p className="text-gray-700 leading-relaxed text-justify">
                                                    {fullProposal?.objectives ||
                                                        proposal?.objectives}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Research Proposal Section */}
                    {(() => {
                        // Get all research proposal files
                        const researchProposalFiles =
                            fullProposal?.files?.filter((f) => {
                                if (!f.filePath) return false;
                                return isResearchProposalFile(f);
                            }) || [];

                        if (researchProposalFiles.length === 0) {
                            return null;
                        }

                        return (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                                            <svg
                                                className="w-5 h-5 text-red-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                Research Proposal
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Main research proposal document
                                            </p>
                                        </div>
                                    </div>
                                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {researchProposalFiles.length} file
                                        {researchProposalFiles.length !== 1
                                            ? "s"
                                            : ""}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {researchProposalFiles.map(
                                        (file, index) => {
                                            const fileUrl = `/storage/${file.filePath}`;
                                            return (
                                                <div
                                                    key={file.fileID || index}
                                                    className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
                                                                {file.fileName}
                                                            </h4>
                                                            {file.fileSize && (
                                                                <p className="text-xs text-gray-500 mb-3">
                                                                    {(
                                                                        file.fileSize /
                                                                        1024
                                                                    ).toFixed(
                                                                        0
                                                                    )}{" "}
                                                                    KB
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() =>
                                                                        handleDocumentClick(
                                                                            {
                                                                                ...file,
                                                                                pdfPath:
                                                                                    fileUrl,
                                                                            }
                                                                        )
                                                                    }
                                                                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                                                                    title="View file"
                                                                >
                                                                    <svg
                                                                        className="w-4 h-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                        />
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                        />
                                                                    </svg>
                                                                    View
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const link =
                                                                            document.createElement(
                                                                                "a"
                                                                            );
                                                                        link.href =
                                                                            fileUrl;
                                                                        link.download =
                                                                            file.fileName;
                                                                        link.target =
                                                                            "_blank";
                                                                        document.body.appendChild(
                                                                            link
                                                                        );
                                                                        link.click();
                                                                        document.body.removeChild(
                                                                            link
                                                                        );
                                                                    }}
                                                                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors duration-200"
                                                                    title="Download file"
                                                                >
                                                                    <svg
                                                                        className="w-4 h-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                        />
                                                                    </svg>
                                                                    Download
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Supporting Documents (SETI, GAD, MOC) */}
                    {attachedDocuments.filter((d) =>
                        [
                            "seti_scorecard",
                            "gad_certificate",
                            "matrix_compliance",
                        ].includes(d.fileType)
                    ).length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <div className="flex items-center mb-8">
                                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                                    <svg
                                        className="w-5 h-5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Supporting Documents
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* SETI */}
                                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-base font-bold text-blue-900">
                                            SETI
                                        </h4>
                                        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                            {
                                                attachedDocuments.filter(
                                                    (d) =>
                                                        d.fileType ===
                                                        "seti_scorecard"
                                                ).length
                                            }{" "}
                                            file
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Science and Engineering Technology
                                        Initiative
                                    </p>
                                    {attachedDocuments
                                        .filter(
                                            (d) =>
                                                d.fileType === "seti_scorecard"
                                        )
                                        .map((doc, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-gray-50 rounded-lg mb-3"
                                            >
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {doc.fileName}
                                                </p>
                                                {doc.fileSize && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {(
                                                            doc.fileSize / 1024
                                                        ).toFixed(0)}{" "}
                                                        KB
                                                    </p>
                                                )}
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() =>
                                                            handleDocumentClick(
                                                                doc
                                                            )
                                                        }
                                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-1"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            window.open(
                                                                doc.pdfPath,
                                                                "_blank",
                                                                "noopener"
                                                            )
                                                        }
                                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-1"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                            />
                                                        </svg>
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {/* GAD */}
                                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-base font-bold text-green-900">
                                            GAD
                                        </h4>
                                        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                            {
                                                attachedDocuments.filter(
                                                    (d) =>
                                                        d.fileType ===
                                                        "gad_certificate"
                                                ).length
                                            }{" "}
                                            file
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Gender and Development
                                    </p>
                                    {attachedDocuments
                                        .filter(
                                            (d) =>
                                                d.fileType === "gad_certificate"
                                        )
                                        .map((doc, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-gray-50 rounded-lg mb-3"
                                            >
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {doc.fileName}
                                                </p>
                                                {doc.fileSize && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {(
                                                            doc.fileSize / 1024
                                                        ).toFixed(0)}{" "}
                                                        KB
                                                    </p>
                                                )}
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() =>
                                                            handleDocumentClick(
                                                                doc
                                                            )
                                                        }
                                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-1"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            window.open(
                                                                doc.pdfPath,
                                                                "_blank",
                                                                "noopener"
                                                            )
                                                        }
                                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-1"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                            />
                                                        </svg>
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {/* MOC */}
                                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-base font-bold text-amber-900">
                                            MOC
                                        </h4>
                                        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                            {
                                                attachedDocuments.filter(
                                                    (d) =>
                                                        d.fileType ===
                                                        "matrix_compliance"
                                                ).length
                                            }{" "}
                                            file
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Matrix of Compliance
                                    </p>
                                    {attachedDocuments
                                        .filter(
                                            (d) =>
                                                d.fileType ===
                                                "matrix_compliance"
                                        )
                                        .map((doc, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 bg-gray-50 rounded-lg mb-3"
                                            >
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {doc.fileName}
                                                </p>
                                                {doc.fileSize && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {(
                                                            doc.fileSize / 1024
                                                        ).toFixed(0)}{" "}
                                                        KB
                                                    </p>
                                                )}
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() =>
                                                            handleDocumentClick(
                                                                doc
                                                            )
                                                        }
                                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-1"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            window.open(
                                                                doc.pdfPath,
                                                                "_blank",
                                                                "noopener"
                                                            )
                                                        }
                                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-1"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                            />
                                                        </svg>
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other Supporting Documents */}
                    {(() => {
                        // Filter for other supporting documents (exclude SETI, GAD, MOC, and research proposal files)
                        const otherSupportingDocs = attachedDocuments.filter(
                            (d) => {
                                // Exclude SETI, GAD, MOC files
                                if (
                                    [
                                        "seti_scorecard",
                                        "gad_certificate",
                                        "matrix_compliance",
                                    ].includes(d.fileType)
                                ) {
                                    return false;
                                }

                                // Exclude research proposal files - only check fileType
                                // IMPORTANT: Do NOT use filename matching to avoid false positives
                                if (
                                    d.fileType === "concept_paper" ||
                                    d.fileType === "report"
                                ) {
                                    return false;
                                }

                                // Also check the original file object from fullProposal.files
                                const originalFile = fullProposal?.files?.find(
                                    (f) => f.fileName === d.fileName
                                );
                                if (
                                    originalFile &&
                                    isResearchProposalFile(originalFile)
                                ) {
                                    return false;
                                }

                                // Include all other files, especially supporting_document type
                                return true;
                            }
                        );

                        // Debug logging to help identify issues
                        if (process.env.NODE_ENV === "development") {
                            console.log("Other Supporting Documents Filter:", {
                                totalAttachedDocs: attachedDocuments.length,
                                otherSupportingDocsCount:
                                    otherSupportingDocs.length,
                                allFileTypes: attachedDocuments.map(
                                    (d) => d.fileType
                                ),
                                supportingDocumentFiles:
                                    attachedDocuments.filter(
                                        (d) =>
                                            d.fileType === "supporting_document"
                                    ),
                                filteredFiles: otherSupportingDocs.map((d) => ({
                                    fileName: d.fileName,
                                    fileType: d.fileType,
                                })),
                            });
                        }

                        if (otherSupportingDocs.length === 0) {
                            return null;
                        }

                        return (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mr-4">
                                            <svg
                                                className="w-5 h-5 text-orange-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                Other Supporting Documents
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Additional files and attachments
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                                        {otherSupportingDocs.length} files
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {otherSupportingDocs.map(
                                        (document, index) => (
                                            <div
                                                key={index}
                                                className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                            >
                                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                                    {document.fileName}
                                                </p>
                                                {document.fileSize && (
                                                    <p className="text-xs text-gray-500 mb-4">
                                                        {(
                                                            document.fileSize /
                                                            1024
                                                        ).toFixed(0)}{" "}
                                                        KB
                                                    </p>
                                                )}
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() =>
                                                            handleDocumentClick(
                                                                document
                                                            )
                                                        }
                                                        className="flex items-center justify-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium text-sm transition-colors"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-2"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            window.open(
                                                                document.pdfPath,
                                                                "_blank",
                                                                "noopener"
                                                            )
                                                        }
                                                        className="flex items-center justify-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium text-sm transition-colors"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-2"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                            />
                                                        </svg>
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200 mt-8">
                        {!isEndorsed && (
                            <button
                                type="button"
                                onClick={handleForRevision}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                            >
                                <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                                For Revision
                            </button>
                        )}
                        {!isEndorsed && (
                            <button
                                onClick={handleEndorse}
                                disabled={isEndorsed || isEndorsing}
                                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                <svg
                                    className="w-5 h-5 mr-2"
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
                                Endorse Proposal
                            </button>
                        )}
                    </div>
                </div>

                {/* Document Modal */}
                {showDocumentModal && <DocumentModal />}

                {/* Endorsement Modal */}
                {showEndorsementModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full animate-fadeIn">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
                                <div className="flex items-center space-x-2">
                                    <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                                        <svg
                                            className="w-5 h-5 text-white"
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
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Endorse Proposal
                                    </h2>
                                </div>
                                <button
                                    onClick={handleEndorsementCancel}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-white p-1 rounded-lg transition-all duration-200"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight">
                                        {fullProposal?.researchTitle ||
                                            fullProposal?.title ||
                                            proposal?.researchTitle ||
                                            proposal?.title}
                                    </h3>
                                    <div className="flex items-center text-gray-700">
                                        <svg
                                            className="w-4 h-4 mr-2 text-gray-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                        <span className="font-medium">ID:</span>
                                        <span className="ml-2">
                                            {fullProposal?.custom_proposal_id ||
                                                proposal?.custom_proposal_id ||
                                                `PRO-${String(
                                                    fullProposal?.proposalID ||
                                                        fullProposal?.id ||
                                                        proposal?.proposalID ||
                                                        proposal?.id ||
                                                        "0"
                                                ).padStart(6, "0")}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label
                                        htmlFor="endorsementComments"
                                        className="flex items-center text-sm font-semibold text-gray-800 mb-2"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-2 text-gray-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                            />
                                        </svg>
                                        Endorsement Comments
                                        <span className="text-xs text-gray-500 font-normal ml-2">
                                            (Optional)
                                        </span>
                                    </label>
                                    <textarea
                                        id="endorsementComments"
                                        value={endorsementComments}
                                        onChange={
                                            handleEndorsementCommentsChange
                                        }
                                        rows={5}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
                                        placeholder="Add any comments, recommendations, or notes about this endorsement..."
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                        Your comments will be visible to other
                                        reviewers and administrators.
                                    </p>
                                </div>

                                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleEndorsementCancel}
                                        disabled={isEndorsing}
                                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEndorsementSubmit}
                                        disabled={isEndorsing}
                                        className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl transition-all disabled:opacity-50 flex items-center font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                                    >
                                        {isEndorsing ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Endorsing...
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className="w-5 h-5 mr-2"
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
                                                Confirm Endorsement
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* For Revision Modal */}
                {showRevisionModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full animate-fadeIn">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                                <div className="flex items-center space-x-2">
                                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                                        <svg
                                            className="w-5 h-5 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                        </svg>
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Send for Revision
                                    </h2>
                                </div>
                                <button
                                    onClick={handleRevisionCancel}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-white p-1 rounded-lg transition-all duration-200"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-5">
                                <div className="mb-5 bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-900 mb-2 leading-tight">
                                        {fullProposal?.researchTitle ||
                                            fullProposal?.title ||
                                            proposal?.researchTitle ||
                                            proposal?.title}
                                    </h3>
                                    <div className="flex items-center text-sm text-gray-700">
                                        <svg
                                            className="w-4 h-4 mr-2 text-gray-500"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        <span className="font-medium">By:</span>
                                        <span className="ml-2">
                                            {fullProposal?.user?.fullName ||
                                                fullProposal?.author ||
                                                proposal?.user?.fullName ||
                                                proposal?.author ||
                                                "Unknown"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label
                                        htmlFor="revisionComments"
                                        className="flex items-center text-sm font-semibold text-gray-800 mb-2"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-2 text-gray-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                            />
                                        </svg>
                                        Revision Comments
                                        <span className="text-xs text-gray-500 font-normal ml-2">
                                            (Optional)
                                        </span>
                                    </label>
                                    <textarea
                                        id="revisionComments"
                                        value={revisionComments}
                                        onChange={handleRevisionCommentsChange}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                        placeholder="Add revision comments or notes for the proponent..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleRevisionCancel}
                                        disabled={isSendingForRevision}
                                        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendForRevision}
                                        disabled={isSendingForRevision}
                                        className="px-6 py-2 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                                    >
                                        {isSendingForRevision ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d={
                                                            "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        }
                                                    ></path>
                                                </svg>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <svg
                                                    className="w-5 h-5 mr-2"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d={
                                                            "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        }
                                                    />
                                                </svg>
                                                Send for Revision
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </div>
    );
};

export default CMProposalDetails;
