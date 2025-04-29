<template>
  <header class="tools-header">
    <div class="app-fluid-container">
      <div class="app-fluid-container__section--middle">
        <slot name="middle"></slot>
      </div>
      <div v-if="!collectionsOpen" class="app-fluid-container__section--right">
        <slot name="right"></slot>
      </div>
    </div>
  </header>
</template>

<script>
import { mapGetters } from 'vuex'
import { COLLECTIONS_OPEN } from 'src/store/modules/rightPanel/getterTypes'
import { RIGHT_PANEL } from 'src/store/storeModules'

export default {
  name: 'tools-header',

  computed: {
    ...mapGetters(RIGHT_PANEL, {
      collectionsOpen: COLLECTIONS_OPEN
    })
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

header {
  &.tools-header {
    .flex-container-center();
    background: @background-grey;
    border-bottom: 1px solid @line-grey;
    color: @color-tone;
    font-size: 10px;
    font-weight: 900;
    height: 44px;
    letter-spacing: 1.1px;
    margin: 0;
    padding: 0;
    text-transform: uppercase;

    .app-fluid-container {
      border-top: 0;
      padding-left: 0;

      .app-fluid-container__section--middle {
        .flex-container-between();
        .align-items-center();
        background-color: @background-grey;
        flex: 1 1 auto;
        max-height: 45px;

        h5 {
          font-size: 10px;
          font-weight: 900;
          padding: 0 15px;
          margin: 0;
        }

        .user-options {
          .flex-container-end();
          margin-left: auto;

          button.el-button--mini.save-search {
            font-size: 10px;
            font-weight: 900;
            line-height: 1;
            margin-left: 10px;
            padding: 0;
          }
        }
      }

      .app-fluid-container__section--right {
        .flex-container-end();
        .align-items-center();
        flex: 0 0 210px;
        max-height: 45px;
      }
    }
  }
}
</style>
