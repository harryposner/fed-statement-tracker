# FOMC Statement Tracker

A web application for comparing Federal Reserve FOMC (Federal Open Market Committee) statements to track policy changes over time. View word-by-word and sentence-by-sentence differences between statements from different meetings.

## Features

- **Statement Comparison**: Compare any two FOMC statements side-by-side or in unified view
- **Multiple Statement Types**: Support for regular meeting statements, longer-run goals, meeting minutes, and other Fed announcements  
- **Word & Sentence Diffs**: Choose between word-level or sentence-level difference highlighting
- **Prose-Optimized Diffs**: Custom diff algorithm designed for financial policy prose, not code
- **Static Site**: No backend required - runs entirely in the browser
- **Manual Data Entry**: Add statements manually for complete control over the dataset

## Statement Types Supported

1. **Meeting Statements**: Regular policy announcements after FOMC meetings
2. **Longer-Run Goals**: Annual "Statement on Longer-Run Goals and Monetary Policy Strategy" 
3. **Meeting Minutes**: Detailed records of FOMC discussions (when available)
4. **Other Statements**: Additional Fed policy communications

## Setup & Installation

### Using Nix (Recommended)

This project includes a `flake.nix` for easy development setup:

```bash
# Enter the development environment
nix develop

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Using Node.js directly

Requirements: Node.js 18+ and npm

```bash
# Install dependencies
npm install

# Start the development server  
npm run dev

# Build for production
npm run build
```

## Usage

1. **Select Statement Type**: Use the filter dropdown to show only specific types of statements
2. **Choose Statements**: Select two statements from the dropdowns to compare
3. **Configure View**: 
   - **Diff Mode**: Choose word-level or sentence-level differences
   - **View Mode**: Side-by-side or unified diff view
4. **Analyze Changes**: Review highlighted additions, deletions, and modifications

## Adding New Statements

To add new FOMC statements:

1. Open `src/data/sampleStatements.ts`
2. Add new statement objects following this format:

```typescript
{
  id: 'YYYY-MM-DD',  // Unique identifier, typically the date
  date: 'YYYY-MM-DD', // ISO date string
  title: 'Statement title',
  type: 'meeting' | 'longer-run-goals' | 'minutes' | 'other',
  content: 'Full text of the statement...',
  url: 'https://federalreserve.gov/...' // Optional source URL
}
```

## Data Sources

Statements can be sourced from:
- [Federal Reserve Press Releases](https://www.federalreserve.gov/newsevents/pressreleases.htm)
- [FOMC Historical Materials](https://www.federalreserve.gov/monetarypolicy/fomc_historical.htm)
- [Federal Reserve RSS Feeds](https://www.federalreserve.gov/feeds/feeds.htm)

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Diff Algorithm**: Custom implementation using the `diff` library
- **Styling**: CSS with responsive design
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Architecture

The application is structured as a static single-page application:

- `src/components/`: React components for UI
  - `StatementSelector`: Dropdown menus for selecting statements
  - `FilterControls`: Controls for diff mode and view options  
  - `DiffViewer`: Side-by-side and unified diff display
- `src/utils/textDiff.ts`: Prose-optimized diff algorithm
- `src/data/`: Statement data and sample content
- `src/types/`: TypeScript type definitions

## Contributing

To add more statements or enhance functionality:

1. Follow the existing code patterns and TypeScript types
2. Test diff rendering with various statement lengths and content
3. Ensure responsive design works on mobile devices
4. Add statements chronologically to maintain sorting

## License

Open source - see individual dependencies for their licenses.