/**
 * Starter Protocols Endpoint
 *
 * Returns protocols marked as "starter" for a given module.
 * Used during onboarding to show users which protocols they can add.
 *
 * GET /api/modules/:moduleId/starter-protocols
 *
 * Response: StarterProtocol[]
 */
import { Request, Response } from 'express';
/**
 * GET /api/modules/:moduleId/starter-protocols
 *
 * Returns starter protocols for a given module.
 * No authentication required - public endpoint.
 */
export declare function getStarterProtocols(req: Request, res: Response): Promise<void>;
/**
 * GET /api/modules/:moduleId/protocols
 *
 * Returns ALL protocols for a given module (not just starters).
 * Used in ModuleProtocolsScreen to show all available protocols.
 * Includes user enrollment status if authenticated.
 */
export declare function getModuleProtocols(req: Request, res: Response): Promise<void>;
