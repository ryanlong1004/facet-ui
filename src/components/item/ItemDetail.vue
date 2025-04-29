<template>
  <div id="item-detail">
    <div class="header">
      <div class="search-results__header-btn-wrapper" ref="filename">
        <button
          v-if="showBackButton"
          class="search-results__header-btn search-results__header-btn--save-search"
          @click="backToPreviousPage()"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <template v-if="editingAssetTitle">
          <el-input
            class="asset-title-input"
            ref="asset-title-input"
            v-model="newAssetTitle"
            size="mini"
            @keyup.enter.native.stop="submitAssetTitle"
            @keyup.esc.native.stop="cancelAssetTitle"
            ></el-input>
        </template>
        <div class="header-content" v-else>
          <div v-popover:copyStowUrlContent class="filename-info">
            <span class="file-info__filename ellipsis">
              <el-tooltip
                v-if="item.id !== item.root_id"
                content="This item is part of an archive"
                placement="top"
                effect="dark"><i class="fas fa-file-archive archive-notification-icon"></i></el-tooltip>
              {{ itemName }}
            </span>
            <i class="fas fa-question-circle"></i>
            <i class="fas fa-pencil" @click.stop="setEditingAssetTitle(true)" v-if="$hasScope(SCOPES.EDIT_ITEM)"></i>

            <el-popover
              ref="copyStowUrlContent"
              placement="bottom-start"
              popper-class="copy-stow-url-popper"
              width="400"
              trigger="click"
            >
              <h4>File Name</h4>
              <p>{{ itemNameRaw }}</p>

              <template v-if="item.stow_name">
                <h4>Stow Name</h4>
                <p>{{ item.stow_name }}</p>
              </template>

              <template v-if="item.gm_asset_title">
                <h4>Asset Title (Custom)</h4>
                <p>{{ item.gm_asset_title }}</p>
              </template>

              <template v-if="item.stow_url">
                <h4>Stow URL</h4>
                <p>{{ item.stow_url }}</p>

                <el-button
                  v-if="!isLoadnStore"
                  v-clipboard="item.stow_url"
                  size="mini"
                  @success="setLinkCopied()"
                  @mouseover="showCopyTooltip = true"
                  @mouseout="linkWasCopied ? showCopyTooltip = true : showCopyTooltip = false"
                  type="primary"
                >
                  <i class="far fa-copy"></i>
                  {{ copyLink }}
                </el-button>
              </template>
            </el-popover>
          </div>
        </div>
      </div>

      <div class="item-actions">
        <item-info-panel></item-info-panel>
      </div>
    </div>
    <div v-if="!session.loading && item" class="item-info"
      :class="showRelatedItems ? 'item-info-bottom-drawer' : ''"
    >
      <div v-if="erroredState" class="errored-state-messaging">
        <div v-if="!hasBeenHarvested">
          We're working on harvesting this file, please check back later <i class="far fa-smile" aria-hidden="true"></i>
        </div>
        <drm-detail v-else-if="hasDrm"></drm-detail>
        <div v-else-if="isEncryptedPDF">
          This PDF appears to be encrypted, we were unable to analyze it.
        </div>
        <div v-else-if="isPasswordProtectedPDF">
          This PDF appears to have password protection, we were unable to analyze it.
        </div>
        <div v-else-if="isUnknownType">
          We couldn't find any content in this file because it contains zero bytes.
        </div>
        <div v-else-if="error">
          This item can not be found <i class="far fa-frown" aria-hidden="true"></i>
        </div>
      </div>

      <video-detail v-else-if="isVideo"></video-detail>

      <audio-detail v-else-if="isAudio"></audio-detail>

      <image-detail v-else-if="isImage" class="image-detail-wrapper"></image-detail>

      <multi-page-document v-else-if="isDocument"></multi-page-document>

      <caption-detail v-else-if="isCaption"></caption-detail>

      <text-document-detail v-else></text-document-detail>

      <el-dialog
        class="technical-metadata-dlg"
        :visible="showTechnicalMetadata"
        width="90%"
        title="Metadata"
        :before-close="closeTechnicalMetadata"
      >
        <technical-metadata></technical-metadata>
      </el-dialog>
    </div>
    <div class="drawer-buffer"></div>
    <bottom-drawer v-show="showRelatedItems" :close="toggleCloseRelatedItems"></bottom-drawer>
  </div>
</template>

