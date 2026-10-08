import { OpenPanelAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new OpenPanelAnalyticsAdapter({
    apiUrl: process.env.OPENPANEL_API_URL,
    clientId: 'shop-client',
    clientSecret: 'shop-secret',
});

await analytics.increment('logins', { profileId: 'user-1' });
await analytics.decrement('credits', { profileId: 'user-1', value: 2 });
await analytics.identify({
    avatar: 'https://shop.example/avatars/jean.png',
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
    email: 'jean@shop.example',
    firstName: 'Jean',
    lastName: 'Terrazzoni',
    name: 'Jean T.',
    phone: '+33600000000',
    plan: 'pro',
    profileId: 'user-1',
    properties: { plan: 'free', referral: 'friend' },
    username: 'jean',
    website: 'https://jean.example',
});
await analytics.identify({
    profileId: 'user-2',
    properties: { plan: 'free' },
});
await analytics.track('article_read');
