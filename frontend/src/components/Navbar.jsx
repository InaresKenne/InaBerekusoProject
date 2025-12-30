import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { FiHome, FiUser, FiLogOut, FiDollarSign, FiClock, FiUsers, FiAlertCircle, FiBell, FiMapPin } from 'react-icons/fi';

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavLinks = () => {
    switch (user?.role) {
      case 'student':
        return [
          { to: '/student', icon: FiHome, label: 'Home' },
          { to: '/student/history', icon: FiClock, label: 'History' },
          { to: '/student/notifications', icon: FiBell, label: 'Notifications' },
          { to: '/student/report', icon: FiAlertCircle, label: 'Report Issue' },
          { to: '/student/profile', icon: FiUser, label: 'Profile' }
        ];
      case 'driver':
      case 'moto_rider':
        return [
          { to: '/driver', icon: FiHome, label: 'Home' },
          { to: '/driver/earnings', icon: FiDollarSign, label: 'Earnings' },
          { to: '/driver/history', icon: FiClock, label: 'History' },
          { to: '/driver/notifications', icon: FiBell, label: 'Notifications' },
          { to: '/driver/report', icon: FiAlertCircle, label: 'Report Issue' },
          { to: '/driver/profile', icon: FiUser, label: 'Profile' }
        ];
      case 'admin':
        return [
          { to: '/admin', icon: FiHome, label: 'Dashboard' },
          { to: '/admin/users', icon: FiUsers, label: 'Users' },
          { to: '/admin/trips', icon: FiMapPin, label: 'Trips' },
          { to: '/admin/earnings', icon: FiDollarSign, label: 'Earnings' },
          { to: '/admin/reports', icon: FiAlertCircle, label: 'Reports' },
          { to: '/admin/announcements', icon: FiBell, label: 'Announcements' }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-2xl font-bold text-primary">
              InaBerekuso
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors"
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-danger transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          <div className="md:hidden">
            <button className="text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
