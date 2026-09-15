import { OpenPanel } from '@openpanel/sdk';

// Ports
import {
    type AnalyticsContext,
    type AnalyticsCounterOptions,
    type AnalyticsEvents,
    type AnalyticsPage,
    type AnalyticsPageOptions,
    type AnalyticsPort,
    type AnalyticsProfile,
    type AnalyticsRevenueOptions,
    type AnalyticsTrackOptions,
} from '../ports/analytics.js';

const DEFAULT_CURRENCY = 'EUR';

function withoutUndefined(values: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

/** An absent context field and an empty one are the same thing: nothing to forward. */
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
            ...(config.apiUrl !== undefined && { apiUrl: config.apiUrl }),
            ...(config.clientSecret !== undefined && { clientSecret: config.clientSecret }),
            clientId: config.clientId,
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

        if (isStated(context.ip)) {
            child.client.api.addHeader('openpanel-client-ip', context.ip);
        }

        if (isStated(context.userAgent)) {
            child.client.api.addHeader('user-agent', context.userAgent);
        }

        if (isStated(context.profileId)) {
            child.client.profileId = context.profileId;
        }

        const contextProperties: Record<string, unknown> = {
            ...(isStated(context.deviceId) && { __deviceId: context.deviceId }),
            ...(isStated(context.locale) && { locale: context.locale }),
        };

        if (Object.keys(contextProperties).length > 0) {
            child.client.setGlobalProperties(contextProperties);
        }

        return child;
    }

    async decrement(property: string, options: AnalyticsCounterOptions): Promise<void> {
        await this.client.decrement({
            ...(options.value !== undefined && { value: options.value }),
            profileId: options.profileId,
            property,
        });
    }

    async identify(profile: AnalyticsProfile): Promise<void> {
        const { avatar, email, firstName, lastName, profileId, properties, ...traits } = profile;

        await this.client.identify({
            ...(avatar !== undefined && { avatar }),
            ...(email !== undefined && { email }),
            ...(firstName !== undefined && { firstName }),
            ...(lastName !== undefined && { lastName }),
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
            ...(options.value !== undefined && { value: options.value }),
            profileId: options.profileId,
            property,
        });
    }

    async page(page: AnalyticsPage, options?: AnalyticsPageOptions): Promise<void> {
        await this.client.track('screen_view', {
            ...withoutUndefined({
                __path: page.url,
                __referrer: page.referrer,
                __title: page.title,
            }),
            ...(options?.profileId !== undefined && { profileId: options.profileId }),
        });
    }

    async revenue(amount: number, options?: AnalyticsRevenueOptions): Promise<void> {
        await this.client.track('revenue', {
            currency: options?.currency ?? DEFAULT_CURRENCY,
            ...options?.properties,
            ...(options?.profileId !== undefined && { profileId: options.profileId }),
            __revenue: amount,
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
            ...(options?.profileId !== undefined && { profileId: options.profileId }),
        });
    }
}
