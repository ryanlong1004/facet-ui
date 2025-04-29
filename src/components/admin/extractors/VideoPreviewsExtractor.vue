<template>
  <div class="video-previews-extractor">
    <el-checkbox v-model="active">Generate a low-res .mp4 proxy for playback inside the Wasabi AiR™ UI</el-checkbox>
    <ul v-if="isActive" class="options-list">
      <div class="watermark">
        <el-checkbox v-model="watermark">Watermark Wasabi AiR™ video proxy</el-checkbox>
        <ul v-if="watermark" class="options-list">
          <p>The Wasabi AiR™ proxy watermark may be customized from the
            <router-link v-if="$hasScope(SCOPES.ADMIN_BRANDING)" :to="{ name: 'admin-branding' }" name="admin-branding">
              <span>admin/branding</span></router-link>
            section, if no custom logo is uploaded the Wasabi AiR™ logo will be used.
          </p>
          <label>Watermark Location</label>
          <div class="watermark-location-radios">
            <el-radio-group v-model="video_previews_watermark_placement">
              <el-radio :label="'top-left'">Top Left</el-radio>
              <el-radio :label="'top-right'">Top Right</el-radio>
              <el-radio :label="'bottom-left'">Bottom Left</el-radio>
              <el-radio :label="'bottom-right'">Bottom Right</el-radio>
            </el-radio-group>
          </div>
          <label>Watermark Transparency</label>
          <div class="watermark-opacity">
            <el-radio-group v-model="video_previews_watermark_opacity">
              <el-radio :label="'1'">no transparency</el-radio>
              <el-radio :label="'.75'">25% transparent</el-radio>
              <el-radio :label="'.50'">50% transparent</el-radio>
              <el-radio :label="'.25'">75% transparent</el-radio>
            </el-radio-group>
          </div>
        </ul>
      </div>
    </ul>
  </div>
</template>

<script>
import _ from 'lodash'
import {
  mapGetters,
  mapActions
} from 'vuex'

import {
  EXTRACTORS
} from 'src/store/storeModules'
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

const EXTRACTOR_NAME = 'video_previews'
const WATERMARK_KEY = 'video_previews_watermark'
const WATERMARK_PLACEMENT = 'video_previews_watermark_placement'
const WATERMARK_OPACITY = 'video_previews_watermark_opacity'

export default {
  name: 'video-previews-extractor',
  props: {
    inputType: {
      type: String,
      required: true
    },
    inputKey: {
      type: String,
      required: true
    },
    inputLabel: {
      type: String,
      default: ''
    },
    inputValue: {
      required: false,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    extractorName: {
      type: String,
      required: true
    },
    selectOptions: {
      type: Array,
      required: false
    }
  },
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
      return !!(this.currentConfig && this.currentConfig.active)
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
    watermark: {
      get () {
        if (this.currentConfig) {
          const fields = _.get(this.currentConfig, 'config.values', []) || []
          const f = fields.find(f => f.key === WATERMARK_KEY)
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
            configFields: [{
              key: WATERMARK_KEY,
              value: checked.toString()
            }]
          })
        } catch (err) {
          console.error(err)
        }
      }
    },
    video_previews_watermark_placement: {
      get () {
        if (this.currentConfig) {
          const fields = _.get(this.currentConfig, 'config.values', []) || []
          const f = fields.find(f => f.key === WATERMARK_PLACEMENT)
          if (f) {
            return f.value
          }
        }
        return false
      },
      async set (checked) {
        try {
          await this.doUpdateExtractor({
            extractorId: this.extractorId,
            configFields: [{
              key: WATERMARK_PLACEMENT,
              value: checked.toString()
            }]
          })
        } catch (err) {
          console.error(err)
        }
      }
    },
    video_previews_watermark_opacity: {
      get () {
        if (this.currentConfig) {
          const fields = _.get(this.currentConfig, 'config.values', []) || []
          const f = fields.find(f => f.key === WATERMARK_OPACITY)
          if (f) {
            return f.value
          }
        }
        return false
      },
      async set (checked) {
        try {
          await this.doUpdateExtractor({
            extractorId: this.extractorId,
            configFields: [{
              key: WATERMARK_OPACITY,
              value: checked.toString()
            }]
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

.video-previews-extractor {
  .options-list {
    list-style: none;
    margin: 0 0 0 25px;
    padding: 0;
    padding-bottom: 5px;
  }

  .watermark {
    .options-list {
      list-style: none;
      margin: 5px 0 0 25px;
      padding: 0;
    }

    .watermark-location-radios {
      .flex-container();
      padding-top: 1px;
      padding-bottom: 5px;
      margin: 0 0 0 0;

      .el-select {
        width: 250px;
      }

      label {
        margin: 10px 0 0 25px;
      }
    }
  }

  .watermark-opacity {
    // list-style: none;
    // margin: 5px 0 0 25px;
    // padding: 0;
    .flex-container();
    padding-top: 1px;
    padding-bottom: 5px;
  }

  p {
    color: @color-tone-darkest;
    font-size: 11px;
  }

  a {
    color: @color-accent;
  }

  label {
    margin: 10px 0 0 25px;
  }
}
</style>
