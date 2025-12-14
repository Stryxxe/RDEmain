import React, { useState } from "react";
import PDFViewer from "../../../Components/PDFViewer";

const RDDEditProposal = ({ proposal, onBack, onSave }) => {
    const [formData, setFormData] = useState({
        researchTitle: proposal?.researchTitle || proposal?.title || "",
        description: proposal?.description || "",
        objectives: proposal?.objectives || "",
        researchAgenda: proposal?.researchAgenda || [],
        dostSPs: proposal?.dostSPs || [],
        sustainableDevelopmentGoals:
            proposal?.sustainableDevelopmentGoals || [],
        proposedBudget: proposal?.proposedBudget || "",
    });

    const [expandedSections, setExpandedSections] = useState({
        basicInfo: true,
        researchAgenda: false,
        dostSPs: false,
        sdg: false,
        budget: false,
        supportingDocuments: false,
        otherSupportingDocuments: false,
    });

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

    const handleCheckboxChange = (category, value) => {
        setFormData((prev) => ({
            ...prev,
            [category]: prev[category].includes(value)
                ? prev[category].filter((item) => item !== value)
                : [...prev[category], value],
        }));
    };

    const handleSave = () => {
        // Include researchTitle, description, and objectives in the save data
        onSave({
            ...formData,
            researchTitle: formData.researchTitle,
            description: formData.description,
            objectives: formData.objectives,
        });
    };

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleBudgetChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            proposedBudget: e.target.value,
        }));
    };

    // Get PDF path from proposal files
    const pdfPath =
        proposal?.files?.find((f) => {
            const fileName = f.fileName?.toLowerCase() || "";
            return (
                f.fileType === "concept_paper" ||
                f.fileType === "report" ||
                fileName.includes("concept") ||
                fileName.includes("research") ||
                fileName.includes("paper")
            );
        })?.filePath || null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={onBack}
                                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
                            >
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                                <span>Back</span>
                            </button>

                            <div>
                                <h1 className="text-lg font-semibold text-gray-800">
                                    Edit Proposal
                                </h1>
                                <p className="text-gray-600 text-sm truncate max-w-md">
                                    {proposal?.researchTitle || proposal?.title}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Main Content - Scrollable */}
                <div className="overflow-y-auto flex-1 px-4 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* Left Side - Checklist */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-3 space-y-3">
                                    {/* Basic Information Section - Research Title, Description, Objectives */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() =>
                                                toggleSection("basicInfo")
                                            }
                                            className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
                                        >
                                            <h2 className="text-sm font-medium text-gray-800">
                                                Basic Information
                                            </h2>
                                            <svg
                                                className={`w-4 h-4 text-gray-600 transition-transform ${
                                                    expandedSections.basicInfo
                                                        ? "rotate-180"
                                                        : ""
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {expandedSections.basicInfo && (
                                            <div className="space-y-3 pl-2">
                                                {/* Research Title */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Research Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            formData.researchTitle
                                                        }
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                "researchTitle",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                                                        placeholder="Enter research title"
                                                    />
                                                </div>

                                                {/* Description */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        value={
                                                            formData.description
                                                        }
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                "description",
                                                                e.target.value
                                                            )
                                                        }
                                                        rows={4}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 resize-y"
                                                        placeholder="Enter proposal description"
                                                    />
                                                </div>

                                                {/* Objectives */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Objectives
                                                    </label>
                                                    <textarea
                                                        value={
                                                            formData.objectives
                                                        }
                                                        onChange={(e) =>
                                                            handleInputChange(
                                                                "objectives",
                                                                e.target.value
                                                            )
                                                        }
                                                        rows={4}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 resize-y"
                                                        placeholder="Enter proposal objectives"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Research Agenda Section */}
                                    <div className="space-y-2">
                                        <button
                                            onClick={() =>
                                                toggleSection("researchAgenda")
                                            }
                                            className="w-full flex items-center justify-between p-2.5 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors border border-blue-200"
                                        >
                                            <h2 className="text-sm font-medium text-gray-800">
                                                Research Agenda
                                            </h2>
                                            <svg
                                                className={`w-4 h-4 text-gray-600 transition-transform ${
                                                    expandedSections.researchAgenda
                                                        ? "rotate-180"
                                                        : ""
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {expandedSections.researchAgenda && (
                                            <div className="space-y-1.5 pl-2">
                                                <p className="text-gray-600 text-xs mb-2">
                                                    Select the RDE Agenda that
                                                    aligns best with your study
                                                </p>

                                                <div className="space-y-1">
                                                    {researchAgendaOptions.map(
                                                        (option) => (
                                                            <label
                                                                key={option}
                                                                className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.researchAgenda.includes(
                                                                        option
                                                                    )}
                                                                    onChange={() =>
                                                                        handleCheckboxChange(
                                                                            "researchAgenda",
                                                                            option
                                                                        )
                                                                    }
                                                                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                />
                                                                <span className="text-xs text-gray-700">
                                                                    {option}
                                                                </span>
                                                            </label>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* DOST Strategic Programs Section */}
                                    <div className="space-y-2 pt-2 border-t border-gray-200">
                                        <button
                                            onClick={() =>
                                                toggleSection("dostSPs")
                                            }
                                            className="w-full flex items-center justify-between p-2.5 bg-green-50 hover:bg-green-100 rounded-md transition-colors border border-green-200"
                                        >
                                            <h2 className="text-sm font-medium text-gray-800">
                                                DOST Strategic Programs
                                            </h2>
                                            <svg
                                                className={`w-4 h-4 text-gray-600 transition-transform ${
                                                    expandedSections.dostSPs
                                                        ? "rotate-180"
                                                        : ""
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {expandedSections.dostSPs && (
                                            <div className="space-y-1.5 pl-2">
                                                <p className="text-gray-600 text-xs mb-2">
                                                    Select the most applicable
                                                    category from the DOST
                                                    Strategic Programs
                                                </p>

                                                <div className="space-y-1">
                                                    {dostSPsOptions.map(
                                                        (option) => (
                                                            <label
                                                                key={option}
                                                                className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.dostSPs.includes(
                                                                        option
                                                                    )}
                                                                    onChange={() =>
                                                                        handleCheckboxChange(
                                                                            "dostSPs",
                                                                            option
                                                                        )
                                                                    }
                                                                    className="w-3.5 h-3.5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                                />
                                                                <span className="text-xs text-gray-700">
                                                                    {option}
                                                                </span>
                                                            </label>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sustainable Development Goal Section */}
                                    <div className="space-y-2 pt-2 border-t border-gray-200">
                                        <button
                                            onClick={() => toggleSection("sdg")}
                                            className="w-full flex items-center justify-between p-2.5 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors border border-purple-200"
                                        >
                                            <h2 className="text-sm font-medium text-gray-800">
                                                Sustainable Development Goals
                                            </h2>
                                            <svg
                                                className={`w-4 h-4 text-gray-600 transition-transform ${
                                                    expandedSections.sdg
                                                        ? "rotate-180"
                                                        : ""
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {expandedSections.sdg && (
                                            <div className="space-y-1.5 pl-2">
                                                <p className="text-gray-600 text-xs mb-2">
                                                    Select the Sustainable
                                                    Development Goals (SDG) that
                                                    best align with your study
                                                </p>

                                                <div className="space-y-1">
                                                    {sdgOptions.map(
                                                        (option) => (
                                                            <label
                                                                key={option}
                                                                className="flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.sustainableDevelopmentGoals.includes(
                                                                        option
                                                                    )}
                                                                    onChange={() =>
                                                                        handleCheckboxChange(
                                                                            "sustainableDevelopmentGoals",
                                                                            option
                                                                        )
                                                                    }
                                                                    className="w-3.5 h-3.5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                                                />
                                                                <span className="text-xs text-gray-700">
                                                                    {option}
                                                                </span>
                                                            </label>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Budget Section */}
                                    <div className="space-y-2 pt-2 border-t border-gray-200">
                                        <button
                                            onClick={() =>
                                                toggleSection("budget")
                                            }
                                            className="w-full flex items-center justify-between p-2.5 bg-yellow-50 hover:bg-yellow-100 rounded-md transition-colors border border-yellow-200"
                                        >
                                            <h2 className="text-sm font-medium text-gray-800">
                                                Budget
                                            </h2>
                                            <svg
                                                className={`w-4 h-4 text-gray-600 transition-transform ${
                                                    expandedSections.budget
                                                        ? "rotate-180"
                                                        : ""
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {expandedSections.budget && (
                                            <div className="space-y-2 pl-2">
                                                <p className="text-gray-600 text-xs mb-2">
                                                    Enter the proposed budget
                                                    for this project
                                                </p>

                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                                        ₱
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={
                                                            formData.proposedBudget
                                                        }
                                                        onChange={
                                                            handleBudgetChange
                                                        }
                                                        placeholder="0.00"
                                                        className="w-full pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Supporting Documents Section */}
                                    {proposal?.files &&
                                        proposal.files.length > 0 &&
                                        (() => {
                                            // Helper function to check if a file is a research proposal file
                                            // IMPORTANT: Only check fileType, NOT filename keywords to avoid false positives
                                            const isResearchProposalFile = (
                                                file
                                            ) => {
                                                if (!file) return false;
                                                const fileType =
                                                    file.fileType?.toLowerCase() ||
                                                    "";
                                                return (
                                                    fileType ===
                                                        "concept_paper" ||
                                                    fileType === "report"
                                                );
                                            };

                                            const setiFiles =
                                                proposal.files.filter(
                                                    (f) =>
                                                        f.fileType ===
                                                        "seti_scorecard"
                                                );
                                            const gadFiles =
                                                proposal.files.filter(
                                                    (f) =>
                                                        f.fileType ===
                                                        "gad_certificate"
                                                );
                                            const mocFiles =
                                                proposal.files.filter(
                                                    (f) =>
                                                        f.fileType ===
                                                        "matrix_compliance"
                                                );
                                            const hasSupportingDocs =
                                                setiFiles.length > 0 ||
                                                gadFiles.length > 0 ||
                                                mocFiles.length > 0;

                                            return hasSupportingDocs ? (
                                                <div className="space-y-2 pt-2 border-t border-gray-200">
                                                    <button
                                                        onClick={() =>
                                                            toggleSection(
                                                                "supportingDocuments"
                                                            )
                                                        }
                                                        className="w-full flex items-center justify-between p-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-200"
                                                    >
                                                        <h2 className="text-sm font-medium text-gray-800">
                                                            Supporting Documents
                                                        </h2>
                                                        <svg
                                                            className={`w-4 h-4 text-gray-600 transition-transform ${
                                                                expandedSections.supportingDocuments
                                                                    ? "rotate-180"
                                                                    : ""
                                                            }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                    </button>

                                                    {expandedSections.supportingDocuments && (
                                                        <div className="space-y-3 pl-2">
                                                            {/* SETI Files */}
                                                            {setiFiles.length >
                                                                0 && (
                                                                <div>
                                                                    <h3 className="text-xs font-semibold text-blue-900 mb-2">
                                                                        SETI
                                                                        Scorecard
                                                                    </h3>
                                                                    <div className="space-y-1">
                                                                        {setiFiles.map(
                                                                            (
                                                                                file,
                                                                                idx
                                                                            ) => (
                                                                                <a
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    href={`/storage/${file.filePath}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 hover:bg-blue-100 transition-colors"
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
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                        />
                                                                                    </svg>
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            file.fileName
                                                                                        }
                                                                                    </span>
                                                                                </a>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* GAD Files */}
                                                            {gadFiles.length >
                                                                0 && (
                                                                <div>
                                                                    <h3 className="text-xs font-semibold text-pink-900 mb-2">
                                                                        GAD
                                                                        Certificate
                                                                    </h3>
                                                                    <div className="space-y-1">
                                                                        {gadFiles.map(
                                                                            (
                                                                                file,
                                                                                idx
                                                                            ) => (
                                                                                <a
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    href={`/storage/${file.filePath}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center space-x-2 p-2 bg-pink-50 border border-pink-200 rounded text-xs text-pink-700 hover:bg-pink-100 transition-colors"
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
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                        />
                                                                                    </svg>
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            file.fileName
                                                                                        }
                                                                                    </span>
                                                                                </a>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* MOC Files */}
                                                            {mocFiles.length >
                                                                0 && (
                                                                <div>
                                                                    <h3 className="text-xs font-semibold text-yellow-900 mb-2">
                                                                        Matrix
                                                                        of
                                                                        Compliance
                                                                    </h3>
                                                                    <div className="space-y-1">
                                                                        {mocFiles.map(
                                                                            (
                                                                                file,
                                                                                idx
                                                                            ) => (
                                                                                <a
                                                                                    key={
                                                                                        idx
                                                                                    }
                                                                                    href={`/storage/${file.filePath}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 hover:bg-yellow-100 transition-colors"
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
                                                                                            strokeWidth={
                                                                                                2
                                                                                            }
                                                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                        />
                                                                                    </svg>
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            file.fileName
                                                                                        }
                                                                                    </span>
                                                                                </a>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null;
                                        })()}

                                    {/* Other Supporting Documents Section */}
                                    {proposal?.files &&
                                        proposal.files.length > 0 &&
                                        (() => {
                                            // IMPORTANT: Only check fileType, NOT filename keywords to avoid false positives
                                            const isResearchProposalFile = (
                                                file
                                            ) => {
                                                if (!file) return false;
                                                const fileType =
                                                    file.fileType?.toLowerCase() ||
                                                    "";
                                                return (
                                                    fileType ===
                                                        "concept_paper" ||
                                                    fileType === "report"
                                                );
                                            };

                                            const otherFiles =
                                                proposal.files.filter((f) => {
                                                    // Exclude revision images - they are shown in revision comments section
                                                    if (
                                                        f.fileType ===
                                                        "revision_image"
                                                    ) {
                                                        return false;
                                                    }
                                                    // Exclude SETI, GAD, MOC files
                                                    if (
                                                        f.fileType ===
                                                            "seti_scorecard" ||
                                                        f.fileType ===
                                                            "gad_certificate" ||
                                                        f.fileType ===
                                                            "matrix_compliance"
                                                    ) {
                                                        return false;
                                                    }
                                                    // Exclude research proposal files
                                                    if (
                                                        isResearchProposalFile(
                                                            f
                                                        )
                                                    ) {
                                                        return false;
                                                    }
                                                    return true;
                                                });

                                            return otherFiles.length > 0 ? (
                                                <div className="space-y-2 pt-2 border-t border-gray-200">
                                                    <button
                                                        onClick={() =>
                                                            toggleSection(
                                                                "otherSupportingDocuments"
                                                            )
                                                        }
                                                        className="w-full flex items-center justify-between p-2.5 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors border border-orange-200"
                                                    >
                                                        <h2 className="text-sm font-medium text-gray-800">
                                                            Other Supporting
                                                            Documents
                                                        </h2>
                                                        <svg
                                                            className={`w-4 h-4 text-gray-600 transition-transform ${
                                                                expandedSections.otherSupportingDocuments
                                                                    ? "rotate-180"
                                                                    : ""
                                                            }`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                    </button>

                                                    {expandedSections.otherSupportingDocuments && (
                                                        <div className="space-y-2 pl-2">
                                                            <div className="space-y-1">
                                                                {otherFiles.map(
                                                                    (
                                                                        file,
                                                                        idx
                                                                    ) => (
                                                                        <a
                                                                            key={
                                                                                idx
                                                                            }
                                                                            href={`/storage/${file.filePath}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center space-x-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700 hover:bg-orange-100 transition-colors"
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
                                                                                    strokeWidth={
                                                                                        2
                                                                                    }
                                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                                />
                                                                            </svg>
                                                                            <span className="truncate">
                                                                                {
                                                                                    file.fileName
                                                                                }
                                                                            </span>
                                                                        </a>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null;
                                        })()}
                                </div>
                            </div>
                        </div>

                        {/* Right Side - PDF Viewer */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-2.5 border-b border-gray-200 bg-gray-50">
                                    <h3 className="text-sm font-medium text-gray-800">
                                        Proposal Document
                                    </h3>
                                    <p className="text-xs text-gray-600">
                                        Review and reference the original
                                        proposal while editing
                                    </p>
                                </div>
                                <div className="h-[600px] min-h-[600px]">
                                    {pdfPath ? (
                                        <PDFViewer
                                            pdfPath={pdfPath}
                                            title="Proposal Document"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-center">
                                                <svg
                                                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                                <p className="text-gray-600 font-medium">
                                                    No proposal document
                                                    available
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RDDEditProposal;
