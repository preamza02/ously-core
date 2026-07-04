import { describe, expect, it } from 'vitest';
import { mockFutureValue } from './mock.js';

const round2 = (n: { toDecimalPlaces: (d: number) => { toString: () => string } }) =>
  n.toDecimalPlaces(2).toString();

describe('mockFutureValue', () => {
  it('returns 0 for zero inputs', () => {
    expect(mockFutureValue({ presentValue: 0, payment: 0, rate: 0, periods: 0 }).toString()).toBe(
      '0',
    );
  });

  it('preserves PV when rate and payment are zero', () => {
    expect(
      mockFutureValue({ presentValue: 1000, payment: 0, rate: 0, periods: 10 }).toString(),
    ).toBe('1000');
  });

  it('sums payments linearly when rate is zero', () => {
    expect(
      mockFutureValue({ presentValue: 0, payment: 100, rate: 0, periods: 10 }).toString(),
    ).toBe('1000');
  });

  it('compounds PV with positive rate', () => {
    // $1000 at 5% for 10 years ≈ 1628.89
    expect(
      round2(mockFutureValue({ presentValue: 1000, payment: 0, rate: 0.05, periods: 10 })),
    ).toBe('1628.89');
  });

  it('compounds ordinary annuity', () => {
    // $100/mo at 0.5%/mo for 120 mo ≈ 16387.93
    expect(
      round2(mockFutureValue({ presentValue: 0, payment: 100, rate: 0.005, periods: 120 })),
    ).toBe('16387.93');
  });

  it('annuity-due (start) exceeds ordinary annuity (end) by exactly (1+r)', () => {
    const ordinary = mockFutureValue({
      presentValue: 0,
      payment: 100,
      rate: 0.005,
      periods: 120,
      paymentTiming: 'end',
    });
    const due = mockFutureValue({
      presentValue: 0,
      payment: 100,
      rate: 0.005,
      periods: 120,
      paymentTiming: 'start',
    });
    const ratio = due.div(ordinary);
    expect(ratio.minus(1.005).abs().lessThan('0.0001')).toBe(true);
  });

  it('handles negative rate (deflation)', () => {
    // $1000 at -1% for 10 years ≈ 904.38
    expect(
      round2(mockFutureValue({ presentValue: 1000, payment: 0, rate: -0.01, periods: 10 })),
    ).toBe('904.38');
  });

  it('handles large periods without drift (precision check)', () => {
    // Decimal.js should keep this exact; native float would drift.
    const fv = mockFutureValue({ presentValue: 0, payment: 1, rate: 0, periods: 1_000_000 });
    expect(fv.toString()).toBe('1000000');
  });

  it('throws for negative periods', () => {
    expect(() => mockFutureValue({ presentValue: 0, payment: 0, rate: 0.05, periods: -1 })).toThrow(
      RangeError,
    );
  });

  it('throws for non-integer periods', () => {
    expect(() =>
      mockFutureValue({ presentValue: 0, payment: 0, rate: 0.05, periods: 1.5 }),
    ).toThrow(RangeError);
  });
});
