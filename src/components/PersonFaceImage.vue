<template>
  <div class="person-face-image bg-center bg-no-repeat bg-cover" :style="{
    backgroundImage: `url(${imageUrl})`,
    borderRadius: borderRadius,
    height: height,
    width: width
  }" :alt="`Face of person`"></div>
</template>

<script>
export default {
  name: 'PersonFaceImage',
  props: {
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
      default: '100%'
    },
    width: {
      type: String,
      default: '100%'
    }
  }
}
</script>

<style scoped>
.person-face-image {
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
