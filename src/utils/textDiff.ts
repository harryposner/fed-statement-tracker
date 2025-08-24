import { diffSentences, diffWords } from 'diff';
import type { Change, DiffResult } from '../types';

function groupConsecutiveChanges(changes: Change[]): Change[] {
  if (changes.length === 0) return changes;
  
  const grouped: Change[] = [];
  let i = 0;
  
  while (i < changes.length) {
    const currentChange = changes[i];
    
    if (currentChange.type === 'unchanged') {
      grouped.push(currentChange);
      i++;
      continue;
    }
    
    // Find the sequence of changes, treating whitespace-only unchanged as part of the sequence
    let j = i;
    const removals: string[] = [];
    const additions: string[] = [];
    
    // Collect all changes until we hit a non-whitespace unchanged section
    while (j < changes.length) {
      const change = changes[j];
      
      if (change.type === 'removed') {
        removals.push(change.value);
      } else if (change.type === 'added') {
        additions.push(change.value);
      } else if (change.type === 'unchanged') {
        // If it's whitespace-only and we have more changes coming, include it in the current sequence
        const isWhitespaceOnly = /^\s+$/.test(change.value);
        const hasMoreChanges = j + 1 < changes.length && changes[j + 1].type !== 'unchanged';
        
        if (isWhitespaceOnly && hasMoreChanges) {
          // Include whitespace in both removals and additions to maintain spacing
          removals.push(change.value);
          additions.push(change.value);
        } else {
          // Non-whitespace unchanged section - end the sequence
          break;
        }
      }
      j++;
    }
    
    // Add grouped removals first, then grouped additions
    if (removals.length > 0) {
      grouped.push({
        type: 'removed',
        value: removals.join(''),
        count: removals.length
      });
    }
    
    if (additions.length > 0) {
      grouped.push({
        type: 'added',
        value: additions.join(''),
        count: additions.length
      });
    }
    
    i = j;
  }
  
  return grouped;
}

export function createTextDiff(oldText: string, newText: string, mode: 'words' | 'sentences' = 'sentences'): DiffResult {
  const diffFunction = mode === 'words' ? diffWords : diffSentences;
  const changes = diffFunction(oldText, newText);
  
  const mappedChanges = changes.map(change => ({
    type: change.added ? 'added' as const : change.removed ? 'removed' as const : 'unchanged' as const,
    value: change.value,
    count: change.count
  }));

  return {
    oldText,
    newText,
    changes: groupConsecutiveChanges(mappedChanges)
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
