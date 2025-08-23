import React, { useState, useMemo } from 'react';
import StatementSelector from './components/StatementSelector';
import FilterControls from './components/FilterControls';
import DiffViewer from './components/DiffViewer';
import { createTextDiff, preprocessStatement } from './utils/textDiff';
import { statements } from './data/generated-statements';
import type { FOMCStatement } from './types';
import './App.css';

function App() {
  const [selectedStatements, setSelectedStatements] = useState<[FOMCStatement | null, FOMCStatement | null]>([null, null]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [diffMode, setDiffMode] = useState<'words' | 'sentences'>('sentences');
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  const filteredStatements = useMemo(() => {
    if (selectedType === 'all') return statements;
    return statements.filter(statement => statement.type === selectedType);
  }, [selectedType]);

  const handleStatementSelect = (statement: FOMCStatement, position: 0 | 1) => {
    const newSelection: [FOMCStatement | null, FOMCStatement | null] = [...selectedStatements];
    newSelection[position] = statement;
    setSelectedStatements(newSelection);
  };

  const diff = useMemo(() => {
    if (!selectedStatements[0] || !selectedStatements[1]) return null;
    
    const oldText = preprocessStatement(selectedStatements[0].content);
    const newText = preprocessStatement(selectedStatements[1].content);
    
    return createTextDiff(oldText, newText, diffMode);
  }, [selectedStatements, diffMode]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>FOMC Statement Tracker</h1>
        <p>Compare Federal Reserve FOMC statements to track policy changes over time</p>
      </header>

      <main className="app-main">
        <div className="controls-section">
          <FilterControls
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            diffMode={diffMode}
            onDiffModeChange={setDiffMode}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          
          <StatementSelector
            statements={filteredStatements}
            selectedStatements={selectedStatements}
            onStatementSelect={handleStatementSelect}
          />
        </div>

        {diff && (
          <div className="diff-section">
            <DiffViewer 
              diff={diff} 
              showSideBySide={viewMode === 'side-by-side'} 
            />
          </div>
        )}

        {!selectedStatements[0] || !selectedStatements[1] ? (
          <div className="instructions">
            <h2>Getting Started</h2>
            <p>Select two FOMC statements from the dropdowns above to view their differences.</p>
            <ul>
              <li><strong>Meeting Statements:</strong> Regular policy announcements after FOMC meetings</li>
              <li><strong>Longer-Run Goals:</strong> Annual framework statements on monetary policy strategy</li>
              <li><strong>Meeting Minutes:</strong> Detailed records of FOMC discussions</li>
            </ul>
          </div>
        ) : null}
      </main>

      <footer className="app-footer">
        <p>Data sourced from Federal Reserve press releases and statements</p>
      </footer>
    </div>
  );
}

export default App;