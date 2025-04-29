<template>
  <div class="bottom-drawer" :class="{'open': open}">
    <div class="title" @click.prevent.stop="toggleOpen()">
      <span>
        RELATED FILES
        <i
          v-if="open"
          key="related-files-down"
          class="fas fa-angle-down"
          aria-hidden="true"
        ></i>
        <i
          v-else
          key="related-files-up"
          class="fas fa-angle-up"
          aria-hidden="true"
        ></i>
      </span>
    </div>

    <related-items></related-items>
  </div>
</template>

<script>
  import RelatedItems from '../related-items/RelatedItems'

  export default {
    name: 'bottom-drawer',
    components: {
      RelatedItems
    },
    props: {
      toggle: Boolean,
      close: Boolean
    },
    data: function () {
      return {
        open: false
      }
    },
    watch: {
      'close' (newVal, oldVal) {
        this.open = false
      },
      'toggle' (newVal, oldVal) {
        this.open = !this.open
      }
    },
    methods: {
      toggleOpen () {
        this.open = !this.open
      }
    }
  }
</script>

<style lang="less" scoped>
  @import (reference) '../../styles/_variables';
  @import (reference) '../../styles/_mixins';

  .bottom-drawer {
    background: @translucent-black;
    bottom: -210px;
    position: fixed;
    transition: all .25s;
    width: 100%;
    z-index: 2000;

    &.open {
      bottom: 0;
      display: block;
      left: 180px; //width of sidebar navigation
      width: ~'calc(100% - 180px)';
    }

    .title {
      .flex-container-center();
      background-color: @grey;
      color: @color-base;
      cursor: pointer;
      font-size: 14px;
      height: 33px;
      position: relative;
      text-transform: uppercase;
      width: 100%;

      span {
        .flex-container-center();

        i {
          margin-left: 10px;
        }
      }
    }
  }
</style>
