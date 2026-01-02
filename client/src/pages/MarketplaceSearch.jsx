import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const MarketplaceSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    city: '',
    area: '',
    budget_min: '',
    budget_max: '',
    gender: '',
    has_food: false,
    has_wifi: false,
    has_ac: false,
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const handleSearch = async (pageNum = 1) => {
    if (!searchParams.city) {
      alert('Please enter a city');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        city: searchParams.city,
        page: pageNum.toString(),
        limit: limit.toString(),
      });

      if (searchParams.area) params.append('area', searchParams.area);
      if (searchParams.budget_min) params.append('budget_min', searchParams.budget_min);
      if (searchParams.budget_max) params.append('budget_max', searchParams.budget_max);
      if (searchParams.gender) params.append('gender', searchParams.gender);
      if (searchParams.has_food) params.append('has_food', 'true');
      if (searchParams.has_wifi) params.append('has_wifi', 'true');
      if (searchParams.has_ac) params.append('has_ac', 'true');

      const response = await api.get(`/api/search/pgs?${params.toString()}`);
      
      if (response.data.success) {
        setResults(response.data.data);
        setTotal(response.data.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to search PGs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(1);
  };

  const viewPGDetail = (pgId) => {
    navigate(`/marketplace/pg/${pgId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Find Your Perfect PG</h1>
              <p className="text-sm text-gray-600 mt-1">Search verified PGs with real-time availability</p>
            </div>
            <Link
              to="/"
              className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm">
          <ol className="flex items-center gap-2 text-gray-600">
            <li><Link to="/" className="hover:text-gray-800">Home</Link></li>
            <li>/</li>
            <li className="text-gray-800 font-medium">Find PG</li>
          </ol>
        </nav>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 sticky top-20">
              <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-800">Search Filters</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    type="text"
                    value={searchParams.city}
                    onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Noida"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Area</label>
                  <input
                    type="text"
                    value={searchParams.area}
                    onChange={(e) => setSearchParams({ ...searchParams, area: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., Sector 44"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Budget (₹)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={searchParams.budget_min}
                      onChange={(e) => setSearchParams({ ...searchParams, budget_min: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={searchParams.budget_max}
                      onChange={(e) => setSearchParams({ ...searchParams, budget_max: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    value={searchParams.gender}
                    onChange={(e) => setSearchParams({ ...searchParams, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Facilities</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchParams.has_food}
                        onChange={(e) => setSearchParams({ ...searchParams, has_food: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Food</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchParams.has_wifi}
                        onChange={(e) => setSearchParams({ ...searchParams, has_wifi: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">WiFi</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchParams.has_ac}
                        onChange={(e) => setSearchParams({ ...searchParams, has_ac: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">AC</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 md:py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </span>
                  ) : (
                    'Search PGs'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!loading && results.length === 0 && page === 1 && (
              <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No PGs Found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search filters or search in a different city.</p>
                <button
                  onClick={() => setSearchParams({ ...searchParams, area: '', budget_min: '', budget_max: '', gender: '', has_food: false, has_wifi: false, has_ac: false })}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm md:text-base text-gray-600">
                      Found <span className="font-semibold text-gray-800">{total}</span> PG{total !== 1 ? 's' : ''} matching your search
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {results.map((pg) => (
                    <div
                      key={pg.pg_id}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                      onClick={() => viewPGDetail(pg.pg_id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{pg.pg_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {pg.area}, {pg.city}
                          </p>
                        </div>
                        {pg.latitude && pg.longitude && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.google.com/maps?q=${pg.latitude},${pg.longitude}`, '_blank');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View on Map
                          </button>
                        )}
                      </div>

                      <p className="text-gray-700 mb-3">{pg.address}</p>

                      {pg.facilities && pg.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {pg.facilities.map((facility, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {facility}
                            </span>
                          ))}
                        </div>
                      )}

                      {pg.rooms && pg.rooms.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">Available Rooms:</h4>
                          <div className="space-y-2">
                            {pg.rooms.map((room) => (
                              <div
                                key={room.room_id}
                                className="flex justify-between items-center p-2 bg-gray-50 rounded"
                              >
                                <div>
                                  <span className="font-medium">{room.room_name}</span>
                                  <span className="text-sm text-gray-600 ml-2">
                                    ({room.gender_type})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold">₹{room.rent_per_bed}/bed</div>
                                  <div className="text-xs text-gray-600">
                                    {room.available_beds} bed{room.available_beds !== 1 ? 's' : ''} available
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewPGDetail(pg.pg_id);
                        }}
                        className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-md hover:bg-blue-700 font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        View Details & Send Inquiry
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {total > limit && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={() => handleSearch(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium"
                    >
                      ← Previous
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{Math.ceil(total / limit)}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleSearch(page + 1)}
                      disabled={page >= Math.ceil(total / limit)}
                      className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSearch;

