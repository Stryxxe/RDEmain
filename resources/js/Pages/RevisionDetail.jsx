import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { BiArrowBack, BiSave } from "react-icons/bi";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";
import { updateProposal } from "../services/proposalService";
import AppLayout from "../Components/Layouts/AppLayout";
import RoleBasedLayout from "../Components/Layouts/RoleBasedLayout";
import Breadcrumbs from "../Components/Breadcrumbs";
import FormField from "../Components/FormField";
import TextAreaField from "../Components/TextAreaField";
import CheckboxGroup from "../Components/CheckboxGroup";
import DragDropUpload from "../Components/DragDropUpload";
import MultiFileUpload from "../Components/MultiFileUpload";
import { useUploadSettings } from "../hooks/useUploadSettings";

// Normalize server data into string arrays for checkbox fields
const normalizeList = (value) => {
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(/[,;|]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const pickFirstNonEmptyList = (...candidates) => {
    for (const candidate of candidates) {
        const arr = normalizeList(candidate);
        if (arr.length > 0) return arr;
    }
    return [];
};

const categorizeFiles = (files = []) => {
    const result = {
        proposal: null,
        seti: null,
        gad: null,
        matrix: null,
        supporting: [],
    };

    if (!files || !Array.isArray(files)) {
        return result;
    }

    files.forEach((file) => {
        if (!file) {
            return; // Skip invalid files
        }

        const type = (file.fileType || "").toLowerCase();
        const lowerName = (file.fileName || "").toLowerCase();
        const fileExtension = lowerName.split(".").pop() || "";

        // Explicitly handle supporting_document type - always treat as supporting
        if (type === "supporting_document" || type === "supporting") {
            result.supporting.push(file);
            return;
        }

        // If file has no type, treat as supporting
        if (!file.fileType || type === "") {
            result.supporting.push(file);
            return;
        }

        // Check for proposal/report files
        if (
            type === "concept_paper" ||
            type === "report" ||
            type === "updated_form" ||
            lowerName.includes("research") ||
            lowerName.includes("concept") ||
            (fileExtension === "pdf" && lowerName.includes("proposal"))
        ) {
            // Only set as proposal if not already set, otherwise treat as supporting
            if (!result.proposal) {
                result.proposal = file;
            } else {
                result.supporting.push(file);
            }
            return;
        }

        // Check for SETI files
        if (
            type === "seti_scorecard" ||
            type === "seti" ||
            lowerName.includes("seti")
        ) {
            result.seti = file;
            return;
        }

        // Check for GAD files
        if (
            type === "gad_certificate" ||
            type === "gad" ||
            lowerName.includes("gad")
        ) {
            result.gad = file;
            return;
        }

        // Check for Matrix of Compliance files
        if (
            type === "matrix_compliance" ||
            type === "matrix_of_compliance" ||
            type === "moc" ||
            lowerName.includes("matrix") ||
            lowerName.includes("moc") ||
            lowerName.includes("compliance")
        ) {
            result.matrix = file;
            return;
        }

        // Any other file is treated as supporting (including xlsx, xls, pdf, doc, docx, images, etc.)
        // This ensures ALL files that don't match specific types are included in supporting documents
        result.supporting.push(file);
    });

    return result;
};

const researchAgendaOptions = [
    "Agriculture, Aquatic, and Agro-Forestry",
    "Business and Trade",
    "Social Sciences and Education",
    "Engineering and Technology",
    "Environment and Natural Resources",
    "Health and Wellness",
    "Peace and Security",
];

const dostSPsOptions = [
    "Publication",
    "Patent",
    "Product",
    "People Services",
    "Places and Partnership",
    "Policies",
];

const sdgOptions = [
    "No Poverty",
    "Zero Hunger",
    "Good Health and Well-being",
    "Quality Education",
    "Gender Equality",
    "Clean Water and Sanitation",
    "Affordable and Clean Energy",
    "Decent Work and Economic Growth",
    "Industry, Innovation and Infrastructure",
    "Reduced Inequalities",
    "Sustainable Cities and Communities",
    "Responsible Consumption and Production",
    "Climate Action",
    "Life Below Water",
    "Life on Land",
    "Peace, Justice and Strong Institutions",
];

const RevisionDetail = ({ id }) => {
    const { user } = useAuth();
    const { props } = usePage();
    const currentUser = user || props?.auth?.user;
    const { maxFileSizeMB, loading: settingsLoading } = useUploadSettings();

    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [revisionComments, setRevisionComments] = useState("");
    const [revisionImages, setRevisionImages] = useState([]);
    const [existingFiles, setExistingFiles] = useState({
        proposal: null,
        seti: null,
        gad: null,
        matrix: null,
        supporting: [],
    });
    const [formData, setFormData] = useState({
        researchTitle: "",
        description: "",
        objectives: "",
        researchAgenda: [],
        dostSPs: [],
        sustainableDevelopmentGoals: [],
        proposedBudget: "",
        updatedForm: null,
        setiFile: null,
        gadFile: null,
        matrixFile: null,
        supportingDocuments: [],
    });
    const [showExistingSelections, setShowExistingSelections] = useState(false);

    // Guard
    useEffect(() => {
        if (!currentUser) return;
        if (currentUser.role?.userRole !== "Proponent") {
            router.visit("/dashboard");
        }
    }, [currentUser]);

    // Load proposal and revision comments
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const response = await apiService.getProposal(id);
                if (response.success && response.data) {
                    const p = response.data;
                    setProposal(p);

                    // Ensure files array exists and is properly formatted
                    const allFiles = Array.isArray(p.files) ? p.files : [];

                    // Debug: Log all files received
                    console.log("All proposal files:", allFiles);
                    console.log("Files count:", allFiles.length);
                    console.log(
                        "File details:",
                        allFiles.map((f) => ({
                            fileName: f.fileName,
                            fileType: f.fileType,
                            filePath: f.filePath,
                            fileID: f.fileID,
                        }))
                    );

                    const fileBuckets = categorizeFiles(allFiles);

                    // Debug: Log categorized files
                    console.log("Categorized files:", fileBuckets);
                    console.log(
                        "Supporting files count:",
                        fileBuckets.supporting?.length || 0
                    );
                    console.log(
                        "Supporting files details:",
                        fileBuckets.supporting?.map((f) => ({
                            fileName: f.fileName,
                            fileType: f.fileType,
                            filePath: f.filePath,
                            fileID: f.fileID,
                        }))
                    );

                    // Ensure supporting files array is properly set
                    if (!Array.isArray(fileBuckets.supporting)) {
                        console.warn(
                            "Supporting files is not an array, resetting to empty array"
                        );
                        fileBuckets.supporting = [];
                    }

                    setFormData({
                        researchTitle: p.researchTitle || p.title || "",
                        description: p.description || "",
                        objectives: p.objectives || "",
                        researchAgenda:
                            pickFirstNonEmptyList(
                                p.researchAgenda,
                                p.matrixOfCompliance?.researchAgenda
                            ) || [],
                        dostSPs:
                            pickFirstNonEmptyList(
                                p.dostSPs,
                                p.matrixOfCompliance?.dostSPs
                            ) || [],
                        sustainableDevelopmentGoals:
                            pickFirstNonEmptyList(
                                p.sustainableDevelopmentGoals,
                                p.matrixOfCompliance
                                    ?.sustainableDevelopmentGoals
                            ) || [],
                        proposedBudget:
                            p.proposedBudget ||
                            p.matrixOfCompliance?.proposedBudget ||
                            "",
                        updatedForm: null,
                        setiFile: null,
                        gadFile: null,
                        matrixFile: null,
                        supportingDocuments: [],
                    });

                    setExistingFiles(fileBuckets);

                    // Fetch revision comments from notification
                    try {
                        const notificationsResponse =
                            await apiService.getNotifications();

                        // Handle different response structures
                        const notifications =
                            notificationsResponse?.data ||
                            notificationsResponse ||
                            [];
                        const notificationsArray = Array.isArray(notifications)
                            ? notifications
                            : [];

                        // Find the revision notification for this proposal
                        const revisionNotification = notificationsArray.find(
                            (notif) => {
                                const proposalId =
                                    notif.data?.proposal_id ||
                                    notif.data?.proposalID;
                                const currentProposalId = p.proposalID || p.id;
                                return (
                                    proposalId === currentProposalId &&
                                    (notif.data?.event ===
                                        "proposal.revision_required" ||
                                        notif.type === "revision")
                                );
                            }
                        );

                        if (revisionNotification?.data?.revision_comments) {
                            setRevisionComments(
                                revisionNotification.data.revision_comments
                            );
                        }

                        // Get revision images from proposal files
                        const revisionImageFiles = Array.isArray(p.files)
                            ? p.files.filter(
                                  (f) => f.fileType === "revision_image"
                              )
                            : [];

                        if (revisionImageFiles.length > 0) {
                            setRevisionImages(
                                revisionImageFiles.map((file) => ({
                                    id: file.fileID,
                                    preview: `/storage/${file.filePath}`,
                                    name: file.fileName,
                                }))
                            );
                        }
                    } catch (notifErr) {
                        console.error(
                            "Error fetching revision comments:",
                            notifErr
                        );
                        // Don't fail the whole page if notification fetch fails
                    }
                } else {
                    setError(response.message || "Failed to load proposal");
                }
            } catch (err) {
                console.error("Load proposal failed", err);
                setError("Unable to load proposal. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const handleSupportingDocsChange = (files) => {
        setFormData((prev) => ({
            ...prev,
            supportingDocuments: files,
        }));
    };

    const removeExistingFile = (key, index = null) => {
        setExistingFiles((prev) => {
            if (key === "supporting") {
                const nextSupport = prev.supporting.filter(
                    (_, idx) => idx !== index
                );
                return { ...prev, supporting: nextSupport };
            }
            return { ...prev, [key]: null };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!proposal) return;
        try {
            setSaving(true);
            setError("");

            const payload = {
                researchTitle: formData.researchTitle,
                description: formData.description,
                objectives: formData.objectives,
                researchAgenda: formData.researchAgenda,
                dostSPs: formData.dostSPs,
                sustainableDevelopmentGoals:
                    formData.sustainableDevelopmentGoals,
                proposedBudget: formData.proposedBudget,
                budgetBreakdown: proposal.budgetBreakdown || undefined,
                // DO NOT send statusID - backend will keep it as 4 (For Revision)
                // The resubmittedAfterRevision timestamp will be set, which changes display status from "In Progress" to "Updated"
                // statusID: 1, // REMOVED - status should stay as 4 to keep proposal in CM's For Revision page
            };

            if (formData.updatedForm) {
                payload.updatedForm = formData.updatedForm;
            }
            if (formData.setiFile) {
                payload.setiFile = formData.setiFile;
            }
            if (formData.gadFile) {
                payload.gadFile = formData.gadFile;
            }
            if (formData.matrixFile) {
                payload.matrixFile = formData.matrixFile;
            }
            if (
                formData.supportingDocuments &&
                formData.supportingDocuments.length > 0
            ) {
                payload.supportingDocuments = formData.supportingDocuments;
            }

            const response = await updateProposal(
                proposal.proposalID || proposal.id,
                payload
            );

            if (response.success) {
                window.customAlert?.(
                    "✓",
                    "Proposal resubmitted successfully!",
                    2500
                ) || alert("Proposal resubmitted successfully!");
                // Redirect to proponent dashboard after resubmit
                setTimeout(() => {
                    router.visit("/proponent/", { replace: true });
                }, 2600);
            } else {
                throw new Error(
                    response.message || "Failed to resubmit proposal"
                );
            }
        } catch (err) {
            console.error("Revision submit failed", err);
            setError(err.message || "Failed to resubmit proposal");
        } finally {
            setSaving(false);
        }
    };

    const breadcrumbs = useMemo(
        () => [
            { label: "For Revision", href: "/proponent/revision" },
            { label: "Edit", href: null },
        ],
        []
    );

    if (loading || settingsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading proposal...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-red-800 mb-2">
                        Unable to continue
                    </h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.visit("/proponent/revision")}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Back to For Revision
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            <Breadcrumbs items={breadcrumbs} />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">
                            Revision
                        </p>
                        <h1 className="text-3xl font-bold text-gray-900 mt-1">
                            {formData.researchTitle || "Untitled Proposal"}
                        </h1>
                        <p className="text-gray-600 mt-2">
                            Update your proposal and resubmit to the Center
                            Manager.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.visit("/proponent/revision")}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    >
                        <BiArrowBack />
                        Back
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Research Proposal Upload at Top */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Research Proposal File (PDF/DOC/DOCX)
                        </label>
                        <DragDropUpload
                            selectedFile={formData.updatedForm}
                            existingFile={existingFiles.proposal}
                            onRemoveExisting={() =>
                                removeExistingFile("proposal")
                            }
                            onFileSelect={(file) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    updatedForm: file,
                                }));
                                if (file) removeExistingFile("proposal");
                            }}
                            maxSize={`${maxFileSizeMB}MB`}
                            acceptedTypes="PDF, DOC, DOCX"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Attach the updated main proposal document.
                        </p>
                    </div>

                    <FormField
                        label="Research Title"
                        value={formData.researchTitle}
                        onChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                researchTitle: value,
                            }))
                        }
                        required
                    />

                    <TextAreaField
                        label="Description"
                        value={formData.description}
                        onChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                description: value,
                            }))
                        }
                        rows={4}
                        required
                    />

                    <TextAreaField
                        label="Objectives"
                        value={formData.objectives}
                        onChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                objectives: value,
                            }))
                        }
                        rows={3}
                        required
                    />

                    {/* Existing Selections Collapsible Card */}
                    {(existingFiles.proposal ||
                        (Array.isArray(formData.researchAgenda) &&
                            formData.researchAgenda.length > 0) ||
                        (Array.isArray(formData.dostSPs) &&
                            formData.dostSPs.length > 0) ||
                        (Array.isArray(formData.sustainableDevelopmentGoals) &&
                            formData.sustainableDevelopmentGoals.length >
                                0)) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative z-0">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowExistingSelections(
                                        !showExistingSelections
                                    )
                                }
                                className="w-full flex items-center justify-between text-left"
                            >
                                <h3 className="text-sm font-semibold text-gray-800">
                                    Your Original Selections
                                </h3>
                                <span className="text-gray-500">
                                    {showExistingSelections ? "▼" : "▶"}
                                </span>
                            </button>

                            {showExistingSelections && (
                                <div className="mt-4 space-y-4 border-t border-blue-200 pt-4">
                                    {Array.isArray(formData.researchAgenda) &&
                                        formData.researchAgenda.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold uppercase text-blue-600 mb-2">
                                                    Research Agenda
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.researchAgenda.map(
                                                        (item, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                                                            >
                                                                {item}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {Array.isArray(formData.dostSPs) &&
                                        formData.dostSPs.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold uppercase text-blue-600 mb-2">
                                                    DOST Strategic Programs
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.dostSPs.map(
                                                        (item, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                                                            >
                                                                {item}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {Array.isArray(
                                        formData.sustainableDevelopmentGoals
                                    ) &&
                                        formData.sustainableDevelopmentGoals
                                            .length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold uppercase text-blue-600 mb-2">
                                                    Sustainable Development
                                                    Goals
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.sustainableDevelopmentGoals.map(
                                                        (item, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                                                            >
                                                                {item}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    )}

                    <CheckboxGroup
                        label="Research Agenda"
                        options={researchAgendaOptions}
                        selectedOptions={formData.researchAgenda}
                        onChange={(opts) =>
                            setFormData((prev) => ({
                                ...prev,
                                researchAgenda: opts,
                            }))
                        }
                    />

                    <CheckboxGroup
                        label="DOST Strategic Programs"
                        options={dostSPsOptions}
                        selectedOptions={formData.dostSPs}
                        onChange={(opts) =>
                            setFormData((prev) => ({ ...prev, dostSPs: opts }))
                        }
                    />

                    <CheckboxGroup
                        label="Sustainable Development Goals"
                        options={sdgOptions}
                        selectedOptions={formData.sustainableDevelopmentGoals}
                        onChange={(opts) =>
                            setFormData((prev) => ({
                                ...prev,
                                sustainableDevelopmentGoals: opts,
                            }))
                        }
                        columns={2}
                    />

                    <FormField
                        label="Proposed Budget (₱)"
                        type="number"
                        min="0"
                        value={formData.proposedBudget}
                        onChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                proposedBudget: value,
                            }))
                        }
                        required
                    />

                    {/* Required Documents - Horizontal Layout */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* SETI Scorecard */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                SETI Scorecard
                            </label>
                            <DragDropUpload
                                selectedFile={formData.setiFile}
                                existingFile={existingFiles.seti}
                                onRemoveExisting={() =>
                                    removeExistingFile("seti")
                                }
                                onFileSelect={(file) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        setiFile: file,
                                    }));
                                    if (file) removeExistingFile("seti");
                                }}
                                maxSize={`${maxFileSizeMB}MB`}
                                acceptedTypes="PDF, DOC, DOCX"
                            />
                        </div>

                        {/* GAD Certificate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                GAD Certificate
                            </label>
                            <DragDropUpload
                                selectedFile={formData.gadFile}
                                existingFile={existingFiles.gad}
                                onRemoveExisting={() =>
                                    removeExistingFile("gad")
                                }
                                onFileSelect={(file) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        gadFile: file,
                                    }));
                                    if (file) removeExistingFile("gad");
                                }}
                                maxSize={`${maxFileSizeMB}MB`}
                                acceptedTypes="PDF, DOC, DOCX"
                            />
                        </div>

                        {/* Matrix of Compliance */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Matrix of Compliance
                            </label>
                            <DragDropUpload
                                selectedFile={formData.matrixFile}
                                existingFile={existingFiles.matrix}
                                onRemoveExisting={() =>
                                    removeExistingFile("matrix")
                                }
                                onFileSelect={(file) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        matrixFile: file,
                                    }));
                                    if (file) removeExistingFile("matrix");
                                }}
                                maxSize={`${maxFileSizeMB}MB`}
                                acceptedTypes="PDF, DOC, DOCX"
                            />
                        </div>
                    </div>

                    {/* Other Supporting Documents */}
                    <div className="mb-8">
                        <MultiFileUpload
                            files={formData.supportingDocuments}
                            onChange={handleSupportingDocsChange}
                            maxFiles={10}
                            maxSizeMB={maxFileSizeMB}
                            label="Other Supporting Documents (Optional)"
                            description="Attach any other approvals or supporting files."
                            existingFiles={existingFiles.supporting}
                            onRemoveExisting={(index) =>
                                removeExistingFile("supporting", index)
                            }
                            allowAllFileTypes={true}
                        />
                    </div>

                    {/* CM Revision Comments Section */}
                    {(revisionComments || revisionImages.length > 0) && (
                        <div className="mb-8 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-md">
                                    <svg
                                        className="w-5 h-5 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Revision Comments from Center Manager
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Please address the following comments
                                        and notes
                                    </p>
                                </div>
                            </div>

                            {revisionComments && (
                                <div className="mb-4 bg-white rounded-lg p-4 border border-orange-200">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        Comments:
                                    </p>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                        {revisionComments}
                                    </p>
                                </div>
                            )}

                            {revisionImages.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">
                                        Attached Images:
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {revisionImages.map((image) => (
                                            <div
                                                key={image.id}
                                                className="relative group"
                                            >
                                                <img
                                                    src={image.preview}
                                                    alt={image.name}
                                                    className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() =>
                                                        window.open(
                                                            image.preview,
                                                            "_blank"
                                                        )
                                                    }
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                                                    <svg
                                                        className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => router.visit("/proponent/revision")}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                        >
                            {saving && (
                                <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>
                            )}
                            <BiSave />
                            {saving ? "Resubmitting..." : "Resubmit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

RevisionDetail.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Proponent">{page}</RoleBasedLayout>
    </AppLayout>
);

export default RevisionDetail;
