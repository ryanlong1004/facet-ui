<template>
  <div class="content content-activity">
    <router-view name="content"></router-view>
  </div>
</template>

<script>
export default {
  name: 'admin-activity'
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    &.content-activity {
      h2 {
        font-size: 19px;
        font-weight: 300;
        line-height: 1.21;
        margin-bottom: 0;
      }
    }
  }
}
</style>
