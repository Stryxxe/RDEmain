import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { usePage } from "@inertiajs/react";
import { RefreshCw } from "lucide-react";
import axios from "axios";
import RDDLayout from "../../../Components/Layouts/RDDLayout";
import Breadcrumbs from "../../../Components/Breadcrumbs";

// Use window.axios which has session-based auth configured
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const RDDProgressReport = () => {
    const { user: authUser } = useAuth();
    const { props } = usePage();
    const user = authUser || props?.auth?.user;
    const [proposals, setProposals] = useState([]);
    const [progressReports, setProgressReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
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

            if (proposalsResponse.status === 'fulfilled' && proposalsResponse.value?.data?.success) {
                setProposals(proposalsResponse.value.data.data);
            } else if (proposalsResponse.status === 'rejected') {
                console.error("Error fetching proposals:", proposalsResponse.reason);
            }

            if (reportsResponse.status === 'fulfilled' && reportsResponse.value?.data?.success) {
                const reports = reportsResponse.value.data.data || [];
                setProgressReports(reports);

                const backfilledProposals = dedupeProposalsFromReports(reports);
                setProposals((prev) => {
                    const combined = [...prev];
                    backfilledProposals.forEach((bp) => {
                        if (!combined.find((p) => p.proposalID === bp.proposalID)) {
                            combined.push(bp);
                        }
                    });
                    return combined;
                });
            } else if (reportsResponse.status === 'rejected') {
                console.error("Error fetching progress reports:", reportsResponse.reason);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatProposalId = (proposal) => {
        if (!proposal) return "N/A";
        return proposal.custom_proposal_id || `PRO-${String(proposal.proposalID).padStart(6, "0")}`;
    };

    const openReportDetails = (report) => {
        setSelectedReport(report);
    };

    const closeReportDetails = () => {
        setSelectedReport(null);
    };

    const FilterBar = () => (
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="all">All Status</option>
                        <option value="Completed">Completed</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Ongoing">Ongoing</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const sortedRows = progressReports
        .map((report) => {
            const proposal = proposals.find((p) => p.proposalID === report.proposalID) || report.proposal;
            return { report, proposal };
        })
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
            const dateA = new Date(a.report.submittedAt || a.report.created_at || 0).getTime();
            const dateB = new Date(b.report.submittedAt || b.report.created_at || 0).getTime();
            return dateB - dateA;
        });

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await fetchData();
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading progress reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <Breadcrumbs items={[{ label: 'Progress Reports', href: null }]} />

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Progress Reports</h1>
                        <p className="text-gray-600 text-base md:text-lg">Monitor and track project progress from all research centers</p>
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
                        <p className="text-sm text-gray-600 mt-1">{sortedRows.length} reports found</p>
                    </div>

                    <FilterBar />

                    {sortedRows.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No reports found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Research Center</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Academic Unit</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Submitted</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {sortedRows.map(({ report, proposal }) => {
                                        // For reports with proposals, show proposal's user's research center/department
                                        // For reports without proposals, show report's research center/department
                                        const researchCenter = proposal?.user?.researchCenter?.name 
                                            || report.researchCenter?.name 
                                            || "Unknown Center";
                                        const department = proposal?.user?.department?.name 
                                            || report.department?.name 
                                            || "Unknown Academic Unit";
                                        
                                        return (
                                        <tr key={report.reportID} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 align-top">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {researchCenter}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-sm text-gray-900">
                                                {department}
                                            </td>
                                            <td className="px-6 py-4 align-top text-sm text-gray-900">
                                                {new Date(report.submittedAt || report.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <button
                                                    onClick={() => openReportDetails(report)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 rounded-lg transition-colors shadow-sm"
                                                >
                                                    View details
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
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
                        {/* Header with gradient background */}
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
};

RDDProgressReport.layout = (page) => <RDDLayout>{page}</RDDLayout>;

export default RDDProgressReport;
