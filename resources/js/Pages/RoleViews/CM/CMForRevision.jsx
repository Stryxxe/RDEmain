import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useMessages } from "../../../contexts/MessageContext";
import {
    RefreshCw,
    Eye,
    X,
    FileText,
    DollarSign,
    FileCheck,
    MessageSquare,
    Target,
    BookOpen,
    Globe,
    File,
    Download,
    ExternalLink,
} from "lucide-react";
import { BiSearch } from "react-icons/bi";
import axios from "axios";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";
import Breadcrumbs from "../../../Components/Breadcrumbs";

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const CMForRevision = () => {
    const { user } = useAuth();
    const { refreshAllNotifications } = useNotifications();
    const { refreshAllMessages } = useMessages();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [proposalDetails, setProposalDetails] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchProposals();

        // Refresh proposals every 30 seconds to catch updates
        const interval = setInterval(() => {
            fetchProposals();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Refresh data when page becomes visible (user navigates back to For Revision page)
    // This ensures final endorsed proposals are removed when user returns to this page
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Page became visible - refresh data to ensure final endorsed proposals are removed
                fetchProposals();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, []);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            // Fetch proposals with statusID 4 (For Revision) from CM's research center
            // Add cache-busting parameter to ensure fresh data
            const response = await axiosInstance.get(
                "/proposals/cm-for-revision",
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                    params: {
                        _t: Date.now(), // Cache-busting timestamp
                    },
                }
            );

            if (response.data.success) {
                setProposals(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching proposals for revision:", error);
            if (error.response?.status === 401) {
                console.error("Unauthorized - session may have expired");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await Promise.all([
                fetchProposals(),
                refreshAllNotifications(),
                refreshAllMessages(),
            ]);
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleViewClick = async (proposal) => {
        try {
            setLoadingDetails(true);
            setSelectedProposal(proposal);

            // Fetch full proposal details with force_refresh to bypass cache
            // Add cache-busting timestamp to ensure we get the latest files
            const response = await axiosInstance.get(
                `/proposals/${proposal.proposalID || proposal.id}`,
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                    params: {
                        force_refresh: true,
                        _t: Date.now(), // Additional cache-busting
                    },
                }
            );

            if (response.data.success) {
                const fullProposal = response.data.data;
                setProposalDetails(fullProposal);

                // Debug logging
                console.log("Full proposal files:", {
                    filesCount: fullProposal.files?.length || 0,
                    files: fullProposal.files,
                    fileTypes: fullProposal.files?.map((f) => f.fileType) || [],
                });

                setShowModal(true);
            }
        } catch (error) {
            console.error("Error fetching proposal details:", error);
            window.customAlert?.(
                "Error",
                "Failed to load proposal details.",
                3000
            );
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProposal(null);
        setProposalDetails(null);
    };

    const handleAccept = async () => {
        if (!selectedProposal || !proposalDetails) {
            return;
        }

        // Only allow Accept if status is "Updated" (resubmittedAfterRevision is not null)
        if (!proposalDetails.resubmittedAfterRevision) {
            window.customAlert?.(
                "Error",
                "Proposal must be updated by the proponent before it can be accepted.",
                3000
            );
            return;
        }

        // IMPORTANT: Accept button should NOT create an endorsement
        // It should only redirect to Endorsement page for final checking
        // The actual endorsement will happen in the Endorsement page

        try {
            // Store the proposal data in localStorage for the Endorsement page
            // This allows the endorsement page to pre-load the proposal for final review
            localStorage.setItem(
                "selectedProjectForEndorsement",
                JSON.stringify(proposalDetails)
            );

            // Close the modal
            handleCloseModal();

            // Show success message
            window.customAlert?.(
                "",
                "Redirecting to Endorsement page for final review...",
                2000
            );

            // Redirect to Endorsement View Details page for final checking
            // The proposal will appear in Endorsement view and be automatically selected for viewing
            // After final endorsement on that page, the proposal will be forwarded to RDD
            setTimeout(() => {
                router.visit("/cm/review-proposal", { replace: true });
            }, 2000);
        } catch (error) {
            console.error("Error accepting proposal:", error);
            window.customAlert?.(
                "Error",
                "Failed to redirect. Please try again.",
                3000
            );
        }
    };

    const filteredProposals = proposals.filter((proposal) => {
        // CRITICAL: Exclude ANY proposal where the CM has endorsed
        // Once CM endorses a proposal, it should not appear in ForRevision page
        const endorsements = proposal.endorsements || [];
        if (Array.isArray(endorsements) && user?.userID) {
            const currentUserID = String(user.userID);
            const cmEndorsements = endorsements.filter((endorsement) => {
                const endorserID = endorsement?.endorserID
                    ? String(endorsement.endorserID)
                    : null;
                const status = endorsement?.endorsementStatus;
                return endorserID === currentUserID && status === "approved";
            });

            // If CM has endorsed even once, exclude from ForRevision page
            if (cmEndorsements.length >= 1) {
                return false;
            }
        }

        // Apply search filter
        const term = searchTerm.toLowerCase();
        const title = (proposal.researchTitle || "").toLowerCase();
        const author = (proposal.user?.fullName || "").toLowerCase();
        const id = (proposal.proposalID || proposal.id || "").toString();
        return (
            title.includes(term) || author.includes(term) || id.includes(term)
        );
    });

    // Group files by type
    const getFilesByType = (files, type) => {
        if (!files || !Array.isArray(files)) return [];
        return files.filter(
            (file) => file.fileType?.toLowerCase() === type.toLowerCase()
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading proposals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <Breadcrumbs items={[{ label: "For Revision", href: null }]} />

            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                        Proposals For Revision
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-6">
                        Review and endorse proposals that have been resubmitted
                        after revision.
                    </p>

                    {/* Manual Refresh Button */}
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh proposals and notifications"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    isRefreshing ? "animate-spin" : ""
                                }`}
                            />
                            <span>
                                {isRefreshing ? "Refreshing..." : "Refresh"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Search Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <BiSearch className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search proposals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Proposals Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Proposals For Revision
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {filteredProposals.length} record(s) found
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        No
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Author
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date Resubmitted
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredProposals.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-8 text-center text-gray-500"
                                        >
                                            No proposals found for revision
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProposals.map((proposal, index) => {
                                        // Determine status: "In Progress" if resubmittedAfterRevision is null, "Updated" if not null
                                        const status =
                                            proposal.resubmittedAfterRevision
                                                ? "Updated"
                                                : "In Progress";

                                        return (
                                            <tr
                                                key={
                                                    proposal.proposalID ||
                                                    proposal.id
                                                }
                                                className="hover:bg-red-50 transition-colors duration-150"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                                                        {String(
                                                            index + 1
                                                        ).padStart(2, "0")}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div
                                                        className="text-sm font-medium text-gray-900 max-w-sm truncate"
                                                        title={
                                                            proposal.researchTitle
                                                        }
                                                    >
                                                        {proposal.researchTitle}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-700">
                                                        {proposal.user
                                                            ?.fullName ||
                                                            "Unknown"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            status === "Updated"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    >
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-700">
                                                        {proposal.resubmittedAfterRevision
                                                            ? new Date(
                                                                  proposal.resubmittedAfterRevision
                                                              ).toLocaleDateString()
                                                            : new Date(
                                                                  proposal.updatedAt ||
                                                                      proposal.created_at
                                                              ).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() =>
                                                            handleViewClick(
                                                                proposal
                                                            )
                                                        }
                                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />{" "}
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* View Details Modal */}
            {showModal && proposalDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-slideUp">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-red-600 via-red-650 to-red-700 text-white px-8 py-5 flex justify-between items-center z-10 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">
                                        Proposal Details
                                    </h2>
                                    <p className="text-xs text-red-100 mt-0.5">
                                        Review all proposal information and
                                        revision instructions
                                    </p>
                                </div>
                                {proposalDetails.resubmittedAfterRevision && (
                                    <span className="ml-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 shadow-sm animate-pulse">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        Updated
                                    </span>
                                )}
                                {!proposalDetails.resubmittedAfterRevision && (
                                    <span className="ml-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 shadow-sm">
                                        <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                                        In Progress
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-white hover:text-gray-200 transition-all p-2 hover:bg-red-800 rounded-lg hover:scale-110 active:scale-95"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-8 py-6 overflow-y-auto flex-1 bg-gradient-to-b from-gray-50 to-white">
                            {loadingDetails ? (
                                <div className="text-center py-16">
                                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-200 border-t-red-600 mx-auto"></div>
                                    <p className="mt-5 text-gray-600 font-medium text-lg">
                                        Loading proposal details...
                                    </p>
                                    <p className="mt-2 text-sm text-gray-400">
                                        Please wait while we fetch the latest
                                        information
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fadeIn">
                                    {/* Research Proposal File */}
                                    {(() => {
                                        const reportFiles = getFilesByType(
                                            proposalDetails.files,
                                            "report"
                                        );
                                        if (reportFiles.length > 0) {
                                            return (
                                                <div className="bg-white rounded-xl border-2 border-blue-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <FileText className="w-6 h-6 text-blue-600" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-900">
                                                            Research Proposal
                                                            File
                                                        </h3>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {reportFiles.map(
                                                            (file, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all group shadow-sm hover:shadow-md"
                                                                >
                                                                    <div className="p-2 bg-white rounded-lg group-hover:scale-110 transition-transform">
                                                                        <File className="w-5 h-5 text-blue-600" />
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-blue-800 group-hover:text-blue-900 flex-1 truncate">
                                                                        {
                                                                            file.fileName
                                                                        }
                                                                    </span>
                                                                    <a
                                                                        href={`/api/files/view?path=${encodeURIComponent(
                                                                            file.filePath
                                                                        )}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                        title="View file"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </a>
                                                                    <a
                                                                        href={`/api/files/view?path=${encodeURIComponent(
                                                                            file.filePath
                                                                        )}`}
                                                                        download
                                                                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                        title="Download file"
                                                                    >
                                                                        <Download className="w-4 h-4" />
                                                                    </a>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Basic Information Card */}
                                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
                                        <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-200">
                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                <FileText className="w-5 h-5 text-gray-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                Basic Information
                                            </h3>
                                        </div>
                                        <div className="space-y-5">
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                                    Research Title
                                                </label>
                                                <p className="text-gray-900 font-semibold text-lg leading-relaxed">
                                                    {
                                                        proposalDetails.researchTitle
                                                    }
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                                    Description
                                                </label>
                                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {proposalDetails.description || (
                                                        <span className="text-gray-400 italic">
                                                            No description
                                                            provided
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                                                    Objectives
                                                </label>
                                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {proposalDetails.objectives || (
                                                        <span className="text-gray-400 italic">
                                                            No objectives
                                                            provided
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submitting Researcher(s) */}
                                    {proposalDetails.proponents &&
                                        proposalDetails.proponents.length >
                                            0 && (
                                            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <FileText className="w-5 h-5 text-gray-600" />
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        Submitting Researcher(s)
                                                    </h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {proposalDetails.proponents.map(
                                                        (proponent, idx) => {
                                                            const isPrimarySubmitter =
                                                                proposalDetails.userID ===
                                                                (proponent.userID ||
                                                                    proponent.id);
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200"
                                                                >
                                                                    <div>
                                                                        <div className="text-gray-900 font-medium">
                                                                            {proponent.fullName ||
                                                                                `${
                                                                                    proponent.firstName ||
                                                                                    ""
                                                                                } ${
                                                                                    proponent.lastName ||
                                                                                    ""
                                                                                }`}
                                                                        </div>
                                                                        {proponent.projectRole && (
                                                                            <div className="text-xs text-gray-500 mt-1">
                                                                                {
                                                                                    proponent
                                                                                        .projectRole
                                                                                        .roleName
                                                                                }
                                                                            </div>
                                                                        )}
                                                                        {!proponent.projectRole &&
                                                                            proponent
                                                                                .pivot
                                                                                ?.projectRoleID && (
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    Project
                                                                                    Role
                                                                                    ID:{" "}
                                                                                    {
                                                                                        proponent
                                                                                            .pivot
                                                                                            .projectRoleID
                                                                                    }
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                    {isPrimarySubmitter && (
                                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                                                            Primary
                                                                            Submitter
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Research Agenda, DOST SPs, SDGs Grid */}
                                    {(proposalDetails.researchAgenda?.length >
                                        0 ||
                                        proposalDetails.dostSPs?.length > 0 ||
                                        proposalDetails
                                            .sustainableDevelopmentGoals
                                            ?.length > 0) && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Research Agenda */}
                                            {proposalDetails.researchAgenda &&
                                                Array.isArray(
                                                    proposalDetails.researchAgenda
                                                ) &&
                                                proposalDetails.researchAgenda
                                                    .length > 0 && (
                                                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <BookOpen className="w-5 h-5 text-purple-600" />
                                                            <h3 className="text-base font-semibold text-gray-900">
                                                                Research Agenda
                                                            </h3>
                                                        </div>
                                                        <ul className="space-y-2">
                                                            {proposalDetails.researchAgenda.map(
                                                                (
                                                                    agenda,
                                                                    idx
                                                                ) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="text-sm text-gray-700 flex items-start gap-2"
                                                                    >
                                                                        <span className="text-purple-600 mt-1">
                                                                            •
                                                                        </span>
                                                                        <span>
                                                                            {
                                                                                agenda
                                                                            }
                                                                        </span>
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}

                                            {/* DOST Strategic Programs */}
                                            {proposalDetails.dostSPs &&
                                                Array.isArray(
                                                    proposalDetails.dostSPs
                                                ) &&
                                                proposalDetails.dostSPs.length >
                                                    0 && (
                                                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Target className="w-5 h-5 text-indigo-600" />
                                                            <h3 className="text-base font-semibold text-gray-900">
                                                                DOST Strategic
                                                                Programs
                                                            </h3>
                                                        </div>
                                                        <ul className="space-y-2">
                                                            {proposalDetails.dostSPs.map(
                                                                (sp, idx) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="text-sm text-gray-700 flex items-start gap-2"
                                                                    >
                                                                        <span className="text-indigo-600 mt-1">
                                                                            •
                                                                        </span>
                                                                        <span>
                                                                            {sp}
                                                                        </span>
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}

                                            {/* Sustainable Development Goals */}
                                            {proposalDetails.sustainableDevelopmentGoals &&
                                                Array.isArray(
                                                    proposalDetails.sustainableDevelopmentGoals
                                                ) &&
                                                proposalDetails
                                                    .sustainableDevelopmentGoals
                                                    .length > 0 && (
                                                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Globe className="w-5 h-5 text-green-600" />
                                                            <h3 className="text-base font-semibold text-gray-900">
                                                                SDGs
                                                            </h3>
                                                        </div>
                                                        <ul className="space-y-2">
                                                            {proposalDetails.sustainableDevelopmentGoals.map(
                                                                (sdg, idx) => (
                                                                    <li
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="text-sm text-gray-700 flex items-start gap-2"
                                                                    >
                                                                        <span className="text-green-600 mt-1">
                                                                            •
                                                                        </span>
                                                                        <span>
                                                                            {
                                                                                sdg
                                                                            }
                                                                        </span>
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                        </div>
                                    )}

                                    {/* Proposed Budget */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className="w-4 h-4 text-gray-600" />
                                            <h3 className="text-sm font-semibold text-gray-700">
                                                Proposed Budget
                                            </h3>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">
                                            ₱
                                            {parseFloat(
                                                proposalDetails.proposedBudget ||
                                                    0
                                            ).toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>

                                    {/* Required Documents - SETI, GAD, MOC */}
                                    {(() => {
                                        // Check for both old and new file type naming conventions
                                        const setiFiles =
                                            proposalDetails.files?.filter(
                                                (f) =>
                                                    f.fileType?.toLowerCase() ===
                                                        "seti_scorecard" ||
                                                    f.fileType?.toLowerCase() ===
                                                        "seti" ||
                                                    f.fileType
                                                        ?.toLowerCase()
                                                        .includes("seti")
                                            ) || [];
                                        const gadFiles =
                                            proposalDetails.files?.filter(
                                                (f) =>
                                                    f.fileType?.toLowerCase() ===
                                                        "gad_certificate" ||
                                                    f.fileType?.toLowerCase() ===
                                                        "gad" ||
                                                    f.fileType
                                                        ?.toLowerCase()
                                                        .includes("gad")
                                            ) || [];
                                        const mocFiles =
                                            proposalDetails.files?.filter(
                                                (f) =>
                                                    f.fileType?.toLowerCase() ===
                                                        "matrix_compliance" ||
                                                    f.fileType?.toLowerCase() ===
                                                        "matrix_of_compliance" ||
                                                    f.fileType?.toLowerCase() ===
                                                        "moc" ||
                                                    f.fileType
                                                        ?.toLowerCase()
                                                        .includes("matrix") ||
                                                    f.fileType
                                                        ?.toLowerCase()
                                                        .includes("moc")
                                            ) || [];

                                        if (
                                            setiFiles.length > 0 ||
                                            gadFiles.length > 0 ||
                                            mocFiles.length > 0
                                        ) {
                                            return (
                                                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <FileCheck className="w-5 h-5 text-orange-600" />
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            Required Documents
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {setiFiles.length >
                                                            0 && (
                                                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                                <h4 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">
                                                                    SETI
                                                                    Scorecard
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    {setiFiles.map(
                                                                        (
                                                                            file,
                                                                            idx
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="flex items-center gap-2 p-2 bg-white hover:bg-blue-100 rounded border border-blue-200 transition-colors group"
                                                                            >
                                                                                <File className="w-4 h-4 text-blue-600" />
                                                                                <span className="text-xs text-blue-700 group-hover:text-blue-900 flex-1 truncate">
                                                                                    {
                                                                                        file.fileName
                                                                                    }
                                                                                </span>
                                                                                <a
                                                                                    href={`/api/files/view?path=${encodeURIComponent(
                                                                                        file.filePath
                                                                                    )}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                                    title="View file"
                                                                                >
                                                                                    <Eye className="w-3 h-3" />
                                                                                </a>
                                                                                <a
                                                                                    href={`/api/files/view?path=${encodeURIComponent(
                                                                                        file.filePath
                                                                                    )}`}
                                                                                    download
                                                                                    className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                                    title="Download file"
                                                                                >
                                                                                    <Download className="w-3 h-3" />
                                                                                </a>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {gadFiles.length >
                                                            0 && (
                                                            <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                                                                <h4 className="text-sm font-semibold text-pink-900 mb-3 uppercase tracking-wide">
                                                                    GAD
                                                                    Certificate
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    {gadFiles.map(
                                                                        (
                                                                            file,
                                                                            idx
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="flex items-center gap-2 p-2 bg-white hover:bg-pink-100 rounded border border-pink-200 transition-colors group"
                                                                            >
                                                                                <File className="w-4 h-4 text-pink-600" />
                                                                                <span className="text-xs text-pink-700 group-hover:text-pink-900 flex-1 truncate">
                                                                                    {
                                                                                        file.fileName
                                                                                    }
                                                                                </span>
                                                                                <a
                                                                                    href={`/api/files/view?path=${encodeURIComponent(
                                                                                        file.filePath
                                                                                    )}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="p-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                                    title="View file"
                                                                                >
                                                                                    <Eye className="w-3 h-3" />
                                                                                </a>
                                                                                <a
                                                                                    href={`/api/files/view?path=${encodeURIComponent(
                                                                                        file.filePath
                                                                                    )}`}
                                                                                    download
                                                                                    className="p-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                                    title="Download file"
                                                                                >
                                                                                    <Download className="w-3 h-3" />
                                                                                </a>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {mocFiles.length >
                                                            0 && (
                                                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                                                <h4 className="text-sm font-semibold text-amber-900 mb-3 uppercase tracking-wide">
                                                                    Matrix of
                                                                    Compliance
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    {mocFiles.map(
                                                                        (
                                                                            file,
                                                                            idx
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    idx
                                                                                }
                                                                                className="flex items-center gap-2 p-2 bg-white hover:bg-amber-100 rounded border border-amber-200 transition-colors group"
                                                                            >
                                                                                <File className="w-4 h-4 text-amber-600" />
                                                                                <span className="text-xs text-amber-700 group-hover:text-amber-900 flex-1 truncate">
                                                                                    {
                                                                                        file.fileName
                                                                                    }
                                                                                </span>
                                                                                <a
                                                                                    href={`/api/files/view?path=${encodeURIComponent(
                                                                                        file.filePath
                                                                                    )}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="p-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                                    title="View file"
                                                                                >
                                                                                    <Eye className="w-3 h-3" />
                                                                                </a>
                                                                                <a
                                                                                    href={`/api/files/view?path=${encodeURIComponent(
                                                                                        file.filePath
                                                                                    )}`}
                                                                                    download
                                                                                    className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                                    title="Download file"
                                                                                >
                                                                                    <Download className="w-3 h-3" />
                                                                                </a>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Other Supporting Documents */}
                                    {(() => {
                                        // Get all files that are not report, seti, gad, or moc
                                        const excludedTypes = [
                                            "report",
                                            "seti",
                                            "gad",
                                            "moc",
                                            "seti_scorecard",
                                            "gad_certificate",
                                            "matrix_compliance",
                                            "matrix_of_compliance",
                                            "concept_paper",
                                            "updated_form",
                                        ];
                                        const supportingFiles =
                                            proposalDetails.files?.filter(
                                                (f) => {
                                                    const fileType =
                                                        f.fileType?.toLowerCase() ||
                                                        "";
                                                    return !excludedTypes.some(
                                                        (excluded) =>
                                                            fileType.includes(
                                                                excluded
                                                            )
                                                    );
                                                }
                                            ) || [];

                                        if (supportingFiles.length > 0) {
                                            return (
                                                <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <FileText className="w-5 h-5 text-gray-600" />
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            Other Supporting
                                                            Documents
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {supportingFiles.map(
                                                            (file, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
                                                                >
                                                                    <File className="w-5 h-5 text-gray-600" />
                                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1 truncate">
                                                                        {
                                                                            file.fileName
                                                                        }
                                                                    </span>
                                                                    <a
                                                                        href={`/api/files/view?path=${encodeURIComponent(
                                                                            file.filePath
                                                                        )}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                        title="View file"
                                                                    >
                                                                        <Eye className="w-4 h-4" />
                                                                    </a>
                                                                    <a
                                                                        href={`/api/files/view?path=${encodeURIComponent(
                                                                            file.filePath
                                                                        )}`}
                                                                        download
                                                                        className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
                                                                        title="Download file"
                                                                    >
                                                                        <Download className="w-4 h-4" />
                                                                    </a>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* CM's Revision Comments - Always show at bottom */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MessageSquare className="w-4 h-4 text-gray-600" />
                                            <h3 className="text-sm font-semibold text-gray-700">
                                                Your Revision Comments/Notes
                                            </h3>
                                        </div>
                                        <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                                            {proposalDetails.revisionComments ? (
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {
                                                        proposalDetails.revisionComments
                                                    }
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-400 italic">
                                                    No revision comments were
                                                    provided when this proposal
                                                    was marked for revision.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {!loadingDetails && (
                            <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-white border-t-2 border-gray-300 px-8 py-5 flex justify-between items-center shadow-2xl">
                                <div className="flex items-center gap-3">
                                    {proposalDetails.resubmittedAfterRevision ? (
                                        <>
                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">
                                                    Proposal Updated & Ready
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Proponent has resubmitted
                                                    the revised proposal
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">
                                                    Awaiting Resubmission
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Waiting for proponent to
                                                    resubmit the revised
                                                    proposal
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
                                    >
                                        Close
                                    </button>
                                    {/* Only show Accept button when status is "Updated" (resubmittedAfterRevision is not null) */}
                                    {proposalDetails.resubmittedAfterRevision && (
                                        <button
                                            onClick={handleAccept}
                                            className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-600 via-green-600 to-green-700 rounded-xl hover:from-green-700 hover:via-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
                                        >
                                            ✓ Accept
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

CMForRevision.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Center Manager">{page}</RoleBasedLayout>
    </AppLayout>
);

export default CMForRevision;
