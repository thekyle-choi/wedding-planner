# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies (using pnpm)
pnpm install

# Run development server
pnpm dev
# or
npm run dev

# Build for production
pnpm build
# or
npm run build

# Run production server
pnpm start
# or
npm run start

# Run linting
pnpm lint
# or
npm run lint
```

## Architecture Overview

This is a Next.js 15 wedding/event planning application with the following structure:

### Tech Stack
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with Tailwind Animate
- **UI Components**: Custom components built with Radix UI primitives
- **State Management**: React hooks (useState, useEffect)
- **Data Persistence**: Upstash Redis for cloud storage
- **Package Manager**: pnpm (preferred) or npm

### Project Structure

```
app/
├── api/              # API routes for data persistence
│   ├── budget/       # Budget data CRUD operations
│   ├── schedule/     # Schedule data CRUD operations
│   └── settings/     # Event settings CRUD operations
├── components/       # Page-specific components
│   ├── budget-manager.tsx
│   ├── schedule-manager.tsx
│   ├── event-settings.tsx
│   └── mobile-nav.tsx
├── page.tsx         # Main dashboard/entry point
└── layout.tsx       # Root layout with theme provider

components/
├── ui/              # Reusable UI components (Radix-based)
└── theme-provider.tsx

lib/
└── utils.ts         # Utility functions (cn for classnames)
```

### Key Architectural Patterns

1. **Client-Side State Management**: The app uses React hooks for state management with data fetched from Redis on initial load.

2. **Data Flow**:
   - Initial data load from Redis via API routes on component mount
   - Local state updates with optimistic UI
   - Async save operations to Redis when data changes
   - All data operations go through `/api/*` routes

3. **Component Architecture**:
   - Main `page.tsx` acts as a router with tab-based navigation
   - Each major feature (budget, schedule, settings) has its own component
   - Shared UI components in `components/ui/` directory
   - Mobile-first responsive design

4. **Type Safety**:
   - Interfaces defined for all data structures (BudgetGroup, ScheduleItem, EventSettings)
   - Strict TypeScript configuration enabled

5. **API Pattern**:
   - Each API route handles GET and POST operations
   - Data stored in Redis with namespaced keys (e.g., "wedding:budget")
   - Error handling with fallback to empty arrays/default values

### Path Aliases
- `@/*` maps to the root directory (configured in tsconfig.json)