import React, { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import {
    FiSave,
    FiRefreshCw,
    FiDatabase,
    FiShield,
    FiBell,
    FiFolder,
    FiFileText,
    FiUpload,
    FiDownload,
    FiTrash2,
} from "react-icons/fi";
import AdminLayout from "../../../Components/Layouts/AdminLayout";
import axios from "axios";

const SystemSettings = () => {
    const { auth } = usePage().props;
    const currentUser = auth?.user;

    const [settings, setSettings] = useState({
        // Core
        systemName: "Research Management System",
        systemVersion: "1.0.0",
        // Security
        sessionTimeout: "30",
        maxFileSize: "20",
        logRetention: "90",
        // Backup
        backupFrequency: "daily",
        // Departments
        allowDepartmentCreation: true,
        requireDepartmentAssignment: true,
    });
    const [loading, setLoading] = useState(false);
    const axiosInstance = window.axios || axios;
    if (!window.axios) {
        axiosInstance.defaults.withCredentials = true;
        axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
    }
    const [departments, setDepartments] = useState([]);
    const [deptPage, setDeptPage] = useState(1);
    const DEPT_PER_PAGE = 5;
    const [deptLoading, setDeptLoading] = useState(false);
    const [deptForm, setDeptForm] = useState({ id: null, name: "" });
    const [deptErrors, setDeptErrors] = useState("");
    
    // Research Centers
    const [researchCenters, setResearchCenters] = useState([]);
    const [centerPage, setCenterPage] = useState(1);
    const CENTER_PER_PAGE = 5;
    const [centerLoading, setCenterLoading] = useState(false);
    const [centerForm, setCenterForm] = useState({ id: null, name: "", departmentID: "" });
    const [centerErrors, setCenterErrors] = useState("");
    
    // Document Templates - Separate for Proponent and General
    const [proponentTemplates, setProponentTemplates] = useState([]);
    const [generalTemplates, setGeneralTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [uploadingProponentTemplate, setUploadingProponentTemplate] = useState(false);
    const [uploadingGeneralTemplate, setUploadingGeneralTemplate] = useState(false);
    
    // Template upload modal states
    const [showProponentModal, setShowProponentModal] = useState(false);
    const [showGeneralModal, setShowGeneralModal] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [templateName, setTemplateName] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const sessionTimeoutNum = parseInt(settings.sessionTimeout, 10);
            const logRetentionNum = parseInt(settings.logRetention, 10);
            const maxFileSizeNum = parseInt(settings.maxFileSize, 10);
            
            // Validation check
            if (isNaN(sessionTimeoutNum) || sessionTimeoutNum < 5) {
                alert('Session timeout must be at least 5 minutes');
                setLoading(false);
                return;
            }
            if (isNaN(logRetentionNum) || logRetentionNum < 7) {
                alert('Log retention must be at least 7 days');
                setLoading(false);
                return;
            }
            if (isNaN(maxFileSizeNum) || maxFileSizeNum < 1) {
                alert('Max file size must be at least 1 MB');
                setLoading(false);
                return;
            }
            if (maxFileSizeNum > 20) {
                alert('Max file size cannot exceed 20 MB');
                setLoading(false);
                return;
            }
            
            const payload = {
                systemName: settings.systemName,
                systemVersion: settings.systemVersion,
                sessionTimeout: sessionTimeoutNum,
                logRetention: logRetentionNum,
                maxFileSize: maxFileSizeNum,
                backupFrequency: settings.backupFrequency,
                allowDepartmentCreation: !!settings.allowDepartmentCreation,
                requireDepartmentAssignment: !!settings.requireDepartmentAssignment,
            };
            
            console.log('Sending payload:', payload);
            
            const res = await axiosInstance.put('/admin/settings', payload, {
                headers: { Accept: 'application/json' },
                withCredentials: true,
            });
            alert('Settings saved');
        } catch (e) {
            console.error('Save settings failed', e?.response?.data || e?.message || e);
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (
            window.confirm(
                "Are you sure you want to reset all settings to default?"
            )
        ) {
            setSettings({
                systemName: "Research Management System",
                systemVersion: "1.0.0",
                sessionTimeout: "30",
                maxFileSize: "20",
                logRetention: "90",
                backupFrequency: "daily",
                allowDepartmentCreation: true,
                requireDepartmentAssignment: true,
            });
        }
    };

    // Departments CRUD handlers
    const fetchDepartments = async () => {
        try {
            setDeptLoading(true);
            const res = await axiosInstance.get("/admin/departments", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            const list = res?.data?.data || res?.data || [];
            setDepartments(Array.isArray(list) ? list : []);
            setDeptPage(1);
        } catch (e) {
            console.error("Failed to load departments", e);
            setDepartments([]);
        } finally {
            setDeptLoading(false);
        }
    };

    useEffect(() => {
        // Load current settings
        (async () => {
            try {
                const res = await axiosInstance.get('/admin/settings', {
                    headers: { Accept: 'application/json' },
                    withCredentials: true,
                });
                const s = res?.data || {};
                setSettings(prev => ({
                    ...prev,
                    systemName: s.systemName ?? prev.systemName,
                    systemVersion: s.systemVersion ?? prev.systemVersion,
                    sessionTimeout: String(s.sessionTimeout ?? prev.sessionTimeout),
                    maxFileSize: String(s.maxFileSize ?? prev.maxFileSize),
                    logRetention: String(s.logRetention ?? prev.logRetention),
                    backupFrequency: s.backupFrequency ?? prev.backupFrequency,
                    allowDepartmentCreation: Boolean(s.allowDepartmentCreation ?? prev.allowDepartmentCreation),
                    requireDepartmentAssignment: Boolean(s.requireDepartmentAssignment ?? prev.requireDepartmentAssignment),
                }));
            } catch (e) {
                console.warn('Failed to fetch settings, using defaults');
            }
        })();

        fetchDepartments();
        fetchResearchCenters();
        fetchTemplates();
    }, []);

    const resetDeptForm = () => {
        setDeptForm({ id: null, name: "" });
        setDeptErrors("");
    };

    const submitDepartment = async () => {
        if (!deptForm.name.trim()) {
            setDeptErrors("Department name is required");
            return;
        }
        try {
            setDeptLoading(true);
            if (deptForm.id) {
                await axiosInstance.put(`/admin/departments/${deptForm.id}`, { name: deptForm.name }, {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
            } else {
                await axiosInstance.post(`/admin/departments`, { name: deptForm.name }, {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
            }
            await fetchDepartments();
            resetDeptForm();
        } catch (e) {
            console.error("Save department failed", e?.response?.data || e?.message || e);
            setDeptErrors("Unable to save department");
        } finally {
            setDeptLoading(false);
        }
    };

    const editDepartment = (dept) => {
        setDeptForm({ id: dept.departmentID || dept.id, name: dept.name || dept.departmentName || "" });
        setDeptErrors("");
    };

    const deleteDepartment = async (dept) => {
        const id = dept.departmentID || dept.id;
        if (!id) return;
        if (!window.confirm(`Delete department "${dept.name || dept.departmentName}"?`)) return;
        try {
            setDeptLoading(true);
            await axiosInstance.delete(`/admin/departments/${id}`, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            await fetchDepartments();
        } catch (e) {
            console.error("Delete department failed", e?.response?.data || e?.message || e);
            const errorMessage = e?.response?.data?.message || "Unable to delete department";
            alert(errorMessage);
        } finally {
            setDeptLoading(false);
        }
    };

    // Research Centers CRUD handlers
    const fetchResearchCenters = async () => {
        try {
            setCenterLoading(true);
            const res = await axiosInstance.get("/admin/research-centers", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            const list = res?.data?.data || res?.data || [];
            setResearchCenters(Array.isArray(list) ? list : []);
            setCenterPage(1);
        } catch (e) {
            console.error("Failed to load research centers", e);
            setResearchCenters([]);
        } finally {
            setCenterLoading(false);
        }
    };

    const resetCenterForm = () => {
        setCenterForm({ id: null, name: "", departmentID: "" });
        setCenterErrors("");
    };

    const submitResearchCenter = async () => {
        if (!centerForm.name.trim()) {
            setCenterErrors("Research Center name is required");
            return;
        }
        try {
            setCenterLoading(true);
            const payload = {
                name: centerForm.name,
                departmentID: centerForm.departmentID || null
            };
            if (centerForm.id) {
                await axiosInstance.put(`/admin/research-centers/${centerForm.id}`, payload, {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
            } else {
                await axiosInstance.post(`/admin/research-centers`, payload, {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
            }
            await fetchResearchCenters();
            resetCenterForm();
        } catch (e) {
            console.error("Save research center failed", e?.response?.data || e?.message || e);
            setCenterErrors("Unable to save research center");
        } finally {
            setCenterLoading(false);
        }
    };

    const editResearchCenter = (center) => {
        setCenterForm({
            id: center.centerID || center.id,
            name: center.name || center.centerName || "",
            departmentID: center.departmentID || ""
        });
        setCenterErrors("");
    };

    const deleteResearchCenter = async (center) => {
        const id = center.centerID || center.id;
        if (!id) return;
        if (!window.confirm(`Delete research center "${center.name || center.centerName}"?`)) return;
        try {
            setCenterLoading(true);
            await axiosInstance.delete(`/admin/research-centers/${id}`, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            await fetchResearchCenters();
        } catch (e) {
            console.error("Delete research center failed", e?.response?.data || e?.message || e);
            alert("Unable to delete research center");
        } finally {
            setCenterLoading(false);
        }
    };

    // Document Templates handlers
    const fetchTemplates = async () => {
        try {
            setTemplatesLoading(true);
            // Fetch proponent templates
            const proponentRes = await axiosInstance.get("/admin/templates/proponent", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            const proponentList = proponentRes?.data?.data || proponentRes?.data || [];
            setProponentTemplates(Array.isArray(proponentList) ? proponentList : []);
            
            // Fetch general templates
            const generalRes = await axiosInstance.get("/admin/templates/general", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            const generalList = generalRes?.data?.data || generalRes?.data || [];
            setGeneralTemplates(Array.isArray(generalList) ? generalList : []);
        } catch (e) {
            console.error("Failed to load templates", e);
            setProponentTemplates([]);
            setGeneralTemplates([]);
        } finally {
            setTemplatesLoading(false);
        }
    };

    const pathinfo = (path, option) => {
        const parts = path.split('.');
        if (option === 'filename') {
            return parts.slice(0, -1).join('.');
        }
        return path;
    };

    const handleProponentTemplateUpload = async (e) => {
        const file = e.target.files?.[0];
        console.log('Proponent template upload triggered', { file });
        if (!file) {
            console.log('No file selected');
            return;
        }
        // Show modal to input template name
        setPendingFile(file);
        setTemplateName(pathinfo(file.name, 'filename')); // Pre-fill with filename without extension
        setShowProponentModal(true);
        e.target.value = "";
    };
    
    const confirmProponentUpload = async () => {
        if (!templateName.trim()) {
            alert('Please enter a template name');
            return;
        }
        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("name", templateName.trim());
        formData.append("type", "proponent");
        console.log('FormData prepared', { fileName: pendingFile.name, fileSize: pendingFile.size, fileType: pendingFile.type, customName: templateName });
        try {
            setUploadingProponentTemplate(true);
            setShowProponentModal(false);
            console.log('Sending POST to /admin/templates/proponent');
            const response = await axiosInstance.post("/admin/templates/proponent", formData, {
                headers: { 
                    Accept: "application/json"
                },
                withCredentials: true,
            });
            console.log('Upload successful', response.data);
            alert('Template uploaded successfully!');
            await fetchTemplates();
            setPendingFile(null);
            setTemplateName('');
        } catch (err) {
            console.error("Proponent template upload failed", err);
            console.error('Error response:', err.response);
            const errorMsg = err.response?.data?.message || err.response?.data?.errors || "Failed to upload proponent template";
            const errorText = typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg;
            alert(errorText);
        } finally {
            setUploadingProponentTemplate(false);
        }
    };

    const handleGeneralTemplateUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Show modal to input template name
        setPendingFile(file);
        setTemplateName(pathinfo(file.name, 'filename')); // Pre-fill with filename without extension
        setShowGeneralModal(true);
        e.target.value = "";
    };
    
    const confirmGeneralUpload = async () => {
        if (!templateName.trim()) {
            alert('Please enter a template name');
            return;
        }
        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("name", templateName.trim());
        formData.append("type", "general");
        try {
            setUploadingGeneralTemplate(true);
            setShowGeneralModal(false);
            await axiosInstance.post("/admin/templates/general", formData, {
                headers: { 
                    Accept: "application/json"
                },
                withCredentials: true,
            });
            alert('Template uploaded successfully!');
            await fetchTemplates();
            setPendingFile(null);
            setTemplateName('');
        } catch (err) {
            console.error("General template upload failed", err);
            const errorMsg = err.response?.data?.message || err.response?.data?.errors || "Failed to upload general template";
            const errorText = typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg;
            alert(errorText);
        } finally {
            setUploadingGeneralTemplate(false);
        }
    };

    const deleteTemplate = async (template, type) => {
        const id = template.id || template.templateID;
        if (!id) return;
        if (!window.confirm(`Delete template "${template.name || template.fileName}"?`)) return;
        try {
            setTemplatesLoading(true);
            await axiosInstance.delete(`/admin/templates/${type}/${id}`, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            await fetchTemplates();
        } catch (e) {
            console.error("Delete template failed", e);
            alert("Unable to delete template");
        } finally {
            setTemplatesLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            System Settings
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Configure system-wide settings and preferences
                        </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleReset}
                        className="admin-button-secondary flex items-center space-x-2"
                    >
                        <FiRefreshCw className="w-4 h-4" />
                        <span>Reset</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="admin-button-primary flex items-center space-x-2"
                    >
                        <FiSave className="w-4 h-4" />
                        <span>{loading ? "Saving..." : "Save Changes"}</span>
                    </button>
                </div>
            </div>

                <div className="admin-card">
                                <div className="admin-card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FiShield className="w-5 h-5 mr-2" />
                        Security
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Session Timeout (minutes)
                            </label>
                            <input
                                type="number"
                                name="sessionTimeout"
                                value={settings.sessionTimeout}
                                onChange={handleChange}
                                className="admin-input"
                                min="5"
                                max="480"
                            />
                        </div>
                        {/* Max File Upload Size moved to File Storage settings */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Log Retention (days)</label>
                            <select
                                name="logRetention"
                                value={settings.logRetention}
                                onChange={handleChange}
                                className="admin-input"
                            >
                                <option value="30">30 days</option>
                                <option value="60">60 days</option>
                                <option value="90">90 days</option>
                                <option value="180">180 days</option>
                                <option value="365">1 year</option>
                            </select>
                        </div>
                    </div>
                </div>

                

                <div className="admin-card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FiDatabase className="w-5 h-5 mr-2" />
                        Backup
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Backup Frequency
                            </label>
                            <select
                                name="backupFrequency"
                                value={settings.backupFrequency}
                                onChange={handleChange}
                                className="admin-input"
                            >
                                <option value="hourly">Hourly</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex">
                                <FiBell className="w-5 h-5 text-yellow-400" />
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-yellow-800">
                                        Last Backup
                                    </h4>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Successfully completed recently
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button className="admin-button-secondary w-full">
                            Create Manual Backup
                        </button>
                    </div>
                </div>

                

                {/* File Storage */}
                <div className="admin-card">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FiFolder className="w-5 h-5 mr-2" />
                        File Storage
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max File Upload Size (MB)</label>
                            <input
                                type="number"
                                name="maxFileSize"
                                value={settings.maxFileSize}
                                onChange={handleChange}
                                className="admin-input"
                                min="1"
                                max="20"
                            />
                            <p className="text-xs text-gray-500 mt-1">Maximum allowed: 20 MB</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Allowed File Types</label>
                            <div className="admin-input text-sm text-gray-600">PDF, DOCX, XLSX, CSV, PNG, JPG</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 border border-blue-200">
                            <strong>System-wide Setting:</strong> This max file size applies to all file uploads across the system including proposal submissions, progress reports, and template uploads.
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                            File storage is configured via `config/filesystems.php`.
                        </div>
                    </div>
                </div>

                {/* Proponent Templates */}
                <div className="admin-card lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FiFileText className="w-5 h-5 mr-2" />
                        Proponent Templates
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Upload templates specifically for Proponents. These will be available only in the Proponent Resources page.
                            </p>
                            <label className="admin-button-primary flex items-center space-x-2 cursor-pointer">
                                <FiUpload className="w-4 h-4" />
                                <span>{uploadingProponentTemplate ? "Uploading..." : "Upload Template"}</span>
                                <input
                                    type="file"
                                    onChange={handleProponentTemplateUpload}
                                    accept=".pdf,.doc,.docx,.xlsx,.xls"
                                    className="hidden"
                                    disabled={uploadingProponentTemplate}
                                />
                            </label>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">Template Name</th>
                                        <th className="text-left w-32">Type</th>
                                        <th className="text-left w-32">Size</th>
                                        <th className="w-52 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proponentTemplates.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center text-sm text-gray-500 py-6">
                                                No proponent templates uploaded yet
                                            </td>
                                        </tr>
                                    )}
                                    {proponentTemplates.map((template) => (
                                        <tr key={template.id || template.templateID} className="hover:bg-gray-50">
                                            <td className="text-base text-gray-900 py-4">
                                                {template.name || template.fileName}
                                            </td>
                                            <td className="text-sm text-gray-600 py-4">
                                                {(template.type || template.fileType || "").toUpperCase()}
                                            </td>
                                            <td className="text-sm text-gray-600 py-4">
                                                {template.size || template.fileSize || "—"}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <a
                                                        href={template.url || template.filePath || "#"}
                                                        download
                                                        className="admin-button-secondary px-4 py-2 flex items-center space-x-1"
                                                    >
                                                        <FiDownload className="w-4 h-4" />
                                                        <span>Download</span>
                                                    </a>
                                                    <button
                                                        onClick={() => deleteTemplate(template, 'proponent')}
                                                        className="admin-button-danger px-4 py-2"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex">
                                <FiBell className="w-5 h-5 text-blue-400" />
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-blue-800">Proponent Resources</h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Templates uploaded here will appear only in the Proponent Resources page.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* General Templates (CM, RDD, etc.) */}
                <div className="admin-card lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FiFileText className="w-5 h-5 mr-2" />
                        General Templates (CM, RDD & Others)
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Upload templates for Center Manager, RDD, and other roles. These will be shared across non-Proponent users.
                            </p>
                            <label className="admin-button-primary flex items-center space-x-2 cursor-pointer">
                                <FiUpload className="w-4 h-4" />
                                <span>{uploadingGeneralTemplate ? "Uploading..." : "Upload Template"}</span>
                                <input
                                    type="file"
                                    onChange={handleGeneralTemplateUpload}
                                    accept=".pdf,.doc,.docx,.xlsx,.xls"
                                    className="hidden"
                                    disabled={uploadingGeneralTemplate}
                                />
                            </label>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">Template Name</th>
                                        <th className="text-left w-32">Type</th>
                                        <th className="text-left w-32">Size</th>
                                        <th className="w-52 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {generalTemplates.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center text-sm text-gray-500 py-6">
                                                No general templates uploaded yet
                                            </td>
                                        </tr>
                                    )}
                                    {generalTemplates.map((template) => (
                                        <tr key={template.id || template.templateID} className="hover:bg-gray-50">
                                            <td className="text-base text-gray-900 py-4">
                                                {template.name || template.fileName}
                                            </td>
                                            <td className="text-sm text-gray-600 py-4">
                                                {(template.type || template.fileType || "").toUpperCase()}
                                            </td>
                                            <td className="text-sm text-gray-600 py-4">
                                                {template.size || template.fileSize || "—"}
                                            </td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <a
                                                        href={template.url || template.filePath || "#"}
                                                        download
                                                        className="admin-button-secondary px-4 py-2 flex items-center space-x-1"
                                                    >
                                                        <FiDownload className="w-4 h-4" />
                                                        <span>Download</span>
                                                    </a>
                                                    <button
                                                        onClick={() => deleteTemplate(template, 'general')}
                                                        className="admin-button-danger px-4 py-2"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex">
                                <FiBell className="w-5 h-5 text-green-400" />
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-green-800">Shared Resources</h4>
                                    <p className="text-sm text-green-700 mt-1">
                                        Templates uploaded here will appear in the Resources pages for Center Manager, RDD, and other non-Proponent roles.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Departments */}
                <div className="admin-card lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FiFolder className="w-5 h-5 mr-2" />
                        Departments
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                                <input
                                    type="text"
                                    value={deptForm.name}
                                    onChange={(e) => setDeptForm((p) => ({ ...p, name: e.target.value }))}
                                    className={`admin-input ${deptErrors ? 'border-red-500' : ''}`}
                                    placeholder="Enter department name"
                                />
                                {deptErrors && <p className="mt-1 text-sm text-red-600">{deptErrors}</p>}
                            </div>
                            <div className="flex items-end">
                                <button onClick={submitDepartment} className="admin-button-primary w-full" disabled={deptLoading}>
                                    {deptForm.id ? 'Update Department' : 'Add Department'}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">Name</th>
                                        <th className="w-52 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.length === 0 && (
                                        <tr>
                                            <td colSpan="2" className="text-center text-sm text-gray-500 py-6">No departments found</td>
                                        </tr>
                                    )}
                                    {departments
                                        .slice((deptPage - 1) * DEPT_PER_PAGE, deptPage * DEPT_PER_PAGE)
                                        .map((dept) => (
                                        <tr key={dept.departmentID || dept.id} className="hover:bg-gray-50">
                                            <td className="text-base text-gray-900 py-4">{dept.name || dept.departmentName}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => editDepartment(dept)} className="admin-button-secondary px-4 py-2">Edit</button>
                                                    <button onClick={() => deleteDepartment(dept)} className="admin-button-danger px-4 py-2">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {departments.length > DEPT_PER_PAGE && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-700">
                                    Showing {(deptPage - 1) * DEPT_PER_PAGE + 1}–{Math.min(deptPage * DEPT_PER_PAGE, departments.length)} of {departments.length}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setDeptPage((p) => Math.max(1, p - 1))}
                                        disabled={deptPage === 1}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: Math.ceil(departments.length / DEPT_PER_PAGE) }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setDeptPage(p)}
                                            className={`px-4 py-2 text-sm border rounded-md ${p === deptPage ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setDeptPage((p) => Math.min(Math.ceil(departments.length / DEPT_PER_PAGE), p + 1))}
                                        disabled={deptPage === Math.ceil(departments.length / DEPT_PER_PAGE)}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Research Centers */}
                <div className="admin-card lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <FiFolder className="w-5 h-5 mr-2" />
                        Research Centers
                    </h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <select
                                    value={centerForm.departmentID}
                                    onChange={(e) => setCenterForm((p) => ({ ...p, departmentID: e.target.value }))}
                                    className="admin-input"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept.departmentID || dept.id} value={dept.departmentID || dept.id}>
                                            {dept.name || dept.departmentName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Research Center Name</label>
                                <input
                                    type="text"
                                    value={centerForm.name}
                                    onChange={(e) => setCenterForm((p) => ({ ...p, name: e.target.value }))}
                                    className={`admin-input ${centerErrors ? 'border-red-500' : ''}`}
                                    placeholder="Enter research center name"
                                />
                                {centerErrors && <p className="mt-1 text-sm text-red-600">{centerErrors}</p>}
                            </div>
                            <div className="flex items-end">
                                <button onClick={submitResearchCenter} className="admin-button-primary w-full" disabled={centerLoading}>
                                    {centerForm.id ? 'Update Center' : 'Add Center'}
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">Name</th>
                                        <th className="text-left">Department</th>
                                        <th className="w-52 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {researchCenters.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center text-sm text-gray-500 py-6">No research centers found</td>
                                        </tr>
                                    )}
                                    {researchCenters
                                        .slice((centerPage - 1) * CENTER_PER_PAGE, centerPage * CENTER_PER_PAGE)
                                        .map((center) => (
                                        <tr key={center.centerID || center.id} className="hover:bg-gray-50">
                                            <td className="text-base text-gray-900 py-4">{center.name || center.centerName}</td>
                                            <td className="text-sm text-gray-600 py-4">{center.departmentName || '—'}</td>
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => editResearchCenter(center)} className="admin-button-secondary px-4 py-2">Edit</button>
                                                    <button onClick={() => deleteResearchCenter(center)} className="admin-button-danger px-4 py-2">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {researchCenters.length > CENTER_PER_PAGE && (
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-700">
                                    Showing {(centerPage - 1) * CENTER_PER_PAGE + 1}–{Math.min(centerPage * CENTER_PER_PAGE, researchCenters.length)} of {researchCenters.length}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCenterPage((p) => Math.max(1, p - 1))}
                                        disabled={centerPage === 1}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: Math.ceil(researchCenters.length / CENTER_PER_PAGE) }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setCenterPage(p)}
                                            className={`px-4 py-2 text-sm border rounded-md ${p === centerPage ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 hover:bg-gray-50'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCenterPage((p) => Math.min(Math.ceil(researchCenters.length / CENTER_PER_PAGE), p + 1))}
                                        disabled={centerPage === Math.ceil(researchCenters.length / CENTER_PER_PAGE)}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        {/* Proponent Template Name Modal */}
        {showProponentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Name Your Template</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Enter a descriptive name for this template. This will be shown to users instead of the file name.
                    </p>
                    <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., Research Proposal Form"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                        onKeyDown={(e) => e.key === 'Enter' && confirmProponentUpload()}
                    />
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                setShowProponentModal(false);
                                setPendingFile(null);
                                setTemplateName('');
                            }}
                            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmProponentUpload}
                            disabled={!templateName.trim()}
                            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Upload Template
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* General Template Name Modal */}
        {showGeneralModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Name Your Template</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Enter a descriptive name for this template. This will be shown to users instead of the file name.
                    </p>
                    <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., Compliance Matrix Template"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                        onKeyDown={(e) => e.key === 'Enter' && confirmGeneralUpload()}
                    />
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                setShowGeneralModal(false);
                                setPendingFile(null);
                                setTemplateName('');
                            }}
                            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmGeneralUpload}
                            disabled={!templateName.trim()}
                            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Upload Template
                        </button>
                    </div>
                </div>
            </div>
        )}
        </AdminLayout>
    );
};

export default SystemSettings;
