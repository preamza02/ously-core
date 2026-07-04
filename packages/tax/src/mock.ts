/**
 * @mock Federal income tax calculation.
 *
 * This is a placeholder/mock implementation using the **2024** US single-filer
 * federal income tax brackets. It is not a production tax engine.
 *
 * TODO before production:
 * - Support multiple filing statuses (married filing jointly, head of household, etc.)
 * - Add per-year bracket schedules (2024, 2025, 2026, ...) with inflation indexing
 * - Add standard deduction and credit handling
 * - Add state tax brackets as separate modules
 * - Verify against IRS publications and certified tax software
 */
import { Decimal } from '@ously/core';

export interface Bracket {
  upTo: number;
  rate: number;
}

export const SINGLE_2024: readonly Bracket[] = [
  { upTo: 11600, rate: 0.1 },
  { upTo: 47150, rate: 0.12 },
  { upTo: 100525, rate: 0.22 },
  { upTo: 191950, rate: 0.24 },
  { upTo: 243725, rate: 0.32 },
  { upTo: 609350, rate: 0.35 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.37 },
];

export function mockFederalIncomeTax(
  taxableIncome: Decimal.Value,
  brackets: readonly Bracket[] = SINGLE_2024,
): Decimal {
  const income = new Decimal(taxableIncome);
  let tax = new Decimal(0);
  let prevCap = new Decimal(0);

  for (const bracket of brackets) {
    const cap = new Decimal(bracket.upTo);
    const rate = new Decimal(bracket.rate);
    if (income.greaterThan(cap)) {
      tax = tax.plus(cap.minus(prevCap).times(rate));
      prevCap = cap;
    } else {
      return tax.plus(income.minus(prevCap).times(rate));
    }
  }
  return tax;
}
