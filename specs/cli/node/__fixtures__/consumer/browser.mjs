const [host, development] = process.argv.slice(2);

globalThis.location = new URL(`https://${host}/articles/hello?utm_source=news#comments`);
const listened = [];
globalThis.document = {
    addEventListener: (type) => listened.push(type),
    referrer: '',
    title: 'Hello',
};
globalThis.window = globalThis;

const { installBrowserAnalytics } = await import('@jterrazz/analytics/browser');

const config = {
    apiUrl: process.env.OPENPANEL_API_URL,
    app: 'shop-web',
    clientId: 'browser-client',
    development: development === 'dev',
    siteUrl: 'https://shop.example',
};
const analytics = installBrowserAnalytics(config);

if (analytics === undefined) {
    console.log('not installed');
} else {
    analytics.track('cart_opened', { items: 3 });
    analytics.track('menu_opened');
    console.log(`listening: ${listened.join(',')}`);
    console.log(`installed; again: ${installBrowserAnalytics(config) === undefined ? 'refused' : 'installed'}`);
}

await new Promise((resolve) => setTimeout(resolve, 500));
