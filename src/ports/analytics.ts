/** Request-scoped context: backends derive geolocation from `ip` and device, browser and OS from `userAgent`. */
export type AnalyticsContext = {
    /** Anonymous device identity shared with the web client */
    deviceId?: string | undefined;
    /** IP address of the end user */
    ip?: string | undefined;
    /** Locale of the end user, e.g. 'fr-FR' */
    locale?: string | undefined;
    /** Profile attached to every event of this scope */
    profileId?: string | undefined;
    /** User-agent of the end user */
    userAgent?: string | undefined;
};

export type AnalyticsCounterOptions = {
    profileId: string;
    value?: number | undefined;
};

/** Event catalogue, event name to typed properties: an app extends it to get a compile-time tracking plan. */
export type AnalyticsEvents = Record<string, Record<string, unknown>>;

/** A viewed page: backends extract path, origin, query and UTM attribution from the full `url`. */
export type AnalyticsPage = {
    referrer?: string | undefined;
    title?: string | undefined;
    /** Full URL, including query string */
    url: string;
};

/** How an app tracks product events, page views, revenue and user profiles, whatever the analytics vendor. */
export type AnalyticsPort<TEvents extends AnalyticsEvents = AnalyticsEvents> = {
    /** Create an analytics scope bound to a request context: events sent through the child inherit the context, layered over its parent scope's */
    child: (context: AnalyticsContext) => AnalyticsPort<TEvents>;

    /** Decrement a numeric property on a user profile */
    decrement: (property: string, options: AnalyticsCounterOptions) => Promise<void>;

    /** Attach identity and traits to a user profile */
    identify: (profile: AnalyticsProfile) => Promise<void>;

    /** Increment a numeric property on a user profile */
    increment: (property: string, options: AnalyticsCounterOptions) => Promise<void>;

    /** Track a page view */
    page: (page: AnalyticsPage, options?: AnalyticsPageOptions) => Promise<void>;

    /** Track revenue, in the given currency (defaults to EUR) */
    revenue: (amount: number, options?: AnalyticsRevenueOptions) => Promise<void>;

    /** Set properties sent with every subsequent event */
    setGlobalProperties: (properties: Record<string, unknown>) => void;

    /** Track a named event, optionally scoped to a user profile */
    track: <TEvent extends keyof TEvents & string>(
        event: TEvent,
        options?: AnalyticsTrackOptions<TEvents[TEvent]>,
    ) => Promise<void>;
};

export type AnalyticsPageOptions = {
    profileId?: string | undefined;
};

/** User profile: the codified traits follow the Segment identify spec, anything else goes into `properties`. */
export type AnalyticsProfile = {
    avatar?: string | undefined;
    /** Account creation date — enables cohort analysis */
    createdAt?: Date | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    /** Full name, when firstName/lastName does not apply */
    name?: string | undefined;
    phone?: string | undefined;
    /** Subscription plan, e.g. 'free', 'pro' */
    plan?: string | undefined;
    profileId: string;
    properties?: Record<string, unknown> | undefined;
    username?: string | undefined;
    website?: string | undefined;
};

export type AnalyticsRevenueOptions = {
    /** ISO 4217 currency code */
    currency?: string | undefined;
    profileId?: string | undefined;
    properties?: Record<string, unknown> | undefined;
};

export type AnalyticsTrackOptions<
    TProperties extends Record<string, unknown> = Record<string, unknown>,
> = {
    profileId?: string | undefined;
    properties?: TProperties | undefined;
};
