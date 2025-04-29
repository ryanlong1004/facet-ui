<template>
  <div class="not-found">
    <h1>Whoops. Something went haywire.</h1>
    <div>
      <img src="/static/img/404.png" width="800">
    </div>
  </div>
</template>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';

.not-found {
  text-align: center;

  > h1 {
    color: @text-dark;
    font-size: 35px;
    font-weight: 300;
  }
}
</style>
