const CATEGORY_STYLES = {
  COMMUNITY_SERVICE: 'bg-secondary-100 text-secondary-800',
  SPORTS: 'bg-orange-100 text-orange-800',
  PUBLIC_SAFETY: 'bg-red-100 text-red-800',
  EDUCATION: 'bg-primary-100 text-primary-800',
  ENVIRONMENT: 'bg-green-100 text-green-800',
  CULTURAL_ACTIVITIES: 'bg-purple-100 text-purple-800',
};

function formatCategory(category) {
  return category
    ?.toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDateTime(date) {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function EventCard({ event, onRegister, onFlag }) {
  const {
    title,
    description,
    category,
    date,
    location,
    isFree,
    price,
    capacity,
    registeredCount = 0,
    imageUrl,
  } = event;

  const isFull = capacity != null && registeredCount >= capacity;
  const categoryStyle = CATEGORY_STYLES[category] || 'bg-gray-100 text-gray-800';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:shadow-xl hover:-translate-y-1">
      <div className="h-40 w-full bg-gray-200 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm">No image available</span>
        )}
      </div>

      <div className="p-4 space-y-2">
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${categoryStyle}`}>
          {formatCategory(category)}
        </span>

        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{title}</h3>
        {description && <p className="text-sm text-gray-500 line-clamp-2">{description}</p>}

        <div className="text-sm text-gray-600 space-y-1">
          <p>{formatDateTime(date)}</p>
          <p className="truncate"><span className="font-medium">Location:</span> {location}</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-gray-900">
            {isFree ? 'Free' : `$${Number(price).toFixed(2)}`}
          </span>
          {capacity != null && (
            <span className="text-xs text-gray-500">
              {registeredCount}/{capacity} spots filled
            </span>
          )}
        </div>

        <button
          onClick={() => onRegister?.(event)}
          disabled={isFull}
          className={`w-full mt-2 py-2 rounded-md text-sm font-medium transition-colors ${
            isFull
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isFull ? 'Event Full' : 'Register'}
        </button>

        {onFlag && (
          <button
            onClick={() => onFlag(event)}
            className="w-full text-xs text-gray-400 hover:text-red-600"
          >
            Flag inappropriate content
          </button>
        )}
      </div>
    </div>
  );
}

export default EventCard;
