import React, { useState, useEffect } from "react";
import { router, Link } from "@inertiajs/react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import { useMessages } from "../../../contexts/MessageContext";
import { RefreshCw, Eye } from "lucide-react";
import { BiSearch } from "react-icons/bi";
import axios from "axios";
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

    const handleViewClick = (proposal) => {
        router.visit(`/rdd/proposal/${proposal.proposalID || proposal.id}`);
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
        <div className="w-full">
            <Breadcrumbs items={[{ label: "For Revision", href: null }]} />

            {/* Header Section */}
            <div className="mb-8">
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

            <div className="space-y-6">
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
                                                    <Link
                                                        href={`/rdd/proposal/${
                                                            proposal.proposalID ||
                                                            proposal.id
                                                        }`}
                                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />{" "}
                                                        View Details
                                                    </Link>
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
        </div>
    );
};

export default RDDForRevision;
