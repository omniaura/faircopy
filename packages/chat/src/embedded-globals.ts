/** Injected into the standalone bundle only (tsup.global.config.ts). compromise
 * reads `self.env` for debug flags when `process` is absent, and calls
 * `console` on debug and warning paths. Embedded interpreters such as goja and
 * a bare `vm.createContext({})` define neither, so these inert stand-ins keep
 * the bundle free of host globals. They live inside the IIFE scope and are not
 * installed on the global object.
 */
const noop = (): void => {}

export const self = { env: {} }

export const console = {
  log: noop, info: noop, warn: noop, error: noop, debug: noop,
  table: noop, group: noop, groupCollapsed: noop, groupEnd: noop,
}
