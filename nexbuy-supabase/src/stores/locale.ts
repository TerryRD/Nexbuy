import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const useLocaleStore = defineStore('locale', () => {
  const currentLocale = ref(localStorage.getItem('locale') || navigator.language.startsWith('ja') ? 'ja' : navigator.language.startsWith('en') ? 'en' : 'zh-TW')

  function setLocale(locale: string) {
    currentLocale.value = locale
    localStorage.setItem('locale', locale)
    document.documentElement.lang = locale
  }

  function initLocale() {
    const saved = localStorage.getItem('locale')
    if (saved) {
      currentLocale.value = saved
    }
    document.documentElement.lang = currentLocale.value
  }

  return { currentLocale, setLocale, initLocale }
})
