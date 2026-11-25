import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from './landing/LandingPage';
import { LiveDemoPage } from './pages/LiveDemoPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<LiveDemoPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
