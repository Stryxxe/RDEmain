import React, { useState, useEffect } from "react";
import { useRouteParams } from "../../../Components/RoleBased/InertiaRoleRouter";
import { router, usePage } from "@inertiajs/react";
import { FaArrowLeft } from "react-icons/fa";
import PDFViewer from "../../../Components/PDFViewer";
import RoleBasedLayout from "../../../Components/Layouts/RoleBasedLayout";
import AppLayout from "../../../Components/Layouts/AppLayout";
import axios from "axios";

// Use window.axios which has session-based auth configured
const axiosInstance = window.axios || axios;
if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

const ProponentProgressReportDetail = ({ id: reportId }) => {
    const { props } = usePage();
    const routeParams = useRouteParams();
    // Get ID from props, route params, or fallback to prop
    const id = reportId || routeParams.id || props?.id;
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Wait a bit for ID to be available (in case of initial page load)
        const checkAndLoad = setTimeout(() => {
            if (!id) {
                setError("Progress report ID is required");
                setLoading(false);
                return;
            }
            
            fetchProgressReport();
        }, 100);

        return () => clearTimeout(checkAndLoad);
    }, [id]);

    const fetchProgressReport = async () => {
        if (!id) {
            setError("Progress report ID is required");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await axiosInstance.get(`/progress-reports/${id}`, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });

            if (response.data.success) {
                setReport(response.data.data);
            } else {
                setError(response.data.message || "Failed to fetch progress report");
            }
        } catch (err) {
            console.error("Error fetching progress report:", err);
            if (err.response?.status === 404) {
                setError("Progress report not found");
            } else if (err.response?.status === 401) {
                setError("Unauthorized. Please log in again.");
            } else {
                setError("Error loading progress report");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        router.visit("/proponent/progress-report");
    };

    if (loading) {
        return (
            <div className="p-6 bg-gray-100 min-h-screen overflow-y-auto">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">
                            Loading progress report...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="p-6 bg-gray-100 min-h-screen overflow-y-auto">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-red-600 text-6xl mb-4">⚠️</div>
                        <p className="text-gray-600 mb-4">
                            {error || "Progress report not found"}
                        </p>
                        <button
                            onClick={fetchProgressReport}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Transform report data
    const projectTitle = report.proposal?.researchTitle || "Unknown Project";
    const projectId = report.proposalID
        ? `PRO-${report.proposalID.toString().padStart(6, "0")}`
        : "N/A";
    const dateSubmitted = report.submittedAt
        ? new Date(report.submittedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
          })
        : "Not specified";

    // Get PDF path from report files - use authenticated route with filepath
    const pdfPath =
        report.files && report.files.length > 0 && report.files[0].filePath
            ? `/api/files/view?path=${encodeURIComponent(report.files[0].filePath)}`
            : null;

    // Get submitted documents list
    const submittedDocuments =
        report.files && report.files.length > 0
            ? report.files.map((file) => file.fileName)
            : ["No documents uploaded"];

    return (
        <div className="p-6 bg-gray-100 min-h-screen overflow-y-auto">
            {/* Back Button */}
            <div className="mb-4">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center bg-white text-purple-800 hover:text-purple-900 font-medium text-sm px-4 py-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
                >
                    <FaArrowLeft className="mr-2" />
                    Back to Progress Reports
                </button>
            </div>

            {/* Report Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
                {/* Header */}
                <h1 className="text-2xl font-bold text-gray-800">{projectTitle}</h1>

                {/* Meta Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                        <span className="font-medium text-gray-600">
                            Project ID:
                        </span>
                        <span className="ml-2 text-gray-800">{projectId}</span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-600">
                            Report Type:
                        </span>
                        <span className="ml-2 text-gray-800">
                            {report.reportType || "N/A"}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-600">
                            Report Period:
                        </span>
                        <span className="ml-2 text-gray-800">
                            {report.reportPeriod || "N/A"}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-600">
                            Date Submitted:
                        </span>
                        <span className="ml-2 text-gray-800">
                            {dateSubmitted}
                        </span>
                    </div>
                </div>

                {/* Divider */}
                <hr className="border-t border-gray-200" />

                {/* Description */}
                {report.achievements && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Description
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {report.achievements}
                        </p>
                    </div>
                )}

                {/* Additional Notes */}
                {report.additionalNotes && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Additional Notes
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {report.additionalNotes}
                        </p>
                    </div>
                )}

                {/* Divider */}
                {(report.achievements || report.additionalNotes) && (
                    <hr className="border-t border-gray-200" />
                )}

                {/* Submitted Documents */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Submitted Documents
                    </h3>
                    <ul className="list-disc list-inside text-sm text-purple-600">
                        {submittedDocuments.map((doc, index) => (
                            <li key={index}>
                                <span className="underline cursor-pointer hover:text-purple-800 transition">
                                    {doc}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* PDF Preview */}
            {pdfPath ? (
                <PDFViewer pdfPath={pdfPath} title="Document" />
            ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">📄</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Document Available
                        </h3>
                        <p className="text-gray-600">
                            This progress report doesn't have any uploaded documents yet.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

ProponentProgressReportDetail.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Proponent">{page}</RoleBasedLayout>
    </AppLayout>
);

export default ProponentProgressReportDetail;






