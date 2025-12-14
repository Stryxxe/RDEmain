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
                                    {/* Basic Information */}
                                    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                                            {proposalDetails.researchTitle}
                                        </h3>
                                        <div className="space-y-2 text-sm text-gray-700">
                                            <p>
                                                <span className="font-semibold">
                                                    Author:
                                                </span>{" "}
                                                {proposalDetails.user
                                                    ?.fullName || "Unknown"}
                                            </p>
                                            <p>
                                                <span className="font-semibold">
                                                    Description:
                                                </span>{" "}
                                                {proposalDetails.description ||
                                                    "N/A"}
                                            </p>
                                            <p>
                                                <span className="font-semibold">
                                                    Objectives:
                                                </span>{" "}
                                                {proposalDetails.objectives ||
                                                    "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Revision Comments */}
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
