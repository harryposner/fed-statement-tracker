import React from 'react';
import { format, parseISO } from 'date-fns';
import type { FOMCStatement } from '../types';

interface StatementSelectorProps {
  statements: FOMCStatement[];
  selectedStatements: [FOMCStatement | null, FOMCStatement | null];
  onStatementSelect: (statement: FOMCStatement, position: 0 | 1) => void;
}

export default function StatementSelector({ 
  statements, 
  selectedStatements, 
  onStatementSelect 
}: StatementSelectorProps) {
  const sortedStatements = statements.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const renderStatementOption = (statement: FOMCStatement) => (
    <option key={statement.id} value={statement.id}>
      {format(parseISO(statement.date), 'MMM dd, yyyy')} - {statement.title}
    </option>
  );

  const handleSelectChange = (value: string, position: 0 | 1) => {
    const statement = statements.find(s => s.id === value);
    if (statement) {
      onStatementSelect(statement, position);
    }
  };

  return (
    <div className="statement-selector">
      <div className="selector-group">
        <label htmlFor="statement-1">Compare:</label>
        <select
          id="statement-1"
          value={selectedStatements[0]?.id || ''}
          onChange={(e) => handleSelectChange(e.target.value, 0)}
        >
          <option value="">Select first statement...</option>
          {sortedStatements.map(renderStatementOption)}
        </select>
      </div>

      <div className="selector-group">
        <label htmlFor="statement-2">With:</label>
        <select
          id="statement-2"
          value={selectedStatements[1]?.id || ''}
          onChange={(e) => handleSelectChange(e.target.value, 1)}
        >
          <option value="">Select second statement...</option>
          {sortedStatements.map(renderStatementOption)}
        </select>
      </div>

      {selectedStatements[0] && selectedStatements[1] && (
        <div className="selection-summary">
          <p>
            Comparing statements from{' '}
            <strong>{format(parseISO(selectedStatements[0].date), 'MMM dd, yyyy')}</strong>
            {' '}and{' '}
            <strong>{format(parseISO(selectedStatements[1].date), 'MMM dd, yyyy')}</strong>
          </p>
        </div>
      )}
    </div>
  );
}