import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormField from '../Components/FormField';
import CheckboxGroup from '../Components/CheckboxGroup';
import FileUpload from '../Components/FileUpload';
import TextAreaField from '../Components/TextAreaField';
import DragDropUpload from '../Components/DragDropUpload';
import apiService from '../services/api';

const SubmitPage = () => {
  const [formData, setFormData] = useState({
    reportFile: null,
    reportTitle: '',
    description: '',
    objectives: '',
    researchAgenda: [],
    dostSPs: [],
    sustainableDevelopmentGoals: [],
    proposedBudget: '',
    setiScorecard: null,
    gadCertificate: null,
    matrixOfCompliance: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const navigate = useNavigate();


  const researchAgendaOptions = [
    'Agriculture, Aquatic, and Agro-Forestry',
    'Business and Trade',
    'Social Sciences and Education',
    'Engineering and Technology',
    'Environment and Natural Resources',
    'Health and Wellness',
    'Peace and Security'
  ];

  const dostSPsOptions = [
    'Publication',
    'Patent',
    'Product',
    'People Services',
    'Places and Partnership',
    'Policies'
  ];

  const sdgOptions = [
    'No Poverty',
    'Zero Hunger',
    'Good Health and Well-being',
    'Quality Education',
    'Gender Equality',
    'Clean Water and Sanitation',
    'Affordable and Clean Energy',
    'Decent Work and Economic Growth',
    'Industry, Innovation and Infrastructure',
    'Reduced Inequalities',
    'Sustainable Cities and Communities',
    'Responsible Consumption and Production',
    'Climate Action',
    'Life Below Water',
    'Life on Land',
    'Peace, Justice and Strong Institutions',
    'Partnerships for the Goals'
  ];

  const formatNumber = (value) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    // Add commas for thousands
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseNumber = (formattedValue) => {
    // Remove commas and return numeric value
    return formattedValue.replace(/,/g, '');
  };

  const handleInputChange = (field, value) => {
    if (field === 'proposedBudget') {
      // Format the budget with commas
      const formattedValue = formatNumber(value);
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileSelect = (file) => {
    setFormData(prev => ({
      ...prev,
      reportFile: file
    }));
  };

  const handleCheckboxChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleFileChange = (field, file) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.reportFile) {
      errors.push('Report file is required');
    }
    if (!formData.reportTitle.trim()) {
      errors.push('Report title is required');
    }
    if (!formData.description.trim()) {
      errors.push('Description is required');
    }
    if (!formData.objectives.trim()) {
      errors.push('Objectives are required');
    }
    if (formData.researchAgenda.length === 0) {
      errors.push('At least one research agenda must be selected');
    }
    if (formData.dostSPs.length === 0) {
      errors.push('At least one DOST SP must be selected');
    }
    if (formData.sustainableDevelopmentGoals.length === 0) {
      errors.push('At least one SDG must be selected');
    }
    if (!formData.proposedBudget || parseFloat(parseNumber(formData.proposedBudget)) <= 0) {
      errors.push('Valid proposed budget is required');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSubmitError(validationErrors.join(', '));
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      // Parse the budget value before sending to API
      const submissionData = {
        ...formData,
        proposedBudget: parseNumber(formData.proposedBudget)
      };
      const response = await apiService.createProposal(submissionData);
      
      if (response.success) {
        setSubmitSuccess(true);
        // Reset form
        setFormData({
          reportFile: null,
          reportTitle: '',
          description: '',
          objectives: '',
          researchAgenda: [],
          dostSPs: [],
          sustainableDevelopmentGoals: [],
          proposedBudget: '',
          setiScorecard: null,
          gadCertificate: null,
          matrixOfCompliance: null
        });
        
        // Redirect to projects page after 2 seconds
        setTimeout(() => {
          navigate('/proponent/projects');
        }, 2000);
      } else {
        setSubmitError(response.message || 'Failed to submit proposal');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'An error occurred while submitting the proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-4xl w-full">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Submitted Successfully!</h1>
          <p className="text-gray-600 mb-4">Your research proposal has been submitted for review.</p>
          <p className="text-sm text-gray-500">Redirecting to projects page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Proposal</h1>
      </div>

      {submitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{submitError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <DragDropUpload 
              onFileSelect={handleFileSelect}
              acceptedTypes="PDF, DOC, DOCX"
              maxSize="10MB"
              selectedFile={formData.reportFile}
            />
          </div>

          <div className="mb-8">
            <FormField
              label="Report Title"
              required
              value={formData.reportTitle}
              onChange={(value) => handleInputChange('reportTitle', value)}
              placeholder="Enter report title"
            />
          </div>

          <div className="mb-8">
            <TextAreaField
              label="Description"
              required
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Enter report description"
              rows={4}
            />
          </div>

          <div className="mb-8">
            <TextAreaField
              label="Objectives"
              required
              value={formData.objectives}
              onChange={(value) => handleInputChange('objectives', value)}
              placeholder="Enter research objectives"
              rows={4}
            />
          </div>


          <div className="mb-8">
            <CheckboxGroup
              label="Research Agenda"
              required
              options={researchAgendaOptions}
              selectedValues={formData.researchAgenda}
              onChange={(value, checked) => handleCheckboxChange('researchAgenda', value, checked)}
              hint="Select the RDE Agenda that aligns best with your study."
              columns={2}
            />
          </div>

          <div className="mb-8">
            <CheckboxGroup
              label="DOST 6P's"
              required
              options={dostSPsOptions}
              selectedValues={formData.dostSPs}
              onChange={(value, checked) => handleCheckboxChange('dostSPs', value, checked)}
              hint="Select the most applicable category from the DOST 6Ps that best aligns with your study"
              columns={1}
            />
          </div>

          <div className="mb-8">
            <CheckboxGroup
              label="Sustainable Development Goal"
              required
              options={sdgOptions}
              selectedValues={formData.sustainableDevelopmentGoals}
              onChange={(value, checked) => handleCheckboxChange('sustainableDevelopmentGoals', value, checked)}
              hint="Select the SDG that best aligns with your study"
              columns={2}
            />
          </div>

          <div className="mb-8">
            <FormField
              label="Proposed Budget"
              required
              type="text"
              value={formData.proposedBudget}
              onChange={(value) => handleInputChange('proposedBudget', value)}
              placeholder="Enter proposed budget amount"
              hint="Enter the proposed budget amount in Philippine Peso (₱)"
            />
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-2">
              Supporting Documents
            </h3>
            
            <div className="space-y-6">
              <FileUpload
                label="Upload SETI Scorecard"
                onChange={(file) => handleFileChange('setiScorecard', file)}
                accept=".pdf,.doc,.docx"
                selectedFile={formData.setiScorecard}
              />
              
              <FileUpload
                label="Upload GAD Certificate"
                onChange={(file) => handleFileChange('gadCertificate', file)}
                accept=".pdf,.doc,.docx"
                selectedFile={formData.gadCertificate}
              />
              
              <FileUpload
                label="Upload Matrix of Compliance (If Applicable)"
                onChange={(file) => handleFileChange('matrixOfCompliance', file)}
                accept=".pdf,.doc,.docx"
                selectedFile={formData.matrixOfCompliance}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/proponent/projects')}
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
              {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
    </div>
  );
};

export default SubmitPage;