<script>
  import {
    mapActions,
    mapGetters,
    mapMutations
  } from 'vuex'
  import { getFilenameFromItemData, getName } from 'src/item-helper'
  import VideoDetail from './VideoDetail'
  import AudioDetail from './AudioDetail'
  import ImageDetail from './ImageDetail'
  import MultiPageDocument from './MultiPageDocument'
  import TextDocumentDetail from './TextDocumentDetail'
  import TechnicalMetadata from './TechnicalMetadata'
  import CaptionDetail from './CaptionDetail.vue'
  import ItemInfoPanel from 'src/components/item/ItemInfoPanel.vue'
  import CollectionsButton from 'src/components/collections/CollectionsButton'

  import _ from 'lodash'
  import BottomDrawer from './BottomDrawer'
  import session from 'src/session'

  import {
    COLLECTIONS,
    ITEM,
    ITEM_UI_STATE,
    RELATED_ITEMS,
    RIGHT_PANEL
  } from 'src/store/storeModules'
  import { COLLECTIONS_OPEN } from 'src/store/modules/rightPanel/getterTypes'
  import { GET_COLLECTION_LAST_OPEN_SEARCH } from 'src/store/modules/collections/getters'
  import { SEARCH_WHILE_VIEWING_COLLECTIONS } from 'src/store/modules/collections/mutations'
  import * as itemActions from 'src/store/modules/item/actionTypes'
  import VuexItemMixin from 'src/mixins/VuexItemMixin'

  import { GET_SHOW_TECHNICAL_METADATA } from 'src/store/modules/item/ui-state/getters'
  import { SET_SHOW_TECHNICAL_METADATA } from 'src/store/modules/item/ui-state/mutations'
  import {
    HAS_BEEN_HARVESTED,
    HAS_DRM,
    ITEM_TYPE,
    IS_ENCRYPTED_PDF,
    IS_PASSWORD_PROTECTED_PDF,
    ITEM_ID
  } from 'src/store/modules/item/getterTypes'
  import { PATH_404 } from 'src/components/404/routes'
  import DrmDetail from 'src/components/item/DrmDetail'
  import { FETCH_RELATED_ITEMS } from 'src/store/modules/item/related-items/actions'
  import { GET_TOTAL_HITS } from 'src/store/modules/item/related-items/getters'
  import { SCROLL_TO_ROUTE } from 'src/store/modules/item/related-items/mutations'

  export default {
    name: 'item-detail',

    mixins: [VuexItemMixin],

    data () {
      return {
        session: session,
        error: false,
        linkWasCopied: false,
        previousRoute: null,
        toggleCloseRelatedItems: false,
        showCopyTooltip: false,
        editingAssetTitle: false,
        newAssetTitle: ''
      }
    },

    beforeRouteEnter (to, from, next) {
      next(vm => {
        vm.previousRoute = from
      })
    },

    components: {
      CaptionDetail,
      DrmDetail,
      MultiPageDocument,
      BottomDrawer,
      VideoDetail,
      AudioDetail,
      ImageDetail,
      TextDocumentDetail,
      TechnicalMetadata,
      ItemInfoPanel,
      CollectionsButton
    },

    async beforeMount () {
      await this.loadItemDetails(this.$route.params.id)
    },

    mounted () {
      this.$watch('$route.params', (newVal, oldVal) => {
        if (newVal.id !== oldVal.id) {
          this.error = false
          this.loadItemDetails(newVal.id)
        }
      })
    },

    beforeDestroy () {
      this.$store.dispatch(`${ITEM}/${itemActions.CLEAR_ALL_ITEM_DATA}`)
    },

    methods: {
      ...mapActions(ITEM, {
        doSetAssetTitle: itemActions.SET_ASSET_TITLE
      }),
      ...mapActions(RELATED_ITEMS, {
        fetchRelatedItems: FETCH_RELATED_ITEMS
      }),

      backToPreviousPage () {
        if (this.isPreviousRoute) {
          this.$router.back()
        } else {
          if (this.$route.query.from === 'social-trends') {
            this.$router.back()
          } else {
            let searchKey = this.$route.query.key
            if (searchKey) {
              let to = {
                name: this.CONSTANTS.ROUTES.SEARCH.NAME,
                query: {'key': searchKey}
              }
              this.$router.push(to)
            }
          }
        }
      },

      closeTechnicalMetadata () {
        this.$store.commit(`${ITEM_UI_STATE}/${SET_SHOW_TECHNICAL_METADATA}`, false)
      },

      async loadItemDetails (itemId) {
        let searchKey = null

        if (this.$route.query.key) {
          searchKey = this.$route.query.key

          this.$store.commit(`${COLLECTIONS}/${SEARCH_WHILE_VIEWING_COLLECTIONS}`, searchKey)

        } else if (this.$store.getters[`${RIGHT_PANEL}/${COLLECTIONS_OPEN}`]) {
          searchKey = this.$store.getters[`${COLLECTIONS}/${GET_COLLECTION_LAST_OPEN_SEARCH}`]
        }

        this.error = false
        this.session.loading = true

        try {
          const item = await this.$store.dispatch(`${ITEM}/${itemActions.LOAD_ITEM}`, {'itemId': itemId})

          if (!_.get(item, 'error')) {
            this.fetchRelatedItems({
              searchKey: searchKey,
              itemPage: this.$route.query.itemPage,
              currentItemId: itemId,
              loadOptions: {isItemLoad: true},
              scrollDirection: SCROLL_TO_ROUTE
            })
          } else {
            this.error = true
          }
        }
        catch (err) {
          console.error('error loading item details', err)
          this.error = true
          if (err.status === 404) {
            this.$router.replace({ path: PATH_404 })
          }
        }
        finally {
          this.session.loading = false
        }
      },

      setLinkCopied () {
        this.linkWasCopied = true

        setTimeout(() => {
          this.showCopyTooltip = false

          setTimeout(() => {
            this.linkWasCopied = false
          }, 300)
        }, 3000)
      },

      setEditingAssetTitle (editing = false) {
        this.editingAssetTitle = editing
        if (editing) {
          this.newAssetTitle = this.item.gm_asset_title
          this.$nextTick(() => {
            const input = this.$refs['asset-title-input']
            if (input) {
              input.focus()
            }
          })
        }
      },

      async submitAssetTitle () {
        try {
          await this.doSetAssetTitle(this.newAssetTitle)
          this.cancelAssetTitle()
        } catch (err) {
          this.$notify({
            type: 'error',
            title: 'Error',
            message: 'Unable to set custom asset title, please try again'
          })
        }
      },

      cancelAssetTitle () {
        this.setEditingAssetTitle(false)
      }
    },

    computed: {
      ...mapGetters(ITEM_UI_STATE, {
        showTechnicalMetadata: GET_SHOW_TECHNICAL_METADATA
      }),
      ...mapGetters(ITEM, {
        itemId: ITEM_ID,
        itemType: ITEM_TYPE,
        hasDrm: HAS_DRM,
        hasBeenHarvested: HAS_BEEN_HARVESTED,
        isEncryptedPDF: IS_ENCRYPTED_PDF,
        isPasswordProtectedPDF: IS_PASSWORD_PROTECTED_PDF
      }),
      ...mapGetters(RELATED_ITEMS, {
        totalHits: GET_TOTAL_HITS
      }),
      ...mapGetters(RIGHT_PANEL, {
        collectionsOpen: COLLECTIONS_OPEN
      }),
      copyLink () {
        return this.linkWasCopied ? 'STOW Url Copied' : 'Copy STOW Url'
      },
      itemName () {
        return getFilenameFromItemData(this.item)
      },
      itemNameRaw () {
        return getName(this.item.name)
      },

      isLoadnStore () {
        return _.get(this, 'item.data.location_kind', '') === this.CONSTANTS.LOCATION_KIND.LOADNSTORE.id
      },

      isPreviousRoute () {
        const previousRouteName = _.get(this.previousRoute, 'name')
        return (previousRouteName !== null) && ((previousRouteName === 'loadnstore') || (previousRouteName === 'collections-collection') || (previousRouteName === 'categories'))
      },

      showBackButton () {
        return this.$route.query.key || this.isPreviousRoute
      },

      showRelatedItems () {
        return this.totalHits > 0
      },

      erroredState () {
        return !this.hasBeenHarvested || this.hasDrm || this.isEncryptedPDF || this.isPasswordProtectedPDF || this.isUnkownType
      }
    }
  }
