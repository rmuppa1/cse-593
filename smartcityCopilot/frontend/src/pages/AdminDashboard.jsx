import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import eventService from '../services/eventService';
import requestService from '../services/requestService';
import userService from '../services/userService';
import authService from '../services/authService';
import Modal from '../components/UI/Modal.jsx';
import { DEPARTMENTS } from '../constants/departments.js';

const TABS = ['Overview', 'Events', 'Requests', 'Users', 'Flagged Content'];

const REQUEST_STATUSES = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const REQUEST_CATEGORIES = ['BROKEN_STREETLIGHT', 'POTHOLE', 'GRAFFITI', 'WATER_LEAK', 'NOISE_COMPLAINT', 'OTHER'];
const REQUEST_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function formatLabel(value) {
  return value
    ?.toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function BarList({ data, colorClass, raw = false }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3 text-sm">
          <span className="w-32 truncate text-gray-600">{raw ? d.label : formatLabel(d.label)}</span>
          <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass}`} style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <span className="w-8 text-right text-gray-700">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, colorClass }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([requestService.getRequestStats(), eventService.getCategories()])
      .then(([requestStats, eventCategories]) => {
        setStats(requestStats);
        setCategories(eventCategories.categories || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading overview...</p>;
  if (!stats) return <p className="text-gray-500">No data available.</p>;

  const resolved = stats.byStatus?.find((s) => s.status === 'RESOLVED')?.count || 0;
  const active = stats.total - resolved;
  const totalEvents = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Events" value={totalEvents} colorClass="text-primary-600" />
        <StatCard label="Active Requests" value={active} colorClass="text-accent-500" />
        <StatCard label="Resolved" value={resolved} colorClass="text-secondary-600" />
        <StatCard label="Total Requests" value={stats.total} colorClass="text-gray-900" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Requests by Status</h3>
          <BarList
            data={stats.byStatus.map((s) => ({ label: s.status, count: s.count }))}
            colorClass="bg-primary-500"
          />
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Requests by Department</h3>
          {stats.byDepartment?.length > 0 ? (
            <BarList
              data={stats.byDepartment.map((d) => ({ label: d.department, count: d.count }))}
              colorClass="bg-accent-500"
              raw
            />
          ) : (
            <p className="text-sm text-gray-500">No requests have been assigned to a department yet.</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Events by Category</h3>
          <BarList
            data={categories.map((c) => ({ label: c.category, count: c.count }))}
            colorClass="bg-secondary-500"
          />
        </div>
      </div>
    </div>
  );
}

function EventsTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'COMMUNITY_SERVICE', date: '', location: '', capacity: '', isFree: true, price: '' });

  function loadEvents() {
    setLoading(true);
    eventService
      .getAllEvents({ limit: 50, includeBlocked: true })
      .then((data) => setEvents(data.events || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function openCreateModal() {
    setEditingEvent(null);
    setForm({ title: '', description: '', category: 'COMMUNITY_SERVICE', date: '', location: '', capacity: '', isFree: true, price: '' });
    setModalOpen(true);
  }

  function openEditModal(event) {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date?.slice(0, 16) || '',
      location: event.location,
      capacity: event.capacity || '',
      isFree: event.isFree,
      price: event.price || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (editingEvent) {
      await eventService.updateEvent(editingEvent.id, form);
    } else {
      await eventService.createEvent(form);
    }
    setModalOpen(false);
    loadEvents();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this event?')) return;
    await eventService.deleteEvent(id);
    loadEvents();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Manage Events</h2>
        <button
          onClick={openCreateModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
        >
          Create Event
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading events...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Title', 'Date', 'Category', 'Registered', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{event.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(event.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatLabel(event.category)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {event.registeredCount}/{event.capacity ?? '∞'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {event.isBlocked ? 'Blocked' : new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap space-x-2">
                    <button onClick={() => openEditModal(event)} className="text-primary-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? 'Edit Event' : 'Create Event'}>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="COMMUNITY_SERVICE">Community Service</option>
            <option value="SPORTS">Sports</option>
            <option value="PUBLIC_SAFETY">Public Safety</option>
            <option value="EDUCATION">Education</option>
            <option value="ENVIRONMENT">Environment</option>
            <option value="CULTURAL_ACTIVITIES">Cultural Activities</option>
          </select>
          <input
            type="datetime-local"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Capacity"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) => setForm({ ...form, isFree: e.target.checked, ...(e.target.checked && { price: '' }) })}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              Free Event
            </label>
            {!form.isFree && (
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price ($)"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700">
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [assigningRequest, setAssigningRequest] = useState(null);
  const [assignForm, setAssignForm] = useState({ assignedToName: '', department: DEPARTMENTS[0] });

  function loadRequests() {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    requestService
      .getAllRequests(params)
      .then((data) => setRequests(data.requests || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function handleStatusUpdate(id, status) {
    await requestService.updateRequestStatus(id, { status });
    loadRequests();
  }

  function openAssignModal(request) {
    setAssigningRequest(request);
    setAssignForm({ assignedToName: request.assignedToName || '', department: request.department || DEPARTMENTS[0] });
  }

  async function handleAssignSubmit() {
    if (!assigningRequest || !assignForm.assignedToName.trim()) return;
    await requestService.assignRequest(assigningRequest.id, assignForm);
    setAssigningRequest(null);
    loadRequests();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>{formatLabel(s)}</option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {REQUEST_CATEGORIES.map((c) => (
            <option key={c} value={c}>{formatLabel(c)}</option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Priorities</option>
          {REQUEST_PRIORITIES.map((p) => (
            <option key={p} value={p}>{formatLabel(p)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading requests...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Title', 'Category', 'Status', 'Priority', 'Submitted By', 'Assigned To', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{request.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatLabel(request.category)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatLabel(request.status)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatLabel(request.priority)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{request.submittedBy?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{request.assignedToName || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap space-x-2">
                    <button onClick={() => openAssignModal(request)} className="text-primary-600 hover:underline">Assign</button>
                    <select
                      defaultValue=""
                      onChange={(e) => e.target.value && handleStatusUpdate(request.id, e.target.value)}
                      className="border rounded-md px-1 py-0.5 text-xs"
                    >
                      <option value="" disabled>Update Status</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!assigningRequest} onClose={() => setAssigningRequest(null)} title="Assign Request">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee Name</label>
            <input
              type="text"
              placeholder="e.g. John Smith"
              value={assignForm.assignedToName}
              onChange={(e) => setAssignForm({ ...assignForm, assignedToName: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Can be anyone, not necessarily a registered user.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={assignForm.department}
              onChange={(e) => setAssignForm({ ...assignForm, department: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setAssigningRequest(null)} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
            <button
              onClick={handleAssignSubmit}
              disabled={!assignForm.assignedToName.trim()}
              className="px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Assign
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadData() {
    setLoading(true);
    Promise.all([userService.getAllUsers(), authService.getPendingUsers()])
      .then(([usersData, pendingData]) => {
        setUsers(usersData.users || []);
        setPendingUsers(pendingData.users || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApprove(id) {
    await authService.approveUser(id);
    loadData();
  }

  async function handleReject(id) {
    if (!window.confirm('Reject this registration request?')) return;
    await authService.rejectUser(id);
    loadData();
  }

  if (loading) return <p className="text-gray-500">Loading users...</p>;

  return (
    <div className="space-y-8">
      {pendingUsers.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Pending Approvals ({pendingUsers.length})</h3>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Role', 'Department', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 whitespace-nowrap">{u.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatLabel(u.role)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{u.department || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap space-x-2">
                      <button onClick={() => handleApprove(u.id)} className="text-secondary-600 hover:underline">Approve</button>
                      <button onClick={() => handleReject(u.id)} className="text-red-600 hover:underline">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">All Users</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Role', 'Department', 'Status', 'Joined'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 whitespace-nowrap">{u.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{u.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatLabel(u.role)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{u.department || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatLabel(u.approvalStatus)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FlaggedContentTab() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadFlags() {
    setLoading(true);
    eventService
      .getFlags()
      .then((data) => setFlags(data.flags || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFlags();
  }, []);

  async function handleBlockToggle(eventId, isBlocked) {
    await eventService.setEventBlockedStatus(eventId, isBlocked);
    loadFlags();
  }

  if (loading) return <p className="text-gray-500">Loading flagged content...</p>;
  if (flags.length === 0) return <p className="text-gray-500">No content has been flagged.</p>;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Event', 'Reason', 'Flagged By', 'Status', 'Actions'].map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {flags.map((flag) => (
            <tr key={flag.id}>
              <td className="px-4 py-3 whitespace-nowrap">{flag.event?.title}</td>
              <td className="px-4 py-3 max-w-xs truncate" title={flag.reason}>{flag.reason}</td>
              <td className="px-4 py-3 whitespace-nowrap">{flag.flaggedBy?.name}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {flag.event?.isBlocked ? 'Blocked' : formatLabel(flag.status)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {flag.event?.isBlocked ? (
                  <button onClick={() => handleBlockToggle(flag.event.id, false)} className="text-secondary-600 hover:underline">
                    Unblock
                  </button>
                ) : (
                  <button onClick={() => handleBlockToggle(flag.event.id, true)} className="text-red-600 hover:underline">
                    Block Event
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminDashboard() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const isAdmin = hasRole(['CITY_ADMIN']);
  const visibleTabs = isAdmin ? TABS : TABS.filter((t) => !['Events', 'Users', 'Flagged Content'].includes(t));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && <OverviewTab />}
      {activeTab === 'Events' && isAdmin && <EventsTab />}
      {activeTab === 'Requests' && <RequestsTab />}
      {activeTab === 'Users' && isAdmin && <UsersTab />}
      {activeTab === 'Flagged Content' && isAdmin && <FlaggedContentTab />}
    </div>
  );
}

export default AdminDashboard;
