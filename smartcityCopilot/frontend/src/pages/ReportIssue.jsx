import { useState } from 'react';
import { Link } from 'react-router-dom';
import requestService from '../services/requestService';

const CATEGORIES = [
  { value: 'BROKEN_STREETLIGHT', label: 'Broken Streetlight', icon: '💡' },
  { value: 'POTHOLE', label: 'Pothole', icon: '🕳️' },
  { value: 'GRAFFITI', label: 'Graffiti', icon: '🎨' },
  { value: 'WATER_LEAK', label: 'Water Leak', icon: '💧' },
  { value: 'NOISE_COMPLAINT', label: 'Noise Complaint', icon: '🔊' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const STEPS = ['Category', 'Details', 'Priority', 'Review'];

const INITIAL_FORM = {
  category: '',
  title: '',
  description: '',
  location: '',
  priority: 'MEDIUM',
};

function ReportIssue() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [requestId, setRequestId] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateStep() {
    const newErrors = {};
    if (step === 0 && !form.category) newErrors.category = 'Please select a category';
    if (step === 1) {
      if (!form.title.trim()) newErrors.title = 'Title is required';
      if (!form.description.trim()) newErrors.description = 'Description is required';
      if (!form.location.trim()) newErrors.location = 'Location is required';
    }
    if (step === 2 && !form.priority) newErrors.priority = 'Please select a priority';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function goNext() {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const data = await requestService.createRequest(form);
      setRequestId(data.request?.id);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  if (requestId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900">Request Submitted!</h1>
        <p className="mt-2 text-gray-600">
          Your request ID is <span className="font-mono font-semibold">{requestId}</span>
        </p>
        <Link
          to="/requests/my"
          className="inline-block mt-6 bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700"
        >
          View My Requests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Report an Issue</h1>

      {/* Progress indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, index) => (
          <div key={label} className="flex-1 flex items-center">
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold ${
                index <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
            <span className="ml-2 text-sm text-gray-600 hidden sm:inline">{label}</span>
            {index < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${index < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Step 1: Category */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => update('category', cat.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium ${
                    form.category === cat.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
            {errors.category && <p className="text-red-600 text-sm mt-2">{errors.category}</p>}
          </div>
        )}

        {/* Step 2: Details */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Issue Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Priority */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Priority</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => update('priority', p.value)}
                  className={`py-3 rounded-md border text-sm font-medium ${
                    form.priority === p.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {errors.priority && <p className="text-red-600 text-sm mt-2">{errors.priority}</p>}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Review Your Report</h2>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Category:</span>{' '}
              {CATEGORIES.find((c) => c.value === form.category)?.label}
            </p>
            <p className="text-sm text-gray-700"><span className="font-medium">Title:</span> {form.title}</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Description:</span> {form.description}</p>
            <p className="text-sm text-gray-700"><span className="font-medium">Location:</span> {form.location}</p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Priority:</span>{' '}
              {PRIORITIES.find((p) => p.value === form.priority)?.label}
            </p>
            {submitError && <p className="text-red-600 text-sm">{submitError}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="px-4 py-2 rounded-md border text-sm disabled:opacity-50"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              className="px-6 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportIssue;
