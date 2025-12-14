import { Send, FileText, FolderOpen, Clock, RefreshCcw } from "lucide-react";
// Upload icon not used - Submit Report hidden
import { Link, usePage } from "@inertiajs/react";

const Sidebar = () => {
    const { url } = usePage();

    const isActive = (path) => {
        // For tracker, only match exact path or paths starting with /proponent/tracker/
        if (path === "/proponent/tracker") {
            return (
                url === "/proponent/tracker" ||
                url.startsWith("/proponent/tracker/")
            );
        }
        // For submit, match /proponent, /proponent/, or /proponent/submit
        if (path === "/proponent/submit") {
            return (
                url === "/proponent/submit" ||
                url === "/proponent" ||
                url === "/proponent/"
            );
        }
        // For revision, match exact path or paths starting with /proponent/revision/
        if (path === "/proponent/revision") {
            return (
                url === "/proponent/revision" ||
                url.startsWith("/proponent/revision/")
            );
        }
        // For submit-report, match exact path
        if (path === "/proponent/submit-report") {
            return (
                url === "/proponent/submit-report" ||
                url.startsWith("/proponent/submit-report/")
            );
        }
        // For other paths, match exact path or paths starting with path + /
        return url === path || url.startsWith(path + "/");
    };

    return (
        <div
            className="w-64 bg-red-900 text-white fixed h-full top-0 left-0 z-30"
            style={{ paddingTop: "72px" }}
        >
            <nav className="pb-6 h-full flex flex-col overflow-y-auto">
                <ul className="space-y-2 px-4 flex-1">
                    <li>
                        <Link
                            href="/proponent/submit"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                                isActive("/proponent/submit")
                                    ? "bg-white text-red-800 font-semibold"
                                    : "text-white hover:bg-red-700"
                            }`}
                        >
                            <Send size={20} />
                            <span className="text-base">Submit</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/proponent/tracker"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                                isActive("/proponent/tracker")
                                    ? "bg-white text-red-800 font-semibold"
                                    : "text-white hover:bg-red-700"
                            }`}
                        >
                            <Clock size={20} />
                            <span className="text-base">Tracker</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/proponent/revision"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                                isActive("/proponent/revision")
                                    ? "bg-white text-red-800 font-semibold"
                                    : "text-white hover:bg-red-700"
                            }`}
                        >
                            <RefreshCcw size={20} />
                            <span className="text-base">For Revision</span>
                        </Link>
                    </li>
                    {/* Submit Report - Hidden - not needed yet */}
                    {/* <li>
            <Link 
              href="/proponent/submit-report" 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                isActive('/proponent/submit-report') 
                  ? 'bg-white text-red-800 font-semibold' 
                  : 'text-white hover:bg-red-700'
              }`}
            >
              <Upload size={20} />
              <span className="text-base">Submit Report</span>
            </Link>
          </li> */}
                    <li>
                        <Link
                            href="/proponent/resources"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                                isActive("/proponent/resources")
                                    ? "bg-white text-red-800 font-semibold"
                                    : "text-white hover:bg-red-700"
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
