import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useMasonry } from './useMasonry';

describe('useMasonry — gutter', () => {
  it('reflects gutter changes in the returned item styles', () => {
    const data = Array.from({ length: 8 }, () => 100);
    const { result, rerender } = renderHook(
      ({ gutter }) => useMasonry({ data, estimateSize: () => 100, gutter }),
      { initialProps: { gutter: 20 } }
    );

    expect(result.current.getItemProps(result.current.items[5]).style).toMatchObject({
      left: 'calc(25% + 5px)',
      width: 'calc(25% - 15px)',
      transform: 'translateY(120px)',
    });

    rerender({ gutter: 40 });

    expect(result.current.getItemProps(result.current.items[5]).style).toMatchObject({
      left: 'calc(25% + 10px)',
      width: 'calc(25% - 30px)',
      transform: 'translateY(140px)',
    });
  });
});

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
