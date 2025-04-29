<template>
  <div class="thumbnail-viewer-wrapper" v-show="thumbnails.length > 0">
    <div v-for="(thumbnail, $index) in thumbnails" :key="thumbnail.pageID" v-show="$index === currentPlayheadTime" class="image-wrapper" @click="showModal(thumbnail)">
      <img :src="thumbnail.path" :style="`max-height: ${docmaxheight}px;`">
      <i class="zoom-overlay far fa-search-plus fa-4x" aria-hidden="true"></i>
    </div>
    <div class="navigation">
      <i class="far fa-arrow-left arrow" :class="{'disabled': !showPrevious}" @click="previous()"></i>
      <div class="page-count">
        {{ currentDisplayIndex }} / {{ totalNumberThumbs }}
      </div>
      <i class="far fa-arrow-right arrow" :class="{'disabled': !showNext}" @click="next()"></i>
    </div>
    <el-dialog class="zoom-dlg" :class="{'pdf': isPdf}" :visible.sync="showImageModal" title="Preview" width="90%">
      <img v-if="!pdfPreview" class="dlg-image" :src="modalPath">
      <iframe width="100%" height="100%" v-else :src="modalPath"></iframe>
    </el-dialog>
  </div>
</template>

<script>
  import api from 'src/api'
  import VuexItemMixin from 'src/mixins/VuexItemMixin'
  import PlayheadMixin from 'src/mixins/PlayheadMixin';
  import {mapGetters} from 'vuex'
  import {ITEM} from 'src/store/storeModules'
  import {ITEM_ID} from 'src/store/modules/item/getterTypes'

  export default {
    name: 'document-thumbnails',

    mixins: [
      VuexItemMixin,
      PlayheadMixin
    ],

    props: {
      docmaxheight: {
        type: Number
      },
      thumbnails: {
        type: Array,
        default: () => []
      },
      isPdf: {
        type: Boolean,
        default: false
      }
    },

    data () {
      return {
        showImageModal: false,
        modalPath: null
      }
    },

    computed: {
      ...mapGetters(ITEM, {
        itemId: ITEM_ID
      }),
      rootId () {
        return _.get(this.item, 'root_id')
      },

      pdfPreview () {
        return this.isPdf && this.itemId === this.rootId
      },

      showNext () {
        return this.currentPlayheadTime < this.thumbnails.length
      },

      showPrevious () {
        return this.currentPlayheadTime > 0
      },

      currentDisplayIndex () {
        return this.currentPlayheadTime + 1
      },

      totalNumberThumbs () {
        return this.thumbnails.length
      }
    },

    methods: {
      showModal (thumbnail) {
        if (!this.pdfPreview) {
          this.modalPath = thumbnail.path
        }
        else {
          api.getItemURL(this.rootId)
            .then(url => {
              this.modalPath = url
            })
        }
        this.showImageModal = true
      },

      next () {
        this.currentPlayheadTime = Math.min(this.currentPlayheadTime + 1, this.thumbnails.length - 1)
      },

      previous () {
        this.currentPlayheadTime = Math.max(0, this.currentPlayheadTime - 1)
      }
    }
  }
</script>

<style lang='less'>
  .zoom-dlg.pdf {
    .el-dialog__body {
      //width: 75vw;
      height: 70vh;
    }
  }
</style>

<style lang='less' scoped>
  @import (reference) '~src/styles/_variables';

  .thumbnail-viewer-wrapper {
    display: flex;
    flex-direction: column;
    position: relative;

    .image-wrapper {
      position: relative;
      cursor: pointer;
      align-self: center;
      img {
        max-height: 400px;
        max-width: 100%;
        min-height: 300px;
      }

      .zoom-overlay {
        position: absolute;
        top: ~'calc(50% - 25px)';
        left: ~'calc(50% - 25px)';
        color: @grey;
        opacity: 0;
        transition: opacity 200ms linear;
      }

      &:hover {
        .zoom-overlay {
          opacity: .8;
        }
      }
    }

    .navigation {
      display: flex;
      flex-direction: row;
      justify-content: center;

      position: absolute;
      bottom: 20px;

      width: 100%;

      background-color: rgba(0, 0, 0, .5);

      padding-top:  2px;
      padding-bottom: 2px;

      .arrow {
        margin-left: 5px;
        margin-right: 5px;

        color: @color-base;
        cursor: pointer;

        &.disabled {
          color: rgba(255, 255, 255, 0.5)
        }
      }

      .page-count {
        background-color: @color-base;
        text-align: center;
        width: 100px;

        border-radius: 3px;
      }

    }

    .dlg-image {
      max-width: 100%;
    }
  }
</style>
