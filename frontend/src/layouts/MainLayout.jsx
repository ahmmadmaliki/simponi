import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, Activity, BarChart2, LogOut, Users, Lightbulb } from 'lucide-react';
import logoProvinsi from '../assets/Logo Provinsi.png';

export default function MainLayout() {
  const location = useLocation();
  const userRole = localStorage.getItem('role');

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={24} /> },
    { name: 'Kinerja Kegiatan', path: '/kinerja', icon: <Activity size={24} /> },
    { name: 'Evaluasi', path: '/evaluasi', icon: <BarChart2 size={24} /> },
    { name: 'Rekomendasi Tindakan', path: '/rekomendasi', icon: <Lightbulb size={24} /> },
    ...(userRole === 'admin' ? [
      { name: 'Upload Data', path: '/upload', icon: <Upload size={24} /> },
      { name: 'Manajemen User', path: '/users', icon: <Users size={24} /> }
    ] : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-primary-800 text-white flex flex-col shadow-xl z-10 hidden md:flex">
        <div className="p-6 bg-primary-900 border-b border-primary-700 flex items-center gap-4">
          <img src={logoProvinsi} alt="Logo" className="w-12 h-14 object-contain drop-shadow-md" />
          <div>
            <p className="text-primary-200 text-xs font-bold uppercase tracking-wider mb-0.5">UPT PPD Magetan</p>
            <h1 className="text-3xl font-black tracking-tight text-white drop-shadow">SIMPONI</h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-[17px] font-medium transition-colors ${isActive
                      ? 'bg-white text-primary-800 shadow-md'
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                      }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-primary-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-primary-100 hover:bg-red-600 hover:text-white transition-colors text-[17px] font-medium"
          >
            <LogOut size={24} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header for mobile - abbreviated for now */}
        <header className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 hidden md:block">
            {navItems.find(i => location.pathname.startsWith(i.path))?.name || 'SIMPONI'}
          </h2>
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex flex-col items-end">
              <span className="text-[17px] font-semibold text-slate-700 capitalize">
                {userRole === 'admin' ? 'Admin Pusat' : userRole}
              </span>
              <span className="text-[14px] text-slate-500">Online</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl uppercase">
              {userRole ? userRole.substring(0, 2) : 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
