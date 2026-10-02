const fs = require('fs');
const path = require('path');

const FLAGS_FILE = path.join(__dirname, '../data/flags.json');

const dir = path.dirname(FLAGS_FILE);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const loadFlagsData = () => {
  try {
    if (!fs.existsSync(FLAGS_FILE)) {
      const initial = { flags: [], blockedItems: [] };
      fs.writeFileSync(FLAGS_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(FLAGS_FILE, 'utf-8'));
  } catch (e) {
    return { flags: [], blockedItems: [] };
  }
};

const saveFlagsData = (data) => {
  fs.writeFileSync(FLAGS_FILE, JSON.stringify(data, null, 2));
};

const submitFlag = ({ itemType, itemId, itemTitle, reason, flaggedBy }) => {
  const data = loadFlagsData();
  const flag = {
    id: 'flag_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    itemType, // 'EVENT' or 'REQUEST'
    itemId,
    itemTitle: itemTitle || 'Untitled Item',
    reason,
    flaggedBy: {
      id: flaggedBy.id,
      name: flaggedBy.name,
      email: flaggedBy.email,
    },
    createdAt: new Date().toISOString(),
    status: 'PENDING', // PENDING, BLOCKED, DISMISSED
  };
  data.flags.unshift(flag);
  saveFlagsData(data);
  return flag;
};

const blockContent = (itemId, itemType) => {
  const data = loadFlagsData();
  const key = `${itemType}:${itemId}`;
  if (!data.blockedItems.includes(key)) {
    data.blockedItems.push(key);
  }
  // update related flag statuses
  data.flags.forEach((f) => {
    if (f.itemId === itemId) {
      f.status = 'BLOCKED';
    }
  });
  saveFlagsData(data);
};

const unblockContent = (itemId, itemType) => {
  const data = loadFlagsData();
  const key = `${itemType}:${itemId}`;
  data.blockedItems = data.blockedItems.filter((k) => k !== key);
  data.flags.forEach((f) => {
    if (f.itemId === itemId) {
      f.status = 'UNBLOCKED';
    }
  });
  saveFlagsData(data);
};

const dismissFlag = (flagId) => {
  const data = loadFlagsData();
  data.flags = data.flags.filter((f) => f.id !== flagId);
  saveFlagsData(data);
};

const getAllFlags = () => {
  return loadFlagsData().flags;
};

const isContentBlocked = (itemId, itemType) => {
  const data = loadFlagsData();
  return data.blockedItems.includes(`${itemType}:${itemId}`);
};

const getBlockedItemKeys = () => {
  return loadFlagsData().blockedItems;
};

module.exports = {
  submitFlag,
  blockContent,
  unblockContent,
  dismissFlag,
  getAllFlags,
  isContentBlocked,
  getBlockedItemKeys,
};
