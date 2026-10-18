# Develop

How a change to this package is made: the declaration every config follows, the gestures, where a new file goes, and what a change owes. What the package is made of is [Architecture](../concepts/architecture.md).

## The declaration

`@jterrazz/typescript` supplies the whole toolchain (build, type-check, lint, format, unused code, mutation) from one devDependency, and `jterrazz.config.ts` says what this package is: a `library` on `node`, held to `@jterrazz/test`'s preset. Every other config follows from that line:

- `oxlint.config.ts`, `oxfmt.config.ts`, `tsconfig.json` and `vitest.config.ts` are the one-line derivations `typescript fix` writes and `typescript check` refuses to see edited;
- knip, the build and Stryker are configured by the commands that run them, from the declaration and the manifest;
- the published entry is read off `package.json#exports`: `.` from `src/index.ts`.

The declaration holds no override: `NoopAnalyticsAdapter` lives in `noop.adapter.ts`, the name under which the standard's rulebook lets a null object answer its port by doing nothing.

## The gestures

| Gesture         | Runs                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| `make install`  | `npm ci`, once per change of the lockfile                                                                   |
| `make build`    | `typescript build`: the entry the manifest publishes, into `dist/`                                          |
| `make lint`     | `typescript check`: every pass, after a build, since the Publish (packaging) pass reads `dist/`             |
| `make fix`      | `typescript fix`: the derived files, the formatter, the fixable findings                                    |
| `make test`     | the specs, after a build, since they install the tarball `npm pack` writes from `dist/` ([Test](test.md))   |
| `make mutation` | `typescript mutation`: the zero-survivor verdict over the lines a change touches ([Test](test.md#mutation)) |
| `make check`    | `make lint`, `make test`, then `make mutation`: the gate before a commit                                    |

Build, test and lint output lands under `.artifacts/`, which `.gitignore` ignores whole; `dist/` is the published product, not an artefact.

## Where a new file goes

| Adding                           | Goes in                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| a new adapter                    | `src/adapters/<vendor>.adapter.ts`, a class implementing `AnalyticsPort`                                 |
| a public re-export               | `src/index.ts`, the package's one entry                                                                  |
| a behaviour a consumer relies on | a spec under `specs/cli/node/`, driving the packed package from a consumer's project ([Test](test.md))   |
| a module test                    | `<folder>/__tests__/<module>.test.ts`, kept only on the criteria [Test](test.md#what-earns-a-test) names |

A change to the port itself touches every adapter that implements it: widening it obliges a new method on `NoopAnalyticsAdapter` and on `OpenPanelAnalyticsAdapter` alike, and the compiler is what says so first.

## What a change owes

A new or changed export reaches the root `README.md`, the page of this manual that owns it and the `skills/jterrazz-analytics/` skill in the same change: none of the three is generated, so nothing catches a stale one. A comment states the kind of thing the code cannot say (`invariant:`, `hazard:`, `outside:`, `value:`) or is not written; every exported symbol keeps a one-line hover, and so does a field of one whose name does not say it all.

## Related

- [Architecture](../concepts/architecture.md): the port and adapters these files implement.
- [Test](test.md): how a change to one of them is proven.
