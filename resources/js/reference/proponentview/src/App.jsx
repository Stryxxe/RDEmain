import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SubmitPage from './pages/SubmitPage';
import Projects from './pages/Projects';
import ProposalDetail from './pages/ProposalDetail';
import ResourcesPage from './pages/Resources';
import AccountPage from './pages/Account';
import NotificationsPage from './pages/Notification';
import MessagesPage from './pages/Messages';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<SubmitPage />} />
          <Route path="/submit" element={<SubmitPage />} />
          <Route path="/tracker" element={<SubmitPage />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProposalDetail />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/notification" element={<NotificationsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
