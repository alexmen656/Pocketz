import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { applyUiTestMode } from './utils/uiTestMode'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// No-op in normal launches; seeds demo data + navigates when driven by UI tests.
await applyUiTestMode(router)

app.mount('#app')
