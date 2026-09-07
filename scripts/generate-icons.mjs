// 아이콘 생성 스크립트: node scripts/generate-icons.mjs
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="#0a0a0f"/>
  <rect x="32" y="32" width="448" height="448" rx="104" fill="url(#g)"/>
  <!-- 말풍선 -->
  <path d="M136 168c0-22 18-40 40-40h160c22 0 40 18 40 40v104c0 22-18 40-40 40h-88l-56 48v-48h-16c-22 0-40-18-40-40z" fill="#ffffff"/>
  <!-- 세 언어를 뜻하는 점 3개 -->
  <circle cx="196" cy="220" r="16" fill="#7c3aed"/>
  <circle cx="256" cy="220" r="16" fill="#5b48f0"/>
  <circle cx="316" cy="220" r="16" fill="#2563eb"/>
</svg>`

const buf = Buffer.from(svg)
mkdirSync('public/icons', { recursive: true })

await sharp(buf).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(buf).resize(512, 512).png().toFile('public/icons/icon-512.png')
await sharp(buf).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png')

console.log('icons generated: 192, 512, apple-touch-icon 180')
