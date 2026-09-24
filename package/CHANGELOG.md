# react-virtual-masonry

## 0.7.0

### Minor Changes

- [#65](https://github.com/2wheeh/kaskaid/pull/65) [`b3eda4f`](https://github.com/2wheeh/kaskaid/commit/b3eda4fd00f79748dfd539108ee894f9c0a2d962) Thanks [@2wheeh](https://github.com/2wheeh)! - **Breaking:** require `@tanstack/react-virtual >=3.14.6`. Upgrade the peer dependency to use the upstream reactive-gap fix and multi-lane placement optimization.

  Remove the gutter-change remeasurement workaround from `useMasonry`; changing `gutter` now updates positions while preserving measured item sizes.

## 0.6.0

### Minor Changes

- [#62](https://github.com/2wheeh/kaskaid/pull/62) [`8918161`](https://github.com/2wheeh/kaskaid/commit/8918161cbfb5dbb77e8654900fbddd77fbe8f42b) Thanks [@2wheeh](https://github.com/2wheeh)! - Rename the package from `react-virtual-masonry` to `kaskaid`.

  The component and hook API is unchanged — `<Masonry />`, `useMasonry`, and `useEndReached` keep their names. Only the package specifier and the emitted data attributes change.

  ```diff
  -import { Masonry } from 'react-virtual-masonry';
  +import { Masonry } from 'kaskaid';
  ```

  **Breaking:** the data attributes emitted on the grid and its items are renamed. Update any CSS or test selectors that target them.

  ```diff
  -[data-rvm-grid]  [data-rvm-lanes]  [data-rvm-item]
  +[data-kaskaid-grid]  [data-kaskaid-lanes]  [data-kaskaid-item]
  ```

## 0.5.0

### Minor Changes

- [#57](https://github.com/2wheeh/react-virtual-masonry/pull/57) [`47c1b44`](https://github.com/2wheeh/react-virtual-masonry/commit/47c1b44f4e4a499ca622a779d9ff5a3a0baaa271) Thanks [@2wheeh](https://github.com/2wheeh)! - Add `computeMasonryLayout({ sizes, lanes, gutter })` — a pure helper that returns the full shortest-column packing (`{ items: { index, lane, start, size }[], totalSize }`) so whole-list UIs like minimaps can reuse the library's layout instead of forking it.

- [#60](https://github.com/2wheeh/react-virtual-masonry/pull/60) [`9ff6257`](https://github.com/2wheeh/react-virtual-masonry/commit/9ff62579694b5d1add991803c8e952c3ac2edf54) Thanks [@2wheeh](https://github.com/2wheeh)! - `<Masonry>`'s `renderItem` callback now receives the full TanStack `VirtualItem` (`key`, `index`, `start`, `end`, `size`, `lane`) alongside the data `item`. This is additive — existing `({ item, index }) => ...` call sites keep working — and lets consumers read `lane` / `size` / `start` without dropping down to `useMasonry`.

- [#56](https://github.com/2wheeh/react-virtual-masonry/pull/56) [`2f05666`](https://github.com/2wheeh/react-virtual-masonry/commit/2f0566661de056235389880110e546a04223efe9) Thanks [@2wheeh](https://github.com/2wheeh)! - `useMasonry` now returns `scrollOffset` and `viewportSize` for the active scroller, so consumers building scroll-aware UI (minimaps, position indicators) don't need to attach their own scroll listener + ResizeObserver.

### Patch Changes

- [#59](https://github.com/2wheeh/react-virtual-masonry/pull/59) [`3eb0af9`](https://github.com/2wheeh/react-virtual-masonry/commit/3eb0af90958e3092c02e6ea69ebc39a01f0d8f52) Thanks [@2wheeh](https://github.com/2wheeh)! - drop baseUrl for ts7 compliance

- [#54](https://github.com/2wheeh/react-virtual-masonry/pull/54) [`2e08acc`](https://github.com/2wheeh/react-virtual-masonry/commit/2e08acc39b952c88ab76b70188719773102e843c) Thanks [@2wheeh](https://github.com/2wheeh)! - Clamp out-of-range indices before invoking the consumer's `estimateSize`, so estimators like `(i) => data[i].height` no longer throw when the virtualizer transiently probes an index outside the data range.

- [#55](https://github.com/2wheeh/react-virtual-masonry/pull/55) [`9998311`](https://github.com/2wheeh/react-virtual-masonry/commit/9998311fb67f6b1207e75b3a695daf0a09147d85) Thanks [@2wheeh](https://github.com/2wheeh)! - Re-export the `VirtualItem` type from `@tanstack/react-virtual`, so consumers can type items from `useMasonry`/`getItemProps` directly instead of deriving `UseMasonryReturn['items'][number]`.

## 0.4.0

### Minor Changes

- [#53](https://github.com/2wheeh/react-virtual-masonry/pull/53) [`f106053`](https://github.com/2wheeh/react-virtual-masonry/commit/f10605375d4448ba7ec1f6d374a035f2c7d01a26) Thanks [@2wheeh](https://github.com/2wheeh)! - Add `scrollElementRef` to `useMasonry` for virtualizing inside a scroll container. Pass a ref to an `overflow:auto` element and the grid windows against that element instead of the page; omit it for window scrolling (unchanged default). Container mode is client-only — `scrollElementRef` and `ssr` are mutually exclusive at the type level. Content above the grid inside the container must have stable height (simplest: make the grid the container's first child).

- [#52](https://github.com/2wheeh/react-virtual-masonry/pull/52) [`54bf8ba`](https://github.com/2wheeh/react-virtual-masonry/commit/54bf8ba5cff71a7701235c5870f6cb03dccaf091) Thanks [@2wheeh](https://github.com/2wheeh)! - Add `useEndReached`, a small fetching-agnostic hook for infinite loading. Pass it `useMasonry().items` plus your data length and a callback; it fires when the last rendered item nears the end of loaded data. Wire the callback to `fetchNextPage` (TanStack Query), `setSize` (SWR), `fetchMore` (Apollo), or any loader — the hook never fetches itself. The `<Masonry>` component also accepts `onEndReached` (with `endReachedThreshold` / `endReachedDisabled`) so component users get infinite loading without composing the hook.

- [#51](https://github.com/2wheeh/react-virtual-masonry/pull/51) [`424c621`](https://github.com/2wheeh/react-virtual-masonry/commit/424c62198085470930f2f5a65ba0de3c4fa665dc) Thanks [@2wheeh](https://github.com/2wheeh)! - Add first-class `scrollToIndex(index, options?)` to `useMasonry`. It's also reachable from the `<Masonry>` component via a `ref` typed `MasonryHandle` (exposing `scrollToIndex` and the `virtualizer` escape hatch), so imperative control no longer requires composing the hook.

### Patch Changes

- [#48](https://github.com/2wheeh/react-virtual-masonry/pull/48) [`670010c`](https://github.com/2wheeh/react-virtual-masonry/commit/670010c450f33294e11e29adeef537bab64beaa8) Thanks [@2wheeh](https://github.com/2wheeh)! - Added workaround for gutter to update vertical gap

## 0.3.0

### Minor Changes

- [#44](https://github.com/2wheeh/react-virtual-masonry/pull/44) [`ad4086c`](https://github.com/2wheeh/react-virtual-masonry/commit/ad4086ccba0742393f3d9e68e84dcbacb1a75e44) Thanks [@2wheeh](https://github.com/2wheeh)! - **Breaking:** replace the `columnsCountBreakPoints` prop with a CSS-driven lane count. The library now reads the `--lanes` custom property from the grid root (`[data-rvm-grid]`), so `@media` / `@container` rules own responsiveness. Also extract the headless `useMasonry` hook (`<Masonry>` is now a thin wrapper) and rename `ssr.columnsCount` to `ssr.lanes`.

- [#42](https://github.com/2wheeh/react-virtual-masonry/pull/42) [`e7cbf96`](https://github.com/2wheeh/react-virtual-masonry/commit/e7cbf96bf025f2700d33746fa89c1f6ae28326fa) Thanks [@2wheeh](https://github.com/2wheeh)! - Add opt-in SSR rendering: pass `ssr={{ itemCount, scrollMargin, columnsCount }}` to render the first N items positioned in server HTML, using the same lane-assignment path the client uses.

### Patch Changes

- [#45](https://github.com/2wheeh/react-virtual-masonry/pull/45) [`04b8ba4`](https://github.com/2wheeh/react-virtual-masonry/commit/04b8ba463458214f584ff34963eb7722641d28c1) Thanks [@2wheeh](https://github.com/2wheeh)! - React ecosystem compliance: emit compiler-runtime imports that work on React 18 (`react-compiler-runtime` polyfill instead of React 19-only `react/compiler-runtime`), add a `'use client'` directive for React Server Components consumers, and stop reading refs during render in `useMasonry` (react-hooks v7 `refs` rule / concurrent-rendering safety).

- [#46](https://github.com/2wheeh/react-virtual-masonry/pull/46) [`b46dd85`](https://github.com/2wheeh/react-virtual-masonry/commit/b46dd854e2076701545bcf95791dc608aa044ca1) Thanks [@2wheeh](https://github.com/2wheeh)! - Keep `scrollMargin` fresh when content above the grid changes height: `useOffsetTop` also observes the document body, so ancestor layout shifts that move `offsetTop` without resizing the grid no longer leave the virtualizer's scroll mapping stale.

## 0.2.0

### Minor Changes

- [#40](https://github.com/2wheeh/react-virtual-masonry/pull/40) [`8908859`](https://github.com/2wheeh/react-virtual-masonry/commit/890885921cd962e85725c3963a25887143deaca0) Thanks [@2wheeh](https://github.com/2wheeh)! - mv virtual to peer, fix lane caching (virtaul#1115)

### Patch Changes

- [`69a3790`](https://github.com/2wheeh/react-virtual-masonry/commit/69a37905e1866892ca9c7e838b646eda18f9e46b) Thanks [@2wheeh](https://github.com/2wheeh)! - exports package.json

- [#40](https://github.com/2wheeh/react-virtual-masonry/pull/40) [`8908859`](https://github.com/2wheeh/react-virtual-masonry/commit/890885921cd962e85725c3963a25887143deaca0) Thanks [@2wheeh](https://github.com/2wheeh)! - disable react compiler for useWindowVirtualizer

## 0.1.11

### Patch Changes

- [`ff0203f`](https://github.com/2wheeh/react-virtual-masonry/commit/ff0203f5c6ded593dfadb924541e1085379e0da3) Thanks [@2wheeh](https://github.com/2wheeh)! - test

- [`5f6e9dd`](https://github.com/2wheeh/react-virtual-masonry/commit/5f6e9dda903e3be101613a2b99191b09699c192c) Thanks [@2wheeh](https://github.com/2wheeh)! - fix lane assignement

## 0.1.10

### Patch Changes

- [`2ebb9bf`](https://github.com/2wheeh/react-virtual-masonry/commit/2ebb9bfc3e97f1db65dba5efcd6fd4d0ed5da491) Thanks [@2wheeh](https://github.com/2wheeh)! - patch for changeset cli

## 0.1.9

### Patch Changes

- [`d4a4627`](https://github.com/2wheeh/react-virtual-masonry/commit/d4a46273b4895e1ddc3e46fb4a5d1d5b04a4480b) Thanks [@2wheeh](https://github.com/2wheeh)! - readme

## 0.1.8

### Patch Changes

- [`777ccff`](https://github.com/2wheeh/react-virtual-masonry/commit/777ccffc9c38bf5f2401882e79a839dac89418e4) Thanks [@2wheeh](https://github.com/2wheeh)! - react-compiler

- [`d0227ef`](https://github.com/2wheeh/react-virtual-masonry/commit/d0227ef7059b3260ae115e8cffc80ead6b3811b0) Thanks [@2wheeh](https://github.com/2wheeh)! - simplify useWindowWidth

- [`e794308`](https://github.com/2wheeh/react-virtual-masonry/commit/e7943089a787808187a4401408fbe6fa7b586f0a) Thanks [@2wheeh](https://github.com/2wheeh)! - bump up dependencies

- [`a65f788`](https://github.com/2wheeh/react-virtual-masonry/commit/a65f78853f88899b257ebe2492c62154144d7356) Thanks [@2wheeh](https://github.com/2wheeh)! - migrate to tsdown

## 0.1.6

### Patch Changes

- [#22](https://github.com/2wheeh/react-virtual-masonry/pull/22) [`e9c7a6e`](https://github.com/2wheeh/react-virtual-masonry/commit/e9c7a6e8f90844a5893b6036fd61bed8544e1948) Thanks [@2wheeh](https://github.com/2wheeh)! - chore: format

## 0.1.5

### Patch Changes

- [#19](https://github.com/2wheeh/react-virtual-masonry/pull/19) [`7b06400`](https://github.com/2wheeh/react-virtual-masonry/commit/7b06400a6e6efecae42b274e1ef12dc737a811f2) Thanks [@2wheeh](https://github.com/2wheeh)! - fix script

## 0.1.4

### Patch Changes

- [#17](https://github.com/2wheeh/react-virtual-masonry/pull/17) [`5c3ca85`](https://github.com/2wheeh/react-virtual-masonry/commit/5c3ca85f9a09eee52065ed6a6201d03259bd4161) Thanks [@2wheeh](https://github.com/2wheeh)! - typo fix

## 0.1.3

### Patch Changes

- [#15](https://github.com/2wheeh/react-virtual-masonry/pull/15) [`d956c30`](https://github.com/2wheeh/react-virtual-masonry/commit/d956c303a044d47e5f6d747e34270bde726747ec) Thanks [@2wheeh](https://github.com/2wheeh)! - correct release script

## 0.1.2

### Patch Changes

- [#12](https://github.com/2wheeh/react-virtual-masonry/pull/12) [`22e5b6d`](https://github.com/2wheeh/react-virtual-masonry/commit/22e5b6d92b9493c1f81ed6d78d089bc2e9bd624c) Thanks [@2wheeh](https://github.com/2wheeh)! - set up ci for release-note

- [#14](https://github.com/2wheeh/react-virtual-masonry/pull/14) [`43f0967`](https://github.com/2wheeh/react-virtual-masonry/commit/43f09675c87bb7311f9ba54559ba4d6291c1b1c6) Thanks [@2wheeh](https://github.com/2wheeh)! - typo fix

## 0.1.1

### Patch Changes

- [#10](https://github.com/2wheeh/react-virtual-masonry/pull/10) [`aca02fa`](https://github.com/2wheeh/react-virtual-masonry/commit/aca02fa33c13f7b8424b690b103b7b205252e4dc) Thanks [@2wheeh](https://github.com/2wheeh)! - set up ci for release-note

## 0.1.0

### Minor Changes

- [#8](https://github.com/2wheeh/react-virtual-masonry/pull/8) [`15b527e`](https://github.com/2wheeh/react-virtual-masonry/commit/15b527eb097b11e4e2e694c29bb29ed317cef804) Thanks [@2wheeh](https://github.com/2wheeh)! - set up version ci