</script>

<style lang="less" scoped>
  @import (reference) '~src/styles/_variables';
  @import (reference) '~src/styles/_mixins';

  #item-detail {
    height: 100%;
    position: relative;

    .header {
      .flex-container-between();
      background-color: @background-grey;
      border-bottom: 1px solid @box-border-grey;
      height: 45px;
      padding: 0 18px;

      .search-results__header-btn-wrapper {
        .flex-box();
        .align-items-center();

        &:active {
          background-color: unset;
        }

        button {
          background-color: transparent;
          border: 0 none;
          color: @color-primary;
          cursor: pointer;
          height: 100%;
          margin-right: 14px;
          margin-top: -2px;
          padding: 0;

          &:active,
          &:focus {
            outline: none;
          }

          i {
            font-size: 12px;

            &:hover {
              color: @color-accent;
            }
          }
        }

        .header-content {
          width: calc(~'100vw - 630px');

          .filename-info {
            width: 100%;
          }

          span,
          i {
            color: @color-primary;
            font-size: 12px;

            &:hover {
              cursor: pointer;
            }
          }

          span {
            max-width: 96%;
            width: auto;
          }

          i {
            position: relative;
            top: -6px;

            &:hover {
              color: @color-accent;
            }
          }
          i.archive-notification-icon {
            margin-right: 4px;
            top: 0;
          }
        }
      }

      .item-actions {
        .flex-container-end();
        margin-left: auto;
        max-width: 300px;
        min-width: 300px;
      }
    }

    .item-info {
      height: calc(~'100% - 50px');
    }

    .item-info.item-info-bottom-drawer {
      height: calc(~'100% - 50px - 33px'); // 33px is the height of the bottom drawer
    }
  }

  .errored-state-messaging {
    .flex-container-center();
    height: 100%;

    i {
      display: inline-block;
      margin-left: 8px;
      margin-top: -2px;
    }
  }

  .el-dialog__wrapper {
    z-index: 10000 !important;
  }
