import { useEffect, useState } from 'react';
import eventService from '../services/eventService';
import EventCard from '../components/Events/EventCard.jsx';
import EventFilters from '../components/Events/EventFilters.jsx';
import Modal from '../components/UI/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const DEFAULT_FILTERS = {
  categories: [],
  startDate: '',
  endDate: '',
  location: '',
  priceType: 'all',
  sortBy: 'date',
};

function buildQueryParams(filters, search, page) {
  const params = { page, limit: 9, sortBy: filters.sortBy };

  if (filters.categories?.length === 1) params.category = filters.categories[0];
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.location) params.location = filters.location;
  if (filters.priceType === 'free') params.isFree = true;
  if (filters.priceType === 'paid') params.isFree = false;
  if (search) params.location = search;

  return params;
}

function Events() {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registerMessage, setRegisterMessage] = useState(null);
  const [flaggingEvent, setFlaggingEvent] = useState(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagMessage, setFlagMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = buildQueryParams(filters, search, page);
    let filteredCategories = filters.categories?.length > 1 ? filters.categories : null;

    eventService
      .getAllEvents(params)
      .then((data) => {
        const results = filteredCategories
          ? (data.events || []).filter((e) => filteredCategories.includes(e.category))
          : data.events || [];
        setEvents(results);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => setError('Failed to load events. Please try again.'))
      .finally(() => setLoading(false));
  }, [filters, search, page]);

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  function handleRegisterClick(event) {
    setSelectedEvent(event);
    setRegisterMessage(null);
  }

  async function confirmRegistration() {
    if (!selectedEvent) return;
    setRegistering(true);
    try {
      await eventService.registerForEvent(selectedEvent.id);
      setRegisterMessage('You have successfully registered for this event!');
    } catch (err) {
      setRegisterMessage(err.message || 'Failed to register for event');
    } finally {
      setRegistering(false);
    }
  }

  function closeModal() {
    setSelectedEvent(null);
    setRegisterMessage(null);
  }

  function handleFlagClick(event) {
    setFlaggingEvent(event);
    setFlagReason('');
    setFlagMessage(null);
  }

  async function submitFlag() {
    if (!flaggingEvent || !flagReason.trim()) return;
    setFlagSubmitting(true);
    try {
      await eventService.flagEvent(flaggingEvent.id, flagReason.trim());
      setFlagMessage('Thank you, your report has been submitted to the admin.');
    } catch (err) {
      setFlagMessage(err.message || 'Failed to submit report');
    } finally {
      setFlagSubmitting(false);
    }
  }

  function closeFlagModal() {
    setFlaggingEvent(null);
    setFlagReason('');
    setFlagMessage(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Community Events</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search events by location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-96 border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-64 flex-shrink-0">
          <EventFilters filters={filters} onFilterChange={handleFilterChange} />
        </aside>

        <div className="flex-1">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <p className="text-red-600 text-center py-12">{error}</p>
          )}

          {!loading && !error && events.length === 0 && (
            <p className="text-gray-500 text-center py-12">No events found</p>
          )}

          {!loading && !error && events.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRegister={handleRegisterClick}
                    onFlag={isAuthenticated ? handleFlagClick : undefined}
                  />
                ))}
              </div>

              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-md border text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-md border text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={!!selectedEvent} onClose={closeModal} title="Confirm Registration">
        {selectedEvent && (
          <div className="space-y-4">
            {registerMessage ? (
              <p className="text-sm text-gray-700">{registerMessage}</p>
            ) : (
              <p className="text-sm text-gray-700">
                Register for <span className="font-semibold">{selectedEvent.title}</span>?
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm rounded-md border">
                Close
              </button>
              {!registerMessage && (
                <button
                  onClick={confirmRegistration}
                  disabled={registering}
                  className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {registering ? 'Registering...' : 'Confirm'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!flaggingEvent} onClose={closeFlagModal} title="Report Inappropriate Content">
        {flaggingEvent && (
          <div className="space-y-4">
            {flagMessage ? (
              <p className="text-sm text-gray-700">{flagMessage}</p>
            ) : (
              <>
                <p className="text-sm text-gray-700">
                  Tell us why <span className="font-semibold">{flaggingEvent.title}</span> should be reviewed by an admin.
                </p>
                <textarea
                  rows={4}
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Reason for flagging this content"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                />
              </>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={closeFlagModal} className="px-4 py-2 text-sm rounded-md border">
                Close
              </button>
              {!flagMessage && (
                <button
                  onClick={submitFlag}
                  disabled={flagSubmitting || !flagReason.trim()}
                  className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {flagSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Events;
