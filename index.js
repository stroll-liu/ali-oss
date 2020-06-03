import AliOSS from './src/index.vue'

export const el = {
  AliOSS
}

export default {
  install: function (Vue) {
    Vue.component(AliOSS.name, AliOSS)
  }
}
