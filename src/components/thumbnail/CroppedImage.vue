<template>
  <canvas ref="canvas" :class="{ rounded: rounded }"></canvas>
</template>

<script>
export default {
  name: 'cropped-image',
  props: {
    url: String,
    rect: Object,
    rounded: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      image: null
    }
  },
  mounted: function () {
    this.image = new window.Image()
    this.image.onload = this.imageLoaded
    this.image.src = this.url
  },
  methods: {
    imageLoaded: function (e) {
      let buffer = 25
      // const imgW = this.image.width
      // const imgH = this.image.height
      const bufferedRect = {
        width: this.rect.width + buffer * 2,
        height: this.rect.height + buffer * 2,
        left: this.rect.left - buffer,
        top: this.rect.top - buffer
      }
      const canvas = this.$refs['canvas']
      if (!canvas) {
        return
      }
      canvas.width = canvas.height = this.rect.width
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        this.image, // source image
        bufferedRect.left, // source left
        bufferedRect.top, // source top
        bufferedRect.width, // source width
        bufferedRect.height, // source height
        0, // canvas left
        0, // canvas top
        this.rect.width, // canvas width
        this.rect.height // canvas height
      )
    }
  }
}

</script>

<style lang="less" scoped>
canvas {
  width: 100%;
}
.rounded {
  border-radius: 100%;
}
</style>
