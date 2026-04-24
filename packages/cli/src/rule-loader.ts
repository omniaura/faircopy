import type { Rule } from '@faircopy/core'

const REGISTRY_EXPORT_NAME = 'ruleRegistry'

type RuleModule = {
  ruleRegistry?: Map<string, Rule>
}

export interface LoadedRegistry {
  packageName: string
  registry: Map<string, Rule>
}

export async function loadRuleRegistries(ruleIds: string[]): Promise<LoadedRegistry[]> {
  const packageNames = getRulePackageNames(ruleIds)
  const registries = await Promise.all(packageNames.map(loadRegistry))
  return registries.filter((registry): registry is LoadedRegistry => registry !== null)
}

function getRulePackageNames(ruleIds: string[]): string[] {
  const packageNames = new Set<string>(['@faircopy/rules-default'])

  for (const ruleId of ruleIds) {
    const packageName = getPackageNameForRule(ruleId)
    if (packageName) {
      packageNames.add(packageName)
    }
  }

  return [...packageNames]
}

export function getPackageNameForRule(ruleId: string): string | null {
  if (!ruleId.includes('/')) return null

  const slashIndex = ruleId.lastIndexOf('/')
  if (slashIndex <= 0) return null

  return ruleId.slice(0, slashIndex)
}

export function getRuleName(ruleId: string): string {
  const slashIndex = ruleId.lastIndexOf('/')
  return slashIndex === -1 ? ruleId : ruleId.slice(slashIndex + 1)
}

async function loadRegistry(packageName: string): Promise<LoadedRegistry | null> {
  try {
    const mod = await import(packageName) as RuleModule
    if (mod[REGISTRY_EXPORT_NAME] instanceof Map) {
      return {
        packageName,
        registry: mod[REGISTRY_EXPORT_NAME],
      }
    }
  } catch {
    return null
  }

  return null
}

export function findRuleInRegistries(ruleId: string, registries: LoadedRegistry[]): Rule | null {
  const packageName = getPackageNameForRule(ruleId)
  const ruleName = getRuleName(ruleId)

  for (const { packageName: registryPackageName, registry } of registries) {
    if (packageName !== null && registryPackageName !== packageName) continue

    const rule = registry.get(ruleName)
    if (rule) return rule
  }

  return null
}
