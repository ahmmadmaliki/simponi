import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import KinerjaKegiatan from './pages/KinerjaKegiatan';
import Evaluasi from './pages/Evaluasi';
import RekomendasiTindakan from './pages/RekomendasiTindakan';

import UserManagement from './pages/MasterData/UserManagement';
import DataPanen from './pages/MasterData/DataPanen';
import DataTunggakan from './pages/MasterData/DataTunggakan';
import DataTarget from './pages/MasterData/DataTarget';
import DataRealisasi from './pages/MasterData/DataRealisasi';

// Simple mock auth guard
const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('auth') === 'true';
  return isAuth ? children : <Navigate to="/login" />;
};

// Admin only guard
const AdminRoute = ({ children }) => {
  const role = localStorage.getItem('role');
  return role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="kinerja" element={<KinerjaKegiatan />} />
          <Route path="evaluasi" element={<Evaluasi />} />
          <Route path="rekomendasi" element={<RekomendasiTindakan />} />

          {/* Master Data Routes (Admin Only) */}
          <Route path="master/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="master/panen" element={<AdminRoute><DataPanen /></AdminRoute>} />
          <Route path="master/tunggakan" element={<AdminRoute><DataTunggakan /></AdminRoute>} />
          <Route path="master/target" element={<AdminRoute><DataTarget /></AdminRoute>} />
          <Route path="master/realisasi" element={<AdminRoute><DataRealisasi /></AdminRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
