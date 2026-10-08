import { OpenPanelAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new OpenPanelAnalyticsAdapter({
    apiUrl: process.env.OPENPANEL_API_URL,
    clientId: 'shop-client',
    clientSecret: 'shop-secret',
    globalProperties: { app: 'shop' },
});

await analytics.track('article_read', {
    profileId: 'user-1',
    properties: { slug: 'hello-world' },
});
await analytics.track('cart_opened');
await analytics.page(
    {
        referrer: 'https://news.example/',
        title: 'Hello World',
        url: 'https://shop.example/articles/hello?utm_source=news',
    },
    { profileId: 'user-1' },
);
await analytics.page({ url: 'https://shop.example/' });
await analytics.revenue(29.99, { profileId: 'user-1' });
await analytics.revenue(100, { currency: 'USD', properties: { product: 'pro-plan' } });
analytics.setGlobalProperties({ release: '2.4.0' });
await analytics.track('checkout_started', { properties: { items: 3 } });

const browser = new OpenPanelAnalyticsAdapter({
    apiUrl: process.env.OPENPANEL_API_URL,
    clientId: 'browser-client',
});
await browser.track('cart_opened');
