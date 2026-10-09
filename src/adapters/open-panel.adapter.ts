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

/** Which OpenPanel project the adapter sends to, and what every event carries; nothing else reaches the SDK. */
export type OpenPanelAnalyticsConfig = {
    /** Event ingest endpoint of a self-hosted instance; omit for OpenPanel cloud */
    apiUrl?: string | undefined;
    /** Client id of the OpenPanel project */
    clientId: string;
    /** Required for server-side tracking and revenue events */
    clientSecret?: string | undefined;
    /** Sent with every event, as setGlobalProperties would */
    globalProperties?: Record<string, unknown> | undefined;
};

/** OpenPanel analytics adapter backed by @openpanel/sdk; `child(context)` forwards the end user's IP and user-agent so the backend derives geolocation and device. */
export class OpenPanelAnalyticsAdapter<
    TEvents extends AnalyticsEvents = AnalyticsEvents,
> implements AnalyticsPort<TEvents> {
    private readonly client: OpenPanel;
    private readonly config: OpenPanelAnalyticsConfig;
    private context: AnalyticsContext = {};
    private parent: OpenPanelAnalyticsAdapter<TEvents> | undefined;

    constructor(config: OpenPanelAnalyticsConfig) {
        const { apiUrl, clientId, clientSecret, globalProperties } = config;
        this.config = config;
        this.client = new OpenPanel({ clientId, ...withoutUndefined({ apiUrl, clientSecret }) });
        this.client.setGlobalProperties({ ...globalProperties });
    }

    child(context: AnalyticsContext): AnalyticsPort<TEvents> {
        const { deviceId, locale } = context;
        const child = new OpenPanelAnalyticsAdapter<TEvents>(this.config);
        child.context = context;
        child.parent = this;

        child.client.setGlobalProperties({
            ...this.client.global,
            ...(isStated(deviceId) && { __deviceId: deviceId }),
            ...(isStated(locale) && { locale }),
        });

        child.bindRequest(child.client);

        return child;
    }

    private bindRequest(client: OpenPanel): void {
        const { ip, profileId, userAgent } = this.context;
        this.parent?.bindRequest(client);

        if (isStated(ip)) {
            client.api.addHeader('openpanel-client-ip', ip);
        }

        if (isStated(userAgent)) {
            client.api.addHeader('user-agent', userAgent);
        }

        if (isStated(profileId)) {
            client.profileId = profileId;
        }
    }

    async decrement(property: string, options: AnalyticsCounterOptions): Promise<void> {
        const { profileId, ...counter } = options;

        await this.client.decrement({ profileId, ...withoutUndefined(counter), property });
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
        const { profileId, ...counter } = options;

        await this.client.increment({ profileId, ...withoutUndefined(counter), property });
    }

    async page(page: AnalyticsPage, options?: AnalyticsPageOptions): Promise<void> {
        await this.client.track('screen_view', {
            __path: page.url,
            __referrer: page.referrer,
            __title: page.title,
            ...withoutUndefined({ ...options }),
        });
    }

    async revenue(amount: number, options: AnalyticsRevenueOptions = {}): Promise<void> {
        const { currency = DEFAULT_CURRENCY, properties, ...scope } = options;

        await this.client.track('revenue', {
            currency,
            ...properties,
            ...withoutUndefined(scope),
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

        await this.client.track(event, { ...properties, ...withoutUndefined(scope) });
    }
}
