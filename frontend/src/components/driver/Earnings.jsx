import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { driverService } from '../../services/api.service';
import { FiDollarSign, FiTrendingUp } from 'react-icons/fi';

function Earnings() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await driverService.getEarnings();
      setEarnings(response.earnings);
    } catch (error) {
      toast.error('Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Earnings</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600">Daily Earnings</h3>
            <FiDollarSign className="w-6 h-6 text-primary" />
          </div>
          <p className="text-3xl font-bold text-primary">
            GH₵ {earnings?.daily || 0}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600">Weekly Earnings</h3>
            <FiTrendingUp className="w-6 h-6 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-secondary">
            GH₵ {earnings?.weekly || 0}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600">Total Earnings</h3>
            <FiDollarSign className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">
            GH₵ {earnings?.total || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Earnings;
