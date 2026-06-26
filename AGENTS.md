<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Nuxt 4 Application

Nuxt owns **dev**, **build**, and **runtime**. Vite+ owns **lint**, **format**, **test**, and **task orchestration** via `vite.config.ts`.

- **Package manager**: Bun (`devEngines.packageManager`).
- **Nitro preset**: `bun` (`nuxt.config.ts`).
- **App code**: `app/` (pages, layouts, components, composables).
- **Server routes**: `server/` (Nitro API).
- **Local Nuxt modules**: `modules/` (auto-registered).

## Config split

| File             | Responsibility                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `nuxt.config.ts` | Nuxt/Nitro/Vue app config, `typescript.shim`, Devtools                                                                     |
| `vite.config.ts` | Vite+ only: Oxlint, Oxfmt, Vitest, staged hooks, `run.tasks`                                                               |
| `tsconfig.json`  | Project references to generated `.nuxt/tsconfig.*.json` — do not edit paths by hand; extend via `nuxt.config.ts` / modules |

Do **not** put Oxlint/Oxfmt config in `oxlint.config.ts` or `.oxlintrc.json` — Vite+ expects the `lint` / `fmt` blocks in `vite.config.ts`.

## TypeScript

- Nuxt generates types in `.nuxt/` on `nuxt prepare` (also runs on `postinstall`).
- `typescript.shim: true` — Nuxt generates `.nuxt/types/vue-shim.d.ts` for `*.vue` imports.
- Type contexts: `app`, `server`, `shared`, `node` — see https://nuxt.com/docs/4.x/directory-structure/tsconfig.
- `@types/node` is a dev dependency for Node APIs in `vite.config.ts` and `modules/`.

## Linting (Oxlint, not ESLint)

This project uses **Oxlint via Vite+**, not the `@nuxt/eslint` module.

- **`modules/oxlint.ts`**: local Nuxt module; on `prepare:types` writes `.nuxt/oxlint.config.json` (globals from `.nuxt/imports.d.ts`, Vue + `@nuxt/eslint-plugin` rules).
- **`vite.config.ts`**: loads `.nuxt/oxlint.config.json`; minimal fallback if `nuxt prepare` has not run yet.
- Edit lint rules in `modules/oxlint.ts`, then run `nuxt prepare` (or any command that regenerates `.nuxt/`).

Nuxt-specific Oxlint rules (`nuxt/prefer-import-meta`, etc.) require `@nuxt/eslint-plugin` (already in devDependencies). Some rules inside `.vue` SFCs may not run — Oxlint JS plugins lack `vue-eslint-parser`.

## Commands

| Script                        | Action                                              |
| ----------------------------- | --------------------------------------------------- |
| `bun run dev`                 | `nuxt dev`                                          |
| `bun run build`               | `nuxt build`                                        |
| `bun run check` / `check:fix` | `vp check` — Oxfmt + Oxlint + type-aware lint       |
| `bun run lint` / `lint:fix`   | `vp lint`                                           |
| `bun run fmt`                 | `vp fmt`                                            |
| `bun run test`                | `vp test`                                           |
| `bun run typecheck`           | `nuxt typecheck` (vue-tsc, Nuxt project references) |
| `bun run validate`            | `nuxt prepare` → `vp check` → `nuxt typecheck`      |
| `bun run ci`                  | validate + `nuxt build` (cached via Vite+ tasks)    |

## Generated / ignored paths

Do not commit or manually edit: `.nuxt/`, `.output/`, `node_modules/`, `dist/`.

Key generated artifacts: `.nuxt/oxlint.config.json`, `.nuxt/imports.d.ts`, `.nuxt/tsconfig.*.json`.
