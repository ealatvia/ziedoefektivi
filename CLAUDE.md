# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- **Setup**: `yarn setup`
- **Dev (both)**: `yarn develop`
- **Frontend**: `cd frontend && yarn develop`
- **Backend**: `cd backend && yarn develop`
- **Lint**: `cd frontend && yarn lint`
- **Build**: `cd frontend && yarn build` or `cd backend && yarn build`

## Code Style Guidelines
- **Formatting**: 2-space indentation, unix line breaks, single quotes, semicolons
- **Components**: Use functional React components with hooks, PascalCase names
- **Files**: PascalCase for components (Button.js), camelCase for utilities (string.js)
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Module Structure**: Default export for components, named exports for utilities
- **Styling**: Use TailwindCSS utility classes, avoid inline styles
- **Client Components**: Mark with "use client" directive when needed
- **Error Handling**: Use try/catch blocks for async operations
- **Form Handling**: Use controlled inputs with React state hooks

## Project Structure
- **Frontend**: Next.js app with React components
- **Backend**: Strapi headless CMS
- **API Routes**: Used for server-side logic and third-party integrations