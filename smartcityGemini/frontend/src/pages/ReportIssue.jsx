import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createRequest } from '../services/requestService';

const CATEGORIES = [
  {
    id: 'POTHOLE',
    label: 'Pothole & Roads',
    description: 'Potholes, broken sidewalks, road damage, and bridges',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    ),
  },
  {
    id: 'BROKEN_STREETLIGHT',
    label: 'Broken Streetlight',
    description: 'Dark streets, flickering or broken streetlights and signals',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
  {
    id: 'GRAFFITI',
    label: 'Graffiti & Sanitation',
    description: 'Vandalism, public property graffiti, illegal dumping',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    ),
  },
  {
    id: 'WATER_LEAK',
    label: 'Water Leak',
    description: 'Burst pipes, storm drain blockages, hydrant leaks',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    ),
  },
  {
    id: 'NOISE_COMPLAINT',
    label: 'Noise Complaint',
    description: 'Excessive construction noise, disturbance, commercial sound',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    ),
  },
];

const PRIORITIES = [
  {
    id: 'LOW',
    label: 'Low',
    description: 'Minor inconvenience, no immediate impact on safety',
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  {
    id: 'MEDIUM',
    label: 'Medium',
    description: 'Standard issue affecting daily neighborhood convenience',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    id: 'HIGH',
    label: 'High',
    description: 'Significant disruption or property damage risk',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  {
    id: 'URGENT',
    label: 'Urgent',
    description: 'Immediate danger to public safety or major hazard',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
  },
];

const ReportIssue = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    priority: 'MEDIUM',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.category) {
        newErrors.category = 'Please select a category';
      }
    } else if (currentStep === 2) {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      } else if (formData.title.trim().length < 5) {
        newErrors.title = 'Title must be at least 5 characters';
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (formData.description.trim().length < 10) {
        newErrors.description = 'Description must be at least 10 characters';
      }

      if (!formData.location.trim()) {
        newErrors.location = 'Location or address is required';
      }
    } else if (currentStep === 3) {
      if (!formData.priority) {
        newErrors.priority = 'Please select a priority level';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await createRequest({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim(),
        priority: formData.priority,
      });

      setSubmissionResult(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.extractedMessage ||
        'Failed to submit service request. Please try again.';
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      title: '',
      description: '',
      location: '',
      priority: 'MEDIUM',
    });
    setErrors({});
    setSubmissionResult(null);
    setStep(1);
  };

  // Success Screen
  if (submissionResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Request Submitted Successfully!
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Thank you for helping keep our city clean, safe, and functional. City staff will review and dispatch the appropriate department.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Request ID:</span>
              <span className="font-mono font-bold text-primary-700">
                #{submissionResult.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Status:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                {submissionResult.status || 'SUBMITTED'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Category:</span>
              <span className="font-semibold text-gray-800">
                {submissionResult.category}
              </span>
            </div>
          </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/my-requests"
              className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg text-sm transition-colors shadow-sm text-center"
            >
              View My Requests
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Submit Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Report a Community Issue
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Provide issue details so our department managers can take fast action.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary-600 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {[
            { num: 1, title: 'Category' },
            { num: 2, title: 'Details' },
            { num: 3, title: 'Priority' },
            { num: 4, title: 'Review' },
          ].map((item) => (
            <div key={item.num} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step >= item.num
                    ? 'bg-primary-600 text-white ring-4 ring-primary-50'
                    : 'bg-white border-2 border-gray-300 text-gray-500'
                }`}
              >
                {step > item.num ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  item.num
                )}
              </div>
              <span className="text-xs font-medium text-gray-600 mt-1 hidden sm:block">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Container Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Step 1: Select Category
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose the category that best describes the issue.
            </p>

            {errors.category && (
              <p className="text-xs text-red-600 font-medium">{errors.category}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => {
                const isSelected = formData.category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setFormData({ ...formData, category: cat.id });
                      setErrors((prev) => ({ ...prev, category: '' }));
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-4 ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-primary-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {cat.icon}
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Step 2: Issue Details
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Provide thorough information to expedite inspection and repairs.
            </p>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-800 mb-1"
              >
                Issue Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Deep pothole near intersection of 4th & Main"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.title && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.title}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-semibold text-gray-800 mb-1"
              >
                Exact Location or Street Address *
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="e.g., 124 Elm Street or Corner of Park Ave & 5th St"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.location && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.location}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-800 mb-1"
              >
                Detailed Description *
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the severity, when it occurred, or any potential dangers..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.description && (
                <p className="text-xs text-red-600 mt-1 font-medium">{errors.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Priority */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Step 3: Priority Level
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Select an estimated urgency to help route emergency tickets.
            </p>

            {errors.priority && (
              <p className="text-xs text-red-600 font-medium">{errors.priority}</p>
            )}

            <div className="space-y-3">
              {PRIORITIES.map((p) => {
                const isSelected = formData.priority === p.id;
                return (
                  <label
                    key={p.id}
                    onClick={() => {
                      setFormData({ ...formData, priority: p.id });
                      setErrors((prev) => ({ ...prev, priority: '' }));
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50/40 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="priority"
                        value={p.id}
                        checked={isSelected}
                        onChange={() => setFormData({ ...formData, priority: p.id })}
                        className="text-primary-600 focus:ring-primary-500 h-4 w-4 border-gray-300"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-900">
                            {p.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${p.badgeClass}`}
                          >
                            {p.id}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Review and Submit */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Step 4: Review and Submit
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Please check your information before submitting to city dispatch.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Category</span>
                <span className="font-semibold text-gray-900">
                  {CATEGORIES.find((c) => c.id === formData.category)?.label ||
                    formData.category}
                </span>
              </div>

              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Title</span>
                <span className="font-semibold text-gray-900 text-right max-w-xs truncate">
                  {formData.title}
                </span>
              </div>

              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Location</span>
                <span className="font-semibold text-gray-900 text-right max-w-xs truncate">
                  {formData.location}
                </span>
              </div>

              <div className="flex justify-between border-b border-gray-200 pb-2">
                <span className="text-gray-500">Priority</span>
                <span className="font-semibold text-gray-900">
                  {formData.priority}
                </span>
              </div>

              <div>
                <span className="text-gray-500 block mb-1">Description</span>
                <p className="text-gray-800 bg-white p-3 rounded-lg border border-gray-200 text-xs sm:text-sm whitespace-pre-wrap">
                  {formData.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-5 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-accent-600 hover:bg-accent-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-colors flex items-center space-x-2"
            >
              {submitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportIssue;
