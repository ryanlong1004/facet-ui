<template>
  <div class="color-picker">
    <span
      class="color-picker__chip"
      v-for="color in colorList"
      :key="color.hex"
      @click="colorPicked(color)"
      :class="{ 'color-picker__chip--disabled': color.disabled, 'color-picker__chip--active': color.active, 'color-picker__chip--white': color.hex.toLowerCase() === '#ffffff' }"
      :style="{ 'background-color': color.hex }">
      <div class="color-picker__chip__active-icon" v-if="color.active"></div>
    </span>
  </div>
</template>

<script>
import _ from 'lodash'
export default {
  name: 'color-picker',
  props: {
    colors: {
      type: Array
    },
    disabledColors: {
      type: Array
    },
    value: {
      type: String
    }
  },
  data () {
    return {
      colorList: []
    }
  },
  mounted () {
    this.updateColors()
  },
  watch: {
    disabledColors (newVal, oldVal) {
      this.updateColors()
    }
  },
  methods: {
    updateColors () {
      this.colorList = this.colors.map(c => {
        return {
          hex: c,
          disabled: this.disabledColors.indexOf(c) >= 0 && this.value !== c,
          active: this.value === c
        }
      })
    },
    colorPicked (color) {
      if (!color.disabled) {
        this.$emit('input', color.hex)
        // this.value = color.hex
        const currentActive = _.find(this.colorList, { active: true })
        if (currentActive) {
          currentActive.active = false
        }
        color.active = true
      }
    }
  }
}
</script>

<style lang="less" scoped>
@chip-size: 20px;
@chip-gutter: 4px;

.color-picker {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  position: relative;
  .color-picker__chip {
    border: 1px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: @chip-gutter;
    margin-right: @chip-gutter;
    overflow: hidden;
    position: relative;
    height: @chip-size;
    width: @chip-size;
    &--white {
      border-color: @color-tone-lighter;
    }
    &__active-icon {
      border-radius: 50%;
      background: @color-base;
      width: 6px;
      height: 6px;
    }
    &--disabled {
      border-color: @color-disabled;
      cursor: not-allowed;
      opacity: 0.2;
    }
  }
}
</style>
