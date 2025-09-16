# Performance Optimization Checklist

- Images
  - [ ] Convert large JPG/PNG to modern formats (AVIF/WebP) with proper quality
  - [ ] Add width/height attributes and loading="lazy" where applicable
  - [ ] Use responsive srcset for hero/gallery assets
- Bundling
  - [ ] Enable route-level code splitting and lazy imports on heavy pages
  - [ ] Split vendor chunks and avoid duplicate libraries
- Caching/Headers
  - [ ] Configure immutable caching for hashed assets; short TTL for HTML
  - [ ] Add Netlify headers for compression, caching, and HTTP/3
- Runtime
  - [ ] Memoize expensive components; avoid unnecessary re-renders
  - [ ] Use React Query caching for search results when appropriate
- Network
  - [ ] Implement request timeouts; exponential backoff and jitter
  - [ ] Deduplicate in-flight requests
- Lighthouse Budgets
  - [ ] Set target: LCP < 2.5s, CLS < 0.1, TBT < 200ms (mobile)
