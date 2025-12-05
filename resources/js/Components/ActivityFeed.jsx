import React, { useState, useEffect } from "react";
import { FiActivity, FiRefreshCw, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import axios from "axios";

const ActivityFeed = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const axiosInstance = window.axios || axios;
    if (!window.axios) {
        axiosInstance.defaults.withCredentials = true;
        axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
    }

    // Fetch activities with pagination
    const fetchActivities = async (page = 1) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get("/activities/recent", {
                params: {
                    page: page,
                    per_page: itemsPerPage
                }
            });
            setActivities(response.data.data);
            setCurrentPage(response.data.current_page);
            setTotalPages(response.data.last_page);
        } catch (error) {
            console.error("Error fetching activities:", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchActivities(currentPage);
        // Refresh every 30 seconds
        const interval = setInterval(() => fetchActivities(currentPage), 30000);
        return () => clearInterval(interval);
    }, [currentPage]);

    const toggleExpand = (id) => {
        setExpandedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const getActionIcon = (action) => {
        switch (action) {
            case "create":
                return "✨";
            case "update":
                return "✏️";
            case "delete":
                return "🗑️";
            case "login":
                return "🔓";
            case "logout":
                return "🔒";
            default:
                return "📝";
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case "create":
                return "bg-green-50 border-green-200";
            case "update":
                return "bg-blue-50 border-blue-200";
            case "delete":
                return "bg-red-50 border-red-200";
            default:
                return "bg-gray-50 border-gray-200";
        }
    };

    const getActionBadgeColor = (action) => {
        switch (action) {
            case "create":
                return "bg-green-100 text-green-800";
            case "update":
                return "bg-blue-100 text-blue-800";
            case "delete":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <FiActivity className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                    {activities.length > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            Page {currentPage} of {totalPages}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => fetchActivities(currentPage)}
                    disabled={loading}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh activities"
                >
                    <FiRefreshCw className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {/* Activity Feed Container - No scroll, fixed height for content */}
            <div className="min-h-96">
                {loading && activities.length === 0 ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-gray-500 text-sm">Loading activities...</p>
                        </div>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <FiActivity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No activities recorded yet</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {activities.map((activity) => (
                            <div
                                key={activity.activityID}
                                className={`p-4 border-l-4 ${getActionColor(
                                    activity.action
                                )} border-l-blue-500 hover:bg-gray-50 transition-colors cursor-pointer`}
                                onClick={() => toggleExpand(activity.activityID)}
                            >
                                {/* Main row */}
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-lg">{getActionIcon(activity.action)}</span>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(
                                                    activity.action
                                                )}`}
                                            >
                                                {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                                            </span>
                                            {activity.model_type && (
                                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {activity.model_type}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 mb-1">
                                            {activity.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>👤 {activity.userName}</span>
                                            <span>🕐 {activity.formatted_date}</span>
                                            {activity.ip_address && (
                                                <span>📍 {activity.ip_address}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        {expandedItems[activity.activityID] ? (
                                            <FiChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <FiChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {expandedItems[activity.activityID] && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        {activity.old_values && (
                                            <div className="mb-4">
                                                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                                                    Previous Values
                                                </h4>
                                                <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-gray-700 font-mono">
                                                    <pre>{JSON.stringify(activity.old_values, null, 2)}</pre>
                                                </div>
                                            </div>
                                        )}
                                        {activity.new_values && (
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                                                    New Values
                                                </h4>
                                                <div className="bg-green-50 border border-green-200 rounded p-3 text-xs text-gray-700 font-mono">
                                                    <pre>{JSON.stringify(activity.new_values, null, 2)}</pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        Showing page <span className="font-semibold">{currentPage}</span> of{" "}
                        <span className="font-semibold">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchActivities(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1 || loading}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Previous page"
                        >
                            <FiChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => fetchActivities(pageNum)}
                                        disabled={loading}
                                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                            pageNum === currentPage
                                                ? "bg-blue-600 text-white"
                                                : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => fetchActivities(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Next page"
                        >
                            <FiChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
