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

        // Skip revision_image files - they are displayed separately in revision comments section
        if (type === "revision_image") {
            return;
        }

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
    "Partnerships for the Goals",
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
    const [revisionRequestedBy, setRevisionRequestedBy] = useState("CM"); // "CM" or "RDD"
    const [viewingImage, setViewingImage] = useState(null); // For image popup modal
    const [imageZoom, setImageZoom] = useState(100); // Zoom percentage
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
                                        notif.data?.event ===
                                            "proposal.revision_required.rdd" ||
                                        notif.type === "revision")
                                );
                            }
                        );

                        if (revisionNotification?.data?.revision_comments) {
                            setRevisionComments(
                                revisionNotification.data.revision_comments
                            );
                        }

                        // Determine who requested the revision
                        const requestedBy =
                            revisionNotification?.data?.requested_by ||
                            (revisionNotification?.data?.event?.includes("rdd")
                                ? "RDD"
                                : "CM");
                        setRevisionRequestedBy(requestedBy);

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
                                    preview: `/api/files/view?path=${encodeURIComponent(
                                        file.filePath
                                    )}`,
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
                    "Proposal resubmitted successfully back to the R&D Division! You will receive a notification with details.",
                    3500
                ) ||
                    alert(
                        "Proposal resubmitted successfully back to the R&D Division!"
                    );
                // Redirect to proponent tracker after resubmit to see the proposal status
                setTimeout(() => {
                    router.visit("/proponent/tracker", { replace: true });
                }, 3600);
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

                    {/* Revision Comments Section */}
                    {(revisionComments || revisionImages.length > 0) && (
                        <div
                            className={`mb-8 bg-gradient-to-br ${
                                revisionRequestedBy === "RDD"
                                    ? "from-red-50 to-orange-50 border-2 border-red-200"
                                    : "from-orange-50 to-red-50 border-2 border-orange-200"
                            } rounded-xl p-6 shadow-sm`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`w-10 h-10 ${
                                        revisionRequestedBy === "RDD"
                                            ? "bg-red-500"
                                            : "bg-orange-500"
                                    } rounded-lg flex items-center justify-center shadow-md`}
                                >
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
                                        Revision Comments from{" "}
                                        {revisionRequestedBy === "RDD"
                                            ? "R&D Division"
                                            : "Center Manager"}
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
                                                <div
                                                    onClick={() => {
                                                        setViewingImage(image);
                                                        setImageZoom(100);
                                                    }}
                                                    className="block cursor-pointer"
                                                >
                                                    <img
                                                        src={image.preview}
                                                        alt={image.name}
                                                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-400 cursor-pointer transition-all shadow-sm hover:shadow-md"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setViewingImage(image);
                                                        setImageZoom(100);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    title="View image"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                </button>
                                                {image.name && (
                                                    <p className="text-xs text-gray-600 mt-1 truncate text-center">
                                                        {image.name}
                                                    </p>
                                                )}
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

            {/* Image Viewer Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <div
                        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with controls */}
                        <div className="bg-white rounded-t-xl px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                    {viewingImage.name || "Image Preview"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Zoom controls */}
                                <button
                                    onClick={() =>
                                        setImageZoom(
                                            Math.max(25, imageZoom - 25)
                                        )
                                    }
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Zoom out"
                                >
                                    <svg
                                        className="w-5 h-5 text-gray-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                                        />
                                    </svg>
                                </button>
                                <span className="text-sm font-medium text-gray-600 min-w-[50px] text-center">
                                    {imageZoom}%
                                </span>
                                <button
                                    onClick={() =>
                                        setImageZoom(
                                            Math.min(300, imageZoom + 25)
                                        )
                                    }
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Zoom in"
                                >
                                    <svg
                                        className="w-5 h-5 text-gray-600"
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
                                </button>
                                <button
                                    onClick={() => setImageZoom(100)}
                                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                    title="Reset zoom"
                                >
                                    Reset
                                </button>
                                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                                {/* Download button */}
                                <a
                                    href={viewingImage.preview}
                                    download={viewingImage.name}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Download"
                                >
                                    <svg
                                        className="w-5 h-5 text-gray-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                </a>
                                {/* Close button */}
                                <button
                                    onClick={() => setViewingImage(null)}
                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <svg
                                        className="w-5 h-5 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        {/* Image container */}
                        <div className="bg-gray-900 rounded-b-xl overflow-auto flex-1 flex items-center justify-center p-4">
                            <img
                                src={viewingImage.preview}
                                alt={viewingImage.name}
                                className="max-w-none transition-transform duration-200"
                                style={{
                                    transform: `scale(${imageZoom / 100})`,
                                    transformOrigin: "center center",
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

RevisionDetail.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Proponent">{page}</RoleBasedLayout>
    </AppLayout>
);

export default RevisionDetail;
