import { Search, FileText, FolderOpen, User, Bell } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/proponent/tracker' || path === '/proponent') {
      return location.pathname === '/proponent/tracker' || location.pathname === '/proponent';
    }
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-red-900 text-white fixed h-full top-5 left-0 z-30">
      <nav className="pt-20 pb-6 h-full flex flex-col">
        <ul className="space-y-2 px-4 flex-1">
          <li>
            <Link 
              to="/proponent/tracker" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/proponent/tracker') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <Search size={20} />
              <span className="text-sm">Submit</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/proponent/projects" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/proponent/projects') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <FileText size={20} />
              <span className="text-sm">Projects</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/proponent/notification" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/proponent/notification') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <Bell size={20} />
              <span className="text-sm">Notifications</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/proponent/resources" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/proponent/resources') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <FolderOpen size={20} />
              <span className="text-sm">Resources</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/proponent/account" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/proponent/account') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <User size={20} />
              <span className="text-sm">Account</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
