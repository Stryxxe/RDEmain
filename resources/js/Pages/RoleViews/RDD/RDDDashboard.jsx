import React, { useState, useEffect } from "react";
import { BiSearch, BiShow } from "react-icons/bi";
import { Link, router } from "@inertiajs/react";
import { DollarSign, Filter } from "lucide-react";
import StatsCard from "../../../Components/UI/StatsCard";
import {
    getStatusBadgeClass,
    getProgressBarClass,
} from "../../../config/statusStyles";
import rddService from "../../../services/rddService";
import RDDLayout from "../../../Components/Layouts/RDDLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import axios from "axios";

// Use window.axios which has session-based auth configured
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const RDDDashboard = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("Date"); // Default to Date (Latest to Oldest)
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [researchCenters, setResearchCenters] = useState([]);
    const [loadingCenters, setLoadingCenters] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statsData, setStatsData] = useState([]);
    const [researchData, setResearchData] = useState([]);
    const [totalFunding, setTotalFunding] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetchResearchCenters();
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [selectedCenter]);

    const fetchResearchCenters = async () => {
        try {
            setLoadingCenters(true);
            const response = await axiosInstance.get("/admin/research-centers", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            if (response.data.success) {
                setResearchCenters(response.data.data || []);
            }
        } catch (err) {
            console.error("Error fetching research centers:", err);
        } finally {
            setLoadingCenters(false);
        }
    };


    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log("Fetching dashboard data...");

            // Fetch statistics and proposals data in parallel
            const [statsResponse, proposalsResponse] = await Promise.all([
                rddService.getProposalStatistics(),
                rddService.getProposalsForReview(selectedCenter, null),
            ]);

            console.log("Stats response:", statsResponse);
            console.log("Proposals response:", proposalsResponse);

            if (statsResponse.success) {
                const stats = statsResponse.data;
                console.log("Stats data:", stats);
                setStatsData([
                    {
                        number: stats.total.toString(),
                        label: "Total of Submitted Proposals",
                    },
                    {
                        number: stats.under_review.toString(),
                        label: "Under Review",
                    },
                    {
                        number: stats.completed.toString(),
                        label: "Done/Utilized Proposals",
                    },
                ]);
            } else {
                console.error("Stats response failed:", statsResponse);
            }

            if (proposalsResponse.success) {
                console.log("Proposals data:", proposalsResponse.data);
                // Transform proposals data to match the expected format
                const transformedProposals = proposalsResponse.data.map(
                    (proposal) => {
                        const getStatusName = (statusID) => {
                            switch (statusID) {
                                case 1:
                                    return "Under Review";
                                case 2:
                                    return "Approved";
                                case 3:
                                    return "Rejected";
                                case 4:
                                    return "Ongoing";
                                case 5:
                                    return "Completed";
                                default:
                                    return "Unknown";
                            }
                        };

                        const getProgress = (statusID) => {
                            switch (statusID) {
                                case 1:
                                    return 20;
                                case 2:
                                    return 40;
                                case 3:
                                    return 0;
                                case 4:
                                    return 60;
                                case 5:
                                    return 100;
                                default:
                                    return 0;
                            }
                        };

                        const getPriority = (budget) => {
                            if (budget >= 1000000) return "High Priority";
                            if (budget >= 500000) return "Medium Priority";
                            return "Low Priority";
                        };

                        return {
                            id: proposal.proposalID, // Use actual database ID for routing
                            displayId: proposal.custom_proposal_id || `PRO-${String(proposal.proposalID).padStart(6, "0")}`, // Use custom ID format
                            title: proposal.researchTitle,
                            author: proposal.user
                                ? `${proposal.user.firstName} ${proposal.user.lastName}`
                                : "Unknown",
                            college:
                                proposal.user?.department?.name ||
                                "Unknown Department",
                            status: getStatusName(proposal.statusID),
                            progress: getProgress(proposal.statusID),
                            submittedDate: new Date(
                                proposal.uploadedAt
                            ).toLocaleDateString(),
                            funding: `₱${Number(
                                proposal.proposedBudget
                            ).toLocaleString()}`,
                            priority: getPriority(proposal.proposedBudget),
                        };
                    }
                );

                setResearchData(transformedProposals);

                // Calculate total funding
                console.log(
                    "Proposals data for funding calculation:",
                    proposalsResponse.data.map((p) => ({
                        id: p.proposalID,
                        budget: p.proposedBudget,
                        budgetType: typeof p.proposedBudget,
                    }))
                );

                const total = proposalsResponse.data.reduce((sum, proposal) => {
                    // Handle different possible data types and null values
                    let budget = 0;
                    if (
                        proposal.proposedBudget !== null &&
                        proposal.proposedBudget !== undefined
                    ) {
                        if (typeof proposal.proposedBudget === "string") {
                            budget = parseFloat(proposal.proposedBudget) || 0;
                        } else if (
                            typeof proposal.proposedBudget === "number"
                        ) {
                            budget = proposal.proposedBudget;
                        }
                    }
                    console.log(
                        `Proposal ${proposal.proposalID}: budget=${proposal.proposedBudget}, converted=${budget}`
                    );
                    return sum + budget;
                }, 0);

                console.log("Total funding calculated:", total);
                setTotalFunding(total);
            } else {
                console.error("Proposals response failed:", proposalsResponse);
            }
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Error loading dashboard data");
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort research data
    let filteredResearch = researchData.filter(
        (research) =>
            research.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            research.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            research.college.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort the filtered data
    filteredResearch = [...filteredResearch].sort((a, b) => {
        switch (sortBy) {
            case "Date":
                // Latest to Oldest (descending by date)
                const dateA = new Date(a.submittedDate);
                const dateB = new Date(b.submittedDate);
                return dateB - dateA;
            case "Title":
                return a.title.localeCompare(b.title);
            case "Author":
                return a.author.localeCompare(b.author);
            case "Status":
                return a.status.localeCompare(b.status);
            default:
                // Default: Latest to Oldest
                const defaultDateA = new Date(a.submittedDate);
                const defaultDateB = new Date(b.submittedDate);
                return defaultDateB - defaultDateA;
        }
    });

    // Pagination calculations
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredResearch.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredResearch.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStatusClass = (statusName) => getStatusBadgeClass(statusName);
    const getProgressColor = (statusName) => getProgressBarClass(statusName);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">
                                Loading dashboard data...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="text-red-600 text-6xl mb-4">⚠️</div>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={fetchDashboardData}
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <Breadcrumbs items={[
                { label: 'R&D Initiative Status', href: null }
            ]} />
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                        R&D Initiative Status
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Monitor and manage all research projects with
                        comprehensive tracking and analytics
                    </p>
                </div>
            </div>

            {/* Statistics Cards Section */}
            <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {statsData.map((stat, index) => (
                        <StatsCard
                            key={index}
                            number={stat.number}
                            label={stat.label}
                        />
                    ))}

                    {/* Total Funding Card */}
                    <div className="bg-white p-6 rounded-lg shadow-md text-center transition-transform duration-200 hover:-translate-y-1">
                        <div className="text-4xl font-bold text-red-900 mb-3">
                            {totalFunding === 0
                                ? "₱0"
                                : totalFunding >= 1000000
                                ? `₱${(totalFunding / 1000000).toFixed(1)}M`
                                : `₱${totalFunding.toLocaleString()}`}
                        </div>
                        <div className="text-gray-600 font-medium">
                            Total Funding
                        </div>
                    </div>
                </div>
            </div>

            {/* Header Section */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            Research Projects
                        </h1>
                        <p className="text-gray-600">
                            Comprehensive list of all research initiatives
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Sort by:
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="Date">Date (Latest to Oldest)</option>
                            <option value="Title">Title</option>
                            <option value="Author">Author</option>
                            <option value="Status">Status</option>
                        </select>
                        {sortBy === "Date" && <span className="text-gray-500">↓</span>}
                        {sortBy !== "Date" && <span className="text-gray-500">↑</span>}
                    </div>
                </div>

                {/* Filters Section */}
                <div className="mb-4 space-y-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2 bg-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                                />
                                <BiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-600" />
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                Research Center:
                            </label>
                            <select
                                value={selectedCenter || ""}
                                onChange={(e) => {
                                    setSelectedCenter(e.target.value ? parseInt(e.target.value) : null);
                                    setCurrentPage(1); // Reset to first page when filter changes
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 min-w-[200px]"
                                disabled={loadingCenters}
                            >
                                <option value="">All Centers</option>
                                {researchCenters.map((center) => (
                                    <option key={center.centerID} value={center.centerID}>
                                        {center.centerName || center.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Research Projects Table */}
            <div className="p-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    {/* Table Header */}
                    <div className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 p-4 border-b border-gray-200 font-semibold text-gray-700">
                        <div>Project Details</div>
                        <div>Author & Research Center</div>
                        <div>Proposed Funding</div>
                        <div>Details</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                        {currentItems.map((research, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-[2fr_1fr_1fr_120px] gap-4 p-4 hover:bg-gray-50 transition-colors duration-150"
                            >
                                {/* Project Details */}
                                <div>
                                    <Link
                                        href={`/rdd/proposal/${research.id}`}
                                        className="font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors duration-200 cursor-pointer block"
                                    >
                                        {research.title}
                                    </Link>
                                    <div className="text-sm text-gray-600">
                                        ID: {research.displayId}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Submitted: {research.submittedDate}
                                    </div>
                                </div>

                                {/* Author & College */}
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {research.author}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {research.college}
                                    </div>
                                </div>

                                {/* Funding */}
                                <div>
                                    <div className="font-bold text-gray-900">
                                        {research.funding}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {research.priority}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center">
                                    <button 
                                        onClick={() => router.visit(`/rdd/proposal/${research.id}`)}
                                        className="border border-red-500 text-red-500 bg-white px-3 py-1 rounded text-sm font-medium hover:bg-red-50 transition-colors duration-150 flex items-center gap-1"
                                    >
                                        <BiShow className="text-sm" />
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredResearch.length)} of {filteredResearch.length} results
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                
                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNumber = index + 1;
                                        // Show first, last, current, and pages around current
                                        if (
                                            pageNumber === 1 ||
                                            pageNumber === totalPages ||
                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => handlePageChange(pageNumber)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        currentPage === pageNumber
                                                            ? 'bg-red-600 text-white'
                                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        } else if (
                                            pageNumber === currentPage - 2 ||
                                            pageNumber === currentPage + 2
                                        ) {
                                            return <span key={pageNumber} className="px-2 py-2 text-gray-500">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Set the persistent layout
RDDDashboard.layout = (page) => (
    <AppLayout>
        <RDDLayout>
            {page}
        </RDDLayout>
    </AppLayout>
);

export default RDDDashboard;
