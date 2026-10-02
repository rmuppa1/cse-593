import { useState } from 'react';

const CATEGORIES = [
  { value: 'COMMUNITY_SERVICE', label: 'Community Service' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'PUBLIC_SAFETY', label: 'Public Safety' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'ENVIRONMENT', label: 'Environment' },
  { value: 'CULTURAL_ACTIVITIES', label: 'Cultural Activities' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'registeredCount', label: 'Popularity' },
  { value: 'createdAt', label: 'Newest' },
];

const DEFAULT_FILTERS = {
  categories: [],
  startDate: '',
  endDate: '',
  location: '',
  priceType: 'all',
  sortBy: 'date',
};

function EventFilters({ filters = DEFAULT_FILTERS, onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false);

  function update(partial) {
    onFilterChange?.({ ...filters, ...partial });
  }

  function toggleCategory(category) {
    const current = filters.categories || [];
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    update({ categories: next });
  }

  function clearFilters() {
    onFilterChange?.(DEFAULT_FILTERS);
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <button
        className="md:hidden w-full flex justify-between items-center font-semibold text-gray-900"
        onClick={() => setIsOpen((open) => !open)}
      >
        Filters
        <span>{isOpen ? '−' : '+'}</span>
      </button>

      <div className={`${isOpen ? 'block' : 'hidden'} md:block mt-4 md:mt-0 space-y-6`}>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Category</h4>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <label key={cat.value} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(cat.value) || false}
                  onChange={() => toggleCategory(cat.value)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                {cat.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Date Range</h4>
          <div className="flex flex-col gap-2">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => update({ startDate: e.target.value })}
              className="border rounded-md px-2 py-1 text-sm"
            />
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => update({ endDate: e.target.value })}
              className="border rounded-md px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Location</h4>
          <input
            type="text"
            placeholder="Enter location"
            value={filters.location || ''}
            onChange={(e) => update({ location: e.target.value })}
            className="w-full border rounded-md px-2 py-1 text-sm"
          />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Price</h4>
          <div className="flex gap-2 text-sm">
            {['all', 'free', 'paid'].map((option) => (
              <button
                key={option}
                onClick={() => update({ priceType: option })}
                className={`px-3 py-1 rounded-full border capitalize ${
                  filters.priceType === option
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'text-gray-700 border-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Sort By</h4>
          <select
            value={filters.sortBy || 'date'}
            onChange={(e) => update({ sortBy: e.target.value })}
            className="w-full border rounded-md px-2 py-1 text-sm"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="w-full py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}

export default EventFilters;
