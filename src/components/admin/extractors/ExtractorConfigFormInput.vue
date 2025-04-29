<template>
  <div class="extractor-config-form-input">
    <!-- boolean/checkbox type -->
    <el-form-item v-if="inputType === FIELD_TYPES.BOOLEAN" :prop="inputKey" class="short">
      <el-checkbox v-model="currentValue">{{ inputLabel }}</el-checkbox>
    </el-form-item>
    
    <!-- select/multi-select -->
    <el-form-item v-else-if="inputType === FIELD_TYPES.SELECT || inputType === FIELD_TYPES.MULTIPLE" :label="inputLabel" :prop="inputKey" :required="required">
      <el-select
        v-model="currentValue"
        :multiple="inputType === FIELD_TYPES.MULTIPLE"
        :collapse-tags="inputType === FIELD_TYPES.MULTIPLE">
        <el-option v-for="option in selectOptions" :key="option.value" :value="option.value" :label="option.display_name"></el-option>
      </el-select>
    </el-form-item>
  
    <!-- video frame time -->
    <video-accuracy-slider v-else-if="inputType === FIELD_TYPES.VIDEO_FRAMES" :init-accuracy="currentValue" :key-to-configure="inputKey" @changed="videoFramesChanged"/>
    
    <!-- number range -->
    <number-range-slider v-else-if="inputType === FIELD_TYPES.NUMBER_RANGE" :init-value="currentValue" :extractor-name="extractorName" :key-to-configure="inputKey" @changed="numberRangeChanged"/>
    
    <!-- all other types -->
    <el-form-item v-else-if="inputType != 'group'" :label="inputLabel" :required="required">
      <el-input v-model="currentValue"></el-input>
    </el-form-item>
  </div>
</template>

<script>
import { FIELD_TYPES } from './extractor-constants'
import NumberRangeSlider from './NumberRangeSlider.vue'
import VideoAccuracySlider from './VideoAccuracySlider.vue'

export default {
  name: 'extractor-config-form-input',
  components: {
    NumberRangeSlider,
    VideoAccuracySlider
  },
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
  mounted () {
    this.currentValue = this.inputValue
    this.$watch('currentValue', newVal => {
      this.$emit('value-changed', { key: this.inputKey, val: this.currentValue })
    })
  },
  data () {
    return {
      FIELD_TYPES,
      currentValue: ''
    }
  },
  methods: {
    numberRangeChanged (config) {
      this.currentValue = _.toString(config.value)
    },
    videoFramesChanged (config) {
      this.currentValue = config.value
    }
  }  
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.extractor-config-form-input {

}
</style>
