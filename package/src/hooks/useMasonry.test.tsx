import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useMasonry } from './useMasonry';

// ---------------------------------------------------------------------------
// ResizeObserver mock — happy-dom may not provide one; fire synchronously so
// the virtualizer has a resolved rect/lane count by the time we assert.
// ---------------------------------------------------------------------------
type ROCallback = (entries: ResizeObserverEntry[]) => void;

class SyncResizeObserver {
  private callback: ROCallback;
  constructor(callback: ROCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback([{ target } as ResizeObserverEntry]);
  }
  unobserve() {}
  disconnect() {}
}

describe.each(['window', 'container'] as const)('useMasonry — gutter (%s)', (mode) => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', SyncResizeObserver);
    container = document.createElement('div');
    // happy-dom has no layout engine; give the element virtualizer a viewport.
    Object.defineProperty(container, 'offsetHeight', { value: 400 });
    Object.defineProperty(container, 'offsetWidth', { value: 800 });
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  it('updates positions and total height when gutter changes, preserving measured sizes', () => {
    const data = Array.from({ length: 8 }, () => 100);
    const scrollElementRef = mode === 'container' ? { current: container } : undefined;
    const { result, rerender } = renderHook(
      ({ gutter }) => useMasonry({ data, estimateSize: (i) => data[i], gutter, scrollElementRef }),
      { initialProps: { gutter: 20 } }
    );

    expect(result.current.items.map((item) => item.start)).toEqual([
      0, 0, 0, 0, 120, 120, 120, 120,
    ]);
    expect(result.current.gridProps.style.height).toBe('220px');

    // The first row measures taller than estimated. Gutter changes must keep
    // those sizes instead of clearing them and falling back to the estimates.
    act(() => {
      for (let index = 0; index < 4; index++) {
        result.current.virtualizer.resizeItem(index, 150);
      }
    });

    expect(result.current.gridProps.style.height).toBe('270px');

    for (const [gutter, start, height] of [
      [40, 190, '290px'],
      [0, 150, '250px'],
      [20, 170, '270px'],
    ] as const) {
      rerender({ gutter });

      expect(result.current.items.map((item) => item.start)).toEqual([
        0,
        0,
        0,
        0,
        start,
        start,
        start,
        start,
      ]);
      expect(result.current.items.map((item) => item.size)).toEqual([
        150, 150, 150, 150, 100, 100, 100, 100,
      ]);
      expect(result.current.gridProps.style.height).toBe(height);
      expect(result.current.getItemProps(result.current.items[4]).style.transform).toBe(
        `translateY(${start}px)`
      );
    }
  });
});

describe('useMasonry — scrollToIndex', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', SyncResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not call the virtualizer unless invoked', () => {
    const { result } = renderHook(() => useMasonry({ data: [1, 2, 3], estimateSize: () => 100 }));

    const spy = vi.spyOn(result.current.virtualizer, 'scrollToIndex');

    expect(spy).not.toHaveBeenCalled();
  });

  it('forwards index and options to the underlying virtualizer', () => {
    const { result } = renderHook(() => useMasonry({ data: [1, 2, 3], estimateSize: () => 100 }));

    const spy = vi.spyOn(result.current.virtualizer, 'scrollToIndex');
    result.current.scrollToIndex(2, { align: 'center', behavior: 'smooth' });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(2, { align: 'center', behavior: 'smooth' });
  });

  it('stays referentially stable across re-renders (safe in effect deps)', () => {
    const { result, rerender } = renderHook(
      (props: { data: number[] }) => useMasonry({ data: props.data, estimateSize: () => 100 }),
      { initialProps: { data: [1, 2, 3] } }
    );

    const first = result.current.scrollToIndex;
    rerender({ data: [1, 2, 3, 4] });
    const second = result.current.scrollToIndex;

    expect(second).toBe(first);
  });
});
