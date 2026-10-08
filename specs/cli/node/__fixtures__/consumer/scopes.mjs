import { OpenPanelAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new OpenPanelAnalyticsAdapter({
    apiUrl: process.env.OPENPANEL_API_URL,
    clientId: 'shop-client',
    clientSecret: 'shop-secret',
    globalProperties: { app: 'shop' },
});
analytics.setGlobalProperties({ release: '2.4.0' });

const request = analytics.child({
    deviceId: 'web-device',
    ip: '203.0.113.7',
    locale: 'fr-FR',
    profileId: 'user-42',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
});
await request.track('article_read', { properties: { slug: 'hello-world' } });
await request.track('article_shared', { profileId: 'user-7' });
await analytics.track('cart_opened');

const blank = analytics.child({ deviceId: '', ip: '', locale: '', profileId: '', userAgent: '' });
await blank.track('cart_opened');

const signedIn = analytics.child({ profileId: 'user-9' });
await signedIn.track('cart_opened');
