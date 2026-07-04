/**
 * @mock Future value calculation.
 *
 * This is a placeholder/mock implementation of the standard time-value-of-money
 * future value formula. It is not a production-grade financial calculator.
 *
 * TODO before production:
 * - Add input validation for non-finite / NaN values
 * - Consider supporting fractional periods (linear interpolation)
 * - Document the rounding behavior at the boundary of `r.isZero()`
 */
import { Decimal } from '../money.js';

export type PaymentTiming = 'start' | 'end';

export interface FutureValueInput {
  presentValue: Decimal.Value;
  payment: Decimal.Value;
  rate: Decimal.Value;
  periods: number;
  paymentTiming?: PaymentTiming;
}

export function mockFutureValue(input: FutureValueInput): Decimal {
  const { presentValue, payment, rate, periods } = input;
  const timing: PaymentTiming = input.paymentTiming ?? 'end';

  if (!Number.isInteger(periods) || periods < 0) {
    throw new RangeError('periods must be a non-negative integer');
  }

  const r = new Decimal(rate);
  const pv = new Decimal(presentValue);
  const pmt = new Decimal(payment);

  if (r.isZero()) {
    return pv.plus(pmt.times(periods));
  }

  const onePlusR = r.plus(1);
  const growth = onePlusR.pow(periods);
  const annuityFactor = growth.minus(1).div(r);
  const dueMultiplier = timing === 'start' ? onePlusR : new Decimal(1);

  return pv.times(growth).plus(pmt.times(annuityFactor).times(dueMultiplier));
}
