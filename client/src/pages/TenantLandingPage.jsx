import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getFullUrl } from '../utils/api';

const TenantLandingPage = () => {
  const navigate = useNavigate();

  // Marketplace search state
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
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const searchLimit = 10;

  // Autocomplete suggestions state
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [areaSuggestions, setAreaSuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Fetch search suggestions
  const fetchSuggestions = async (query, type = 'both') => {
    if (!query || query.trim().length < 2) {
      if (type === 'city' || type === 'both') setCitySuggestions([]);
      if (type === 'area' || type === 'both') setAreaSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const response = await api.get(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        if (type === 'city' || type === 'both') {
          setCitySuggestions(response.data.suggestions.cities || []);
        }
        if (type === 'area' || type === 'both') {
          setAreaSuggestions(response.data.suggestions.areas || []);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchParams.city && searchParams.city.length >= 2) {
        fetchSuggestions(searchParams.city, 'city');
        setShowCitySuggestions(true);
      } else {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchParams.city]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchParams.area && searchParams.area.length >= 2) {
        fetchSuggestions(searchParams.area, 'area');
        setShowAreaSuggestions(true);
      } else {
        setAreaSuggestions([]);
        setShowAreaSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchParams.area]);

  const handleMarketplaceSearch = async (pageNum = 1) => {
    if (!searchParams.city) {
      alert('Please enter a city');
      return;
    }

    setSearchLoading(true);
    setShowCitySuggestions(false);
    setShowAreaSuggestions(false);
    try {
      const params = new URLSearchParams({
        city: searchParams.city,
        page: pageNum.toString(),
        limit: searchLimit.toString(),
      });

      if (searchParams.area) params.append('area', searchParams.area);
      if (searchParams.budget_min) params.append('budget_min', searchParams.budget_min);
      if (searchParams.budget_max) params.append('budget_max', searchParams.budget_max);
      if (searchParams.gender) params.append('gender', searchParams.gender);
      if (searchParams.has_food) params.append('has_food', 'true');
      if (searchParams.has_wifi) params.append('has_wifi', 'true');
      if (searchParams.has_ac) params.append('has_ac', 'true');

      const response = await api.get(`/api/search/pgs?${params.toString()}`);
      
      if (response.data && response.data.success) {
        const results = response.data.data || [];
        const total = response.data.total || 0;
        
        setSearchResults(results);
        setSearchTotal(total);
        setSearchPage(pageNum);
        setHasSearched(true);
        
        setTimeout(() => {
          const resultsElement = document.getElementById('search-results');
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        setSearchResults([]);
        setSearchTotal(0);
        setHasSearched(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSearchTotal(0);
      setHasSearched(true);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to search PGs. Please try again.';
      alert(errorMessage);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleMarketplaceSearch(1);
  };

  const IconCheck = () => (
    <svg className="w-5 h-5 text-[#22D3EE] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const IconArrowRight = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );

  const IconSearch = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const IconMapPin = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const IconShield = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const IconClock = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0F1720] to-[#0B0F14]">
      {/* Header */}
      <header className="bg-[#0F1720]/95 backdrop-blur-md sticky top-0 z-50 shadow-lg border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex justify-between items-center min-h-[56px] sm:min-h-[64px]">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-sm sm:text-base">PG</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[#E5E7EB]">Pilot</span>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Link
              to="/for-owners"
              className="px-4 sm:px-5 py-2 sm:py-2.5 text-[#E5E7EB] hover:text-[#22D3EE] transition-colors font-semibold text-sm sm:text-base"
            >
              I'm a PG Owner
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-28 lg:py-32 text-center">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 sm:mb-6 md:mb-8 leading-[1.1] sm:leading-tight">
            <span className="text-[#E5E7EB] block mb-1 sm:mb-2">Find Your Perfect</span>
            <span className="text-[#22D3EE] block">PG in Minutes</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#D1D5DB] mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
            Search verified PGs with real-time availability. Filter by location, budget, facilities, and more. 
            Connect directly with PG owners — 100% free for tenants.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8">
            <button
              onClick={() => {
                const marketplaceSection = document.getElementById('marketplace-section');
                if (marketplaceSection) {
                  marketplaceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 md:px-10 py-3.5 sm:py-4 bg-[#14B8A6] text-white rounded-lg hover:bg-[#2DD4BF] transition-all text-sm sm:text-base md:text-lg font-semibold shadow-lg hover:shadow-xl active:scale-95"
            >
              Start Searching Now
              <IconArrowRight />
            </button>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-[#9CA3AF]">
            100% Free · No Signup Required · Real-time Availability
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative w-full py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 text-center">
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">2000+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Rooms Available</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">across verified PGs</div>
            </div>
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">25+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Cities</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">across India</div>
            </div>
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">5000+</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Active Tenants</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">using our platform</div>
            </div>
            <div className="px-2">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-2 sm:mb-3">100%</div>
              <div className="text-[#E5E7EB] font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-2">Free</div>
              <div className="text-[#D1D5DB] text-xs sm:text-sm leading-relaxed">no charges for tenants</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <p className="text-xs sm:text-sm md:text-base font-semibold text-[#1FB6C1] uppercase tracking-wider mb-2 sm:mb-3">Why Choose Us</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#E5E7EB] mb-4 sm:mb-6 leading-tight px-2">
              The Best Way to Find Your PG
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#D1D5DB] max-w-3xl mx-auto px-2">
              Everything you need to find your perfect PG, all in one place.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-[#0F1720] p-6 sm:p-8 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl">
              <div className="w-14 h-14 bg-[#22D3EE]/10 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <IconSearch className="w-7 h-7 text-[#22D3EE]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#E5E7EB] mb-3">Powerful Search</h3>
              <p className="text-[#D1D5DB] text-sm sm:text-base leading-relaxed">
                Search by city, area, budget, gender, and facilities. Find exactly what you're looking for in seconds.
              </p>
            </div>

            <div className="bg-[#0F1720] p-6 sm:p-8 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl">
              <div className="w-14 h-14 bg-[#22D3EE]/10 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <IconShield className="w-7 h-7 text-[#22D3EE]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#E5E7EB] mb-3">Verified Listings</h3>
              <p className="text-[#D1D5DB] text-sm sm:text-base leading-relaxed">
                All PGs are verified by our team. View detailed profiles with photos, amenities, and real-time availability.
              </p>
            </div>

            <div className="bg-[#0F1720] p-6 sm:p-8 rounded-xl border border-primary/10 hover:border-primary/30 transition-all shadow-lg hover:shadow-xl">
              <div className="w-14 h-14 bg-[#22D3EE]/10 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <IconClock className="w-7 h-7 text-[#22D3EE]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#E5E7EB] mb-3">Real-time Availability</h3>
              <p className="text-[#D1D5DB] text-sm sm:text-base leading-relaxed">
                See which rooms and beds are available right now. No more calling to check availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section id="marketplace-section" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <p className="text-xs sm:text-sm md:text-base font-semibold text-[#1FB6C1] uppercase tracking-wider mb-2 sm:mb-3">PG Marketplace</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#E5E7EB] mb-4 sm:mb-6 leading-tight">
                Search for Your Perfect PG
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#D1D5DB] max-w-3xl mx-auto px-2">
                Use our powerful search to find verified PGs. Filter by location, budget, facilities, and more.
              </p>
            </div>

            {/* Search Form */}
            <div className="bg-[#0F1720] rounded-xl shadow-xl border border-primary/10 p-4 sm:p-5 md:p-6 mb-8 sm:mb-10">
              <form onSubmit={handleSearchSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="relative">
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#E5E7EB]">City *</label>
                    <input
                      type="text"
                      value={searchParams.city}
                      onChange={(e) => {
                        setSearchParams({ ...searchParams, city: e.target.value });
                        setShowCitySuggestions(true);
                      }}
                      onFocus={() => {
                        if (citySuggestions.length > 0) setShowCitySuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowCitySuggestions(false), 200);
                      }}
                      className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="e.g., Noida"
                      required
                    />
                    {showCitySuggestions && citySuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-[#0F1720] border border-primary/20 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {citySuggestions.map((city, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchParams({ ...searchParams, city });
                              setShowCitySuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[#E5E7EB] hover:bg-[#0B0F14] focus:bg-[#0B0F14] focus:outline-none border-b border-primary/20 last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <IconMapPin className="w-4 h-4 text-[#9CA3AF]" />
                              <span>{city}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#E5E7EB]">Area</label>
                    <input
                      type="text"
                      value={searchParams.area}
                      onChange={(e) => {
                        setSearchParams({ ...searchParams, area: e.target.value });
                        setShowAreaSuggestions(true);
                      }}
                      onFocus={() => {
                        if (areaSuggestions.length > 0) setShowAreaSuggestions(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowAreaSuggestions(false), 200);
                      }}
                      className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="e.g., Sector 44"
                    />
                    {showAreaSuggestions && areaSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-[#0F1720] border border-primary/20 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {areaSuggestions.map((area, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchParams({ ...searchParams, area });
                              setShowAreaSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-[#E5E7EB] hover:bg-[#0B0F14] focus:bg-[#0B0F14] focus:outline-none border-b border-primary/20 last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <IconMapPin className="w-4 h-4 text-[#9CA3AF]" />
                              <span>{area}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#E5E7EB]">Budget (₹)</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <input
                        type="number"
                        value={searchParams.budget_min}
                        onChange={(e) => setSearchParams({ ...searchParams, budget_min: e.target.value })}
                        className="w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={searchParams.budget_max}
                        onChange={(e) => setSearchParams({ ...searchParams, budget_max: e.target.value })}
                        className="w-full px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 text-[#E5E7EB]">Gender</label>
                    <select
                      value={searchParams.gender}
                      onChange={(e) => setSearchParams({ ...searchParams, gender: e.target.value })}
                      className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-primary/20 bg-[#0B0F14] text-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="">Any</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <label className="flex items-center text-xs sm:text-sm text-[#E5E7EB] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchParams.has_food}
                        onChange={(e) => setSearchParams({ ...searchParams, has_food: e.target.checked })}
                        className="mr-2 w-4 h-4 text-accent focus:ring-accent"
                      />
                      <span>Food</span>
                    </label>
                    <label className="flex items-center text-xs sm:text-sm text-[#E5E7EB] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchParams.has_wifi}
                        onChange={(e) => setSearchParams({ ...searchParams, has_wifi: e.target.checked })}
                        className="mr-2 w-4 h-4 text-accent focus:ring-accent"
                      />
                      <span>WiFi</span>
                    </label>
                    <label className="flex items-center text-xs sm:text-sm text-[#E5E7EB] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={searchParams.has_ac}
                        onChange={(e) => setSearchParams({ ...searchParams, has_ac: e.target.checked })}
                        className="mr-2 w-4 h-4 text-accent focus:ring-accent"
                      />
                      <span>AC</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={searchLoading}
                    className="w-full sm:w-auto sm:ml-auto px-6 sm:px-8 py-3 sm:py-3.5 bg-[#14B8A6] text-white rounded-lg hover:bg-[#2DD4BF] disabled:opacity-50 font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
                  >
                    {searchLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <IconSearch className="w-4 h-4" />
                        Search PGs
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Search Results */}
            <div id="search-results">
              {searchLoading && (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
                  <p className="mt-4 text-[#D1D5DB]">Searching for PGs...</p>
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && !hasSearched && (
                <div className="bg-[#0F1720] rounded-lg shadow-md border border-primary/20 p-8 md:p-12 text-center">
                  <div className="w-16 h-16 bg-[#0B0F14] rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconSearch className="w-8 h-8 text-[#9CA3AF]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">Start Your Search</h3>
                  <p className="text-[#D1D5DB]">Enter a city above and click "Search PGs" to find available PGs.</p>
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && hasSearched && (
                <div className="bg-[#0F1720] rounded-lg shadow-md border border-primary/20 p-8 md:p-12 text-center">
                  <div className="w-16 h-16 bg-[#0B0F14] rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconSearch className="w-8 h-8 text-[#9CA3AF]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">No PGs Found</h3>
                  <p className="text-[#D1D5DB] mb-4">Try adjusting your search filters or search in a different city/area.</p>
                  <button
                    onClick={() => {
                      setSearchParams({
                        city: '',
                        area: '',
                        budget_min: '',
                        budget_max: '',
                        gender: '',
                        has_food: false,
                        has_wifi: false,
                        has_ac: false,
                      });
                      setSearchResults([]);
                      setHasSearched(false);
                      setSearchTotal(0);
                    }}
                    className="text-accent hover:text-accent/80 font-medium text-sm"
                  >
                    Clear Filters & Search Again
                  </button>
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm md:text-base text-[#E5E7EB]">
                      Found <span className="font-bold text-primary">{searchTotal}</span> PG{searchTotal !== 1 ? 's' : ''} matching your search
                    </p>
                  </div>
                  <div className="space-y-4">
                    {searchResults.map((pg) => (
                      <div
                        key={pg.pg_id}
                        className="bg-[#0F1720] rounded-lg shadow-md border border-primary/20 p-5 md:p-6 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
                      >
                        {pg.images && Array.isArray(pg.images) && pg.images.length > 0 && (
                          <div className="mb-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {pg.images.slice(0, 4).map((img, idx) => (
                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-primary/20">
                                  <img
                                    src={getFullUrl(img)}
                                    alt={`${pg.pg_name} - Image ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-bold text-primary mb-1">{pg.pg_name || 'PG Name'}</h3>
                            <p className="text-xs sm:text-sm text-[#D1D5DB] flex items-center gap-1">
                              <IconMapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{pg.area && `${pg.area}, `}{pg.city || 'City not specified'}</span>
                            </p>
                          </div>
                          {pg.address && (
                            <button
                              onClick={() => {
                                const address = encodeURIComponent(`${pg.address}, ${pg.area || ''}, ${pg.city || ''}`);
                                window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
                              }}
                              className="text-accent hover:text-accent/80 text-xs sm:text-sm font-medium flex items-center gap-1 self-start sm:self-auto"
                            >
                              <IconMapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                              View on Map
                            </button>
                          )}
                        </div>

                        {pg.address && (
                          <p className="text-[#E5E7EB] mb-3 text-sm">{pg.address}</p>
                        )}

                        {pg.facilities && Array.isArray(pg.facilities) && pg.facilities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {pg.facilities.map((facility, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-[#22D3EE]/20 text-[#22D3EE] text-xs font-medium rounded-full"
                              >
                                {facility}
                              </span>
                            ))}
                          </div>
                        )}

                        {pg.rooms && Array.isArray(pg.rooms) && pg.rooms.length > 0 ? (
                          <div className="mt-4 mb-4">
                            <h4 className="text-sm font-semibold mb-2 text-[#E5E7EB]">Available Rooms:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {pg.rooms.map((room) => (
                                <div
                                  key={room.room_id || Math.random()}
                                  className="flex justify-between items-center p-2.5 bg-[#0B0F14] rounded border border-primary/20"
                                >
                                  <div>
                                    <span className="font-medium text-sm text-[#E5E7EB]">{room.room_name || 'Room'}</span>
                                    {room.gender_type && (
                                      <span className="text-xs text-[#9CA3AF] ml-2">
                                        ({room.gender_type})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-primary">₹{room.rent_per_bed || 0}/bed</div>
                                    <div className="text-xs text-[#9CA3AF]">
                                      {room.available_beds || 0} bed{(room.available_beds || 0) !== 1 ? 's' : ''} available
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 mb-4 p-3 bg-[#0B0F14] border border-primary/20 rounded text-sm text-[#D1D5DB]">
                            No rooms available at the moment. Please contact the PG owner for availability.
                          </div>
                        )}

                        <button
                          onClick={() => navigate(`/marketplace/pg/${pg.pg_id}`)}
                          className="w-full bg-[#14B8A6] text-white py-2.5 rounded-md hover:bg-[#2DD4BF] font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                        >
                          View Details & Send Inquiry
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {searchTotal > searchLimit && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button
                        onClick={() => handleMarketplaceSearch(searchPage - 1)}
                        disabled={searchPage === 1}
                        className="px-4 py-2 border border-primary/20 bg-[#0F1720] text-[#E5E7EB] rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0B0F14] transition-colors font-medium text-sm"
                      >
                        ← Previous
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#E5E7EB]">
                          Page <span className="font-semibold">{searchPage}</span> of <span className="font-semibold">{Math.ceil(searchTotal / searchLimit)}</span>
                        </span>
                      </div>
                      <button
                        onClick={() => handleMarketplaceSearch(searchPage + 1)}
                        disabled={searchPage >= Math.ceil(searchTotal / searchLimit)}
                        className="px-4 py-2 border border-primary/20 bg-[#0F1720] text-[#E5E7EB] rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0B0F14] transition-colors font-medium text-sm"
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
      </section>

      {/* Footer */}
      <footer className="relative w-full border-t border-primary/10 py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">PG Pilot</h3>
              <p className="text-[#D1D5DB] text-xs md:text-sm leading-relaxed mb-3 md:mb-0">
                The best platform to find your perfect PG. Search verified listings, check real-time availability, and connect with PG owners — all free for tenants.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[#E5E7EB] mb-3 md:mb-4 text-sm md:text-base">Quick Links</h4>
              <ul className="space-y-2 text-xs md:text-sm text-[#D1D5DB]">
                <li><Link to="/for-owners" className="hover:text-accent transition-colors">For PG Owners</Link></li>
                <li><a href="#marketplace-section" className="hover:text-accent transition-colors">Search PGs</a></li>
              </ul>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <h4 className="font-bold text-[#E5E7EB] mb-3 md:mb-4 text-sm md:text-base">Contact</h4>
              <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-[#D1D5DB]">
                <li>
                  <b className="block text-[#E5E7EB] mb-1">Email</b>
                  <hr className="border-primary/20 mb-1 md:mb-2" />
                  <a href="mailto:support@pgpilot.com" className="text-[#D1D5DB] hover:text-accent transition-colors break-all">support@pgpilot.com</a>
                </li>
                <li>
                  <b className="block text-[#E5E7EB] mb-1">Support</b>
                  <hr className="border-primary/20 mb-1 md:mb-2" />
                  <p className="text-[#D1D5DB]">Available 24/7</p>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary/20 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <p className="text-xs md:text-sm text-[#D1D5DB] text-center md:text-left">
              © 2024 PG Pilot – Find Your Perfect PG
            </p>
            <div className="flex gap-4 md:gap-6 text-xs md:text-sm text-[#D1D5DB]">
              <a href="#" className="hover:text-accent transition-colors">Contact us</a>
              <span>|</span>
              <a href="#" className="hover:text-accent transition-colors">Privacy policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TenantLandingPage;

