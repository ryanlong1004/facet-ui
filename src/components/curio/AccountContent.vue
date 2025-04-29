<template>
  <content-local></content-local>
</template>

<script>
import { mapMutations } from 'vuex'
import { CURIO } from 'src/store/storeModules'

import ContentLocal from './ContentLocal'

export default {
  name: 'curio-account-content',

  components: {
    ContentLocal
  },

  beforeMount () {
    this.setProgress('content')
  },

  methods: {
    ...mapMutations(CURIO, [
      'setProgress'
    ])
  }
}
</script>
