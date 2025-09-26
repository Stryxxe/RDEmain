import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../Components/Layout';
import SubmitPage from '../SubmitPage';
import Projects from '../Projects';
import ProposalDetail from '../ProposalDetail';
import Tracker from '../Tracker';
import TrackerDetail from '../TrackerDetail';
import ResourcesPage from '../Resources';
import AccountPage from '../Account';
import NotificationsPage from '../Notification';
import MessagesPage from '../Messages';

const ProponentView = () => {
  return (
    <div className="App">
      <Routes>
        <Route index element={<Layout><SubmitPage /></Layout>} />
        <Route path="submit" element={<Layout><SubmitPage /></Layout>} />
        <Route path="tracker" element={<Layout><Tracker /></Layout>} />
        <Route path="tracker/:id" element={<Layout><TrackerDetail /></Layout>} />
        <Route path="projects" element={<Layout><Projects /></Layout>} />
        <Route path="projects/:id" element={<Layout><ProposalDetail /></Layout>} />
        <Route path="resources" element={<Layout><ResourcesPage /></Layout>} />
        <Route path="account" element={<Layout><AccountPage /></Layout>} />
        <Route path="notification" element={<Layout><NotificationsPage /></Layout>} />
        <Route path="messages" element={<Layout><MessagesPage /></Layout>} />
      </Routes>
    </div>
  );
};

export default ProponentView;
