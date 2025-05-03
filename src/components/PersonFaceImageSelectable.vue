<template>
  <div
    :class="{
      'person-face-image-selectable': true,
      selected,
      selectable,
      dimmed: dimmable && !selected
    }"
    :style="{
      'border-radius': `${borderRadius}`,
      height,
      width
    }"
    @click="handleClick($event)"
  >
    <slot name="overlay"></slot>
    <person-face-image
      :image-url="imageUrl"
      :border-radius="borderRadius"
      height="100%"
      width="100%"/>
  </div>
</template>

<script>
import PersonFaceImage from './PersonFaceImage.vue'

export default {
  name: 'person-face-image-selectable',
  props: {
    selected: {
      type: Boolean,
      default: false
    },
    selectable: {
      type: Boolean,
      default: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    borderRadius: {
      type: String,
      default: '0px'
    },
    height: {
      type: String,
      default: '100px'
    },
    width: {
      type: String,
      default: '100px'
    },
    dimmable: {
      type: Boolean,
      default: false
    }
  },
  components: {
    PersonFaceImage
  },
  methods: {
    handleClick ($event) {
      if (this.selectable) {
        this.$emit('click', $event)
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import '../../styles/_variables';
.person-face-image-selectable {
  background-color: @color-tone-light;
  border-color: transparent;
  border-style: solid;
  border-width: 3px;
  padding: 1px;
  position: relative;
  &.selected {
    border-color: @color-accent;
  }
  &.selectable {
    cursor: pointer;
  }
  &.dimmed {
    opacity: 0.7;
  }
}
</style>
