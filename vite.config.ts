import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Silero VAD 워크릿·모델과 onnxruntime wasm을 정적 경로(/vad/)로 서빙
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@ricky0123/vad-web/dist/{vad.worklet.bundle.min.js,silero_vad_v5.onnx,silero_vad_legacy.onnx}',
          dest: 'vad',
          rename: { stripBase: true },
        },
        {
          src: 'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.{wasm,mjs}',
          dest: 'vad',
          rename: { stripBase: true },
        },
      ],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      workbox: {
        // VAD wasm(14MB)·onnx 모델은 precache 제외 — 대화 탭 진입 시에만 로드됨
        globIgnores: ['**/vad/**'],
      },
      manifest: {
        name: 'TriTalk',
        short_name: 'TriTalk',
        description: '한·영·일 실시간 통번역',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0f1626',
        background_color: '#0f1626',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
