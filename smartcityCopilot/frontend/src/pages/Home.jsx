import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import eventService from '../services/eventService';
import EventCard from '../components/Events/EventCard.jsx';

const HOW_IT_WORKS = [
  {
    title: 'Discover Events',
    description: 'Browse community events by category, date, and location to find what matters to you.',
    icon: '📅',
  },
  {
    title: 'Report Issues',
    description: 'Submit service requests for streetlights, potholes, and other city issues in minutes.',
    icon: '📝',
  },
  {
    title: 'Stay Informed',
    description: 'Track the status of your requests and stay engaged with local government.',
    icon: '🔔',
  },
];

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventService
      .getAllEvents({ sortBy: 'date', limit: 4 })
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold">Welcome to SmartCity Hub</h1>
          <p className="mt-4 text-lg text-primary-100">
            Your gateway to city services and community engagement
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/events"
              className="bg-white text-primary-600 px-6 py-3 rounded-md font-semibold hover:bg-gray-100"
            >
              Browse Events
            </Link>
            <Link
              to="/report"
              className="bg-primary-700 text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-800"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Events</h2>
          <Link to="/events" className="text-primary-600 hover:text-primary-700 font-medium">
            View All Events
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-gray-500">No upcoming events yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-primary-600">{events.length}+</p>
            <p className="text-gray-600 mt-1">Total Events</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-secondary-600">1,200+</p>
            <p className="text-gray-600 mt-1">Requests Resolved</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-accent-500">5,000+</p>
            <p className="text-gray-600 mt-1">Active Users</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.title} className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="text-gray-500 mt-2 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
