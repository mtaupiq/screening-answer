# Website Performance Best Practices

Website performance optimization comes down to reducing network latency, minimizing data volume, rendering efficiently, and avoiding main-thread bottlenecks. The practices below are ordered by impact, starting with the highest-leverage optimizations.

---

## 1. High-Impact Fundamentals (Largest Wins)

### Reduce and Optimize Network Requests

* **Minimize HTTP Requests:** Consolidate critical assets and remove unnecessary third-party scripts.
* **Optimize Critical Rendering Path:** Eliminate render-blocking CSS and JavaScript. Deliver critical CSS inline or via `<link rel="preload">`, and defer non-critical CSS/JS.
* **Modern Image Formats:** Use WebP or AVIF instead of PNG/JPEG to cut file sizes by 30% to 80% without visible quality loss.
* **Responsive Images:** Use `srcset` and `<picture>` elements to serve appropriately sized images based on the user's viewport and device resolution.
* **Lazy Loading:** Apply native `loading="lazy"` to off-screen images and `<iframe>` elements so they load only when approaching the viewport.

---

## 2. Server & Content Delivery Optimization

### Edge & Transport Efficiency

* **Use a CDN (Content Delivery Network):** Cache static assets at edge locations close to your users to reduce round-trip time (RTT).
* **Enable Modern Compression:** Use **Brotli** compression (or Gzip as a fallback) for HTML, CSS, JavaScript, and SVG assets.
* **HTTP/2 or HTTP/3:** Use HTTP/2 or HTTP/3 to enable multiplexing (loading multiple assets over a single TCP connection), header compression, and server push.
* **Proper Caching Headers:** Set aggressive `Cache-Control` headers (e.g., `max-age=31536000, immutable`) for content-hashed assets, and use `ETag` or `stale-while-revalidate` for dynamic content.
* **Early Hints (HTTP 103):** Send link preloads to the browser while the server is still preparing the main HTML payload.

---

## 3. JavaScript Execution & Asset Delivery

### Minimizing Main-Thread Blocking

* **Script Loading Strategy:** Use `async` for independent scripts (analytics) and `defer` for scripts that depend on the DOM tree.
* **Code Splitting & Tree Shaking:** Break large JS bundles into page-specific chunks using dynamic `import()` and purge dead code during the build process.
* **Reduce JavaScript Payload:** JS is the most expensive asset type because it must be downloaded, parsed, compiled, and executed. Aim to keep initial JS bundles under 100–150 KB gzipped.
* **Offload Heavy Tasks to Web Workers:** Move CPU-intensive operations (data transformation, complex calculations) off the main thread to prevent UI freezing.
* **Audit Third-Party Scripts:** Limit tracking pixels, tag managers, and widgets. Load them via facade patterns or defer them until after core user interaction.

---

## 4. Rendering & CSS Performance

### Maximizing Frame Rates & Core Web Vitals

* **Optimize Core Web Vitals (CWVs):**
  * **LCP (Largest Contentful Paint):** Preload the main hero image or fetch the primary content block early (`fetchpriority="high"`).
  * **INP (Interaction to Next Paint):** Keep event listeners lightweight, yield to the main thread (`scheduler.yield()` or `setTimeout`), and avoid long tasks (> 50ms).
  * **CLS (Cumulative Layout Shift):** Always reserve layout space for images, videos, and ads using explicit `width` and `height` attributes or CSS `aspect-ratio`.
* **CSS Best Practices:**
  * Avoid expensive layout triggers like `@import` inside CSS files.
  * Use CSS animations on hardware-accelerated properties (`transform`, `opacity`) rather than layout-triggering properties (`width`, `top`, `margin`).
  * Use `content-visibility: auto` to defer rendering off-screen DOM subtrees.
* **Font Optimization:**
  * Self-host web fonts to eliminate third-party domain lookups.
  * Preload primary font files (`.woff2`) and use `font-display: swap` or `optional` to prevent FOIT (Flash of Unseen Text).
  * Subset font files to include only necessary glyphs/character sets.

---

## 5. Architectural & Monitoring Practices

### Long-Term Performance Hygiene

* **Adopt Static Generation or SSR with Streaming:** Use Static Site Generation (SSG) for content pages or Streaming Server-Side Rendering (SSR) for dynamic pages to deliver HTML instantly.
* **Implement Resource Hints:** Use `<link rel="preconnect">` and `<link rel="dns-prefetch">` for unavoidable external origins.
* **Set Performance Budgets:** Enforce bundle size limits in CI/CD pipelines (e.g., using Lighthouse CI or Webpack Performance Hints) to catch regressions before deployment.
* **Continuous Real User Monitoring (RUM):** Measure actual user experiences using tools like Chrome UX Report (CrUX) or custom `PerformanceObserver` APIs alongside synthetic lab testing (Lighthouse, PageSpeed Insights).
