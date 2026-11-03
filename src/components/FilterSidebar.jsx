// src/components/FilterSidebar.jsx
import React from "react";
import { useFilters } from "../context/FilterContext";

// Simple reusable option component
const CheckboxOption = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-2.5 mb-2 cursor-pointer group">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="rounded text-royal focus:ring-royal/30 h-4 w-4 border-slate-300 transition-all cursor-pointer"
    />
    <span className="text-xs font-medium text-slate-700 group-hover:text-navy transition-colors">
      {label}
    </span>
  </label>
);

const FilterSidebar = () => {
  const { filters, updateFilter, resetFilters } = useFilters();

  const toggleOption = (key, value) => {
    const current = filters[key] || [];
    if (current.includes(value)) {
      updateFilter(key, current.filter((v) => v !== value));
    } else {
      updateFilter(key, [...current, value]);
    }
  };

  return (
    <aside className="w-full md:w-64 glass-panel p-5 rounded-3xl border border-border shadow-card space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
          <span>⚙️</span> Filters
        </h3>
        <button
          onClick={resetFilters}
          className="text-[11px] font-bold text-royal hover:underline"
        >
          Reset
        </button>
      </div>

      {/* Religion */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Religion</p>
        <div className="space-y-1">
          {["Hindu", "Muslim", "Christian", "Sikh", "Jain"].map((rel) => (
            <CheckboxOption
              key={rel}
              label={rel}
              checked={filters.religion.includes(rel)}
              onChange={() => toggleOption("religion", rel)}
            />
          ))}
        </div>
      </div>

      {/* Mother Tongue */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Mother Tongue</p>
        <div className="space-y-1">
          {["Hindi", "English", "Gujarati", "Tamil", "Telugu", "Bengali"].map((lang) => (
            <CheckboxOption
              key={lang}
              label={lang}
              checked={filters.motherTongue.includes(lang)}
              onChange={() => toggleOption("motherTongue", lang)}
            />
          ))}
        </div>
      </div>

      {/* Occupation */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Occupation</p>
        <div className="space-y-1">
          {["IT Professional", "Doctor", "Engineer", "Business", "Artist"].map((occ) => (
            <CheckboxOption
              key={occ}
              label={occ}
              checked={filters.occupation.includes(occ)}
              onChange={() => toggleOption("occupation", occ)}
            />
          ))}
        </div>
      </div>

      {/* Age Range Slider */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Age Range</p>
          <span className="text-xs font-bold text-royal">
            {filters.ageRange[0]} - {filters.ageRange[1]} yrs
          </span>
        </div>
        <input
          type="range"
          min={18}
          max={60}
          value={filters.ageRange[0]}
          onChange={(e) => updateFilter("ageRange", [Number(e.target.value), filters.ageRange[1]])}
          className="w-full accent-royal mb-2"
        />
        <input
          type="range"
          min={18}
          max={60}
          value={filters.ageRange[1]}
          onChange={(e) => updateFilter("ageRange", [filters.ageRange[0], Number(e.target.value)])}
          className="w-full accent-royal"
        />
      </div>

      <button
        onClick={resetFilters}
        className="w-full btn-stylish-secondary py-2.5 rounded-xl text-xs font-bold text-center block mt-4"
      >
        Clear All Filters
      </button>
    </aside>
  );
};

export default FilterSidebar;
