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

/** Which profile's numeric property moves, and by how much. */
export type AnalyticsCounterOptions = {
    /** Profile whose property moves */
    profileId: string;
    /** Amount to move it by; the backend's own default (1 on OpenPanel) when omitted */
    value?: number | undefined;
};

/** The constraint on a tracking plan, event name to typed properties: write the plan as a plain object `type`, e.g. `{ user_signed_up: { plan: string } }`, never as an extension of this one, whose string index lets every name through; an `interface` has no index and fails the constraint (Adapters § The tracking plan). */
export type AnalyticsEvents = Record<string, Record<string, unknown>>;

/** A viewed page: backends extract path, origin, query and UTM attribution from the full `url`. */
export type AnalyticsPage = {
    /** URL the visitor came from */
    referrer?: string | undefined;
    /** Title of the page */
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

/** Who viewed the page. */
export type AnalyticsPageOptions = {
    /** Overrides the scope's profile for this page view */
    profileId?: string | undefined;
};

/** User profile: the codified traits follow the Segment identify spec, anything else goes into `properties`. */
export type AnalyticsProfile = {
    /** URL of the profile picture */
    avatar?: string | undefined;
    /** Account creation date, which enables cohort analysis */
    createdAt?: Date | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    /** Full name, when firstName/lastName does not apply */
    name?: string | undefined;
    phone?: string | undefined;
    /** Subscription plan, e.g. 'free', 'pro' */
    plan?: string | undefined;
    /** The app's own user id, never the email */
    profileId: string;
    /** Any other trait; a codified trait of the same name wins */
    properties?: Record<string, unknown> | undefined;
    username?: string | undefined;
    website?: string | undefined;
};

/** Who paid, in which currency, and what else the revenue event carries. */
export type AnalyticsRevenueOptions = {
    /** ISO 4217 currency code */
    currency?: string | undefined;
    /** Overrides the scope's profile for this event */
    profileId?: string | undefined;
    /** Sent with the event, beside the currency and amount */
    properties?: Record<string, unknown> | undefined;
};

/** Who triggered the event, and the properties its tracking plan declares. */
export type AnalyticsTrackOptions<
    TProperties extends Record<string, unknown> = Record<string, unknown>,
> = {
    /** Overrides the scope's profile for this event */
    profileId?: string | undefined;
    /** The event's properties, as the tracking plan types them */
    properties?: TProperties | undefined;
};
