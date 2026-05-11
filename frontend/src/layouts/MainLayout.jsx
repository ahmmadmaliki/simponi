import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Activity, BarChart2, LogOut, Users, Lightbulb, Menu, Database, ChevronDown, ChevronRight, Target, FileSpreadsheet, Map, FileWarning } from 'lucide-react';
import logoProvinsi from '../assets/Logo Provinsi.png';

export default function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const location = useLocation();
  const userRole = localStorage.getItem('role');

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={24} /> },
    { name: 'Kinerja Kegiatan', path: '/kinerja', icon: <Activity size={24} /> },
    { name: 'Evaluasi', path: '/evaluasi', icon: <BarChart2 size={24} /> },
    { name: 'Rekomendasi Tindakan', path: '/rekomendasi', icon: <Lightbulb size={24} /> }
  ];

  const masterDataItems = userRole === 'admin' ? [
    { name: 'Manajemen User', path: '/master/users', icon: <Users size={20} /> },
    { name: 'Data Target Opsen', path: '/master/target', icon: <Target size={20} /> },
    { name: 'Data Realisasi Opsen', path: '/master/realisasi', icon: <FileSpreadsheet size={20} /> },
    { name: 'Data Panen', path: '/master/panen', icon: <Map size={20} /> },
    { name: 'Data Tunggakan', path: '/master/tunggakan', icon: <FileWarning size={20} /> },
  ] : [];

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 bg-primary-800 text-white flex flex-col shadow-xl z-30 absolute md:relative h-full transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
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
                    onClick={() => setIsMobileMenuOpen(false)}
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

            {userRole === 'admin' && (
              <li className="pt-2">
                <button
                  onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-[17px] font-medium transition-colors ${
                    location.pathname.startsWith('/master') ? 'bg-primary-900 text-white' : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database size={24} />
                    <span>Master Data</span>
                  </div>
                  {isMasterDataOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                
                {isMasterDataOpen && (
                  <ul className="mt-2 space-y-1 px-4 border-l-2 border-primary-700 ml-6">
                    {masterDataItems.map((subItem) => {
                      const isSubActive = location.pathname.startsWith(subItem.path);
                      return (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-medium transition-colors ${isSubActive
                              ? 'bg-primary-50 text-primary-800 shadow-sm'
                              : 'text-primary-200 hover:text-white hover:bg-primary-700/50'
                              }`}
                          >
                            {subItem.icon}
                            {subItem.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            )}
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-20 px-4 md:px-8 flex items-center justify-between shadow-sm relative z-10">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 truncate max-w-[200px] md:max-w-none">
              {navItems.concat(masterDataItems).find(i => location.pathname.startsWith(i.path))?.name || 'SIMPONI'}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            <div className="flex flex-col items-end hidden sm:flex">
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

        <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
