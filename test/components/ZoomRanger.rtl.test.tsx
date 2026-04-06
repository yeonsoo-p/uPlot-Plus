import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { ZoomRanger } from '@/components/ZoomRanger';
import type { DataInput } from '@/types/data';

/** Simple test data for ZoomRanger */
const testData: DataInput = [
  { x: [0, 25, 50, 75, 100], series: [[10, 40, 70, 30, 90]] },
];

async function flushEffects(): Promise<void> {
  await act(async () => {});
}

describe('ZoomRanger component', () => {
  it('renders chart and selection overlay', async () => {
    const { container } = render(
      <ZoomRanger width={400} height={80} data={testData} />,
    );
    await flushEffects();

    const outer = container.querySelector('[data-testid="zoom-ranger"]');
    expect(outer).toBeInTheDocument();

    const selection = container.querySelector('[data-testid="zoom-ranger-selection"]');
    expect(selection).toBeInTheDocument();

    // Should have a canvas element from the inner Chart
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('calls onRangeChange on mount with initial selection', async () => {
    const spy = vi.fn();
    render(
      <ZoomRanger width={400} height={80} data={testData} onRangeChange={spy} />,
    );
    await flushEffects();

    expect(spy).toHaveBeenCalledTimes(1);
    // Default selection is [0.25, 0.75] fraction → [25, 75] data range
    const min = Number(spy.mock.calls[0]![0]);
    const max = Number(spy.mock.calls[0]![1]);
    expect(min).toBeCloseTo(25, 0);
    expect(max).toBeCloseTo(75, 0);
  });

  it('does not call onRangeChange when value has not changed on rerender', async () => {
    const spy = vi.fn();
    const { rerender } = render(
      <ZoomRanger width={400} height={80} data={testData} onRangeChange={spy} />,
    );
    await flushEffects();

    const callCount = spy.mock.calls.length;

    // Rerender with same props
    rerender(
      <ZoomRanger width={400} height={80} data={testData} onRangeChange={spy} />,
    );
    await flushEffects();

    expect(spy.mock.calls.length).toBe(callCount);
  });

  it('respects initialRange prop for initial selection', async () => {
    const spy = vi.fn();
    render(
      <ZoomRanger width={400} height={80} data={testData} initialRange={[10, 60]} onRangeChange={spy} />,
    );
    await flushEffects();

    expect(spy).toHaveBeenCalledTimes(1);
    const min = Number(spy.mock.calls[0]![0]);
    const max = Number(spy.mock.calls[0]![1]);
    expect(min).toBeCloseTo(10, 0);
    expect(max).toBeCloseTo(60, 0);
  });

  it('renders grip handles when grips=true', async () => {
    const { container } = render(
      <ZoomRanger width={400} height={80} data={testData} grips />,
    );
    await flushEffects();

    const grips = container.querySelectorAll('[data-testid^="zoom-ranger-grip-"]');
    expect(grips.length).toBe(2);
  });

  it('does not render grip handles by default', async () => {
    const { container } = render(
      <ZoomRanger width={400} height={80} data={testData} />,
    );
    await flushEffects();

    const grips = container.querySelectorAll('[data-testid^="zoom-ranger-grip-"]');
    expect(grips.length).toBe(0);
  });

  it('applies className to outer wrapper', async () => {
    const { container } = render(
      <ZoomRanger width={400} height={80} data={testData} className="my-ranger" />,
    );
    await flushEffects();

    expect(container.querySelector('.my-ranger')).toBeInTheDocument();
  });

  it('renders left and right dimmed regions', async () => {
    const { container } = render(
      <ZoomRanger width={400} height={80} data={testData} />,
    );
    await flushEffects();

    const dimmed = container.querySelectorAll('[data-testid^="zoom-ranger-dim-"]');
    expect(dimmed.length).toBe(2);
    expect(container.querySelector('[data-testid="zoom-ranger-dim-left"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="zoom-ranger-dim-right"]')).toBeInTheDocument();
  });
});
