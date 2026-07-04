// Ports
import type {
    AnalyticsContext,
    AnalyticsCounterOptions,
    AnalyticsEvents,
    AnalyticsPage,
    AnalyticsPageOptions,
    AnalyticsPort,
    AnalyticsProfile,
    AnalyticsRevenueOptions,
    AnalyticsTrackOptions,
} from '../ports/analytics.js';

/**
 * No-op analytics adapter that implements AnalyticsPort but performs no operations.
 * This is useful for local development and tests where events should not be sent.
 */
export class NoopAnalyticsAdapter<
    TEvents extends AnalyticsEvents = AnalyticsEvents,
> implements AnalyticsPort<TEvents> {
    child(_context: AnalyticsContext): AnalyticsPort<TEvents> {
        return this;
    }

    decrement(_property: string, _options: AnalyticsCounterOptions): Promise<void> {
        return Promise.resolve();
    }

    identify(_profile: AnalyticsProfile): Promise<void> {
        return Promise.resolve();
    }

    increment(_property: string, _options: AnalyticsCounterOptions): Promise<void> {
        return Promise.resolve();
    }

    page(_page: AnalyticsPage, _options?: AnalyticsPageOptions): Promise<void> {
        return Promise.resolve();
    }

    revenue(_amount: number, _options?: AnalyticsRevenueOptions): Promise<void> {
        return Promise.resolve();
    }

    setGlobalProperties(_properties: Record<string, unknown>): void {
        // No operation
    }

    track<TEvent extends keyof TEvents & string>(
        _event: TEvent,
        _options?: AnalyticsTrackOptions<TEvents[TEvent]>,
    ): Promise<void> {
        return Promise.resolve();
    }
}
