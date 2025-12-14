import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { BiSearch, BiShow } from "react-icons/bi";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useMessages } from "../../../contexts/MessageContext";
import axios from "axios";
import StatsCard from "../../../Components/UI/StatsCard";
import {
    getStatusBadgeClass,
    getProgressBarClass,
} from "../../../config/statusStyles";
import AutoRefreshControls from "../../../Components/AutoRefreshControls";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";
import RefreshStatusIndicator from "../../../Components/RefreshStatusIndicator";
import Breadcrumbs from "../../../Components/Breadcrumbs";

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const CMDashboard = () => {
    const { user } = useAuth();
    const { refreshAllNotifications } = useNotifications();
    const { refreshAllMessages } = useMessages();
    const [fromYear, setFromYear] = useState("2025");
    const [toYear, setToYear] = useState("2025");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("Pending");
    const [proposals, setProposals] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        under_review: 0,
        approved: 0,
        rejected: 0,
        ongoing: 0,
        completed: 0,
    });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        console.log(
            "[CM Dashboard Debug] Component mounted, fetching proposals..."
        );
        fetchProposals();
        fetchStatistics();
    }, []);

    // Refresh data when page becomes visible (user navigates back to dashboard)
    // This ensures final endorsed proposals are removed when user returns to dashboard
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Page became visible - refresh data to ensure final endorsed proposals are removed
                fetchProposals();
                fetchStatistics();
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

    // Debug: Log when proposals state changes
    useEffect(() => {
        console.log("[CM Dashboard Debug] Proposals state updated:", {
            count: proposals.length,
            proposals: proposals.map((p) => ({
                proposalID: p.proposalID,
                title: p.researchTitle,
                statusID: p.statusID,
                statusName: p.status?.statusName,
                user: p.user?.fullName,
            })),
        });
    }, [proposals]);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            console.log("[CM Dashboard Debug] Fetching proposals...");
            const response = await axiosInstance.get("/proposals", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            console.log("[CM Dashboard Debug] API Response:", {
                success: response.data.success,
                dataLength: response.data.data?.length || 0,
                data: response.data.data,
                debug: response.data.debug || null,
            });

            // Log debug info if available
            if (response.data.debug) {
                console.log(
                    "[CM Dashboard Debug] Backend Debug Info:",
                    response.data.debug
                );
                console.log(
                    "[CM Dashboard Debug] Total proposals in center:",
                    response.data.debug.total_proposals_in_center
                );
                console.log(
                    "[CM Dashboard Debug] Under Review proposals:",
                    response.data.debug.under_review_proposals_count
                );
                console.log(
                    "[CM Dashboard Debug] Final proposals returned:",
                    response.data.debug.final_proposals_count
                );

                // Show what statuses the proposals actually have
                if (
                    response.data.debug.all_center_proposals &&
                    response.data.debug.all_center_proposals.length > 0
                ) {
                    console.log(
                        "[CM Dashboard Debug] ⚠️ ISSUE FOUND: Proposals exist but don't have 'Under Review' status"
                    );
                    console.log(
                        "[CM Dashboard Debug] All proposals in center with their statuses:",
                        response.data.debug.all_center_proposals.map((p) => ({
                            proposalID: p.proposalID,
                            title: p.title,
                            statusID: p.statusID,
                            statusName: p.statusName || "NULL",
                        }))
                    );
                    console.log(
                        "[CM Dashboard Debug] 🔍 The query is looking for status: 'Under Review' (case-insensitive)"
                    );
                    console.log("[CM Dashboard Debug] 💡 Possible solutions:");
                    console.log(
                        "[CM Dashboard Debug]    1. Check if status name in database matches exactly 'Under Review'"
                    );
                    console.log(
                        "[CM Dashboard Debug]    2. Or update the query to show proposals with the actual status these proposals have"
                    );
                }

                if (
                    response.data.debug.under_review_proposals &&
                    response.data.debug.under_review_proposals.length > 0
                ) {
                    console.log(
                        "[CM Dashboard Debug] Under Review proposals details:",
                        response.data.debug.under_review_proposals
                    );
                }
            }

            if (response.data.success) {
                // Enhanced logging to check endorsements
                const proposalsWithEndorsements = response.data.data.map(
                    (p) => ({
                        proposalID: p.proposalID,
                        title: p.researchTitle,
                        statusID: p.statusID,
                        statusName: p.status?.statusName,
                        user: p.user?.fullName,
                        researchCenter: p.researchCenter,
                        hasEndorsements: !!p.endorsements,
                        endorsementsCount: p.endorsements?.length || 0,
                        endorsements: p.endorsements || [],
                    })
                );

                console.log(
                    "[CM Dashboard Debug] Setting proposals in state:",
                    {
                        count: response.data.data.length,
                        proposals: proposalsWithEndorsements,
                        currentUserID: user?.userID,
                    }
                );

                // Log specific proposals that should be filtered
                const problemProposals = response.data.data.filter(
                    (p) =>
                        p.researchTitle === "tetsjda" ||
                        p.researchTitle === "test"
                );
                if (problemProposals.length > 0) {
                    console.log(
                        "[CM Dashboard Debug] ⚠️ Problem proposals found (should be filtered):",
                        problemProposals.map((p) => ({
                            proposalID: p.proposalID,
                            title: p.researchTitle,
                            statusID: p.statusID,
                            statusName: p.status?.statusName,
                            endorsements: p.endorsements || [],
                            endorsementsCount: p.endorsements?.length || 0,
                        }))
                    );
                }

                setProposals(response.data.data);
                console.log(
                    "[CM Dashboard Debug] Proposals state updated. Current proposals count:",
                    response.data.data.length
                );
            } else {
                console.warn(
                    "[CM Dashboard Debug] API returned success: false",
                    response.data
                );
            }
        } catch (error) {
            console.error(
                "[CM Dashboard Debug] Error fetching proposals:",
                error
            );
            if (error.response?.status === 401) {
                console.error(
                    "[CM Dashboard Debug] Unauthorized - session may have expired"
                );
            }
            if (error.response?.data) {
                console.error(
                    "[CM Dashboard Debug] Error response data:",
                    error.response.data
                );
            }
        } finally {
            setLoading(false);
            console.log("[CM Dashboard Debug] Loading set to false");
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await axiosInstance.get("/proposals/statistics", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching statistics:", error);
            if (error.response?.status === 401) {
                console.error("Unauthorized - session may have expired");
            }
        }
    };

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await Promise.all([
                fetchProposals(),
                fetchStatistics(),
                refreshAllNotifications(),
                refreshAllMessages(),
            ]);
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const filteredProposals = proposals.filter((proposal) => {
        // CRITICAL: Always exclude proposals where the current CM has endorsed
        // Endorsed proposals should NOT appear in the Dashboard regardless of sortBy filter
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

            // If CM has endorsed even once, exclude from dashboard
            if (cmEndorsements.length >= 1) {
                return false;
            }
        }

        // Apply "Pending" filter if selected (status check only)
        if (sortBy === "Pending") {
            if (proposal.statusID !== 1) {
                return false;
            }
        }

        // Apply search term filter
        return (
            proposal.researchTitle
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            proposal.user?.fullName
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            proposal.researchCenter
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
    });

    // Debug logging for filtering
    useEffect(() => {
        console.log("[CM Dashboard Debug] Proposals state changed:", {
            totalProposals: proposals.length,
            searchTerm: searchTerm,
            sortBy: sortBy,
            filteredCount: filteredProposals.length,
            currentUserID: user?.userID,
            proposals: proposals.map((p) => ({
                proposalID: p.proposalID,
                title: p.researchTitle,
                statusID: p.statusID,
                statusName: p.status?.statusName,
                user: p.user?.fullName,
                hasEndorsements: !!p.endorsements,
                endorsementsCount: p.endorsements?.length || 0,
            })),
        });

        // Log filtered proposals when Pending is selected
        if (sortBy === "Pending") {
            const pendingProposals = filteredProposals.filter(
                (p) => p.statusID === 1
            );
            console.log("[CM Dashboard Debug] Pending filter results:", {
                totalPending: pendingProposals.length,
                pendingProposals: pendingProposals.map((p) => ({
                    proposalID: p.proposalID,
                    title: p.researchTitle,
                    statusID: p.statusID,
                    endorsementsCount: p.endorsements?.length || 0,
                    cmEndorsementsCount:
                        p.endorsements?.filter(
                            (e) =>
                                e?.endorserID === user?.userID &&
                                e?.endorsementStatus === "approved"
                        ).length || 0,
                })),
            });
        }
    }, [proposals, searchTerm, sortBy, filteredProposals.length, user?.userID]);

    const sortedProposals = filteredProposals.sort((a, b) => {
        switch (sortBy) {
            case "Pending":
                // When filtering by Pending, sort by ID (oldest first)
                return a.proposalID - b.proposalID;
            case "Title":
                return a.researchTitle.localeCompare(b.researchTitle);
            case "Author":
                return (a.user?.fullName || "").localeCompare(
                    b.user?.fullName || ""
                );
            case "ID":
                return a.proposalID - b.proposalID; // Oldest first
            case "Status":
                return (a.status?.statusName || "").localeCompare(
                    b.status?.statusName || ""
                );
            case "Date":
                return new Date(a.created_at) - new Date(b.created_at);
            default:
                return a.proposalID - b.proposalID; // Default to ID sorting (oldest first)
        }
    });

    // Debug logging for sorted proposals
    useEffect(() => {
        console.log("[CM Dashboard Debug] Sorted proposals for rendering:", {
            sortedCount: sortedProposals.length,
            sortBy: sortBy,
            sortedProposals: sortedProposals.map((p) => ({
                proposalID: p.proposalID,
                title: p.researchTitle,
                statusName: p.status?.statusName,
                statusID: p.statusID,
            })),
        });
    }, [sortedProposals.length, sortBy]);

    const getStatusClass = (statusName) => getStatusBadgeClass(statusName);
    const getProgressColor = (statusName) => getProgressBarClass(statusName);

    // Get timeline stages based on proposal status (matching CMProposalDetail logic)
    const getTimelineStages = (statusId) => {
        const allStages = [
            { id: 0, name: "Proposal Submitted", status: "pending" },
            { id: 1, name: "College Endorsement", status: "pending" },
            { id: 2, name: "R&D Division", status: "pending" },
            { id: 3, name: "Proposal Review", status: "pending" },
            { id: 4, name: "Ethics Review", status: "pending" },
            { id: 5, name: "OVPRDE", status: "pending" },
            { id: 6, name: "President", status: "pending" },
            { id: 7, name: "OSOURU", status: "pending" },
            { id: 8, name: "Implementation", status: "pending" },
            { id: 9, name: "Monitoring", status: "pending" },
            { id: 10, name: "For Completion", status: "pending" },
        ];

        // Update stages based on actual proposal status (matching StatusSeeder IDs)
        switch (statusId) {
            case 1: // Under Review - Proposal submitted, waiting for College Endorsement
                allStages[0].status = "completed"; // Proposal Submitted
                allStages[1].status = "current"; // College Endorsement
                break;
            case 2: // Approved - All stages up to Implementation completed, Implementation current
                allStages[0].status = "completed"; // Proposal Submitted
                allStages[1].status = "completed"; // College Endorsement
                allStages[2].status = "completed"; // R&D Division
                allStages[3].status = "completed"; // Proposal Review
                allStages[4].status = "completed"; // Ethics Review
                allStages[5].status = "completed"; // OVPRDE
                allStages[6].status = "completed"; // President
                allStages[7].status = "completed"; // OSOURU
                allStages[8].status = "current"; // Implementation
                break;
            case 3: // Rejected - College Endorsement completed, R&D Division rejected
                allStages[0].status = "completed"; // Proposal Submitted
                allStages[1].status = "completed"; // College Endorsement
                allStages[2].status = "rejected"; // R&D Division
                break;
            case 4: // Ongoing - All stages up to Monitoring completed, Monitoring current
                allStages[0].status = "completed"; // Proposal Submitted
                allStages[1].status = "completed"; // College Endorsement
                allStages[2].status = "completed"; // R&D Division
                allStages[3].status = "completed"; // Proposal Review
                allStages[4].status = "completed"; // Ethics Review
                allStages[5].status = "completed"; // OVPRDE
                allStages[6].status = "completed"; // President
                allStages[7].status = "completed"; // OSOURU
                allStages[8].status = "completed"; // Implementation
                allStages[9].status = "current"; // Monitoring
                break;
            case 5: // Completed - All stages completed
                allStages[0].status = "completed"; // Proposal Submitted
                allStages[1].status = "completed"; // College Endorsement
                allStages[2].status = "completed"; // R&D Division
                allStages[3].status = "completed"; // Proposal Review
                allStages[4].status = "completed"; // Ethics Review
                allStages[5].status = "completed"; // OVPRDE
                allStages[6].status = "completed"; // President
                allStages[7].status = "completed"; // OSOURU
                allStages[8].status = "completed"; // Implementation
                allStages[9].status = "completed"; // Monitoring
                allStages[10].status = "completed"; // For Completion
                break;
            default:
                allStages[1].status = "current"; // College Endorsement
        }

        return allStages;
    };

    const getProgressPercentage = (proposal) => {
        const timelineStages = getTimelineStages(proposal.statusID);
        const completedStages = timelineStages.filter(
            (stage) => stage.status === "completed"
        ).length;
        const currentStage = timelineStages.find(
            (stage) => stage.status === "current"
        )
            ? 1
            : 0;
        const rejectedStage = timelineStages.find(
            (stage) => stage.status === "rejected"
        )
            ? 1
            : 0;

        // If rejected, return 0%
        if (rejectedStage) return 0;

        return Math.round(
            ((completedStages + currentStage * 0.5) / timelineStages.length) *
                100
        );
    };

    const statsData = [
        {
            number: (stats.received_proposals || 0).toString(),
            label: "Received Proposals",
        },
        {
            number: (stats.under_review || 0).toString(),
            label: "Under Review",
        },
        {
            number: (stats.endorsed_proposals || 0).toString(),
            label: "Total of Endorsed Proposals",
        },
    ];

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
        <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Dashboard", href: null }]} />
            {/* Header Section */}
            <div className="bg-white pt-8 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Research Project Tracker
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Monitor and manage all research projects with
                            comprehensive tracking and analytics
                        </p>
                    </div>

                    {/* Manual Refresh Button */}
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh dashboard and notifications"
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

            {/* Year Filter Section */}
            <div className="p-5">
                <div className="flex gap-8 mb-8 bg-white p-5 rounded-lg shadow-md">
                    <div className="flex items-center gap-3">
                        <label className="font-medium text-gray-700">
                            From Year:
                        </label>
                        <select
                            value={fromYear}
                            onChange={(e) => setFromYear(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white text-sm"
                        >
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="font-medium text-gray-700">
                            To Year:
                        </label>
                        <select
                            value={toYear}
                            onChange={(e) => setToYear(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white text-sm"
                        >
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Statistics Cards Section */}
            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                    {statsData.map((stat, index) => (
                        <StatsCard
                            key={index}
                            number={stat.number}
                            label={stat.label}
                        />
                    ))}
                </div>
            </div>

            {/* Header Section */}
            <div className="p-6 border-b border-gray-200">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        Research Projects
                    </h1>
                    <p className="text-gray-600">
                        Comprehensive list of all research initiatives
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 bg-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                        />
                        <BiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Sort by:
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-white hover:border-gray-300"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Title">Title</option>
                            <option value="Author">Author</option>
                        </select>
                        <span className="text-gray-500 ml-1">↑</span>
                    </div>
                </div>
            </div>

            {/* Research Projects Table */}
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Table Header */}
                    <div className="grid grid-cols-[60px_2fr_1fr_1fr_120px] gap-4 p-4 border-b border-gray-200 font-semibold text-gray-700">
                        <div className="flex items-center justify-center">
                            No
                        </div>
                        <div>Research Title</div>
                        <div>Author & College</div>
                        <div>Proposed Funding</div>
                        <div className="text-center">Details</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                        {sortedProposals.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No proposals found
                                {console.log(
                                    "[CM Dashboard Debug] No proposals to display. State check:",
                                    {
                                        proposalsLength: proposals.length,
                                        filteredLength:
                                            filteredProposals.length,
                                        sortedLength: sortedProposals.length,
                                        searchTerm: searchTerm,
                                        loading: loading,
                                    }
                                )}
                            </div>
                        ) : (
                            sortedProposals.map((proposal, index) => {
                                // Debug log for each proposal being rendered
                                if (index === 0) {
                                    console.log(
                                        "[CM Dashboard Debug] Rendering table body:",
                                        {
                                            sortedProposalsLength:
                                                sortedProposals.length,
                                            firstProposal: {
                                                proposalID: proposal.proposalID,
                                                title: proposal.researchTitle,
                                                statusName:
                                                    proposal.status?.statusName,
                                            },
                                        }
                                    );
                                }
                                return (
                                    <div
                                        key={proposal.proposalID}
                                        className="grid grid-cols-[60px_2fr_1fr_1fr_120px] gap-4 p-4 hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        {/* No Column */}
                                        <div className="flex items-center justify-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
                                                {String(index + 1).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </span>
                                        </div>

                                        {/* Research Title */}
                                        <div style={{ pointerEvents: "auto" }}>
                                            <div
                                                className="font-bold text-gray-900 mb-1 flex items-center gap-2"
                                                style={{
                                                    pointerEvents: "none",
                                                    cursor: "default",
                                                    userSelect: "text",
                                                }}
                                                onClick={(e) =>
                                                    e.preventDefault()
                                                }
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
                                            >
                                                <span
                                                    style={{
                                                        pointerEvents: "none",
                                                        cursor: "default",
                                                    }}
                                                >
                                                    {proposal.researchTitle}
                                                </span>
                                                {proposal.statusID === 1 &&
                                                    proposal.revisionHistory &&
                                                    proposal.revisionHistory
                                                        .length > 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                            Revised
                                                        </span>
                                                    )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                ID:{" "}
                                                {proposal.custom_proposal_id ||
                                                    `PRO-${proposal.proposalID
                                                        .toString()
                                                        .padStart(6, "0")}`}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Submitted:{" "}
                                                {new Date(
                                                    proposal.uploadedAt ||
                                                        proposal.created_at
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Author & College */}
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {proposal.user?.fullName ||
                                                    "Unknown"}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {proposal.researchCenter}
                                            </div>
                                        </div>

                                        {/* Budget */}
                                        <div>
                                            <div className="font-semibold text-gray-900">
                                                ₱
                                                {proposal.proposedBudget?.toLocaleString() ||
                                                    "0"}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Budget
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-center">
                                            <Link
                                                href={`/cm/proposal/${proposal.proposalID}`}
                                            >
                                                <button className="border border-red-500 text-red-500 bg-white px-3 py-1 rounded text-sm font-medium hover:bg-red-50 transition-colors duration-150 flex items-center gap-1">
                                                    <BiShow className="text-sm" />
                                                    View Details
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

CMDashboard.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Center Manager">{page}</RoleBasedLayout>
    </AppLayout>
);

export default CMDashboard;
