<template>
  <div class="person-face-name" :class="{ 'dark-mode': darkMode }" @click.stop="handleClick">
    <person-face-image
      :image-url="faceImageUrl"
      border-radius="4px"
      height="50px"
      width="50px"/>
    <div>
      {{ personName }}
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

import PersonFaceImage from './PersonFaceImage.vue'

export default {
  name: 'person-face-name',
  props: {
    personName: {
      type: String,
      required: true
    },
    faceImageUrl: {
      type: String,
      required: true
    },
    // is this on top of a dark background?
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  components: {
    PersonFaceImage
  },
  methods: {
    handleClick () {
      this.$emit('click')
    }
  }
}
</script>

<style lang="less">
@import '../../styles/_variables.less';
@import '../../styles/_mixins.less';
.person-face-name {
  .flex-container();
  color: @color-primary;
  font-size: 11px;
  font-weight: 700;
  .person-face-image {
    .flex(0, 0, 50px);
    margin-right: 10px;
  }
  &.dark-mode {
    color: @color-base;
  }
}
</style>
