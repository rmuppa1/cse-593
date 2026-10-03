export const EVENT_CATEGORIES = {
  COMMUNITY_SERVICE: { label: 'Community Service', icon: '🤝', color: 'bg-amber-100 text-amber-800' },
  SPORTS: { label: 'Sports', icon: '⚽', color: 'bg-green-100 text-green-800' },
  PUBLIC_SAFETY: { label: 'Public Safety', icon: '🚒', color: 'bg-red-100 text-red-800' },
  EDUCATION: { label: 'Education', icon: '📚', color: 'bg-blue-100 text-blue-800' },
  ENVIRONMENT: { label: 'Environment', icon: '🌳', color: 'bg-emerald-100 text-emerald-800' },
  CULTURAL: { label: 'Cultural Activities', icon: '🎭', color: 'bg-purple-100 text-purple-800' },
};

export const REQUEST_TYPES = {
  STREETLIGHT: { label: 'Broken Streetlight', icon: '💡' },
  POTHOLE: { label: 'Pothole', icon: '🕳️' },
  GRAFFITI: { label: 'Graffiti', icon: '🎨' },
  WATER_LEAK: { label: 'Water Leak', icon: '💧' },
  NOISE: { label: 'Noise Complaint', icon: '🔊' },
  OTHER: { label: 'Other', icon: '📋' },
};

export const STATUSES = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejected', color: 'bg-slate-200 text-slate-700' },
};

export const PRIORITIES = {
  LOW: { label: 'Low', color: 'bg-slate-100 text-slate-700' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'High', color: 'bg-red-100 text-red-800' },
};

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
export const fmtTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const DEPARTMENTS = {
  PUBLIC_WORKS: { label: 'Public Works' },
  WATER_UTILITIES: { label: 'Water & Utilities' },
  PARKS_SANITATION: { label: 'Parks & Sanitation' },
  PUBLIC_SAFETY: { label: 'Public Safety & Noise' },
};
