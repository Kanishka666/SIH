import React, { useState } from 'react';
import { Edit2, Check, X, Eye, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { NormalizedField } from '../types';
import { ConfidenceBadge } from './ConfidenceBadge';

interface StatutoryFieldProps {
  field: NormalizedField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateValue: (fieldKey: string, newValue: string) => void;
}

export const StatutoryField: React.FC<StatutoryFieldProps> = ({
  field,
  isSelected,
  onSelect,
  onUpdateValue
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.value || '');
  const [showSource, setShowSource] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateValue(field.key, editValue);
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(field.value || '');
    setIsEditing(false);
  };

  const isMissing = field.status === 'MISSING' || !field.value || field.value === 'Not detected';

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl p-3.5 transition-all duration-200 border cursor-pointer ${
        isSelected
          ? 'bg-yellow-400/[0.08] border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.12)]'
          : 'bg-[#141414] hover:bg-[#1a1a1a] border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-medium text-white/70 uppercase tracking-wider">
            {field.label}
          </span>
          {field.ruleCitation && (
            <span className="text-[10px] font-mono text-white/40 hidden sm:inline">
              [{field.ruleCitation.split(',')[0]}]
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ConfidenceBadge status={field.status} confidence={field.confidence} size="sm" />
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Manually verify or edit this declaration"
              className="p-1 rounded text-white/40 hover:text-yellow-400 hover:bg-white/10 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={2}
            className="w-full bg-black/60 border border-yellow-400/50 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-400"
            placeholder="Enter accurate statutory value..."
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-mono text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded bg-yellow-400 hover:bg-yellow-300 text-[11px] font-mono font-bold text-black flex items-center gap-1 transition-colors"
            >
              <Check className="w-3 h-3" />
              Save Manual Entry
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-1">
          <div
            className={`text-xs sm:text-sm font-sans ${
              isMissing ? 'text-rose-400 italic font-mono' : 'text-white font-medium'
            } break-words leading-relaxed`}
          >
            {field.value || 'Not detected'}
          </div>

          {field.note && (
            <div className="mt-1 text-[11px] font-mono text-white/50">{field.note}</div>
          )}

          {field.sourceText && field.sourceText !== field.value && (
            <div className="mt-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSource(!showSource);
                }}
                className="text-[10px] font-mono text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
              >
                <FileText className="w-2.5 h-2.5" />
                <span>Raw OCR source</span>
                {showSource ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
              {showSource && (
                <div className="mt-1 p-1.5 rounded bg-black/50 border border-white/5 text-[10px] font-mono text-white/60 select-all">
                  "{field.sourceText}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
