# CineStream — Cinematic Streaming Web Application

A full-featured, mobile-responsive streaming web application built with React, Tailwind CSS, Motion, Lucide icons, the TMDB API, and the official FMOV embed streaming player.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during the interactive clarification phase:
> - **Visual Theme**: **Cinematic Crimson** — Rich, deep OLED blacks and obsidian charcoal canvas (`#0b0c10`, `#12131a`) with vivid crimson accents (`#e50914` / `#f43f5e`), high-contrast typography, and measured dark scrims.
> - **Playback Experience**: **Dedicated Player Page** (`/watch/movie/:id` and `/watch/tv/:id/:season/:episode`) featuring a responsive viewport video player, FMOV iframe parameters, server switcher buttons (Vector, Core, Valence, 4K Stream), and a slide-out episode switcher drawer.
> - **Streaming Player**: **FMOV Embed Servers Only** — Implemented according to official specs with custom color accents (`color=e50914`), server routing params, and postMessage event handlers.
> - **Architecture & Runtime**: Full-fidelity client-side router architecture running smoothly on the Vite + React 19 stack, delivering instant zero-latency view transitions between Home, Movie/TV Details, Dedicated Player, Explore Filters, Categories, Search, Person Profile, and My List.

---

### 1. Overview & Core Concept

CineStream delivers an authentic, Netflix-grade streaming discovery and playback experience in the browser. Users can explore trending blockbusters, top-rated television shows, anime, and curated genres powered by live TMDB data. 

Every title features rich metadata (synopsis, genre pills, user score, cast filmographies, seasons/episodes breakdown, and recommendations), one-click bookmarks to "My List", watch history tracking with resume timestamps in `localStorage`, and an integrated FMOV player container with multi-server options.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Discovery & Hero Spotlight**: Land on a full-width cinematic hero showcasing the #1 trending title with a high-definition backdrop, synopsis, "Play Now" primary CTA, "Details" secondary button, and muteable trailer preview.
2. **Carousel Browsing**: Fluid horizontal scroll carousels with smooth left/right navigation and touch momentum for Trending Today, Popular Movies, Top Rated TV, and Anime.
3. **Card Micro-Interactions**: Hovering a title scales the poster gracefully (`hover:scale-105 duration-300`), revealing release year, TMDB score, quick play button, and instant "My List" bookmark toggle.
4. **Details & Season Explorer**: Comprehensive movie/show page displaying backdrop scrim, runtime, rating, director/cast avatars, and for TV series: an interactive Season dropdown with thumbnail-based episode lists.
5. **Dedicated Watch Cinema**: Launch into a theater view with the FMOV embed player (`https://fmov.my/embed/...`), server switcher pills (Vector, Core, Valence, 4K Stream), next/prev episode controls, and a collapsible episode drawer.
6. **Multi-Faceted Search & Filters**: Live debounced search across movies, TV, and people, plus an Explore page with genre chips and sort filters (Popularity, Rating, Release Date).
7. **My List & Watch History**: Instant local persistence allowing users to manage saved content and pick up where they left off.

#### Visual Identity & Theme
- **Dominant Neutral Canvas (60%)**: Deep obsidian black (`#07080a`) and dark slate charcoal (`#0f1016`).
- **Structural Surfaces (30%)**: Frosted translucent dark surfaces (`rgba(22, 24, 35, 0.75)` with `backdrop-blur-md`) and hairline borders (`border-white/10`).
- **Accent Budget (10%)**: Cinematic crimson (`#e50914`) for primary play buttons, active navigation indicators, rating badges, and player progress accents.
- **Typography**: `Plus Jakarta Sans` for clean, modern display titles and body prose; `tabular-nums` for durations, release years, and score percentages.

#### Mobile & Touch Ergonomics
- Top compact app bar with logo, live search toggle, and hamburger drawer.
- Ergonomic bottom mobile navigation bar for thumb access (Home, Explore, Search, My List).
- Native-like horizontal touch scroll on all rows and episode sliders with smooth momentum.

---

### 3. Key Product Decisions & Trade-Offs

- **Client-Side Routing on Vite SPA**: 
  - *Chosen Approach*: Use a modular browser history / hash-compatible view router matching the `/movie/:id`, `/tv/:id`, `/watch/...`, `/explore/:type`, `/categories`, `/search`, `/person/:id`, and `/mylist` paths seamlessly within Vite.
  - *Why*: Provides sub-50ms instant view transitions, full offline resilience for bookmarks, and avoids external server cold starts while perfectly satisfying the prompt requirements.
