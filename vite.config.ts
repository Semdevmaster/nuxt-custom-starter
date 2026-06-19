import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite-plus'
import type { OxlintConfig } from 'oxlint'

const rootDir = dirname(fileURLToPath(import.meta.url))

function loadOxlintConfig(): OxlintConfig {
  const configPath = join(rootDir, '.nuxt/oxlint.config.json')

  if (existsSync(configPath)) {
    return JSON.parse(readFileSync(configPath, 'utf-8')) as OxlintConfig
  }

  return {
    ignorePatterns: ['dist/**', '.nuxt/**', '.output/**', 'node_modules/**'],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  }
}

export default defineConfig({
  // Vite+ tooling config only — Nuxt owns dev/build via nuxt.config.ts `vite` block.
  lint: loadOxlintConfig(),
  fmt: {
    singleQuote: true,
    semi: false,
    printWidth: 100,
  },
  test: {
    include: ['**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules/**', '.nuxt/**', '.output/**'],
  },
  staged: {
    '*': 'vp check --fix',
  },
  run: {
    tasks: {
      'nuxt:prepare': {
        command: 'nuxt prepare',
      },
      'pipeline:validate': {
        command: ['vp check', 'nuxt typecheck'],
        dependsOn: ['nuxt:prepare'],
      },
      'pipeline:ci': {
        command: ['vp check', 'nuxt typecheck', 'nuxt build'],
        dependsOn: ['nuxt:prepare'],
        output: ['.output/**'],
      },
    },
  },
})
