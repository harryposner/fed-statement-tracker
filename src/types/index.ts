export interface FOMCStatement {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'meeting' | 'longer-run-goals' | 'minutes' | 'other';
  url?: string;
}

export interface DiffResult {
  oldText: string;
  newText: string;
  changes: Change[];
}

export interface Change {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  count?: number;
}