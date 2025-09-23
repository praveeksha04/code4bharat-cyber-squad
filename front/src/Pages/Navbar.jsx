import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  
  const linkClass = "px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden";
  const activeLink = "bg-white text-blue-600 shadow-lg";
  const inactiveLink = "text-white hover:bg-white/15 hover:text-white";
  
  const isActive = (path) => location.pathname === path;
  
  const navItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/upload", label: "Upload", icon: "📄" },
    { path: "/lecture", label: "Live Lecture", icon: "🎤" },
    { path: "/learning", label: "Learning", icon: "🧠" }
  ];
  
  return (
    <nav className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-5">
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 hover:scale-105 transition-transform duration-200">
            {/* <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <p className="text-xs text-blue-100">AI-Powered Learning</p>
            </div> */}
            
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Accessibility Hub
              </h1>
            </div>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex gap-2">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`${linkClass} ${isActive(item.path) ? activeLink : inactiveLink} group`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </div>
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}