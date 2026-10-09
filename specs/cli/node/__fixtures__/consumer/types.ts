import { NoopAnalyticsAdapter, OpenPanelAnalyticsAdapter } from '@jterrazz/analytics';
import type { AnalyticsPort } from '@jterrazz/analytics';

declare const process: { env: Record<string, string | undefined> };
declare const session: { userId: string } | undefined;

type ShopEvents = {
    app_link_opened: { platform: 'android' | 'desktop' | 'ios'; slug: string };
    user_signed_up: { plan: string };
};

const analytics: AnalyticsPort<ShopEvents> = new OpenPanelAnalyticsAdapter<ShopEvents>({
    apiUrl: process.env.OPENPANEL_API_URL,
    clientId: 'shop-client',
    clientSecret: process.env.OPENPANEL_CLIENT_SECRET,
});
const inert: AnalyticsPort<ShopEvents> = new NoopAnalyticsAdapter<ShopEvents>();
const request: AnalyticsPort<ShopEvents> = analytics.child({
    ip: process.env.CLIENT_IP,
    profileId: session?.userId,
    userAgent: process.env.USER_AGENT,
});

const opened: Promise<void> = request.track('app_link_opened', {
    profileId: session?.userId,
    properties: { platform: 'ios', slug: 'my-app' },
});
// @ts-expect-error an event the tracking plan does not declare is refused
const unknown: Promise<void> = analytics.track('user_deleted');
// @ts-expect-error a property value the tracking plan does not allow is refused
const wrong: Promise<void> = inert.track('app_link_opened', { properties: { platform: 'tv', slug: 'my-app' } });

export { opened, unknown, wrong };
