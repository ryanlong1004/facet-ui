<template>
  <div
    ref="container"
    class="thumbnail-container"
    :class="{
      single: frameCount === 0,
      sprite: frameCount > 0,
      waveform: isWaveform
    }"
    v-on:mousemove="onMouseMove"
  >
    <!-- single image (will be responsive) -->
    <span
      v-if="frameCount === 0 && thumb"
      :style="{
        'background-image': 'url(' + url + ')',
        'background-color': bgColor
      }"
    ></span>
    <!-- sprite image (drag to scrub time) -->
    <img
      v-if="frameCount > 0 && thumb"
      :src="url"
      ref="thumb-img"
      class="sprite"
    >
    <!-- callback image -->
    <img
      v-if="!thumb"
      src="/static/img/thumbnail/default.svg"
      class="single"
    >
  </div>
</template>

<script>
import _ from 'lodash'

const defaultThumbs = {
  application: true,
  audio: true,
  default: true,
  image: true,
  inode: true,
  text: true,
  video: true
}
const MAX_THUMB_WIDTH = 270

export default {
  name: 'thumbnail-image',
  props: {
    thumb: Object,
    id: String,
    bgColor: {
      type: String,
      default: 'transparent'
    },
    live: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      frameIndex: 0
    }
  },
  mounted: function () {
    if (this.frameCount > 0) {
      this.applyListeners()
      this.updateSizing()
      this.$refs['thumb-img'].onload = this.updateSizing.bind(this)
    }
  },
  beforeDestroy: function () {
    this.removeListeners()
  },
  methods: {
    applyListeners: function () {
      window.addEventListener('resize', this.onWindowResize)
    },
    removeListeners: function () {
      window.removeEventListener('resize', this.onWindowResize)
    },
    onWindowResize: function (e) {
      this.updateSizing()
    },
    onMouseMove: function (e) {
      if (this.live && this.frameCount > 0) {
        e.preventUpdate = true
        const bounds = this.$refs['container'].getBoundingClientRect()
        const x = Math.max(0, e.pageX - bounds.left)
        this.frameIndex = Math.floor(x / (bounds.width / this.frameCount))
        this.updateToFrameIndex(bounds.width)
      }
    },
    updateSizing: function () {
      if (_.get(this.$refs, 'container')) {
        const w = this.$refs['container'].getBoundingClientRect().width
        if (w > 0 && !!this.thumb) {
          const ratio = this.thumb.height / this.thumb.width
          const newHeight = w * ratio
          if (this.frameCount > 0) {
            this.$refs['thumb-img'].style.height = newHeight + 'px'
            this.updateToFrameIndex(w)
          }
        }
      }
    },
    updateToFrameIndex: function (w) {
      if (this.frameCount > 0) {
        if (this.frameIndex === -1) {
          this.frameIndex = 0
        }
        w = Math.min(w, MAX_THUMB_WIDTH)
        this.$refs['thumb-img'].style.marginLeft = (0 - w * this.frameIndex) + 'px'
      }
    }
  },
  computed: {
    isWaveform () {
      return (this.url && this.url.indexOf('waveform.png') === this.url.length - 12)
    },
    frameCount: function () {
      return _.get(this, 'thumb.frames.count', 0)
    },
    url: function () {
      if (!this.thumb) {
        return '/static/img/thumbnail/default.svg'
      }
      // in some cases an item may have a path but its an incomplete url denoted by the ending "/"
      if (typeof this.thumb === 'string') {
        return 'files/' + this.id + '/' + this.thumb
      } else if (this.thumb.path && !this.thumb.path.endsWith('/')) {
        if (this.thumb.path.indexOf('file') > -1) {
          return this.thumb.path
        }
        return 'files/' + this.id + '/' + this.thumb.path
      } else {
        if (!this.thumb.type) {
          return '/static/img/thumbnail/default.svg'
        } else if (defaultThumbs[this.thumb.type]) {
          return '/static/img/thumbnail/' + this.thumb.type + '.svg'
        } else if (defaultThumbs[this.thumb.type.split('/')[0]]) {
          return '/static/img/thumbnail/' + this.thumb.type.split('/')[0] + '.svg'
        }
        return '/static/img/thumbnail/default.svg'
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import '../../styles/_variables';
@import '../../styles/_mixins';

  .thumbnail-container {
    .align-items-center();
    .flex-box();
    .flex-flow(row, nowrap);
    .size(100%, 100%);
    background-color: @color-tone-lighter;
    position: relative;
    overflow: hidden;

    &.single {
      img {
        .size(100%, 100%);
        object-fit: contain;
      }
    }

    > span {
      .size(100%, 100%);
      background-size: contain;
      background-position: 50%;
      background-repeat: no-repeat;
      position: absolute;
    }
  }

  .responsive-item-grid__item {
    .thumbnail-container {
      min-height: 206px;
    }
  }
</style>
