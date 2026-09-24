import { CSSProperties, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import {
  useVirtualizer,
  useWindowVirtualizer,
  type ScrollToOptions,
  type VirtualItem,
  type Virtualizer,
} from '@tanstack/react-virtual';

import { useContainerOffsetTop } from './useContainerOffsetTop';
import { useCSSLaneCount } from './useCSSLaneCount';
import { useOffsetTop } from './useOffsetTop';

const DEFAULT_LANES = 4;
const DEFAULT_OVERSCAN = 3;
const DEFAULT_GUTTER = 20;

/** SSR rendering configuration — opt into server-rendered positioned items. */
export interface SSRConfig {
  /** Number of items to render in server HTML. */
  itemCount: number;
  /** Distance from document top to the grid container. @default 0 */
  scrollMargin?: number;
  /** Lane count used during SSR / first paint. @default DEFAULT_LANES */
  lanes?: number;
}

interface BaseOptions<Data> {
  data: Data[];
  gutter?: number;
  overscan?: number;
}

interface ClientOnlyOptions<Data> extends BaseOptions<Data> {
  ssr?: undefined;
  /** Optional in client-only mode (items measure post-mount); recommended for large
   *  lists so off-screen sizes feed `getTotalSize()` and lane balance. */
  estimateSize?: (index: number) => number;
  /** Virtualize inside this `overflow:auto` element instead of the window; omit for
   *  window scrolling. Mutually exclusive with `ssr` (container mode is client-only). */
  scrollElementRef?: RefObject<HTMLElement | null>;
}

interface SSROptions<Data> extends BaseOptions<Data> {
  ssr: SSRConfig;
  /** Required with `ssr` — the only height source for server HTML (no DOM to measure). */
  estimateSize: (index: number) => number;
  /** `never` so `scrollElementRef` can't combine with `ssr` (SSR is window-only). */
  scrollElementRef?: never;
}

/** Options for {@link useMasonry}. Discriminated on `ssr`: SSR requires `estimateSize`
 *  and excludes `scrollElementRef` (SSR is window-only). */
export type UseMasonryOptions<Data> = ClientOnlyOptions<Data> | SSROptions<Data>;

/** Spread onto the grid root element. */
export interface MasonryGridProps {
  ref: RefObject<HTMLDivElement | null>;
  style: CSSProperties;
  'data-kaskaid-grid': '';
  'data-kaskaid-lanes': number;
}

/** Spread onto an item element. Pass `key={item.key}` separately. */
export interface MasonryItemProps {
  ref: (el: HTMLElement | null) => void;
  'data-index': number;
  'data-kaskaid-item': '';
  style: CSSProperties;
}

export interface UseMasonryReturn {
  gridProps: MasonryGridProps;
  /** Returns props for a single item — spread the result; pass `key` separately. */
  getItemProps: (item: VirtualItem) => MasonryItemProps;
  /**
   * Items to render this frame. SSR / pre-mount: first `ssr.itemCount` from
   * `measurementsCache`. Post-mount: real visible window from the virtualizer.
   */
  items: VirtualItem[];
  /** Current lane count — `--lanes` post-mount, fallback pre-mount. */
  lanes: number;
  /** Underlying TanStack virtualizer — escape hatch for imperative APIs beyond
   *  `scrollToIndex`. Element-scoped when `scrollElementRef` is set, else window-scoped.
   *  Stable identity + mutable internals: prefer `items`/`lanes` in render (or `'use no memo'`). */
  virtualizer: Virtualizer<HTMLElement, Element> | Virtualizer<Window, Element>;
  /** Scrolls so `index` is positioned per `options.align` (default `'auto'`). Referentially
   *  stable — safe in effect deps. Thin forward to TanStack Virtual's
   *  {@link https://tanstack.com/virtual/latest/docs/api/virtualizer#scrolltoindex scrollToIndex};
   *  cold-jump accuracy is bounded by `estimateSize` (see docs). */
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
  /** Current scroll offset (px) of the active scroller — the window or, in container
   *  mode, the `scrollElementRef` element. Reactive: re-renders on scroll. `0` before
   *  the virtualizer has measured. Use for scroll-aware UI (minimaps, position
   *  indicators) without attaching your own scroll listener. */
  scrollOffset: number;
  /** Viewport height (px) of the active scroller — the window or, in container mode,
   *  the `scrollElementRef` element. Reactive: re-renders as the viewport resizes. `0`
   *  before the virtualizer has measured. Pairs with {@link scrollOffset}. */
  viewportSize: number;
}

/**
 * Headless masonry hook. Owns the virtualizer, lane-count tracking, and the SSR
 * fallback chain; returns prop bags you spread onto your own JSX.
 *
 * Emits `[data-kaskaid-grid]` (with `data-kaskaid-lanes`) and `[data-kaskaid-item]` selectors.
 * Never declares `container-type` — wrap externally for `@container`.
 */
export function useMasonry<Data>({
  data,
  gutter = DEFAULT_GUTTER,
  estimateSize,
  overscan = DEFAULT_OVERSCAN,
  ssr,
  scrollElementRef,
}: UseMasonryOptions<Data>): UseMasonryReturn {
  // `getVirtualItems()` side-effects `measurementsCache` every render — auto-memo
  // would starve the SSR fallback slice.
  'use no memo';

  const gridRef = useRef<HTMLDivElement>(null);
  const useContainer = !!scrollElementRef;

  // Clamp to >= 1 — lane math divides by n; 0/negative would emit Infinity/NaN CSS.
  const lanes = useCSSLaneCount(gridRef, {
    fallback: Math.max(1, ssr?.lanes ?? DEFAULT_LANES),
  });

  // Both offset hooks always run (rules-of-hooks); mode picks the active one.
  // `ssr` is type-excluded in container mode, so the container fallback is 0.
  const windowScrollMargin = useOffsetTop(gridRef, { fallback: ssr?.scrollMargin ?? 0 });
  const containerScrollMargin = useContainerOffsetTop(gridRef, scrollElementRef, { fallback: 0 });

  // Explicit mount signal — reading `gridRef.current` during render is impure.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // The virtualizer transiently probes indices outside `data` (mid-`scrollToIndex`,
  // or as a growing feed shrinks), so clamp to `[0, length-1]` before handing off to
  // the consumer's `estimateSize` — otherwise estimators like `(i) => data[i].height`
  // throw on the out-of-range read. Plain function is fine under `'use no memo'`.
  const boundedEstimateSize = (index: number) => {
    if (!estimateSize || data.length === 0) return 0;
    return estimateSize(Math.min(Math.max(index, 0), data.length - 1));
  };

  // Rules-of-hooks forbids picking one virtualizer by mode, and their types are
  // incompatible (`useVirtualizer` rejects `Window`). So both run; the idle one is
  // made inert by TanStack's `enabled` option — no scroll/resize listeners.
  const windowVirtualizer = useWindowVirtualizer({
    count: data.length,
    estimateSize: boundedEstimateSize,
    overscan,
    lanes,
    scrollMargin: windowScrollMargin,
    gap: gutter,
    laneAssignmentMode: 'measured',
    enabled: !useContainer,
  });

  const elementVirtualizer = useVirtualizer({
    count: data.length,
    estimateSize: boundedEstimateSize,
    overscan,
    lanes,
    scrollMargin: containerScrollMargin,
    gap: gutter,
    laneAssignmentMode: 'measured',
    getScrollElement: () => scrollElementRef?.current ?? null,
    enabled: useContainer,
  });

  const virtualizer = useContainer ? elementVirtualizer : windowVirtualizer;

  // When no visible range yet (server, or client pre-effect), slice the cache
  // for SSR rendering. The `mounted` gate keeps post-mount empty ranges empty.
  const visibleItems = virtualizer.getVirtualItems();
  const items =
    visibleItems.length === 0 && ssr && !mounted
      ? virtualizer.measurementsCache.slice(0, ssr.itemCount)
      : visibleItems;

  // Lane width = (W − (n−1)·gutter) / n, as `calc(% + px)` so the browser evaluates
  // against actual container width at paint time.
  const laneWidthCalc = `calc(${100 / lanes}% - ${(gutter * (lanes - 1)) / lanes}px)`;

  // `virtualizer` is a stable class instance (TanStack re-`setOptions`s it in
  // place), so closing over it keeps this wrapper's identity stable too.
  const scrollToIndex = useCallback(
    (index: number, options?: ScrollToOptions) => virtualizer.scrollToIndex(index, options),
    [virtualizer]
  );

  return {
    gridProps: {
      ref: gridRef,
      style: {
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      },
      'data-kaskaid-grid': '',
      'data-kaskaid-lanes': lanes,
    },
    getItemProps: ({ lane, index, start }: VirtualItem) => ({
      ref: virtualizer.measureElement,
      'data-index': index,
      'data-kaskaid-item': '',
      style: {
        position: 'absolute',
        top: 0,
        left: `calc(${(100 * lane) / lanes}% + ${(gutter * lane) / lanes}px)`,
        width: laneWidthCalc,
        transform: `translateY(${start - virtualizer.options.scrollMargin}px)`,
      },
    }),
    items,
    lanes,
    virtualizer,
    scrollToIndex,
    scrollOffset: virtualizer.scrollOffset ?? 0,
    viewportSize: virtualizer.scrollRect?.height ?? 0,
  };
}
