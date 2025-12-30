import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api.service';
import { FiDollarSign, FiTrendingUp, FiUser } from 'react-icons/fi';

function Earnings() {
  const [earnings, setEarnings] = useState({ drivers: [], totalEarnings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllEarnings();
      setEarnings(response);
    } catch (error) {
      toast.error('Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Driver Earnings</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Platform Earnings</p>
              <p className="text-3xl font-bold mt-2">GH₵ {earnings.totalEarnings.toFixed(2)}</p>
            </div>
            <FiDollarSign className="w-12 h-12 text-green-100" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Active Drivers</p>
              <p className="text-3xl font-bold mt-2">{earnings.drivers.length}</p>
            </div>
            <FiUser className="w-12 h-12 text-blue-100" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Average per Driver</p>
              <p className="text-3xl font-bold mt-2">
                GH₵ {earnings.drivers.length > 0 ? (earnings.totalEarnings / earnings.drivers.length).toFixed(2) : '0.00'}
              </p>
            </div>
            <FiTrendingUp className="w-12 h-12 text-purple-100" />
          </div>
        </div>
      </div>

      {/* Drivers Earnings Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Individual Driver Earnings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekly
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earnings.drivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {driver.firstName} {driver.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{driver.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {driver.vehicleMake && driver.vehicleModel ? (
                        `${driver.vehicleMake} ${driver.vehicleModel}`
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold">GH₵ {driver.earnings?.daily || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold">GH₵ {driver.earnings?.weekly || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-bold text-green-600">GH₵ {driver.earnings?.total || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {earnings.drivers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No earnings data available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Earnings;
