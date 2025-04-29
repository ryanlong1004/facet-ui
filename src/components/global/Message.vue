<template>
  <p class="message">
    <i :class="icon"></i>
    <span>
      <slot></slot>
    </span>
  </p>
</template>

<script>
export default {
  name: 'message',

  props: {
    icon: {
      default: 'far fa-lightbulb',
      type: String
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

p {
  .align-items-center();
  .flex-box();
  margin-bottom: 5px;
  margin-right: 3px;

  i {
    color: @color-message;
    font-size: 12px;
    line-height: 1.17;
    width: 15px;

    &.fa-cloud {
      color: @color-accent-calm;
    }
  }

  span {
    display: inline-block;
    font-size: 12px;
    line-height: 1.33;
    margin-left: 5px;
  }
}

.form-footer {
  p {
    i,
    span {
      display: inline-block;
      font-size: 15px;
      line-height: 1.2;
    }

    span {
      margin-left: 8px;
      margin-top: 2px;
    }
  }
}
</style>
