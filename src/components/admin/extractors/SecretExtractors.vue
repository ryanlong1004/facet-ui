<template>
  <div class="secret-extractors">
    <secrets-list class="secret-list" v-for="extractor in secretExtractorsByCurrentProvider" :key="extractor.extractor_name" :extractor-name="extractor.extractor_name"/>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'

import SecretsList from './SecretsList.vue'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  // getters
  GET_EXTRACTOR_PROFILES,
  GET_INSTALLED_EXTRACTORS,
  GET_EXTRACTORS_WITH_SECRETS,
  GET_PROVIDERS_WITH_SECRETS,
  GET_NUM_SECRETS_BY_EXTRACTOR,
  GET_EXTRACTOR_SECRETS,
  // actions
  FETCH_EXTRACTOR_PROFILES,
  FETCH_EXTRACTOR_PROFILE,
  FETCH_INSTALLED_EXTRACTORS,
  SELECT_PROFILE,
  FETCH_EXTRACTOR_SECRETS
} from 'src/store/modules/admin/extractors'

export default {
  name: 'secret-extractors',
  components: {
    SecretsList
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      providersWithSecrets: GET_PROVIDERS_WITH_SECRETS,
      secretExtractors: GET_EXTRACTORS_WITH_SECRETS
    }),
    secretExtractorsByCurrentProvider () {
      const currentProviderId = this.$route.params.provider
      if (currentProviderId) {
        const provider = this.providersWithSecrets.find(p => p.id === currentProviderId)
        if (provider) {
          let se = this.secretExtractors.filter(e => e.provider_name === provider.name)
          return _.sortBy(se, ['display_name'])
        }        
      }
      return []
    }
  },
  methods: {

  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.secret-list {
  border-bottom: 1px solid @box-border-grey;
  margin-bottom: 25px;
  margin-top: 25px;
  padding-bottom: 25px;
  &:first-child {
    margin-top: 0;
  }
  &:last-child {
    border-bottom: 0 none;
  }
}
</style>
