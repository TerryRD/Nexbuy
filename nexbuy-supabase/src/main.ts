import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'
import zhTW from './locales/zh-TW.json'
import en from './locales/en.json'
import ja from './locales/ja.json'

const savedLocale = localStorage.getItem('locale') || 'zh-TW'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-TW',
  messages: { 'zh-TW': zhTW, en, ja }
})

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(naive)
app.mount('#app')
