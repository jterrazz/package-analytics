import { OpenPanel } from '@openpanel/sdk';

// Ports
import type {
    AnalyticsCounterOptions,
    AnalyticsPort,
    AnalyticsProfile,
    AnalyticsTrackOptions,
} from '../ports/analytics.js';

/**
 * OpenPanel analytics adapter backed by @openpanel/sdk.
 * Works with both OpenPanel cloud and self-hosted instances (set `apiUrl`
 * to your instance's event ingest endpoint).
 */
export class OpenPanelAnalyticsAdapter implements AnalyticsPort {
    private readonly client: OpenPanel;

    constructor(config: {
        apiUrl?: string;
        clientId: string;
        clientSecret?: string;
        globalProperties?: Record<string, unknown>;
    }) {
        this.client = new OpenPanel({
            apiUrl: config.apiUrl,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
        });

        if (config.globalProperties) {
            this.client.setGlobalProperties(config.globalProperties);
        }
    }

    async decrement(property: string, options: AnalyticsCounterOptions): Promise<void> {
        await this.client.decrement({
            profileId: options.profileId,
            property,
            value: options.value,
        });
    }

    async identify(profile: AnalyticsProfile): Promise<void> {
        await this.client.identify(profile);
    }

    async increment(property: string, options: AnalyticsCounterOptions): Promise<void> {
        await this.client.increment({
            profileId: options.profileId,
            property,
            value: options.value,
        });
    }

    setGlobalProperties(properties: Record<string, unknown>): void {
        this.client.setGlobalProperties(properties);
    }

    async track(event: string, options?: AnalyticsTrackOptions): Promise<void> {
        await this.client.track(event, {
            ...options?.properties,
            profileId: options?.profileId,
        });
    }
}
