import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiSend } from 'react-icons/fi';
import { reportService } from '../../services/api.service';

function ReportIncident() {
  const [formData, setFormData] = useState({
    reason: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const reasonOptions = [
    { value: 'unsafe_driving', label: 'Unsafe Driving' },
    { value: 'rude_behavior', label: 'Rude Behavior' },
    { value: 'overcharging', label: 'Overcharging' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'vehicle_condition', label: 'Poor Vehicle Condition' },
    { value: 'late_arrival', label: 'Late Arrival/No Show' },
    { value: 'cancelled_without_notice', label: 'Cancelled Without Notice' },
    { value: 'safety_concern', label: 'General Safety Concern' },
    { value: 'app_issue', label: 'App/Technical Issue' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason) {
      toast.error('Please select a reason');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    setLoading(true);
    try {
      await reportService.createReport({
        reason: formData.reason,
        description: formData.description
      });

      toast.success('Report submitted successfully. Our team will review it shortly.');
      
      // Reset form
      setFormData({
        reason: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <FiAlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Report an Issue</h2>
            <p className="text-gray-600 text-sm">Help us improve by reporting any concerns</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <FiAlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Your report will be reviewed by our team</p>
              <p>All reports are taken seriously and investigated thoroughly. You can track the status of your reports in your history.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to report? *
            </label>
            <select
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select a reason...</option>
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Please describe what happened *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="input"
              placeholder="Provide as much detail as possible to help us understand and address your concern..."
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              {formData.description.length} / 500 characters
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your report will be reviewed within 24-48 hours</li>
              <li>• You'll receive updates on the investigation status</li>
              <li>• Appropriate action will be taken if the report is verified</li>
              <li>• Your identity will be kept confidential</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormData({ reason: '', description: '' })}
              className="btn-secondary"
              disabled={loading}
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 card bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <FiAlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Need immediate help?</p>
            <p>For emergencies or urgent safety concerns, please contact campus security immediately or call emergency services.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportIncident;
