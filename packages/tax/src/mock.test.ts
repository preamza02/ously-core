import { describe, expect, it } from 'vitest';
import { mockFederalIncomeTax, type SINGLE_2024 } from './mock.js';

const round2 = (n: { toDecimalPlaces: (d: number) => { toString: () => string } }) =>
  n.toDecimalPlaces(2).toString();

describe('mockFederalIncomeTax', () => {
  it('returns 0 for zero income', () => {
    expect(mockFederalIncomeTax(0).toString()).toBe('0');
  });

  it('applies 10% within the first bracket', () => {
    expect(mockFederalIncomeTax(5000).toString()).toBe('500');
  });

  it('crosses the 10% → 12% boundary', () => {
    // 11600 @ 10% = 1160
    // (20000 - 11600) = 8400 @ 12% = 1008
    // total = 2168
    expect(mockFederalIncomeTax(20000).toString()).toBe('2168');
  });

  it('lands exactly at a boundary (no overflow into next bracket)', () => {
    // Exactly 11600 → 10% only = 1160
    expect(mockFederalIncomeTax(11600).toString()).toBe('1160');
  });

  it('handles high income crossing all brackets', () => {
    // 1,000,000 single 2024:
    // 11600*0.10=1160
    // 35550*0.12=4266
    // 53375*0.22=11742.5
    // 91425*0.24=21942
    // 51775*0.32=16568
    // 365625*0.35=127968.75
    // (1000000-609350)=390650*0.37=144540.5
    // total = 328187.75
    expect(round2(mockFederalIncomeTax(1_000_000))).toBe('328187.75');
  });

  it('accepts a custom bracket schedule', () => {
    const flat10: typeof SINGLE_2024 = [{ upTo: Number.POSITIVE_INFINITY, rate: 0.1 }];
    expect(mockFederalIncomeTax(50000, flat10).toString()).toBe('5000');
  });
});
