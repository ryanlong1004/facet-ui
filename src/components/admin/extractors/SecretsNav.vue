<template>
  <div class="secrets-nav">
    <ul class="nav-links">
      <li
        v-for="provider in providersWithSecrets"
        :key="provider.id"
        :class="{ 'active': provider.id === currentSecretProviderId }">
        <router-link :to="{ name: 'extractor-secrets', params: { provider: provider.id } }">
          {{ provider.name }}
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  GET_PROVIDERS_WITH_SECRETS
} from 'src/store/modules/admin/extractors'

export default {
  name: 'secrets-nav',
  computed: {
    ...mapGetters(EXTRACTORS, {
      providersWithSecrets: GET_PROVIDERS_WITH_SECRETS
    }),
  },
  beforeMount () {
    this.$watch('$route.params.provider', newVal => {
      if (newVal) {
        this.currentSecretProviderId = newVal
      }      
    }, { immediate: true })
    // if no provider in current route, force it
    if (!this.$route.params.provider) {
      this.$router.push({
        name: 'extractor-secrets',
        params: {
          provider: this.providersWithSecrets[0].id
        }
      })
    }
  },
  data () {
    return {
      currentSecretProviderId: ''
    }
  }
}
</script>
