import { defineConfig } from 'eslint-define-config'

export default defineConfig({
  rules: {
    'vue/html-indent': ['error', 4], // Устанавливает отступы в 4 пробела для HTML в файлах Vue
    'indent': ['error', 4], // Устанавливает отступы в 4 пробела для JavaScript
  },
})
