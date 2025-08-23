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
    .replace(/[ \t]+/g, ' ')     // Replace multiple spaces/tabs with single space
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with double newlines
    .trim();
}

export function highlightDifferences(changes: Change[]): string {
  return changes
    .map(change => {
      let content = '';
      switch (change.type) {
        case 'added':
          content = `<mark class="diff-added">${escapeHtml(change.value)}</mark>`;
          break;
        case 'removed':
          content = `<mark class="diff-removed">${escapeHtml(change.value)}</mark>`;
          break;
        default:
          content = escapeHtml(change.value);
      }
      
      // Convert double newlines to paragraph breaks
      return content.replace(/\n\n/g, '</p><p>');
    })
    .join('')
    .replace(/^/, '<p>')  // Add opening <p> tag at start
    .replace(/$/, '</p>') // Add closing </p> tag at end
    .replace(/<p><\/p>/g, ''); // Remove empty paragraphs
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}