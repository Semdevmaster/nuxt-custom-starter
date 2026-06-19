import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { defineNuxtModule } from '@nuxt/kit'
import type { OxlintConfig } from 'oxlint'

type GlobalAccess = 'readonly' | 'writable' | 'off'

const FALLBACK_GLOBALS: Record<string, GlobalAccess> = {
  $fetch: 'readonly',
  computed: 'readonly',
  defineEmits: 'readonly',
  defineExpose: 'readonly',
  defineNuxtConfig: 'readonly',
  definePageMeta: 'readonly',
  defineProps: 'readonly',
  navigateTo: 'readonly',
  onMounted: 'readonly',
  onUnmounted: 'readonly',
  reactive: 'readonly',
  ref: 'readonly',
  shallowReactive: 'readonly',
  shallowRef: 'readonly',
  toRef: 'readonly',
  toRefs: 'readonly',
  useAsyncData: 'readonly',
  useFetch: 'readonly',
  useHead: 'readonly',
  useNuxtApp: 'readonly',
  useRoute: 'readonly',
  useRouter: 'readonly',
  useRuntimeConfig: 'readonly',
  useSeoMeta: 'readonly',
  useState: 'readonly',
  watch: 'readonly',
  watchEffect: 'readonly',
}

const BASE_PLUGINS = [
  'eslint',
  'typescript',
  'vue',
  'import',
  'unicorn',
  'node',
  'promise',
  'oxc',
] as const

function parseExportNames(exportClause: string): string[] {
  return exportClause
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const aliasMatch = part.match(/^([\w$]+)\s+as\s+([\w$]+)$/)
      if (aliasMatch) return aliasMatch[2]!
      return part.split(/\s+/)[0]!
    })
    .filter((name) => /^[\w$]+$/.test(name) && !/^[A-Z]/.test(name))
}

function loadGlobalsFromImports(importsPath: string): Record<string, GlobalAccess> {
  const globals: Record<string, GlobalAccess> = { ...FALLBACK_GLOBALS }

  if (!existsSync(importsPath)) {
    return globals
  }

  const content = readFileSync(importsPath, 'utf-8')
  for (const match of content.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const name of parseExportNames(match[1]!)) {
      globals[name] = 'readonly'
    }
  }

  globals.defineNuxtConfig = 'readonly'
  globals.$fetch = 'readonly'

  return globals
}

function createOxlintConfig(globals: Record<string, GlobalAccess>): OxlintConfig {
  return {
    ignorePatterns: ['dist/**', '.nuxt/**', '.output/**', 'node_modules/**'],
    plugins: [...BASE_PLUGINS],
    env: {
      browser: true,
      node: true,
      es2024: true,
    },
    globals,
    jsPlugins: [
      { name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' },
      { name: 'nuxt', specifier: '@nuxt/eslint-plugin' },
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'nuxt/prefer-import-meta': 'error',
      'import/first': 'error',
      'import/no-duplicates': 'error',
      'vue/define-emits-declaration': 'warn',
      'vue/define-props-declaration': 'warn',
      'vue/no-export-in-script-setup': 'error',
      'vue/no-expose-after-await': 'error',
      'vue/no-import-compiler-macros': 'error',
      'vue/no-lifecycle-after-await': 'error',
      'vue/no-reserved-component-names': 'error',
      'vue/no-watch-after-await': 'error',
      'vue/prefer-import-from-vue': 'error',
      'vue/require-default-export': 'error',
      'vue/valid-define-emits': 'error',
      'vue/valid-define-props': 'error',
    },
    overrides: [
      {
        files: ['app/pages/**/*.{vue,tsx,jsx}'],
        plugins: [...BASE_PLUGINS],
        rules: {
          'nuxt/no-page-meta-runtime-values': 'error',
        },
      },
      {
        files: ['nuxt.config.{js,ts,mjs,cjs}', '.config/nuxt.{js,ts,mjs,cjs}'],
        plugins: [...BASE_PLUGINS],
        rules: {
          'nuxt/no-nuxt-config-test-key': 'error',
          'nuxt/nuxt-config-keys-order': 'warn',
        },
      },
      {
        files: ['**/*.{test,spec}.{js,ts,mjs,cjs}'],
        plugins: [...BASE_PLUGINS, 'vitest'],
        rules: {
          'no-console': 'off',
        },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  }
}

export default defineNuxtModule({
  meta: {
    name: 'project:oxlint',
  },
  setup(_options, nuxt) {
    nuxt.hook('prepare:types', ({ nodeTsConfig }) => {
      nodeTsConfig.include ??= []
      nodeTsConfig.include.push('../vite.config.ts')

      nodeTsConfig.compilerOptions ??= {}
      nodeTsConfig.compilerOptions.types = ['node']

      const importsPath = join(nuxt.options.buildDir, 'imports.d.ts')
      const config = createOxlintConfig(loadGlobalsFromImports(importsPath))

      writeFileSync(
        join(nuxt.options.buildDir, 'oxlint.config.json'),
        `${JSON.stringify(config, null, 2)}\n`,
      )
    })
  },
})
