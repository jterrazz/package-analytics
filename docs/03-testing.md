# Testing

What proves a change: a sibling unit test beside each adapter, and one integration suite that drives the full flow through a mocked network boundary. There is no golden file and no fixture tree — every scenario is a `.test.ts` under `vitest --run`.

## The sibling adapter tests

`src/adapters/noop.adapter.test.ts` and `src/adapters/open-panel.adapter.test.ts` sit beside the file they test, one per adapter:

- `noop.adapter.test.ts` asserts every method resolves without throwing and that `child()` returns the same instance — proving the adapter is truly inert.
- `open-panel.adapter.test.ts` spies on `@openpanel/sdk`'s `OpenPanel` prototype (`vi.spyOn`) and asserts each port method calls the right SDK method with the right shape — `track`, `page` as a `screen_view`, `revenue` defaulting to EUR, `identify` splitting codified traits from `properties`, `increment`/`decrement`, and that constructing with `globalProperties` calls `setGlobalProperties` once.

## The integration suite

`tests/integration/analytics-flow.integration.test.ts` is the one suite that proves the adapters from the OUTSIDE: it stubs `globalThis.fetch` rather than the SDK, so it exercises `OpenPanelAnalyticsAdapter` exactly as `@openpanel/sdk` would call the network, and asserts on the request that actually reaches the self-hosted `/track` endpoint — the URL, the `openpanel-client-id`/`openpanel-client-secret`/`openpanel-client-ip`/`user-agent` headers, and the JSON payload's `type` and `payload` shape. It also declares its own `TestEvents` tracking plan, mirroring how a consuming app extends `AnalyticsEvents`, and closes on the noop adapter sending nothing through the same fetch mock.

Where a unit test proves ONE adapter method maps to ONE SDK call, this suite proves the adapter's OWN request-scoping (`child`) keeps a parent's scope free of a child's context, and that a full flow (track → page → revenue → identify → increment → decrement) reaches the wire in the shape a self-hosted instance expects.

## Running it

`npm test` (or `make test`) runs both layers in one `vitest --run` pass — there is no separate command for the integration suite, and no fixture directory it mounts: its ground is the `fetch` mock declared in the file itself.
