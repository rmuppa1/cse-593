const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');
const {
  submitFlag,
  blockContent,
  unblockContent,
  dismissFlag,
  getAllFlags,
} = require('../services/flagService');

// Submit flag for event or request (Any authenticated user)
router.post('/', authenticate, (req, res) => {
  try {
    const { itemType, itemId, itemTitle, reason } = req.body;
    if (!itemType || !itemId || !reason) {
      return res.status(400).json({ message: 'itemType, itemId, and reason are required' });
    }
    const flag = submitFlag({
      itemType,
      itemId,
      itemTitle,
      reason,
      flaggedBy: {
        id: req.user.id,
        name: req.user.name || 'Citizen',
        email: req.user.email,
      },
    });
    return res.status(201).json({ message: 'Flag reported to city administration.', flag });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Admin endpoints
router.get('/', authenticate, isAdmin, (req, res) => {
  const flags = getAllFlags();
  return res.status(200).json({ flags });
});

router.post('/block', authenticate, isAdmin, (req, res) => {
  const { itemId, itemType } = req.body;
  if (!itemId || !itemType) {
    return res.status(400).json({ message: 'itemId and itemType are required' });
  }
  blockContent(itemId, itemType);
  return res.status(200).json({ message: `Content ${itemType}:${itemId} blocked successfully` });
});

router.post('/unblock', authenticate, isAdmin, (req, res) => {
  const { itemId, itemType } = req.body;
  if (!itemId || !itemType) {
    return res.status(400).json({ message: 'itemId and itemType are required' });
  }
  unblockContent(itemId, itemType);
  return res.status(200).json({ message: `Content ${itemType}:${itemId} unblocked successfully` });
});

router.post('/dismiss', authenticate, isAdmin, (req, res) => {
  const { flagId } = req.body;
  if (!flagId) {
    return res.status(400).json({ message: 'flagId is required' });
  }
  dismissFlag(flagId);
  return res.status(200).json({ message: 'Flag dismissed' });
});

module.exports = router;
