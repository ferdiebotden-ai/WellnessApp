/**
 * AI Output Safety Scanner
 *
 * Scans AI-generated content (chat responses, nudges) before delivery
 * to ensure no harmful content reaches users.
 */

import type { AIOutputScanResult, CrisisSeverity } from './types';
import { SAFETY_CONFIG } from './types';
import {
  normalizeText,
  findMatchingKeywords,
} from './crisisDetection';
import { getHighestSeverity } from './crisisRules';

/**
 * Keywords that should never appear in AI output.
 * These are more strict than user input detection since AI should
 * never generate content that could be harmful.
 */
const AI_OUTPUT_BLOCKED_PHRASES = [
  // Suicide-related
  'kill yourself',
  'end your life',
  'commit suicide',
  "you should die",
  'better off dead',

  // Self-harm
  'cut yourself',
  'hurt yourself',
  'harm yourself',

  // Dangerous advice
  'take all the pills',
  'overdose on',
  'starve yourself',

  // Eating disorder triggers
  'skip meals',
  'stop eating',
  'purge after',
];

/**
 * Scan AI-generated output for harmful content.
 *
 * This function applies stricter checks than user input detection
 * because AI-generated content should never contain harmful material.
 *
 * @param text - AI-generated text to scan
 * @param source - Source identifier for logging ('ai_response' | 'nudge')
 * @returns AIOutputScanResult indicating if content is safe
 */
export function scanAIOutput(
  text: string,
  source: 'ai_response' | 'nudge' = 'ai_response'
): AIOutputScanResult {
  // Handle empty or invalid input
  if (!text || typeof text !== 'string') {
    return {
      safe: true,
      flaggedKeywords: [],
      severity: null,
    };
  }

  // Truncate long outputs for performance
  const truncatedText = text.slice(0, SAFETY_CONFIG.MAX_SCAN_LENGTH);
  const normalizedText = normalizeText(truncatedText);

  const flaggedKeywords: string[] = [];
  let highestSeverity: CrisisSeverity | null = null;

  // Check for blocked phrases (strict list for AI output)
  for (const phrase of AI_OUTPUT_BLOCKED_PHRASES) {
    if (normalizedText.includes(phrase.toLowerCase())) {
      flaggedKeywords.push(phrase);
      // All blocked phrases are treated as high severity for AI output
      highestSeverity = 'high';
    }
  }

  // Also check crisis keywords (same as user input)
  // but without exclusions since AI shouldn't use these phrases
  const crisisMatches = findMatchingKeywords(normalizedText);
  if (crisisMatches.length > 0) {
    for (const match of crisisMatches) {
      if (!flaggedKeywords.includes(match.phrase)) {
        flaggedKeywords.push(match.phrase);
      }
    }

    // Update severity based on matched keywords
    const matchedSeverity = getHighestSeverity(crisisMatches.map((m) => m.severity));
    if (matchedSeverity && (!highestSeverity || matchedSeverity === 'high')) {
      highestSeverity = matchedSeverity;
    }
  }

  if (flaggedKeywords.length > 0) {
    return {
      safe: false,
      flaggedKeywords,
      severity: highestSeverity,
      reason: `AI output contained flagged content: ${flaggedKeywords.join(', ')}`,
    };
  }

  return {
    safe: true,
    flaggedKeywords: [],
    severity: null,
  };
}

/**
 * Get a safe fallback response when AI output is flagged.
 *
 * @param source - What type of content was flagged
 * @returns Safe generic response to use instead
 */
export function getSafeFallbackResponse(source: 'ai_response' | 'nudge'): string {
  if (source === 'nudge') {
    return "Take a moment to check in with yourself today. How are you feeling?";
  }

  return "I'd like to help you with your wellness journey. Could you tell me more about what you're working on?";
}

/**
 * Check if AI output should be completely suppressed.
 * Some content is too harmful to even partially deliver.
 *
 * @param result - AIOutputScanResult from scanAIOutput
 * @returns True if content should be completely suppressed
 */
export function shouldSuppressOutput(result: AIOutputScanResult): boolean {
  if (result.safe) {
    return false;
  }

  // Suppress high severity issues completely
  return result.severity === 'high';
}
