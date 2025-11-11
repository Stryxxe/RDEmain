import { Send, FileText, FolderOpen, Clock } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';

const Sidebar = () => {
  const { url } = usePage();

  const isActive = (path) => {
    if (path === '/proponent/tracker' || path === '/proponent') {
      return url === '/proponent/tracker' || url === '/proponent' || url === '/proponent/';
    }
    return url === path;
  };

  return (
    <div className="w-64 bg-red-900 text-white fixed h-full top-5 left-0 z-30">
      <nav className="pt-20 pb-6 h-full flex flex-col">
        <ul className="space-y-2 px-4 flex-1">
          <li>
            <Link 
              href="/proponent/submit" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/proponent/submit') 
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
              href="/proponent/tracker" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/proponent/tracker') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <Clock size={20} />
              <span className="text-base">Tracker</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/proponent/resources" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/proponent/resources') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <FolderOpen size={20} />
              <span className="text-base">Resources</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
