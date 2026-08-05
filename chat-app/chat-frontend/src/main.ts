import { createApp } from 'vue'
import App from './App.vue'
import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';

polyfillCountryFlagEmojis();

createApp(App).mount('#app')
