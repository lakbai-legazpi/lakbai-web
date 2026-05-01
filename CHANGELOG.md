# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


### Added

- Journey itinerary panel with day-based grouping
- Route visualization between POIs on map
- Ordered markers reflecting itinerary sequence


### Added

- Journey card component displaying title, location, and duration
- Journey page with empty state layout and journey list component layout
- Journey page base structure with initial layout

### Added

- Initial Explore page layout with 50/50 split view
- SearchBox component with category tabs and search input UI

## [0.9.0] - 2026-02-26

### Added

- Supabase PostgreSQL database schemas (`User`, `POI`, `POIGallery`, `POIReview`, `POIVouch`, `POIFavorite`) via Prisma ORM
- Database seeding script to bulk import Legazpi City points of interest from CSV
- `GET /api/pois` API endpoint for dynamically fetching POI location and metadata 

### Changed

- Updated `MapArea` to fetch from the `/api/pois` endpoint for interactive `MapMarker` rendering
- Dynamic, color-coded custom map pins automatically categorizing POIs via `lucide-react` icons

## [0.8.1] - 2026-02-24

### Added

- Added `.prettierignore` file to exclude CHANGELOG.md, README.md, and CONTRIBUTING.md from automatic formatting

### Changed

- Refactored `MapArea` component file location from `maparea` to `map-area` for improved naming consistency

## [0.8.0] - 2026-02-23

### Added

- Integrated `mapcn` map components (built on MapLibre GL) for zero-config, free map visualization
- Configured a new `MapArea` layout utilizing Carto Positron vector tiles for a light-mode base map

### Changed

- Refactored `Chatbox` and `JourneyArea` to dynamically utilize the design system's customized `<Text>` components
- Converted hardcoded color/border Tailwind classes to strict CSS variables (e.g., `border-text-muted`, `bg-background`, `text-text-main`) proper integration

## [0.7.0] - 2026-02-23

### Added

- Split chat page layout into Chatbox (40%) and Map area (60%) panels
- Journey overlay panel accessible from chat via Journey button
- Chatbox UI with rounded chat container and header section

### Changed

- Updated chat page layout structure to support component-based chat and map areas
- Updated chat UI layout to separate Journey button from chat message area

### Removed

- Removed `mapbox-gl` and Mapbox implementations

## [0.6.1] - 2026-02-20

### Changed

- Improved code formatting in `Sidebar` component using Prettier with Tailwind CSS plugin
- Refactored sidebar width classes from explicit pixel values to Tailwind utility classes (`w-22`, `w-55`)
- Enhanced code consistency with standardized indentation and spacing

## [0.6.0] - 2026-02-15

### Added

- `Sidebar` component with collapsible state and smooth animations
- `lucide-react` dependency for high-quality icons
- Static navigation links for Chat, Journey, Explore, Navigate, and Contribute
- Footer section with Notifications and Profile

### Changed

- Refactored Sidebar from dynamic map loop to static `Link` components for granular control
- Updated Sidebar styling to use "Attached" design (full-height, right border)
- Improved Sidebar icon centering logic to handle collapsed state correctly
- Fixed Sidebar toggle button animation to prevent layout shifts
- Updated `Navigation` icon styling with a custom bordered container

## [0.5.1] - 2026-02-14

### Added

- Comprehensive CONTRIBUTING.md guide with development workflow, branching conventions, commit standards, and versioning instructions
- Tech stack section to README
- Contributing section with quick start guide in README
- Contact information (email and GitHub links) to README

### Changed

- Updated repository URLs from `johannbuere` to `lakbai-platform` organization
- Enhanced README with better structure and contributor guidance

### Fixed

- Corrected clone URLs in README and CONTRIBUTING.md to point to correct repository

## [0.5.0] - 2026-02-14

### Changed

- **BREAKING:** Restructured chat components into nested `_section` folder structure
- **BREAKING:** Moved `MapArea` and `Navbar` components to root components folder
- **BREAKING:** Moved global CSS from `app/` to dedicated `styles/` folder
- Refactored Navbar component with updated styling and layout

### Added

- New chat section structure with `chatbox` and `journey-area` folders
- Enhanced global CSS with updated styling

### Removed

- Unused SVG files from public folder (file.svg, globe.svg, lakbai-text.svg, next.svg, vercel.svg, window.svg)

## [0.4.3] - 2026-02-14

### Added

- Prettier configuration for consistent code formatting.
- `prettier-plugin-tailwindcss` to automatically sort Tailwind CSS classes.

## [0.4.2] - 2026-02-14

### Removed

- Removed LICENSE

### Fixed

- Updated next to latest version

## [0.4.1] - 2026-01-30

### Changed

- Renamed ChatBox into ChatArea component

### Fixed

- Added actual placeholder image to placholder component in chat area

## [0.4.0] - 2026-01-26

### Changed

- Migrated from MapLibre GL to Mapbox GL for map rendering
- Updated map implementation with proper zoom tracking and event listeners
- Change web metadata to be more descriptive

### Fixed

- Map zoom percentage display now updates correctly when zooming in/out
- Mapbox GL properly installed and configured

## [0.3.0] - 2026-01-25

### Added

- Icons for navigation items on hover/active states (Lucide React)
- Chat Page UI with split layout (Chat/Map)
- Map integration with Mapbox GL
- Lime Green theme for Navbar

### Changed

- Restructured components into `components/layout`, `components/chat`,`components/map`
- Redesigned Navbar layout and typography

## [0.2.0] - 2026-01-25

### Added

- Navigation bar for the website

### Changed

- Main page.tsx conforming to designed UI/UX at figma

### Removed

- Unnecessary files are removed from the project file

## [0.1.0] - 2026-01-23

### Added

- Initial release
- CHANGELOG for a curated list of notable changes for each version of this project
- README for Getting Started on development

[unreleased]:https://github.com/lakbai-platform/lakbai-web/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/lakbai-platform/lakbai-web/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/lakbai-platform/lakbai-web/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/lakbai-platform/lakbai-web/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/lakbai-platform/lakbai-web/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/lakbai-platform/lakbai-web/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/lakbai-platform/lakbai-web/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/lakbai-platform/lakbai-web/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/lakbai-platform/lakbai-web/compare/v0.4.3...v0.5.0
[0.4.3]: https://github.com/lakbai-platform/lakbai-web/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/lakbai-platform/lakbai-web/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/lakbai-platform/lakbai-web/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/lakbai-platform/lakbai-web/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/lakbai-platform/lakbai-web/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/lakbai-platform/lakbai-web/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/lakbai-platform/lakbai-web/releases/tag/v0.1.0
