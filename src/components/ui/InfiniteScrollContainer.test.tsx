import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InfiniteScrollContainer } from '@/components/ui/InfiniteScrollContainer';
import { useWindowedList } from '@/components/ui/useWindowedList';

function createImmediateObserver() {
  return class ImmediateObserver {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      this.callback(
        [
          {
            isIntersecting: true,
            target,
            intersectionRatio: 1,
            time: 0,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
          },
        ],
        this as unknown as IntersectionObserver,
      );
    }
    disconnect() {}
    unobserve() {}
  };
}

function createOffscreenObserver() {
  return class OffscreenObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  };
}

describe('InfiniteScrollContainer', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls onLoadMore when the sentinel intersects', async () => {
    vi.stubGlobal('IntersectionObserver', createImmediateObserver());
    const onLoadMore = vi.fn();

    render(
      <InfiniteScrollContainer
        className="h-24"
        hasMore
        onLoadMore={onLoadMore}
        loadedCount={5}
      >
        <div>items</div>
      </InfiniteScrollContainer>,
    );

    expect(screen.getByTestId('infinite-scroll-sentinel')).toBeInTheDocument();
    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onLoadMore while isLoadingMore is true', () => {
    vi.stubGlobal('IntersectionObserver', createImmediateObserver());
    const onLoadMore = vi.fn();

    render(
      <InfiniteScrollContainer
        hasMore
        onLoadMore={onLoadMore}
        loadedCount={5}
        isLoadingMore
      >
        <div>items</div>
      </InfiniteScrollContainer>,
    );

    expect(screen.getByText('Loading more…')).toBeInTheDocument();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('does not render a sentinel when hasMore is false', () => {
    vi.stubGlobal('IntersectionObserver', createImmediateObserver());
    const onLoadMore = vi.fn();

    render(
      <InfiniteScrollContainer
        hasMore={false}
        onLoadMore={onLoadMore}
        loadedCount={5}
      >
        <div>items</div>
      </InfiniteScrollContainer>,
    );

    expect(
      screen.queryByTestId('infinite-scroll-sentinel'),
    ).not.toBeInTheDocument();
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('shows a retry affordance when error is set', async () => {
    vi.stubGlobal('IntersectionObserver', createOffscreenObserver());
    const onRetry = vi.fn();
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <InfiniteScrollContainer
        hasMore
        onLoadMore={() => undefined}
        loadedCount={5}
        error
        onRetry={onRetry}
      >
        <div>items</div>
      </InfiniteScrollContainer>,
    );

    expect(screen.getByText('Failed to load more.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('useWindowedList', () => {
  it('exposes the first page and grows on loadMore', async () => {
    const items = Array.from({ length: 45 }, (_, index) => index);

    function Harness() {
      const { visibleItems, hasMore, loadMore, totalCount } = useWindowedList(
        items,
        { pageSize: 20, resetKey: 'a' },
      );
      return (
        <div>
          <span data-testid="count">{visibleItems.length}</span>
          <span data-testid="total">{totalCount}</span>
          <span data-testid="has-more">{String(hasMore)}</span>
          <button type="button" onClick={loadMore}>
            more
          </button>
        </div>
      );
    }

    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.getByTestId('count')).toHaveTextContent('20');
    expect(screen.getByTestId('total')).toHaveTextContent('45');
    expect(screen.getByTestId('has-more')).toHaveTextContent('true');

    await user.click(screen.getByRole('button', { name: 'more' }));
    expect(screen.getByTestId('count')).toHaveTextContent('40');

    await user.click(screen.getByRole('button', { name: 'more' }));
    expect(screen.getByTestId('count')).toHaveTextContent('45');
    expect(screen.getByTestId('has-more')).toHaveTextContent('false');
  });

  it('resets the window when resetKey changes', async () => {
    const items = Array.from({ length: 30 }, (_, index) => index);

    function Harness() {
      const [resetKey, setResetKey] = useState('district-a');
      const { visibleItems, loadMore } = useWindowedList(items, {
        pageSize: 10,
        resetKey,
      });
      return (
        <div>
          <span data-testid="count">{visibleItems.length}</span>
          <button type="button" onClick={loadMore}>
            more
          </button>
          <button type="button" onClick={() => setResetKey('district-b')}>
            reset
          </button>
        </div>
      );
    }

    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'more' }));
    expect(screen.getByTestId('count')).toHaveTextContent('20');

    await user.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByTestId('count')).toHaveTextContent('10');
  });
});
