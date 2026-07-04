/**
 * Analytics port - defines how to track product events, page views, revenue
 * and user profiles, independently of any analytics vendor.
 *
 * Deliberately NOT part of this port: sessions, bounce rate, geolocation,
 * device detection and UTM attribution — analytics backends derive all of
 * these server-side from the request context (`ip`, `userAgent`) and the
 * page URL. The port exposes the inputs, never the derived outputs.
 */

/**
 * Request-scoped context. Backends derive geolocation from `ip` and
 * device/browser/OS from `userAgent`.
 */
export interface AnalyticsContext {
    /** Anonymous device identity shared with the web client */
    deviceId?: string;
    /** IP address of the end user */
    ip?: string;
    /** Locale of the end user, e.g. 'fr-FR' */
    locale?: string;
    /** Profile attached to every event of this scope */
    profileId?: string;
    /** User-agent of the end user */
    userAgent?: string;
}

export interface AnalyticsCounterOptions {
    profileId: string;
    value?: number;
}

/**
 * Event catalogue: event name → typed properties. Apps extend this to get
 * a compile-time tracking plan.
 */
export type AnalyticsEvents = Record<string, Record<string, unknown>>;

/**
 * A viewed page. Backends extract path, origin, query and UTM attribution
 * from the full `url`.
 */
export interface AnalyticsPage {
    referrer?: string;
    title?: string;
    /** Full URL, including query string */
    url: string;
}

export interface AnalyticsPort<TEvents extends AnalyticsEvents = AnalyticsEvents> {
    /**
     * Create an analytics scope bound to a request context — events sent
     * through the child inherit the context
     */
    child: (context: AnalyticsContext) => AnalyticsPort<TEvents>;

    /**
     * Decrement a numeric property on a user profile
     */
    decrement: (property: string, options: AnalyticsCounterOptions) => Promise<void>;

    /**
     * Attach identity and traits to a user profile
     */
    identify: (profile: AnalyticsProfile) => Promise<void>;

    /**
     * Increment a numeric property on a user profile
     */
    increment: (property: string, options: AnalyticsCounterOptions) => Promise<void>;

    /**
     * Track a page view
     */
    page: (page: AnalyticsPage, options?: AnalyticsPageOptions) => Promise<void>;

    /**
     * Track revenue, in the given currency (defaults to EUR)
     */
    revenue: (amount: number, options?: AnalyticsRevenueOptions) => Promise<void>;

    /**
     * Set properties sent with every subsequent event
     */
    setGlobalProperties: (properties: Record<string, unknown>) => void;

    /**
     * Track a named event, optionally scoped to a user profile
     */
    track: <TEvent extends keyof TEvents & string>(
        event: TEvent,
        options?: AnalyticsTrackOptions<TEvents[TEvent]>,
    ) => Promise<void>;
}

export interface AnalyticsPageOptions {
    profileId?: string;
}

/**
 * User profile. The codified traits follow the Segment identify spec;
 * anything else goes into `properties`.
 */
export interface AnalyticsProfile {
    avatar?: string;
    /** Account creation date — enables cohort analysis */
    createdAt?: Date;
    email?: string;
    firstName?: string;
    lastName?: string;
    /** Full name, when firstName/lastName does not apply */
    name?: string;
    phone?: string;
    /** Subscription plan, e.g. 'free', 'pro' */
    plan?: string;
    profileId: string;
    properties?: Record<string, unknown>;
    username?: string;
    website?: string;
}

export interface AnalyticsRevenueOptions {
    /** ISO 4217 currency code */
    currency?: string;
    profileId?: string;
    properties?: Record<string, unknown>;
}

export interface AnalyticsTrackOptions<
    TProperties extends Record<string, unknown> = Record<string, unknown>,
> {
    profileId?: string;
    properties?: TProperties;
}
