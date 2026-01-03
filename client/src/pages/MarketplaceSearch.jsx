import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { SkeletonCard } from '../components/common/Skeleton';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14]">
      {/* Header */}
      <header className="bg-[#0F1720]/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-primary/10">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#E5E7EB]">Find Your Perfect PG</h1>
              <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">Search verified PGs with real-time availability</p>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-[#9CA3AF] hover:text-[#E5E7EB] transition-colors text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Home</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 text-xs sm:text-sm">
          <ol className="flex items-center gap-2 text-[#9CA3AF]">
            <li><Link to="/" className="hover:text-[#E5E7EB] transition-colors">Home</Link></li>
            <li>/</li>
            <li className="text-[#E5E7EB] font-medium">Find PG</li>
          </ol>
        </nav>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 sm:p-5 md:p-6 lg:sticky lg:top-20">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 text-[#E5E7EB]">Search Filters</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-[#E5E7EB]">City *</label>
                  <input
                    type="text"
                    value={searchParams.city}
                    onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
                    placeholder="e.g., Noida"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-[#E5E7EB]">Area</label>
                  <input
                    type="text"
                    value={searchParams.area}
                    onChange={(e) => setSearchParams({ ...searchParams, area: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
                    placeholder="e.g., Sector 44"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-[#E5E7EB]">Budget (₹)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={searchParams.budget_min}
                      onChange={(e) => setSearchParams({ ...searchParams, budget_min: e.target.value })}
                      className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
                      placeholder="Min"
                    />
                    <input
                      type="number"
                      value={searchParams.budget_max}
                      onChange={(e) => setSearchParams({ ...searchParams, budget_max: e.target.value })}
                      className="w-full px-3 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-[#E5E7EB]">Gender</label>
                  <select
                    value={searchParams.gender}
                    onChange={(e) => setSearchParams({ ...searchParams, gender: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:border-[#22D3EE] bg-[#0B0F14] text-[#E5E7EB] transition-all text-sm"
                  >
                    <option value="" className="bg-[#0B0F14] text-[#E5E7EB]">Any</option>
                    <option value="male" className="bg-[#0B0F14] text-[#E5E7EB]">Male</option>
                    <option value="female" className="bg-[#0B0F14] text-[#E5E7EB]">Female</option>
                    <option value="unisex" className="bg-[#0B0F14] text-[#E5E7EB]">Unisex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2 text-[#E5E7EB]">Facilities</label>
                  <div className="space-y-2">
                    <label className="flex items-center p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchParams.has_food}
                        onChange={(e) => setSearchParams({ ...searchParams, has_food: e.target.checked })}
                        className="mr-2 w-4 h-4 accent-[#22D3EE]"
                      />
                      <span className="text-xs sm:text-sm text-[#E5E7EB]">Food</span>
                    </label>
                    <label className="flex items-center p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchParams.has_wifi}
                        onChange={(e) => setSearchParams({ ...searchParams, has_wifi: e.target.checked })}
                        className="mr-2 w-4 h-4 accent-[#22D3EE]"
                      />
                      <span className="text-xs sm:text-sm text-[#E5E7EB]">WiFi</span>
                    </label>
                    <label className="flex items-center p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchParams.has_ac}
                        onChange={(e) => setSearchParams({ ...searchParams, has_ac: e.target.checked })}
                        className="mr-2 w-4 h-4 accent-[#22D3EE]"
                      />
                      <span className="text-xs sm:text-sm text-[#E5E7EB]">AC</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#14B8A6] text-white py-2.5 sm:py-3 rounded-lg hover:bg-[#2DD4BF] disabled:opacity-50 font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
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
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <SkeletonCard key={idx} showHeader={true} lines={4} showButton={true} />
                ))}
              </div>
            )}

            {!loading && results.length === 0 && page === 1 && (
              <div className="bg-[#0F1720] border border-primary/10 rounded-lg p-6 sm:p-8 md:p-12 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#22D3EE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#E5E7EB] mb-2">No PGs Found</h3>
                <p className="text-sm sm:text-base text-[#9CA3AF] mb-4">Try adjusting your search filters or search in a different city.</p>
                <button
                  onClick={() => setSearchParams({ ...searchParams, area: '', budget_min: '', budget_max: '', gender: '', has_food: false, has_wifi: false, has_ac: false })}
                  className="text-[#22D3EE] hover:text-[#1FB6C1] font-semibold transition-colors text-sm sm:text-base"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm md:text-base text-[#9CA3AF]">
                      Found <span className="font-semibold text-[#E5E7EB]">{total}</span> PG{total !== 1 ? 's' : ''} matching your search
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {results.map((pg) => (
                    <div
                      key={pg.pg_id}
                      className="bg-[#0F1720] border border-primary/10 rounded-lg p-4 sm:p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
                      onClick={() => viewPGDetail(pg.pg_id)}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-[#E5E7EB]">{pg.pg_name}</h3>
                          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
                            {pg.area}, {pg.city}
                          </p>
                        </div>
                        {pg.latitude && pg.longitude && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.google.com/maps?q=${pg.latitude},${pg.longitude}`, '_blank');
                            }}
                            className="text-[#22D3EE] hover:text-[#1FB6C1] text-xs sm:text-sm transition-colors whitespace-nowrap"
                          >
                            View on Map
                          </button>
                        )}
                      </div>

                      <p className="text-[#E5E7EB] mb-3 text-sm sm:text-base">{pg.address}</p>

                      {pg.facilities && pg.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {pg.facilities.map((facility, idx) => (
                            <span
                              key={idx}
                              className="px-2 sm:px-3 py-1 bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30 text-xs sm:text-sm rounded-lg font-medium"
                            >
                              {facility}
                            </span>
                          ))}
                        </div>
                      )}

                      {pg.rooms && pg.rooms.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs sm:text-sm font-semibold mb-2 text-[#E5E7EB]">Available Rooms:</h4>
                          <div className="space-y-2">
                            {pg.rooms.map((room) => (
                              <div
                                key={room.room_id}
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-3 bg-[#0B0F14] border border-primary/10 rounded-lg"
                              >
                                <div>
                                  <span className="font-medium text-[#E5E7EB] text-sm sm:text-base">{room.room_name}</span>
                                  <span className="text-xs sm:text-sm text-[#9CA3AF] ml-2">
                                    ({room.gender_type})
                                  </span>
                                </div>
                                <div className="text-left sm:text-right mt-1 sm:mt-0">
                                  <div className="font-semibold text-[#22D3EE] text-sm sm:text-base">₹{room.rent_per_bed}/bed</div>
                                  <div className="text-xs text-[#9CA3AF]">
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
                        className="mt-4 w-full bg-[#14B8A6] text-white py-2.5 sm:py-3 rounded-lg hover:bg-[#2DD4BF] font-semibold transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                      >
                        View Details & Send Inquiry
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {total > limit && (
                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <button
                      onClick={() => handleSearch(page - 1)}
                      disabled={page === 1}
                      className="w-full sm:w-auto px-4 py-2 border border-primary/20 rounded-lg bg-[#0B0F14] text-[#E5E7EB] hover:bg-[#0F1720] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                      ← Previous
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-[#9CA3AF]">
                        Page <span className="font-semibold text-[#E5E7EB]">{page}</span> of <span className="font-semibold text-[#E5E7EB]">{Math.ceil(total / limit)}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => handleSearch(page + 1)}
                      disabled={page >= Math.ceil(total / limit)}
                      className="w-full sm:w-auto px-4 py-2 border border-primary/20 rounded-lg bg-[#0B0F14] text-[#E5E7EB] hover:bg-[#0F1720] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
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

