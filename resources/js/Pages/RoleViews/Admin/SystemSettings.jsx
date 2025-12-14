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
    FiPlus,
} from "react-icons/fi";
import AdminLayout from "../../../Components/Layouts/AdminLayout";
import SimpleAlert from "../../../Components/SimpleAlert";
import ConfirmDeleteDialog from "../../../Components/ConfirmDeleteDialog";
import axios from "axios";

const SystemSettings = () => {
    const { auth } = usePage().props;
    const currentUser = auth?.user;

    const [settings, setSettings] = useState({
        // Core
        systemName: "Research Management System",
        systemVersion: "1.0.0",
        // System Configuration
        sessionTimeout: "30",
        maxFileSize: "50",
        logRetention: "90",
        proposalYear: new Date().getFullYear().toString(),
        // Backup
        backupFrequency: "daily",
        backupStorageLocation: "local",
        // File Types
        allowedFileTypes: ".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg",
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
    const [selectedDepartments, setSelectedDepartments] = useState([]);

    // Research Centers
    const [researchCenters, setResearchCenters] = useState([]);
    const [centerPage, setCenterPage] = useState(1);
    const CENTER_PER_PAGE = 5;
    const [centerLoading, setCenterLoading] = useState(false);
    const [centerForm, setCenterForm] = useState({
        id: null,
        name: "",
        departmentID: "",
    });
    const [centerErrors, setCenterErrors] = useState("");
    const [selectedResearchCenters, setSelectedResearchCenters] = useState([]);

    // Document Templates - Separate for Proponent and General
    const [proponentTemplates, setProponentTemplates] = useState([]);
    const [generalTemplates, setGeneralTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [uploadingProponentTemplate, setUploadingProponentTemplate] =
        useState(false);
    const [uploadingGeneralTemplate, setUploadingGeneralTemplate] =
        useState(false);

    // Template upload modal states
    const [showProponentModal, setShowProponentModal] = useState(false);
    const [showGeneralModal, setShowGeneralModal] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const [templateName, setTemplateName] = useState("");

    // Project Roles
    const [projectRoles, setProjectRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [roleForm, setRoleForm] = useState({
        id: null,
        roleName: "",
        isActive: true,
    });
    const [roleErrors, setRoleErrors] = useState("");
    const [editingRole, setEditingRole] = useState(null);

    // UI feedback
    const [alertState, setAlertState] = useState({
        visible: false,
        type: "success",
        title: "",
        message: "",
    });
    const [savingStatus, setSavingStatus] = useState(""); // '', 'saving', 'saved'

    // Backup storage
    const filePickerRef = React.useRef(null);
    const [backupPath, setBackupPath] = useState("");
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [backupPathInput, setBackupPathInput] = useState("");
    const [showFolderBrowser, setShowFolderBrowser] = useState(false);
    const [selectedFolderPath, setSelectedFolderPath] = useState("");
    const [currentPath, setCurrentPath] = useState("C:\\");
    const [availableFolders, setAvailableFolders] = useState([
        { name: "Backups", path: "C:\\Backups" },
        { name: "Documents", path: "C:\\Users\\Documents" },
        { name: "Desktop", path: "C:\\Users\\Desktop" },
        { name: "Downloads", path: "C:\\Users\\Downloads" },
    ]);

    // Auto-hide alerts after 3 seconds
    useEffect(() => {
        if (!alertState.visible) return;
        const t = setTimeout(() => {
            setAlertState((prev) => ({ ...prev, visible: false }));
        }, 3000);
        return () => clearTimeout(t);
    }, [alertState.visible]);

    // Auto-save settings with debounce
    useEffect(() => {
        const autoSave = async () => {
            if (!settings.sessionTimeout || !settings.maxFileSize) return;

            setSavingStatus("saving");
            try {
                const sessionTimeoutNum = parseInt(settings.sessionTimeout, 10);
                const logRetentionNum = parseInt(settings.logRetention, 10);
                const maxFileSizeNum = parseInt(settings.maxFileSize, 10);

                if (
                    isNaN(sessionTimeoutNum) ||
                    sessionTimeoutNum < 5 ||
                    isNaN(logRetentionNum) ||
                    logRetentionNum < 7 ||
                    isNaN(maxFileSizeNum) ||
                    maxFileSizeNum < 1 ||
                    maxFileSizeNum > 50
                ) {
                    setSavingStatus("");
                    return;
                }

                await axiosInstance.put(
                    "/settings",
                    {
                        settings: {
                            systemName: settings.systemName,
                            systemVersion: settings.systemVersion,
                            sessionTimeout: sessionTimeoutNum,
                            logRetention: logRetentionNum,
                            maxFileSize: maxFileSizeNum,
                            backupFrequency: settings.backupFrequency,
                            backupStorageLocation:
                                settings.backupStorageLocation,
                            allowDepartmentCreation:
                                !!settings.allowDepartmentCreation,
                            requireDepartmentAssignment:
                                !!settings.requireDepartmentAssignment,
                            allowed_file_types: settings.allowedFileTypes,
                            max_file_size: maxFileSizeNum,
                        },
                    },
                    {
                        headers: { Accept: "application/json" },
                        withCredentials: true,
                    }
                );

                setSavingStatus("saved");
                setTimeout(() => setSavingStatus(""), 2000);
            } catch (error) {
                console.error("Auto-save failed:", error);
                setSavingStatus("");
            }
        };

        const timer = setTimeout(autoSave, 1000);
        return () => clearTimeout(timer);
    }, [
        settings.sessionTimeout,
        settings.logRetention,
        settings.maxFileSize,
        settings.allowedFileTypes,
        settings.backupFrequency,
        settings.backupStorageLocation,
        settings.systemName,
        settings.systemVersion,
        settings.allowDepartmentCreation,
        settings.requireDepartmentAssignment,
    ]);

    const FILE_TYPE_PRESETS = [
        {
            key: "docs",
            label: "Documents (PDF, DOC, DOCX)",
            value: ".pdf,.doc,.docx",
        },
        {
            key: "sheets",
            label: "Spreadsheets (XLS, XLSX, CSV)",
            value: ".xls,.xlsx,.csv",
        },
        {
            key: "images",
            label: "Images (PNG, JPG, JPEG)",
            value: ".png,.jpg,.jpeg",
        },
        {
            key: "common",
            label: "Common Docs + Images",
            value: ".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg",
        },
    ];
    const [showFileTypesMenu, setShowFileTypesMenu] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleBackupStorageClick = () => {
        setShowBackupModal(true);
        setBackupPathInput(backupPath);
    };

    const handleBrowseFolderClick = () => {
        // Trigger the native folder picker
        filePickerRef.current?.click();
    };

    const handleFolderSelection = (e) => {
        const files = e.target.files;
        console.log("Files selected:", files);

        if (files && files.length > 0) {
            const file = files[0];
            console.log("First file:", file);
            console.log("webkitRelativePath:", file.webkitRelativePath);
            console.log("file.path:", file.path);
            console.log("file.name:", file.name);

            let folderPath = "";

            if (file.path) {
                // Electron or some environments provide full path
                const lastSlash = Math.max(
                    file.path.lastIndexOf("/"),
                    file.path.lastIndexOf("\\")
                );
                folderPath = file.path.substring(0, lastSlash);
            } else if (file.webkitRelativePath) {
                // Get folder name from webkitRelativePath
                const parts = file.webkitRelativePath.split("/");
                folderPath = parts[0];
            } else {
                // Fallback to file name directory
                folderPath = file.name;
            }

            console.log("Extracted folder path:", folderPath);

            // Directly set the path in the main input field
            setBackupPathInput(folderPath);

            // Don't show the confirmation dialog, just close it if open
            setShowFolderBrowser(false);
            setSelectedFolderPath("");
        } else {
            console.log("No files selected");
        }
    };

    const handleConfirmFolderPath = () => {
        if (selectedFolderPath.trim()) {
            setBackupPathInput(selectedFolderPath);
            setShowFolderBrowser(false);
            setSelectedFolderPath("");
        }
    };

    const confirmBackupPath = () => {
        if (backupPathInput.trim()) {
            setBackupPath(backupPathInput);
            setSettings((prev) => ({
                ...prev,
                backupStorageLocation: backupPathInput,
            }));
            setShowBackupModal(false);
            setBackupPathInput("");
        }
    };

    const cancelBackupPath = () => {
        setShowBackupModal(false);
        setBackupPathInput("");
    };

    const triggerBackup = async () => {
        try {
            setLoading(true);
            const backupPath = settings.backupStorageLocation;

            if (!backupPath) {
                setAlertState({
                    visible: true,
                    type: "error",
                    title: "Configuration Error",
                    message: "Backup path not configured",
                });
                return;
            }

            // Step 1: Scan for existing backups to avoid duplicates
            const scanResponse = await axiosInstance.post("backup/scan", {
                backup_path: backupPath,
            });

            if (!scanResponse.data.success) {
                setAlertState({
                    visible: true,
                    type: "error",
                    title: "Scan Failed",
                    message:
                        scanResponse.data.message ||
                        "Scan failed before backup",
                });
                return;
            }

            const existingCount =
                scanResponse.data.data?.existing_backups_count ?? 0;

            // Step 2: Run backup with duplicate skipping
            const response = await axiosInstance.post("backup/trigger", {
                scan_for_duplicates: true,
            });

            if (response.data.success) {
                setAlertState({
                    visible: true,
                    type: "success",
                    title: "Backup Success",
                    message: `Scan found ${existingCount} existing backups. Completed! ${response.data.data.backed_up} proposals backed up, ${response.data.data.files_copied} files copied.`,
                });

                // Update last backup time
                setSettings((prev) => ({
                    ...prev,
                    lastBackupTime: new Date().toISOString(),
                }));
            } else {
                setAlertState({
                    visible: true,
                    type: "error",
                    title: "Backup Failed",
                    message: response.data.message || "Backup failed",
                });
            }
        } catch (error) {
            console.error("Backup error:", error);
            setAlertState({
                visible: true,
                type: "error",
                title: "Backup Error",
                message:
                    error.response?.data?.message || "Failed to trigger backup",
            });
        } finally {
            setLoading(false);
        }
    };

    const scanBackupFolder = async () => {
        try {
            setLoading(true);
            const backupPath = settings.backupStorageLocation;

            if (!backupPath) {
                setAlertState({
                    visible: true,
                    type: "error",
                    title: "Configuration Error",
                    message: "Backup path not configured",
                });
                return;
            }

            const response = await axiosInstance.post("backup/scan", {
                backup_path: backupPath,
            });

            if (response.data.success) {
                setAlertState({
                    visible: true,
                    type: "success",
                    title: "Scan Complete",
                    message: `Scan complete! Found ${response.data.data.existing_backups_count} existing backup records.`,
                });
            } else {
                setAlertState({
                    visible: true,
                    type: "error",
                    title: "Scan Failed",
                    message: response.data.message || "Scan failed",
                });
            }
        } catch (error) {
            console.error("Scan error:", error);
            setAlertState({
                visible: true,
                type: "error",
                title: "Scan Error",
                message:
                    error.response?.data?.message ||
                    "Failed to scan backup folder",
            });
        } finally {
            setLoading(false);
        }
    };

    const clearBackupPath = () => {
        setBackupPath("");
        setSettings((prev) => ({
            ...prev,
            backupStorageLocation: "",
        }));
    };

    const togglePreset = (presetKey) => {
        const preset = FILE_TYPE_PRESETS.find((p) => p.key === presetKey);
        if (!preset) return;
        const current = (settings.allowedFileTypes || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        const toAdd = preset.value.split(",").map((s) => s.trim());
        const merged = Array.from(new Set([...current, ...toAdd]));
        setSettings((prev) => ({
            ...prev,
            allowedFileTypes: merged.join(","),
        }));
    };

    const removePresetExts = (presetKey) => {
        const preset = FILE_TYPE_PRESETS.find((p) => p.key === presetKey);
        if (!preset) return;
        const removeSet = new Set(preset.value.split(",").map((s) => s.trim()));
        const next = (settings.allowedFileTypes || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((ext) => !removeSet.has(ext));
        setSettings((prev) => ({ ...prev, allowedFileTypes: next.join(",") }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const sessionTimeoutNum = parseInt(settings.sessionTimeout, 10);
            const logRetentionNum = parseInt(settings.logRetention, 10);
            const maxFileSizeNum = parseInt(settings.maxFileSize, 10);

            // Validation check
            if (isNaN(sessionTimeoutNum) || sessionTimeoutNum < 5) {
                alert("Session timeout must be at least 5 minutes");
                setLoading(false);
                return;
            }
            if (isNaN(logRetentionNum) || logRetentionNum < 7) {
                alert("Log retention must be at least 7 days");
                setLoading(false);
                return;
            }
            if (isNaN(maxFileSizeNum) || maxFileSizeNum < 1) {
                alert("Max file size must be at least 1 MB");
                setLoading(false);
                return;
            }
            if (maxFileSizeNum > 50) {
                await window.customAlert("Max file size cannot exceed 50 MB", "Validation Error");
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
                requireDepartmentAssignment:
                    !!settings.requireDepartmentAssignment,
                allowedFileTypes: settings.allowedFileTypes,
            };

            console.log("Sending payload:", payload);
            const res = await axiosInstance.put(
                "/settings",
                {
                    settings: {
                        allowed_file_types: settings.allowedFileTypes,
                        max_file_size: maxFileSizeNum,
                    },
                },
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                }
            );
            setAlertState({
                visible: true,
                type: "success",
                title: "Settings Saved",
                message: "Your changes have been applied successfully.",
            });
        } catch (e) {
            console.error(
                "Save settings failed",
                e?.response?.data || e?.message || e
            );
            setAlertState({
                visible: true,
                type: "error",
                title: "Save Failed",
                message:
                    e?.response?.data?.message ||
                    "Failed to save settings. Please try again.",
            });
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
                maxFileSize: "50",
                logRetention: "90",
                backupFrequency: "daily",
                allowDepartmentCreation: true,
                requireDepartmentAssignment: true,
            });
            setAlertState({
                visible: true,
                type: "success",
                title: "Defaults Restored",
                message: "System settings have been reset to defaults.",
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
                const res = await axiosInstance.get("/settings", {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
                const s = res?.data?.data || res?.data || {};
                setSettings((prev) => ({
                    ...prev,
                    systemName: s.systemName ?? prev.systemName,
                    systemVersion: s.systemVersion ?? prev.systemVersion,
                    sessionTimeout: String(
                        s.sessionTimeout ?? prev.sessionTimeout
                    ),
                    maxFileSize: String(s.max_file_size ?? prev.maxFileSize),
                    logRetention: String(s.logRetention ?? prev.logRetention),
                    backupFrequency: s.backupFrequency ?? prev.backupFrequency,
                    backupStorageLocation:
                        s.backupStorageLocation ?? prev.backupStorageLocation,
                    allowDepartmentCreation: Boolean(
                        s.allowDepartmentCreation ??
                            prev.allowDepartmentCreation
                    ),
                    requireDepartmentAssignment: Boolean(
                        s.requireDepartmentAssignment ??
                            prev.requireDepartmentAssignment
                    ),
                    allowedFileTypes:
                        s.allowed_file_types ?? prev.allowedFileTypes,
                }));
            } catch (e) {
                console.warn("Failed to fetch settings, using defaults");
            }
        })();

        fetchDepartments();
        fetchResearchCenters();
        fetchTemplates();
    }, []);

    const resetDeptForm = () => {
        setDeptForm({ id: null, name: "", college_idNo: "" });
        setDeptErrors("");
    };

    const submitDepartment = async () => {
        if (!deptForm.name.trim()) {
            setDeptErrors("Academic Unit name is required");
            return;
        }
        try {
            setDeptLoading(true);
            const payload = {
                name: deptForm.name,
                college_idNo: deptForm.college_idNo || null,
            };
            if (deptForm.id) {
                await axiosInstance.put(
                    `/admin/departments/${deptForm.id}`,
                    payload,
                    {
                        headers: { Accept: "application/json" },
                        withCredentials: true,
                    }
                );
            } else {
                await axiosInstance.post(`/admin/departments`, payload, {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
            }
            await fetchDepartments();
            resetDeptForm();
        } catch (e) {
            console.error(
                "Save department failed",
                e?.response?.data || e?.message || e
            );
            setDeptErrors("Unable to save Academic Unit");
        } finally {
            setDeptLoading(false);
        }
    };

    const editDepartment = (dept) => {
        setDeptForm({
            id: dept.departmentID || dept.id,
            name: dept.name || dept.departmentName || "",
            college_idNo: dept.college_idNo || "",
        });
        setDeptErrors("");
    };

    const deleteDepartment = async (dept) => {
        const id = dept.departmentID || dept.id;
        if (!id) return;
        const confirmed = await window.customConfirm(
            `Delete Academic Unit "${dept.name || dept.departmentName}"?`,
            "Confirm Deletion"
        );
        if (!confirmed) return;
        try {
            setDeptLoading(true);
            await axiosInstance.delete(`/admin/departments/${id}`, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            await fetchDepartments();
            setSelectedDepartments([]);
        } catch (e) {
            console.error(
                "Delete department failed",
                e?.response?.data || e?.message || e
            );
            const errorMessage =
                e?.response?.data?.message || "Unable to delete Academic Unit";
            alert(errorMessage);
        } finally {
            setDeptLoading(false);
        }
    };

    const bulkDeleteDepartments = async () => {
        if (selectedDepartments.length === 0) return;
        const confirmed = await window.customConfirm(
            `Delete ${selectedDepartments.length} selected Academic Unit(s)?`,
            "Confirm Bulk Deletion"
        );
        if (!confirmed) return;
        try {
            setDeptLoading(true);
            await axiosInstance.post(
                "/admin/departments/bulk-delete",
                {
                    ids: selectedDepartments,
                },
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                }
            );
            await fetchDepartments();
            setSelectedDepartments([]);
        } catch (e) {
            console.error(
                "Bulk delete departments failed",
                e?.response?.data || e?.message || e
            );
            const errorMessage =
                e?.response?.data?.message || "Unable to delete Academic Units";
            alert(errorMessage);
        } finally {
            setDeptLoading(false);
        }
    };

    const toggleDepartmentSelection = (id) => {
        setSelectedDepartments((prev) =>
            prev.includes(id)
                ? prev.filter((selectedId) => selectedId !== id)
                : [...prev, id]
        );
    };

    const toggleAllDepartments = () => {
        const currentPageDepts = departments
            .slice((deptPage - 1) * DEPT_PER_PAGE, deptPage * DEPT_PER_PAGE)
            .map((dept) => dept.departmentID || dept.id);

        const allSelected = currentPageDepts.every((id) =>
            selectedDepartments.includes(id)
        );

        if (allSelected) {
            setSelectedDepartments((prev) =>
                prev.filter((id) => !currentPageDepts.includes(id))
            );
        } else {
            setSelectedDepartments((prev) => {
                const newSelection = [...prev];
                currentPageDepts.forEach((id) => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
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
                departmentID: centerForm.departmentID || null,
            };
            if (centerForm.id) {
                await axiosInstance.put(
                    `/admin/research-centers/${centerForm.id}`,
                    payload,
                    {
                        headers: { Accept: "application/json" },
                        withCredentials: true,
                    }
                );
            } else {
                await axiosInstance.post(`/admin/research-centers`, payload, {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
            }
            await fetchResearchCenters();
            resetCenterForm();
        } catch (e) {
            console.error(
                "Save research center failed",
                e?.response?.data || e?.message || e
            );
            setCenterErrors("Unable to save research center");
        } finally {
            setCenterLoading(false);
        }
    };

    const editResearchCenter = (center) => {
        setCenterForm({
            id: center.centerID || center.id,
            name: center.name || center.centerName || "",
            departmentID: center.departmentID || "",
        });
        setCenterErrors("");
    };

    const deleteResearchCenter = async (center) => {
        const id = center.centerID || center.id;
        if (!id) return;
        const confirmed = await window.customConfirm(
            `Delete research center "${center.name || center.centerName}"?`,
            "Confirm Deletion"
        );
        if (!confirmed) return;
        try {
            setCenterLoading(true);
            await axiosInstance.delete(`/admin/research-centers/${id}`, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            await fetchResearchCenters();
            setSelectedResearchCenters([]);
        } catch (e) {
            console.error(
                "Delete research center failed",
                e?.response?.data || e?.message || e
            );
            alert("Unable to delete research center");
        } finally {
            setCenterLoading(false);
        }
    };

    const bulkDeleteResearchCenters = async () => {
        if (selectedResearchCenters.length === 0) return;
        const confirmed = await window.customConfirm(
            `Delete ${selectedResearchCenters.length} selected research center(s)?`,
            "Confirm Bulk Deletion"
        );
        if (!confirmed) return;
        try {
            setCenterLoading(true);
            await axiosInstance.post(
                "/admin/research-centers/bulk-delete",
                {
                    ids: selectedResearchCenters,
                },
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                }
            );
            await fetchResearchCenters();
            setSelectedResearchCenters([]);
        } catch (e) {
            console.error(
                "Bulk delete research centers failed",
                e?.response?.data || e?.message || e
            );
            const errorMessage =
                e?.response?.data?.message ||
                "Unable to delete research centers";
            alert(errorMessage);
        } finally {
            setCenterLoading(false);
        }
    };

    const toggleResearchCenterSelection = (id) => {
        setSelectedResearchCenters((prev) =>
            prev.includes(id)
                ? prev.filter((selectedId) => selectedId !== id)
                : [...prev, id]
        );
    };

    const toggleAllResearchCenters = () => {
        const currentPageCenters = researchCenters
            .slice(
                (centerPage - 1) * CENTER_PER_PAGE,
                centerPage * CENTER_PER_PAGE
            )
            .map((center) => center.centerID || center.id);

        const allSelected = currentPageCenters.every((id) =>
            selectedResearchCenters.includes(id)
        );

        if (allSelected) {
            setSelectedResearchCenters((prev) =>
                prev.filter((id) => !currentPageCenters.includes(id))
            );
        } else {
            setSelectedResearchCenters((prev) => {
                const newSelection = [...prev];
                currentPageCenters.forEach((id) => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                return newSelection;
            });
        }
    };

    // Document Templates handlers
    const fetchTemplates = async () => {
        try {
            setTemplatesLoading(true);
            // Fetch proponent templates
            const proponentRes = await axiosInstance.get(
                "/admin/templates/proponent",
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                }
            );
            const proponentList =
                proponentRes?.data?.data || proponentRes?.data || [];
            setProponentTemplates(
                Array.isArray(proponentList) ? proponentList : []
            );

            // Fetch general templates
            const generalRes = await axiosInstance.get(
                "/admin/templates/general",
                {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                }
            );
            const generalList =
                generalRes?.data?.data || generalRes?.data || [];
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
        const parts = path.split(".");
        if (option === "filename") {
            return parts.slice(0, -1).join(".");
        }
        return path;
    };

    const handleProponentTemplateUpload = async (e) => {
        const file = e.target.files?.[0];
        console.log("Proponent template upload triggered", { file });
        if (!file) {
            console.log("No file selected");
            return;
        }
        // Show modal to input template name
        setPendingFile(file);
        setTemplateName(pathinfo(file.name, "filename")); // Pre-fill with filename without extension
        setShowProponentModal(true);
        e.target.value = "";
    };

    const confirmProponentUpload = async () => {
        if (!templateName.trim()) {
            await window.customAlert("Please enter a template name", "Validation Error");
            return;
        }
        const formData = new FormData();
        formData.append("file", pendingFile);
        formData.append("name", templateName.trim());
        formData.append("type", "proponent");
        console.log("FormData prepared", {
            fileName: pendingFile.name,
            fileSize: pendingFile.size,
            fileType: pendingFile.type,
            customName: templateName,
        });
        try {
            setUploadingProponentTemplate(true);
            setShowProponentModal(false);
            console.log("Sending POST to /admin/templates/proponent");
            const response = await axiosInstance.post(
                "/admin/templates/proponent",
                formData,
                {
                    headers: {
                        Accept: "application/json",
                    },
                    withCredentials: true,
                }
            );
            console.log("Upload successful", response.data);
            await window.customAlert("Template uploaded successfully!", "Success", 3000);
            await fetchTemplates();
            setPendingFile(null);
            setTemplateName("");
        } catch (err) {
            console.error("Proponent template upload failed", err);
            console.error("Error response:", err.response);
            const errorMsg =
                err.response?.data?.message ||
                err.response?.data?.errors ||
                "Failed to upload proponent template";
            const errorText =
                typeof errorMsg === "object"
                    ? JSON.stringify(errorMsg)
                    : errorMsg;
            await window.customAlert(errorText, "Upload Failed");
        } finally {
            setUploadingProponentTemplate(false);
        }
    };

    const handleGeneralTemplateUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Show modal to input template name
        setPendingFile(file);
        setTemplateName(pathinfo(file.name, "filename")); // Pre-fill with filename without extension
        setShowGeneralModal(true);
        e.target.value = "";
    };

    const confirmGeneralUpload = async () => {
        if (!templateName.trim()) {
            await window.customAlert("Please enter a template name", "Validation Error");
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
                    Accept: "application/json",
                },
                withCredentials: true,
            });
            await window.customAlert("Template uploaded successfully!", "Success", 3000);
            await fetchTemplates();
            setPendingFile(null);
            setTemplateName("");
        } catch (err) {
            console.error("General template upload failed", err);
            const errorMsg =
                err.response?.data?.message ||
                err.response?.data?.errors ||
                "Failed to upload general template";
            const errorText =
                typeof errorMsg === "object"
                    ? JSON.stringify(errorMsg)
                    : errorMsg;
            await window.customAlert(errorText, "Upload Failed");
        } finally {
            setUploadingGeneralTemplate(false);
        }
    };

    const deleteTemplate = async (template, type) => {
        const id = template.id || template.templateID;
        if (!id) return;
        const confirmed = await window.customConfirm(
            `Delete template "${template.name || template.fileName}"?`,
            "Confirm Deletion"
        );
        if (!confirmed) return;
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

    // Project Roles CRUD handlers
    const fetchProjectRoles = async () => {
        try {
            setRolesLoading(true);
            const res = await axiosInstance.get("/project-roles", {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            const list = res?.data?.data || res?.data || [];
            setProjectRoles(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("Failed to load project roles", e);
            setProjectRoles([]);
        } finally {
            setRolesLoading(false);
        }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        if (!roleForm.roleName.trim()) {
            setRoleErrors("Role name is required");
            return;
        }
        try {
            setRolesLoading(true);
            setRoleErrors("");
            if (editingRole) {
                await axiosInstance.put(
                    `/project-roles/${editingRole}`,
                    roleForm,
                    {
                        headers: { Accept: "application/json" },
                        withCredentials: true,
                    }
                );
            } else {
                await axiosInstance.post("/project-roles", roleForm, {
                    headers: { Accept: "application/json" },
                    withCredentials: true,
                });
            }
            setRoleForm({
                id: null,
                roleName: "",
                description: "",
                isActive: true,
            });
            setEditingRole(null);
            await fetchProjectRoles();
        } catch (e) {
            console.error("Save role failed", e);
            setRoleErrors(e?.response?.data?.message || "Failed to save role");
        } finally {
            setRolesLoading(false);
        }
    };

    const handleEditRole = (role) => {
        setEditingRole(role.projectRoleID);
        setRoleForm({
            id: role.projectRoleID,
            roleName: role.roleName,
            isActive: role.isActive,
        });
    };

    const handleCancelEditRole = () => {
        setEditingRole(null);
        setRoleForm({ id: null, roleName: "", isActive: true });
        setRoleErrors("");
    };

    const handleDeleteRole = async (id) => {
        if (
            !window.confirm(
                "Delete this project role? Members with this role will have it set to null."
            )
        )
            return;
        try {
            setRolesLoading(true);
            await axiosInstance.delete(`/project-roles/${id}`, {
                headers: { Accept: "application/json" },
                withCredentials: true,
            });
            await fetchProjectRoles();
        } catch (e) {
            console.error("Delete role failed", e);
            alert("Failed to delete role");
        } finally {
            setRolesLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectRoles();
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        System Settings
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600">
                            Configure system-wide settings and preferences
                        </p>
                        {savingStatus === "saving" && (
                            <span className="text-xs text-blue-600 flex items-center gap-1">
                                <svg
                                    className="animate-spin h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Saving...
                            </span>
                        )}
                        {savingStatus === "saved" && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <svg
                                    className="h-3 w-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Saved
                            </span>
                        )}
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <FiShield className="w-5 h-5 mr-2" />
                            System Configuration
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Proposal ID Year
                                </label>
                                <input
                                    type="number"
                                    name="proposalYear"
                                    value={settings.proposalYear}
                                    onChange={handleChange}
                                    className="admin-input"
                                    min="2000"
                                    max="2999"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Year used in proposal ID format:
                                    YEAR-RDP-INT/EXT-college_idNo
                                </p>
                            </div>
                            {/* Max File Upload Size moved to File Storage settings */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Log Retention (days)
                                </label>
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Backup Storage Location
                                </label>
                                <div className="space-y-2">
                                    {backupPath ? (
                                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <FiFolder className="w-5 h-5 text-green-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-green-900 truncate">
                                                    {backupPath}
                                                </p>
                                                <p className="text-xs text-green-700 mt-0.5">
                                                    Backups will be stored here
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBackupPath("");
                                                    setSettings((prev) => ({
                                                        ...prev,
                                                        backupStorageLocation:
                                                            "",
                                                    }));
                                                }}
                                                className="flex-shrink-0 text-green-600 hover:text-red-600 transition-colors"
                                                title="Clear selection"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleBackupStorageClick}
                                            className="w-full p-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700"
                                        >
                                            <FiFolder className="w-5 h-5" />
                                            <span className="font-medium">
                                                Click to select backup storage
                                                location
                                            </span>
                                        </button>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        Select a folder where backups will be
                                        automatically stored
                                    </p>
                                </div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex">
                                    <FiBell className="w-5 h-5 text-yellow-400" />
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-yellow-800">
                                            Last Backup
                                        </h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            {settings.lastBackupTime
                                                ? new Date(
                                                      settings.lastBackupTime
                                                  ).toLocaleString()
                                                : "No backups yet"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={triggerBackup}
                                    disabled={!backupPath || loading}
                                    className="admin-button-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? "Scanning + Backing Up..."
                                        : "Create Manual Backup (scans first)"}
                                </button>
                                <button
                                    type="button"
                                    onClick={scanBackupFolder}
                                    disabled={!backupPath || loading}
                                    className="admin-button-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? "Scanning..."
                                        : "Scan Backup Folder Only"}
                                </button>
                            </div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max File Upload Size (MB)
                                </label>
                                <input
                                    type="number"
                                    name="maxFileSize"
                                    value={settings.maxFileSize}
                                    onChange={handleChange}
                                    className="admin-input"
                                    min="1"
                                    max="50"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Maximum allowed: 50 MB
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Allowed File Types
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowFileTypesMenu((v) => !v)
                                        }
                                        className="admin-input flex items-center justify-between"
                                    >
                                        <span>Select presets</span>
                                        <svg
                                            className="w-4 h-4 text-gray-500"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                    {showFileTypesMenu && (
                                        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 space-y-2">
                                            {FILE_TYPE_PRESETS.map((preset) => {
                                                const current = (
                                                    settings.allowedFileTypes ||
                                                    ""
                                                )
                                                    .split(",")
                                                    .map((s) => s.trim())
                                                    .filter(Boolean);
                                                const allIncluded = preset.value
                                                    .split(",")
                                                    .every((ext) =>
                                                        current.includes(ext)
                                                    );
                                                return (
                                                    <label
                                                        key={preset.key}
                                                        className="flex items-center justify-between gap-2 cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    allIncluded
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        togglePreset(
                                                                            preset.key
                                                                        );
                                                                    } else {
                                                                        removePresetExts(
                                                                            preset.key
                                                                        );
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                            />
                                                            <span className="text-sm text-gray-800">
                                                                {preset.label}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 font-mono">
                                                            {preset.value}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                            <div className="flex justify-end pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowFileTypesMenu(
                                                            false
                                                        )
                                                    }
                                                    className="admin-button-secondary"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(settings.allowedFileTypes || "")
                                        .split(",")
                                        .map((s) => s.trim())
                                        .filter(Boolean)
                                        .map((ext) => (
                                            <span
                                                key={ext}
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 font-mono"
                                            >
                                                {ext}
                                            </span>
                                        ))}
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 border border-blue-200">
                                <strong>System-wide Setting:</strong> This max
                                file size applies to all file uploads across the
                                system including proposal submissions, progress
                                reports, and template uploads.
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                                File storage is configured via
                                `config/filesystems.php`.
                            </div>
                        </div>
                    </div>

                    {/* Inline alerts */}
                    {alertState.visible && (
                        <div className="mb-4">
                            <SimpleAlert
                                type={alertState.type}
                                title={alertState.title}
                                message={alertState.message}
                                onClose={() =>
                                    setAlertState((prev) => ({
                                        ...prev,
                                        visible: false,
                                    }))
                                }
                            />
                        </div>
                    )}

                    {/* Project Roles */}
                    <div className="admin-card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                            <FiShield className="w-5 h-5 mr-2" />
                            Project Roles
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Manage roles that proponents can assign to team
                            members when adding them to proposals.
                        </p>

                        {/* Add/Edit Role Form */}
                        <form
                            onSubmit={handleRoleSubmit}
                            className="mb-6 bg-gray-50 rounded-lg p-4"
                        >
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role Name{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={roleForm.roleName}
                                    onChange={(e) =>
                                        setRoleForm({
                                            ...roleForm,
                                            roleName: e.target.value,
                                        })
                                    }
                                    className="admin-input"
                                    placeholder="e.g., Principal Investigator"
                                    required
                                />
                            </div>
                            {roleErrors && (
                                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                                    {roleErrors}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={rolesLoading}
                                    className="admin-button-primary"
                                >
                                    {editingRole ? "Update Role" : "Add Role"}
                                </button>
                                {editingRole && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEditRole}
                                        className="admin-button-secondary"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Roles List */}
                        <div className="overflow-x-auto">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">Role Name</th>
                                        <th className="text-left w-24">
                                            Status
                                        </th>
                                        <th className="text-right w-40">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rolesLoading ? (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="text-center text-sm text-gray-500 py-6"
                                            >
                                                Loading roles...
                                            </td>
                                        </tr>
                                    ) : projectRoles.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="text-center text-sm text-gray-500 py-6"
                                            >
                                                No project roles yet. Add one
                                                above.
                                            </td>
                                        </tr>
                                    ) : (
                                        projectRoles.map((role) => (
                                            <tr
                                                key={role.projectRoleID}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="text-sm font-medium text-gray-900">
                                                    {role.roleName}
                                                </td>
                                                <td className="text-sm">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                            role.isActive
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-gray-100 text-gray-800"
                                                        }`}
                                                    >
                                                        {role.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleEditRole(
                                                                    role
                                                                )
                                                            }
                                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteRole(
                                                                    role.projectRoleID
                                                                )
                                                            }
                                                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex">
                                <FiBell className="w-5 h-5 text-blue-400" />
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-blue-800">
                                        How Project Roles Work
                                    </h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                        When proponents add team members to
                                        their proposals, they can assign these
                                        roles to define each member's
                                        contribution (e.g., Principal
                                        Investigator, Co-Investigator, Research
                                        Assistant).
                                    </p>
                                </div>
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
                                    Upload templates specifically for
                                    Proponents. These will be available only in
                                    the Proponent Resources page.
                                </p>
                                <label className="admin-button-primary flex items-center space-x-2 cursor-pointer">
                                    <FiUpload className="w-4 h-4" />
                                    <span>
                                        {uploadingProponentTemplate
                                            ? "Uploading..."
                                            : "Upload Template"}
                                    </span>
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
                                            <th className="text-left">
                                                Template Name
                                            </th>
                                            <th className="text-left w-32">
                                                Type
                                            </th>
                                            <th className="text-left w-32">
                                                Size
                                            </th>
                                            <th className="w-52 text-left">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {proponentTemplates.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="text-center text-sm text-gray-500 py-6"
                                                >
                                                    No proponent templates
                                                    uploaded yet
                                                </td>
                                            </tr>
                                        )}
                                        {proponentTemplates.map((template) => (
                                            <tr
                                                key={
                                                    template.id ||
                                                    template.templateID
                                                }
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="text-base text-gray-900 py-4">
                                                    {template.name ||
                                                        template.fileName}
                                                </td>
                                                <td className="text-sm text-gray-600 py-4">
                                                    {(
                                                        template.type ||
                                                        template.fileType ||
                                                        ""
                                                    ).toUpperCase()}
                                                </td>
                                                <td className="text-sm text-gray-600 py-4">
                                                    {template.size ||
                                                        template.fileSize ||
                                                        "—"}
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <a
                                                            href={
                                                                template.url ||
                                                                template.filePath ||
                                                                "#"
                                                            }
                                                            download
                                                            className="admin-button-secondary px-4 py-2 flex items-center space-x-1"
                                                        >
                                                            <FiDownload className="w-4 h-4" />
                                                            <span>
                                                                Download
                                                            </span>
                                                        </a>
                                                        <button
                                                            onClick={() =>
                                                                deleteTemplate(
                                                                    template,
                                                                    "proponent"
                                                                )
                                                            }
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
                                        <h4 className="text-sm font-medium text-blue-800">
                                            Proponent Resources
                                        </h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Templates uploaded here will appear
                                            only in the Proponent Resources
                                            page.
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
                                    Upload templates for Center Manager, RDD,
                                    and other roles. These will be shared across
                                    non-Proponent users.
                                </p>
                                <label className="admin-button-primary flex items-center space-x-2 cursor-pointer">
                                    <FiUpload className="w-4 h-4" />
                                    <span>
                                        {uploadingGeneralTemplate
                                            ? "Uploading..."
                                            : "Upload Template"}
                                    </span>
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
                                            <th className="text-left">
                                                Template Name
                                            </th>
                                            <th className="text-left w-32">
                                                Type
                                            </th>
                                            <th className="text-left w-32">
                                                Size
                                            </th>
                                            <th className="w-52 text-left">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {generalTemplates.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="text-center text-sm text-gray-500 py-6"
                                                >
                                                    No general templates
                                                    uploaded yet
                                                </td>
                                            </tr>
                                        )}
                                        {generalTemplates.map((template) => (
                                            <tr
                                                key={
                                                    template.id ||
                                                    template.templateID
                                                }
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="text-base text-gray-900 py-4">
                                                    {template.name ||
                                                        template.fileName}
                                                </td>
                                                <td className="text-sm text-gray-600 py-4">
                                                    {(
                                                        template.type ||
                                                        template.fileType ||
                                                        ""
                                                    ).toUpperCase()}
                                                </td>
                                                <td className="text-sm text-gray-600 py-4">
                                                    {template.size ||
                                                        template.fileSize ||
                                                        "—"}
                                                </td>
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <a
                                                            href={
                                                                template.url ||
                                                                template.filePath ||
                                                                "#"
                                                            }
                                                            download
                                                            className="admin-button-secondary px-4 py-2 flex items-center space-x-1"
                                                        >
                                                            <FiDownload className="w-4 h-4" />
                                                            <span>
                                                                Download
                                                            </span>
                                                        </a>
                                                        <button
                                                            onClick={() =>
                                                                deleteTemplate(
                                                                    template,
                                                                    "general"
                                                                )
                                                            }
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
                                        <h4 className="text-sm font-medium text-green-800">
                                            Shared Resources
                                        </h4>
                                        <p className="text-sm text-green-700 mt-1">
                                            Templates uploaded here will appear
                                            in the Resources pages for Center
                                            Manager, RDD, and other
                                            non-Proponent roles.
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
                            Academic Units
                        </h3>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Academic Unit Name
                                    </label>
                                    <input
                                        type="text"
                                        value={deptForm.name}
                                        onChange={(e) =>
                                            setDeptForm((p) => ({
                                                ...p,
                                                name: e.target.value,
                                            }))
                                        }
                                        className={`admin-input ${
                                            deptErrors ? "border-red-500" : ""
                                        }`}
                                        placeholder="Enter Academic Unit name"
                                    />
                                    {deptErrors && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {deptErrors}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        College ID
                                    </label>
                                    <input
                                        type="text"
                                        value={deptForm.college_idNo || ""}
                                        onChange={(e) =>
                                            setDeptForm((p) => ({
                                                ...p,
                                                college_idNo: e.target.value,
                                            }))
                                        }
                                        className="admin-input"
                                        placeholder="e.g. CAE"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={submitDepartment}
                                        className="admin-button-primary w-full"
                                        disabled={deptLoading}
                                    >
                                        {deptForm.id
                                            ? "Update Academic Unit"
                                            : "Add Academic Unit"}
                                    </button>
                                </div>
                            </div>

                            {selectedDepartments.length > 0 && (
                                <div className="mb-4 flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <span className="text-sm font-medium text-red-800">
                                        {selectedDepartments.length} Academic
                                        Unit(s) selected
                                    </span>
                                    <button
                                        onClick={bulkDeleteDepartments}
                                        disabled={deptLoading}
                                        className="admin-button-danger px-4 py-2 text-sm"
                                    >
                                        Delete Selected
                                    </button>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th className="text-left w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        departments.slice(
                                                            (deptPage - 1) *
                                                                DEPT_PER_PAGE,
                                                            deptPage *
                                                                DEPT_PER_PAGE
                                                        ).length > 0 &&
                                                        departments
                                                            .slice(
                                                                (deptPage - 1) *
                                                                    DEPT_PER_PAGE,
                                                                deptPage *
                                                                    DEPT_PER_PAGE
                                                            )
                                                            .every((dept) =>
                                                                selectedDepartments.includes(
                                                                    dept.departmentID ||
                                                                        dept.id
                                                                )
                                                            )
                                                    }
                                                    onChange={
                                                        toggleAllDepartments
                                                    }
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                />
                                            </th>
                                            <th className="text-left">Name</th>
                                            <th className="text-left w-40">
                                                College ID
                                            </th>
                                            <th className="w-52 text-left">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {departments.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="text-center text-sm text-gray-500 py-6"
                                                >
                                                    No Academic Units found
                                                </td>
                                            </tr>
                                        )}
                                        {departments
                                            .slice(
                                                (deptPage - 1) * DEPT_PER_PAGE,
                                                deptPage * DEPT_PER_PAGE
                                            )
                                            .map((dept) => {
                                                const deptId =
                                                    dept.departmentID ||
                                                    dept.id;
                                                return (
                                                    <tr
                                                        key={deptId}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="py-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedDepartments.includes(
                                                                    deptId
                                                                )}
                                                                onChange={() =>
                                                                    toggleDepartmentSelection(
                                                                        deptId
                                                                    )
                                                                }
                                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                            />
                                                        </td>
                                                        <td className="text-base text-gray-900 py-4">
                                                            {dept.name ||
                                                                dept.departmentName}
                                                        </td>
                                                        <td className="text-sm text-gray-600 py-4">
                                                            {dept.college_idNo ||
                                                                "—"}
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() =>
                                                                        editDepartment(
                                                                            dept
                                                                        )
                                                                    }
                                                                    className="admin-button-secondary px-4 py-2"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        deleteDepartment(
                                                                            dept
                                                                        )
                                                                    }
                                                                    className="admin-button-danger px-4 py-2"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                            {departments.length > DEPT_PER_PAGE && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-700">
                                        Showing{" "}
                                        {(deptPage - 1) * DEPT_PER_PAGE + 1}–
                                        {Math.min(
                                            deptPage * DEPT_PER_PAGE,
                                            departments.length
                                        )}{" "}
                                        of {departments.length}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() =>
                                                setDeptPage((p) =>
                                                    Math.max(1, p - 1)
                                                )
                                            }
                                            disabled={deptPage === 1}
                                            className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        {Array.from(
                                            {
                                                length: Math.ceil(
                                                    departments.length /
                                                        DEPT_PER_PAGE
                                                ),
                                            },
                                            (_, i) => i + 1
                                        ).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setDeptPage(p)}
                                                className={`px-4 py-2 text-sm border rounded-md ${
                                                    p === deptPage
                                                        ? "bg-red-600 text-white border-red-600"
                                                        : "border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() =>
                                                setDeptPage((p) =>
                                                    Math.min(
                                                        Math.ceil(
                                                            departments.length /
                                                                DEPT_PER_PAGE
                                                        ),
                                                        p + 1
                                                    )
                                                )
                                            }
                                            disabled={
                                                deptPage ===
                                                Math.ceil(
                                                    departments.length /
                                                        DEPT_PER_PAGE
                                                )
                                            }
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Academic Unit
                                    </label>
                                    <select
                                        value={centerForm.departmentID}
                                        onChange={(e) =>
                                            setCenterForm((p) => ({
                                                ...p,
                                                departmentID: e.target.value,
                                            }))
                                        }
                                        className="admin-input"
                                    >
                                        <option value="">
                                            Select Academic Unit
                                        </option>
                                        {departments.map((dept) => (
                                            <option
                                                key={
                                                    dept.departmentID || dept.id
                                                }
                                                value={
                                                    dept.departmentID || dept.id
                                                }
                                            >
                                                {dept.name ||
                                                    dept.departmentName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Research Center Name
                                    </label>
                                    <input
                                        type="text"
                                        value={centerForm.name}
                                        onChange={(e) =>
                                            setCenterForm((p) => ({
                                                ...p,
                                                name: e.target.value,
                                            }))
                                        }
                                        className={`admin-input ${
                                            centerErrors ? "border-red-500" : ""
                                        }`}
                                        placeholder="Enter research center name"
                                    />
                                    {centerErrors && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {centerErrors}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={submitResearchCenter}
                                        className="admin-button-primary w-full"
                                        disabled={centerLoading}
                                    >
                                        {centerForm.id
                                            ? "Update Center"
                                            : "Add Center"}
                                    </button>
                                </div>
                            </div>

                            {selectedResearchCenters.length > 0 && (
                                <div className="mb-4 flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <span className="text-sm font-medium text-red-800">
                                        {selectedResearchCenters.length}{" "}
                                        research center(s) selected
                                    </span>
                                    <button
                                        onClick={bulkDeleteResearchCenters}
                                        disabled={centerLoading}
                                        className="admin-button-danger px-4 py-2 text-sm"
                                    >
                                        Delete Selected
                                    </button>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th className="text-left w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        researchCenters.slice(
                                                            (centerPage - 1) *
                                                                CENTER_PER_PAGE,
                                                            centerPage *
                                                                CENTER_PER_PAGE
                                                        ).length > 0 &&
                                                        researchCenters
                                                            .slice(
                                                                (centerPage -
                                                                    1) *
                                                                    CENTER_PER_PAGE,
                                                                centerPage *
                                                                    CENTER_PER_PAGE
                                                            )
                                                            .every((center) =>
                                                                selectedResearchCenters.includes(
                                                                    center.centerID ||
                                                                        center.id
                                                                )
                                                            )
                                                    }
                                                    onChange={
                                                        toggleAllResearchCenters
                                                    }
                                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                />
                                            </th>
                                            <th className="text-left">Name</th>
                                            <th className="text-left">
                                                Academic Unit
                                            </th>
                                            <th className="w-52 text-left">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {researchCenters.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="text-center text-sm text-gray-500 py-6"
                                                >
                                                    No research centers found
                                                </td>
                                            </tr>
                                        )}
                                        {researchCenters
                                            .slice(
                                                (centerPage - 1) *
                                                    CENTER_PER_PAGE,
                                                centerPage * CENTER_PER_PAGE
                                            )
                                            .map((center) => {
                                                const centerId =
                                                    center.centerID ||
                                                    center.id;
                                                return (
                                                    <tr
                                                        key={centerId}
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="py-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedResearchCenters.includes(
                                                                    centerId
                                                                )}
                                                                onChange={() =>
                                                                    toggleResearchCenterSelection(
                                                                        centerId
                                                                    )
                                                                }
                                                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                            />
                                                        </td>
                                                        <td className="text-base text-gray-900 py-4">
                                                            {center.name ||
                                                                center.centerName}
                                                        </td>
                                                        <td className="text-sm text-gray-600 py-4">
                                                            {center.departmentName ||
                                                                "—"}
                                                        </td>
                                                        <td className="py-4">
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() =>
                                                                        editResearchCenter(
                                                                            center
                                                                        )
                                                                    }
                                                                    className="admin-button-secondary px-4 py-2"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        deleteResearchCenter(
                                                                            center
                                                                        )
                                                                    }
                                                                    className="admin-button-danger px-4 py-2"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                            {researchCenters.length > CENTER_PER_PAGE && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-gray-700">
                                        Showing{" "}
                                        {(centerPage - 1) * CENTER_PER_PAGE + 1}
                                        –
                                        {Math.min(
                                            centerPage * CENTER_PER_PAGE,
                                            researchCenters.length
                                        )}{" "}
                                        of {researchCenters.length}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() =>
                                                setCenterPage((p) =>
                                                    Math.max(1, p - 1)
                                                )
                                            }
                                            disabled={centerPage === 1}
                                            className="px-4 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        {Array.from(
                                            {
                                                length: Math.ceil(
                                                    researchCenters.length /
                                                        CENTER_PER_PAGE
                                                ),
                                            },
                                            (_, i) => i + 1
                                        ).map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setCenterPage(p)}
                                                className={`px-4 py-2 text-sm border rounded-md ${
                                                    p === centerPage
                                                        ? "bg-red-600 text-white border-red-600"
                                                        : "border-gray-300 hover:bg-gray-50"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() =>
                                                setCenterPage((p) =>
                                                    Math.min(
                                                        Math.ceil(
                                                            researchCenters.length /
                                                                CENTER_PER_PAGE
                                                        ),
                                                        p + 1
                                                    )
                                                )
                                            }
                                            disabled={
                                                centerPage ===
                                                Math.ceil(
                                                    researchCenters.length /
                                                        CENTER_PER_PAGE
                                                )
                                            }
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Name Your Template
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter a descriptive name for this template. This
                            will be shown to users instead of the file name.
                        </p>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="e.g., Research Proposal Form"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                            onKeyDown={(e) =>
                                e.key === "Enter" && confirmProponentUpload()
                            }
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowProponentModal(false);
                                    setPendingFile(null);
                                    setTemplateName("");
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Name Your Template
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter a descriptive name for this template. This
                            will be shown to users instead of the file name.
                        </p>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="e.g., Compliance Matrix Template"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                            onKeyDown={(e) =>
                                e.key === "Enter" && confirmGeneralUpload()
                            }
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowGeneralModal(false);
                                    setPendingFile(null);
                                    setTemplateName("");
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

            {/* Backup Storage Selection Modal */}
            {showBackupModal && !showFolderBrowser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
                    <div className="bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-4 p-8">
                        <h2 className="text-lg font-semibold text-white mb-2">
                            Set Backup Storage Location
                        </h2>
                        <p className="text-gray-300 text-sm mb-6">
                            Enter the path where backups will be stored:
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">
                                    Backup Path{" "}
                                    {backupPathInput && (
                                        <span className="text-green-500">
                                            (Path detected)
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={backupPathInput}
                                    onChange={(e) =>
                                        setBackupPathInput(e.target.value)
                                    }
                                    placeholder="e.g., C:\Backups or /var/backups"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    onKeyDown={(e) =>
                                        e.key === "Enter" && confirmBackupPath()
                                    }
                                    autoFocus
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleBrowseFolderClick}
                                className="w-full px-4 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium border border-gray-600"
                            >
                                <FiFolder className="w-4 h-4" />
                                Browse Folder
                            </button>
                            <input
                                ref={filePickerRef}
                                type="file"
                                webkitdirectory="true"
                                directory="true"
                                onChange={handleFolderSelection}
                                className="hidden"
                                style={{ display: "none" }}
                            />
                            <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
                                <p className="text-blue-300 text-xs flex items-start gap-2">
                                    <span className="text-blue-400 mt-0.5">
                                        ℹ️
                                    </span>
                                    <span>
                                        <strong>Note:</strong> You can select
                                        folders that contain files. For
                                        new/empty backup folders, type the full
                                        path manually (e.g., C:\NewBackups), or
                                        click "Build Path" below.
                                    </span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFolderBrowser(true)}
                                className="w-full px-4 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-750 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium border border-gray-700"
                            >
                                <FiPlus className="w-4 h-4" />
                                Build Path for New Folder
                            </button>
                        </div>
                        <div className="flex gap-3 justify-end mt-8">
                            <button
                                onClick={cancelBackupPath}
                                className="px-6 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBackupPath}
                                disabled={!backupPathInput.trim()}
                                className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Folder Path Builder Dialog */}
            {showFolderBrowser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-lg shadow-2xl max-w-lg w-full mx-4 p-8">
                        <h2 className="text-lg font-semibold text-white mb-2">
                            Create Backup Folder Path
                        </h2>
                        <p className="text-gray-300 text-sm mb-6">
                            Build your backup folder path:
                        </p>

                        <div className="space-y-4">
                            {/* Common base paths */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-2">
                                    Base Path (Select or type custom)
                                </label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button
                                        onClick={() =>
                                            setSelectedFolderPath("C:\\")
                                        }
                                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                            selectedFolderPath.startsWith(
                                                "C:\\"
                                            )
                                                ? "bg-blue-600 border-blue-500 text-white"
                                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750"
                                        }`}
                                    >
                                        C:\ (Windows)
                                    </button>
                                    <button
                                        onClick={() =>
                                            setSelectedFolderPath("D:\\")
                                        }
                                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                            selectedFolderPath.startsWith(
                                                "D:\\"
                                            )
                                                ? "bg-blue-600 border-blue-500 text-white"
                                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750"
                                        }`}
                                    >
                                        D:\ (Windows)
                                    </button>
                                    <button
                                        onClick={() =>
                                            setSelectedFolderPath("/var/")
                                        }
                                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                            selectedFolderPath.startsWith(
                                                "/var/"
                                            )
                                                ? "bg-blue-600 border-blue-500 text-white"
                                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750"
                                        }`}
                                    >
                                        /var/ (Linux)
                                    </button>
                                    <button
                                        onClick={() =>
                                            setSelectedFolderPath("/home/")
                                        }
                                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                            selectedFolderPath.startsWith(
                                                "/home/"
                                            )
                                                ? "bg-blue-600 border-blue-500 text-white"
                                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750"
                                        }`}
                                    >
                                        /home/ (Linux)
                                    </button>
                                </div>
                            </div>

                            {/* Full path input */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-2">
                                    Complete Backup Path
                                </label>
                                <input
                                    type="text"
                                    value={selectedFolderPath}
                                    onChange={(e) =>
                                        setSelectedFolderPath(e.target.value)
                                    }
                                    placeholder="e.g., C:\Backups\RDE or /var/backups/rde"
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                                    autoFocus
                                />
                            </div>

                            {/* Quick suggestions */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-2">
                                    Quick Suggestions
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() =>
                                            setSelectedFolderPath(
                                                "C:\\RDE_Backups"
                                            )
                                        }
                                        className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-300"
                                    >
                                        C:\RDE_Backups
                                    </button>
                                    <button
                                        onClick={() =>
                                            setSelectedFolderPath(
                                                "C:\\Backups\\RDE"
                                            )
                                        }
                                        className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-300"
                                    >
                                        C:\Backups\RDE
                                    </button>
                                    <button
                                        onClick={() =>
                                            setSelectedFolderPath(
                                                "/var/backups/rde"
                                            )
                                        }
                                        className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-300"
                                    >
                                        /var/backups/rde
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-8">
                            <button
                                onClick={() => {
                                    setShowFolderBrowser(false);
                                    setSelectedFolderPath("");
                                }}
                                className="px-6 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedFolderPath.trim()) {
                                        setBackupPathInput(selectedFolderPath);
                                        setShowFolderBrowser(false);
                                        setSelectedFolderPath("");
                                    }
                                }}
                                disabled={!selectedFolderPath.trim()}
                                className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                            >
                                Use This Path
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default SystemSettings;
