<template>
  <div v-loading="loading">
    <br>
    <div v-if="featureFlags.length">
        <div v-for="feature in featureFlags" :key="feature.id">
          <input :checked="feature.enabled" type="checkbox" :id="feature.id" :value="feature.id" @change="onChange">
          <label :for="feature.id">{{feature.id}}</label>
        </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import { FEATURE_FLAGS } from 'src/store/storeModules'
import {
  GET_FEATURE_FLAGS,
  GET_FEATURE_FLAGS_LOADING
} from 'src/store/modules/admin/feature-flags/getters'
import {
  FETCH_FEATURE_FLAGS,
  UPDATE_FEATURE_FLAG
} from 'src/store/modules/admin/feature-flags/actions'

export default {
  name: 'features-page',

  mounted: async function () {
    this.fetchFeatureFlags()
  },

  computed: {
    ...mapGetters(FEATURE_FLAGS, {
      featureFlags: GET_FEATURE_FLAGS,
      loading: GET_FEATURE_FLAGS_LOADING
    })
  },

  methods: {
    ...mapActions(FEATURE_FLAGS, {
      fetchFeatureFlags: FETCH_FEATURE_FLAGS,
      updateFeatureFlag: UPDATE_FEATURE_FLAG
    }),
    onChange: function (e) {
      this.updateFeatureFlag({
        featureFlagId: e.currentTarget.id,
        enabled: e.currentTarget.checked
      })
    }
  }
}
</script>

<style scoped>
  div {
    margin: 10px;
  }
</style>
