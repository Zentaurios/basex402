/**
 * Format token amount from smallest unit to human-readable format
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  const value = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  
  const wholePart = value / divisor;
  const fractionalPart = value % divisor;
  
  // Convert fractional part to string with leading zeros
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  
  // Remove trailing zeros from fractional part
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return wholePart.toString();
  }
  
  // Show up to 6 decimal places for display
  const displayFractional = trimmedFractional.slice(0, 6);
  
  return `${wholePart}.${displayFractional}`;
}
