<template>
  <div class="video-accuracy-slider">
    <label :class="{ 'error': showFrameRateError }">Video accuracy:</label>
    <p class="note" :class="{ 'error': showFrameRateError }" v-if="!isMainFramesExtractor">Note: should not be set to a lower value than the 'Video Settings' accuracy above</p>
    <el-slider
      v-model="accuracyIndex"
      :min="0"
      :max="availableOptions.length - 1"
      :step="1"
      :show-stops="true"
      :show-tooltip="false"
      :class="{ 'error': showFrameRateError }"
      @change="handleChange"
    >
    </el-slider>
    <p :class="{ 'error': showFrameRateError }">{{ prettyFrameRate }}</p>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { pluralize } from 'humanize-plus'

import {
  VIDEO_MAIN_FRAME_ACCURACY,
  EXTRACTOR_FRAME_ACCURACY,
  VIDEO_MAIN_FRAMES_EXTRACTOR_NAME,
  VIDEO_MAIN_FRAMES_FRAME_RATE_CONFIG_KEY,
  VIDEO_MAIN_FRAMES_DEFAULT_FRAME_ACCURACY
} from './extractor-constants'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  GET_PROFILE_CONFIGS,
  GET_CURRENT_EXTRACTOR_PROFILE_ID
} from 'src/store/modules/admin/extractors'

export default {
  name: 'video-accuracy-slider',
  props: {
    initAccuracy: {
      type: String,
      required: true
    },
    isMainFramesExtractor: {
      type: Boolean,
      default: false
    },
    keyToConfigure: {
      type: String,
      default: VIDEO_MAIN_FRAMES_FRAME_RATE_CONFIG_KEY
    }
  },
  mounted () {
    this.$watch('initAccuracy', (newVal, oldVal) => {
      if (newVal && newVal !== oldVal) {
        this.accuracyIndex = this.availableOptions.indexOf(newVal) || 0
      }
    }, { immediate: true })    
  },
  data () {
    return {
      accuracyIndex: 0
    }    
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      currentProfileId: GET_CURRENT_EXTRACTOR_PROFILE_ID,
      configs: GET_PROFILE_CONFIGS
    }),
    actualVideoFrameRate () {
      return this.availableOptions[this.accuracyIndex]
    },
    availableOptions () {
      if (this.isMainFramesExtractor) {
        return VIDEO_MAIN_FRAME_ACCURACY
      }
      return EXTRACTOR_FRAME_ACCURACY
    },
    currentConfigs () {
      return this.configs[this.currentProfileId]
    },
    prettyFrameRate () {
      return `Every ${this.actualVideoFrameRate} ${pluralize(this.actualVideoFrameRate, 'Second', 'Seconds')}`
    },
    showFrameRateError () {
      if (this.isMainFramesExtractor) {
        return false
      }
      const vmfNumber = _.toNumber(this.videoMainFramesSetting)
      const thisNumber = _.toNumber(this.actualVideoFrameRate)
      return thisNumber < vmfNumber
    },
    videoMainFramesSetting () {
      const vmfConfig = this.currentConfigs.find(e => e.extractor_name === VIDEO_MAIN_FRAMES_EXTRACTOR_NAME)
      if (vmfConfig) {
        const vals = _.get(vmfConfig, 'config.values', []) || []
        const val = vals.find(v => v.key === VIDEO_MAIN_FRAMES_FRAME_RATE_CONFIG_KEY)
        if (val) {
          return val.value
        }
      }
      return VIDEO_MAIN_FRAMES_DEFAULT_FRAME_ACCURACY
    },
    videoMainFramesSettingIndex () {
      return this.availableOptions.indexOf(this.videoMainFramesSetting)
    }
  },
  methods: {
    handleChange (val) {
      this.$emit('changed', { key: this.keyToConfigure, value: this.actualVideoFrameRate })
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.video-accuracy-slider {
  font-family: @default-font-family-medium;
  margin: 5px 0 30px 45px;
  label {
    color: @text-medium;
    font-size: 11px;
    margin: 0 0 5px 0;
    padding: 0;
  }
  p {
    color: @text-medium;
    font-size: 12px;
    margin: 0;
    padding: 0;
    &.note {
      font-family: @default-font-family;
      font-size: 10px;
      font-style: italic;
      padding-top: 5px;
    }
  }
  .error {
    color: @color-alert;
  }
  .el-slider {
    .el-slider__runway {
      margin: 8px 0;
      .el-slider__bar {
        background-color: @color-accent;
      }
      .el-slider__button {
        border-color: @color-accent;
      }
    }
    &.error {
      .el-slider__runway {
        .el-slider__bar {
          background-color: @color-alert;
        }
        .el-slider__button {
          border-color: @color-alert;
        }
      }
    }
  }  
}
</style>
