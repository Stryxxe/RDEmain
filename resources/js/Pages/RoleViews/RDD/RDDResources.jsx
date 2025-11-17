import React, { useState, useEffect } from "react";
import {
    BiSearch,
    BiDownload,
    BiShow,
    BiFile,
    BiCalendar,
    BiUser,
} from "react-icons/bi";
import rddService from "../../../services/rddService";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";

const RDDResources = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterType, setFilterType] = useState("All");
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await rddService.getResources();
            if (response.success) {
                setResources(response.data);
            } else {
                setError("Failed to fetch resources");
            }
        } catch (err) {
            console.error("Error fetching resources:", err);
            setError("Error loading resources");
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        "All",
        "Guidelines",
        "Templates",
        "Ethics",
        "Reference",
    ];
    const types = ["All", "PDF", "DOCX", "XLSX", "PPTX"];

    const filteredResources = resources.filter((resource) => {
        const matchesSearch =
            resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            resource.tags.some((tag) =>
                tag.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesCategory =
            filterCategory === "All" || resource.category === filterCategory;
        const matchesType =
            filterType === "All" || resource.type === filterType;

        return matchesSearch && matchesCategory && matchesType;
    });

    const getTypeIcon = (type) => {
        switch (type) {
            case "PDF":
                return (
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <BiFile className="text-red-600" />
                    </div>
                );
            case "DOCX":
                return (
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BiFile className="text-blue-600" />
                    </div>
                );
            case "XLSX":
                return (
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <BiFile className="text-green-600" />
                    </div>
                );
            case "PPTX":
                return (
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <BiFile className="text-orange-600" />
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <BiFile className="text-gray-600" />
                    </div>
                );
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case "Guidelines":
                return "bg-blue-100 text-blue-800";
            case "Templates":
                return "bg-green-100 text-green-800";
            case "Ethics":
                return "bg-purple-100 text-purple-800";
            case "Reference":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">
                                Loading resources...
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
                                onClick={fetchResources}
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
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
                        Research Resources
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Access guidelines, templates, and reference materials
                        for your research projects
                    </p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search resources..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-80 pl-4 pr-10 py-2 bg-gray-100 rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                            />
                            <BiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={filterCategory}
                                onChange={(e) =>
                                    setFilterCategory(e.target.value)
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                {types.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                            <BiDownload className="text-sm" />
                            Bulk Download
                        </button>
                    </div>
                </div>
            </div>

            {/* Resources Grid */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => (
                        <div
                            key={resource.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                {getTypeIcon(resource.type)}
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                                        resource.category
                                    )}`}
                                >
                                    {resource.category}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                {resource.title}
                            </h3>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                {resource.description}
                            </p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-xs text-gray-500">
                                    <BiCalendar className="mr-1" />
                                    {resource.uploadDate}
                                </div>
                                <div className="flex items-center text-xs text-gray-500">
                                    <BiUser className="mr-1" />
                                    {resource.uploader}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {resource.type} • {resource.size}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {resource.downloads} downloads
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-4">
                                {resource.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm">
                                    <BiDownload className="text-sm" />
                                    Download
                                </button>
                                <button className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                    <BiShow className="text-sm" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {resources.length}
                        </div>
                        <div className="text-sm text-gray-600">
                            Total Resources
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {
                                resources.filter(
                                    (r) => r.category === "Guidelines"
                                ).length
                            }
                        </div>
                        <div className="text-sm text-gray-600">Guidelines</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {
                                resources.filter(
                                    (r) => r.category === "Templates"
                                ).length
                            }
                        </div>
                        <div className="text-sm text-gray-600">Templates</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {resources.reduce((sum, r) => sum + r.downloads, 0)}
                        </div>
                        <div className="text-sm text-gray-600">
                            Total Downloads
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

RDDResources.layout = (page) => (
    <RoleBasedLayout roleName="Research & Development Division">
        {page}
    </RoleBasedLayout>
);

export default RDDResources;
