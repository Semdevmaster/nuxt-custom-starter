<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Nuxt 4.5 Application

Nuxt owns **dev**, **build**, and **runtime**. Vite+ owns **lint**, **format**, **typecheck**, **test**, and **task orchestration**.

- **Nuxt**: `^4.5.0` with `future.compatibilityVersion: 5` (Vite Environment API + Nuxt 5 defaults).
- **TypeScript**: `^7` (typecheck via Vite+ / tsgolint).
- **Package manager**: Bun (`devEngines.packageManager`).
- **Nitro preset**: `bun`.
- **App code**: `app/`.
- **Server routes**: `server/` (Nitro API).

## Config split

| File             | Responsibility                                                                 |
| ---------------- | ------------------------------------------------------------------------------ |
| `nuxt.config.ts` | Nuxt/Nitro: `future.compatibilityVersion`, `compatibilityDate`, `nitro.preset` |
| `vite.config.ts` | Vite+ only: Oxlint, Oxfmt, Vitest, `run.tasks` — **required** by Vite+         |
| `tsconfig.json`  | Project references to `.nuxt/tsconfig.*.json` — do not edit paths by hand      |

Do **not** put Oxlint/Oxfmt in `oxlint.config.ts` / `.oxlintrc.json`. Do **not** put Vite+ `lint`/`fmt` under `nuxt.config` `vite` — Vite+ does not read that key ([discussion](https://github.com/nuxt/nuxt/discussions/34857)).

`nuxt dev` may warn that `vite.config.ts` is unsupported; that is expected. Nuxt ignores it for the builder; Vite+ uses it for tooling.

## TypeScript & checking

- Types are generated in `.nuxt/` via `nuxt prepare` (`postinstall`).
- **Typecheck** runs through Vite+ (`vp check` / `lint.options.typeCheck`) via tsgolint (TypeScript Go), not `vue-tsc` / `nuxt typecheck`.
- `vue-tsc` is intentionally omitted: it needs the classic TS API and is not ready for TypeScript 7 alone.

## Linting (Oxlint via Vite+)

- Rules live in `vite.config.ts` → `lint`.
- Nuxt-specific rules use `@nuxt/eslint-plugin` as an Oxlint JS plugin (`lint.jsPlugins`, prefix `nuxt/`).
- Peer `eslint` is required for that JS plugin runtime (not a separate ESLint runner).
- Scoped Nuxt rules: `nuxt/no-page-meta-runtime-values` → `app/pages/**`; config-order / `test` key → `nuxt.config.*`.
- Oxlint covers `<script>` in SFCs; templates are not fully linted yet.

## Commands

| Script                        | Action                                           |
| ----------------------------- | ------------------------------------------------ |
| `bun run dev`                 | `nuxt dev`                                       |
| `bun run build`               | `nuxt build`                                     |
| `bun run check` / `check:fix` | `vp check` — Oxfmt + Oxlint + typecheck          |
| `bun run lint` / `lint:fix`   | `vp lint`                                        |
| `bun run fmt`                 | `vp fmt`                                         |
| `bun run test`                | `vp test`                                        |
| `bun run typecheck`           | `vp check --no-fmt`                              |
| `bun run validate`            | `nuxt prepare` → `vp check`                      |
| `bun run ci`                  | validate + `nuxt build` (cached via Vite+ tasks) |

## Generated / ignored

Do not commit: `.nuxt/`, `.output/`, `node_modules/`, `dist/`.
