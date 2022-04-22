import { createApp } from 'vue'

import { Remesh } from 'remesh'
import { RemeshVue } from 'remesh-vue'
import { RemeshLogger } from 'remesh-logger'
import { RemeshReduxDevtools } from 'remesh-redux-devtools'

import App from './App.vue'

const store = Remesh.store({
  inspectors: [RemeshReduxDevtools(), RemeshLogger()],
})

createApp(App).use(RemeshVue(store)).mount('#root')
