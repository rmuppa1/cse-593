import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getCategories as getEventCategories,
} from '../services/eventService';
import {
  getAllRequests,
  getDepartmentRequests,
  updateRequestStatus,
  assignRequest,
  getRequestStats,
} from '../services/requestService';
import api from '../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'CITY_ADMIN';
  const isManager = user?.role === 'DEPT_MANAGER';

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Overview stats state
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeRequests: 0,
    resolvedRequests: 0,
    totalUsers: 0,
    byStatus: {},
    byCategory: {},
  });

  // Events state
  const [events, setEvents] = useState([]);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'COMMUNITY_SERVICE',
    date: '',
    location: '',
    capacity: 50,
    isFree: true,
    price: '',
    status: 'UPCOMING',
  });

    // Requests state
  const [requests, setRequests] = useState([]);
  const [requestFilters, setRequestFilters] = useState({
    status: '',
    category: '',
    priority: '',
  });
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [assignedPersonName, setAssignedPersonName] = useState('');
  const [assignedDept, setAssignedDept] = useState('PUBLIC_WORKS');

    // Flag moderation state (Admin only)
  const [flags, setFlags] = useState([]);

  // Users state (Admin only)
  const [users, setUsers] = useState([]);

  // Category analytics filter
  const [analyticsCategory, setAnalyticsCategory] = useState('ALL');

  const showFeedback = (text, type = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

    // Fetch Overview Data
  const loadOverviewData = useCallback(async () => {
    try {
      const [eventsRes, reqStatsRes, usersCountRes] = await Promise.all([
        getAllEvents({ limit: 100 }),
        getRequestStats().catch(() => ({ data: null })),
        isAdmin ? api.get('/users').catch(() => ({ data: { users: [] } })) : Promise.resolve({ data: null }),
      ]);

      const eventsList = eventsRes.data?.events || [];
      const statsData = reqStatsRes.data || {};
      const usersList = usersCountRes.data?.users || usersCountRes.data || [];

      // Compute events category distribution
      const catCount = {};
      eventsList.forEach((e) => {
        catCount[e.category] = (catCount[e.category] || 0) + 1;
      });

      const byStatus = statsData.byStatus || {};
      const activeCount =
        (byStatus.SUBMITTED || 0) +
        (byStatus.ASSIGNED || 0) +
        (byStatus.IN_PROGRESS || 0);
      const resolvedCount = (byStatus.RESOLVED || 0) + (byStatus.CLOSED || 0);

      setStats({
        totalEvents: eventsRes.data?.total || eventsList.length,
        activeRequests: activeCount,
        resolvedRequests: resolvedCount,
        totalUsers: statsData.totalUsers || usersList.length || 0,
        byStatus,
        byCategory: statsData.byCategory || {},
        eventCategories: catCount,
      });
    } catch (err) {
      console.error('Error loading dashboard overview:', err);
    }
  }, [isAdmin]);

  // Fetch Events
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllEvents({ limit: 50, sortBy: '-createdAt' });
      setEvents(res.data?.events || []);
    } catch (err) {
      showFeedback('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Requests
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      let res;
      if (isManager) {
        res = await getDepartmentRequests();
      } else {
        res = await getAllRequests({ limit: 50, ...requestFilters });
      }
      setRequests(res.data?.requests || res.data || []);
    } catch (err) {
      showFeedback('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [isManager, requestFilters]);

        // Fetch Users (Admin only)
    const loadUsers = useCallback(async () => {
      if (!isAdmin) return;
      try {
        setLoading(true);
        let list = [];
        try {
          const res = await api.get('/auth/users');
          list = res.data?.users || res.data || [];
        } catch (err1) {
          const fallback = await api.get('/users');
          list = fallback.data?.users || fallback.data || [];
        }
        setUsers(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load users:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, [isAdmin]);

    // Fetch Flags (Admin only)
  const loadFlags = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const res = await api.get('/flags');
      setFlags(res.data?.flags || []);
    } catch (err) {
      console.error('Error fetching flags:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData();
    } else if (activeTab === 'events') {
      loadEvents();
    } else if (activeTab === 'requests') {
      loadRequests();
    } else if (activeTab === 'users' && isAdmin) {
      loadUsers();
    } else if (activeTab === 'flags' && isAdmin) {
      loadFlags();
    }
  }, [activeTab, loadOverviewData, loadEvents, loadRequests, loadUsers, loadFlags, isAdmin]);

  // Event actions
  const handleOpenCreateEvent = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      category: 'COMMUNITY_SERVICE',
      date: '',
      location: '',
      capacity: 50,
      isFree: true,
      price: '',
      status: 'UPCOMING',
    });
    setEventModalOpen(true);
  };

  const handleOpenEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'COMMUNITY_SERVICE',
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
      location: event.location || '',
      capacity: event.capacity || 50,
      isFree: event.isFree !== undefined ? event.isFree : true,
      price: event.price || '',
      status: event.status || 'UPCOMING',
    });
    setEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...eventForm,
        capacity: parseInt(eventForm.capacity, 10),
        price: eventForm.isFree ? null : parseFloat(eventForm.price || 0),
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, payload);
        showFeedback('Event updated successfully');
      } else {
        await createEvent(payload);
        showFeedback('Event created successfully');
      }
      setEventModalOpen(false);
      loadEvents();
    } catch (err) {
      const msg = err.response?.data?.message || err.extractedMessage || 'Failed to save event';
      showFeedback(msg, 'error');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(id);
      showFeedback('Event deleted successfully');
      loadEvents();
    } catch (err) {
      showFeedback('Failed to delete event', 'error');
    }
  };

  // Request actions
  const handleOpenStatusModal = (req) => {
    setSelectedRequest(req);
    setNewStatus(req.status || 'IN_PROGRESS');
    setResolutionNotes(req.resolutionNotes || '');
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedRequest) return;
    try {
      await updateRequestStatus(selectedRequest.id, {
        status: newStatus,
        resolutionNotes,
      });
      showFeedback('Request status updated');
      setStatusModalOpen(false);
      loadRequests();
    } catch (err) {
      showFeedback('Failed to update status', 'error');
    }
  };

    const handleOpenAssignModal = (req) => {
    setSelectedRequest(req);
    setAssignedDept(req.department || (user?.department || 'PUBLIC_WORKS'));
    // Extract previously assigned name from resolution notes if present
    const prevMatch = req.resolutionNotes?.match(/\[Assigned to: ([^\]]+)\]/);
    setAssignedPersonName(prevMatch ? prevMatch[1] : req.assignee?.name || '');
    setAssignModalOpen(true);
  };

  const handleSaveAssign = async () => {
    if (!selectedRequest || !assignedPersonName.trim()) {
      showFeedback('Please provide the name of the assigned person', 'error');
      return;
    }
    try {
      await assignRequest(selectedRequest.id, {
        department: assignedDept,
        assignedName: assignedPersonName.trim(),
      });
      showFeedback('Request successfully assigned to ' + assignedPersonName.trim());
      setAssignModalOpen(false);
      loadRequests();
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to assign request', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback.text && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
            feedback.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Administrative Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Logged in as <span className="font-semibold text-gray-700">{user?.name}</span> (
            {user?.role}) {user?.department && `• ${user.department}`}
          </p>
        </div>

        {isAdmin && activeTab === 'events' && (
          <button
            type="button"
            onClick={handleOpenCreateEvent}
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        )}
      </div>

            {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'events', label: 'Events' },
            { id: 'requests', label: 'Requests' },
            ...(isAdmin ? [{ id: 'users', label: 'Users' }] : []),
            ...(isAdmin ? [{ id: 'flags', label: 'Flagged Content' }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ==================== TAB 1: OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total Events</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalEvents}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Active Requests</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.activeRequests}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Resolved</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.resolvedRequests}</h3>
              </div>
            </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total System Users</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalUsers}</h3>
              </div>
            </div>
          </div>

          {/* Category Analytics Filter & Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Category Analytics</h3>
                <p className="text-xs text-gray-500">
                  Detailed analytics and volume distribution for specific reported issue categories.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-gray-600">Select Category:</label>
                <select
                  value={analyticsCategory}
                  onChange={(e) => setAnalyticsCategory(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white font-medium text-gray-700"
                >
                  <option value="ALL">All Categories</option>
                  <option value="POTHOLE">Pothole & Roads</option>
                  <option value="BROKEN_STREETLIGHT">Broken Streetlight</option>
                  <option value="GRAFFITI">Graffiti & Sanitation</option>
                  <option value="WATER_LEAK">Water Leak</option>
                  <option value="NOISE_COMPLAINT">Noise Complaint</option>
                </select>
              </div>
            </div>

            {/* Selected Category Stat Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 font-semibold uppercase">Category Share</span>
                <p className="text-xl font-extrabold text-primary-700 mt-1">
                  {analyticsCategory === 'ALL'
                    ? '100%'
                    : `${Math.round(
                        ((stats.byCategory[analyticsCategory] || 0) /
                          Math.max(stats.activeRequests + stats.resolvedRequests, 1)) *
                          100
                      )}%`}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 font-semibold uppercase">Reported Incidents</span>
                <p className="text-xl font-extrabold text-gray-900 mt-1">
                  {analyticsCategory === 'ALL'
                    ? stats.activeRequests + stats.resolvedRequests
                    : stats.byCategory[analyticsCategory] || 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 font-semibold uppercase">Department Status</span>
                <p className="text-xl font-extrabold text-green-700 mt-1">Operational</p>
              </div>
            </div>

            {/* Progress Bars for all Categories */}
            <div className="space-y-3">
              {Object.keys(stats.byCategory).length > 0 ? (
                Object.entries(stats.byCategory).map(([cat, count]) => {
                  const total = stats.activeRequests + stats.resolvedRequests || 1;
                  const pct = Math.round((count / total) * 100);
                  const isHighlighted = analyticsCategory === 'ALL' || analyticsCategory === cat;

                  return (
                    <div
                      key={cat}
                      className={`p-2 rounded-lg transition-colors ${
                        isHighlighted ? 'bg-primary-50/40' : 'opacity-40'
                      }`}
                    >
                      <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                        <span className="font-semibold">{cat.replace('_', ' ')}</span>
                        <span>
                          {count} requests ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-sm">No category analytics recorded yet.</p>
              )}
            </div>
          </div>

          {/* Charts / Metrics Visuals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requests by Status */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-4">Requests by Status</h3>
              <div className="space-y-3">
                {['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((statusKey) => {
                  const count = stats.byStatus[statusKey] || 0;
                  const total = stats.activeRequests + stats.resolvedRequests || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={statusKey}>
                      <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                        <span>{statusKey}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

                        {/* Events by Category */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-900 text-base mb-4">Events by Category</h3>
              <div className="space-y-3">
                {stats.eventCategories && Object.keys(stats.eventCategories).length > 0 ? (
                  Object.entries(stats.eventCategories).map(([cat, count]) => {
                    const pct = Math.round((count / (stats.totalEvents || 1)) * 100);
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                          <span>{cat.replace('_', ' ')}</span>
                          <span>{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-sm">No event category data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: EVENTS ==================== */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Registered</th>
                  <th className="px-6 py-3">Status</th>
                  {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.length > 0 ? (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs truncate">
                        {event.title}
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(event.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {event.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                        {event.registeredCount || 0} / {event.capacity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {event.status || 'UPCOMING'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEditEvent(event)}
                            className="text-primary-600 hover:text-primary-900 font-medium text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-900 font-medium text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                      No events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: REQUESTS ==================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
            <select
              value={requestFilters.status}
              onChange={(e) => setRequestFilters({ ...requestFilters, status: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>

                        <select
              value={requestFilters.category}
              onChange={(e) => setRequestFilters({ ...requestFilters, category: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All Categories</option>
              <option value="POTHOLE">POTHOLE</option>
              <option value="BROKEN_STREETLIGHT">BROKEN_STREETLIGHT</option>
              <option value="GRAFFITI">GRAFFITI</option>
              <option value="WATER_LEAK">WATER_LEAK</option>
              <option value="NOISE_COMPLAINT">NOISE_COMPLAINT</option>
            </select>

            <select
              value={requestFilters.priority}
              onChange={(e) => setRequestFilters({ ...requestFilters, priority: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Submitted By</th>
                    <th className="px-6 py-3">Assigned To</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                                    {requests.length > 0 ? (
                    requests.map((req) => {
                      const canUpdate =
                        isAdmin || (req.assignedToId && req.assignedToId === user?.id);

                      return (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs truncate">
                            {req.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {req.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                req.status === 'RESOLVED'
                                  ? 'bg-green-100 text-green-800'
                                  : req.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-800'
                                  : req.status === 'ASSIGNED'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-800">
                              {req.priority || 'MEDIUM'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {req.submitter?.name || req.submittedById || 'Citizen'}
                          </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {(() => {
                              const match = req.resolutionNotes?.match(/\[Assigned to: ([^\]]+)\]/);
                              if (match) return match[1];
                              if (req.assignee?.name) return req.assignee.name;
                              if (req.assignedToId === user?.id) return `${user?.name} (You)`;
                              return req.department || 'Unassigned';
                            })()}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            {(isAdmin || isManager) && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(req)}
                                className="text-primary-600 hover:text-primary-900 font-medium text-xs"
                              >
                                Assign
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(req)}
                              className="text-secondary-600 hover:text-secondary-900 font-medium text-xs"
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

            {/* ==================== TAB 5: FLAGGED CONTENT (Admin only) ==================== */}
      {isAdmin && activeTab === 'flags' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900">Community Moderation Flags</h3>
              <p className="text-xs text-gray-500">
                Reports submitted by citizens and staff. As administrator, you can block content or dismiss reports.
              </p>
            </div>
            <button
              type="button"
              onClick={loadFlags}
              className="text-xs text-primary-600 hover:text-primary-800 font-semibold"
            >
              Refresh Reports
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Item Title</th>
                  <th className="px-6 py-3">Reported Reason</th>
                  <th className="px-6 py-3">Reported By</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {flags.length > 0 ? (
                  flags.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">
                          {f.itemType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 max-w-xs truncate">
                        {f.itemTitle}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-sm">
                        {f.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {f.flaggedBy?.name} ({f.flaggedBy?.email})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            f.status === 'BLOCKED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {f.status !== 'BLOCKED' ? (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.post('/flags/block', {
                                  itemId: f.itemId,
                                  itemType: f.itemType,
                                });
                                showFeedback(`Content blocked from public view`);
                                loadFlags();
                              } catch (e) {
                                showFeedback('Failed to block content', 'error');
                              }
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
                          >
                            Block Content
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.post('/flags/unblock', {
                                  itemId: f.itemId,
                                  itemType: f.itemType,
                                });
                                showFeedback(`Content unblocked`);
                                loadFlags();
                              } catch (e) {
                                showFeedback('Failed to unblock content', 'error');
                              }
                            }}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                          >
                            Unblock
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.post('/flags/dismiss', { flagId: f.id });
                              showFeedback(`Flag dismissed`);
                              loadFlags();
                            } catch (e) {
                              showFeedback('Failed to dismiss flag', 'error');
                            }
                          }}
                          className="text-gray-500 hover:text-gray-700 text-xs font-medium ml-2"
                        >
                          Dismiss
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No reported content flags at this time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
            {/* ==================== TAB 4: USERS (Admin only) ==================== */}
      {isAdmin && activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900">User Management ({Array.isArray(users) ? users.length : 0})</h3>
              <p className="text-xs text-gray-500">
                Review registered accounts and manage citizen / manager approvals.
              </p>
            </div>
            <button
              type="button"
              onClick={loadUsers}
              className="text-xs text-primary-600 hover:text-primary-800 font-semibold"
            >
              Refresh Users
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.department || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.isApproved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {u.isApproved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        {u.role !== 'CITY_ADMIN' && !u.isApproved && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.post('/auth/approve-user', { email: u.email });
                                showFeedback(`Approved user ${u.name}`);
                                loadUsers();
                              } catch (err) {
                                showFeedback('Failed to approve user', 'error');
                              }
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {u.role !== 'CITY_ADMIN' && u.isApproved && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.post('/auth/reject-user', { email: u.email });
                                showFeedback(`Revoked approval for ${u.name}`);
                                loadUsers();
                              } catch (err) {
                                showFeedback('Failed to revoke user', 'error');
                              }
                            }}
                            className="text-red-600 hover:text-red-800 font-medium text-xs"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No user records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* 1. Create / Edit Event Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <h3 className="text-xl font-bold text-gray-900">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h3>
            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="COMMUNITY_SERVICE">Community Service</option>
                    <option value="SPORTS">Sports</option>
                    <option value="PUBLIC_SAFETY">Public Safety</option>
                    <option value="EDUCATION">Education</option>
                    <option value="ENVIRONMENT">Environment</option>
                    <option value="CULTURAL">Cultural</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={eventForm.isFree}
                    onChange={(e) => setEventForm({ ...eventForm, isFree: e.target.checked })}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Free Admission</span>
                </label>
                {!eventForm.isFree && (
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price ($)"
                    value={eventForm.price}
                    onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
                    className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                  />
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Update Status Modal */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Update Request Status</h3>
            <p className="text-xs text-gray-500">
              Request: <span className="font-semibold text-gray-700">{selectedRequest?.title}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Notes on resolution or ongoing dispatch..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Assign Request Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Assign Request</h3>
            <p className="text-xs text-gray-500">
              Request: <span className="font-semibold text-gray-700">{selectedRequest?.title}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={assignedDept}
                  onChange={(e) => setAssignedDept(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="PUBLIC_WORKS">PUBLIC_WORKS</option>
                  <option value="TRANSPORTATION">TRANSPORTATION</option>
                  <option value="PARKS_RECREATION">PARKS_RECREATION</option>
                  <option value="SANITATION">SANITATION</option>
                  <option value="PUBLIC_SAFETY">PUBLIC_SAFETY</option>
                  <option value="HEALTH_SERVICES">HEALTH_SERVICES</option>
                </select>
              </div>

                            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assignee Name (Person's Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., John Smith or Officer Davies"
                  value={assignedPersonName}
                  onChange={(e) => setAssignedPersonName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssign}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

