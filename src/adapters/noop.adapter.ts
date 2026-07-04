// Ports
import type {
    AnalyticsCounterOptions,
    AnalyticsPort,
    AnalyticsProfile,
    AnalyticsTrackOptions,
} from '../ports/analytics.js';

/**
 * No-op analytics adapter that implements AnalyticsPort but performs no operations.
 * This is useful for local development and tests where events should not be sent.
 */
export class NoopAnalyticsAdapter implements AnalyticsPort {
    decrement(_property: string, _options: AnalyticsCounterOptions): Promise<void> {
        return Promise.resolve();
    }

    identify(_profile: AnalyticsProfile): Promise<void> {
        return Promise.resolve();
    }

    increment(_property: string, _options: AnalyticsCounterOptions): Promise<void> {
        return Promise.resolve();
    }

    setGlobalProperties(_properties: Record<string, unknown>): void {
        // No operation
    }

    track(_event: string, _options?: AnalyticsTrackOptions): Promise<void> {
        return Promise.resolve();
    }
}