</style>

<style lang="less">

  #vertical-timelines > .el-tabs,
  #vertical-timelines > .el-tabs > .el-tabs__content > .el-tab-pane,
  #vertical-timelines > .el-tabs > .el-tabs__content > .el-tab-pane > div {
    height: 100%;
  }

  #vertical-timelines > .el-tabs > .el-tabs__content > .el-tab-pane:not(#captions, #speech-to-text),
  #vertical-timelines > .el-tabs > .el-tabs__content > .el-tab-pane > div:not(.captions-timeline) {
    overflow-y: auto;
  }

  #vertical-timelines > .el-tabs > .el-tabs__content {
    height: calc(100% - 40px);
  }

  .vertical-timeline > .el-tabs,
  .vertical-timeline > .el-tabs > .el-tabs__content > .el-tab-pane,
  .vertical-timeline > .el-tabs > .el-tabs__content > .el-tab-pane > div {
    height: 100%;
    overflow-y: auto;
  }

  .vertical-timeline > .el-tabs > .el-tabs__content {
    height: calc(100% - 40px);
  }

  .vertical-timeline > .el-tabs > .el-tabs__content > .el-tab-pane > div {
    overflow-y: auto;
  }

  .vertical-timelines {
    .el-tabs {
      height: 100%;
      overflow: hidden;
      position: relative;
      .el-tabs__content {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        top: 40px;
        .el-tab-pane {
          height: 100%;
          overflow: hidden;
          .vertical-timeline {
            height: 100%;
            overflow: hidden;
          }
        }
      }
    }
  }

</style>

<style lang="less">
  @import (reference) '~src/styles/_variables';

  .technical-metadata-dlg {
    .el-dialog {
      max-width: 900px;
      min-width: 600px;
    }
  }

  .el-popper[x-placement^=bottom],
  .el-popover.el-popper {
    &.copy-stow-url-popper {
      box-shadow: 0 3px 6px;
      margin-top: 13px;
      padding: 20px 11px 14.5px;

      h4 {
        font-weight: 900;
        letter-spacing: 0.8px;
        line-height: 1.1;
        margin: 0 0 3px;
        text-transform: uppercase;

        + p {
          font-size: 12px;
          line-height: 1.17;
          margin: 0 0 16px;
          word-break: break-all;
        }
      }

      .el-button.el-button--primary {
        font-size: 11px;
        font-weight: 500;
        line-height: 1.17;
        letter-spacing: 0.96px;
        margin-top: 4px;

        span {
          i {
            font-size: 14px;
            margin-right: 6px;
          }
        }
      }

      .popper__arrow {
        display: block;
        left: 5px !important;
      }
    }
  }

  .timeline-layout {
    line-height: 1.5;
    font-size: 14px;

    .timeline-loading {
      min-height: 100px;
      .el-loading-mask {
        background-color: transparent;
      }
    }
    .vertical-timeline {
      padding-bottom: 0px;
    }
    .timeline-items {
      list-style: none;
      padding: 0;
      margin: 0;
      &.hidden {
        position: fixed;
        top: 0;
        left: 110%;
      }
      .timeline-item {
        padding-top: 5px;
        padding-bottom: 5px;
        border-bottom: solid 1px @line-grey;
        border-left: solid 2px transparent;

        color: @text-dark;

        &.buffer {
          padding: 0;
          background-color: transparent;
          margin-bottom: 0;
          box-shadow: none;
        }
        .item-details {
          line-height: 1.1rem;
          opacity: .6;
          position: relative;
          left: 95px;
          width: ~'calc(100% - 100px)';
          cursor: pointer;
          transition: all 0.15s;
        }
        .time {
          position: absolute;
          left: -82px;
          font-size: 10px;
          font-weight: bold;
          text-align: center;
          line-height: 20px;
          color: @color-dark;

          .arrow {
            display: none;
          }
        }

        &.active {
          border-left: solid 2px @primary-button-color;
          background-color: @color-base;
          .item-details {
            opacity: 1;

            .time {
              color: @primary-button-color;

              .arrow {
                display: inline;
                margin-left: 5px;
              }
            }
          }
        }
      }
    } // .timeline-items
  }

  .header {
    .asset-title-input {
      min-width: 300px;
      width: 100%;
      .el-input__inner {
        height: 24px;
        font-size: 11px;
        padding: 5px 8px;
      }
    }
  }
</style>
