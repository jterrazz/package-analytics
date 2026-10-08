import { NoopAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new NoopAnalyticsAdapter();
analytics.setGlobalProperties({ app: 'shop' });
const request = analytics.child({ ip: '203.0.113.7' });

const answers = await Promise.all([
    request.track('article_read', { properties: { slug: 'hello-world' } }),
    analytics.page({ url: 'https://shop.example/' }),
    analytics.revenue(10),
    analytics.identify({ profileId: 'user-1' }),
    analytics.increment('logins', { profileId: 'user-1' }),
    analytics.decrement('credits', { profileId: 'user-1' }),
]);

console.log(`the child scope is the adapter itself: ${String(request === analytics)}`);
console.log(`every call answered: ${answers.map(String).join(', ')}`);
