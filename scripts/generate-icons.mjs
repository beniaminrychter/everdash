// Dependency-free PNG generation. Keep the house silhouette in sync with home.svg.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}
function chunk(type, data) {
  const tag = Buffer.from(type);
  const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0);
  tag.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([tag, data])), data.length + 8);
  return output;
}
const polygon = [
  [20, 46],
  [50, 20],
  [80, 46],
  [75, 52],
  [70, 48],
  [70, 77],
  [56, 77],
  [56, 59],
  [44, 59],
  [44, 77],
  [30, 77],
  [30, 48],
  [25, 52],
];
function inside(x, y) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      result = !result;
    }
  }
  return result;
}
mkdirSync('public/icons', { recursive: true });
for (const [size, filename] of [
  [180, 'apple-touch-icon.png'],
  [192, 'icon-192.png'],
  [512, 'icon-512.png'],
]) {
  const data = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let cover = 0;
      for (const dx of [0.25, 0.75]) {
        for (const dy of [0.25, 0.75]) {
          if (inside(((x + dx) / size) * 100, ((y + dy) / size) * 100)) {
            cover += 0.25;
          }
        }
      }
      const index = y * (size * 3 + 1) + 1 + x * 3;
      [16, 62, 73].forEach((background, channel) => {
        data[index + channel] = Math.round(
          background * (1 - cover) + [255, 177, 61][channel] * cover,
        );
      });
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  writeFileSync(
    `public/icons/${filename}`,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', header),
      chunk('IDAT', deflateSync(data)),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}
console.log('Generated 180px Apple touch icon and 192px / 512px manifest icons.');
