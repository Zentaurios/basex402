/**
 * Token Spam Detection
 * 
 * This file contains utilities to detect spam/scam tokens based on various heuristics.
 */

type TokenData = {
  symbol?: string;
  name?: string;
  contractAddress?: string;
  mintAddress?: string;
};

/**
 * Check if text contains suspicious patterns
 */
function hasSuspiciousPatterns(text: string): boolean {
  if (!text) return false;

  const suspiciousPatterns = [
    // Social media links
    /t\.me\//i,           // Telegram
    /telegram/i,
    /discord\.gg/i,       // Discord
    /@\w+/,               // Twitter handles
    /twitter\.com/i,
    
    // URLs and domains
    /https?:\/\//i,       // HTTP/HTTPS links
    /\.com/i,
    /\.io/i,
    /\.xyz/i,
    /\.app/i,
    
    // Scam keywords
    /claim/i,
    /airdrop/i,
    /reward/i,
    /bonus/i,
    /visit/i,
    /limited/i,
    /\.\.\.+/,            // Multiple dots
    
    // Urgency tactics
    /until \d+\.\d+\.\d+/i,  // "until 17.10.25"
    /expires?/i,
    /hurry/i,
    /last chance/i,
    
    // Emojis (common in spam)
    /[\u{1F300}-\u{1F9FF}]/u,  // Emoji ranges
    /[✅❌⚠️💰🎁🚀]/,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if text contains lookalike/homograph Unicode characters
 * (Characters that look like ASCII but aren't)
 */
function hasLookalikeCharacters(text: string): boolean {
  if (!text) return false;

  // Common lookalike characters used in scams
  const lookalikePatterns = [
    /[АΒСᎠЕҒGНІЈΚLМΝОРԚRSТUVᎳХҮZ]/,  // Cyrillic that looks like Latin
    /[аｂｃｄеｆɡһіјｋｌｍｎоｐԛｒｓｔｕｖｗхуｚ]/,  // Fullwidth and other lookalikes
    /[０-９]/,  // Fullwidth numbers
  ];

  return lookalikePatterns.some(pattern => pattern.test(text));
}

/**
 * Check if symbol is excessively long (likely spam)
 */
function hasExcessiveLength(symbol?: string): boolean {
  if (!symbol) return false;
  return symbol.length > 10;
}

/**
 * Check if name contains multiple symbols (unusual for legitimate tokens)
 */
function hasMultipleSymbols(name?: string): boolean {
  if (!name) return false;
  
  // Count pipes, asterisks, and other separators
  const separatorCount = (name.match(/[|*•·]/g) || []).length;
  return separatorCount > 1;
}

/**
 * Main spam detection function
 */
export function isSpamToken(token: TokenData): boolean {
  const symbol = token.symbol || '';
  const name = token.name || '';
  
  // Check all spam indicators
  const checks = [
    hasSuspiciousPatterns(symbol),
    hasSuspiciousPatterns(name),
    hasLookalikeCharacters(symbol),
    hasLookalikeCharacters(name),
    hasExcessiveLength(symbol),
    hasMultipleSymbols(name),
  ];

  // If any check returns true, it's likely spam
  return checks.some(check => check === true);
}

/**
 * Get spam detection details for debugging
 */
export function getSpamDetails(token: TokenData): {
  isSpam: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const symbol = token.symbol || '';
  const name = token.name || '';

  if (hasSuspiciousPatterns(symbol)) {
    reasons.push('Suspicious patterns in symbol');
  }
  if (hasSuspiciousPatterns(name)) {
    reasons.push('Suspicious patterns in name');
  }
  if (hasLookalikeCharacters(symbol)) {
    reasons.push('Unicode lookalike characters in symbol');
  }
  if (hasLookalikeCharacters(name)) {
    reasons.push('Unicode lookalike characters in name');
  }
  if (hasExcessiveLength(symbol)) {
    reasons.push('Symbol too long');
  }
  if (hasMultipleSymbols(name)) {
    reasons.push('Multiple separators in name');
  }

  return {
    isSpam: reasons.length > 0,
    reasons,
  };
}
