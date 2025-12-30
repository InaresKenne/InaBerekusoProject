import { FiUsers, FiTruck, FiCheckCircle, FiXCircle, FiDollarSign } from 'react-icons/fi';

function Statistics({ statistics, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const stats = [
    {
      label: 'Total Users',
      value: statistics.users.total,
      icon: FiUsers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Active Drivers',
      value: statistics.users.activeDrivers,
      icon: FiTruck,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Completed Trips',
      value: statistics.trips.completed,
      icon: FiCheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      label: 'Active Trips',
      value: statistics.trips.active,
      icon: FiTruck,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Pending Approvals',
      value: statistics.users.pendingApprovals,
      icon: FiXCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      label: 'Total Earnings',
      value: `GH₵ ${statistics.earnings.total}`,
      icon: FiDollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Platform Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-4 rounded-lg`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">Total Students</span>
            <span className="font-semibold">{statistics.users.students}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">Total Drivers</span>
            <span className="font-semibold">{statistics.users.drivers}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700">Cancelled Trips</span>
            <span className="font-semibold">{statistics.trips.cancelled}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-700">Pending Reports</span>
            <span className="font-semibold text-orange-600">{statistics.reports.pending}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
