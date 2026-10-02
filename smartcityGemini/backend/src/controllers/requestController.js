const { PrismaClient } = require('@prisma/client');
const { getBlockedItemKeys } = require('../services/flagService');

let prisma;
try {
  prisma = require('../prisma');
} catch (e) {
  try {
    prisma = require('../prismaClient');
  } catch (e1) {
    try {
      prisma = require('../config/prisma');
    } catch (e2) {
      try {
        prisma = require('../lib/prisma');
      } catch (e3) {
        prisma = new PrismaClient();
      }
    }
  }
}
if (prisma && prisma.prisma) {
  prisma = prisma.prisma;
} else if (prisma && prisma.default) {
  prisma = prisma.default;
}

const getModel = () => {
  if (prisma.serviceRequest) return prisma.serviceRequest;
  if (prisma.request) return prisma.request;
  return prisma.serviceRequest || prisma.request;
};

const parseId = (id) => {
  if (id === undefined || id === null) return id;
  try {
    const dmmf = prisma._dmmf || prisma._baseDmmf || prisma._runtimeDataModel;
    const models = dmmf?.models || dmmf?.modelMap;
    const model = models?.ServiceRequest || models?.Request || models?.serviceRequest || models?.request;
    const idField = Array.isArray(model?.fields)
      ? model.fields.find((f) => f.name === 'id')
      : model?.fields?.id;
    if (idField?.type === 'Int') {
      return parseInt(id, 10);
    }
    if (idField?.type === 'String') {
      return String(id);
    }
  } catch (e) {}
  return id;
};

async function findManySafe(args) {
  try {
    return await getModel().findMany(args);
  } catch (err) {
    if (args.include && (err.message?.includes('Unknown field') || err.message?.includes('include'))) {
      const { include, ...rest } = args;
      return await getModel().findMany(rest);
    }
    throw err;
  }
}

async function findUniqueSafe(args) {
  try {
    return await getModel().findUnique(args);
  } catch (err) {
    if (err.message?.includes('expected Int') && typeof args.where?.id === 'string') {
      args.where.id = parseInt(args.where.id, 10);
      return await findUniqueSafe(args);
    }
    if (err.message?.includes('expected String') && typeof args.where?.id === 'number') {
      args.where.id = String(args.where.id);
      return await findUniqueSafe(args);
    }
    if (args.include && (err.message?.includes('Unknown field') || err.message?.includes('include'))) {
      const { include, ...rest } = args;
      return await findUniqueSafe(rest);
    }
    throw err;
  }
}

async function updateSafe(args) {
  try {
    return await getModel().update(args);
  } catch (err) {
    if (err.message?.includes('expected Int') && typeof args.where?.id === 'string') {
      args.where.id = parseInt(args.where.id, 10);
      return await updateSafe(args);
    }
    if (err.message?.includes('expected String') && typeof args.where?.id === 'number') {
      args.where.id = String(args.where.id);
      return await updateSafe(args);
    }
    throw err;
  }
}

