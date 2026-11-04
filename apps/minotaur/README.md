## Overview
The app provides an interactive interface for Minecraft server management, including:
- User authentication and profile management
- Server control and monitoring dashboard
- Land and world management
- Player ratings and leaderboards
- Store integration
- Task management
- News and announcements
- Settings and preferences

## Tech Stack
- **Frontend Framework**: React 19.1.0
- **Meta-framework**: >= Vike 0.4.257
- **Build Tool**: >= Vite 7.2.7
- **Language**: >= TypeScript 5.8.3
- **State Management**: Reatom v3
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI, Tabler Icons
- **Editor**: TipTap (rich text editor)
- **Runtime**: >= Bun 1.3.0

## Installation / Setup -> ./SETUP.md

## Deploy

The image is built by `.github/workflows/build-minotaur.yml`, not on a workstation: push to
`main` for prod or `dev`/`staging` for staging. The workflow builds the client bundle on
`ubuntu-latest`, pushes `registry.fasberry.fun/<stage>/minotaur:latest` and
`:sha-<commit>`, and the deploy host pulls it on a cron timer
(`scripts/deploy/pull-update.sh`). Staging bakes the `*.alpha.fasberry.fun` URLs.

## Additional Resources
- [Vike Documentation](https://vike.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Reatom](https://reatom.dev/)
- [Vite Guide](https://vitejs.dev/)
