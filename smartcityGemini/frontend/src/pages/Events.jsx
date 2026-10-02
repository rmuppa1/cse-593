import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEvents, registerForEvent } from '../services/eventService';
import api from '../services/api';
import EventCard from '../components/Events/EventCard';
import EventFilters from '../components/Events/EventFilters';
import { useAuth } from '../context/AuthContext';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
    location: '',
    isFree: '',
    sortBy: 'date',
  });

    // Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [modalFeedback, setModalFeedback] = useState({ type: '', text: '' });

  // Flag Modal State
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagTarget, setFlagTarget] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [isFlagging, setIsFlagging] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      if (searchTerm.trim()) {
        params.location = searchTerm.trim();
      }

      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === undefined || params[key] === null) {
          delete params[key];
        }
      });

      const response = await getAllEvents(params);
      const data = response.data || {};

      setEvents(data.events || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      }));
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.extractedMessage || err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterChange = (newFilters) => {
    setFilters({
      category: newFilters.category,
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
      location: newFilters.location,
      isFree: newFilters.isFree,
      sortBy: newFilters.sortBy,
    });
    setPagination((prev) => ({ ...prev, page: newFilters.page || 1 }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

    const handleOpenFlagModal = (event) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setFlagTarget(event);
    setFlagReason('');
    setFlagModalOpen(true);
  };

  const handleSubmitFlag = async (e) => {
    e.preventDefault();
    if (!flagTarget || !flagReason.trim()) return;

    try {
      setIsFlagging(true);
      await api.post('/flags', {
        itemType: 'EVENT',
        itemId: flagTarget.id,
        itemTitle: flagTarget.title,
        reason: flagReason.trim(),
      });
      alert('Report submitted to administrator for moderation review.');
      setFlagModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit flag');
    } finally {
      setIsFlagging(false);
    }
  };

  const openRegisterModal = (event) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedEvent(event);
    setModalFeedback({ type: '', text: '' });
  };

  const closeRegisterModal = () => {
    setSelectedEvent(null);
    setModalFeedback({ type: '', text: '' });
  };

  const handleConfirmRegister = async () => {
    if (!selectedEvent) return;

    try {
      setIsRegistering(true);
      setModalFeedback({ type: '', text: '' });

      await registerForEvent(selectedEvent.id);

      setModalFeedback({
        type: 'success',
        text: 'Registration confirmed! See you at the event.',
      });

      // Update in event list
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === selectedEvent.id
            ? { ...ev, registeredCount: (ev.registeredCount || 0) + 1 }
            : ev
        )
      );

      setTimeout(() => {
        closeRegisterModal();
      }, 2000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.extractedMessage ||
        'Registration failed. Please try again.';
      setModalFeedback({ type: 'error', text: msg });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Community Events
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Discover local workshops, neighborhood cleanups, sports leagues, and more.
          </p>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="relative max-w-md w-full flex items-center"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by location / keyword..."
            className="w-full pl-10 pr-24 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Layout: Filters & Event Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <EventFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* Events Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start space-x-2">
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
              <span>{error}</span>
            </div>
          )}

          {/* Loading Spinner */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-medium text-sm">Loading events...</p>
            </div>
          ) : events.length > 0 ? (
            <>
                            {/* Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRegister={openRegisterModal}
                    onFlag={handleOpenFlagModal}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-6">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                      (pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100 bg-white border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No events found</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                We couldn't find any events matching your selected criteria. Try adjusting your filters or search terms.
              </p>
              <button
                type="button"
                onClick={() =>
                  handleFilterChange({
                    category: '',
                    startDate: '',
                    endDate: '',
                    location: '',
                    isFree: '',
                    sortBy: 'date',
                    page: 1,
                  })
                }
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

            {/* Register Confirmation Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-gray-900">
                Confirm Registration
              </h3>
              <button
                type="button"
                onClick={closeRegisterModal}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-600">
                You are registering for:
              </p>
              <h4 className="text-base font-semibold text-primary-700 mt-1">
                {selectedEvent.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-gray-500">
                Location: {selectedEvent.location}
              </p>
            </div>

            {/* Feedback Messages inside Modal */}
            {modalFeedback.text && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  modalFeedback.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {modalFeedback.text}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={closeRegisterModal}
                disabled={isRegistering}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRegister}
                disabled={isRegistering}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center space-x-2"
              >
                {isRegistering && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{isRegistering ? 'Registering...' : 'Confirm RSVP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Inappropriate Content Modal */}
      {flagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <span>Report Event Content</span>
            </h3>
            <p className="text-xs text-gray-600">
              Reporting event: <strong className="text-gray-900">{flagTarget?.title}</strong>. Submitting this will alert the City Admin for review.
            </p>
            <form onSubmit={handleSubmitFlag} className="space-y-3">
              <textarea
                required
                rows={4}
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="State why this content violates community safety or policy..."
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFlagModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFlagging}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {isFlagging ? 'Submitting...' : 'Submit to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
