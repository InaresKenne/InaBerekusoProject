import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminService } from '../services/api.service';
import Statistics from '../components/admin/Statistics';
import UserManagement from '../components/admin/UserManagement';
import Reports from '../components/admin/Reports';
import Announcements from '../components/admin/Announcements';
import Earnings from '../components/admin/Earnings';
import Trips from '../components/admin/Trips';
import Navbar from '../components/Navbar';

function AdminDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await adminService.getStatistics();
      setStatistics(response.statistics);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

        <Routes>
          <Route
            path="/"
            element={<Statistics statistics={statistics} loading={loading} />}
          />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/announcements" element={<Announcements />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminDashboard;
