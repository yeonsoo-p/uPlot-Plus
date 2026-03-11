import { describe, it, expect, beforeEach } from 'vitest';
import { ScaleManager } from '@/core/ScaleManager';
import { DataStore } from '@/core/DataStore';
import type { ChartData } from '@/types';
import { Distribution } from '@/types';

describe('ScaleManager', () => {
  let mgr: ScaleManager;

  beforeEach(() => {
    mgr = new ScaleManager();
  });

  describe('scale CRUD', () => {
    it('addScale / getScale', () => {
      mgr.addScale({ id: 'x' });
      const s = mgr.getScale('x');
      expect(s).toBeDefined();
      expect(s!.id).toBe('x');
    });

    it('removeScale', () => {
      mgr.addScale({ id: 'y' });
      mgr.removeScale('y');
      expect(mgr.getScale('y')).toBeUndefined();
    });

    it('getAllScales iterates', () => {
      mgr.addScale({ id: 'a' });
      mgr.addScale({ id: 'b' });
      const ids = [...mgr.getAllScales()].map(s => s.id);
      expect(ids).toContain('a');
      expect(ids).toContain('b');
    });
  });

  describe('group x-scale mapping', () => {
    it('set and get', () => {
      mgr.setGroupXScale(0, 'x');
      expect(mgr.getGroupXScaleKey(0)).toBe('x');
    });

    it('returns undefined for unmapped group', () => {
      expect(mgr.getGroupXScaleKey(99)).toBeUndefined();
    });
  });

  describe('setRange', () => {
    it('updates scale min/max', () => {
      mgr.addScale({ id: 'x' });
      mgr.setRange('x', 10, 20);
      const s = mgr.getScale('x');
      expect(s!.min).toBe(10);
      expect(s!.max).toBe(20);
    });

    it('invalidates cache', () => {
      mgr.addScale({ id: 'x', distr: Distribution.Log, min: 1, max: 100 });
      mgr.setRange('x', 10, 1000);
      const s = mgr.getScale('x');
      expect(s!._min).toBeNull();
      expect(s!._max).toBeNull();
    });

    it('no-op for nonexistent scale', () => {
      mgr.setRange('nope', 0, 1); // should not throw
    });
  });

  describe('autoRange', () => {
    const data: ChartData = [
      { x: [0, 1, 2, 3, 4], series: [[10, 20, 15, 25, 30]] },
    ];

    it('auto-ranges x-scale from data', () => {
      mgr.addScale({ id: 'x' });
      mgr.setGroupXScale(0, 'x');

      const ds = new DataStore();
      ds.setData(data);

      mgr.autoRange(data, [], ds);

      const s = mgr.getScale('x');
      expect(s!.min).toBe(0);
      expect(s!.max).toBe(4);
    });

    it('auto-ranges y-scale from series data', () => {
      mgr.addScale({ id: 'x' });
      mgr.addScale({ id: 'y' });
      mgr.setGroupXScale(0, 'x');

      const ds = new DataStore();
      ds.setData(data);
      ds.updateWindows(() => mgr.getScale('x'));

      const seriesMap = [{ group: 0, index: 0, yScale: 'y' }];
      mgr.autoRange(data, seriesMap, ds);

      const s = mgr.getScale('y');
      expect(s!.min).toBeDefined();
      expect(s!.max).toBeDefined();
      expect(s!.min!).toBeLessThanOrEqual(10);
      expect(s!.max!).toBeGreaterThanOrEqual(30);
    });

    it('skips non-auto scales', () => {
      mgr.addScale({ id: 'x', auto: false, min: 0, max: 100 });
      mgr.setGroupXScale(0, 'x');

      const ds = new DataStore();
      ds.setData(data);

      mgr.autoRange(data, [], ds);

      const s = mgr.getScale('x');
      expect(s!.min).toBe(0);
      expect(s!.max).toBe(100);
    });

    it('handles log y-scale', () => {
      mgr.addScale({ id: 'x' });
      mgr.addScale({ id: 'y', distr: Distribution.Log, log: 10 });
      mgr.setGroupXScale(0, 'x');

      const logData: ChartData = [
        { x: [0, 1, 2], series: [[1, 100, 10000]] },
      ];

      const ds = new DataStore();
      ds.setData(logData);
      ds.updateWindows(() => mgr.getScale('x'));

      mgr.autoRange(logData, [{ group: 0, index: 0, yScale: 'y' }], ds);

      const s = mgr.getScale('y');
      expect(s!.min).toBeDefined();
      expect(s!.max).toBeDefined();
      expect(s!.min!).toBeLessThanOrEqual(1);
      expect(s!.max!).toBeGreaterThanOrEqual(10000);
    });

    it('handles multiple groups sharing x-scale', () => {
      mgr.addScale({ id: 'x' });
      mgr.setGroupXScale(0, 'x');
      mgr.setGroupXScale(1, 'x');

      const multiData: ChartData = [
        { x: [0, 1, 2], series: [[1, 2, 3]] },
        { x: [5, 6, 7], series: [[4, 5, 6]] },
      ];

      const ds = new DataStore();
      ds.setData(multiData);
      mgr.autoRange(multiData, [], ds);

      const s = mgr.getScale('x');
      expect(s!.min).toBe(0);
      expect(s!.max).toBe(7);
    });
  });
});