- **TMDB Service & Token Handling**:
  - *Chosen Approach*: Dedicated `lib/tmdb.ts` service configured with the provided TMDB Read Access Token (fallback to API key if set), with robust caching and error handling for missing posters and rate limits.
  - *Why*: Centralized endpoints for trending, discover, multi-search, credits, seasons, and similar titles with standardized image URL builders (`w500`, `original`).
- **FMOV Player Specifications & postMessage**:
  - *Chosen Approach*: Strict adherence to `https://fmov.my/embed/movie/{tmdb_id}?color=e50914` and `https://fmov.my/embed/series/{tmdb_id}/{season}/{episode}?color=e50914&server={server}`. Attach a global `window.addEventListener('message', ...)` listener to capture player duration/progress events and persist watch state.

---

### 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                           CineStream App                         │
│                                                                  │
│  ┌───────────────────────────┐    ┌───────────────────────────┐  │
│  │       Global Navbar       │    │     Mobile Navigation     │  │
│  │ (Brand, Links, SearchBar) │    │  (Bottom Tab Bar + Sheet) │  │
│  └─────────────┬─────────────┘    └─────────────┬─────────────┘  │
│                │                                │                │
│  ┌─────────────▼────────────────────────────────▼─────────────┐  │
│  │                    Active View Router                      │  │
│  │  ├─ Home View (Hero Spotlight + 4 Carousels)               │  │
│  │  ├─ Details View (/movie/:id, /tv/:id, Seasons, Cast)      │  │
│  │  ├─ Watch Player View (FMOV Iframe, Servers, Episodes)     │  │
│  │  ├─ Explore View (Type, Genres, Sort Filters, Grid)        │  │
│  │  ├─ Categories View (Visual Genre Cards Grid)              │  │
│  │  ├─ Search View (Debounced Multi-Search, Tab Filters)      │  │
│  │  ├─ Person Profile View (Bio, Details, Filmography Grid)   │  │
│  │  └─ My List View (Saved Titles, History, Quick Play)       │  │
│  └─────────────┬────────────────────────────────┬─────────────┘  │
│                │                                │                │
│  ┌─────────────▼─────────────┐    ┌─────────────▼─────────────┐  │
│  │       TMDB Service        │    │    LocalStorage Store     │  │
│  │  (/lib/tmdb.ts API Client)│    │   (My List & History)     │  │
│  └───────────────────────────┘    └───────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

#### Core Data Entities & Local Storage
- **`BookmarkItem`**: `{ id, media_type: 'movie' | 'tv', title, name, poster_path, backdrop_path, vote_average, release_date, first_air_date, addedAt }`
- **`WatchHistoryItem`**: `{ id, media_type, title, poster_path, season, episode, lastWatched, progress }`
- **LocalStorage Keys**: `'cinestream_bookmarks'`, `'cinestream_history'`

#### FMOV Embed Parameters
- Movie: `https://fmov.my/embed/movie/${tmdbId}?color=e50914${serverParam}`
- Series: `https://fmov.my/embed/series/${tmdbId}/${season}/${episode}?color=e50914${serverParam}`
- Server options: `default` (Auto), `vector` (Vector Fast), `core` (Core HD), `valence` (Valence), `stream4k` (4K Ultra)

---

### 5. Implementation Steps (After Approval)

1. **TMDB Service & Configuration**: Create `src/lib/tmdb.ts` with API token authorization, image helpers, and typed fetch functions for all required endpoints.
2. **State & LocalStorage Hooks**: Build `src/hooks/useBookmarks.ts` and `src/hooks/useWatchHistory.ts` for reactive synchronization.
3. **Core UI Components**:
   - `Navbar.tsx` (brand wordmark, nav links, quick search trigger, mobile drawer).
   - `Footer.tsx` (cinematic brand statement, navigation links, TMDB attribution).
   - `MovieCard.tsx` (image loading fallbacks, rating, hover quick play & bookmark toggle).
   - `MovieRow.tsx` (horizontal scroll container with chevron arrows).
4. **Dedicated Views**:
   - `HomeView.tsx` (Hero spotlight with backdrop, trending/popular/top-rated/anime carousels).
   - `DetailsView.tsx` (Backdrop blur hero, synopsis, genre pills, cast list, TV season/episode selector, recommendations).
   - `WatchPlayerView.tsx` (FMOV iframe container, server switches, episode sidebar/drawer, message event listener).
   - `ExploreView.tsx` (Movie/TV filter grid with genre selector, sort dropdown, pagination).
   - `CategoriesView.tsx` (Interactive genre cards with backdrop imagery).
   - `SearchView.tsx` (Live debounced multi-search with category tabs).
   - `PersonView.tsx` (Actor biography and filmography credits).
   - `MyListView.tsx` (Saved watchlist and resume-watching shelf).
5. **Compilation & Verification**: Run `compile_applet` and verify all routes, interactions, and player functionality.
