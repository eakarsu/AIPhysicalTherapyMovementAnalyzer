import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPatients } from '../api';
import SessionTimer from './SessionTimer';

function Header({ onToggleSidebar }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchPatients(val);
        setResults(Array.isArray(res.data) ? res.data : []);
        setShowResults(true);
      } catch {
        setResults([]);
      }
    }, 300);
  };

  const handleSelect = (patient) => {
    setQuery('');
    setShowResults(false);
    setResults([]);
    navigate(`/patient-profile/${patient.id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="header-brand">
          <span className="header-icon">🏥</span>
          <h1>PT Movement Analyzer</h1>
        </div>
      </div>

      <div className="header-search" ref={searchRef}>
        <input
          type="text"
          className="header-search-input"
          placeholder="Search patients..."
          value={query}
          onChange={handleSearch}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
        />
        {showResults && results.length > 0 && (
          <div className="header-search-results">
            {results.map((p) => (
              <div key={p.id} className="header-search-item" onClick={() => handleSelect(p)}>
                <div className="header-search-name">{p.name}</div>
                <div className="header-search-detail">
                  {p.condition && <span>{p.condition}</span>}
                  <span className={`status-badge ${p.status === 'active' ? 'badge-success' : 'badge-default'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="header-right">
        <SessionTimer />
        <div className="header-user">
          <div className="user-avatar">{(user.name || 'U')[0].toUpperCase()}</div>
          <span className="user-name">{user.name || user.email || 'User'}</span>
        </div>
        <button className="btn btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
