const fs = require('fs')
const p = 'src/data/adCampaigns.ts'
const L = fs.readFileSync(p, 'utf8').split(/\r?\n/)

// Cut CAMPAIGN_PRESETS (line 69) through getCampaignBySlug's closing brace (289).
// 1-based 69..289 => indices 68..288
if (!L[68].startsWith('export const CAMPAIGN_PRESETS')) {
  console.error('seam A mismatch:', JSON.stringify(L[68]))
  process.exit(1)
}
if (L[288].trim() !== '}') {
  console.error('seam B mismatch:', JSON.stringify(L[288]))
  process.exit(1)
}
if (!L[290].includes('Builds a dynamic high-converting')) {
  console.error('seam C mismatch:', JSON.stringify(L[290]))
  process.exit(1)
}

const out = [...L.slice(0, 68), ...L.slice(289)]
fs.writeFileSync(p, out.join('\n'))
console.log('OK: removed', 289 - 68, 'lines from adCampaigns.ts; new total', out.length)
