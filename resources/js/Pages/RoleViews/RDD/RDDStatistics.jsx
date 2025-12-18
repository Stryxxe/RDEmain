import React, { useState, useRef, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Target, Filter, RefreshCw } from "lucide-react";
import rddService from "../../../services/rddService";
import AppLayout from "../../../Components/Layouts/AppLayout";
import RDDLayout from "../../../Components/Layouts/RDDLayout";
import Breadcrumbs from "../../../Components/Breadcrumbs";
import axios from "axios";

// Use window.axios which has session-based auth configured
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const RDDStatistics = () => {
    const [hoveredItem, setHoveredItem] = useState(null);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
    const [hoveredBar, setHoveredBar] = useState(null);
    const [hoveredSdg, setHoveredSdg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [researchCenters, setResearchCenters] = useState([]);
    const [loadingCenters, setLoadingCenters] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [analyticsData, setAnalyticsData] = useState({
        overview: {
            totalProposals: 0,
            totalOngoing: 0,
            totalCompleted: 0,
            completionRate: 0,
        },
        rdeAgenda: [],
        dost6Ps: [],
        sdg: [],
    });
    const tooltipContainerRef = useRef(null);
    const dostTooltipContainerRef = useRef(null);
    const sdgTooltipContainerRef = useRef(null);

    useEffect(() => {
        fetchResearchCenters();
        fetchAnalyticsData();
    }, []);

    useEffect(() => {
        fetchAnalyticsData();
    }, [selectedCenter]);

    // Refresh data when page becomes visible (user navigates back)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Page became visible - refresh data
                fetchAnalyticsData();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [selectedCenter]);

    // Auto-refresh when window gains focus
    useEffect(() => {
        const handleFocus = () => {
            fetchAnalyticsData();
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [selectedCenter]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchAnalyticsData();
        setIsRefreshing(false);
    };

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


    const fetchAnalyticsData = async () => {
        try {
            // Only show loading spinner on initial load, not on refresh
            if (!analyticsData.overview.totalProposals && !isRefreshing) {
                setLoading(true);
            }
            setError(null);
            
            // Add cache-busting timestamp to ensure fresh data
            const response = await axiosInstance.get('/proposals/rdd-analytics', {
                params: {
                    centerID: selectedCenter || undefined,
                    _t: Date.now(), // Cache-busting parameter
                },
                headers: { 
                    Accept: "application/json",
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                withCredentials: true,
            });
            
            console.log("🔍 [RDD Statistics] Full API Response:", response.data);
            if (response.data.success) {
                console.log("✅ [RDD Statistics] Response successful");
                console.log("📊 [RDD Statistics] Analytics Data:", response.data.data);
                console.log("📋 [RDD Statistics] RDE Agenda Data:", response.data.data.rdeAgenda);
                console.log("📋 [RDD Statistics] RDE Agenda Count:", response.data.data.rdeAgenda?.length || 0);
                setAnalyticsData(response.data.data);
            } else {
                console.error("❌ [RDD Statistics] Response failed:", response.data);
                setError("Failed to fetch analytics data");
            }
        } catch (err) {
            console.error("❌ [RDD Statistics] Error fetching analytics data:", err);
            setError("Error loading analytics data");
        } finally {
            setLoading(false);
        }
    };

    const { overview, rdeAgenda, dost6Ps, sdg } = analyticsData;

    // Complete RDE Agenda list (must match backend exactly)
    const allRdeAgenda = [
        "Agriculture, Aquatic, and Agro-Forestry",
        "Business and Trade",
        "Social Sciences and Education",
        "Engineering and Technology",
        "Environment and Natural Resources",
        "Health and Wellness",
        "Peace and Security"
    ];

    // Complete DOST 6Ps list
    const allDost6Ps = [
        "Publications",
        "Patent",
        "Product",
        "People Services",
        "Places and Partnership",
        "Policies"
    ];

    // Log raw RDE Agenda data
    console.log("🔍 [RDD Statistics] Raw rdeAgenda from analyticsData:", rdeAgenda);
    console.log("🔍 [RDD Statistics] rdeAgenda type:", typeof rdeAgenda, Array.isArray(rdeAgenda));
    console.log("🔍 [RDD Statistics] rdeAgenda length:", rdeAgenda?.length || 0);

    // Merge API data with complete lists to show all items
    const rdeAgendaToShow = allRdeAgenda.map(name => {
        const apiItem = rdeAgenda.find(item => {
            const match = item.name === name;
            if (!match && item.name) {
                console.log(`⚠️ [RDD Statistics] Name mismatch - Looking for: "${name}", Found: "${item.name}"`);
            }
            return match;
        });
        const result = apiItem || { name, ongoing: 0, completed: 0, total: 0 };
        if (apiItem) {
            console.log(`✅ [RDD Statistics] Found agenda: "${name}"`, apiItem);
        } else {
            console.log(`❌ [RDD Statistics] No data for agenda: "${name}"`);
        }
        return result;
    });

    console.log("📊 [RDD Statistics] Final rdeAgendaToShow:", rdeAgendaToShow);
    console.log("📊 [RDD Statistics] rdeAgendaToShow with data:", rdeAgendaToShow.filter(item => item.total > 0 || item.ongoing > 0 || item.completed > 0));

    const dost6PsToShow = allDost6Ps.map(name => {
        const apiItem = dost6Ps.find(item => item.name === name);
        return apiItem || { name, value: 0 };
    });

    // SDG metadata with colors for display
    const sdgMetadata = [
        { name: "1", fullName: "No Poverty", color: "#E5243B" },
        { name: "2", fullName: "Zero Hunger", color: "#DDA63A" },
        { name: "3", fullName: "Good Health and Well-being", color: "#4C9F38" },
        { name: "4", fullName: "Quality Education", color: "#C5192D" },
        { name: "5", fullName: "Gender Equality", color: "#FF3A21" },
        { name: "6", fullName: "Clean Water and Sanitation", color: "#26BDE2" },
        { name: "7", fullName: "Affordable and Clean Energy", color: "#FCC30B" },
        { name: "8", fullName: "Decent Work and Economic Growth", color: "#A21942" },
        { name: "9", fullName: "Industry, Innovation and Infrastructure", color: "#FD6925" },
        { name: "10", fullName: "Reduced Inequalities", color: "#DD1367" },
        { name: "11", fullName: "Sustainable Cities and Communities", color: "#FD9D24" },
        { name: "12", fullName: "Responsible Consumption and Production", color: "#BF8B2E" },
        { name: "13", fullName: "Climate Action", color: "#3F7E44" },
        { name: "14", fullName: "Life Below Water", color: "#0A97D9" },
        { name: "15", fullName: "Life on Land", color: "#56C02B" },
        { name: "16", fullName: "Peace, Justice and Strong Institutions", color: "#00689D" },
        { name: "17", fullName: "Partnerships for the Goals", color: "#19486A" },
    ];
    
    // Map API SDG data to include metadata
    const sdgToShow = sdgMetadata.map(meta => {
        const apiItem = sdg.find(item => 
            item.name === meta.name || 
            item.name === meta.fullName ||
            item.name === `SDG ${meta.name}`
        );
        return { 
            ...meta, 
            value: apiItem ? apiItem.value : 0 
        };
    });

    const maxRdeAgendaTotal = rdeAgendaToShow.length > 0 
        ? Math.max(...rdeAgendaToShow.map((item) => item.total), 1)
        : 1;
    const maxDostValue = dost6PsToShow.length > 0
        ? Math.max(...dost6PsToShow.map((item) => item.value), 1)
        : 1;
    const maxSdgValue = sdgToShow.length > 0
        ? Math.max(...sdgToShow.map((item) => item.value), 1)
        : 1;

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">
                                Loading analytics data...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="text-red-600 text-6xl mb-4">⚠️</div>
                            <p className="text-gray-600 mb-4">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumbs */}
                <div className="px-6 pt-6">
                    <Breadcrumbs items={[{ label: "Statistics", href: null }]} />
                </div>
                {/* Page Header (aligned with reference implementation) */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                            Research Analytics Dashboard
                        </h1>
                        <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                            Comprehensive overview of research proposals and
                            outcomes
                        </p>
                        {/* Manual Refresh Button */}
                        <div className="mt-4">
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Refresh statistics"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${
                                        isRefreshing ? "animate-spin" : ""
                                    }`}
                                />
                                <span>
                                    {isRefreshing ? "Refreshing..." : "Refresh Statistics"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="max-w-7xl mx-auto px-6 mb-6">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <Filter className="h-5 w-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Research Center:
                                </label>
                                <select
                                    value={selectedCenter || ""}
                                    onChange={(e) => setSelectedCenter(e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
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

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">
                                    Total Proposals
                                </p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {overview.totalProposals}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">
                                    Ongoing
                                </p>
                                <p className="text-3xl font-bold text-orange-500">
                                    {overview.totalOngoing}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">
                                    Completed
                                </p>
                                <p className="text-3xl font-bold text-green-500">
                                    {overview.totalCompleted}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Target className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RDE Agenda Chart Container */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
                    <div
                        className="space-y-6 relative"
                        ref={tooltipContainerRef}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Research Proposal Status per RDE Agenda
                            </h2>
                        </div>

                        <div className="space-y-4">
                                {rdeAgendaToShow.map((item, index) => (
                                    <div key={index} className="group">
                                        <div className="flex items-center space-x-6 p-4 rounded-xl hover:bg-white/50 transition-all duration-200">
                                            <div className="w-72 text-sm font-medium text-gray-700">
                                                {item.name}
                                            </div>

                                            <div className="flex-1 flex items-center space-x-4">
                                                <div
                                                    className="flex-1 h-12 rounded-xl overflow-hidden cursor-pointer relative flex shadow-inner bg-gray-100"
                                                    onMouseEnter={() =>
                                                        setHoveredItem(item)
                                                    }
                                                    onMouseLeave={() =>
                                                        setHoveredItem(null)
                                                    }
                                                    onMouseMove={(e) => {
                                                        const rect =
                                                            tooltipContainerRef.current?.getBoundingClientRect();
                                                        if (!rect) return;
                                                        setHoverPosition({
                                                            x:
                                                                e.clientX -
                                                                rect.left,
                                                            y:
                                                                e.clientY -
                                                                rect.top,
                                                        });
                                                    }}
                                                >
                                                    <div
                                                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-300 hover:from-orange-500 hover:to-orange-600 relative"
                                                        style={{
                                                            width: `${
                                                                maxRdeAgendaTotal >
                                                                0
                                                                    ? (item.ongoing /
                                                                          maxRdeAgendaTotal) *
                                                                      100
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                                                    </div>
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300 hover:from-green-500 hover:to-green-600 relative"
                                                        style={{
                                                            width: `${
                                                                maxRdeAgendaTotal >
                                                                0
                                                                    ? (item.completed /
                                                                          maxRdeAgendaTotal) *
                                                                      100
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                                                    </div>
                                                </div>

                                                <div className="w-24 text-right">
                                                    <span className="text-lg font-bold text-gray-900 bg-red-800 bg-clip-text text-transparent">
                                                        {item.total}
                                                    </span>
                                                    <div className="mt-1 space-y-1">
                                                        <span className="inline-block px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
                                                            {item.ongoing} ongoing
                                                        </span>
                                                        <span className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                                            {item.completed} completed
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Enhanced Hover Tooltip */}
                        {hoveredItem && (
                            <div
                                className="absolute bg-white/95 backdrop-blur-sm border border-white/40 rounded-2xl shadow-2xl p-5 text-sm z-50 pointer-events-none"
                                style={{
                                    left: `${hoverPosition.x}px`,
                                    top: `${hoverPosition.y - 16}px`,
                                    transform: "translate(-50%, -100%)",
                                    minWidth: "280px",
                                }}
                            >
                                <div className="font-bold text-gray-900 mb-3 text-base">
                                    {hoveredItem.name}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"></div>
                                            <span className="text-gray-700 font-medium">
                                                Ongoing
                                            </span>
                                        </div>
                                        <span className="font-bold text-orange-600">
                                            {hoveredItem.ongoing}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                                            <span className="text-gray-700 font-medium">
                                                Completed
                                            </span>
                                        </div>
                                        <span className="font-bold text-green-600">
                                            {hoveredItem.completed}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 mt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-900">
                                                Total (Ongoing + Completed)
                                            </span>
                                            <span className="font-bold text-xl text-gray-900">
                                                {hoveredItem.total}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Enhanced Legend */}
                        <div className="flex justify-center space-x-8 mt-8">
                            <div className="flex items-center space-x-3 px-4 py-2 bg-orange-50 rounded-xl">
                                <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"></div>
                                <span className="text-sm font-semibold text-gray-700">
                                    Ongoing
                                </span>
                            </div>
                            <div className="flex items-center space-x-3 px-4 py-2 bg-green-50 rounded-xl">
                                <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full"></div>
                                <span className="text-sm font-semibold text-gray-700">
                                    Completed
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced DOST 6Ps Chart Container */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
                    <div
                        className="space-y-6 relative"
                        ref={dostTooltipContainerRef}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Distribution of Research Proposals by DOST 6Ps
                            </h2>
                        </div>

                        <div className="flex items-end justify-between space-x-4 h-96 px-4">
                                {dost6PsToShow.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col items-center space-y-4 flex-1 group"
                                    >
                                        <div className="relative">
                                            <div
                                                className="w-20 bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 rounded-t-xl cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-105 relative overflow-hidden"
                                                style={{
                                                    height: `${
                                                        maxDostValue > 0
                                                            ? (item.value /
                                                                  maxDostValue) *
                                                              280
                                                            : 0
                                                    }px`,
                                                }}
                                                onMouseEnter={() =>
                                                    setHoveredBar(item)
                                                }
                                                onMouseLeave={() =>
                                                    setHoveredBar(null)
                                                }
                                                onMouseMove={(e) => {
                                                    const rect =
                                                        dostTooltipContainerRef.current?.getBoundingClientRect();
                                                    if (!rect) return;
                                                    setHoverPosition({
                                                        x:
                                                            e.clientX -
                                                            rect.left,
                                                        y: e.clientY - rect.top,
                                                    });
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30"></div>
                                            </div>
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-amber-700">
                                                {item.value}
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <div className="text-sm font-semibold text-gray-700 max-w-20 leading-tight">
                                                {item.name}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* DOST 6Ps Hover Tooltip */}
                        {hoveredBar && (
                            <div
                                className="absolute bg-white/95 backdrop-blur-sm border border-white/40 rounded-2xl shadow-2xl p-5 text-sm z-50 pointer-events-none"
                                style={{
                                    left: `${hoverPosition.x - 100}px`,
                                    top: `${hoverPosition.y - 100}px`,
                                    minWidth: "200px",
                                }}
                            >
                                <div className="font-bold text-gray-900 mb-2 text-base">
                                    {hoveredBar.name}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-4 h-4 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-full"></div>
                                        <span className="text-gray-700 font-medium">
                                            Proposals
                                        </span>
                                    </div>
                                    <span className="font-bold text-xl text-gray-900">
                                        {hoveredBar.value}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced SDG Chart Container */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
                    <div
                        className="space-y-6 relative"
                        ref={sdgTooltipContainerRef}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Distribution by Sustainable Development Goals
                            </h2>
                        </div>

                        <div className="flex items-end justify-between space-x-1 h-80 px-2">
                            {sdgToShow.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col items-center space-y-2 flex-1 group cursor-pointer"
                                        onMouseEnter={() => setHoveredSdg(item)}
                                        onMouseLeave={() => setHoveredSdg(null)}
                                        onMouseMove={(e) => {
                                            const rect =
                                                sdgTooltipContainerRef.current?.getBoundingClientRect();
                                            if (!rect) return;
                                            setHoverPosition({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top,
                                            });
                                        }}
                                    >
                                        <div className="relative">
                                            <div
                                                className="w-10 rounded-t-lg transition-all duration-300 hover:shadow-lg transform hover:scale-110 relative overflow-hidden"
                                                style={{
                                                    height: `${
                                                        maxSdgValue > 0
                                                            ? (item.value /
                                                                  maxSdgValue) *
                                                              250
                                                            : 0
                                                    }px`,
                                                    backgroundColor: item.color,
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/30"></div>
                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                            </div>
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold" style={{color: item.color}}>
                                                {item.value}
                                            </div>
                                        </div>

                                        <div className="w-8 h-8 flex items-center justify-center">
                                            <img
                                                src={`/sdg-goal-${item.name}.jpg`}
                                                alt={`SDG ${item.name}`}
                                                className="w-full h-full object-cover rounded-lg shadow-sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        

                        {/* SDG Hover Tooltip */}
                        {hoveredSdg && (
                            <div
                                className="absolute bg-white/95 backdrop-blur-sm border border-white/40 rounded-2xl shadow-2xl p-5 text-sm z-50 pointer-events-none"
                                style={{
                                    left: `${hoverPosition.x}px`,
                                    top: `${hoverPosition.y - 16}px`,
                                    transform: "translate(-50%, -100%)",
                                    minWidth: "240px",
                                }}
                            >
                                <div className="font-bold text-gray-900 mb-2 text-base">
                                    SDG {hoveredSdg.name}
                                </div>
                                <div className="text-gray-700 font-medium mb-3 text-sm">
                                    {hoveredSdg.fullName}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    hoveredSdg.color,
                                            }}
                                        ></div>
                                        <span className="text-gray-700 font-medium">
                                            Projects
                                        </span>
                                    </div>
                                    <span className="font-bold text-xl text-gray-900">
                                        {hoveredSdg.value}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="text-center text-sm font-semibold text-gray-600 mt-6 bg-gray-50/50 rounded-xl p-2">
                            Sustainable Development Goals (SDG)
                        </div>

                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                            {sdgToShow.map((item) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center space-x-3 p-3 bg-gray-50/50 rounded-xl hover:bg-white/70 transition-all duration-200"
                                    >
                                        <img
                                            src={`/sdg-goal-${item.name}.jpg`}
                                            alt={`SDG ${item.name}`}
                                            onError={(e) => { 
                                                e.currentTarget.onerror = null; // Prevent infinite loop
                                                e.currentTarget.style.display = 'none'; // Hide broken image
                                            }}
                                            className="w-6 h-6 object-cover rounded-lg shadow-sm flex-shrink-0"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">
                                                SDG {item.name}
                                            </span>
                                            <span className="text-xs text-gray-600 leading-tight">
                                                {item.fullName}
                                            </span>
                                            <span className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 w-max">
                                                {item.value} projects
                                            </span>
                                        </div>
                                    </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Moved layout imports to top to prevent duplicate import errors

RDDStatistics.layout = (page) => (
    <AppLayout>
        <RDDLayout>
            {page}
        </RDDLayout>
    </AppLayout>
);

export default RDDStatistics;
