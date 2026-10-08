import { NoopAnalyticsAdapter, OpenPanelAnalyticsAdapter } from '@jterrazz/analytics';
import type { AnalyticsPort } from '@jterrazz/analytics';

type ShopEvents = {
    app_link_opened: { platform: 'android' | 'desktop' | 'ios'; slug: string };
    user_signed_up: { plan: string };
};

const analytics: AnalyticsPort<ShopEvents> = new OpenPanelAnalyticsAdapter<ShopEvents>({
    clientId: 'shop-client',
});
const inert: AnalyticsPort<ShopEvents> = new NoopAnalyticsAdapter<ShopEvents>();
const request: AnalyticsPort<ShopEvents> = analytics.child({ ip: '203.0.113.7' });

const opened: Promise<void> = request.track('app_link_opened', {
    properties: { platform: 'ios', slug: 'my-app' },
});
// @ts-expect-error an event the tracking plan does not declare is refused
const unknown: Promise<void> = analytics.track('user_deleted');
// @ts-expect-error a property value the tracking plan does not allow is refused
const wrong: Promise<void> = inert.track('app_link_opened', { properties: { platform: 'tv', slug: 'my-app' } });

export { opened, unknown, wrong };
