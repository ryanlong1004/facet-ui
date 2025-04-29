<template>
  <div class="number-range-slider">
    <label>{{ sliderLabel }}</label>
    <el-slider v-model="currentValue" :min="minValue" :max="maxValueScaled" :show-tooltip="false" @change="handleValueChanged"></el-slider>
    <p>{{ humanizedValue }}</p>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  GET_INSTALLED_EXTRACTORS,
  GET_PROFILE_CONFIGS,
  GET_CURRENT_EXTRACTOR_PROFILE_ID
} from 'src/store/modules/admin/extractors'

export default {
  name: 'number-range-slider',
  props: {
    extractorName: {
      type: String,
      required: true
    },
    initValue: {
      type: String,
      required: true
    },
    keyToConfigure: {
      type: String,
      required: true
    }
  },
  mounted () {
    this.$watch('initValue', (newVal, oldVal) => {
      if (newVal && newVal !== oldVal) {
        if (this.isFloatRange) {
          newVal *= 100
        }
        this.currentValue = _.toNumber(newVal)
      }
    }, { immediate: true })
  },
  data () {
    return {
      currentValue: 0
    }    
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      currentProfileId: GET_CURRENT_EXTRACTOR_PROFILE_ID,
      configs: GET_PROFILE_CONFIGS,
      installedExtractors: GET_INSTALLED_EXTRACTORS
    }),
    currentConfigs () {
      return this.configs[this.currentProfileId]
    },
    extractorConfig () {
      return this.installedExtractors.find(e => e.extractor_name === this.extractorName)
    },
    fieldConfig () {
      return _.get(this.extractorConfig, 'config.fields', []).find(f => f.key === this.keyToConfigure)
    },
    fieldOptions () {
      return _.get(this.fieldConfig, 'options', [])
    },
    humanizedValue () {
      if (this.isConfidence) {
        return `${this.currentValue}%`
      }
      return this.currentValue
    },
    maxValue () {
      const p = this.fieldOptions.find(o => o.display_name === 'max')
      return _.toNumber(p.value)
    },
    maxValueScaled () {
      if (this.isFloatRange) {
        return this.maxValue * 100
      }
      return this.maxValue
    },
    minValue () {
      const p = this.fieldOptions.find(o => o.display_name === 'min')
      return _.toNumber(p.value)
    },
    isFloatRange () {
      return this.maxValue === 1
    },
    isConfidence () {
      const p = this.fieldOptions.find(o => o.display_name === 'is_confidence')
      if (p) {
        return p.value === 'true'
      }
      return false
    },
    sliderLabel () {
      return _.get(this.fieldConfig, 'description', 'Unknown field')
    }
  },
  methods: {
    handleValueChanged (val) {
      if (this.isFloatRange) {
        val = val/100
      }
      this.$emit('changed', { key: this.keyToConfigure, value: _.toString(val) })
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.number-range-slider {
  margin-bottom: 20px;
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
  }
  p {
    color: @text-medium;
    font-family: @default-font-family-medium;
    font-size: 12px;
    margin: 0;
    padding: 0;
  }
}
</style>
