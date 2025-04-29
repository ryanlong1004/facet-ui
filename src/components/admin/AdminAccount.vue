<template>
  <div class="content">
    <router-view name="content"></router-view>
  </div>
</template>

<script>
export default {
  name: 'admin-account'
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    .content-account {
      margin-top: 25px;
      max-width: 877.2px;
    }
  }
}
</style>
