<template>
  <section class="right-panel" :class="{'open': open}">
    <collections-panel v-show="panel === 'collections'" :open="open"></collections-panel>
    <comments-panel v-show="panel === 'comments'" :open="open"></comments-panel>
    <i class="far fa-times close-comments-btn" @click="close()"></i>
  </section>
</template>

<script>
import CollectionsPanel from 'src/components/collections/CollectionsPanel'
import CommentsPanel from 'src/components/item/CommentsPanel.vue'
import Session from 'src/session.js'
import { RIGHT_PANEL } from 'src/store/storeModules'
import { OPEN, PANEL } from 'src/store/modules/rightPanel/getterTypes'
import { CLOSE } from 'src/store/modules/rightPanel/mutationTypes'
import { mapGetters, mapMutations } from 'vuex'

export default {
  name: 'right-panel',

  components: {
    CollectionsPanel,
    CommentsPanel
  },

  computed: {
    ...mapGetters(RIGHT_PANEL, {
      open: OPEN,
      panel: PANEL
    })
  },

  methods: {
    ...mapMutations(RIGHT_PANEL, {
      close: CLOSE
    })
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';

.right-panel {
  display: none;
  margin-left: auto;
  background: @color-darker;

  // relative position for close button
  position: relative;

  &.open {
    display: block;
    width: 400px;
  }

  .close-comments-btn {
    background-color: transparent;
    border-radius: 50%;
    color: @text-light;
    cursor: pointer;
    font-size: 16px;
    height: 25px;
    line-height: 25px;
    position: absolute;
    right: 10px;
    text-align: center;
    top: 10px;
    width: 25px;

    &:hover {
      color: @color-base;
    }
  }
}
</style>
