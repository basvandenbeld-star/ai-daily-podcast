import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

const font: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  " ": ["000", "000", "000", "000", "000", "000", "000"]
};

function crc32(buffer: Buffer) {
  let crc = -1;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function setPixel(image: Uint8Array, width: number, x: number, y: number, color: [number, number, number, number]) {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const index = (y * width + x) * 4;
  image[index] = color[0];
  image[index + 1] = color[1];
  image[index + 2] = color[2];
  image[index + 3] = color[3];
}

function fillRect(
  image: Uint8Array,
  width: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number, number]
) {
  for (let yy = y; yy < y + h; yy += 1) {
    for (let xx = x; xx < x + w; xx += 1) setPixel(image, width, xx, yy, color);
  }
}

function drawText(image: Uint8Array, width: number, text: string, x: number, y: number, scale: number, color: [number, number, number, number]) {
  let cursor = x;
  for (const char of text.toUpperCase()) {
    const glyph = font[char] ?? font[" "];
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === "1") fillRect(image, width, cursor + col * scale, y + row * scale, scale, scale, color);
      }
    }
    cursor += (glyph[0].length + 1) * scale;
  }
}

export async function ensureArtwork(file: string) {
  try {
    await fs.access(file);
    return;
  } catch {
    // create below
  }

  await fs.mkdir(path.dirname(file), { recursive: true });
  const width = 1400;
  const image = new Uint8Array(width * width * 4);
  fillRect(image, width, 0, 0, width, width, [11, 18, 32, 255]);
  fillRect(image, width, 82, 82, 1236, 12, [246, 242, 232, 255]);
  fillRect(image, width, 82, 1306, 1236, 12, [246, 242, 232, 255]);
  fillRect(image, width, 82, 82, 12, 1236, [246, 242, 232, 255]);
  fillRect(image, width, 1306, 82, 12, 1236, [246, 242, 232, 255]);
  fillRect(image, width, 180, 980, 1040, 80, [114, 230, 172, 255]);
  drawText(image, width, "AI DAILY", 215, 430, 46, [246, 242, 232, 255]);
  drawText(image, width, "BAS", 510, 700, 38, [114, 230, 172, 255]);

  const rows: Buffer[] = [];
  for (let y = 0; y < width; y += 1) {
    rows.push(Buffer.from([0]));
    rows.push(Buffer.from(image.subarray(y * width * 4, (y + 1) * width * 4)));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(width, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0))
  ]);
  await fs.writeFile(file, png);
}
