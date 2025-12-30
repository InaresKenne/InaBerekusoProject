import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { toast } from 'react-toastify';
import { authService, driverService } from '../services/api.service';
import { FiUser, FiMail, FiPhone, FiLock, FiCamera, FiTruck } from 'react-icons/fi';

function Profile() {
  const { user, updateUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await authService.updateProfile(formData);
      updateUser(response.user);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await driverService.uploadProfilePhoto(file);
      updateUser({ ...user, profilePhoto: response.profilePhoto });
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error('Failed to upload photo');
    }
  };

  const handleVehiclePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await driverService.uploadVehiclePhoto(formData);
      updateUser({ ...user, vehiclePhoto: response.vehiclePhoto });
      toast.success('Vehicle photo updated');
    } catch (error) {
      toast.error('Failed to upload vehicle photo');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>

      <div className="card mb-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.firstName}
                  className="w-32 h-32 object-cover"
                />
              ) : (
                <FiUser className="w-16 h-16 text-gray-600" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-blue-700">
              <FiCamera className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Vehicle Photo for Drivers/Riders */}
        {(user?.role === 'driver' || user?.role === 'moto_rider') && (
          <div className="flex flex-col items-center mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Photo</h3>
            <div className="relative">
              <div className="w-56 h-40 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                {user?.vehiclePhoto ? (
                  <img
                    src={user.vehiclePhoto}
                    alt="Vehicle"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center">
                    <FiTruck className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No vehicle photo</p>
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 shadow-lg">
                <FiCamera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleVehiclePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!editing}
                className="input-field disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!editing}
                className="input-field disabled:bg-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiMail className="inline w-4 h-4 mr-1" />
              Email
            </label>
            <input
              type="email"
              value={user?.email}
              disabled
              className="input-field bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiPhone className="inline w-4 h-4 mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={!editing}
              className="input-field disabled:bg-gray-100"
            />
          </div>

          <div className="flex gap-4">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Save Changes
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full btn-primary"
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          <FiLock className="inline w-5 h-5 mr-2" />
          Change Password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="input-field"
              required
            />
          </div>

          <button type="submit" className="w-full btn-primary">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
