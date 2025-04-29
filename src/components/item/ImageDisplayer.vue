<template>
  <div class="image-displayer" :class="{ 'has-error': error }">
    <div class="image" v-loading="rotateDisable" :style="{ backgroundImage: 'url(' + thumbnailUrl + ')' }" @click="openDialog">
      <i class="zoom-overlay far fa-search-plus fa-4x" aria-hidden="true"></i>
    </div>
    <el-dialog
      v-if="!error && image"
      :center="true"
      :title="name"
      top="15vh"
      :visible.sync="dialogEnlargedImageVisible"
      width="90%">
      <div class="big-image" :style="{'background-image': `url(${bigImgUrl})`}"></div>
    </el-dialog>
    <div class="error" v-if="error">
      <i class="far fa-exclamation-triangle" aria-hidden="true"></i>
      There was an error loading this image
      <div class="url">
        {{ thumbnailUrl }}
      </div>
    </div>
  </div>
</template>

<script>
  import shortid from 'shortid'

  import { mapGetters } from 'vuex'
  import VuexItemMixin from '../../mixins/VuexItemMixin'
  import * as storeModules from 'src/store/storeModules'
  import { THUMBNAIL_ROTATE_DISABLE, THUMBNAIL_URL } from 'src/store/modules/item/thumbnail/getters'
  import * as mutationTypes from 'src/store/modules/item/mutationTypes'
  import { THUMBNAIL } from 'src/store/modules/item/getterTypes'

  export default {
    name: 'image-displayer',
    mixins: [
      VuexItemMixin
    ],
    data () {
      return {
        dialogEnlargedImageVisible: false,
        image: null,
        imageHeight: 0,
        imageWidth: 0,
        loading: true,
        error: false,
        url: ''
      }
    },
    mounted: function () {
      this.$store.commit(`${storeModules.THUMBNAIL}/${THUMBNAIL_URL}`, `${this.thumbnail}?key=${shortid.generate()}`)
      /*
        Programatically create an image so we can calculate the size of the
        dialog before we open it, along with accounting for aspect ratio.
      */
      this.image = new window.Image()
      this.image.src = this.thumbnailUrl
      this.image.onload = this.onImageLoad
      this.image.onerror = this.onImageLoadError
    },
    computed: {
      bigImgUrl () {
        return this.thumbnailUrl
      },
      ...mapGetters(storeModules.THUMBNAIL, {
        rotateDisable: THUMBNAIL_ROTATE_DISABLE,
        thumbnailUrl: THUMBNAIL_URL
      }),
      ...mapGetters(storeModules.ITEM, {
        thumbnail: THUMBNAIL
      })
    },
    methods: {
      onImageLoad: function () {
        this.loading = false
        this.url = this.thumbnailUrl
      },
      onImageLoadError: function () {
        this.loading = false
        this.error = true
        this.url = '/static/img/thumbnail/default.svg'
      },
      openDialog: function () {
        this.imageWidth = this.image.width
        this.imageHeight = this.image.height
        this.dialogEnlargedImageVisible = true
      }
    }
  }
</script>

<style lang="less">
@import (reference) '~src/styles/_mixins';

.image-displayer {
  .el-dialog__wrapper {
    height: 100%;
    overflow: hidden;
  }

  .el-dialog {
    .el-dialog__header {
      .el-dialog__title {
        text-transform: none;
      }
    }

    .el-dialog__body {
      height: 70vh;
      padding: 0;
      .big-image {
        // subtract room for the modal header
        height: 100%;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
      }
    }
  }
}
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.image-displayer {
  background-color: @heavy-button-color;
  position: relative;

  .image {
    .zoom-overlay {
      position: absolute;
      top: ~'calc(50% - 25px)';
      left: ~'calc(50% - 25px)';
      color: @grey;
      opacity: 0;
      transition: opacity 200ms linear;
    }

    &:hover {
      cursor: pointer;
      .zoom-overlay {
        opacity: .8;
      }
    }
  }
}
.image {
  position: relative;
  width: 100%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
.error {
  color: @text-dark;
  text-align: center;
  display: block;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translate(-50%, 0);
  width: 100%;
  text-overflow: ellipsis;
  .url {
    padding: 10px;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  i {
    color: @primary-button-color;
  }
}
</style>
