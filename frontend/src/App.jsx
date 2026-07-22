import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import DataKinerja from './pages/MasterData/DataKinerja';
import DataPasaran from './pages/MasterData/DataPasaran';

// Simple mock auth guard
const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('auth') === 'true';
  const location = useLocation();
  return isAuth ? children : <Navigate to="/login" state={{ from: location }} replace />;
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

          <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />

          {/* Master Data Routes (Admin Only) */}
          <Route path="master/panen" element={<AdminRoute><DataPanen /></AdminRoute>} />
          <Route path="master/tunggakan" element={<AdminRoute><DataTunggakan /></AdminRoute>} />
          <Route path="master/target" element={<AdminRoute><DataTarget /></AdminRoute>} />
          <Route path="master/realisasi" element={<AdminRoute><DataRealisasi /></AdminRoute>} />
          <Route path="master/kinerja" element={<AdminRoute><DataKinerja /></AdminRoute>} />
          <Route path="master/pasaran" element={<AdminRoute><DataPasaran /></AdminRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
