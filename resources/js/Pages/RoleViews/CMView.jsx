import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CMLayout from '../../Components/CMLayout';
import CMDashboard from './CM/CMDashboard';
import CMReviewProposal from './CM/CMReviewProposal';
import CMProgressReport from './CM/CMProgressReport';
import CMSubmitReport from './CM/CMSubmitReport';
import CMResources from './CM/CMResources';
import CMAccount from './CM/CMAccount';
import CMProposalDetail from './CM/CMProposalDetail';
import CMNotifications from './CM/CMNotifications';
import CMMessages from './CM/CMMessages';

const CMView = () => {
  return (
    <CMLayout>
      <Routes>
        <Route index element={<CMDashboard />} />
        <Route path="dashboard" element={<CMDashboard />} />
        <Route path="review-proposal" element={<CMReviewProposal />} />
        <Route path="progress-report" element={<CMProgressReport />} />
        <Route path="submit-report" element={<CMSubmitReport />} />
        <Route path="resources" element={<CMResources />} />
        <Route path="account" element={<CMAccount />} />
        <Route path="proposal/:id" element={<CMProposalDetail />} />
        <Route path="notifications" element={<CMNotifications />} />
        <Route path="messages" element={<CMMessages />} />
      </Routes>
    </CMLayout>
  );
};

export default CMView;