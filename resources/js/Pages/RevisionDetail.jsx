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

  files.forEach((file) => {
    const type = file.fileType || "";
    const lowerName = (file.fileName || "").toLowerCase();

    if (type === "concept_paper" || type === "report" || lowerName.includes("research") || lowerName.includes("concept")) {
      result.proposal = file;
      return;
    }
    if (type === "seti_scorecard" || lowerName.includes("seti")) {
      result.seti = file;
      return;
    }
    if (type === "gad_certificate" || lowerName.includes("gad")) {
      result.gad = file;
      return;
    }
    if (type === "matrix_compliance" || lowerName.includes("matrix")) {
      result.matrix = file;
      return;
    }

    // Any other file is treated as supporting
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

  // Load proposal
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await apiService.getProposal(id);
        if (response.success && response.data) {
          const p = response.data;
          setProposal(p);
          const fileBuckets = categorizeFiles(Array.isArray(p.files) ? p.files : []);
          
          setFormData({
            researchTitle: p.researchTitle || p.title || "",
            description: p.description || "",
            objectives: p.objectives || "",
            researchAgenda: pickFirstNonEmptyList(p.researchAgenda, p.matrixOfCompliance?.researchAgenda) || [],
            dostSPs: pickFirstNonEmptyList(p.dostSPs, p.matrixOfCompliance?.dostSPs) || [],
            sustainableDevelopmentGoals: pickFirstNonEmptyList(
              p.sustainableDevelopmentGoals,
              p.matrixOfCompliance?.sustainableDevelopmentGoals
            ) || [],
            proposedBudget: p.proposedBudget || p.matrixOfCompliance?.proposedBudget || "",
            updatedForm: null,
            setiFile: null,
            gadFile: null,
            matrixFile: null,
            supportingDocuments: [],
          });

          setExistingFiles(fileBuckets);
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
        const nextSupport = prev.supporting.filter((_, idx) => idx !== index);
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
        sustainableDevelopmentGoals: formData.sustainableDevelopmentGoals,
        proposedBudget: formData.proposedBudget,
        budgetBreakdown: proposal.budgetBreakdown || undefined,
        statusID: 1, // move back to Under Review / Submitted
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
      if (formData.supportingDocuments && formData.supportingDocuments.length > 0) {
        payload.supportingDocuments = formData.supportingDocuments;
      }

      const response = await updateProposal(proposal.proposalID || proposal.id, payload);

      if (response.success) {
        window.customAlert?.("✓", "Proposal resubmitted successfully!", 2500) || alert("Proposal resubmitted successfully!");
        // Redirect to proponent dashboard after resubmit
        setTimeout(() => {
          router.visit("/proponent/", { replace: true });
        }, 2600);
      } else {
        throw new Error(response.message || "Failed to resubmit proposal");
      }
    } catch (err) {
      console.error("Revision submit failed", err);
      setError(err.message || "Failed to resubmit proposal");
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = useMemo(() => [
    { label: "For Revision", href: "/proponent/revision" },
    { label: "Edit", href: null },
  ], []);

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
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to continue</h3>
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
            <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Revision</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">{formData.researchTitle || "Untitled Proposal"}</h1>
            <p className="text-gray-600 mt-2">Update your proposal and resubmit to the Center Manager.</p>
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
              onRemoveExisting={() => removeExistingFile("proposal")}
              onFileSelect={(file) => {
                setFormData((prev) => ({ ...prev, updatedForm: file }));
                if (file) removeExistingFile("proposal");
              }}
              maxSize={`${maxFileSizeMB}MB`}
              acceptedTypes="PDF, DOC, DOCX"
            />
            <p className="text-xs text-gray-500 mt-2">Attach the updated main proposal document.</p>
          </div>

          <FormField
            label="Research Title"
            value={formData.researchTitle}
            onChange={(value) => setFormData((prev) => ({ ...prev, researchTitle: value }))}
            required
          />

          <TextAreaField
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
            rows={4}
            required
          />

          <TextAreaField
            label="Objectives"
            value={formData.objectives}
            onChange={(value) => setFormData((prev) => ({ ...prev, objectives: value }))}
            rows={3}
            required
          />

          {/* Existing Selections Collapsible Card */}
          {(existingFiles.proposal || (Array.isArray(formData.researchAgenda) && formData.researchAgenda.length > 0) || (Array.isArray(formData.dostSPs) && formData.dostSPs.length > 0) || (Array.isArray(formData.sustainableDevelopmentGoals) && formData.sustainableDevelopmentGoals.length > 0)) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative z-0">
              <button
                type="button"
                onClick={() => setShowExistingSelections(!showExistingSelections)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-sm font-semibold text-gray-800">Your Original Selections</h3>
                <span className="text-gray-500">{showExistingSelections ? '▼' : '▶'}</span>
              </button>
              
              {showExistingSelections && (
                <div className="mt-4 space-y-4 border-t border-blue-200 pt-4">
                  {Array.isArray(formData.researchAgenda) && formData.researchAgenda.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-blue-600 mb-2">Research Agenda</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.researchAgenda.map((item, idx) => (
                          <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(formData.dostSPs) && formData.dostSPs.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-blue-600 mb-2">DOST Strategic Programs</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.dostSPs.map((item, idx) => (
                          <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(formData.sustainableDevelopmentGoals) && formData.sustainableDevelopmentGoals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-blue-600 mb-2">Sustainable Development Goals</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.sustainableDevelopmentGoals.map((item, idx) => (
                          <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                            {item}
                          </span>
                        ))}
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
            onChange={(opts) => setFormData((prev) => ({ ...prev, researchAgenda: opts }))}
          />

          <CheckboxGroup
            label="DOST Strategic Programs"
            options={dostSPsOptions}
            selectedOptions={formData.dostSPs}
            onChange={(opts) => setFormData((prev) => ({ ...prev, dostSPs: opts }))}
          />

          <CheckboxGroup
            label="Sustainable Development Goals"
            options={sdgOptions}
            selectedOptions={formData.sustainableDevelopmentGoals}
            onChange={(opts) => setFormData((prev) => ({ ...prev, sustainableDevelopmentGoals: opts }))}
            columns={2}
          />

          <FormField
            label="Proposed Budget (₱)"
            type="number"
            min="0"
            value={formData.proposedBudget}
            onChange={(e) => setFormData((prev) => ({ ...prev, proposedBudget: e.target.value }))}
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
                onRemoveExisting={() => removeExistingFile("seti")}
                onFileSelect={(file) => {
                  setFormData(prev => ({ ...prev, setiFile: file }));
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
                onRemoveExisting={() => removeExistingFile("gad")}
                onFileSelect={(file) => {
                  setFormData(prev => ({ ...prev, gadFile: file }));
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
                onRemoveExisting={() => removeExistingFile("matrix")}
                onFileSelect={(file) => {
                  setFormData(prev => ({ ...prev, matrixFile: file }));
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
              description="Attach any other approvals or supporting files. Accepted formats: PDF, DOC, DOCX."
              existingFiles={existingFiles.supporting}
              onRemoveExisting={(index) => removeExistingFile("supporting", index)}
            />
          </div>

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
              {saving && <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></span>}
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
