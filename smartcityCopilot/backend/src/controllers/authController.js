const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');

const SALT_ROUNDS = 10;
// Only these roles can be self-registered; CITY_ADMIN accounts are provisioned separately
const SELF_REGISTERABLE_ROLES = ['CITIZEN', 'DEPT_MANAGER'];

function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    approvalStatus: user.approvalStatus,
  };
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    if (role && !SELF_REGISTERABLE_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role provided' });
    }

    if (role === 'DEPT_MANAGER' && !department) {
      return res.status(400).json({ success: false, message: 'Department is required for department managers' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'CITIZEN',
        department: role === 'DEPT_MANAGER' ? department : null,
        // Self-registered accounts require admin approval before they can log in
        approvalStatus: 'PENDING',
      },
    });

    return res.status(201).json({
      pendingApproval: true,
      message: 'Your account has been created and is pending admin approval.',
      user: sanitizeUser(user),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to register user', error: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.approvalStatus === 'PENDING') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval' });
    }

    if (user.approvalStatus === 'REJECTED') {
      return res.status(403).json({ success: false, message: 'Your account registration was rejected' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = generateToken(updatedUser);

    return res.status(200).json({ token, user: sanitizeUser(updatedUser) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to log in', error: err.message });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch current user', error: err.message });
  }
}

// POST /api/auth/change-password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to change password', error: err.message });
  }
}

// GET /api/auth/pending-users - requires CITY_ADMIN
async function getPendingUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { approvalStatus: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({ users: users.map(sanitizeUser) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch pending users', error: err.message });
  }
}

// PUT /api/auth/approve/:id - requires CITY_ADMIN
async function approveUser(req, res) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { approvalStatus: 'APPROVED' },
    });

    return res.status(200).json({ user: sanitizeUser(updated) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to approve user', error: err.message });
  }
}

// PUT /api/auth/reject/:id - requires CITY_ADMIN
async function rejectUser(req, res) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { approvalStatus: 'REJECTED' },
    });

    return res.status(200).json({ user: sanitizeUser(updated) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reject user', error: err.message });
  }
}

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  getPendingUsers,
  approveUser,
  rejectUser,
};
