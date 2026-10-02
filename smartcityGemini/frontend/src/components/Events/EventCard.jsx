import React from 'react';

const categoryStyles = {
  COMMUNITY_SERVICE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  SPORTS: 'bg-sky-100 text-sky-800 border-sky-300',
  PUBLIC_SAFETY: 'bg-rose-100 text-rose-800 border-rose-300',
  EDUCATION: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  ENVIRONMENT: 'bg-green-100 text-green-800 border-green-300',
  CULTURAL: 'bg-purple-100 text-purple-800 border-purple-300',
  DEFAULT: 'bg-gray-100 text-gray-800 border-gray-300',
};

const formatCategory = (category) => {
  if (!category) return 'General';
  return category
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date TBD';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const EventCard = ({ event, onRegister, onFlag }) => {
  if (!event) return null;

  const {
    id,
    title = 'Untitled Event',
    category,
    date,
    location = 'Location TBD',
    isFree = true,
    price,
    capacity = 0,
    registeredCount = 0,
    imageUrl,
  } = event;

  const isFull = capacity > 0 && registeredCount >= capacity;
  const badgeClass =
    categoryStyles[category] || categoryStyles.DEFAULT;

  const displayPrice = isFree || !price || price === 0 ? 'Free' : `$${Number(price).toFixed(2)}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Event image or placeholder */}
      <div className="relative w-full h-48 bg-gradient-to-tr from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white px-4 text-center">
            <svg
              className="w-12 h-12 mb-2 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium tracking-wide uppercase">SmartCity Event</span>
          </div>
        )}

        {/* Category badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm ${badgeClass}`}
        >
          {formatCategory(category)}
        </span>

        {/* Flag button */}
        {onFlag && (
          <button
            type="button"
            title="Flag inappropriate event content"
            onClick={(e) => {
              e.stopPropagation();
              onFlag(event);
            }}
            className="absolute bottom-3 right-3 p-1.5 bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
              />
            </svg>
          </button>
        )}

        {/* Price tag */}
        <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm">
          {displayPrice}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 hover:text-primary-600 transition-colors">
            {title}
          </h3>

          <div className="mt-3 space-y-2 text-sm text-gray-600">
            {/* Date & Time */}
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-primary-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="truncate">{formatDate(date)}</span>
            </div>

            {/* Location */}
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4 text-primary-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>

        {/* Footer info & Register button */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{registeredCount}</span> /{' '}
            <span>{capacity} spots filled</span>
            {isFull && (
              <span className="block text-red-500 font-semibold mt-0.5">Event Full</span>
            )}
          </div>

          <button
            type="button"
            disabled={isFull}
            onClick={() => onRegister && onRegister(event || id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isFull
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-primary-600 hover:bg-primary-700 text-white shadow hover:shadow-md focus:ring-primary-500 active:bg-primary-800'
            }`}
          >
            {isFull ? 'Sold Out' : 'Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
