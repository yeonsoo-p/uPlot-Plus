import { bench, describe } from 'vitest';
import { BlockMinMaxTree } from '@/core/BlockMinMax';
import { getMinMax } from '@/math/utils';

function makeData(n: number): (number | null)[] {
  const data = new Array<number | null>(n);
  for (let i = 0; i < n; i++) {
    data[i] = Math.sin(i * 0.01) * 100;
  }
  return data;
}

describe('BlockMinMaxTree vs getMinMax', () => {
  const data1M = makeData(1_000_000);
  const data10M = makeData(10_000_000);
  const tree1M = new BlockMinMaxTree(data1M);
  const tree10M = new BlockMinMaxTree(data10M);

  bench('getMinMax 1M full range', () => {
    getMinMax(data1M, 0, 999_999);
  });

  bench('BlockMinMax 1M full range', () => {
    tree1M.rangeMinMax(0, 999_999);
  });

  bench('getMinMax 10M full range', () => {
    getMinMax(data10M, 0, 9_999_999);
  });

  bench('BlockMinMax 10M full range', () => {
    tree10M.rangeMinMax(0, 9_999_999);
  });

  bench('getMinMax 10M 10% window', () => {
    getMinMax(data10M, 4_500_000, 5_500_000);
  });

  bench('BlockMinMax 10M 10% window', () => {
    tree10M.rangeMinMax(4_500_000, 5_500_000);
  });
});

describe('BlockMinMaxTree build cost', () => {
  const data1M = makeData(1_000_000);
  const data10M = makeData(10_000_000);

  bench('build tree 1M', () => {
    new BlockMinMaxTree(data1M);
  });

  bench('build tree 10M', () => {
    new BlockMinMaxTree(data10M);
  });
});
