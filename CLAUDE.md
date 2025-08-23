# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Setup and Development:**
```bash
# Enter Nix development shell (provides Node.js 24)
nix develop

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture Overview

This is a React TypeScript application for comparing Federal Reserve FOMC statements using a specialized text diff engine. The architecture follows a centralized state management pattern with all major state managed in the root App component.

**Key Data Flow:**
1. FOMC statements are stored as Markdown files in `data/statements/` with YAML frontmatter
2. Custom Vite plugin (`vite-plugin-statements.ts`) parses Markdown at build time into `src/data/generated-statements.ts`
3. App component imports generated statements, filters by type, and manages selection state
4. Text diff calculation happens in `src/utils/textDiff.ts` using the `diff` library
5. Results are rendered via DiffViewer component with custom HTML highlighting

**Component Hierarchy:**
- `App.tsx` - Root component managing all state and coordination
- `StatementSelector.tsx` - Dual dropdown interface for choosing statements to compare
- `FilterControls.tsx` - Filters for statement type, diff mode (words/sentences), and view mode
- `DiffViewer.tsx` - Renders side-by-side or unified diff views with highlighting

## Core Data Types

**FOMCStatement** (`src/types/index.ts`):
- `type`: 'meeting' | 'longer-run-goals' | 'minutes' | 'other'
- Contains full statement text, date, title, and optional source URL

**Text Diff System:**
- Uses custom preprocessing for policy statement prose (not code)
- Supports both word-level and sentence-level granularity
- HTML escaping built into highlighting for security

## Adding New Statements

Create new Markdown files in `data/statements/` with YAML frontmatter. The raw Markdown content is parsed at build time and not included in the bundle.

**Filename format:** `YYYY-MM-DD-description.md`

**File structure:**
```markdown
---
id: unique-id
date: YYYY-MM-DD
title: Statement title
type: meeting | longer-run-goals | minutes | other
url: https://federalreserve.gov/... # Optional
---

Statement content in Markdown format...
```

The Vite plugin automatically generates `src/data/generated-statements.ts` from these files during build.

## Development Environment

This project uses **Nix Flakes** for reproducible development environments. The flake provides Node.js 24 and ensures consistent tooling across different systems. Always use `nix develop` before running npm commands to ensure you're in the correct environment.

The build system uses **Vite** for fast development and optimized production builds, with full TypeScript support and ESLint integration.