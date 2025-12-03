import React, { useState } from 'react';
import axios from 'axios';

export default function AsyncProponentSelect({ selectedProponents, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search users by name/email
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/api/users/search?q=${encodeURIComponent(value)}`);
      setResults(res.data.data || []);
    } catch (err) {
      setResults([]);
    }
    setLoading(false);
  };

  // Add proponent
  const addProponent = (user) => {
    if (!selectedProponents.some((p) => p.userID === user.userID)) {
      onChange([...selectedProponents, user]);
    }
    setSearch('');
    setResults([]);
  };

  // Remove proponent
  const removeProponent = (userID) => {
    onChange(selectedProponents.filter((p) => p.userID !== userID));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedProponents.map((user) => (
          <span key={user.userID} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {user.firstName} {user.lastName}
            <button type="button" className="ml-2 text-blue-500 hover:text-red-500" onClick={() => removeProponent(user.userID)}>
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={search}
        onChange={handleSearch}
        placeholder="Search by name or email..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && <div className="text-sm text-gray-500 mt-1">Searching...</div>}
      {results.length > 0 && (
        <ul className="bg-white border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto">
          {results.map((user) => (
            <li key={user.userID} className="px-4 py-2 hover:bg-blue-50 cursor-pointer" onClick={() => addProponent(user)}>
              {user.firstName} {user.lastName} <span className="text-gray-400">({user.email})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
