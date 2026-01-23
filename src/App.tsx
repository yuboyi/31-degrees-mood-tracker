import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AddMoodPage from './pages/AddMoodPage';
import BusinessIntegrationPage from './pages/BusinessIntegrationPage';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddMoodPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/business" element={<BusinessIntegrationPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
