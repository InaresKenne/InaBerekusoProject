import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api.service';
import { FiUser, FiCheck, FiX, FiTrash2, FiLock, FiUnlock } from 'react-icons/fi';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.role = filter;
      
      const response = await adminService.getAllUsers(params);
      setUsers(response.users);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

 const fetchPendingUsers = async () => {
    try {
      // ✅ FIXED: Only fetch drivers and moto riders who need approval
      const response = await adminService.getAllUsers({ 
        isApproved: 'false'
      });
      // Filter to only show drivers and moto_riders (students don't need approval)
      const pendingDrivers = response.users.filter(user => 
        user.role === 'driver' || user.role === 'moto_rider'
      );
      setPendingUsers(pendingDrivers);
    } catch (error) {
      console.error('Failed to fetch pending users');
    }
  };

  const handleApprove = async (userId, isApproved) => {
    if (!isApproved) {
      setSelectedUser(users.find(u => u._id === userId) || pendingUsers.find(u => u._id === userId));
      setShowRejectModal(true);
      return;
    }
    
    try {
      await adminService.approveUser(userId, isApproved);
      toast.success('User approved successfully');
      fetchUsers();
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    try {
      await adminService.approveUser(selectedUser._id, false, rejectionReason);
      toast.success('User rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedUser(null);
      fetchUsers();
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to reject user');
    }
  };

  const handleBlock = async (userId, shouldBlock) => {
    try {
      await adminService.blockUser(userId, shouldBlock);
      toast.success(`User ${shouldBlock ? 'blocked' : 'unblocked'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error(`Failed to ${shouldBlock ? 'block' : 'unblock'} user`);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await adminService.deleteUser(selectedUser._id);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      student: 'bg-blue-100 text-blue-800',
      driver: 'bg-green-100 text-green-800',
      moto_rider: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[role] || 'bg-gray-100 text-gray-800'}`}>
        {role.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('student')}
            className={`px-4 py-2 rounded-lg ${filter === 'student' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Students
          </button>
          <button
            onClick={() => setFilter('driver')}
            className={`px-4 py-2 rounded-lg ${filter === 'driver' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Drivers
          </button>
          <button
            onClick={() => setFilter('moto_rider')}
            className={`px-4 py-2 rounded-lg ${filter === 'moto_rider' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Moto Riders
          </button>
        </div>
      </div>

      {/* Pending Approvals Section */}
      {pendingUsers.length > 0 && (
        <div className="card mb-6 bg-yellow-50 border-2 border-yellow-400">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
              {pendingUsers.length}
            </span>
            Pending Approvals
          </h3>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div key={user._id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    {user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={user.firstName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <FiUser className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleBadge(user.role)}
                      {user.role === 'student' && user.studentId && (
                        <span className="text-xs text-gray-600">
                          ID: {user.studentId}
                        </span>
                      )}
                      {(user.role === 'driver' || user.role === 'moto_rider') && user.vehicleType && user.vehicleType !== 'none' && (
                        <span className="text-xs text-gray-600">
                          {user.vehicleMake} {user.vehicleModel} • {user.licensePlate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(user._id, true)}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    title="Approve"
                  >
                    <FiCheck className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(user._id, false)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    title="Reject"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.profilePhoto ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.profilePhoto}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <FiUser className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {user.isActive ? (
                          <span className="text-green-600 text-sm">Active</span>
                        ) : (
                          <span className="text-red-600 text-sm">Blocked</span>
                        )}
                        {user.isApproved ? (
                          <span className="text-green-600 text-sm">Approved</span>
                        ) : (
                          <span className="text-yellow-600 text-sm">Pending</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(user.role === 'driver' || user.role === 'moto_rider') ? (
                        <span className="font-semibold">GH₵ {user.earnings?.total || 0}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {(user.role === 'driver' || user.role === 'moto_rider') && !user.isApproved && (
                          <>
                            <button
                              onClick={() => handleApprove(user._id, true)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <FiCheck className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleApprove(user._id, false)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {user.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleBlock(user._id, user.isActive)}
                              className={`${user.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                              title={user.isActive ? 'Block User' : 'Unblock User'}
                            >
                              {user.isActive ? <FiLock className="w-5 h-5" /> : <FiUnlock className="w-5 h-5" />}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Reject User: {selectedUser.firstName} {selectedUser.lastName}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejection. This will be sent to the user.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedUser(null);
                  setRejectionReason('');
                }}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
