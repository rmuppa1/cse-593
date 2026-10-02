import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'COMMUNITY_SERVICE', label: 'Community Service' },
  { id: 'SPORTS', label: 'Sports' },
  { id: 'PUBLIC_SAFETY', label: 'Public Safety' },
  { id: 'EDUCATION', label: 'Education' },
  { id: 'ENVIRONMENT', label: 'Environment' },
  { id: 'CULTURAL', label: 'Cultural' },
];

const EventFilters = ({ filters = {}, onFilterChange }) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const selectedCategory = filters.category || '';
  const startDate = filters.startDate || '';
  const endDate = filters.endDate || '';
  const location = filters.location || '';
  const isFree = filters.isFree !== undefined ? filters.isFree : '';
  const sortBy = filters.sortBy || 'date';

  const handleCategoryChange = (catId) => {
    // Single select or toggle
    const newCategory = selectedCategory === catId ? '' : catId;
    onFilterChange({ ...filters, category: newCategory, page: 1 });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value, page: 1 });
  };

  const handleFreeToggle = (value) => {
    onFilterChange({ ...filters, isFree: value, page: 1 });
  };

  const handleClearFilters = () => {
    onFilterChange({
      category: '',
      startDate: '',
      endDate: '',
      location: '',
      isFree: '',
      sortBy: 'date',
      page: 1,
    });
  };

  const activeFiltersCount = [
    selectedCategory,
    startDate,
    endDate,
    location,
    isFree !== '' ? true : false,
    sortBy !== 'date' ? true : false,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      {/* Mobile Toggle Button */}
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setIsOpenMobile((prev) => !prev)}
          className="flex items-center space-x-2 text-gray-700 font-semibold focus:outline-none"
        >
          <svg
            className="w-5 h-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
        </button>

        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpenMobile((prev) => !prev)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${
                isOpenMobile ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Body */}
      <div
        className={`${
          isOpenMobile ? 'block mt-4' : 'hidden'
        } md:block space-y-6 transition-all duration-300`}
      >
        <div className="hidden md:flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center space-x-2">
            <span>Filter Events</span>
            {activeFiltersCount > 0 && (
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                {activeFiltersCount} active
              </span>
            )}
          </h3>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

                {/* Categories Section - Arranged in a vertical line */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Categories
                  </label>
                  <div className="flex flex-col space-y-2">
                    {CATEGORIES.map((category) => {
                      const isChecked = selectedCategory === category.id;
                      return (
                        <label
                          key={category.id}
                          className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg border text-sm font-semibold cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-primary-50 border-primary-600 text-primary-900 shadow-xs'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="category"
                            value={category.id}
                            checked={isChecked}
                            onChange={() => handleCategoryChange(category.id)}
                            className="rounded text-primary-600 focus:ring-primary-500 h-4 w-4 border-gray-300 shrink-0"
                          />
                          <span className="text-gray-800 text-sm">{category.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Start Date, End Date, and Location - Arranged vertically in a line */}
                <div className="flex flex-col space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-semibold text-gray-800 mb-1"
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={startDate}
                      onChange={handleInputChange}
                      className="w-full min-h-[46px] px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-semibold text-gray-800 mb-1"
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={endDate}
                      onChange={handleInputChange}
                      className="w-full min-h-[46px] px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-semibold text-gray-800 mb-1"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={location}
                      placeholder="Filter by location or venue"
                      onChange={handleInputChange}
                      className="w-full min-h-[46px] px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    />
                  </div>
                </div>

        {/* Free/Paid Toggle & Sort By */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-4 border-t border-gray-100">
          <div>
            <span className="block text-sm font-semibold text-gray-800 mb-2">
              Price
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleFreeToggle('')}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  isFree === ''
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Events
              </button>
              <button
                type="button"
                onClick={() => handleFreeToggle('true')}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  isFree === 'true' || isFree === true
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Free Only
              </button>
              <button
                type="button"
                onClick={() => handleFreeToggle('false')}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  isFree === 'false' || isFree === false
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Paid Only
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="sortBy"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              Sort By
            </label>
            <select
              id="sortBy"
              name="sortBy"
              value={sortBy}
              onChange={handleInputChange}
              className="w-full min-h-[44px] px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-xs"
            >
              <option value="date">Date (Upcoming First)</option>
              <option value="-date">Date (Furthest First)</option>
              <option value="-registeredCount">Popularity (Most Registered)</option>
              <option value="-createdAt">Newest Added</option>
            </select>
          </div>
        </div>

        {/* Mobile Clear Button */}
        {activeFiltersCount > 0 && (
          <div className="pt-2 md:hidden">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventFilters;
