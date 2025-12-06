/**
 * AI Output Safety Scanner
 *
 * Scans AI-generated content (chat responses, nudges) before delivery
 * to ensure no harmful content reaches users.
 */
import type { AIOutputScanResult } from './types';
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
export declare function scanAIOutput(text: string, source?: 'ai_response' | 'nudge'): AIOutputScanResult;
/**
 * Get a safe fallback response when AI output is flagged.
 *
 * @param source - What type of content was flagged
 * @returns Safe generic response to use instead
 */
export declare function getSafeFallbackResponse(source: 'ai_response' | 'nudge'): string;
/**
 * Check if AI output should be completely suppressed.
 * Some content is too harmful to even partially deliver.
 *
 * @param result - AIOutputScanResult from scanAIOutput
 * @returns True if content should be completely suppressed
 */
export declare function shouldSuppressOutput(result: AIOutputScanResult): boolean;
