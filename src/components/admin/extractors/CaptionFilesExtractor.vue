<template>
  <div class="caption-files-extractor">
    <el-checkbox v-model="active">Parse stand-alone caption files (.rtf, .scc, .srt, .stl, .ttml/.dxfp/.itt, .txt, .vtt, .xml)</el-checkbox>
    <ul v-if="isActive" class="options-list">
      <li><el-checkbox v-model="activeRTF">Parse captions from .rtf files</el-checkbox></li>
      <li><el-checkbox v-model="activeTXT">Parse captions from .txt files</el-checkbox></li>
      <li><el-checkbox v-model="activeXML">Parse captions from .xml files</el-checkbox></li>
    </ul>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  // getters
  GET_INSTALLED_EXTRACTORS,
  GET_PROFILE_CONFIGS,
  GET_CURRENT_EXTRACTOR_PROFILE_ID,
  // actions
  TOGGLE_EXTRACTOR_ACTIVE,
  INSTALL_EXTRACTOR_TO_PROFILE,
  UPDATE_EXTRACTOR_CONFIG
} from 'src/store/modules/admin/extractors'

const EXTRACTOR_NAME = 'caption_files'
const RTF_KEY = 'captions_process_rtf'
const TXT_KEY = 'captions_process_txt'
const XML_KEY = 'captions_process_xml'

export default {
  name: 'caption-files-extractor',
  computed: {
    ...mapGetters(EXTRACTORS, {
      currentProfileId: GET_CURRENT_EXTRACTOR_PROFILE_ID,
      installedExtractors: GET_INSTALLED_EXTRACTORS,
      profileConfigs: GET_PROFILE_CONFIGS
    }),
    currentProfileConfigs () {
      return this.profileConfigs[this.currentProfileId]
    },
    currentConfig () {
      if (this.currentProfileConfigs) {
        const c = this.currentProfileConfigs.find(c => c.extractor_name === EXTRACTOR_NAME)
        if (c) {
          return c
        }
      }
      return null
    },
    isInstalled () {
      return this.currentConfig !== null
    },
    isActive () {
      if (this.currentConfig && this.currentConfig.active) {
        return true
      }
      return false
    },
    extractorId () {
      if (this.currentConfig && this.currentConfig.id) {
        return this.currentConfig.id
      }
      return null
    },
    defaultConfig () {
      const e = this.installedExtractors.find(e => e.extractor_name === EXTRACTOR_NAME)
      const fields = _.get(e, 'config.fields', []) || []
      return fields.map(f => {
        return {
          key: f.key,
          value: f.default
        }
      })
    },
    active: {
      get () {
        return this.isActive
      },
      async set (checked) {
        try {
          if (this.isInstalled) {
            await this.doToggleExtractor({
              extractorId: this.extractorId,
              active: checked
            })
          } else {
            await this.doInstallExtractor({
              profileId: this.currentProfileId,
              extractorName: EXTRACTOR_NAME,
              configFields: this.defaultConfig
            })
          }
        } catch (err) {
          console.error(err)
        }
      }
    },
    activeRTF: {
      get () {
        if (this.currentConfig) {
          const fields = _.get(this.currentConfig, 'config.values', []) || []
          const f = fields.find(f => f.key === RTF_KEY)
          if (f) {
            return f.value === 'true'
          }
        }
        return false
      },
      async set (checked) {
        try {
          await this.doUpdateExtractor({
            extractorId: this.extractorId,
            configFields: [
              { key: RTF_KEY, value: checked.toString() }
            ]
          })
        } catch (err) {
          console.error(err)
        }
      }
    },
    activeTXT: {
      get () {
        if (this.currentConfig) {
          const fields = _.get(this.currentConfig, 'config.values', []) || []
          const f = fields.find(f => f.key === TXT_KEY)
          if (f) {
            return f.value === 'true'
          }
        }
        return false
      },
      async set (checked) {
        try {
          await this.doUpdateExtractor({
            extractorId: this.extractorId,
            configFields: [
              { key: TXT_KEY, value: checked.toString() }
            ]
          })
        } catch (err) {
          console.error(err)
        }
      }
    },
    activeXML: {
      get () {
        if (this.currentConfig) {
          const fields = _.get(this.currentConfig, 'config.values', []) || []
          const f = fields.find(f => f.key === XML_KEY)
          if (f) {
            return f.value === 'true'
          }
        }
        return false
      },
      async set (checked) {
        try {
          await this.doUpdateExtractor({
            extractorId: this.extractorId,
            configFields: [
              { key: XML_KEY, value: checked.toString() }
            ]
          })
        } catch (err) {
          console.error(err)
        }
      }
    }
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      doToggleExtractor: TOGGLE_EXTRACTOR_ACTIVE,
      doInstallExtractor: INSTALL_EXTRACTOR_TO_PROFILE,
      doUpdateExtractor: UPDATE_EXTRACTOR_CONFIG
    })
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.caption-files-extractor {
  .options-list {
    list-style: none;
    margin: 10px 0 0 25px;
    padding: 0;
  }
}
</style>
