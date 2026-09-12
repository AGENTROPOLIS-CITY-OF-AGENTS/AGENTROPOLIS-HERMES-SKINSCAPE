/**
 * Synchronize public ASCII recipe configurations from the 21st.dev community
 * vault. This imports recipe data and attribution only — never application
 * source code or hosted media binaries.
 */

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const VAULT_URL = 'https://21st.dev/community/ascii'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = resolve(root, 'data', 'community-recipes.json')
const auditPath = resolve(root, '..', 'docs', 'ASCII_VAULT_AUDIT.md')

function htmlScripts(html) {
  return [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1])
}

function extractBalancedObject(source, start) {
  let depth = 0
  let inString = false
  let escaped = false
  for (let index = start; index < source.length; index += 1) {
    const char = source[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, index + 1)
    }
  }
  throw new Error('unterminated recipe object')
}

function decodeRscPayload(script) {
  const marker = 'self.__next_f.push('
  const start = script.indexOf(marker)
  if (start < 0) return ''
  const end = script.lastIndexOf(')')
  if (end < start) return ''
  try {
    const payload = JSON.parse(script.slice(start + marker.length, end))
    return typeof payload?.[1] === 'string' ? payload[1] : ''
  } catch {
    return ''
  }
}

function parseRecipe(html) {
  for (const script of htmlScripts(html)) {
    const payload = decodeRscPayload(script)
    const marker = '"recipe":'
    const markerAt = payload.indexOf(marker)
    if (markerAt < 0 || !payload.includes('"recipeJson"')) continue
    const objectAt = payload.indexOf('{', markerAt + marker.length)
    if (objectAt < 0) continue
    return JSON.parse(extractBalancedObject(payload, objectAt))
  }
  throw new Error('recipe payload not found')
}

function recipeLinks(html) {
  const matches = html.matchAll(/href="(\/community\/ascii\/[a-z0-9-]+-[0-9a-f]{8}-[0-9a-f-]{27,})"/gi)
  return [...new Set([...matches].map((match) => new URL(match[1], VAULT_URL).href))]
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Hermes-ASCII-Forge/0.2 (+public-recipe-sync)' } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.text()
}

async function mapConcurrent(items, limit, worker) {
  const output = new Array(items.length)
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++
        output[index] = await worker(items[index], index)
      }
    })
  )
  return output
}

function fingerprint(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

const vaultHtml = await fetchText(VAULT_URL)
const links = recipeLinks(vaultHtml)
const recipes = await mapConcurrent(links, 6, async (sourceUrl) => {
  const recipe = parseRecipe(await fetchText(sourceUrl))
  return {
    id: recipe.id,
    slug: new URL(sourceUrl).pathname.split('/').pop(),
    name: recipe.name,
    author: recipe.author,
    publishedAt: recipe.publishedAt,
    bookmarksCount: recipe.bookmarksCount ?? 0,
    tags: recipe.tags ?? [],
    sourceUrl,
    publishedComponentPath: recipe.publishedComponentPath ?? null,
    thumbnailUrl: recipe.thumbnailUrl ?? null,
    videoUrl: recipe.videoUrl ?? null,
    configFingerprint: fingerprint(recipe.recipeJson),
    config: recipe.recipeJson
  }
})

recipes.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
const renderModes = [...new Set(recipes.map((recipe) => recipe.config?.renderMode).filter(Boolean))].sort()
const animationStyles = [...new Set(recipes.map((recipe) => recipe.config?.animStyle).filter(Boolean))].sort()
const characterSets = [...new Set(recipes.map((recipe) => recipe.config?.charSet).filter(Boolean))].sort()
const payload = {
  schemaVersion: 1,
  source: VAULT_URL,
  syncedAt: new Date().toISOString(),
  policy: 'Public recipe configuration and attribution only. Hosted media is referenced, not copied.',
  count: recipes.length,
  capabilities: { renderModes, animationStyles, characterSets },
  recipes
}

await mkdir(dirname(dataPath), { recursive: true })
await writeFile(dataPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const audit = `# Hermes ASCII Forge — Community Vault Audit

Source: ${VAULT_URL}

Synchronized: ${payload.syncedAt}

Recipes discovered: **${recipes.length}**

This inventory stores public recipe configuration, authorship, provenance,
and asset URLs. It does not copy 21st.dev application source or redistribute
hosted image/video binaries.

## Capability census

- Render modes: ${renderModes.join(', ') || 'none'}
- Animation styles: ${animationStyles.join(', ') || 'none'}
- Character sets: ${characterSets.join(', ') || 'none'}

## Recipes

| Recipe | Author | Mode | Animation | Source |
|---|---|---|---|---|
${recipes.map((recipe) => `| ${recipe.name.replaceAll('|', '\\|')} | ${(recipe.author || 'Unknown').replaceAll('|', '\\|')} | ${recipe.config?.renderMode ?? '—'} | ${recipe.config?.animated ? recipe.config?.animStyle ?? 'on' : 'off'} | [recipe](${recipe.sourceUrl}) |`).join('\n')}
`
await writeFile(auditPath, audit, 'utf8')

console.log(`ascii-vault: synchronized ${recipes.length} public recipes`)
console.log(`ascii-vault: ${dataPath}`)
