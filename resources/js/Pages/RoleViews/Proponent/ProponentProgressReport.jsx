import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useMessages } from "../../../contexts/MessageContext";
import { usePage, router } from "@inertiajs/react";
import { RefreshCw, Eye, FileText } from "lucide-react";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import axios from "axios";

// Use window.axios which has session-based auth configured
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const ProponentProgressReport = () => {
    const { user: authUser } = useAuth();
    const { props } = usePage();
    const user = authUser || props?.auth?.user;
    const { refreshAllNotifications } = useNotifications();
    const { refreshAllMessages } = useMessages();
    const [progressReports, setProgressReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Wait a bit for user to be available
        const checkAndLoad = setTimeout(() => {
            if (!user) {
                setLoading(false);
                return;
            }
            fetchProgressReports();
        }, 100);

        return () => clearTimeout(checkAndLoad);
    }, [user]);

    const fetchProgressReports = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/progress-reports", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });

            if (response.data.success) {
                setProgressReports(response.data.data || []);
            } else {
                console.error("Failed to fetch progress reports:", response.data);
                setProgressReports([]);
            }
        } catch (error) {
            console.error("Error fetching progress reports:", error);
            if (error.response?.status === 401) {
                console.error("Unauthorized - session may have expired");
            } else if (error.response?.status === 404) {
                console.error("API endpoint not found");
            }
            setProgressReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                fetchProgressReports(),
                refreshAllNotifications(),
                refreshAllMessages(),
            ]);
        } catch (error) {
            console.error("Error refreshing data:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleViewClick = (reportId) => {
        router.visit(`/proponent/progress-report/${reportId}`);
    };

    const getStatusColor = (status) => {
        const statusColors = {
            Completed: "bg-green-100 text-green-800",
            Approved: "bg-blue-100 text-blue-800",
            "Under Review": "bg-yellow-100 text-yellow-800",
            Ongoing: "bg-purple-100 text-purple-800",
            Rejected: "bg-red-100 text-red-800",
        };
        return statusColors[status] || "bg-gray-100 text-gray-800";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Filter reports
    const filteredReports = progressReports.filter((report) => {
        const matchesSearch =
            report.proposal?.researchTitle
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            report.reportType?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            filterStatus === "all" ||
            report.status === filterStatus ||
            report.reportType === filterStatus;

        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading progress reports...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <Breadcrumbs items={[{ label: "Progress Reports", href: null }]} />

            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                        Progress Reports
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-6">
                        View and track progress reports for your projects
                    </p>

                    {/* Manual Refresh Button */}
                    <div className="flex flex-wrap justify-center items-center gap-4">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh progress reports and notifications"
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

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1 min-w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center space-x-2">
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
                                <span className="text-sm font-medium text-gray-700">
                                    Status:
                                </span>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                >
                                    <option value="all">All Status</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Under Review">Under Review</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reports Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Your Progress Reports
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {filteredReports.length} report(s) found
                        </p>
                    </div>

                    {filteredReports.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {progressReports.length === 0
                                ? "No progress reports found. Submit your first progress report to get started."
                                : "No reports match your search criteria."}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Project
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Report Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Period
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Submitted
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredReports.map((report) => (
                                        <tr
                                            key={report.reportID}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {report.proposal?.researchTitle || "N/A"}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    PRO-
                                                    {report.proposalID
                                                        ?.toString()
                                                        .padStart(6, "0")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {report.reportType || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {report.reportPeriod || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {formatDate(report.submittedAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                                        report.status || report.reportType
                                                    )}`}
                                                >
                                                    {report.status || report.reportType || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() =>
                                                        handleViewClick(report.reportID)
                                                    }
                                                    className="text-purple-600 hover:text-purple-900 flex items-center gap-1 ml-auto"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

ProponentProgressReport.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Proponent">{page}</RoleBasedLayout>
    </AppLayout>
);

export default ProponentProgressReport;



