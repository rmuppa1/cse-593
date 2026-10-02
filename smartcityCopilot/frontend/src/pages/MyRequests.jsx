import { useEffect, useState } from 'react';
import requestService from '../services/requestService';

const STATUS_STYLES = {
  SUBMITTED: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-primary-100 text-primary-800',
  IN_PROGRESS: 'bg-accent-100 text-accent-800',
  RESOLVED: 'bg-secondary-100 text-secondary-800',
  CLOSED: 'bg-gray-200 text-gray-600',
};

function formatLabel(value) {
  return value
    ?.toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    requestService
      .getMyRequests()
      .then((data) => setRequests(data.requests || []))
      .catch(() => setError('Failed to load your requests. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Requests</h1>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && <p className="text-red-600 text-center py-12">{error}</p>}

      {!loading && !error && requests.length === 0 && (
        <p className="text-gray-500 text-center py-12">You haven&apos;t submitted any requests yet.</p>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Title', 'Category', 'Location', 'Priority', 'Status', 'Assigned To', 'Submitted'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{request.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatLabel(request.category)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{request.location}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatLabel(request.priority)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[request.status] || 'bg-gray-100 text-gray-800'}`}>
                      {formatLabel(request.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{request.assignedToName || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(request.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyRequests;
