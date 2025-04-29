<template>
  <div class="video-main-frames-extractor">
    <p>
      In order for most machine learning services that analyze visual data (OCR, tags, scene descriptions, etc) to work on video files,
      you must extract frames from video via the following checkbox:
    </p>
    <el-checkbox v-model="active">Extract frames from video for Machine Learning analysis</el-checkbox>
    <video-accuracy-slider v-if="isActive" :is-main-frames-extractor="true" :init-accuracy="initVideoAccuracy" @changed="accuracyChanged"/>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'

import VideoAccuracySlider from './VideoAccuracySlider.vue'

import {
  VIDEO_MAIN_FRAMES_EXTRACTOR_NAME,
  VIDEO_MAIN_FRAMES_FRAME_RATE_CONFIG_KEY,
  VIDEO_MAIN_FRAMES_DEFAULT_FRAME_ACCURACY
} from './extractor-constants'

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

export default {
  name: 'video-main-frames-extractor',
  components: {
    VideoAccuracySlider
  },
  mounted () {
    const defaultAccuracyField = this.defaultConfig.find(f => f.key === VIDEO_MAIN_FRAMES_FRAME_RATE_CONFIG_KEY)
    let defaultAccuracy = defaultAccuracyField.value
    if (this.currentConfig !== null) {
      const v = this.currentConfig.config.values.find(f => f.key === VIDEO_MAIN_FRAMES_FRAME_RATE_CONFIG_KEY)
      defaultAccuracy = v.value
    }
    this.initVideoAccuracy = defaultAccuracy
  },
  data () {
    return {
      initVideoAccuracy: VIDEO_MAIN_FRAMES_DEFAULT_FRAME_ACCURACY
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
        const c = this.currentProfileConfigs.find(c => c.extractor_name === VIDEO_MAIN_FRAMES_EXTRACTOR_NAME)
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
      const e = this.installedExtractors.find(e => e.extractor_name === VIDEO_MAIN_FRAMES_EXTRACTOR_NAME)
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
              extractorName: VIDEO_MAIN_FRAMES_EXTRACTOR_NAME,
              configFields: this.defaultConfig
            })
          }
        } catch (err) {
          this.$notify({
            type: 'error',
            title: 'Error',
            message: 'Unable to enable/disable video frames, please try again'
          })
        }
      }
    }
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      doToggleExtractor: TOGGLE_EXTRACTOR_ACTIVE,
      doInstallExtractor: INSTALL_EXTRACTOR_TO_PROFILE,
      doUpdateExtractor: UPDATE_EXTRACTOR_CONFIG
    }),
    async accuracyChanged (config) {
      try {
        await this.doUpdateExtractor({
          extractorId: this.extractorId,
          configFields: [
            { key: VIDEO_MAIN_FRAMES_FRAME_RATE_CONFIG_KEY, value: config.value }
          ]
        })
      } catch (err) {
        this.$notify({
          type: 'error',
          title: 'Error',
          message: 'Error changing video accuracy, please try again'
        })
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.video-main-frames-extractor {
  margin-top: 20px;
  > p {
    color: @text-medium;
    font-size: 11px;
  }
  .video-accuracy-slider {
    margin: 5px 0 20px 25px;
  }
}
</style>
