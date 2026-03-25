import { env } from '../../config/env';
import type { IMatchingService } from './MatchingService.interface';
import { GeoMatchingService } from './MatchingService.geo';

let instance: IMatchingService | null = null;

export function getMatchingService(): IMatchingService {
  if (instance) return instance;

  if (env.MATCHING_PROVIDER === 'ai') {
    // Future: dynamically import AIMatchingService
    // const { AIMatchingService } = await import('./MatchingService.ai');
    // instance = new AIMatchingService();
    throw new Error('AI matching provider not yet implemented. Set MATCHING_PROVIDER=geo');
  }

  instance = new GeoMatchingService();
  return instance;
}
