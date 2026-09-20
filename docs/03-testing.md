# Testing

Two vitest projects, both run by `npm test`: `unit` for the sibling adapter tests, `integration` for the one spec that drives the full flow through a declared network boundary. There is no golden file and no fixture tree. The suffix says the kind: a `.test.ts` beside its module, a `.spec.ts` under `specs/<facet>/`.

## The two projects

`vitest.config.ts` declares them and nothing else — `defineSpecConfig({ test: { projects: [unit(), integration()] } })`, from `@jterrazz/test/vitest`. The preset carries the time budgets, the artefact directory and the ground the runner must not collect, so what this repository states is only which kinds of test it has.

| Project       | Collects                         | Whose subject is                                                    |
| ------------- | -------------------------------- | ------------------------------------------------------------------- |
| `unit`        | `**/*.test.ts` outside `specs/`  | an adapter alone                                                    |
| `integration` | `specs/integration/**/*.spec.ts` | `OpenPanelAnalyticsAdapter` against a declared self-hosted instance |

The fork is the subject, never the amount of machinery: an adapter method mapped to one SDK call is a module alone, however many assertions it carries; the full flow reaching the wire in the shape a self-hosted instance expects is an assembled thing.

## The sibling adapter tests

`src/adapters/noop.adapter.test.ts` and `src/adapters/open-panel.adapter.test.ts` sit beside the file they test, one per adapter:

- `noop.adapter.test.ts` asserts every method resolves without throwing and that `child()` returns the same instance — proving the adapter is truly inert.
- `open-panel.adapter.test.ts` spies on `@openpanel/sdk`'s `OpenPanel` prototype through `spyOnClient()`, called inside each test's Given because the preset restores every spy before the next one, and asserts each port method calls the right SDK method with the right shape — `track`, `page` as a `screen_view`, `revenue` defaulting to EUR, `identify` splitting codified traits from `properties`, `increment`/`decrement`, and that constructing with `globalProperties` calls `setGlobalProperties` once.

## The integration spec

`specs/integration/open-panel/flow.spec.ts` is the one suite that proves the adapters from the OUTSIDE. It runs on `specs/integration/integration.specification.ts` — a runner with no services, because what earns the folder here is the declared network rather than a container — and drives `track` → `page` → `revenue` → `identify` → `increment` → `decrement` against a self-hosted instance's `/track` endpoint.

No suite here stubs `fetch`. Every outgoing call an adapter makes is declared as a contract — a request to match and a response to serve — with `.intercept()` on the chain, and `.call()` hands the subject back as a result rather than as a value the test caught itself: a network mistake is read as `result.error`, never as a thrown exception the test itself must catch. The filter is the assertion — `http.post(url, { body, headers })` matches a deep subset of what was sent, so a case that once read a field off a fetch mock's calls now declares the request it expects and asserts only that nothing was refused. The one case that proves an ABSENCE — the parent scope carrying none of a child's request-context headers — keeps a dynamic response that captures the observed headers, because a subset filter cannot state that a header is missing.

The suite also declares its own `TestEvents` tracking plan, mirroring how a consuming app extends `AnalyticsEvents`, and closes on the noop adapter: its chain intercepts every URL with `http.unreachable()`, so a stray HTTP call the noop adapter is not supposed to make would fail transport and surface as `result.error`, proving the same absence a fetch-call count once did.

## What proves a change

| Change                                                                    | Proof                                                                                                 |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| A new field on an adapter's config or context                             | a unit test on the adapter that maps it, plus the integration spec if it changes the request sequence |
| A new adapter                                                             | its own `*.adapter.test.ts`, and the integration spec if it reaches a network                         |
| The full flow (track → page → revenue → identify → increment → decrement) | `specs/integration/open-panel/flow.spec.ts`                                                           |

## Running it

```bash
npm test                        # both projects
npx vitest --run --project unit # one of them
```

`typescript check` (`npm run lint`) runs alongside but proves shape, not behaviour — type-checking, lint, and format are gates on the code, not on what it does at runtime.
