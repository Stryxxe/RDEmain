import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useMessages } from "../../../contexts/MessageContext";
import { RefreshCw } from "lucide-react";
import AutoRefreshControls from "../../../Components/AutoRefreshControls";
import RefreshStatusIndicator from "../../../Components/RefreshStatusIndicator";
import axios from "axios";
import CMProposalDetails from "./CMProposalDetails";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";
import Breadcrumbs from "../../../Components/Breadcrumbs";

// Use window.axios which has session-based auth configured, or configure this instance
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const CMReviewProposal = () => {
    const { user } = useAuth();
    const { refreshAllNotifications } = useNotifications();
    const { refreshAllMessages } = useMessages();
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("Pending");
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [proposals, setProposals] = useState([]);
    const [endorsedProposalIds, setEndorsedProposalIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchProposals();

        // Check for stored project data from endorsement
        const storedProject = localStorage.getItem(
            "selectedProjectForEndorsement"
        );
        if (storedProject) {
            try {
                const projectData = JSON.parse(storedProject);
                setSelectedProposal(projectData);
                localStorage.removeItem("selectedProjectForEndorsement");
            } catch (error) {
                console.error("Error parsing stored project data:", error);
                localStorage.removeItem("selectedProjectForEndorsement");
            }
        }
    }, []);

    // Refresh proposals when component becomes visible (user navigates back)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchProposals();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Fetch endorsed proposals when user is available
    useEffect(() => {
        if (user) {
            fetchEndorsedProposals();
        }
    }, [user]);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            // Fetch NEW submitted proposals for Endorsement view
            // Same as Dashboard - proposals that haven't been endorsed by CM yet
            // and haven't been forwarded to RDD
            const response = await axiosInstance.get("/proposals", {
                headers: { Accept: "application/json" },
                withCredentials: true
            });
            if (response.data.success) {
                setProposals(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching proposals:", error);
            if (error.response?.status === 401) {
                console.error("Unauthorized - session may have expired");
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch proposals that have been endorsed by the current user
    const fetchEndorsedProposals = async () => {
        if (!user) return;

        try {
            // Get all endorsements by the current user
            const response = await axiosInstance.get("/endorsements", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });

            if (response.data.success && response.data.data) {
                // Extract proposal IDs that have been endorsed by this user
                const endorsedIds = new Set(
                    response.data.data
                        .filter(
                            (endorsement) =>
                                endorsement.endorsementStatus === "approved"
                        )
                        .map(
                            (endorsement) =>
                                endorsement.proposalID ||
                                endorsement.proposal?.proposalID
                        )
                        .filter((id) => id !== undefined)
                );
                setEndorsedProposalIds(endorsedIds);
            }
        } catch (error) {
            console.error("Error fetching endorsed proposals:", error);
        }
    };

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await Promise.all([
                fetchProposals(),
                fetchEndorsedProposals(),
                refreshAllNotifications(),
                refreshAllMessages(),
            ]);
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleViewClick = (proposal) => setSelectedProposal(proposal);

    const handleBack = async () => {
        setSelectedProposal(null);
        // Refresh the list when going back to remove endorsed proposals
        // Force refresh to ensure final endorsed proposals are removed
        await Promise.all([
            fetchProposals(),
            fetchEndorsedProposals()
        ]);
    };

    // Remove a proposal from the list when it's endorsed
    const handleProposalEndorsed = async (proposalId) => {
        // CRITICAL: Immediately remove from local state to hide it from UI instantly
        setProposals((prev) =>
            prev.filter((p) => (p.proposalID || p.id) !== proposalId)
        );
        
        // Mark as endorsed
        setEndorsedProposalIds((prev) => new Set([...prev, proposalId]));
        
        // Force refresh the proposals list from backend to ensure final endorsed proposals are removed
        // This ensures proposals that have been endorsed twice (forwarded to RDD) are removed
        await fetchProposals();
        
        // Reset pagination to first page if current page becomes empty
        if (currentPage > 1 && proposals.length <= 1) {
            setCurrentPage(1);
        }
    };

    // Filter proposals based on search and sortBy
    // Note: Proposals in Review view should exclude any that have been endorsed by CM
    const filteredProposals = proposals.filter((proposal) => {
        // CRITICAL: Always exclude proposals where the current CM has endorsed
        // Endorsed proposals should NOT appear in the Review page regardless of sortBy filter
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
            
            // If CM has endorsed even once, exclude from review page
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
        
        // Apply search filter
        const matchesSearch =
            proposal.researchTitle
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            proposal.user?.fullName
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            proposal.researchCenter
                ?.toLowerCase()
                .includes(search.toLowerCase());
        return matchesSearch;
    });
    
    // Sort proposals based on sortBy
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
            default:
                return a.proposalID - b.proposalID;
        }
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProposals = sortedProposals.slice(
        indexOfFirstItem,
        indexOfLastItem
    );
    const totalPages = Math.ceil(sortedProposals.length / itemsPerPage);

    const handlePageChange = (page) => setCurrentPage(page);

    if (selectedProposal) {
        return (
            <CMProposalDetails
                proposal={selectedProposal}
                onBack={handleBack}
                onEndorsed={handleProposalEndorsed}
            />
        );
    }

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

    const SearchIcon = () => (
        <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
        </svg>
    );

    const FilterBar = () => (
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
                {/* Search Input */}
                <div className="relative flex-1 min-w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search proposals..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                        Sort by:
                    </label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:bg-white hover:border-gray-300"
                    >
                        <option value="Pending">Pending</option>
                        <option value="Title">Title</option>
                        <option value="Author">Author</option>
                    </select>
                    <span className="text-gray-500 ml-1">↑</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <Breadcrumbs items={[{ label: "Review Proposals", href: null }]} />
            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                        Research Proposals for Review
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-6">
                        Manage and review research project proposals submitted
                        by researchers
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
                {/* Main Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Research Proposals for Review
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {sortedProposals.length} records found
                        </p>
                    </div>

                    {/* Filter Bar */}
                    <FilterBar />

                    {/* Table */}
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
                                        Date Submitted
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentProposals.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-8 text-center text-gray-500"
                                        >
                                            No proposals found
                                        </td>
                                    </tr>
                                ) : (
                                    currentProposals.map((proposal, index) => (
                                        <tr
                                            key={proposal.proposalID}
                                            className="hover:bg-emerald-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
                                                    {String(
                                                        indexOfFirstItem +
                                                            index +
                                                            1
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
                                                    {proposal.user?.fullName ||
                                                        "Unknown"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-700">
                                                    {new Date(
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
                                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-150"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {indexOfFirstItem + 1} to{" "}
                                    {Math.min(
                                        indexOfLastItem,
                                        sortedProposals.length
                                    )}{" "}
                                    of {sortedProposals.length} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() =>
                                            handlePageChange(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    {Array.from(
                                        { length: totalPages },
                                        (_, i) => i + 1
                                    ).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() =>
                                                handlePageChange(page)
                                            }
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                                currentPage === page
                                                    ? "bg-emerald-600 text-white shadow-sm"
                                                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() =>
                                            handlePageChange(currentPage + 1)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

CMReviewProposal.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Center Manager">{page}</RoleBasedLayout>
    </AppLayout>
);

export default CMReviewProposal;
