import pkg from '../package.json'

// Export individually to allow tree-shaking (though less relevant for CJS)
export const version: string = pkg.version
export const name: string = pkg.name
