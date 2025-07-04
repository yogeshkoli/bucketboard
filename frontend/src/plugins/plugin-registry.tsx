import { Plugin } from './plugin-types';

const plugins: Plugin[] = [];

export function registerPlugin(plugin: Plugin) {
  console.log(`[Plugin System] Registering plugin: ${plugin.name} v${plugin.version}`);
  plugins.push(plugin);
}

export function getPluginsFor<T extends keyof Plugin['contributions']>(
  contributionPoint: T
): NonNullable<Plugin['contributions'][T]> {
  const contributedComponents = plugins.flatMap(
    (p) => p.contributions[contributionPoint] || []
  );
  return contributedComponents as NonNullable<Plugin['contributions'][T]>;
}