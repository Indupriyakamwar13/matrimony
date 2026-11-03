// src/context/FilterContext.jsx
import React, { createContext, useState, useContext } from "react";

// Default filter values
const defaultFilters = {
  religion: [],
  caste: [],
  motherTongue: [],
  location: [], // [{state, city}]
  nri: null, // true, false, or null (any)
  occupation: [],
  ageRange: [18, 60],
  maritalStatus: [],
  education: [],
  incomeRange: [0, 1000000],
};

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState(defaultFilters);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
