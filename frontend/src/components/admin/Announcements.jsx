import { useState } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api.service';
import { FiSend, FiUsers, FiBriefcase, FiTruck } from 'react-icons/fi';

function Announcements() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'all'
  });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      const response = await adminService.sendAnnouncement(formData);
      toast.success(response.message || 'Announcement sent successfully!');
      
      // Reset form
      setFormData({
        title: '',
        message: '',
        targetRole: 'all'
      });
    } catch (error) {
      toast.error('Failed to send announcement');
      console.error('Error sending announcement:', error);
    } finally {
      setSending(false);
    }
  };

  const targetOptions = [
    { value: 'all', label: 'All Users', icon: FiUsers, color: 'text-gray-600' },
    { value: 'student', label: 'Students Only', icon: FiUsers, color: 'text-blue-600' },
    { value: 'driver', label: 'Drivers Only', icon: FiBriefcase, color: 'text-green-600' },
    { value: 'moto_rider', label: 'Moto Riders Only', icon: FiTruck, color: 'text-yellow-600' }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Send Announcement</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcement Form */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Announcement</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter announcement title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="6"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your announcement message..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.message.length} characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {targetOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.targetRole === option.value
                          ? 'border-primary bg-primary bg-opacity-5'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="targetRole"
                        value={option.value}
                        checked={formData.targetRole === option.value}
                        onChange={handleChange}
                        className="mr-3"
                      />
                      <Icon className={`w-5 h-5 mr-2 ${option.color}`} />
                      <span className="font-medium text-gray-800">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <FiSend className="w-5 h-5" />
                  Send Announcement
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">Admin Announcement</span>
                    <span className="text-xs text-gray-500">Just now</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    To: {targetOptions.find(opt => opt.value === formData.targetRole)?.label}
                  </div>
                </div>
              </div>

              {formData.title ? (
                <>
                  <h4 className="font-bold text-gray-900 text-lg mb-2">
                    {formData.title}
                  </h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {formData.message || 'Your message will appear here...'}
                  </p>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FiSend className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Start typing to see preview</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This announcement will be sent as an in-app notification to all users in the selected audience. They will see it in their notifications section.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Keep announcements clear and concise for better engagement</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Use "All Users" for platform-wide updates like maintenance or new features</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Target specific roles for role-specific information (e.g., driver bonuses)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1">•</span>
            <span>Important announcements should be followed up with email for critical updates</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Announcements;
