

## Plan: Multi-Banner Carousel on All Pages

### Problem
- **Courses**, **CourseListing**, and **IITMBSSubjectNotesPage** only fetch and display a single banner image with fixed height containers (`h-[clamp(120px,20vw,200px)]` or `h-32 md:h-48 lg:h-60`).
- The **Index** page already uses `HeroCarousel` which supports multiple banners, but all other pages do not.

### Solution
Reuse the existing `HeroCarousel` component on all pages that have banners. It already:
- Fetches all banners from `page_banners` matching a `pagePath`
- Renders a carousel with auto-advance, dots, and navigation arrows
- Uses `object-contain` with natural image height (no fixed dimensions)

### Changes

#### 1. Courses page (`src/pages/Courses.tsx`)
- Remove the single-banner fetch logic (`bannerImage`, `bannerLoading`, `setBannerImage`, the `useEffect` fetching banner)
- Replace the fixed-height `<section>` banner with `<HeroCarousel pagePath={location.pathname} />`
- The `HeroCarousel` will also try matching by exam category path variants

#### 2. CourseListing page (`src/pages/CourseListing.tsx`)
- Same approach: remove single-banner state and fetch logic
- Replace the fixed-height banner section with `<HeroCarousel pagePath={location.pathname} />`

#### 3. IITMBSSubjectNotesPage (`src/pages/IITMBSSubjectNotesPage.tsx`)
- Remove single-banner fetch logic and state
- Replace the fixed-height banner `<div>` with `<HeroCarousel pagePath={location.pathname} />`

#### 4. HeroCarousel adjustments (`src/components/HeroCarousel.tsx`)
- Remove the `mt-16` class from the wrapper (the parent pages already handle `pt-16` for navbar offset)
- Keep the existing natural-height image rendering (`w-full h-auto object-contain`) — this ensures dimensions adapt to the uploaded image

### Technical Detail
- `HeroCarousel` queries `page_banners` with `eq("page_path", pagePath)` — multiple rows per path are supported by design
- Images render at their natural aspect ratio via `object-contain` + `h-auto`
- Single banner = no dots/arrows shown; multiple = carousel behavior

