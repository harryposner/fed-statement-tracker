import { Filter } from 'lucide-react';

interface FilterControlsProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  diffMode: 'words' | 'sentences';
  onDiffModeChange: (mode: 'words' | 'sentences') => void;
  viewMode: 'side-by-side' | 'unified';
  onViewModeChange: (mode: 'side-by-side' | 'unified') => void;
}

export default function FilterControls({
  selectedType,
  onTypeChange,
  diffMode,
  onDiffModeChange,
  viewMode,
  onViewModeChange,
}: FilterControlsProps) {
  return (
    <div className="filter-controls">
      <div className="filter-group">
        <Filter size={16} />
        <label htmlFor="statement-type">Statement Type:</label>
        <select
          id="statement-type"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="meeting">Meeting Statements</option>
          <option value="longer-run-goals">Longer-Run Goals</option>
          <option value="minutes">Meeting Minutes</option>
          <option value="other">Other Statements</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="diff-mode">Diff Mode:</label>
        <select
          id="diff-mode"
          value={diffMode}
          onChange={(e) => onDiffModeChange(e.target.value as 'words' | 'sentences')}
        >
          <option value="sentences">Sentences</option>
          <option value="words">Words</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="view-mode">View Mode:</label>
        <select
          id="view-mode"
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value as 'side-by-side' | 'unified')}
        >
          <option value="side-by-side">Side by Side</option>
          <option value="unified">Unified</option>
        </select>
      </div>
    </div>
  );
}