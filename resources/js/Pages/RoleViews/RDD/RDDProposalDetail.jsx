import React, { useState, useEffect } from "react";
import { useRouteParams } from "../../../Components/RoleBased/InertiaRoleRouter";
import {
    BiDownload,
    BiEdit,
    BiCheck,
    BiX,
    BiCalendar,
    BiUser,
    BiFile,
    BiDollar,
    BiEnvelope,
} from "react-icons/bi";
import { router } from "@inertiajs/react";
import rddService from "../../../services/rddService";
import PDFViewer from "../../../Components/PDFViewer";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";

const RDDProposalDetail = () => {
    const { id } = useRouteParams();
    const [activeTab, setActiveTab] = useState("overview");
    const [reviewDecision, setReviewDecision] = useState("");
    const [reviewComments, setReviewComments] = useState("");
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    useEffect(() => {
        if (id) {
            fetchProposal();
        }
    }, [id]);

    const fetchProposal = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await rddService.getProposalById(id);
            if (response.success) {
                setProposal(response.data);
            } else {
                setError("Failed to fetch proposal");
            }
        } catch (err) {
            console.error("Error fetching proposal:", err);
            setError("Error loading proposal");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading proposal...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="text-red-600 text-6xl mb-4">⚠️</div>
                            <p className="text-gray-600 mb-4">
                                {error || "Proposal not found"}
                            </p>
                            <button
                                onClick={fetchProposal}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const formatCurrency = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return "₱0";
        return `₱${numeric.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const buildBudgetBreakdown = (budget, breakdown) => {
        const total = Number(budget) || 0;
        const source =
            breakdown && Object.keys(breakdown).length > 0
                ? breakdown
                : total > 0
                ? {
                      personnel: total * 0.5,
                      equipment: total * 0.2,
                      materials: total * 0.15,
                      travel: total * 0.1,
                      other: total * 0.05,
                  }
                : {};

        const formatted = {};
        let computedTotal = 0;
        Object.entries(source).forEach(([category, amount]) => {
            const numericAmount = Number(amount) || 0;
            computedTotal += numericAmount;
            formatted[category] = formatCurrency(numericAmount);
        });

        if (total > 0) {
            formatted.total = formatCurrency(total);
        } else if (computedTotal > 0) {
            formatted.total = formatCurrency(computedTotal);
        }

        return formatted;
    };

    const budgetAmount = Number(proposal.proposedBudget) || 0;
    const formattedBudgetBreakdown = buildBudgetBreakdown(
        budgetAmount,
        proposal.budgetBreakdown
    );

    // Format date with time for display
    const formatDateTime = (dateInput) => {
        if (!dateInput) return "Not available";

        try {
            const date =
                dateInput instanceof Date ? dateInput : new Date(dateInput);
            if (isNaN(date.getTime())) return "Invalid date";

            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch (error) {
            return "Invalid date";
        }
    };

    // Format date range with time for display
    const formatDateRange = (startDate, endDate) => {
        const start = formatDateTime(startDate);
        const end = formatDateTime(endDate);

        if (start === end) {
            return start;
        }

        return `${start} - ${end}`;
    };

    // Build dynamic timeline based on actual proposal process
    const buildTimeline = () => {
        const baseDate = new Date(proposal.uploadedAt || proposal.created_at);
        const timeline = [];
        const statusId = proposal.statusID || 1;
        const now = new Date();

        // Get endorsements sorted by date
        const cmEndorsements =
            proposal.endorsements
                ?.filter(
                    (e) =>
                        e.endorser?.role?.userRole === "CM" &&
                        e.endorsementStatus === "approved"
                )
                .sort(
                    (a, b) =>
                        new Date(a.endorsementDate || 0) -
                        new Date(b.endorsementDate || 0)
                ) || [];

        const rddEndorsements =
            proposal.endorsements
                ?.filter(
                    (e) =>
                        e.endorser?.role?.userRole === "RDD" &&
                        e.endorsementStatus === "approved"
                )
                .sort(
                    (a, b) =>
                        new Date(a.endorsementDate || 0) -
                        new Date(b.endorsementDate || 0)
                ) || [];

        // Get reviews sorted by date
        const reviews =
            proposal.reviews
                ?.filter((r) => r.reviewedAt)
                .sort(
                    (a, b) => new Date(a.reviewedAt) - new Date(b.reviewedAt)
                ) || [];

        // 1. Proposal Submitted (always first, use actual submission date with time)
        const submissionDate = new Date(baseDate);
        timeline.push({
            phase: "Proposal Submitted",
            start: submissionDate,
            end: submissionDate,
            status: "Completed",
            displayDate: formatDateTime(submissionDate),
        });

        // 2. College Endorsement (must come after submission)
        const cmEndorsement = cmEndorsements[0];
        if (cmEndorsement && cmEndorsement.endorsementDate) {
            const endorsementDate = new Date(cmEndorsement.endorsementDate);
            // Ensure endorsement date is after submission
            if (endorsementDate >= submissionDate) {
                timeline.push({
                    phase: "College Endorsement",
                    start: endorsementDate,
                    end: endorsementDate,
                    status: "Completed",
                    displayDate: formatDateTime(endorsementDate),
                });
            }
        } else if (statusId >= 2) {
            // If status is beyond submission but no endorsement date, estimate (at least 1 day after submission)
            const estimatedDate = new Date(
                Math.max(
                    submissionDate.getTime() + 1 * 24 * 60 * 60 * 1000,
                    submissionDate.getTime() + 7 * 24 * 60 * 60 * 1000
                )
            );
            estimatedDate.setHours(10, 0, 0, 0); // Set to 10 AM
            timeline.push({
                phase: "College Endorsement",
                start: estimatedDate,
                end: estimatedDate,
                status: "Completed",
                displayDate: formatDateTime(estimatedDate),
            });
        } else {
            // Pending - estimate future date
            const futureDate = new Date(
                submissionDate.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            futureDate.setHours(10, 0, 0, 0);
            timeline.push({
                phase: "College Endorsement",
                start: futureDate,
                end: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                status: "Pending",
                displayDate: formatDateRange(
                    futureDate,
                    new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                ),
            });
        }

        // 3. R&D Division Review (comes after College Endorsement)
        // Get the last completed stage date
        const lastCompletedDate =
            timeline[timeline.length - 1]?.end || submissionDate;

        if (statusId >= 2) {
            // Determine R&D review date - use actual data or estimate after CM endorsement
            let rddDate;
            if (
                rddEndorsements.length > 0 &&
                rddEndorsements[0].endorsementDate
            ) {
                rddDate = new Date(rddEndorsements[0].endorsementDate);
            } else if (reviews.length > 0 && reviews[0].reviewedAt) {
                rddDate = new Date(reviews[0].reviewedAt);
            } else {
                // Estimate: at least 1 day after last completed stage
                rddDate = new Date(
                    Math.max(
                        lastCompletedDate.getTime() + 1 * 24 * 60 * 60 * 1000,
                        submissionDate.getTime() + 14 * 24 * 60 * 60 * 1000
                    )
                );
                rddDate.setHours(10, 0, 0, 0);
            }

            // Ensure R&D date is after last completed stage
            if (rddDate >= lastCompletedDate) {
                timeline.push({
                    phase: "R&D Division Review",
                    start: rddDate,
                    end: rddDate,
                    status:
                        reviews.length > 0 || statusId >= 3
                            ? "Completed"
                            : "In Progress",
                    displayDate: formatDateTime(rddDate),
                });
            }
        } else {
            // Pending - estimate future date
            const futureDate = new Date(
                lastCompletedDate.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            futureDate.setHours(10, 0, 0, 0);
            timeline.push({
                phase: "R&D Division Review",
                start: futureDate,
                end: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                status: "Pending",
                displayDate: formatDateRange(
                    futureDate,
                    new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                ),
            });
        }

        // 4. Proposal Review (comes after R&D Division Review, only if reviews exist or status indicates it)
        const lastStageDate =
            timeline[timeline.length - 1]?.end || lastCompletedDate;

        if (reviews.length > 0) {
            // Use the latest review date
            const latestReviewDate = new Date(
                reviews[reviews.length - 1].reviewedAt
            );
            if (latestReviewDate >= lastStageDate) {
                timeline.push({
                    phase: "Proposal Review",
                    start: latestReviewDate,
                    end: latestReviewDate,
                    status: "Completed",
                    displayDate: formatDateTime(latestReviewDate),
                });
            }
        } else if (statusId >= 3) {
            // In progress - estimate date after R&D review
            const reviewDate = new Date(
                Math.max(
                    lastStageDate.getTime() + 1 * 24 * 60 * 60 * 1000,
                    submissionDate.getTime() + 21 * 24 * 60 * 60 * 1000
                )
            );
            reviewDate.setHours(10, 0, 0, 0);
            timeline.push({
                phase: "Proposal Review",
                start: reviewDate,
                end: new Date(reviewDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                status: "In Progress",
                displayDate: formatDateRange(
                    reviewDate,
                    new Date(reviewDate.getTime() + 7 * 24 * 60 * 60 * 1000)
                ),
            });
        }

        // 5. Implementation (only if proposal is approved/ongoing - statusId >= 2)
        // Implementation should only come after reviews are completed
        const finalReviewDate =
            timeline[timeline.length - 1]?.end || lastStageDate;

        if (statusId >= 2 && (reviews.length > 0 || statusId >= 3)) {
            // Implementation starts after reviews are done
            const implementationStart = new Date(
                Math.max(
                    finalReviewDate.getTime() + 1 * 24 * 60 * 60 * 1000,
                    submissionDate.getTime() + 30 * 24 * 60 * 60 * 1000
                )
            );
            implementationStart.setHours(9, 0, 0, 0);

            let implementationEnd;
            if (statusId >= 4) {
                // Ongoing - end date is today or estimated end
                implementationEnd = new Date(
                    Math.max(
                        now,
                        implementationStart.getTime() + 90 * 24 * 60 * 60 * 1000
                    )
                );
            } else {
                // Completed - estimate 90 days duration
                implementationEnd = new Date(
                    implementationStart.getTime() + 90 * 24 * 60 * 60 * 1000
                );
            }

            timeline.push({
                phase: "Implementation",
                start: implementationStart,
                end: implementationEnd,
                status: statusId >= 4 ? "In Progress" : "Completed",
                displayDate: formatDateRange(
                    implementationStart,
                    implementationEnd
                ),
            });
        } else if (statusId >= 2) {
            // Approved but not yet in implementation
            const futureDate = new Date(
                finalReviewDate.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            futureDate.setHours(9, 0, 0, 0);
            timeline.push({
                phase: "Implementation",
                start: futureDate,
                end: new Date(futureDate.getTime() + 90 * 24 * 60 * 60 * 1000),
                status: "Pending",
                displayDate: formatDateRange(
                    futureDate,
                    new Date(futureDate.getTime() + 90 * 24 * 60 * 60 * 1000)
                ),
            });
        }

        // 6. Monitoring (only if status is Ongoing or Completed - statusId >= 4)
        if (statusId >= 4) {
            const lastPhaseDate =
                timeline[timeline.length - 1]?.end || finalReviewDate;
            const monitoringStart = new Date(
                Math.max(
                    lastPhaseDate.getTime() + 1 * 24 * 60 * 60 * 1000,
                    submissionDate.getTime() + 120 * 24 * 60 * 60 * 1000
                )
            );
            monitoringStart.setHours(9, 0, 0, 0);

            const monitoringEnd =
                statusId >= 5
                    ? new Date(
                          Math.max(
                              now,
                              monitoringStart.getTime() +
                                  60 * 24 * 60 * 60 * 1000
                          )
                      )
                    : new Date(
                          monitoringStart.getTime() + 60 * 24 * 60 * 60 * 1000
                      );

            timeline.push({
                phase: "Monitoring",
                start: monitoringStart,
                end: monitoringEnd,
                status: statusId >= 5 ? "Completed" : "In Progress",
                displayDate: formatDateRange(monitoringStart, monitoringEnd),
            });
        }

        return timeline;
    };

    // Get priority based on budget
    const getPriority = (budget) => {
        const numericBudget = Number(budget) || 0;
        if (numericBudget >= 1000000) return "High";
        if (numericBudget >= 500000) return "Medium";
        return "Low";
    };

    // Get actual endorsement date from CM endorsements
    const getEndorsementDate = () => {
        const cmEndorsements =
            proposal.endorsements?.filter(
                (e) =>
                    e.endorser?.role?.userRole === "CM" &&
                    e.endorsementStatus === "approved"
            ) || [];
        if (cmEndorsements.length > 0 && cmEndorsements[0].endorsementDate) {
            return new Date(cmEndorsements[0].endorsementDate);
        }
        return null;
    };

    const transformedProposal = {
        id: `PRO-2025-${String(proposal.proposalID).padStart(5, "0")}`,
        title: proposal.researchTitle,
        author: proposal.user
            ? `${proposal.user.firstName} ${proposal.user.lastName}`
            : "Unknown",
        email: proposal.user?.email || "Unknown",
        college: proposal.user?.department?.name || "Unknown Department",
        department: proposal.user?.department?.name || "Unknown Department",
        status: proposal.status?.statusName || "Unknown",
        priority: getPriority(budgetAmount),
        submittedDate: new Date(proposal.uploadedAt)
            .toISOString()
            .split("T")[0],
        reviewDeadline: new Date(
            new Date(proposal.uploadedAt).getTime() + 30 * 24 * 60 * 60 * 1000
        )
            .toISOString()
            .split("T")[0], // 30 days from submission
        budget: formatCurrency(budgetAmount),
        duration: "12 months", // Default duration since it's not in the database
        startDate: new Date(proposal.uploadedAt).toISOString().split("T")[0],
        endDate: new Date(
            new Date(proposal.uploadedAt).getTime() + 365 * 24 * 60 * 60 * 1000
        )
            .toISOString()
            .split("T")[0], // 1 year from submission
        abstract: proposal.description || "No abstract provided",
        objectives: proposal.objectives
            ? proposal.objectives.split("\n").filter((obj) => obj.trim())
            : ["No objectives provided"],
        methodology:
            proposal.matrixOfCompliance?.methodology ||
            "Methodology details not specified in the proposal.",
        expectedOutcomes: proposal.matrixOfCompliance?.expectedOutcomes || [
            "Research findings and publications",
            "Implementation of proposed solution",
            "Knowledge transfer to stakeholders",
            "Policy recommendations",
        ],
        budgetBreakdown: formattedBudgetBreakdown,
        timeline: buildTimeline(),
        // Dynamic data from proposal
        sustainableDevelopmentGoals: Array.isArray(
            proposal.sustainableDevelopmentGoals
        )
            ? proposal.sustainableDevelopmentGoals
            : [],
        researchAgenda: Array.isArray(proposal.researchAgenda)
            ? proposal.researchAgenda
            : [],
        dostSPs: Array.isArray(proposal.dostSPs) ? proposal.dostSPs : [],
        endorsementDate: getEndorsementDate(),
        reviewers:
            proposal.reviews && proposal.reviews.length > 0
                ? proposal.reviews.map((review) => ({
                      name: review.reviewer
                          ? `${review.reviewer.firstName || ""} ${
                                review.reviewer.lastName || ""
                            }`.trim() || "Unknown Reviewer"
                          : "Unknown Reviewer",
                      status: review.decision
                          ? review.decision.decision
                          : review.reviewedAt
                          ? "Completed"
                          : "Pending",
                      comments: review.remarks || "No comments provided.",
                      reviewedAt: review.reviewedAt
                          ? new Date(review.reviewedAt).toLocaleDateString(
                                "en-US",
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                }
                            )
                          : null,
                  }))
                : [],
        attachments:
            proposal.files && proposal.files.length > 0
                ? proposal.files.map((file) => ({
                      name: file.fileName || "Untitled File",
                      size: file.fileSize
                          ? `${(file.fileSize / 1024 / 1024).toFixed(1)} MB`
                          : "Unknown size",
                      type: file.fileType
                          ? file.fileType === "report"
                              ? "PDF"
                              : file.fileType.toUpperCase()
                          : "Unknown",
                      filePath: file.filePath
                          ? `/storage/${file.filePath}`
                          : null,
                      fileID: file.fileID,
                  }))
                : [],
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Completed":
                return "bg-green-100 text-green-800 border-green-300";
            case "In Progress":
                return "bg-blue-100 text-blue-800 border-blue-300";
            case "Pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-300";
            case "Under Review":
                return "bg-orange-100 text-orange-800 border-orange-300";
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    const getPriorityClass = (priority) => {
        switch (priority) {
            case "High":
                return "bg-red-100 text-red-800";
            case "Medium":
                return "bg-yellow-100 text-yellow-800";
            case "Low":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();

        if (!reviewDecision) {
            alert("Please select a review decision");
            return;
        }

        try {
            const reviewData = {
                proposalID: proposal.proposalID,
                decision: reviewDecision,
                remarks: reviewComments || "",
            };

            const response = await rddService.submitReview(reviewData);

            if (response.success) {
                alert("Review submitted successfully!");
                // Reset form
                setReviewDecision("");
                setReviewComments("");
                // Refresh proposal data to show the new review
                await fetchProposal();
            } else {
                alert(response.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Error submitting review:", error);
            alert(
                error.response?.data?.message ||
                    "Failed to submit review. Please try again."
            );
        }
    };

    const handleDocumentClick = (document) => {
        if (document && document.pdfPath) {
            setSelectedDocument(document);
            setShowDocumentModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowDocumentModal(false);
        setSelectedDocument(null);
    };

    const handleBack = () => {
        router.visit("/rdd/endorsement");
    };

    // Prepare attached documents from actual uploaded files
    const attachedDocuments =
        proposal?.files && proposal.files.length > 0
            ? proposal.files.map((file) => ({
                  name: file.fileName || "Untitled File",
                  available: true,
                  pdfPath: file.filePath ? `/storage/${file.filePath}` : null,
                  fileID: file.fileID,
                  fileType: file.fileType,
                  fileSize: file.fileSize,
              }))
            : [];

    // Get concept paper path for PDF viewer (first file or fallback)
    const conceptPaperPath =
        proposal?.files && proposal.files.length > 0
            ? `/storage/${proposal.files[0].filePath}`
            : null;

    // Document Modal Component
    const DocumentModal = () => {
        if (!selectedDocument) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {selectedDocument.name}
                        </h2>
                        <button
                            onClick={handleCloseModal}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
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

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        <div className="h-full">
                            <PDFViewer
                                pdfPath={selectedDocument.pdfPath}
                                title={selectedDocument.name}
                            />
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 h-full overflow-y-auto">
            {/* Back Button */}
            <div className="mb-8">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md"
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
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    <span className="font-medium">Back to Endorsements</span>
                </button>
            </div>

            {/* Proposal Details Section */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 leading-tight">
                        {transformedProposal.title}
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Research Proposal Details
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-center mb-1">
                            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                                <svg
                                    className="w-3 h-3 text-white"
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
                            <h3 className="text-sm font-semibold text-gray-800">
                                Proposal ID
                            </h3>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                            {transformedProposal.id}
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                        <div className="flex items-center mb-1">
                            <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mr-2">
                                <svg
                                    className="w-3 h-3 text-white"
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
                            <h3 className="text-sm font-semibold text-gray-800">
                                Endorsement Date
                            </h3>
                        </div>
                        <p className="text-lg font-bold text-purple-600">
                            {transformedProposal.endorsementDate
                                ? transformedProposal.endorsementDate.toLocaleDateString(
                                      "en-US",
                                      {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                      }
                                  )
                                : "Not yet endorsed"}
                        </p>
                    </div>
                </div>

                {/* Attached Documents */}
                <div className="mb-8">
                    <div className="flex items-center mb-6">
                        <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
                            <svg
                                className="w-4 h-4 text-white"
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
                        <h3 className="text-xl font-semibold text-gray-800">
                            Attached Documents
                        </h3>
                    </div>

                    {attachedDocuments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {attachedDocuments.map((document, index) => (
                                <div
                                    key={document.fileID || index}
                                    className="flex items-center p-4 rounded-lg border transition-all duration-200 cursor-pointer group bg-blue-50 hover:bg-blue-100 border-blue-200"
                                    onClick={() =>
                                        handleDocumentClick(document)
                                    }
                                >
                                    <div className="w-3 h-3 rounded-full mr-4 transition-colors bg-blue-500 group-hover:bg-blue-600"></div>
                                    <span className="font-medium text-sm flex-1 text-blue-700 hover:text-blue-800 group-hover:underline">
                                        {document.name}
                                    </span>
                                    <svg
                                        className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                            <svg
                                className="w-12 h-12 text-gray-400 mx-auto mb-3"
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
                            <p className="text-gray-600 font-medium">
                                No documents attached
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                Files will appear here once they are uploaded.
                            </p>
                        </div>
                    )}
                </div>

                {/* Research Information Section */}
                <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center shadow-lg">
                            <svg
                                className="w-6 h-6 text-blue-600"
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
                            <h3 className="text-2xl font-bold text-black">
                                Research Information
                            </h3>
                            <p className="text-gray-600 mt-1">
                                Comprehensive research project details and
                                classifications
                            </p>
                        </div>
                    </div>

                    {/* Research Information Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Basic Information */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">
                                    Basic Information
                                </h4>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm">
                                            RESEARCH CENTER
                                        </span>
                                        <p className="text-gray-700 font-medium">
                                            {proposal.researchCenter ||
                                                transformedProposal.department}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-yellow-50/50 rounded-xl">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm">
                                            FUNDING STATUS
                                        </span>
                                        <p className="text-gray-700 font-medium">
                                            {transformedProposal.status}
                                        </p>
                                        <p className="text-gray-600 text-sm mt-1">
                                            Proposed:{" "}
                                            {transformedProposal.budget}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-green-50/50 rounded-xl">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                    <div>
                                        <span className="font-semibold text-gray-800 text-sm">
                                            SUBMITTED DATE
                                        </span>
                                        <p className="text-gray-700 font-medium">
                                            {new Date(
                                                proposal?.uploadedAt ||
                                                    new Date()
                                            ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SDGs */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-purple-600"
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
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">
                                    Sustainable Development Goals
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {transformedProposal.sustainableDevelopmentGoals
                                    .length > 0 ? (
                                    transformedProposal.sustainableDevelopmentGoals.map(
                                        (sdg, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                                            >
                                                {sdg}
                                            </span>
                                        )
                                    )
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        No Sustainable Development Goals
                                        specified
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Research Agenda */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">
                                    Research Agenda
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {transformedProposal.researchAgenda.length >
                                0 ? (
                                    transformedProposal.researchAgenda.map(
                                        (agenda, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300/50 shadow-sm hover:shadow-md transition-all duration-200"
                                            >
                                                {agenda}
                                            </span>
                                        )
                                    )
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        No Research Agenda specified
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* DOST Programs */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-4 h-4 text-green-600"
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
                                <h4 className="text-lg font-bold text-gray-900">
                                    DOST Programs
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {transformedProposal.dostSPs.length > 0 ? (
                                    transformedProposal.dostSPs.map(
                                        (dost, index) => (
                                            <span
                                                key={index}
                                                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 ${
                                                    index === 0
                                                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
                                                        : "bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50"
                                                }`}
                                            >
                                                {dost}
                                            </span>
                                        )
                                    )
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        No DOST Programs specified
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Research Details */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900">
                                Research Details
                            </h4>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 rounded-xl border border-yellow-200/50">
                                <span className="font-bold text-gray-800 text-sm">
                                    DESCRIPTION
                                </span>
                                <p className="text-gray-700 mt-2 leading-relaxed">
                                    {transformedProposal.abstract}
                                </p>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-200/50">
                                <span className="font-bold text-gray-800 text-sm">
                                    OBJECTIVES
                                </span>
                                <ul className="text-gray-700 mt-2 leading-relaxed list-disc list-inside space-y-1">
                                    {transformedProposal.objectives.map(
                                        (objective, index) => (
                                            <li key={index}>{objective}</li>
                                        )
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {[
                                "overview",
                                "budget",
                                "timeline",
                                "reviewers",
                                "attachments",
                            ].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                                        activeTab === tab
                                            ? "border-red-500 text-red-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                            Principal Investigator
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <BiUser className="mr-2 text-gray-400" />
                                                <span className="text-gray-900">
                                                    {transformedProposal.author}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <BiEnvelope className="mr-2 text-gray-400" />
                                                <span className="text-gray-900">
                                                    {transformedProposal.email}
                                                </span>
                                            </div>
                                            <div className="text-gray-600">
                                                {transformedProposal.college}
                                            </div>
                                            <div className="text-gray-600">
                                                {transformedProposal.department}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                            Project Information
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center">
                                                <BiDollar className="mr-2 text-gray-400" />
                                                <span className="text-gray-900">
                                                    {transformedProposal.budget}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <BiCalendar className="mr-2 text-gray-400" />
                                                <span className="text-gray-900">
                                                    {
                                                        transformedProposal.duration
                                                    }
                                                </span>
                                            </div>
                                            <div className="text-gray-600">
                                                Start:{" "}
                                                {transformedProposal.startDate}
                                            </div>
                                            <div className="text-gray-600">
                                                End:{" "}
                                                {transformedProposal.endDate}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Abstract
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {transformedProposal.abstract}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Objectives
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                                        {transformedProposal.objectives.map(
                                            (objective, index) => (
                                                <li key={index}>{objective}</li>
                                            )
                                        )}
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Methodology
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        {transformedProposal.methodology}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Expected Outcomes
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                                        {transformedProposal.expectedOutcomes.map(
                                            (outcome, index) => (
                                                <li key={index}>{outcome}</li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Budget Tab */}
                        {activeTab === "budget" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Budget Breakdown
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="space-y-4">
                                        {Object.entries(
                                            transformedProposal.budgetBreakdown
                                        ).map(([category, amount]) => (
                                            <div
                                                key={category}
                                                className="flex justify-between items-center"
                                            >
                                                <span className="text-gray-700 capitalize">
                                                    {category.replace(
                                                        /([A-Z])/g,
                                                        " $1"
                                                    )}
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    {amount}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Timeline Tab */}
                        {activeTab === "timeline" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Project Timeline
                                </h3>
                                <div className="space-y-4">
                                    {transformedProposal.timeline.map(
                                        (phase, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 mb-1">
                                                        {phase.phase}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {phase.displayDate ||
                                                            formatDateRange(
                                                                phase.start,
                                                                phase.end
                                                            )}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                                                        phase.status
                                                    )}`}
                                                >
                                                    {phase.status}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Reviewers Tab */}
                        {activeTab === "reviewers" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Reviewers
                                </h3>
                                {transformedProposal.reviewers.length > 0 ? (
                                    <div className="space-y-4">
                                        {transformedProposal.reviewers.map(
                                            (reviewer, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 border border-gray-200 rounded-lg"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-semibold text-gray-900">
                                                            {reviewer.name}
                                                        </h4>
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                                                                reviewer.status
                                                            )}`}
                                                        >
                                                            {reviewer.status}
                                                        </span>
                                                    </div>
                                                    {reviewer.reviewedAt && (
                                                        <p className="text-xs text-gray-500 mb-2">
                                                            Reviewed on:{" "}
                                                            {
                                                                reviewer.reviewedAt
                                                            }
                                                        </p>
                                                    )}
                                                    {reviewer.comments && (
                                                        <p className="text-gray-700 text-sm">
                                                            {reviewer.comments}
                                                        </p>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                        <p className="text-gray-600">
                                            No reviews have been submitted yet.
                                        </p>
                                    </div>
                                )}

                                {/* Review Form */}
                                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                        Submit Review
                                    </h4>
                                    <form
                                        onSubmit={handleReviewSubmit}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Review Decision
                                            </label>
                                            <select
                                                value={reviewDecision}
                                                onChange={(e) =>
                                                    setReviewDecision(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                required
                                            >
                                                <option value="">
                                                    Select decision...
                                                </option>
                                                <option value="approve">
                                                    Approve
                                                </option>
                                                <option value="approve_with_conditions">
                                                    Approve with Conditions
                                                </option>
                                                <option value="reject">
                                                    Reject
                                                </option>
                                                <option value="request_revision">
                                                    Request Revision
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Comments
                                            </label>
                                            <textarea
                                                value={reviewComments}
                                                onChange={(e) =>
                                                    setReviewComments(
                                                        e.target.value
                                                    )
                                                }
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                                placeholder="Provide detailed feedback..."
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                                            >
                                                <BiCheck className="text-sm" />
                                                Submit Review
                                            </button>
                                            <button
                                                type="button"
                                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                            >
                                                <BiX className="text-sm" />
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Attachments Tab */}
                        {activeTab === "attachments" && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Attachments
                                </h3>
                                {transformedProposal.attachments.length > 0 ? (
                                    <div className="space-y-3">
                                        {transformedProposal.attachments.map(
                                            (file, index) => (
                                                <div
                                                    key={file.fileID || index}
                                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center flex-1">
                                                        <BiFile className="mr-3 text-gray-400" />
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900">
                                                                {file.name}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {file.type} •{" "}
                                                                {file.size}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {file.filePath && (
                                                            <button
                                                                onClick={() =>
                                                                    handleDocumentClick(
                                                                        file
                                                                    )
                                                                }
                                                                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
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
                                                        )}
                                                        {file.filePath && (
                                                            <a
                                                                href={
                                                                    file.filePath
                                                                }
                                                                download
                                                                className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                                            >
                                                                <BiDownload className="text-sm" />
                                                                Download
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                        <svg
                                            className="w-12 h-12 text-gray-400 mx-auto mb-3"
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
                                        <p className="text-gray-600 font-medium">
                                            No attachments found
                                        </p>
                                        <p className="text-gray-500 text-sm mt-1">
                                            Files will appear here once they are
                                            uploaded.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-8">
                    <button className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
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
                        Edit Proposal
                    </button>
                    <button
                        onClick={() => setActiveTab("reviewers")}
                        className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
                        Review Proposal
                    </button>
                </div>
            </div>

            {/* PDF Viewer */}
            {conceptPaperPath && (
                <div className="mb-8">
                    <PDFViewer
                        pdfPath={conceptPaperPath}
                        title="Concept Paper"
                    />
                </div>
            )}

            {/* Document Modal */}
            {showDocumentModal && <DocumentModal />}
        </div>
    );
};

RDDProposalDetail.layout = (page) => (
    <RoleBasedLayout roleName="Research & Development Division">
        {page}
    </RoleBasedLayout>
);

export default RDDProposalDetail;
