<template>
  <div class="saas-plan-changing">
    <i class="far fa-spinner fa-spin"></i>
    <h4>We're making changes to your account, please check back later.</h4>
  </div>
</template>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.saas-plan-changing {
  .flex-box();
  align-items: center;
  flex-direction: column;
  justify-content: center;
  padding-top: 50px;
  i.fa-spinner {
    align-self: center;
    color: @color-accent;
    font-size: 35px;
  }
  h4 {
    color: @text-medium;
    font-size: 20px;
    font-weight: 400;
    margin: 10px;
    padding: 0;
  }
}
</style>
