/**
 * Donation Pattern Generator
 * Generates realistic donation amounts following Pareto distribution
 */

import { DONATION_PATTERNS } from '../../config.js';

/**
 * Generate a donation amount following Pareto distribution
 * 60% small ($5-50), 30% medium ($50-500), 9% large ($500-5000), 1% major ($5000+)
 */
export function generateDonationAmount(): number {
  const rand = Math.random() * 100;

  let cumulativeWeight = 0;
  for (const tier of DONATION_PATTERNS.amountDistribution) {
    cumulativeWeight += tier.weight;
    if (rand <= cumulativeWeight) {
      const [min, max] = tier.range;
      const amount = Math.random() * (max - min) + min;

      // Round to nearest dollar for amounts under $100
      if (amount < 100) {
        return Math.round(amount);
      }

      // Round to nearest $5 for amounts $100-$1000
      if (amount < 1000) {
        return Math.round(amount / 5) * 5;
      }

      // Round to nearest $50 for amounts over $1000
      return Math.round(amount / 50) * 50;
    }
  }

  // Fallback (should never reach here)
  return 25;
}

/**
 * Generate a monthly recurring donation amount
 * Typically lower than one-time donations
 */
export function generateRecurringAmount(): number {
  const amounts = [10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 500];
  const weights = [25, 20, 15, 15, 10, 5, 5, 2, 2, 0.5, 0.5];

  const rand = Math.random() * 100;
  let cumulativeWeight = 0;

  for (let i = 0; i < amounts.length; i++) {
    cumulativeWeight += weights[i];
    if (rand <= cumulativeWeight) {
      return amounts[i];
    }
  }

  return 25;
}

/**
 * Generate a pledge amount (typically larger)
 */
export function generatePledgeAmount(): number {
  const amounts = [500, 1000, 2000, 3000, 5000, 10000];
  const weights = [30, 35, 20, 10, 4, 1];

  const rand = Math.random() * 100;
  let cumulativeWeight = 0;

  for (let i = 0; i < amounts.length; i++) {
    cumulativeWeight += weights[i];
    if (rand <= cumulativeWeight) {
      return amounts[i];
    }
  }

  return 1000;
}

/**
 * Apply Ramadan multiplier to donation count
 */
export function applyRamadanMultiplier(baseCount: number): number {
  return Math.round(baseCount * DONATION_PATTERNS.ramadanMultiplier);
}

/**
 * Apply Friday multiplier to donation likelihood
 */
export function applyFridayMultiplier(baseCount: number): number {
  return Math.round(baseCount * DONATION_PATTERNS.fridayMultiplier);
}

/**
 * Get payment method based on distribution
 */
export function getPaymentMethod(): 'card' | 'cash' | 'bank_transfer' {
  const rand = Math.random() * 100;

  if (rand <= DONATION_PATTERNS.paymentMethods.card) {
    return 'card';
  }

  if (rand <= DONATION_PATTERNS.paymentMethods.card + DONATION_PATTERNS.paymentMethods.cash) {
    return 'cash';
  }

  return 'bank_transfer';
}

/**
 * Determine if donation should be Zakat or Sadaqah
 */
export function getDonationType(): 'zakat' | 'sadaqah' {
  // Roughly 35% of donations are Zakat
  return Math.random() < 0.35 ? 'zakat' : 'sadaqah';
}

/**
 * Get recurring donation frequency
 */
export function getRecurringFrequency(): 'monthly' | 'annually' {
  // 80% monthly, 20% annually
  return Math.random() < 0.8 ? 'monthly' : 'annually';
}

/**
 * Generate pledge payment schedule (number of installments)
 */
export function getPledgeInstallments(): number {
  const options = [3, 6, 12, 24];
  const weights = [20, 40, 30, 10];

  const rand = Math.random() * 100;
  let cumulativeWeight = 0;

  for (let i = 0; i < options.length; i++) {
    cumulativeWeight += weights[i];
    if (rand <= cumulativeWeight) {
      return options[i];
    }
  }

  return 6;
}
