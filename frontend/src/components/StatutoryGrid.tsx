import React, { useState } from 'react';
import { Search, Filter, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { NormalizedFields, NormalizedField, FieldStatus } from '../types';
import { StatutoryField } from './StatutoryField';

interface StatutoryGridProps {
  fields: NormalizedFields;
  selectedFieldKey: string | null;
  onSelectField: (key: string | null) => void;
  onUpdateField: (fieldKey: string, newValue: string) => void;
}

export const StatutoryGrid: React.FC<StatutoryGridProps> = ({
  fields,
  selectedFieldKey,
  onSelectField,
  onUpdateField
}) => {
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'REVIEW' | 'ISSUES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Primary ordered list of mandatory Legal Metrology fields
  const fieldList: NormalizedField[] = [
    fields.productBrandName,
    fields.mrp,
    fields.netQuantity,
    fields.unitSalePrice,
    fields.manufacturer,
    fields.manufacturingDate,
    fields.expiryDate,
    fields.batchNumber,
    fields.consumerCare,
    fields.countryOfOrigin
  ].filter(Boolean) as NormalizedField[];

  const filteredList = fieldList.filter((f) => {
    // Filter by tab
    if (filter === 'VERIFIED' && f.status !== 'VERIFIED' && f.status !== 'MANUALLY_VERIFIED') return false;
    if (filter === 'REVIEW' && f.status !== 'REVIEW') return false;
    if (filter === 'ISSUES' && f.status !== 'WARNING' && f.status !== 'MISSING') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLabel = f.label.toLowerCase().includes(q);
      const matchVal = (f.value || '').toLowerCase().includes(q);
      return matchLabel || matchVal;
    }
    return true;
  });

  const verifiedCount = fieldList.filter((f) => f.status === 'VERIFIED' || f.status === 'MANUALLY_VERIFIED').length;
  const reviewCount = fieldList.filter((f) => f.status === 'REVIEW').length;
  const issuesCount = fieldList.filter((f) => f.status === 'WARNING' || f.status === 'MISSING').length;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search declarations (e.g., MRP, weight, mfg)..."
            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-white/10 text-[11px] font-mono overflow-x-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filter === 'ALL' ? 'bg-yellow-400 text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            All ({fieldList.length})
          </button>
          <button
            onClick={() => setFilter('VERIFIED')}
            className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              filter === 'VERIFIED' ? 'bg-emerald-400 text-black font-bold' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Pass ({verifiedCount})</span>
          </button>
          <button
            onClick={() => setFilter('REVIEW')}
            className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              filter === 'REVIEW' ? 'bg-yellow-400 text-black font-bold' : 'text-yellow-400 hover:text-yellow-300'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Review ({reviewCount})</span>
          </button>
          <button
            onClick={() => setFilter('ISSUES')}
            className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              filter === 'ISSUES' ? 'bg-rose-400 text-black font-bold' : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Issues ({issuesCount})</span>
          </button>
        </div>
      </div>

      {/* Field Cards */}
      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
        {filteredList.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-white/40 bg-[#141414] rounded-xl border border-dashed border-white/10">
            No statutory declarations matched your filter.
          </div>
        ) : (
          filteredList.map((f) => (
            <StatutoryField
              key={f.key}
              field={f}
              isSelected={selectedFieldKey === f.key}
              onSelect={() => onSelectField(selectedFieldKey === f.key ? null : f.key)}
              onUpdateValue={onUpdateField}
            />
          ))
        )}
      </div>
    </div>
  );
};
