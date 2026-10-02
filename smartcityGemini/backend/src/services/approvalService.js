const fs = require('fs');
const path = require('path');

const APPROVALS_FILE = path.join(__dirname, '../data/approvals.json');

// Ensure directory exists
const dir = path.dirname(APPROVALS_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Default approved emails / IDs (admin and default seed accounts)
const DEFAULT_APPROVED = [
  'admin@smartcity.com',
  'citizen@smartcity.com',
  'manager@smartcity.com',
];

const loadApprovals = () => {
  try {
    if (!fs.existsSync(APPROVALS_FILE)) {
      const initial = { approvedEmails: DEFAULT_APPROVED, pendingUsers: [] };
      fs.writeFileSync(APPROVALS_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(APPROVALS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { approvedEmails: DEFAULT_APPROVED, pendingUsers: [] };
  }
};

const saveApprovals = (data) => {
  fs.writeFileSync(APPROVALS_FILE, JSON.stringify(data, null, 2));
};

const isUserApproved = (email, role) => {
  if (role === 'CITY_ADMIN') return true;
  const data = loadApprovals();
  return data.approvedEmails.includes(email.toLowerCase());
};

const recordRegistration = (user) => {
  const data = loadApprovals();
  const normalizedEmail = user.email.toLowerCase();

  // If already in pending or approved, do not duplicate
  if (!data.approvedEmails.includes(normalizedEmail)) {
    const exists = data.pendingUsers.some((u) => u.email.toLowerCase() === normalizedEmail);
    if (!exists) {
      data.pendingUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || null,
        requestedAt: new Date().toISOString(),
      });
      saveApprovals(data);
    }
  }
};

const approveUser = (email) => {
  const data = loadApprovals();
  const normalized = email.toLowerCase();
  if (!data.approvedEmails.includes(normalized)) {
    data.approvedEmails.push(normalized);
  }
  data.pendingUsers = data.pendingUsers.filter((u) => u.email.toLowerCase() !== normalized);
  saveApprovals(data);
};

const rejectUser = (email) => {
  const data = loadApprovals();
  const normalized = email.toLowerCase();
  data.approvedEmails = data.approvedEmails.filter((e) => e.toLowerCase() !== normalized);
  data.pendingUsers = data.pendingUsers.filter((u) => u.email.toLowerCase() !== normalized);
  saveApprovals(data);
};

const getPendingUsers = () => {
  const data = loadApprovals();
  return data.pendingUsers;
};

const getAllApprovalStatuses = () => {
  return loadApprovals();
};

module.exports = {
  isUserApproved,
  recordRegistration,
  approveUser,
  rejectUser,
  getPendingUsers,
  getAllApprovalStatuses,
};
