<template>
  <div class="wrapper">


    <div class="menu-bar">
      Name Pencil Find All [active selected] select all|unselect all
    </div>
    <div class="face-list">
      <div class="face" v-for="(face, index) in faces" :key="face.face_id" :style="{
        'margin-bottom': faceMargin,
        'margin-right': (index % clearMarginRightNth) === (clearMarginRightNth - 1) ? '5px' : faceMargin
      }">
        <div class="remove-face-button" v-if="removable" @click="handleRemove(face)">
          <i class="far fa-times">X</i>
        </div>
        <person-face-image :image-url="face.imageUrl" :border-radius="faceBorderRadius" :height="faceHeight"
          :width="faceWidth" />
      </div>
    </div>
  </div>
</template>

<script>
import PersonFaceImage from './PersonFaceImage.vue'

export default {
  name: 'face-list',
  props: {
    faces: {
      type: Array,
      required: true
    },
    removable: {
      type: Boolean,
      default: false
    },
    faceBorderRadius: {
      type: String,
      default: '0px'
    },
    faceHeight: {
      type: String,
      default: '100px'
    },
    faceWidth: {
      type: String,
      default: '100px'
    },
    faceMargin: {
      type: String,
      default: '0px'
    },
    clearMarginRightNth: {
      type: Number,
      default: 3
    }
  },
  components: {
    PersonFaceImage
  },
  methods: {
    handleRemove(face) {
      if (this.removable) {
        this.$emit('on-remove', face.face_id)
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import '../../styles/_variables.less';
@import '../../styles/_mixins.less';

.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  height: 100%;
}

.face-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  background-color: blueviolet;
  min-width: 60vw;
  gap: 16px;

  .menu-bar {}

  .face-list-item {
    display: flex;
    flex-direction: row;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &.selected {
      border: 2px solid blue;

      img {
        filter: brightness(0.8);
      }

      &::after,
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 255, 0.5);
        border-radius: 8px;
      }
    }
  }
}
</style>