const getAllRequests = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const where = {};

    if (req.user.role === 'CITIZEN') {
      where.submittedById = req.user.id;
    } else if (req.user.role === 'DEPT_MANAGER') {
      where.department = req.user.department;
    } else if (req.user.role === 'CITY_ADMIN') {
      if (req.query.department) {
        where.department = req.query.department;
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, category, priority, startDate, endDate, from, to, dateFrom, dateTo } = req.query;

    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const start = startDate || from || dateFrom;
    const end = endDate || to || dateTo;
    if (start || end) {
      where.createdAt = {};
      if (start) where.createdAt.gte = new Date(start);
      if (end) where.createdAt.lte = new Date(end);
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

        const [requests, total] = await Promise.all([
      findManySafe({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: true,
          assignee: true
        }
      }),
      getModel().count({ where })
    ]);

    // Filter out blocked items unless requester is CITY_ADMIN
    const blockedKeys = new Set(getBlockedItemKeys());
    const filteredRequests =
      req.user?.role === 'CITY_ADMIN'
        ? requests
        : requests.filter((r) => !blockedKeys.has(`REQUEST:${r.id}`));

    return res.status(200).json({
      requests: filteredRequests,
      total: filteredRequests.length,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getRequestById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { id } = req.params;
    const request = await findUniqueSafe({
      where: { id: parseId(id) },
      include: {
        submitter: true,
        assignee: true
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (req.user.role === 'CITIZEN' && request.submittedById !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json(request);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const createRequest = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

        const { title, description, category, location, priority, department } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        message: 'Title, description, category, and location are required'
      });
    }

    // Map any frontend category alias to the valid Prisma RequestCategory enum
    const categoryMapping = {
      POTHOLE: 'POTHOLE',
      INFRASTRUCTURE: 'POTHOLE',
      BROKEN_STREETLIGHT: 'BROKEN_STREETLIGHT',
      PUBLIC_SAFETY: 'BROKEN_STREETLIGHT',
      GRAFFITI: 'GRAFFITI',
      SANITATION: 'GRAFFITI',
      WATER_LEAK: 'WATER_LEAK',
      PARKS_RECREATION: 'WATER_LEAK',
      NOISE_COMPLAINT: 'NOISE_COMPLAINT',
      TRANSPORTATION: 'NOISE_COMPLAINT',
    };

    const validCategory = categoryMapping[category] || category;

    const requestData = {
      title,
      description,
      category: validCategory,
      location,
      submittedById: req.user.id,
      status: 'SUBMITTED'
    };

    if (priority) requestData.priority = priority;
    if (department) requestData.department = department;

    const newRequest = await getModel().create({
      data: requestData
    });

    return res.status(201).json(newRequest);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { id } = req.params;
    const existingRequest = await findUniqueSafe({
      where: { id: parseId(id) }
    });

    if (!existingRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Role check: Admin, Dept Manager, or Assigned person can update status
    const isCityAdmin = req.user.role === 'CITY_ADMIN';
    const isDeptManager = req.user.role === 'DEPT_MANAGER';
    const isAssignedPerson =
      (existingRequest.assignedToId && existingRequest.assignedToId === req.user.id) ||
      (existingRequest.department && existingRequest.department.toLowerCase() === req.user.name?.toLowerCase());

    if (!isCityAdmin && !isDeptManager && !isAssignedPerson) {
      return res.status(403).json({
        message: 'Access denied: Only administrators, department managers, or the person assigned can update status.'
      });
    }

    const { status, resolutionNotes } = req.body;
    const allowedStatuses = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    const updateData = { status };
    if (resolutionNotes !== undefined) {
      updateData.resolutionNotes = resolutionNotes;
    }

    const updatedRequest = await updateSafe({
      where: { id: parseId(id) },
      data: updateData
    });

    return res.status(200).json(updatedRequest);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const assignRequest = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'CITY_ADMIN' && req.user.role !== 'DEPT_MANAGER') {
      return res.status(403).json({ message: 'Access denied: CITY_ADMIN or DEPT_MANAGER role required' });
    }

    const { assignedName, department, assignedToId } = req.body;

    const assignedPersonName = assignedName || assignedToId;
    if (!assignedPersonName || !department) {
      return res.status(400).json({
        message: 'Assigned person name and department are required'
      });
    }

    const { id } = req.params;
    const existingRequest = await findUniqueSafe({
      where: { id: parseId(id) }
    });

    if (!existingRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Try finding user by ID or store name in resolution notes/department
    let validUserId = null;
    try {
      const userMatch = await prisma.user.findFirst({
        where: {
          OR: [
            { id: assignedPersonName },
            { name: { equals: assignedPersonName, mode: 'insensitive' } },
          ],
        },
      });
      if (userMatch) validUserId = userMatch.id;
    } catch (e) {}

    const updateData = {
      department: department,
      status: 'ASSIGNED',
      resolutionNotes: existingRequest.resolutionNotes
        ? `${existingRequest.resolutionNotes} [Assigned to: ${assignedPersonName}]`
        : `[Assigned to: ${assignedPersonName}]`,
    };

    if (validUserId) {
      updateData.assignedToId = validUserId;
    }

    const updatedRequest = await updateSafe({
      where: { id: parseId(id) },
      data: updateData,
    });

    return res.status(200).json(updatedRequest);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getMyRequests = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const requests = await findManySafe({
      where: { submittedById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: true,
        assignee: true
      }
    });

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getDepartmentRequests = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'DEPT_MANAGER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const requests = await findManySafe({
      where: { department: req.user.department },
      orderBy: { createdAt: 'desc' },
      include: {
        submitter: true,
        assignee: true
      }
    });

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getRequestStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'CITY_ADMIN' && req.user.role !== 'DEPT_MANAGER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const where = {};
    if (req.user.role === 'DEPT_MANAGER' && req.user.department) {
      where.department = req.user.department;
    }

    const [requests, totalUsersCount] = await Promise.all([
      getModel().findMany({ where }),
      prisma.user.count(),
    ]);

    const byStatus = {
      SUBMITTED: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0
    };
    const byCategory = {};
    const byPriority = {};

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const r of requests) {
      if (r.status) {
        byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      }
      if (r.category) {
        byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      }
      if (r.priority) {
        byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
      }

      if (r.status === 'RESOLVED' || r.status === 'CLOSED') {
        const resolvedDate = r.resolvedAt ? new Date(r.resolvedAt) : (r.updatedAt ? new Date(r.updatedAt) : null);
        const createdDate = r.createdAt ? new Date(r.createdAt) : null;
        if (resolvedDate && createdDate) {
          totalResolutionTime += resolvedDate.getTime() - createdDate.getTime();
          resolvedCount++;
        }
      }
    }

    const avgResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

    return res.status(200).json({
      total: requests.length,
      totalUsers: totalUsersCount,
      byStatus,
      byCategory,
      byPriority,
      avgResolutionTime
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequestStatus,
  assignRequest,
  getMyRequests,
  getDepartmentRequests,
  getRequestStats
};