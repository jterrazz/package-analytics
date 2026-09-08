# @jterrazz/analytics — documentation

The manual of this package: what it is, how it is changed, what proves a change, and how it ships. `README.md` at the repository root is the vitrine; `AGENTS.md`/`CLAUDE.md` route into this corpus and author nothing themselves.

| Chapter                                  | Holds                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [01-architecture.md](01-architecture.md) | The port/adapter shape, the two adapters, what the port deliberately excludes, the public surface |
| [02-developing.md](02-developing.md)     | The toolchain, the commands, where a new adapter's files go                                       |
| [03-testing.md](03-testing.md)           | The sibling adapter tests and the cross-adapter integration suite, what each proves               |
| [04-operating.md](04-operating.md)       | How this package is released: what a merge does, what a GitHub Release triggers                   |
| [05-adapters.md](05-adapters.md)         | `OpenPanelAnalyticsAdapter` and `NoopAnalyticsAdapter` in depth, and how to add a third           |

The decisions this package alone took stand in [decisions/](decisions/), numbered and chronological, the mold `_template.md` beside them. A decision spanning several repositories is not one of them.
