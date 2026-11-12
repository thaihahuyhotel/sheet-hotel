import { BookingChannel, RoomType } from '../types/hotel';

export interface PriceBreakdown {
  directPrice: number;
  managementFee: number;
  commissionRate: number;
  listedPrice: number;
  commissionAmount: number;
  netPayout: number;
  profitDelta: number; // netPayout - directPrice (should equal management fee)
  formulaDescription: string;
}

export function formatVND(amount: number): string {
  if (isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫';
}

export function formatShortVND(amount: number): string {
  if (amount >= 1000000) {
    const val = amount / 1000000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)) + ' tr';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'k';
  }
  return amount + '₫';
}

export function roundPrice(amount: number, rounding: '1000' | '10000' | 'none'): number {
  if (rounding === '10000') {
    return Math.round(amount / 10000) * 10000;
  }
  if (rounding === '1000') {
    return Math.round(amount / 1000) * 1000;
  }
  return Math.round(amount);
}

/**
 * Calculates OTA listing price and breakdown based on the formula:
 * 
 * Target: When OTA deducts their % commission, the hotel must receive
 * exactly (Direct Price + Management Fee).
 * 
 * Formula A (Net Guaranteed):
 * Listed Price = (Direct Price + Management Fee) / (1 - Commission Rate)
 * 
 * Formula B (Simple Markup):
 * Listed Price = (Direct Price / (1 - Commission Rate)) + Management Fee
 */
export function calculateOtaPrice(
  directPrice: number,
  channel: BookingChannel,
  commissionRate: number,
  managementFee: number = 150000,
  formula: 'net_guaranteed' | 'simple_markup' = 'net_guaranteed',
  rounding: '1000' | '10000' | 'none' = '1000'
): PriceBreakdown {
  // If direct booking, 0 commission and 0 management fee surcharge
  if (channel === 'direct' || commissionRate === 0) {
    return {
      directPrice,
      managementFee: 0,
      commissionRate: 0,
      listedPrice: directPrice,
      commissionAmount: 0,
      netPayout: directPrice,
      profitDelta: 0,
      formulaDescription: 'Giá bán trực tiếp gốc (không mất hoa hồng sàn)',
    };
  }

  let rawListedPrice = 0;
  let formulaDescription = '';

  if (formula === 'net_guaranteed') {
    // Listed = (Direct + ManagementFee) / (1 - Commission)
    // Ensures Net Payout = Direct + ManagementFee after OTA deduction
    const targetNet = directPrice + managementFee;
    rawListedPrice = targetNet / (1 - commissionRate);
    formulaDescription = `(${formatVND(directPrice)} + ${formatVND(managementFee)}) ÷ (1 - ${(commissionRate * 100).toFixed(0)}%)`;
  } else {
    // Listed = (Direct / (1 - Commission)) + ManagementFee
    rawListedPrice = (directPrice / (1 - commissionRate)) + managementFee;
    formulaDescription = `(${formatVND(directPrice)} ÷ [1 - ${(commissionRate * 100).toFixed(0)}%]) + ${formatVND(managementFee)}`;
  }

  const listedPrice = roundPrice(rawListedPrice, rounding);
  const commissionAmount = Math.round(listedPrice * commissionRate);
  const netPayout = listedPrice - commissionAmount;
  const profitDelta = netPayout - directPrice;

  return {
    directPrice,
    managementFee,
    commissionRate,
    listedPrice,
    commissionAmount,
    netPayout,
    profitDelta,
    formulaDescription,
  };
}

/**
 * Quick helper to get price for a specific room type and channel
 */
export function getRoomPriceForChannel(
  directPrice: number,
  channel: BookingChannel,
  channelCommissions: Record<BookingChannel, number>,
  managementFee: number = 150000,
  formula: 'net_guaranteed' | 'simple_markup' = 'net_guaranteed',
  rounding: '1000' | '10000' | 'none' = '1000'
): number {
  if (channel === 'direct') return directPrice;
  const rate = channelCommissions[channel] ?? 0.15;
  const breakdown = calculateOtaPrice(directPrice, channel, rate, managementFee, formula, rounding);
  return breakdown.listedPrice;
}
