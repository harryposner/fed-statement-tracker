import type { DiffResult } from '../types';
import { highlightDifferences } from '../utils/textDiff';

interface DiffViewerProps {
  diff: DiffResult;
  showSideBySide?: boolean;
}

export default function DiffViewer({ diff, showSideBySide = true }: DiffViewerProps) {
  if (showSideBySide) {
    return (
      <div className="diff-viewer side-by-side">
        <div className="diff-panel">
          <h3>Previous Statement</h3>
          <div 
            className="diff-content old" 
            dangerouslySetInnerHTML={{ 
              __html: highlightDifferences(diff.changes.filter(c => c.type !== 'added'))
            }} 
          />
        </div>
        <div className="diff-panel">
          <h3>Current Statement</h3>
          <div 
            className="diff-content new" 
            dangerouslySetInnerHTML={{ 
              __html: highlightDifferences(diff.changes.filter(c => c.type !== 'removed'))
            }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="diff-viewer unified">
      <div 
        className="diff-content" 
        dangerouslySetInnerHTML={{ 
          __html: highlightDifferences(diff.changes)
        }} 
      />
    </div>
  );
}