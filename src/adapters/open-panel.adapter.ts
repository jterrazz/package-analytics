import { OpenPanel } from '@openpanel/sdk';

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

const DEFAULT_CURRENCY = 'EUR';

function withoutUndefined(values: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

export interface OpenPanelAnalyticsConfig {
    /** Event ingest endpoint of a self-hosted instance; omit for OpenPanel cloud */
    apiUrl?: string;
    clientId: string;
    /** Required for server-side tracking and revenue events */
    clientSecret?: string;
    globalProperties?: Record<string, unknown>;
}

/**
 * OpenPanel analytics adapter backed by @openpanel/sdk.
 *
 * `child(context)` forwards the end user's IP and user-agent as request
 * headers, so the OpenPanel backend derives geolocation, device, browser
 * and OS exactly as it does for browser events.
 */
export class OpenPanelAnalyticsAdapter<
    TEvents extends AnalyticsEvents = AnalyticsEvents,
> implements AnalyticsPort<TEvents> {
    private readonly client: OpenPanel;
    private readonly config: OpenPanelAnalyticsConfig;

    constructor(config: OpenPanelAnalyticsConfig) {
        this.config = config;
        this.client = new OpenPanel({
            apiUrl: config.apiUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
        });

        if (config.globalProperties) {
            this.client.setGlobalProperties(config.globalProperties);
        }
    }

    child(context: AnalyticsContext): AnalyticsPort<TEvents> {
        const child = new OpenPanelAnalyticsAdapter<TEvents>(this.config);

        if (this.client.global) {
            child.client.setGlobalProperties(this.client.global);
        }

        if (context.ip) {
            child.client.api.addHeader('openpanel-client-ip', context.ip);
        }

        if (context.userAgent) {
            child.client.api.addHeader('user-agent', context.userAgent);
        }

        if (context.profileId) {
            child.client.profileId = context.profileId;
        }

        const contextProperties: Record<string, unknown> = {
            ...(context.deviceId && { __deviceId: context.deviceId }),
            ...(context.locale && { locale: context.locale }),
        };

        if (Object.keys(contextProperties).length > 0) {
            child.client.setGlobalProperties(contextProperties);
        }

        return child;
    }

    async decrement(property: string, options: AnalyticsCounterOptions): Promise<void> {
        await this.client.decrement({
            profileId: options.profileId,
            property,
            value: options.value,
        });
    }

    async identify(profile: AnalyticsProfile): Promise<void> {
        const { avatar, email, firstName, lastName, profileId, properties, ...traits } = profile;

        await this.client.identify({
            avatar,
            email,
            firstName,
            lastName,
            profileId,
            properties: {
                ...properties,
                ...withoutUndefined({
                    ...traits,
                    createdAt: traits.createdAt?.toISOString(),
                }),
            },
        });
    }

    async increment(property: string, options: AnalyticsCounterOptions): Promise<void> {
        await this.client.increment({
            profileId: options.profileId,
            property,
            value: options.value,
        });
    }

    async page(page: AnalyticsPage, options?: AnalyticsPageOptions): Promise<void> {
        await this.client.track('screen_view', {
            ...withoutUndefined({
                __path: page.url,
                __referrer: page.referrer,
                __title: page.title,
            }),
            profileId: options?.profileId,
        });
    }

    async revenue(amount: number, options?: AnalyticsRevenueOptions): Promise<void> {
        await this.client.track('revenue', {
            currency: options?.currency ?? DEFAULT_CURRENCY,
            ...options?.properties,
            __revenue: amount,
            profileId: options?.profileId,
        });
    }

    setGlobalProperties(properties: Record<string, unknown>): void {
        this.client.setGlobalProperties(properties);
    }

    async track<TEvent extends keyof TEvents & string>(
        event: TEvent,
        options?: AnalyticsTrackOptions<TEvents[TEvent]>,
    ): Promise<void> {
        await this.client.track(event, {
            ...options?.properties,
            profileId: options?.profileId,
        });
    }
}
