import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { statementsPlugin } from './vite-plugin-statements'

export default defineConfig({
  plugins: [react(), statementsPlugin()],
})