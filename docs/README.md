# The @jterrazz/analytics manual

Vendor-neutral product analytics for Node.js apps: one port, pluggable adapters. What the package is and how an app starts using it is the repository's README; this page lists every page of the manual, by what the reader came to do.

## Guides

| Page                         | Answers                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| [Develop](guides/develop.md) | Changing the package: the declaration, the gestures, where a new file goes, what it owes |
| [Test](guides/test.md)       | Proving a change: the specs that install the tarball, the ingest they read, the mutants  |
| [Release](guides/release.md) | How the package is published, and who cuts a release                                     |

## Concepts

| Page                                     | Answers                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| [Architecture](concepts/architecture.md) | The port, the adapters, what the port deliberately excludes, the public surface |

## Reference

| Page                              | Answers                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| [Adapters](reference/adapters.md) | Each adapter's configuration, what it sends for each port call, and request scopes |

## Decisions

The records of decisions this package alone took are in [`decisions/`](decisions/), numbered in the order they were taken, the mold `_template.md` beside them. A decision spanning several repositories is recorded by the corpus that spans them.
