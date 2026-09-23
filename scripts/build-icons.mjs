// Deterministic, dependency-free PNG app icons. No build-time font or image APIs.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
const directory = path.resolve(import.meta.dirname, '../public/icons')
mkdirSync(directory, { recursive: true })
function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, bytes) {
  const data = Buffer.concat([Buffer.from(type), bytes])
  const length = Buffer.alloc(4), checksum = Buffer.alloc(4)
  length.writeUInt32BE(bytes.length); checksum.writeUInt32BE(crc32(data))
  return Buffer.concat([length, data, checksum])
}
function color(x, y) {
  // Rounded mint tile inside a maskable-safe margin and a dark geometric I.
  const dx = Math.max(0, Math.abs(x - 0.5) - 0.19)
  const dy = Math.max(0, Math.abs(y - 0.5) - 0.19)
  const tile = dx * dx + dy * dy < 0.09 * 0.09
  const stem = x > 0.46 && x < 0.54 && y > 0.33 && y < 0.67
  const cap = x > 0.37 && x < 0.63 && ((y > 0.33 && y < 0.39) || (y > 0.61 && y < 0.67))
  return tile && !stem && !cap ? [0, 255, 159] : [7, 8, 9]
}
for (const size of [180, 192, 512]) {
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const rgb = [0, 0, 0]
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const sample = color((x + (dx + 0.5) / 2) / size, (y + (dy + 0.5) / 2) / size)
      sample.forEach((v, i) => { rgb[i] += v / 4 })
    }
    const offset = y * (size * 3 + 1) + 1 + x * 3
    rgb.forEach((v, i) => { raw[offset + i] = Math.round(v) })
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
  writeFileSync(path.join(directory, `icon-${size}.png`), png)
}
