import { Send, FileText, FolderOpen, User } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/tracker' || path === '/') {
      return location.pathname === '/tracker' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  return (
    <div className="w-64 bg-red-900 text-white fixed h-full top-5 left-0 z-30">
      <nav className="pt-20 pb-6 h-full flex flex-col">
        <ul className="space-y-2 px-4 flex-1">
          <li>
            <Link 
              to="/tracker" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/tracker') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <Send size={20} />
              <span className="text-base">Submit</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/projects" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/projects') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <FileText size={20} />
              <span className="text-base">Projects</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/resources" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/resources') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <FolderOpen size={20} />
              <span className="text-base">Resources</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/account" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/account') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <User size={20} />
              <span className="text-base">Account</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;