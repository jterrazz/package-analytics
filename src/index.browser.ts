import { OpenPanel } from '@openpanel/web';

import type { AnalyticsEvents } from './ports/analytics.js';

/** Which OpenPanel project a document reports to, and the one address allowed to report. */
export type BrowserAnalyticsConfig = {
    /** Event ingest endpoint of the OpenPanel instance */
    apiUrl: string;
    /** Name sent with every event as the `app` global property */
    app: string;
    /** Client id of the OpenPanel project */
    clientId: string;
    /** The bundler's development flag (`import.meta.env.DEV`): a development build reports nothing */
    development: boolean;
    /** Production address of the site: any other hostname (a preview, localhost) reports nothing */
    siteUrl: string;
};

/** Fire-and-forget tracking of a document's interactions, typed by its tracking plan. */
export type BrowserAnalytics<TEvents extends AnalyticsEvents = AnalyticsEvents> = {
    /** Send a named event; a collector that fails costs the reader nothing, so the call never throws nor rejects */
    track: <TEvent extends keyof TEvents & string>(
        event: TEvent,
        properties?: TEvents[TEvent],
    ) => void;
};

let installed = false;

/** One owner per document: starts the production page view (the URL without its hash) and returns the tracker, or `undefined` when the build is a development one, the host is not the site's, or the document is already owned. */
export function installBrowserAnalytics<TEvents extends AnalyticsEvents = AnalyticsEvents>(
    config: BrowserAnalyticsConfig,
): BrowserAnalytics<TEvents> | undefined {
    if (installed || config.development || location.hostname !== new URL(config.siteUrl).hostname) {
        return undefined;
    }
    installed = true;
    const client = new OpenPanel({
        apiUrl: config.apiUrl,
        clientId: config.clientId,
        // value: a document load is the page view; a client-side replaceState and a reading anchor are interactions
        trackScreenViews: false,
        trackOutgoingLinks: true,
    });
    client.setGlobalProperties({ app: config.app, environment: 'production' });
    const page = new URL(location.href);
    page.hash = '';
    client.screenView(page.href);

    return {
        track: (event, properties) => {
            void (async () => {
                try {
                    await client.track(event, properties);
                } catch {
                    // outside: a blocked or unreachable collector loses the event; the interaction itself succeeded
                }
            })();
        },
    };
}
