# Test

What proves a change here is a specification of what a consumer meets: the package installed from the tarball `npm pack` writes, driven from a consumer's project by `node`, and what an OpenPanel instance receives from it. There is no module test today.

```bash
make test       # builds, then runs every spec
make mutation   # the zero-survivor verdict over the change
```

## The specs

`specs/cli/` holds one runner, `cli.specification.ts`, which runs `node` with `TZ=UTC` and no `OPENPANEL_API_URL` inherited from the shell. Its specs sit in `specs/cli/node/`: each lays the consumer project of `__fixtures__/consumer/` in a fresh working directory and links the package into it with `.link('@jterrazz/analytics', packed())` — the tarball beside `@openpanel/sdk`, the one package its `dependencies` name, never the checkout's whole install — so a file `files` leaves out or an import the manifest does not declare fails here as it would for a consumer.

| Spec                   | Proves                                                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subpaths.spec.ts`     | the ESM and CommonJS builds name the same two adapters                                                                                                                                                                                            |
| `declarations.spec.ts` | a consumer's tracking plan, and inputs read from the environment, compile against the shipped `.d.ts` under the strict flags every estate preset sets, both adapters satisfy the typed port, and an undeclared event or property value is refused |
| `events.spec.ts`       | `track`, `page` and `revenue` as the track requests OpenPanel reads, global properties set at construction and later, and the client's credentials as headers                                                                                     |
| `profiles.spec.ts`     | `increment`, `decrement` and `identify` as profile updates — which fields stay top-level, which join the properties — and identify binding later events                                                                                           |
| `scopes.spec.ts`       | a `child(context)` sending the visitor's ip, user-agent, profile, device and locale with its events, a nested child keeping what it does not restate, an empty context field sent as nothing, the parent untouched                                |
| `noop.spec.ts`         | the no-op adapter answers the whole port with nothing, and its child scope is itself                                                                                                                                                              |

The specs pack `dist/`, never `src/`: `make test` builds first, but `npx vitest`, or one spec run on its own, straight after an edit tests the previous build — run `make build` before it.

## The ingest

`events`, `profiles` and `scopes` start an OpenPanel ingest (`__setup__/ingest.ts`) on a free local port inside the test, hand its URL to the consumer as `OPENPANEL_API_URL`, and compare what it received whole: one line per request — its method and path, the headers an instance reads (the client id and secret, the client ip, the user-agent) and the body as sent. The consumer awaits each call, so the lines come in the order it made them. A one-shot `exec` spawns the consumer asynchronously, so the ingest in the test's own process answers it.

## Re-recording a golden

A value in place is rewritten from the actual output by `TEST_UPDATE=1 npx vitest run <spec>` (after `make build`). Read the diff: the re-record is the new claim, and every changed line in it is a behaviour that changed.

## What earns a test

A behaviour a consumer relies on is specified through the packed package. A module test is kept only for a pure algorithm whose edges are cheaper at its own level, or for a failure no consumer's run can provoke honestly; neither adapter is either, so the two module tests the package once had — one spying on the SDK's prototype, one asserting only that nothing throws — and the integration spec that imported `src/` were replaced by the specs above.

## Mutation

`make mutation` runs `typescript mutation`: Stryker mutates the lines a change touched that no module test runs, rebuilds, and runs every spec against each mutant — the packed tarball carries the mutant. A mutant that a test runs and none detects fails the gate. Measure a whole branch with `npx typescript mutation --since <commit>`, or every line of the sources with `--mutate`, its ranges comma-separated:

```bash
npx typescript mutation --mutate "$(ls src/*.ts src/*/*.ts | sed 's/$/:1-400/' | paste -sd, -)"
```

## Related

- [Develop](develop.md) — the gestures, and where a new file goes.
- [Adapters](../reference/adapters.md) — what each request the specs read is made of.
