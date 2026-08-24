import * as esbuild from 'esbuild'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const outfile = path.resolve('scripts/.verify-pool-flow.bundled.mjs')

await esbuild.build({
  entryPoints: ['scripts/verify-pool-flow.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  alias: { '@': './src' },
  logLevel: 'silent',
  banner: {
    js: `
      const mem = Object.create(null);
      const storage = {
        getItem: (k) => (Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null),
        setItem: (k, v) => { mem[k] = String(v); },
        removeItem: (k) => { delete mem[k]; },
      };
      const host = typeof globalThis.window === 'object' ? globalThis.window : globalThis;
      Object.defineProperty(host, 'localStorage', { configurable: true, writable: true, value: storage });
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: storage });
      if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
      globalThis.window.localStorage = storage;
      if (typeof globalThis.window.dispatchEvent !== 'function') {
        globalThis.window.dispatchEvent = () => true;
      }
      if (typeof globalThis.window.addEventListener !== 'function') {
        globalThis.window.addEventListener = () => {};
        globalThis.window.removeEventListener = () => {};
      }
    `,
  },
  plugins: [
    {
      name: 'break-mock-cycles',
      setup(build) {
        const stubs = [
          /\/mock\/api(\.ts)?$/,
          /\/utils\/hierarchicalDict(\.ts)?$/,
          /\/components\/resources\/ProductVoyageConfigPanel(\.tsx)?$/,
          /\/utils\/productVoyageConfig(\.ts)?$/,
        ]
        build.onResolve({ filter: /.*/ }, (args) => {
          const resolved = args.path.includes('@/')
            ? args.path.replace('@/', path.resolve('src') + '/')
            : path.resolve(args.resolveDir || '.', args.path)
          if (stubs.some((re) => re.test(resolved) || re.test(args.path))) {
            return { path: args.path, namespace: 'cycle-stub' }
          }
          return null
        })
        build.onLoad({ filter: /.*/, namespace: 'cycle-stub' }, () => ({
          contents: `
            export const hierarchicalDictApi = { listAll: async () => [] };
            export async function loadHierarchicalDictOptions() { return [] }
            export function enrichProductWithTemplateConfig(product) { return product }
            export function emptyProductVoyageConfig() { return {} }
            export function resolveTemplateItinerary() { return [] }
            export const templateApi = {}
            export const inventoryApi = {}
            export function createCrudApi(data = []) { return { list: async () => ({ data: [...(data||[])] }) } }
            export default {}
          `,
          loader: 'js',
        }))
      },
    },
  ],
})

await import(pathToFileURL(outfile).href)
