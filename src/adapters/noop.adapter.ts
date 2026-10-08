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

/** Analytics adapter that sends nothing, for local development and a consumer's tests. */
export class NoopAnalyticsAdapter<
    TEvents extends AnalyticsEvents = AnalyticsEvents,
> implements AnalyticsPort<TEvents> {
    child(_context: AnalyticsContext): AnalyticsPort<TEvents> {
        return this;
    }

    async decrement(_property: string, _options: AnalyticsCounterOptions): Promise<void> {}

    async identify(_profile: AnalyticsProfile): Promise<void> {}

    async increment(_property: string, _options: AnalyticsCounterOptions): Promise<void> {}

    async page(_page: AnalyticsPage, _options?: AnalyticsPageOptions): Promise<void> {}

    async revenue(_amount: number, _options?: AnalyticsRevenueOptions): Promise<void> {}

    setGlobalProperties(_properties: Record<string, unknown>): void {}

    async track<TEvent extends keyof TEvents & string>(
        _event: TEvent,
        _options?: AnalyticsTrackOptions<TEvents[TEvent]>,
    ): Promise<void> {}
}
