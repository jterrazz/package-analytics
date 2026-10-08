import { OpenPanel } from '@openpanel/sdk';

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

const DEFAULT_CURRENCY = 'EUR';

function withoutUndefined<TValue>(
    values: Record<string, TValue>,
): Record<string, Exclude<TValue, undefined>> {
    return Object.fromEntries(
        Object.entries(values).filter(
            (entry): entry is [string, Exclude<TValue, undefined>] => entry[1] !== undefined,
        ),
    );
}

function isStated(value: string | undefined): value is string {
    return value !== undefined && value !== '';
}

export type OpenPanelAnalyticsConfig = {
    /** Event ingest endpoint of a self-hosted instance; omit for OpenPanel cloud */
    apiUrl?: string;
    clientId: string;
    /** Required for server-side tracking and revenue events */
    clientSecret?: string;
    globalProperties?: Record<string, unknown>;
};

/** OpenPanel analytics adapter backed by @openpanel/sdk; `child(context)` forwards the end user's IP and user-agent so the backend derives geolocation and device. */
export class OpenPanelAnalyticsAdapter<
    TEvents extends AnalyticsEvents = AnalyticsEvents,
> implements AnalyticsPort<TEvents> {
    private readonly client: OpenPanel;
    private readonly config: OpenPanelAnalyticsConfig;

    constructor(config: OpenPanelAnalyticsConfig) {
        const { apiUrl, clientId, clientSecret, globalProperties } = config;
        this.config = config;
        this.client = new OpenPanel({ clientId, ...withoutUndefined({ apiUrl, clientSecret }) });
        this.client.setGlobalProperties({ ...globalProperties });
    }

    child(context: AnalyticsContext): AnalyticsPort<TEvents> {
        const { deviceId, ip, locale, profileId, userAgent } = context;
        const child = new OpenPanelAnalyticsAdapter<TEvents>(this.config);

        child.client.setGlobalProperties({
            ...this.client.global,
            ...(isStated(deviceId) && { __deviceId: deviceId }),
            ...(isStated(locale) && { locale }),
        });

        if (isStated(ip)) {
            child.client.api.addHeader('openpanel-client-ip', ip);
        }

        if (isStated(userAgent)) {
            child.client.api.addHeader('user-agent', userAgent);
        }

        if (isStated(profileId)) {
            child.client.profileId = profileId;
        }

        return child;
    }

    async decrement(property: string, options: AnalyticsCounterOptions): Promise<void> {
        await this.client.decrement({ ...options, property });
    }

    async identify(profile: AnalyticsProfile): Promise<void> {
        const { avatar, createdAt, email, firstName, lastName, profileId, properties, ...traits } =
            profile;

        await this.client.identify({
            ...withoutUndefined({ avatar, email, firstName, lastName }),
            profileId,
            properties: {
                ...properties,
                ...withoutUndefined({ ...traits, createdAt: createdAt?.toISOString() }),
            },
        });
    }

    async increment(property: string, options: AnalyticsCounterOptions): Promise<void> {
        await this.client.increment({ ...options, property });
    }

    async page(page: AnalyticsPage, options?: AnalyticsPageOptions): Promise<void> {
        await this.client.track('screen_view', {
            __path: page.url,
            __referrer: page.referrer,
            __title: page.title,
            ...options,
        });
    }

    async revenue(amount: number, options: AnalyticsRevenueOptions = {}): Promise<void> {
        const { currency = DEFAULT_CURRENCY, properties, ...scope } = options;

        await this.client.track('revenue', {
            currency,
            ...properties,
            ...scope,
            __revenue: amount,
        });
    }

    setGlobalProperties(properties: Record<string, unknown>): void {
        this.client.setGlobalProperties(properties);
    }

    async track<TEvent extends keyof TEvents & string>(
        event: TEvent,
        options: AnalyticsTrackOptions<TEvents[TEvent]> = {},
    ): Promise<void> {
        const { properties, ...scope } = options;

        await this.client.track(event, { ...properties, ...scope });
    }
}
