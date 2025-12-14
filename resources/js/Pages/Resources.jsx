import React, { useEffect, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import ResourceGrid from "../Components/UI/ResourceGrid";
import RoleBasedLayout from "../Components/Layouts/RoleBasedLayout";
import AppLayout from "../Components/Layouts/AppLayout";
import axios from "axios";

const Resources = () => {
    const { user } = useAuth();
    const { props } = usePage();
    const currentUser = user || props?.auth?.user;
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    const axiosInstance = window.axios || axios;
    if (!window.axios) {
        axiosInstance.defaults.withCredentials = true;
        axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
    }

    // Validate authentication on mount
    useEffect(() => {
        if (!currentUser) {
            router.visit("/login");
            return;
        }

        if (currentUser.role?.userRole !== "Proponent") {
            router.visit("/dashboard");
        }
    }, [currentUser]);

    // Fetch templates from admin
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                setLoading(true);
                const res = await axiosInstance.get("/admin/templates/proponent", {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
                const list = res?.data?.data || res?.data || [];
                setTemplates(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error("Failed to load templates", e);
                setTemplates([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    // Map templates to resource format
    const resources = templates.map((template) => ({
        id: template.id || template.templateID,
        title: template.name || template.fileName || "Untitled",
        description: template.description || "Document template",
        type: (template.type || template.fileType || "FILE").toUpperCase(),
        fileSize: template.size || template.fileSize || "—",
        fileName: template.name || template.fileName,
        downloadUrl: template.url || template.filePath || "#",
    }));

    const handleDownload = (resource) => {
        if (resource.downloadUrl && resource.downloadUrl !== "#") {
            window.open(resource.downloadUrl, "_blank");
        }
    };

    const handleView = (resource) => {
        if (resource.downloadUrl && resource.downloadUrl !== "#") {
            window.open(resource.downloadUrl, "_blank");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Resources
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Access important documents, templates, and guidelines
                        for research proposals.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
                        <p className="mt-4 text-gray-600">Loading templates...</p>
                    </div>
                ) : (
                    <ResourceGrid
                        resources={resources}
                        onDownload={handleDownload}
                        onView={handleView}
                        emptyMessage="No resources available at this time"
                    />
                )}
            </div>
        </div>
    );
};

Resources.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Proponent">{page}</RoleBasedLayout>
    </AppLayout>
);

export default Resources;
