const { PrismaClient } = require('@prisma/client');
const { getBlockedItemKeys } = require('../services/flagService');

const prisma = new PrismaClient();

// In-memory registration tracker fallback if no EventRegistration table in Prisma schema
// Stores key: `${eventId}_${userId}` -> timestamp
const eventRegistrations = new Set();

const VALID_CATEGORIES = [
  'COMMUNITY_SERVICE',
  'SPORTS',
  'PUBLIC_SAFETY',
  'EDUCATION',
  'ENVIRONMENT',
  'CULTURAL'
];

const VALID_STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];

/**
 * 1. getAllEvents (GET /api/events)
 * - Support query params: category, startDate, endDate, location, isFree, sortBy, page, limit
 * - Filter by category (enum)
 * - Filter by date range
 * - Filter by location (contains)
 * - Filter by isFree (boolean)
 * - Sort by: date, registeredCount, createdAt
 * - Pagination: default page=1, limit=10
 * - Return: { events, total, page, totalPages }
 */
const getAllEvents = async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      location,
      isFree,
      sortBy,
      page = 1,
      limit = 10
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // Build filter where clause
    const where = {};

    // Filter by category (enum)
    if (category) {
      if (VALID_CATEGORIES.includes(category.toUpperCase())) {
        where.category = category.toUpperCase();
      } else {
        return res.status(400).json({
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
        });
      }
    }

    // Filter by date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          return res.status(400).json({ message: 'Invalid startDate format' });
        }
        where.date.gte = parsedStartDate;
      }
      if (endDate) {
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return res.status(400).json({ message: 'Invalid endDate format' });
        }
        where.date.lte = parsedEndDate;
      }
    }

    // Filter by location (contains, case-insensitive)
    if (location && typeof location === 'string') {
      where.location = {
        contains: location.trim(),
        mode: 'insensitive'
      };
    }

    // Filter by isFree (boolean)
    if (isFree !== undefined) {
      if (isFree === 'true' || isFree === true) {
        where.isFree = true;
      } else if (isFree === 'false' || isFree === false) {
        where.isFree = false;
      }
    }

    // Sort options: date, registeredCount, createdAt
    let orderBy = { date: 'asc' };
    if (sortBy) {
      const allowedSortFields = ['date', 'registeredCount', 'createdAt'];
      const sortField = sortBy.startsWith('-') ? sortBy.substring(1) : sortBy;
      const sortOrder = sortBy.startsWith('-') ? 'desc' : 'asc';

      if (allowedSortFields.includes(sortField)) {
        orderBy = { [sortField]: sortOrder };
      }
    }

        const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.event.count({ where })
    ]);

    // Filter out items blocked by admin unless requester is CITY_ADMIN
    const blockedKeys = new Set(getBlockedItemKeys());
    const filteredEvents =
      req.user?.role === 'CITY_ADMIN'
        ? events
        : events.filter((ev) => !blockedKeys.has(`EVENT:${ev.id}`));

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      events: filteredEvents,
      total: filteredEvents.length,
      page: parsedPage,
      totalPages
    });
  } catch (error) {
    console.error('Error in getAllEvents:', error);
    return res.status(500).json({
      message: 'Internal server error fetching events',
      error: error.message
    });
  }
};

/**
 * 2. getEventById (GET /api/events/:id)
 * - Find event by id
 * - Include creator info (name, email)
 * - Return 404 if not found
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    return res.status(200).json(event);
  } catch (error) {
    console.error('Error in getEventById:', error);
    return res.status(500).json({
      message: 'Internal server error fetching event',
      error: error.message
    });
  }
};

/**
 * 3. createEvent (POST /api/events)
 * - Requires: CITY_ADMIN role (handled by middleware or explicit check)
 * - Validate: title, description, category, date, location, capacity
 * - Create event with createdById = req.user.id
 * - Return created event
 */
