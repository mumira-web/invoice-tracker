import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlinePlusCircle,
} from 'react-icons/hi';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard', end: true },
  { to: '/clients', icon: HiOutlineUsers, label: 'Clients' },
  { to: '/invoices', icon: HiOutlineDocumentText, label: 'Invoices' },
  { to: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-blue-400">Invoice</span>Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {user?.business_name || user?.username}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white border-r-4 border-blue-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}

        {/* Quick action */}
        <div className="px-4 mt-6">
          <button
            onClick={() => navigate('/invoices/new')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            New Invoice
          </button>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 py-2 text-sm text-slate-300 hover:text-white transition-colors w-full"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
