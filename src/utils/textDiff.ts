import { diffSentences, diffWords } from 'diff';
import type { Change, DiffResult } from '../types';

export function createTextDiff(oldText: string, newText: string, mode: 'words' | 'sentences' = 'sentences'): DiffResult {
  const diffFunction = mode === 'words' ? diffWords : diffSentences;
  const changes = diffFunction(oldText, newText);
  
  return {
    oldText,
    newText,
    changes: changes.map(change => ({
      type: change.added ? 'added' : change.removed ? 'removed' : 'unchanged',
      value: change.value,
      count: change.count
    }))
  };
}

export function preprocessStatement(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
}

export function highlightDifferences(changes: Change[]): string {
  return changes
    .map(change => {
      switch (change.type) {
        case 'added':
          return `<mark class="diff-added">${escapeHtml(change.value)}</mark>`;
        case 'removed':
          return `<mark class="diff-removed">${escapeHtml(change.value)}</mark>`;
        default:
          return escapeHtml(change.value);
      }
    })
    .join('');
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}