const fs = require('fs')
const p = 'src/data/products.ts'
const L = fs.readFileSync(p, 'utf8').split(/\r?\n/)

// Verify the seams before cutting — refuse rather than corrupt the file.
if (!L[76].startsWith('export const FEATURED_HOMEPAGE_PRODUCTS')) {
  console.error('seam A mismatch:', JSON.stringify(L[76]))
  process.exit(1)
}
if (L[1042].trim() !== ']') {
  console.error('seam B mismatch:', JSON.stringify(L[1042]))
  process.exit(1)
}
if (!L[1043].startsWith('export const CAR_BRANDS')) {
  console.error('seam C mismatch:', JSON.stringify(L[1043]))
  process.exit(1)
}

const out = [...L.slice(0, 76), ...L.slice(1043)]
fs.writeFileSync(p, out.join('\n'))
console.log('OK: removed', 1043 - 76, 'lines; new total', out.length)
