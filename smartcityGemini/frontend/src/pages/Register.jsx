import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = [
  'PUBLIC_WORKS',
  'TRANSPORTATION',
  'PARKS_RECREATION',
  'SANITATION',
  'PUBLIC_SAFETY',
  'HEALTH_SERVICES',
  'HOUSING',
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'CITIZEN',
    department: '',
    agreeTerms: false,
  });

  const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    return score; // max 5
  };

  const passwordScore = calculatePasswordStrength(formData.password);

  const getStrengthMeta = (score) => {
    switch (score) {
      case 0:
      case 1:
        return { label: 'Very Weak', color: 'bg-red-500', width: '20%' };
      case 2:
        return { label: 'Weak', color: 'bg-orange-500', width: '40%' };
      case 3:
        return { label: 'Fair', color: 'bg-yellow-500', width: '60%' };
      case 4:
        return { label: 'Good', color: 'bg-blue-500', width: '80%' };
      case 5:
        return { label: 'Strong', color: 'bg-green-500', width: '100%' };
      default:
        return { label: 'None', color: 'bg-gray-200', width: '0%' };
    }
  };

  const strengthMeta = getStrengthMeta(passwordScore);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please provide your full name');
      return;
    }

    if (!formData.email.trim()) {
      setFormError('Please provide a valid email address');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.role === 'DEPT_MANAGER' && !formData.department) {
      setFormError('Department managers must select an assigned department');
      return;
    }

    if (!formData.agreeTerms) {
      setFormError('Please accept the Terms of Service to continue');
      return;
    }

        try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'DEPT_MANAGER' && formData.department) {
        payload.department = formData.department;
      }

      const res = await register(payload);
      if (res?.pendingApproval) {
        setSuccessMessage(
          'Your account request has been registered! Because administrator approval is required for all new citizens and department managers, your account will be activated once approved by the administrator.'
        );
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.extractedMessage ||
        'Registration failed. Please check your information and try again.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Join SmartCity Hub to register for events and report community issues
          </p>
        </div>

                {/* Success Alert for Pending Approval */}
        {successMessage ? (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Pending Admin Approval</h3>
            <p className="text-sm text-gray-600 leading-relaxed bg-amber-50 p-4 rounded-xl border border-amber-200">
              {successMessage}
            </p>
            <Link
              to="/login"
              className="inline-block w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {/* Error Alert */}
            {formError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start space-x-2">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>

              {/* Password with Strength Indicator */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />

                {/* Password Strength Bar */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Strength</span>
                      <span className="font-semibold">{strengthMeta.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strengthMeta.color} transition-all duration-300`}
                        style={{ width: strengthMeta.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                />
              </div>

              {/* Role Selection */}
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Account Type *
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center space-x-2 p-3 border-2 rounded-xl cursor-pointer text-sm transition-all ${
                      formData.role === 'CITIZEN'
                        ? 'border-primary-600 bg-primary-50/50 text-primary-900 font-semibold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="CITIZEN"
                      checked={formData.role === 'CITIZEN'}
                      onChange={handleChange}
                      className="text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <span>Citizen</span>
                  </label>

                  <label
                    className={`flex items-center space-x-2 p-3 border-2 rounded-xl cursor-pointer text-sm transition-all ${
                      formData.role === 'DEPT_MANAGER'
                        ? 'border-primary-600 bg-primary-50/50 text-primary-900 font-semibold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="DEPT_MANAGER"
                      checked={formData.role === 'DEPT_MANAGER'}
                      onChange={handleChange}
                      className="text-primary-600 focus:ring-primary-500 h-4 w-4"
                    />
                    <span>Dept Manager</span>
                  </label>
                </div>
              </div>

              {/* Department Dropdown (conditional) */}
              {formData.role === 'DEPT_MANAGER' && (
                <div className="animate-in fade-in duration-200">
                  <label
                    htmlFor="department"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Select Department *
                  </label>
                  <select
                    id="department"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                  >
                    <option value="">-- Choose Department --</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Terms of Service Checkbox */}
              <div className="flex items-start">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  required
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="h-4 w-4 mt-0.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="agreeTerms" className="ml-2 block text-xs text-gray-600 leading-relaxed">
                  I agree to the{' '}
                  <a href="#terms" className="text-primary-600 hover:underline font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" className="text-primary-600 hover:underline font-medium">
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>

              {/* Register Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>

            {/* Footer link to Login */}
            <div className="text-center pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Log in here
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
