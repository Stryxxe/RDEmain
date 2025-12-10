import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useMessages } from "../../../contexts/MessageContext";
import { usePage } from "@inertiajs/react";
import { RefreshCw } from "lucide-react";
import AutoRefreshControls from "../../../Components/AutoRefreshControls";
import RefreshStatusIndicator from "../../../Components/RefreshStatusIndicator";
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

const CMProgressReport = () => {
    const { user: authUser } = useAuth();
    const { props } = usePage();
    // Get user from Inertia props (more reliable than context on initial load)
    const user = authUser || props?.auth?.user;
    const { refreshAllNotifications } = useNotifications();
    const { refreshAllMessages } = useMessages();
    const [proposals, setProposals] = useState([]);
    const [progressReports, setProgressReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [expandedProposals, setExpandedProposals] = useState(new Set());

    useEffect(() => {
        // Wait a bit for user to be available (in case of initial page load)
        const checkAndLoad = setTimeout(() => {
            if (!user) {
                setLoading(false);
                return;
            }
            fetchData();
        }, 100);

        return () => clearTimeout(checkAndLoad);
    }, [user]);

    const dedupeProposalsFromReports = (reports = []) => {
        const map = new Map();
        reports.forEach((report) => {
            const proposal = report.proposal;
            if (proposal?.proposalID && !map.has(proposal.proposalID)) {
                map.set(proposal.proposalID, proposal);
            }
        });
        return Array.from(map.values());
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch proposals and progress reports in parallel
            const [proposalsResponse, reportsResponse] = await Promise.allSettled([
                axiosInstance.get("/proposals", {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                }),
                axiosInstance.get("/progress-reports", {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                }),
            ]);

            // Handle proposals response
            if (proposalsResponse.status === 'fulfilled' && proposalsResponse.value?.data?.success) {
                // The backend already filters proposals for CM role (same research center, not yet endorsed)
                // So we can use the proposals directly without additional filtering
                const proposalsData = proposalsResponse.value.data.data || [];
                
                // Only do additional filtering if user object has researchCenterID and we want extra safety
                const filteredProposals = user?.researchCenterID
                    ? proposalsData.filter((proposal) => {
                          return (
                              proposal.user?.researchCenterID &&
                              proposal.user.researchCenterID === user.researchCenterID
                          );
                      })
                    : proposalsData;
                
                console.log(`CM Progress Report: Loaded ${filteredProposals.length} proposals for CM user`, {
                    userID: user?.userID,
                    researchCenterID: user?.researchCenterID,
                    totalProposals: proposalsData.length,
                    filteredProposals: filteredProposals.length
                });
                
                setProposals(filteredProposals);
            } else if (proposalsResponse.status === 'rejected') {
                console.error("Error fetching proposals:", proposalsResponse.reason);
                // Log more details for debugging
                if (proposalsResponse.reason?.response) {
                    console.error("Proposals API error details:", {
                        status: proposalsResponse.reason.response.status,
                        data: proposalsResponse.reason.response.data,
                        url: proposalsResponse.reason.config?.url
                    });
                }
            } else if (proposalsResponse.status === 'fulfilled' && !proposalsResponse.value?.data?.success) {
                console.error("Proposals API returned unsuccessful response:", proposalsResponse.value?.data);
            }

            // Handle progress reports response
            if (reportsResponse.status === 'fulfilled' && reportsResponse.value?.data?.success) {
                const reports = reportsResponse.value.data.data || [];

                // Keep only reports whose proposal proponent is in the CM's research center
                const filteredReports = reports.filter((report) => {
                    const centerId = report.proposal?.user?.researchCenterID;
                    return centerId && centerId === user?.researchCenterID;
                });

                console.log(`CM Progress Report: Loaded ${filteredReports.length} progress reports`, {
                    totalReports: reports.length,
                    filteredReports: filteredReports.length
                });

                setProgressReports(filteredReports);

                // If proposals API filtered out items (e.g., due to endorsement rules), backfill proposals from reports
                const proposalsFromReports = dedupeProposalsFromReports(filteredReports);
                if (proposalsFromReports.length) {
                    setProposals((existing) => {
                        if (!existing || existing.length === 0) return proposalsFromReports;
                        const map = new Map();
                        [...existing, ...proposalsFromReports].forEach((p) => {
                            if (p?.proposalID) map.set(p.proposalID, p);
                        });
                        return Array.from(map.values());
                    });
                }
            } else if (reportsResponse.status === 'rejected') {
                console.error("Error fetching progress reports:", reportsResponse.reason);
                // Log more details for debugging
                if (reportsResponse.reason?.response) {
                    console.error("Progress Reports API error details:", {
                        status: reportsResponse.reason.response.status,
                        data: reportsResponse.reason.response.data,
                        url: reportsResponse.reason.config?.url
                    });
                }
                setProgressReports([]);
            } else if (reportsResponse.status === 'fulfilled' && !reportsResponse.value?.data?.success) {
                console.error("Failed to fetch progress reports:", reportsResponse.value?.data);
                setProgressReports([]);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            if (error.response?.status === 401) {
                console.error("Unauthorized - session may have expired");
            } else if (error.response?.status === 404) {
                console.error("API endpoint not found");
            } else {
                console.error("Unexpected error:", error.message);
            }
            // Set empty arrays on error to prevent infinite loading
            setProgressReports([]);
            setProposals([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchProgressReports = async () => {
        try {
            const response = await axiosInstance.get("/progress-reports", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            if (response.data.success) {
                const reports = response.data.data || [];
                const filteredReports = reports.filter((report) => {
                    const centerId = report.proposal?.user?.researchCenterID;
                    return centerId && centerId === user?.researchCenterID;
                });
                setProgressReports(filteredReports);

                const proposalsFromReports = dedupeProposalsFromReports(filteredReports);
                if (proposalsFromReports.length) {
                    setProposals((existing) => {
                        if (!existing || existing.length === 0) return proposalsFromReports;
                        const map = new Map();
                        [...existing, ...proposalsFromReports].forEach((p) => {
                            if (p?.proposalID) map.set(p.proposalID, p);
                        });
                        return Array.from(map.values());
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching progress reports:", error);
        }
    };

    const openReportDetails = (report) => {
        setSelectedReport(report);
    };

    const closeReportDetails = () => {
        setSelectedReport(null);
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return "N/A";
        const num = Number(value);
        if (Number.isNaN(num)) return "N/A";
        return num.toLocaleString(undefined, { style: "currency", currency: "PHP" });
    };

    const formatProposalId = (proposal) => {
        if (!proposal) return "";
        return proposal.custom_proposal_id || `PRO-${String(proposal.proposalID || 0).padStart(6, "0")}`;
    };

    // Create a map of proposals with their latest progress report
    const proposalsWithLatestReport = new Map();
    
    // Add proposals with progress reports
    progressReports.forEach((report) => {
        const proposalId = report.proposalID || report.proposal?.proposalID;
        if (proposalId) {
            const existing = proposalsWithLatestReport.get(proposalId);
            if (!existing || new Date(report.submittedAt || report.created_at) > new Date(existing.report.submittedAt || existing.report.created_at)) {
                proposalsWithLatestReport.set(proposalId, {
                    report,
                    proposal: report.proposal,
                    status: report.proposal?.status?.statusName || "Unknown",
                });
            }
        }
    });
    
    // Add proposals without progress reports
    proposals.forEach((proposal) => {
        const proposalId = proposal.proposalID;
        if (proposalId && !proposalsWithLatestReport.has(proposalId)) {
            proposalsWithLatestReport.set(proposalId, {
                report: null, // No progress report yet
                proposal: proposal,
                status: proposal.status?.statusName || "Unknown",
            });
        }
    });
    
    // Convert to array and filter/sort
    const sortedRows = Array.from(proposalsWithLatestReport.values())
        .filter(({ report, proposal }) => {
            const search = searchTerm.toLowerCase();
            const title = proposal?.researchTitle?.toLowerCase() || "";
            const proponent = proposal?.user?.fullName?.toLowerCase() || "";
            const idText = formatProposalId(proposal).toLowerCase();
            const matchesSearch =
                !search ||
                title.includes(search) ||
                proponent.includes(search) ||
                idText.includes(search);

            const matchesStatus =
                filterStatus === "all" ||
                (proposal?.status?.statusName || "Unknown") === filterStatus;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            // Sort by latest report date if available, otherwise by proposal date
            const dateA = a.report 
                ? new Date(a.report.submittedAt || a.report.created_at || 0).getTime()
                : new Date(a.proposal?.uploadedAt || a.proposal?.created_at || 0).getTime();
            const dateB = b.report
                ? new Date(b.report.submittedAt || b.report.created_at || 0).getTime()
                : new Date(b.proposal?.uploadedAt || b.proposal?.created_at || 0).getTime();
            return dateB - dateA;
        });

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await Promise.all([
                fetchData(),
                refreshAllNotifications(),
                refreshAllMessages(),
            ]);
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Group progress reports by proposal ID (for reference, though we now show all proposals)
    const reportsByProposal = progressReports.reduce((acc, report) => {
        const proposalId = report.proposalID || report.proposal?.proposalID;
        if (!acc[proposalId]) {
            acc[proposalId] = [];
        }
        acc[proposalId].push(report);
        return acc;
    }, {});

    // Toggle proposal expansion
    const toggleProposal = (proposalId) => {
        setExpandedProposals((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(proposalId)) {
                newSet.delete(proposalId);
            } else {
                newSet.add(proposalId);
            }
            return newSet;
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Completed":
                return "bg-green-100 text-green-800";
            case "Under Review":
                return "bg-blue-100 text-blue-800";
            case "Ongoing":
                return "bg-orange-100 text-orange-800";
            case "Approved":
                return "bg-green-100 text-green-800";
            case "Rejected":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        Loading progress reports...
                    </p>
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

    const FilterIcon = () => (
        <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
        </svg>
    );

    const SortIcon = () => (
        <svg
            className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
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
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <FilterIcon />
                        <span className="text-sm font-medium text-gray-700">
                            Status:
                        </span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="all">All Status</option>
                            <option value="Completed">Completed</option>
                            <option value="Approved">Approved</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <SortIcon />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <Breadcrumbs items={[{ label: 'Progress Reports', href: null }]} />

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Progress Reports</h1>
                        <p className="text-gray-600 text-base md:text-lg">Monitor and track project progress across divisions</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50"
                        title="Refresh progress reports and notifications"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h2 className="text-xl font-semibold text-gray-900">Projects and Progress Reports</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {sortedRows.length} {sortedRows.length === 1 ? 'proposal' : 'proposals'} found
                            {progressReports.length > 0 && ` (${progressReports.length} with progress reports)`}
                        </p>
                    </div>

                    <FilterBar />

                    {sortedRows.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            <p className="mb-2">No proposals found</p>
                            <p className="text-xs text-gray-400">
                                {user?.researchCenterID 
                                    ? "No proposals in your research center match the current filters."
                                    : "Unable to load proposals. Please check your research center assignment."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Proposal</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Last Report</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {sortedRows.map(({ report, proposal }) => {
                                        const hasReport = !!report;
                                        const reportDate = report 
                                            ? new Date(report.submittedAt || report.created_at).toLocaleString()
                                            : "No reports yet";
                                        
                                        return (
                                            <tr key={proposal?.proposalID || `proposal-${proposal?.proposalID}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 align-top">
                                                    <div className="text-sm font-semibold text-gray-900">{proposal?.researchTitle || "Untitled"}</div>
                                                    <div className="text-xs text-gray-600">{formatProposalId(proposal)}</div>
                                                </td>
                                                <td className="px-6 py-4 align-top text-sm text-gray-900">
                                                    {proposal?.user?.fullName || "Unknown proponent"}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposal?.status?.statusName || "Unknown")}`}>
                                                        {proposal?.status?.statusName || "Unknown"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 align-top text-sm text-gray-900">
                                                    {hasReport ? (
                                                        <span className="text-green-600">{reportDate}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">{reportDate}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    {hasReport ? (
                                                        <button
                                                            onClick={() => openReportDetails(report)}
                                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 rounded-lg transition-colors shadow-sm"
                                                        >
                                                            View report
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">No reports</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Details Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4" role="dialog" aria-modal="true">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header with gradient background - matches system header color */}
                        <div className="bg-gradient-to-r from-red-800 to-red-900 px-6 py-6 text-white flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-xs uppercase tracking-wider opacity-90 font-semibold mb-2">Progress Report</p>
                                <h3 className="text-2xl font-bold mb-2">
                                    {selectedReport.proposal?.researchTitle || "Proposal"}
                                </h3>
                                <p className="text-sm font-mono bg-red-700 bg-opacity-50 px-2 py-1 rounded inline-block mb-3">
                                    {formatProposalId(selectedReport.proposal)}
                                </p>
                                <div className="space-y-1 mt-3">
                                    <p className="text-sm font-semibold">
                                        Submitted by {selectedReport.user?.fullName || selectedReport.proposal?.user?.fullName || "Unknown"}
                                    </p>
                                    {selectedReport.proposal?.proponents && selectedReport.proposal.proponents.length > 0 && (
                                        <div>
                                            <p className="text-xs opacity-90 mb-1">Authors:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedReport.proposal.proponents.map((proponent) => (
                                                    <span
                                                        key={proponent.userID}
                                                        className="text-xs bg-red-700 bg-opacity-70 px-2 py-1 rounded-full"
                                                    >
                                                        {proponent.firstName} {proponent.lastName}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={closeReportDetails}
                                className="text-white hover:bg-red-700 hover:bg-opacity-40 rounded-lg p-2 transition-colors flex-shrink-0 ml-4"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6 space-y-6">
                            {/* Description Section */}
                            {selectedReport.achievements && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 mb-2">Description</p>
                                    <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{selectedReport.achievements}</p>
                                </div>
                            )}

                            {/* Documents Section - Grid Layout */}
                            {selectedReport.files && selectedReport.files.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M13 6v2h5v11H6V8h5V6H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">Other Supporting Documents</h4>
                                            <p className="text-sm text-gray-600">Additional files and attachments</p>
                                        </div>
                                        <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded">
                                            {selectedReport.files.length} {selectedReport.files.length === 1 ? 'file' : 'files'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedReport.files.map((file) => (
                                            <div
                                                key={file.fileID}
                                                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                                            >
                                                <h5 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm">{file.fileName}</h5>
                                                {file.fileSize && (
                                                    <p className="text-xs text-gray-600 mb-3">
                                                        {(file.fileSize / 1024).toFixed(0)} KB
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <a
                                                        href={`/storage/${file.filePath}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View
                                                    </a>
                                                    <a
                                                        href={`/storage/${file.filePath}`}
                                                        download={file.fileName}
                                                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded text-xs font-semibold transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        Download
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Small helper components for the modal (use function declarations for hoisting)
    function InfoRow({ label, value }) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <p className="text-xs uppercase text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-900 mt-1 whitespace-pre-wrap break-words">{value || "N/A"}</p>
            </div>
        );
    }

    function InfoBlock({ label, value }) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <p className="text-xs uppercase text-gray-500 mb-1">{label}</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{value || "N/A"}</p>
            </div>
        );
    }
};

CMProgressReport.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Center Manager">{page}</RoleBasedLayout>
    </AppLayout>
);

export default CMProgressReport;
