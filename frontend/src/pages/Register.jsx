import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import { authService } from '../services/api.service';

function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    studentId: '',
    vehicleType: 'car',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    licensePlate: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [vehiclePreview, setVehiclePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhoto(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleVehiclePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehiclePhoto(file);
      setVehiclePreview(URL.createObjectURL(file));
    }
  };

  const validateStep1 = () => {
    if (formData.role === 'student' && !formData.email.endsWith('@ashesi.edu.gh')) {
      toast.error('Students must use their Ashesi email address');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] && key !== 'confirmPassword') {
          submitData.append(key, formData[key]);
        }
      });

      if (profilePhoto) {
        submitData.append('profilePhoto', profilePhoto);
      }
      if (vehiclePhoto && (formData.role === 'driver' || formData.role === 'moto_rider')) {
        submitData.append('vehiclePhoto', vehiclePhoto);
      }

      const response = await authService.register(submitData);
      
      if (response.pendingApproval) {
        toast.warning(response.message || 'Your account is pending admin approval');
        setAuth(response.user, response.token);
        navigate('/dashboard');
      } else {
        toast.success(response.message || 'Registration successful!');
        setAuth(response.user, response.token);
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-600 mt-2">Join InaBerekuso</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="student">Student</option>
                <option value="driver">Driver</option>
                <option value="moto_rider">Moto/Okada Rider</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder={formData.role === 'student' ? 'your.email@ashesi.edu.gh' : 'your.email@example.com'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="w-full btn-primary">
              Next
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="input-field"
                  required
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
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="input-field"
                placeholder="+233 XX XXX XXXX"
                required
              />
            </div>

            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="12345678"
                  required
                />
              </div>
            )}

            {(formData.role === 'driver' || formData.role === 'moto_rider') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Make
                  </label>
                  <input
                    type="text"
                    name="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Model
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Corolla"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Color
                  </label>
                  <input
                    type="text"
                    name="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="GR-1234-21"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoChange}
                className="input-field"
              />
              {profilePreview && (
                <img src={profilePreview} alt="Profile Preview" className="mt-2 w-24 h-24 object-cover rounded-full" />
              )}
            </div>

            {(formData.role === 'driver' || formData.role === 'moto_rider') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleVehiclePhotoChange}
                  className="input-field"
                />
                {vehiclePreview && (
                  <img src={vehiclePreview} alt="Vehicle Preview" className="mt-2 w-48 h-36 object-contain bg-gray-100 rounded-lg border-2 border-gray-200 p-2" />
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 btn-outline"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;