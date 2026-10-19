# My Home foundation

Build a lightweight, touch-friendly Apple Home inspired dashboard for an iPad on iOS 12. All accessories and measurements are explicitly simulated. No credentials or Home Assistant requests are needed.

## Technical decisions

- Vite, strict TypeScript and Preact 10 with native TSX components and typed callbacks. No React compatibility aliases, router, component kit or external state library.
- CSS Modules exclusively, colocated with each component. Minimal document defaults use explicit global rules in the app module. Autoprefixer and shared CSS tokens target iOS 12. Avoid flex gap, dynamic viewport units, CSS nesting, color-mix, modern color functions and native dialog.
- Official Vite legacy plugin targets iOS/Safari 12. Production also emits a conservative modern bundle. Old Safari must be tested using the production preview, not Vite HMR.
- Manifest, Apple standalone metadata, PNG touch icons and a generated, versioned ES5 service worker. Precache only the local application shell and assets, never future Home Assistant API requests. Require HTTPS for offline operation on another device.
- Device definitions, mock measurements, transitions, validated persistence, immutable reducer and reactive hooks have separate ownership. Preact owns rendering; refs handle browser behavior such as modal focus.

## Visual system

Landscape dashboard with a responsive sidebar (296px at the 1488px reference width), atmospheric dusk-teal background, system Apple font, white active device tiles, translucent inactive tiles, amber lighting accents, blue outlets and mint climate. Main content uses a four-column accessory grid with 16px gutters and 20px radii. Portrait reduces the grid and mobile replaces the sidebar with a compact home header and room filters.

Navigation: Overview and four room filters. Header: date, Home, sweet home., supporting sentence, light/outlet/climate summaries. Scenes: Good morning, Good night, Movie time, Away. Favorites: eight accessories, with power and light-detail actions. Bottom: illustrative PLN energy price and three temperature sensors. Persistent demo disclosure.

## Behavior

Power buttons expose pressed state. Brightness is 0–100; zero turns the bulb off and turning it back on restores the last positive brightness. Color controls appear only for color bulbs. Scene actions update the same device state as manual controls. Room navigation filters both accessories and sensors; all-room overview shows the aggregate.

Persist only validated mutable device fields. Corrupt or unavailable storage falls back safely to seed data. Modals support labelled controls, Escape, focus trapping, backdrop close and focus restoration. Mock state remains usable offline after a successful secure initial load.

## Verification

Unit tests cover transitions and hostile/corrupt saved data. Browser checks cover toggles, dimming, colors, scenes, filters, keyboard dialog behavior, persistence, portrait/mobile layout and offline reload. Parse legacy scripts and worker as ES5 and audit emitted CSS for unsupported constructs. Modern WebKit testing does not prove real iOS 12 compatibility; physical-device validation remains required.
