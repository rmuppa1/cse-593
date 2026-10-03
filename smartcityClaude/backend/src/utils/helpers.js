const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args);

// Strip password before sending a user to the client.
const publicUser = ({ password, ...rest }) => rest;

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const toInt = (v) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

// Each department handles these request types.
const DEPARTMENT_TYPES = {
  PUBLIC_WORKS: ['POTHOLE', 'STREETLIGHT'],
  WATER_UTILITIES: ['WATER_LEAK'],
  PARKS_SANITATION: ['GRAFFITI', 'OTHER'],
  PUBLIC_SAFETY: ['NOISE'],
};

module.exports = { prisma, log, publicUser, asyncHandler, toInt, DEPARTMENT_TYPES };
