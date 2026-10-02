const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  isUserApproved,
  recordRegistration,
  approveUser,
  rejectUser,
  getPendingUsers,
  getAllApprovalStatuses,
} = require('../services/approvalService');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const VALID_ROLES = ['CITIZEN', 'CITY_ADMIN', 'DEPT_MANAGER'];

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Validation: name, email, password, role
    const errors = [];

    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('Name is required');
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      errors.push('A valid email is required');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.push('Password is required and must be at least 6 characters long');
    }

    if (!role || !VALID_ROLES.includes(role)) {
      errors.push(`Role is required and must be one of: ${VALID_ROLES.join(', ')}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already exists'
      });
    }

    // Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with Prisma
    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role
    };

    if (department) {
      userData.department = department;
    }

        const newUser = await prisma.user.create({
      data: userData
    });

    // If role is CITIZEN or DEPT_MANAGER, require admin approval before login
    if (newUser.role !== 'CITY_ADMIN') {
      recordRegistration(newUser);
      return res.status(201).json({
        message: 'Registration successful! Your account is pending administrator approval before you can sign in.',
        pendingApproval: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    }

    // Generate JWT token with user id and role
    const token = generateToken(newUser);

    // Return: { token, user: { id, name, email, role } }
    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);

    // Handle Prisma unique constraint violation (P2002)
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Email already exists'
      });
    }

    return res.status(500).json({
      message: 'Internal server error during registration',
      error: error.message
    });
  }
};

/**
 * Login an existing user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: email, password
    const errors = [];
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      errors.push('A valid email is required');
    }
    if (!password || typeof password !== 'string') {
      errors.push('Password is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

        // Compare password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check if user is approved by Admin (Citizen or Dept Manager)
    if (user.role !== 'CITY_ADMIN' && !isUserApproved(user.email, user.role)) {
      return res.status(403).json({
        message: 'Your account is pending administrator approval. Please wait for an admin to approve your account before logging in.'
      });
    }

    // Update lastLogin if field exists in Prisma client model
    try {
      if ('lastLogin' in prisma.user.fields || user.lastLogin !== undefined) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });
      }
    } catch {
      // If lastLogin field does not exist in the schema, ignore update error
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return: { token, user: { id, name, email, role } }
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      message: 'Internal server error during login',
      error: error.message
    });
  }
};

/**
 * Get current authenticated user info
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Return user info (without password)
    return res.status(200).json({
      user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      message: 'Internal server error fetching user profile',
      error: error.message
    });
  }
};

/**
 * Change password for authenticated user
 * POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validation: currentPassword, newPassword
    const errors = [];
    if (!currentPassword || typeof currentPassword !== 'string') {
      errors.push('Current password is required');
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      errors.push('New password is required and must be at least 6 characters long');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    // Fetch user to verify current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: 'New password cannot be the same as current password'
      });
    }

    // Hash and update new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      message: 'Internal server error changing password',
      error: error.message
    });
  }
};

const approveUserAccount = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'User email is required' });
    }
    approveUser(email);
    return res.status(200).json({ message: `User ${email} has been approved` });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const rejectUserAccount = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'User email is required' });
    }
    rejectUser(email);
    return res.status(200).json({ message: `User ${email} was rejected/removed` });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const listPendingApprovals = async (req, res) => {
  try {
    const pending = getPendingUsers();
    return res.status(200).json({ pending });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getAllUsersWithApproval = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const approvalData = getAllApprovalStatuses();
    const approvedSet = new Set(approvalData.approvedEmails.map((e) => e.toLowerCase()));

    const enrichedUsers = users.map((u) => ({
      ...u,
      isApproved: u.role === 'CITY_ADMIN' || approvedSet.has(u.email.toLowerCase()),
    }));

    return res.status(200).json({ users: enrichedUsers });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  approveUserAccount,
  rejectUserAccount,
  listPendingApprovals,
  getAllUsersWithApproval,
};
