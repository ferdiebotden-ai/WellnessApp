import { Request, Response } from 'express';
export declare const postChat: (req: Request, res: Response) => Promise<void>;
/**
 * GET /api/chat/history
 *
 * Fetches the user's most recent conversation history.
 * Returns the most recent conversation with up to 20 messages.
 *
 * Query params:
 * - conversationId (optional): Specific conversation to fetch
 * - limit (optional): Max messages to return (default: 20, max: 50)
 *
 * @returns {
 *   conversationId: string | null,
 *   messages: Array<{role: 'user' | 'assistant', content: string}>
 * }
 */
export declare const getChatHistory: (req: Request, res: Response) => Promise<void>;
