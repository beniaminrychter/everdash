# Preact and CSS Modules migration

1. Preserve the device contracts, transitions, fixtures and saved-data format. Add tests for an immutable reducer, scenes and brightness restoration.
2. Add Preact 10 and its official Vite preset with automatic TSX and React aliases disabled. Remove the previous styling framework and replace utilities with scoped component CSS. Retain PostCSS/Autoprefixer and existing legacy build/PWA configuration.
3. Replace HTML-string components and manual DOM updates with paired TSX/CSS Module components. Introduce shared toggle, icon, icon button, widget, modal and toast primitives. The app owns composition, room selection and modal IDs; hooks own state/persistence, time, online status and toast lifetimes.
4. Keep responsive and interaction styles with their components. Restrict global rules to explicit document defaults in the app CSS module. Preserve the existing visual design.
5. Update browser selectors to accessible labels and stable data attributes. Verify type checks, state/reducer tests, legacy syntax/CSS audit, offline reload, forced legacy boot, storage failure, modal focus, SVG rendering and tablet/phone screenshots. Compare bundle size with the 19.5 KB gzipped legacy JS/CSS baseline.

Review focus: immutable updates, continuous slider rendering, saved-device compatibility, unavailable storage, focus restoration and listener cleanup, native SVG attributes, CSS Module isolation and unchanged offline cache behavior. Physical iOS 12 validation remains required.
