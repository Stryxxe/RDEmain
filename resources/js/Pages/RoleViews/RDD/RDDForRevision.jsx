import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useMessages } from "../../../contexts/MessageContext";
import { RefreshCw, Eye, X, FileText, Image as ImageIcon } from "lucide-react";
import { BiSearch } from "react-icons/bi";
import axios from "axios";
import AppLayout from "../../../Components/Layouts/AppLayout";
import RDDLayout from "../../../Components/Layouts/RDDLayout";
import Breadcrumbs from "../../../Components/Breadcrumbs";

const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const RDDForRevision = () => {
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

    // Helper function to check if a file is a research proposal file
    // IMPORTANT: Only check fileType, NOT filename keywords to avoid false positives
    // Supporting documents with names like "research_support.pdf" should NOT be classified as research proposals
    const isResearchProposalFile = (file) => {
        if (!file) return false;
        const fileType = file.fileType?.toLowerCase() || "";
        // Only match specific file types that are research proposals
        return fileType === "concept_paper" || fileType === "report";
    };

    // Handle document click for viewing
    const handleDocumentClick = (document) => {
        if (document.filePath) {
            const fileUrl = `/storage/${document.filePath}`;
            window.open(fileUrl, "_blank", "noopener");
        }
    };

    useEffect(() => {
        fetchProposals();

        // Refresh proposals every 30 seconds to catch updates
        const interval = setInterval(() => {
            fetchProposals();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Refresh data when page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
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
            const response = await axiosInstance.get(
                "/proposals/rdd-for-revision",
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                    params: {
                        _t: Date.now(), // Cache-busting
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
            setTimeout(() => {
                router.visit(
                    `/rdd/review-proposal/${
                        proposalDetails.proposalID || proposalDetails.id
                    }`,
                    { replace: true }
                );
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
        const term = searchTerm.toLowerCase();
        const title = (proposal.researchTitle || "").toLowerCase();
        const author = (proposal.user?.fullName || "").toLowerCase();
        return title.includes(term) || author.includes(term);
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading proposals...</p>
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
                                        // Determine status: "In Progress" if resubmittedAfterRevision is null or empty, "Updated" if not null
                                        // When RDD marks for revision, resubmittedAfterRevision should be null
                                        // When proponent resubmits, resubmittedAfterRevision is set
                                        const status =
                                            proposal.resubmittedAfterRevision &&
                                            proposal.resubmittedAfterRevision !==
                                                null &&
                                            proposal.resubmittedAfterRevision !==
                                                ""
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
                                                        {proposal.resubmittedAfterRevision ? (
                                                            <>
                                                                {new Date(
                                                                    proposal.resubmittedAfterRevision
                                                                ).toLocaleDateString(
                                                                    "en-US",
                                                                    {
                                                                        year: "numeric",
                                                                        month: "2-digit",
                                                                        day: "2-digit",
                                                                    }
                                                                )}{" "}
                                                                at{" "}
                                                                {new Date(
                                                                    proposal.resubmittedAfterRevision
                                                                ).toLocaleTimeString(
                                                                    "en-US",
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                        hour12: true,
                                                                    }
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {new Date(
                                                                    proposal.updatedAt ||
                                                                        proposal.created_at
                                                                ).toLocaleDateString(
                                                                    "en-US",
                                                                    {
                                                                        year: "numeric",
                                                                        month: "2-digit",
                                                                        day: "2-digit",
                                                                    }
                                                                )}{" "}
                                                                at{" "}
                                                                {new Date(
                                                                    proposal.updatedAt ||
                                                                        proposal.created_at
                                                                ).toLocaleTimeString(
                                                                    "en-US",
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                        hour12: true,
                                                                    }
                                                                )}
                                                            </>
                                                        )}
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
                                    {/* Basic Information - Title and Author Only */}
                                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                                            {proposalDetails.researchTitle}
                                        </h3>
                                        <div className="text-sm text-gray-700">
                                            <p>
                                                <span className="font-semibold">
                                                    Author:
                                                </span>{" "}
                                                {proposalDetails.user
                                                    ?.fullName || "Unknown"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description and Objectives - Separate Container */}
                                    {(proposalDetails.description ||
                                        proposalDetails.objectives) && (
                                        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
                                            <div className="space-y-4">
                                                {proposalDetails.description && (
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                                                            Description
                                                        </h4>
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {
                                                                proposalDetails.description
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                                {proposalDetails.objectives && (
                                                    <div>
                                                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                                                            Objectives
                                                        </h4>
                                                        <p className="text-sm text-gray-700 leading-relaxed">
                                                            {
                                                                proposalDetails.objectives
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Checklist Section - RDE Agenda, DOST 6Ps, SDG Goals, Proposed Budget */}
                                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">
                                            Checklist
                                        </h3>
                                        <div className="space-y-6">
                                            {/* RDE Agenda */}
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
                                                        RDE Agenda
                                                    </h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {proposalDetails?.researchAgenda &&
                                                    Array.isArray(
                                                        proposalDetails.researchAgenda
                                                    ) &&
                                                    proposalDetails
                                                        .researchAgenda.length >
                                                        0 ? (
                                                        proposalDetails.researchAgenda.map(
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
                                                        <p className="text-sm text-gray-500">
                                                            No RDE Agenda
                                                            selected
                                                        </p>
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
                                                    {proposalDetails?.dostSPs &&
                                                    Array.isArray(
                                                        proposalDetails.dostSPs
                                                    ) &&
                                                    proposalDetails.dostSPs
                                                        .length > 0 ? (
                                                        proposalDetails.dostSPs.map(
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
                                                        <p className="text-sm text-gray-500">
                                                            No DOST SPs selected
                                                        </p>
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
                                                        Sustainable Development
                                                        Goals
                                                    </h4>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {proposalDetails?.sustainableDevelopmentGoals &&
                                                    Array.isArray(
                                                        proposalDetails.sustainableDevelopmentGoals
                                                    ) &&
                                                    proposalDetails
                                                        .sustainableDevelopmentGoals
                                                        .length > 0 ? (
                                                        proposalDetails.sustainableDevelopmentGoals.map(
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
                                                        <p className="text-sm text-gray-500">
                                                            No SDG Goals
                                                            selected
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Proposed Budget */}
                                            <div className="border-l-4 border-amber-500 pl-6 py-2">
                                                <div className="flex items-center mb-3">
                                                    <svg
                                                        className="w-5 h-5 text-amber-600 mr-2"
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
                                                    <h4 className="text-lg font-bold text-gray-900">
                                                        Proposed Budget
                                                    </h4>
                                                </div>
                                                <div>
                                                    {proposalDetails?.proposedBudget ? (
                                                        <p className="text-2xl font-bold text-amber-700">
                                                            ₱
                                                            {Number(
                                                                proposalDetails.proposedBudget
                                                            ).toLocaleString()}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">
                                                            No budget specified
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Revision Images/Attachments */}
                                    {(() => {
                                        const revisionImages =
                                            proposalDetails.files?.filter(
                                                (f) =>
                                                    f.fileType?.toLowerCase() ===
                                                    "revision_image"
                                            ) || [];

                                        if (revisionImages.length > 0) {
                                            return (
                                                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <ImageIcon className="w-5 h-5 text-blue-600" />
                                                        <h3 className="text-lg font-bold text-gray-900">
                                                            Revision Attachments
                                                        </h3>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        {revisionImages.map(
                                                            (file, idx) => {
                                                                const isImage =
                                                                    file.fileName
                                                                        ?.toLowerCase()
                                                                        .match(
                                                                            /\.(jpg|jpeg|png|gif|webp)$/
                                                                        );
                                                                const fileUrl = `/api/files/view?path=${encodeURIComponent(
                                                                    file.filePath
                                                                )}`;

                                                                return (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="relative group"
                                                                    >
                                                                        {isImage ? (
                                                                            <a
                                                                                href={
                                                                                    fileUrl
                                                                                }
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="block"
                                                                            >
                                                                                <img
                                                                                    src={
                                                                                        fileUrl
                                                                                    }
                                                                                    alt={
                                                                                        file.fileName ||
                                                                                        `Revision image ${
                                                                                            idx +
                                                                                            1
                                                                                        }`
                                                                                    }
                                                                                    className="w-full h-32 object-cover rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                                                                />
                                                                            </a>
                                                                        ) : (
                                                                            <div className="w-full h-32 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-all flex items-center justify-center p-3">
                                                                                <div className="text-center">
                                                                                    <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                                                                    <p className="text-xs text-gray-700 truncate">
                                                                                        {file.fileName ||
                                                                                            `File ${
                                                                                                idx +
                                                                                                1
                                                                                            }`}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        <a
                                                                            href={
                                                                                fileUrl
                                                                            }
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="absolute top-2 right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                            title="View file"
                                                                        >
                                                                            <Eye className="w-3 h-3" />
                                                                        </a>
                                                                        {file.fileName && (
                                                                            <p className="text-xs text-gray-600 mt-2 truncate text-center">
                                                                                {
                                                                                    file.fileName
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Research Proposal Section */}
                                    {(() => {
                                        const researchProposalFiles =
                                            proposalDetails?.files?.filter(
                                                (f) => {
                                                    if (!f.filePath)
                                                        return false;
                                                    return isResearchProposalFile(
                                                        f
                                                    );
                                                }
                                            ) || [];

                                        if (
                                            researchProposalFiles.length === 0
                                        ) {
                                            return null;
                                        }

                                        return (
                                            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
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
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900">
                                                                Research
                                                                Proposal
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                Main research
                                                                document
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                                        {
                                                            researchProposalFiles.length
                                                        }{" "}
                                                        file
                                                        {researchProposalFiles.length !==
                                                        1
                                                            ? "s"
                                                            : ""}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {researchProposalFiles.map(
                                                        (file, index) => {
                                                            const fileUrl = `/storage/${file.filePath}`;
                                                            return (
                                                                <div
                                                                    key={
                                                                        file.fileID ||
                                                                        index
                                                                    }
                                                                    className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 border border-gray-200"
                                                                >
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="flex-1 min-w-0">
                                                                            <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
                                                                                {
                                                                                    file.fileName
                                                                                }
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
                                    {(() => {
                                        const attachedDocuments =
                                            proposalDetails?.files?.map(
                                                (f) => ({
                                                    ...f,
                                                    pdfPath: `/storage/${f.filePath}`,
                                                })
                                            ) || [];
                                        const supportingDocs =
                                            attachedDocuments.filter((d) =>
                                                [
                                                    "seti_scorecard",
                                                    "gad_certificate",
                                                    "matrix_compliance",
                                                ].includes(d.fileType)
                                            );

                                        if (supportingDocs.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
                                                <div className="flex items-center mb-6">
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
                                                    <h3 className="text-xl font-bold text-gray-900">
                                                        Supporting Documents
                                                    </h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* SETI */}
                                                    {supportingDocs.filter(
                                                        (d) =>
                                                            d.fileType ===
                                                            "seti_scorecard"
                                                    ).length > 0 && (
                                                        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="text-base font-bold text-blue-900">
                                                                    SETI
                                                                </h4>
                                                                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                                    {
                                                                        supportingDocs.filter(
                                                                            (
                                                                                d
                                                                            ) =>
                                                                                d.fileType ===
                                                                                "seti_scorecard"
                                                                        ).length
                                                                    }{" "}
                                                                    file
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-4">
                                                                Science and
                                                                Engineering
                                                                Technology
                                                                Initiative
                                                            </p>
                                                            {supportingDocs
                                                                .filter(
                                                                    (d) =>
                                                                        d.fileType ===
                                                                        "seti_scorecard"
                                                                )
                                                                .map(
                                                                    (
                                                                        doc,
                                                                        idx
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="p-4 bg-gray-50 rounded-lg mb-3"
                                                                        >
                                                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                                                {
                                                                                    doc.fileName
                                                                                }
                                                                            </p>
                                                                            {doc.fileSize && (
                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                    {(
                                                                                        doc.fileSize /
                                                                                        1024
                                                                                    ).toFixed(
                                                                                        0
                                                                                    )}{" "}
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
                                                                                    <Eye className="w-4 h-4 mr-1" />
                                                                                    View
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const link =
                                                                                            document.createElement(
                                                                                                "a"
                                                                                            );
                                                                                        link.href =
                                                                                            doc.pdfPath;
                                                                                        link.download =
                                                                                            doc.fileName;
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
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
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
                                                    )}

                                                    {/* GAD */}
                                                    {supportingDocs.filter(
                                                        (d) =>
                                                            d.fileType ===
                                                            "gad_certificate"
                                                    ).length > 0 && (
                                                        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="text-base font-bold text-green-900">
                                                                    GAD
                                                                </h4>
                                                                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                                    {
                                                                        supportingDocs.filter(
                                                                            (
                                                                                d
                                                                            ) =>
                                                                                d.fileType ===
                                                                                "gad_certificate"
                                                                        ).length
                                                                    }{" "}
                                                                    file
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-4">
                                                                Gender and
                                                                Development
                                                            </p>
                                                            {supportingDocs
                                                                .filter(
                                                                    (d) =>
                                                                        d.fileType ===
                                                                        "gad_certificate"
                                                                )
                                                                .map(
                                                                    (
                                                                        doc,
                                                                        idx
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="p-4 bg-gray-50 rounded-lg mb-3"
                                                                        >
                                                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                                                {
                                                                                    doc.fileName
                                                                                }
                                                                            </p>
                                                                            {doc.fileSize && (
                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                    {(
                                                                                        doc.fileSize /
                                                                                        1024
                                                                                    ).toFixed(
                                                                                        0
                                                                                    )}{" "}
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
                                                                                    <Eye className="w-4 h-4 mr-1" />
                                                                                    View
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const link =
                                                                                            document.createElement(
                                                                                                "a"
                                                                                            );
                                                                                        link.href =
                                                                                            doc.pdfPath;
                                                                                        link.download =
                                                                                            doc.fileName;
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
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
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
                                                    )}

                                                    {/* MOC */}
                                                    {supportingDocs.filter(
                                                        (d) =>
                                                            d.fileType ===
                                                            "matrix_compliance"
                                                    ).length > 0 && (
                                                        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="text-base font-bold text-amber-900">
                                                                    MOC
                                                                </h4>
                                                                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                                    {
                                                                        supportingDocs.filter(
                                                                            (
                                                                                d
                                                                            ) =>
                                                                                d.fileType ===
                                                                                "matrix_compliance"
                                                                        ).length
                                                                    }{" "}
                                                                    file
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-4">
                                                                Matrix of
                                                                Compliance
                                                            </p>
                                                            {supportingDocs
                                                                .filter(
                                                                    (d) =>
                                                                        d.fileType ===
                                                                        "matrix_compliance"
                                                                )
                                                                .map(
                                                                    (
                                                                        doc,
                                                                        idx
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="p-4 bg-gray-50 rounded-lg mb-3"
                                                                        >
                                                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                                                {
                                                                                    doc.fileName
                                                                                }
                                                                            </p>
                                                                            {doc.fileSize && (
                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                    {(
                                                                                        doc.fileSize /
                                                                                        1024
                                                                                    ).toFixed(
                                                                                        0
                                                                                    )}{" "}
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
                                                                                    <Eye className="w-4 h-4 mr-1" />
                                                                                    View
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const link =
                                                                                            document.createElement(
                                                                                                "a"
                                                                                            );
                                                                                        link.href =
                                                                                            doc.pdfPath;
                                                                                        link.download =
                                                                                            doc.fileName;
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
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
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
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Other Supporting Documents */}
                                    {(() => {
                                        const attachedDocuments =
                                            proposalDetails?.files?.map(
                                                (f) => ({
                                                    ...f,
                                                    pdfPath: `/storage/${f.filePath}`,
                                                })
                                            ) || [];
                                        const otherSupportingDocs =
                                            attachedDocuments.filter((d) => {
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
                                                // Exclude research proposal files
                                                if (isResearchProposalFile(d)) {
                                                    return false;
                                                }
                                                // Exclude revision images
                                                if (
                                                    d.fileType?.toLowerCase() ===
                                                    "revision_image"
                                                ) {
                                                    return false;
                                                }
                                                // Include all other files
                                                return true;
                                            });

                                        if (otherSupportingDocs.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
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
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold text-gray-900">
                                                                Other Supporting
                                                                Documents
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                Additional files
                                                                and attachments
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                                                        {
                                                            otherSupportingDocs.length
                                                        }{" "}
                                                        file
                                                        {otherSupportingDocs.length !==
                                                        1
                                                            ? "s"
                                                            : ""}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {otherSupportingDocs.map(
                                                        (document, index) => (
                                                            <div
                                                                key={index}
                                                                className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                                                            >
                                                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                                                    {
                                                                        document.fileName
                                                                    }
                                                                </p>
                                                                {document.fileSize && (
                                                                    <p className="text-xs text-gray-500 mb-3">
                                                                        {(
                                                                            document.fileSize /
                                                                            1024
                                                                        ).toFixed(
                                                                            0
                                                                        )}{" "}
                                                                        KB
                                                                    </p>
                                                                )}
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDocumentClick(
                                                                                document
                                                                            )
                                                                        }
                                                                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                                                                    >
                                                                        <Eye className="w-4 h-4 mr-1" />
                                                                        View
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const link =
                                                                                document.createElement(
                                                                                    "a"
                                                                                );
                                                                            link.href =
                                                                                document.pdfPath;
                                                                            link.download =
                                                                                document.fileName;
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
                                                                                strokeWidth={
                                                                                    2
                                                                                }
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

                                    {/* Revision Comments - Moved to after supporting documents */}
                                    {proposalDetails.revisionComments && (
                                        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                                            <h3 className="text-lg font-bold text-gray-900 mb-3">
                                                Revision Comments
                                            </h3>
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                                {
                                                    proposalDetails.revisionComments
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {!loadingDetails && (
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-5 flex justify-end gap-3 shadow-lg">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95"
                                >
                                    Close
                                </button>
                                {/* Only show Accept button when status is "Updated" (resubmittedAfterRevision is not null and not empty) */}
                                {proposalDetails.resubmittedAfterRevision &&
                                    proposalDetails.resubmittedAfterRevision !==
                                        null &&
                                    proposalDetails.resubmittedAfterRevision !==
                                        "" && (
                                        <button
                                            onClick={handleAccept}
                                            className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-600 via-green-600 to-green-700 rounded-xl hover:from-green-700 hover:via-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 active:scale-95"
                                        >
                                            ✓ Accept
                                        </button>
                                    )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

RDDForRevision.layout = (page) => (
    <AppLayout>
        <RDDLayout>{page}</RDDLayout>
    </AppLayout>
);

export default RDDForRevision;
