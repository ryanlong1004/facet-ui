<template>
  <div class="search-attribute-pill" @click.stop="handleClick">
    <i :class="icon"></i>
    {{ text }}
    <i class="far fa-times remove-pill" @click.stop="handleDelete" v-if="allowClose"></i>
  </div>
</template>

<script>
export default {
  name: 'search-attribute-pill',
  props: {
    icon: {
      type: String,
      required: true
    },
    attributeKey: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    allowClose: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    handleClick () {
      this.$emit('clicked')
    },
    handleDelete () {
      this.$emit('delete-pill', this.attributeKey)
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.search-attribute-pill {
  .flex-container();
  background-color: @color-accent;
  color: @color-base;
  font-family: @default-font-family-medium;
  font-size: 10px;
  font-weight: 900;
  margin-right: 3px;
  padding: 2px 6px;
  white-space: nowrap;

  i {
    display: inline-block;
    font-size: 10px;
    margin-right: 4.6px;

    &.fa-times {
      margin-left: 9.4px;
      margin-right: 0;

      &:hover {
        cursor: pointer;
      }
    }
  }
}
</style>
