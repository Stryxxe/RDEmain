import React, { useState, useRef, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../contexts/NotificationContext";
import FormField from "../Components/FormField";
import AsyncProponentSelect from "../Components/AsyncProponentSelect";
import CheckboxGroup from "../Components/CheckboxGroup";
import TextAreaField from "../Components/TextAreaField";
import DragDropUpload from "../Components/DragDropUpload";
import MultiFileUpload from "../Components/MultiFileUpload";
import apiService from "../services/api";
import { processProposalOCR } from "../services/ocrService";
import RoleBasedLayout from "../Components/Layouts/RoleBasedLayout";
import AppLayout from "../Components/Layouts/AppLayout";
import Breadcrumbs from "../Components/Breadcrumbs";
import { useUploadSettings } from "../hooks/useUploadSettings";

// Icon Components
const CheckCircleIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const CheckIcon = ({ className = "w-8 h-8" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const XCircleIcon = ({ className = "h-5 w-5" }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const SpinnerIcon = ({ className = "h-5 w-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LightningBoltIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const SubmitPage = () => {
    const { user } = useAuth();
    const { props } = usePage();
    const { refreshAllNotifications } = useNotifications();

    // Get user from Inertia props (more reliable than context on initial load)
    const currentUser = user || props?.auth?.user;

    // Validate authentication on mount
    useEffect(() => {
        // Prevent redirect loop - check if we're already on login page or dashboard
        const currentPath = window.location.pathname;
        if (
            currentPath === "/login" ||
            currentPath === "/" ||
            currentPath === "/dashboard"
        ) {
            return;
        }

        // Wait a bit for user to be available (in case of initial page load)
        const checkAuth = setTimeout(() => {
            if (!currentUser) {
                router.visit("/login");
                return;
            }

            // Check if user is a Proponent - only redirect if NOT a proponent
            // Don't redirect if already on a proponent route to prevent loops
            if (
                currentUser.role?.userRole !== "Proponent" &&
                !currentPath.startsWith("/proponent")
            ) {
                router.visit("/dashboard");
                return;
            }
        }, 100);

        return () => clearTimeout(checkAuth);
    }, [currentUser]);

    // Get dynamic upload settings from backend
    const { maxFileSizeMB, loading: settingsLoading } = useUploadSettings();

    const [formData, setFormData] = useState({
        reportFile: null,
        reportTitle: "",
        description: "",
        objectives: "",
        researchAgenda: [],
        dostSPs: [],
        sustainableDevelopmentGoals: [],
        proposedBudget: "",
        setiFile: null,
        gadFile: null,
        matrixFile: null,
        supportingDocuments: [],
        proponents: [],
    });
    const [submitterProjectRoleID, setSubmitterProjectRoleID] = useState("");
    const [projectRoles, setProjectRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);
    
    // OCR state
    const [isOCRProcessing, setIsOCRProcessing] = useState(false);
    const [ocrError, setOcrError] = useState("");
    const [autoFilledData, setAutoFilledData] = useState(null);

    // Refs for form fields to enable scrolling
    const reportFileRef = useRef(null);
    const reportTitleRef = useRef(null);
    const descriptionRef = useRef(null);
    const objectivesRef = useRef(null);
    const researchAgendaRef = useRef(null);
    const dostSPsRef = useRef(null);
    const sustainableDevelopmentGoalsRef = useRef(null);
    const proposedBudgetRef = useRef(null);

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

    const formatNumber = (value) => {
        // Remove all non-numeric characters
        const numericValue = value.replace(/[^0-9]/g, "");
        // Add commas for thousands
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const parseNumber = (formattedValue) => {
        // Remove commas and return numeric value
        return formattedValue.replace(/,/g, "");
    };

    const handleInputChange = (field, value) => {
        if (field === "proposedBudget") {
            // Format the budget with commas
            const formattedValue = formatNumber(value);
            setFormData((prev) => ({
                ...prev,
                [field]: formattedValue,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
        }
    };

    const handleFileSelect = (file) => {
        setFormData((prev) => ({
            ...prev,
            reportFile: file,
        }));
    };

    const handleCheckboxChange = (field, values) => {
        setFormData((prev) => ({
            ...prev,
            [field]: Array.isArray(values) ? values : [],
        }));
    };

    const handleSupportingDocsChange = (files) => {
        setFormData((prev) => ({
            ...prev,
            supportingDocuments: files,
        }));
    };
    
    // Helper function to search for and match proponents
    const findMatchingProponents = async (extractedNames) => {
        if (!extractedNames || extractedNames.length === 0) {
            return [];
        }
        
        const matchedProponents = [];
        
        for (const name of extractedNames) {
            try {
                // Search for proponent by name
                const response = await axios.get('/api/proponents/search', {
                    params: { q: name }
                });
                
                if (response.data && response.data.length > 0) {
                    // Take the first match (best match)
                    const match = response.data[0];
                    // Avoid duplicates
                    if (!matchedProponents.find(p => p.userID === match.userID)) {
                        matchedProponents.push(match);
                        console.log(`✓ Matched proponent: ${name} -> ${match.fullName}`);
                    }
                } else {
                    console.log(`✗ No match found for: ${name}`);
                }
            } catch (error) {
                console.error(`Error searching for proponent "${name}":`, error);
            }
        }
        
        return matchedProponents;
    };
    
    // OCR Extract Handler - Process the already-uploaded PDF file
    const handleOCRExtract = async () => {
        if (!formData.reportFile) {
            setOcrError("Please upload a PDF file first");
            return;
        }
        
        if (!formData.reportFile.name.toLowerCase().endsWith('.pdf')) {
            setOcrError("Only PDF files can be processed with OCR");
            return;
        }
        
        setIsOCRProcessing(true);
        setOcrError("");
        setSubmitError("");
        
        try {
            // Process the uploaded PDF file
            const result = await processProposalOCR(formData.reportFile);

            if (result.success && result.data) {
                const extractedData = result.data;

                // Helper: map SDG numbers (from backend) to checkbox option labels
                const sdgNumberToLabel = {
                    1: "No Poverty",
                    2: "Zero Hunger",
                    3: "Good Health and Well-being",
                    4: "Quality Education",
                    5: "Gender Equality",
                    6: "Clean Water and Sanitation",
                    7: "Affordable and Clean Energy",
                    8: "Decent Work and Economic Growth",
                    9: "Industry, Innovation and Infrastructure",
                    10: "Reduced Inequalities",
                    11: "Sustainable Cities and Communities",
                    12: "Responsible Consumption and Production",
                    13: "Climate Action",
                    14: "Life Below Water",
                    15: "Life on Land",
                    16: "Peace, Justice and Strong Institutions",
                    17: "Partnerships for the Goals",
                };

                const mappedSDGs = Array.isArray(extractedData.sdgs)
                    ? extractedData.sdgs
                          .map((num) => sdgNumberToLabel[num] || null)
                          .filter(Boolean)
                    : null;

                // Helper: map backend research agenda labels to this form's options
                const researchAgendaMap = {
                    "Agriculture, Aquatic, and Agro-Forestry":
                        "Agriculture, Aquatic, and Agro-Forestry",
                    "Agriculture, Aquatic, and Agro-Forestry Engineering and Technology":
                        "Agriculture, Aquatic, and Agro-Forestry",
                    "Food Security": "Agriculture, Aquatic, and Agro-Forestry",
                    "Climate Change": "Environment and Natural Resources",
                    "Disaster Risk Reduction": "Environment and Natural Resources",
                    "Health and Nutrition": "Health and Wellness",
                };

                // Prefer singular research_agenda key (Python backend) but also support plural
                const rawResearchAgenda =
                    extractedData.research_agenda ??
                    extractedData.research_agendas ??
                    [];

                const rawAgendaArray = Array.isArray(rawResearchAgenda)
                    ? rawResearchAgenda
                    : rawResearchAgenda
                    ? [rawResearchAgenda]
                    : [];

                // Map backend agenda labels into valid checkbox options
                const mappedResearchAgenda = rawAgendaArray
                    .map((item) => researchAgendaMap[item] || item)
                    .filter((label) => researchAgendaOptions.includes(label));

                // Search and auto-select proponents if extracted
                let matchedProponents = [];
                if (extractedData.proponents && Array.isArray(extractedData.proponents) && extractedData.proponents.length > 0) {
                    console.log('🔍 Searching for proponents:', extractedData.proponents);
                    matchedProponents = await findMatchingProponents(extractedData.proponents);
                    if (matchedProponents.length > 0) {
                        console.log(`✅ Auto-selected ${matchedProponents.length} proponent(s)`);
                    }
                }

                // Map extracted data to form fields
                setFormData((prev) => ({
                    ...prev,
                    reportTitle:
                        extractedData.research_title || prev.reportTitle,
                    description:
                        extractedData.description || prev.description,
                    objectives:
                        extractedData.objectives || prev.objectives,
                    proposedBudget: extractedData.budget
                        ? formatNumber(String(extractedData.budget))
                        : prev.proposedBudget,
                    researchAgenda:
                        mappedResearchAgenda.length > 0
                            ? mappedResearchAgenda
                            : prev.researchAgenda,
                    // DOST 6Ps are not currently provided by the Python backend
                    dostSPs: Array.isArray(extractedData.dost_6ps)
                        ? extractedData.dost_6ps
                        : prev.dostSPs,
                    sustainableDevelopmentGoals:
                        mappedSDGs && mappedSDGs.length > 0
                            ? mappedSDGs
                            : prev.sustainableDevelopmentGoals,
                    // Auto-select matched proponents
                    proponents: matchedProponents.length > 0
                        ? matchedProponents
                        : prev.proponents,
                }));

                setAutoFilledData(extractedData);
                
                // Count successfully extracted fields
                const fieldsExtracted = Object.keys(extractedData).filter(key => 
                    extractedData[key] && key !== 'confidence_score' && 
                    (Array.isArray(extractedData[key]) ? extractedData[key].length > 0 : true)
                ).length;
                
                alert(`Successfully extracted ${fieldsExtracted} fields from PDF with ${extractedData.confidence_score}% confidence! Please review and edit as needed before submitting.`);
            } else {
                setOcrError(result.message || "Failed to extract data from PDF");
            }
            
        } catch (error) {
            console.error("OCR extraction error:", error);
            setOcrError(typeof error === 'string' ? error : error.message || "Failed to process PDF. Please try again or fill the form manually.");
        } finally {
            setIsOCRProcessing(false);
        }
    };

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                setRolesLoading(true);
                const data = await apiService.get("/project-roles/active");
                const list = Array.isArray(data?.data) ? data.data : [];
                setProjectRoles(list);
            } catch (e) {
                console.warn("Failed to load project roles");
            } finally {
                setRolesLoading(false);
            }
        };
        fetchRoles();
    }, []);

    const scrollToField = (ref) => {
        if (ref.current) {
            ref.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            // Add a temporary highlight effect
            ref.current.style.borderColor = "#ef4444";
            ref.current.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.1)";
            setTimeout(() => {
                ref.current.style.borderColor = "";
                ref.current.style.boxShadow = "";
            }, 3000);
        }
    };

    const validateForm = () => {
        const errors = [];
        const fieldErrors = {};

        if (!formData.reportFile) {
            errors.push("Report file is required");
            fieldErrors.reportFile = "Report file is required";
        }
        if (!formData.reportTitle.trim()) {
            errors.push("Research title is required");
            fieldErrors.reportTitle = "Research title is required";
        }
        if (!formData.description.trim()) {
            errors.push("Description is required");
            fieldErrors.description = "Description is required";
        } else {
            // Validate word count (250 words max)
            const wordCount = formData.description
                .trim()
                .split(/\s+/)
                .filter((word) => word.length > 0).length;
            if (wordCount > 250) {
                errors.push("Description must not exceed 250 words");
                fieldErrors.description =
                    "Description must not exceed 250 words";
            }
        }
        if (!formData.objectives.trim()) {
            errors.push("Objectives are required");
            fieldErrors.objectives = "Objectives are required";
        }
        if (formData.researchAgenda.length === 0) {
            errors.push("At least one research agenda must be selected");
            fieldErrors.researchAgenda =
                "At least one research agenda must be selected";
        }
        if (formData.dostSPs.length === 0) {
            errors.push("At least one DOST SP must be selected");
            fieldErrors.dostSPs = "At least one DOST SP must be selected";
        }
        if (formData.sustainableDevelopmentGoals.length === 0) {
            errors.push("At least one SDG must be selected");
            fieldErrors.sustainableDevelopmentGoals =
                "At least one SDG must be selected";
        }
        if (
            !formData.proposedBudget ||
            parseFloat(parseNumber(formData.proposedBudget)) <= 0
        ) {
            errors.push("Valid proposed budget is required");
            fieldErrors.proposedBudget = "Valid proposed budget is required";
        }

        return { errors, fieldErrors };
    };

    const handleSubmit = async (e) => {
        console.log("Submitting form with data:", formData);
        e.preventDefault();

        const { errors, fieldErrors } = validateForm();
        if (errors.length > 0) {
            setSubmitError(errors.join(", "));

            // Scroll to the first invalid field
            const fieldRefs = {
                reportFile: reportFileRef,
                reportTitle: reportTitleRef,
                description: descriptionRef,
                objectives: objectivesRef,
                researchAgenda: researchAgendaRef,
                dostSPs: dostSPsRef,
                sustainableDevelopmentGoals: sustainableDevelopmentGoalsRef,
                proposedBudget: proposedBudgetRef,
            };

            // Find the first invalid field and scroll to it
            for (const [fieldName, errorMessage] of Object.entries(
                fieldErrors
            )) {
                if (fieldRefs[fieldName]) {
                    scrollToField(fieldRefs[fieldName]);
                    break;
                }
            }

            return;
        }

        // Validate authentication before submission
        if (!currentUser) {
            setSubmitError(
                "You must be logged in to submit a proposal. Redirecting to login..."
            );
            setTimeout(() => {
                router.visit("/login");
            }, 2000);
            return;
        }

        if (currentUser.role?.userRole !== "Proponent") {
            setSubmitError("Only proponents can submit proposals.");
            return;
        }

        setIsSubmitting(true);
        setSubmitError("");
        setSubmitSuccess(false);

        try {
            // Parse the budget value before sending to API
            // Get researchCenter from user's department if not provided in form
            const researchCenter =
                formData.researchCenter ||
                currentUser?.department?.name ||
                "Not specified";

            const submissionData = {
                ...formData,
                researchCenter: researchCenter,
                proposedBudget: parseNumber(formData.proposedBudget),
                user: currentUser, // Pass user object for API service to use if needed
                submitterProjectRoleID: submitterProjectRoleID || null,
            };
            const response = await apiService.createProposal(submissionData);

            if (response.success) {
                setSubmitSuccess(true);
                // Reset form
                setFormData({
                    reportFile: null,
                    reportTitle: "",
                    description: "",
                    objectives: "",
                    researchAgenda: [],
                    dostSPs: [],
                    sustainableDevelopmentGoals: [],
                    proposedBudget: "",
                    setiFile: null,
                    gadFile: null,
                    matrixFile: null,
                    supportingDocuments: [],
                    proponents: [],
                });
                setSubmitterProjectRoleID("");

                // Immediately refresh notifications to show new notification
                refreshAllNotifications();

                // Redirect to tracker page after 2 seconds
                setTimeout(() => {
                    router.visit("/proponent/tracker");
                }, 2000);
            } else {
                setSubmitError(response.message || "Failed to submit proposal");
            }
        } catch (error) {
            console.error("Error submitting proposal:", error);
            if (error.message.includes("Unauthenticated")) {
                setSubmitError(
                    "Your session has expired. Please log in again. Redirecting..."
                );
                setTimeout(() => {
                    router.visit("/login");
                }, 2000);
            } else if (error.message.includes("Validation failed")) {
                // Show validation errors in a user-friendly way
                setSubmitError(
                    error.message ||
                        "Please check the form and fix the errors before submitting."
                );
            } else {
                setSubmitError(
                    error.message ||
                        "Failed to submit proposal. Please try again."
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading or redirect if not authenticated
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    if (currentUser.role?.userRole !== "Proponent") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">
                        Access denied. Only proponents can submit proposals.
                    </p>
                </div>
            </div>
        );
    }

    if (submitSuccess) {
        return (
            <div className="max-w-4xl w-full">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Proposal Submitted Successfully!
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Your research proposal has been submitted for review.
                    </p>
                    <p className="text-sm text-gray-500">
                        Redirecting to projects page...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl w-full">
            <div className="mb-4">
                <Breadcrumbs
                    items={[{ label: "Submit Proposal", href: null }]}
                />
            </div>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Submit Proposal
                </h1>
            </div>

            {submitError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <XCircleIcon className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Error
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{submitError}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-md p-8"
            >
                {/* Success Message */}
                {autoFilledData && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-800">
                                    Form auto-filled with {autoFilledData.confidence_score}% confidence
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                    Please review all fields below and make any necessary corrections before submitting.
                                </p>
                                {autoFilledData.confidence_score < 70 && (
                                    <p className="text-sm text-yellow-700 mt-2">
                                        Low confidence score - please carefully verify all extracted information.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mb-8" ref={reportFileRef}>
                    <DragDropUpload
                        onFileSelect={handleFileSelect}
                        acceptedTypes="PDF, DOC, DOCX"
                        maxSize={`${maxFileSizeMB}MB`}
                        selectedFile={formData.reportFile}
                    />
                    
                    {/* OCR Auto-Fill Button - Only show for PDF files */}
                    {formData.reportFile && formData.reportFile.name.toLowerCase().endsWith('.pdf') && (
                        <div className="mt-4">
                            {ocrError && (
                                <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-3">
                                    <p className="text-sm text-red-800">{ocrError}</p>
                                </div>
                            )}
                            
                            <button
                                type="button"
                                onClick={handleOCRExtract}
                                disabled={isOCRProcessing}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isOCRProcessing ? (
                                    <>
                                        <SpinnerIcon className="animate-spin h-5 w-5 text-white" />
                                        Processing PDF...
                                    </>
                                ) : (
                                    <>
                                        <LightningBoltIcon className="w-5 h-5" />
                                        Extract Data from PDF (Auto-Fill)
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Click to automatically extract and fill form fields using OCR technology
                            </p>
                        </div>
                    )}
                </div>

                <div className="mb-8" ref={reportTitleRef}>
                    <FormField
                        label="Research Title"
                        required
                        value={formData.reportTitle}
                        onChange={(value) =>
                            handleInputChange("reportTitle", value)
                        }
                        placeholder="Enter research title"
                    />
                </div>

                <div className="mb-8" ref={descriptionRef}>
                    <TextAreaField
                        label="Description"
                        required
                        value={formData.description}
                        onChange={(value) =>
                            handleInputChange("description", value)
                        }
                        placeholder="Enter report description"
                        rows={4}
                        maxWords={250}
                    />
                </div>

                <div className="mb-8" ref={objectivesRef}>
                    <TextAreaField
                        label="Objectives"
                        required
                        value={formData.objectives}
                        onChange={(value) =>
                            handleInputChange("objectives", value)
                        }
                        placeholder="Enter research objectives"
                        rows={4}
                    />
                </div>

                <div className="mb-8" ref={researchAgendaRef}>
                    <CheckboxGroup
                        label="Research Agenda"
                        required
                        options={researchAgendaOptions}
                        selectedOptions={formData.researchAgenda}
                        onChange={(values) =>
                            handleCheckboxChange("researchAgenda", values)
                        }
                        hint="Select the RDE Agenda that aligns best with your study."
                        columns={2}
                    />
                </div>

                <div className="mb-8" ref={dostSPsRef}>
                    <CheckboxGroup
                        label="DOST 6P's"
                        required
                        options={dostSPsOptions}
                        selectedOptions={formData.dostSPs}
                        onChange={(values) =>
                            handleCheckboxChange("dostSPs", values)
                        }
                        hint="Select the most applicable category from the DOST 6Ps that best aligns with your study"
                        columns={1}
                    />
                </div>

                <div className="mb-8" ref={sustainableDevelopmentGoalsRef}>
                    <CheckboxGroup
                        label="Sustainable Development Goal"
                        required
                        options={sdgOptions}
                        selectedOptions={formData.sustainableDevelopmentGoals}
                        onChange={(values) =>
                            handleCheckboxChange(
                                "sustainableDevelopmentGoals",
                                values
                            )
                        }
                        hint="Select the SDG that best aligns with your study"
                        columns={2}
                    />
                </div>

                <div className="mb-8" ref={proposedBudgetRef}>
                    <FormField
                        label="Proposed Budget"
                        required
                        type="text"
                        value={formData.proposedBudget}
                        onChange={(value) =>
                            handleInputChange("proposedBudget", value)
                        }
                        placeholder="Enter proposed budget amount"
                        hint="Enter the proposed budget amount in Philippine Peso (₱)"
                    />
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Submitting Researcher
                    </label>
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div>
                            <div className="text-gray-900 font-medium">
                                {currentUser?.fullName ||
                                    `${currentUser?.firstName || ""} ${
                                        currentUser?.lastName || ""
                                    }`}
                            </div>
                            <div className="text-xs text-gray-500">
                                Proponent
                            </div>
                        </div>
                        <div className="w-64">
                            <label className="block text-xs text-gray-600 mb-1">
                                Project Role
                            </label>
                            <select
                                value={submitterProjectRoleID || ""}
                                onChange={(e) =>
                                    setSubmitterProjectRoleID(e.target.value)
                                }
                                disabled={rolesLoading}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">Select role...</option>
                                {projectRoles.map((r) => (
                                    <option
                                        key={r.projectRoleID}
                                        value={r.projectRoleID}
                                    >
                                        {r.roleName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Proponents{" "}
                        <span className="text-gray-400 font-normal">
                            (optional)
                        </span>
                    </label>
                    <AsyncProponentSelect
                        value={formData.proponents}
                        onChange={(list) =>
                            setFormData((prev) => ({
                                ...prev,
                                proponents: list,
                            }))
                        }
                        placeholder="Type a name to add co-proponents"
                    />
                </div>

                {/* Required Documents - Horizontal Layout */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* SETI Scorecard */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            SETI Scorecard
                        </label>
                        <DragDropUpload
                            selectedFile={formData.setiFile}
                            onFileSelect={(file) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    setiFile: file,
                                }))
                            }
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
                            onFileSelect={(file) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    gadFile: file,
                                }))
                            }
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
                            onFileSelect={(file) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    matrixFile: file,
                                }))
                            }
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
                        allowAllFileTypes={true}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => router.visit("/proponent/tracker")}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        {isSubmitting ? "Submitting..." : "Submit Proposal"}
                    </button>
                </div>
            </form>
        </div>
    );
};

SubmitPage.layout = (page) => (
    <AppLayout>
        <RoleBasedLayout roleName="Proponent">
            <div className="flex justify-center">{page}</div>
        </RoleBasedLayout>
    </AppLayout>
);

export default SubmitPage;
