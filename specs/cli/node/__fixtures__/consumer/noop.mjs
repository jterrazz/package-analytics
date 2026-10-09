import './offline.mjs';
import { NoopAnalyticsAdapter } from '@jterrazz/analytics';

const analytics = new NoopAnalyticsAdapter();
analytics.setGlobalProperties({ app: 'shop' });
const request = analytics.child({ ip: '203.0.113.7', profileId: 'user-1' });

await request.track('article_read', { properties: { slug: 'hello-world' } });
await request.page({ url: 'https://shop.example/' });
await request.revenue(10);
await request.identify({ profileId: 'user-1' });
await request.increment('logins', { profileId: 'user-1' });
await request.decrement('credits', { profileId: 'user-1' });