const createEvent = async (req, res) => {
  try {
    // Role check verification
    if (!req.user || req.user.role !== 'CITY_ADMIN') {
      return res.status(403).json({ message: 'Access denied: CITY_ADMIN role required' });
    }

    const {
      title,
      description,
      category,
      date,
      endDate,
      location,
      capacity,
      isFree,
      price,
      imageUrl,
      status
    } = req.body;

    const errors = [];

    if (!title || typeof title !== 'string' || title.trim() === '') {
      errors.push('Title is required');
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
      errors.push('Description is required');
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      errors.push(`Category is required and must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (!date) {
      errors.push('Date is required');
    } else if (isNaN(new Date(date).getTime())) {
      errors.push('Date must be a valid date');
    }

    if (!location || typeof location !== 'string' || location.trim() === '') {
      errors.push('Location is required');
    }

    const parsedCapacity = parseInt(capacity, 10);
    if (capacity === undefined || capacity === null || isNaN(parsedCapacity) || parsedCapacity <= 0) {
      errors.push('Capacity is required and must be a positive integer');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    const parsedDate = new Date(date);
    let parsedEndDate = null;
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ message: 'endDate must be a valid date' });
      }
    }

    const eventStatus = status && VALID_STATUSES.includes(status) ? status : 'UPCOMING';

    const newEvent = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        date: parsedDate,
        endDate: parsedEndDate,
        location: location.trim(),
        capacity: parsedCapacity,
        registeredCount: 0,
        isFree: isFree !== undefined ? Boolean(isFree) : true,
        price: price !== undefined && price !== null ? parseFloat(price) : null,
        imageUrl: imageUrl || null,
        status: eventStatus,
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error in createEvent:', error);
    return res.status(500).json({
      message: 'Internal server error creating event',
      error: error.message
    });
  }
};

/**
 * 4. updateEvent (PUT /api/events/:id)
 * - Requires: CITY_ADMIN role
 * - Find and update event
 * - Return updated event
 */
const updateEvent = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'CITY_ADMIN') {
      return res.status(403).json({ message: 'Access denied: CITY_ADMIN role required' });
    }

    const { id } = req.params;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const {
      title,
      description,
      category,
      date,
      endDate,
      location,
      capacity,
      isFree,
      price,
      imageUrl,
      status
    } = req.body;

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: 'Description cannot be empty' });
      }
      updateData.description = description.trim();
    }

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
        });
      }
      updateData.category = category;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      updateData.date = parsedDate;
    }

    if (endDate !== undefined) {
      if (endDate === null) {
        updateData.endDate = null;
      } else {
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return res.status(400).json({ message: 'Invalid endDate format' });
        }
        updateData.endDate = parsedEndDate;
      }
    }

    if (location !== undefined) {
      if (typeof location !== 'string' || location.trim() === '') {
        return res.status(400).json({ message: 'Location cannot be empty' });
      }
      updateData.location = location.trim();
    }

    if (capacity !== undefined) {
      const parsedCapacity = parseInt(capacity, 10);
      if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
        return res.status(400).json({ message: 'Capacity must be a positive integer' });
      }
      if (parsedCapacity < existingEvent.registeredCount) {
        return res.status(400).json({
          message: `Capacity cannot be lower than the current registered count (${existingEvent.registeredCount})`
        });
      }
      updateData.capacity = parsedCapacity;
    }

    if (isFree !== undefined) {
      updateData.isFree = Boolean(isFree);
    }

    if (price !== undefined) {
      updateData.price = price !== null ? parseFloat(price) : null;
    }

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: `Status must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }
      updateData.status = status;
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error in updateEvent:', error);
    return res.status(500).json({
      message: 'Internal server error updating event',
      error: error.message
    });
  }
};

/**
 * 5. deleteEvent (DELETE /api/events/:id)
 * - Requires: CITY_ADMIN role
 * - Delete event
 * - Return success message
 */
const deleteEvent = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'CITY_ADMIN') {
      return res.status(403).json({ message: 'Access denied: CITY_ADMIN role required' });
    }

    const { id } = req.params;

    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await prisma.event.delete({
      where: { id }
    });

    // Clean up in-memory registrations for this event
    for (const key of eventRegistrations) {
      if (key.startsWith(`${id}_`)) {
        eventRegistrations.delete(key);
      }
    }

    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error in deleteEvent:', error);
    return res.status(500).json({
      message: 'Internal server error deleting event',
      error: error.message
    });
  }
};

/**
 * 6. registerForEvent (POST /api/events/:id/register)
 * - Requires: authentication
 * - Check if event exists
 * - Check if event is full (registeredCount >= capacity)
 * - Check if user already registered
 * - Increment registeredCount
 * - Return success
 */
const registerForEvent = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { id } = req.params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is cancelled or completed
    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      return res.status(400).json({
        message: `Cannot register for an event that is ${event.status.toLowerCase()}`
      });
    }

    // Check if user already registered
    const registrationKey = `${id}_${userId}`;
    let alreadyRegistered = false;

    if (prisma.eventRegistration) {
      const existingDbReg = await prisma.eventRegistration.findFirst({
        where: {
          eventId: id,
          userId: userId
        }
      });
      if (existingDbReg) {
        alreadyRegistered = true;
      }
    } else {
      alreadyRegistered = eventRegistrations.has(registrationKey);
    }

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'User is already registered for this event' });
    }

    // Check if event is full (registeredCount >= capacity)
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ message: 'Event is full' });
    }

    // Increment registeredCount and persist registration
    if (prisma.eventRegistration) {
      await prisma.$transaction([
        prisma.eventRegistration.create({
          data: {
            eventId: id,
            userId: userId
          }
        }),
        prisma.event.update({
          where: { id },
          data: {
            registeredCount: {
              increment: 1
            }
          }
        })
      ]);
    } else {
      await prisma.event.update({
        where: { id },
        data: {
          registeredCount: {
            increment: 1
          }
        }
      });
      eventRegistrations.add(registrationKey);
    }

    return res.status(200).json({
      message: 'Successfully registered for the event',
      eventId: id,
      registeredCount: event.registeredCount + 1
    });
  } catch (error) {
    console.error('Error in registerForEvent:', error);
    return res.status(500).json({
      message: 'Internal server error registering for event',
      error: error.message
    });
  }
};

/**
 * 7. getEventCategories (GET /api/events/categories)
 * - Return list of all categories with counts
 */
const getEventCategories = async (req, res) => {
  try {
    const groupedCounts = await prisma.event.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });

    const countsMap = {};
    groupedCounts.forEach((group) => {
      countsMap[group.category] = group._count.category;
    });

    // Ensure all defined categories are present even if count is 0
    const categoriesWithCounts = VALID_CATEGORIES.map((cat) => ({
      category: cat,
      count: countsMap[cat] || 0
    }));

    return res.status(200).json({
      categories: categoriesWithCounts
    });
  } catch (error) {
    console.error('Error in getEventCategories:', error);
    return res.status(500).json({
      message: 'Internal server error fetching categories',
      error: error.message
    });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getEventCategories
};
