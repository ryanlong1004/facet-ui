<template>
  <el-checkbox class="boolean-extractor" v-model="enabled">{{ label }}</el-checkbox>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  // getters
  GET_PROFILE_CONFIGS,
  GET_CURRENT_EXTRACTOR_PROFILE_ID,
  // actions
  TOGGLE_EXTRACTOR_ACTIVE,
  INSTALL_EXTRACTOR_TO_PROFILE
} from 'src/store/modules/admin/extractors'

export default {
  name: 'boolean-extractor',
  props: {
    extractorName: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    }
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      profileConfigs: GET_PROFILE_CONFIGS,
      currentProfileId: GET_CURRENT_EXTRACTOR_PROFILE_ID
    }),
    config () {
      const c = this.profileConfigs[this.currentProfileId]
      if (c) {
        return c.find(e => e.extractor_name === this.extractorName)
      }
    },
    enabled: {
      get () {
        if (this.config) {
          return this.config.active
        }
      },
      async set (val) {
        if (this.config) {
          const extractorId = this.config.id
          await this.doToggleExtractor({ extractorId, active: val })
        } else {
          await this.doInstallExtractor({
            profileId: this.currentProfileId,
            extractorName: this.extractorName
          })
        }
      }
    }
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      doToggleExtractor: TOGGLE_EXTRACTOR_ACTIVE,
      doInstallExtractor: INSTALL_EXTRACTOR_TO_PROFILE
    })
  }
}
</script>
