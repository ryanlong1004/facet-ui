<template>
  <div class="person-typeahead-entry">
    <div class="face-image" :style="{ 'background-image': `url(${faceImageUrl})` }"></div>
    <p class="person-name">{{ personName }}</p>
  </div>
</template>

<script>
export default {
  name: 'person-typeahead-entry',
  props: {
    faceImageUrl: String,
    personName: String
  }
}
</script>

<style lang="less">
.person-typeahead-entry {
  align-items: center;
  display: flex;
  width: 250px;
  .face-image {
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    border-radius: 6px;
    height: 30px;
    margin-right: 10px;
    min-height: 30px;
    min-width: 30px;
    width: 30px;
  }
  .person-name {
    font-size: 14px;
    font-weight: 400;
    margin: 0;
    padding: 0;
  }
}
</style>
