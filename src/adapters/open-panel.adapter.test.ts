import { OpenPanel } from '@openpanel/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OpenPanelAnalyticsAdapter } from './open-panel.adapter.js';

const trackSpy = vi.spyOn(OpenPanel.prototype, 'track').mockResolvedValue(undefined);
const identifySpy = vi.spyOn(OpenPanel.prototype, 'identify').mockReturnValue(undefined);
const incrementSpy = vi.spyOn(OpenPanel.prototype, 'increment').mockResolvedValue(undefined);
const decrementSpy = vi.spyOn(OpenPanel.prototype, 'decrement').mockResolvedValue(undefined);
const setGlobalPropertiesSpy = vi
    .spyOn(OpenPanel.prototype, 'setGlobalProperties')
    .mockImplementation(() => undefined);

describe('OpenPanelAnalyticsAdapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should apply global properties from the config', () => {
        // Given / When — an adapter created with global properties
        const analytics = new OpenPanelAnalyticsAdapter({
            clientId: 'client-id',
            globalProperties: { app: 'jterrazz-web' },
        });

        // Then — the properties are set on the client
        expect(analytics).toBeInstanceOf(OpenPanelAnalyticsAdapter);
        expect(setGlobalPropertiesSpy).toHaveBeenCalledWith({ app: 'jterrazz-web' });
    });

    it('should track an event with profile and properties', async () => {
        // Given — an adapter
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When — tracking an event scoped to a profile
        await analytics.track('article_read', {
            profileId: 'user-1',
            properties: { slug: 'hello-world' },
        });

        // Then — properties and profileId are merged into the SDK payload
        expect(trackSpy).toHaveBeenCalledWith('article_read', {
            profileId: 'user-1',
            slug: 'hello-world',
        });
    });

    it('should track an anonymous event without options', async () => {
        // Given — an adapter
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When — tracking without options
        await analytics.track('page_viewed');

        // Then — the event is sent without a profileId
        expect(trackSpy).toHaveBeenCalledWith('page_viewed', {
            profileId: undefined,
        });
    });

    it('should identify a profile', async () => {
        // Given — an adapter and a profile
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });
        const profile = {
            email: 'user@example.com',
            firstName: 'Jean',
            profileId: 'user-1',
            properties: { plan: 'pro' },
        };

        // When — identifying the profile
        await analytics.identify(profile);

        // Then — the profile is forwarded to the SDK
        expect(identifySpy).toHaveBeenCalledWith(profile);
    });

    it('should increment and decrement profile counters', async () => {
        // Given — an adapter
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When — incrementing and decrementing counters
        await analytics.increment('logins', { profileId: 'user-1' });
        await analytics.decrement('credits', { profileId: 'user-1', value: 2 });

        // Then — payloads follow the SDK shape
        expect(incrementSpy).toHaveBeenCalledWith({
            profileId: 'user-1',
            property: 'logins',
            value: undefined,
        });
        expect(decrementSpy).toHaveBeenCalledWith({
            profileId: 'user-1',
            property: 'credits',
            value: 2,
        });
    });

    it('should forward global properties set after construction', () => {
        // Given — an adapter
        const analytics = new OpenPanelAnalyticsAdapter({ clientId: 'client-id' });

        // When — setting global properties
        analytics.setGlobalProperties({ version: '1.0.0' });

        // Then — they are forwarded to the client
        expect(setGlobalPropertiesSpy).toHaveBeenCalledWith({ version: '1.0.0' });
    });
});
