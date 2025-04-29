<template>
  <div class="collections-button">
    <el-tooltip
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
      class="item"
      content="Collections"
      effect="dark"
      placement="bottom"
    >
      <div @click.prevent="toggleCollections" tabindex="-1">
        <i class="icon-collections"></i>
        <span>Collections</span>
      </div>
    </el-tooltip>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex'

import { RIGHT_PANEL } from 'src/store/storeModules'
import { OPEN_COLLECTIONS, TOGGLE_COLLECTIONS } from 'src/store/modules/rightPanel/mutationTypes'

export default {
  name: 'collections-button',

  props: {
    open: Boolean
  },

  methods: {
    ...mapMutations(RIGHT_PANEL, {
      toggleCollections: TOGGLE_COLLECTIONS,
      openCollections: OPEN_COLLECTIONS
    })
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.collections-button {
  width: 100px;

  > div {
    .flex-container-center();
    color: @text-darkest;
    cursor: pointer;
    font-weight: 900;
    height: 31px;

    i.icon-collections {
      font-size: 16px;
      margin-right: 2px;
    }

    span {
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 1.1px;
      text-transform: uppercase;
    }

    &:hover {
      color: @color-tone-medium;

      i.icon-collections {
        color: @color-tone-medium;
      }
    }
  }

  h5 {
    text-align: right;
  }
}
</style>
