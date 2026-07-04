/**
 * Analytics port - defines how to track product events, identify users and
 * maintain profile counters, independently of any analytics vendor.
 */
export interface AnalyticsCounterOptions {
    profileId: string;
    value?: number;
}

export interface AnalyticsPort {
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
     * Set properties sent with every subsequent event
     */
    setGlobalProperties: (properties: Record<string, unknown>) => void;

    /**
     * Track a named event, optionally scoped to a user profile
     */
    track: (event: string, options?: AnalyticsTrackOptions) => Promise<void>;
}

export interface AnalyticsProfile {
    avatar?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileId: string;
    properties?: Record<string, unknown>;
}

export interface AnalyticsTrackOptions {
    profileId?: string;
    properties?: Record<string, unknown>;
}
