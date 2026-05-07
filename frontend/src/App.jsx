import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadData from './pages/UploadData';
import KinerjaKegiatan from './pages/KinerjaKegiatan';
import Evaluasi from './pages/Evaluasi';
import UserManagement from './pages/UserManagement';

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
          <Route path="upload" element={<AdminRoute><UploadData /></AdminRoute>} />
          <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="kinerja" element={<KinerjaKegiatan />} />
          <Route path="evaluasi" element={<Evaluasi />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
