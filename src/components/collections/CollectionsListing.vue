<template>
  <div
    v-if="collections.length"
    :class="{ 'inside-panel': isInsidePanel }"
    class="collections-listing"
  >
    <div
      class="scroll-container"
      v-infinite-scroll="loadNextPage"
      infinite-scroll-disable="collectionsBusy"
      infinite-scroll-immediate="false"
      finite-scroll-throttle-delay="1000"
      ref="list-of-collections"
    >
      <transition-group name="list">
        <div
          v-for="collection in collections"
          :key="collection.id"
          class="collection"
          :class="{'active': viewedCollectionId === collection.id}"
        >
          <div class="collection-thumbnail" @click="handleCollectionClick(collection.id)">
            <div v-if="collection.items[0]" class="thumbnail">
              <thumbnail-image
                :id="collection.items[0].item_id"
                :thumb="collection.items[0].thumbnail"
              ></thumbnail-image>
              <div v-if="isInsidePanel" class="overlay">
                <span class="count">{{collection.num_items}}</span>
                <span class="files-text">{{ pluralize(collection.num_items, 'FILE').toUpperCase() }}</span>
              </div>
            </div>
            <div v-else class="no-items">
              <img src="/static/img/thumbnail/default.svg" class="single">
              <div v-if="isInsidePanel" class="overlay">
                <span class="count">{{collection.num_items}}</span>
                <span class="files-text">{{ pluralize(collection.num_items, 'FILE').toUpperCase() }}</span>
              </div>
            </div>
          </div>

          <div class="collection-info" @click="handleCollectionClick(collection.id)">
            <el-tooltip
              :content="collection.name"
              :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
              :effect="tooltipColor"
              placement="top-start"
            >
              <div class="collection-info--name">
                <span v-truncate-text.end="truncateValue">{{ collection.name }}</span> <template v-if="!isInsidePanel">({{ collection.num_items}})</template>
              </div>
            </el-tooltip>
            <p class="time">
              Last modified {{getTimeAgo(collection.updated_at)}}
            </p>
          </div>

          <div class="collection-actions">
            <el-dropdown
              placement="bottom-start"
              trigger="click"
              @command="handleCommand"
            >
              <el-button>
                <i class="far fa-ellipsis-h"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown" class="collection-actions-dropdown">
                <el-dropdown-item v-if="isInsidePanel" :command="{ type: 'link', item: collection.id }">
                  <el-tooltip
                    :effect="tooltipColor"
                    content="Go to collection"
                    placement="top"
                    :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                  >
                    <span><i class="far fa-link"></i> Go to collection</span>
                  </el-tooltip>
                </el-dropdown-item>
                <el-dropdown-item :command="{ type: 'share', item: collection.id }">
                  <el-tooltip
                    :effect="tooltipColor"
                    content="Share collection"
                    placement="top"
                    :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                  >
                    <span><i class="far fa-share-alt share"></i> Share collection</span>
                  </el-tooltip>
                </el-dropdown-item>
                <el-dropdown-item :command="{ type: 'delete', item: collection }">
                  <el-tooltip
                    :effect="tooltipColor"
                    content="Delete collection"
                    placement="top"
                    :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                  >
                    <span><i class="far fa-trash-alt"></i> Delete collection</span>
                  </el-tooltip>
                </el-dropdown-item>
                <el-dropdown-item :command="{ type: 'rename', item: collection.id }">
                  <el-tooltip
                    :effect="tooltipColor"
                    content="Rename collection"
                    placement="top"
                    :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                  >
                    <span><i class="far fa-pencil"></i> Rename collection</span>
                  </el-tooltip>
                </el-dropdown-item>
                <el-dropdown-item :command="{ type: 'clone', item: collection.id }">
                  <el-tooltip
                    :effect="tooltipColor"
                    content="Clone collection"
                    placement="top"
                    :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                  >
                    <span><i class="far fa-clone"></i> Clone collection</span>
                  </el-tooltip>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </div>
      </transition-group>
    </div>

    <el-dialog :visible.sync="showShareLink" title="Share a link to this collection">
      <el-alert v-if="shareUrlMessage.message" :type="shareUrlMessage.type" :title="shareUrlMessage.message"></el-alert>
      <p>{{ shareUrlMessage.url }}</p>
      <el-button
        type="primary"
        size="small"
        v-clipboard="shareUrlMessage.url"
        @success="handleShareUrlSuccess"
        @error="handleShareUrlError"
      >Copy URL to clipboard</el-button>
    </el-dialog>

    <el-dialog
      :before-close="cancelDialog"
      :visible.sync="showCollectionsDialog"
      :title="collectionAction"
      top="5%"
    >
      <el-form
        :model="formCollection"
        :rules="formValidationRules"
        inline-message
        label-position="top"
        label-width="100%"
        ref="formCollection"
        status-icon
        validate-on-rule-change
      >
        <el-form-item
        class="new-collection-input"
        label="New Collection Name"
        prop="collectionName"
      >
          <el-input
            ref="editCollectionName"
            v-model="formCollection.collectionName"
            @keydown.native.enter.stop.prevent="submitAction"
          >
          </el-input>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button size="mini" type="text" @click="cancelDialog">Cancel</el-button>
        <el-button
          :disabled="formCollection.collectionName === ''"
          @click="submitAction"
          type="primary"
          size="mini">Save</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import _ from 'lodash'
import Validator from 'async-validator'
import moment from 'moment'
import { pluralize } from 'humanize-plus'
import { mapActions, mapGetters } from 'vuex'
import { COLLECTIONS } from 'src/store/storeModules'
import {
  GET_COLLECTION_BUSY,
  GET_COLLECTION,
  GET_COLLECTIONS,
  HAS_NEXT_PAGE,
  HAS_NEXT_PAGE_ITEMS,
  HAS_PREVIOUS_PAGE,
  HAS_PREVIOUS_PAGE_ITEMS
} from 'src/store/modules/collections/getters'
import {
  CLONE_COLLECTION,
  DELETE_COLLECTION,
  RENAME_COLLECTION,
  FETCH_NEXT_PAGE,
  FETCH_NEXT_PAGE_ITEMS,
  FETCH_PREVIOUS_PAGE,
  FETCH_PREVIOUS_PAGE_ITEMS
} from 'src/store/modules/collections/actions'

import TruncateText from 'src/directives/truncate-text.directive'

import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage'
import CollectionItems from 'src/components/collections/CollectionItems'

const formValidationRules = {
  collectionName: [
    {
      message: 'Collection name is required',
      required: true,
      trigger: 'blur'
    }
  ]
}

const validator = new Validator(formValidationRules)

export default {
  name: 'collections-listing',

  components: {
    CollectionItems,
    ThumbnailImage
  },

  directives: {
    TruncateText
  },

  props: {
    isInsidePanel: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      collectionAction: '',
      collectionIdAction: '',
      formCollection: {
        collectionName: ''
      },
      formValidationRules,
      isValidForm: false,
      pluralize: pluralize,
      showCollectionsDialog: false,
      showShareLink: false,
      shareUrlMessage: {
        type: null,
        message: null,
        url: null
      }
    }
  },

  computed: {
    ...mapGetters(COLLECTIONS, {
      collection: GET_COLLECTION,
      collectionBusy: GET_COLLECTION_BUSY,
      collections: GET_COLLECTIONS,
      hasNextPage: HAS_NEXT_PAGE
    }),

    collectionsLimit () {
      return this.isInsidePanel ? this.CONSTANTS.LIMIT.COLLECTIONS_IN_PANEL : this.CONSTANTS.LIMIT.COLLECTIONS
    },

    numItemsInCollection () {
      return _.get(this.collection, 'items.length', 0)
    },

    tooltipColor () {
      return this.isInsidePanel ? 'light' : 'dark'
    },

    truncateValue () {
      return this.isInsidePanel ? 20 : 12
    },

    viewedCollectionId () {
      return _.get(this.$route, 'params.id', '')
    }
  },

  methods: {
    ...mapActions(COLLECTIONS, {
      doCloneCollection: CLONE_COLLECTION,
      doDeleteCollection: DELETE_COLLECTION,
      doRenameCollection: RENAME_COLLECTION,
      doNextPage: FETCH_NEXT_PAGE
    }),

    cancelDialog () {
      this.showCollectionsDialog = false
      this.formCollection = {
        collectionName: ''
      }
      this.collectionAction = ''
    },

    async cloneCollection () {
      try {
        await this.doCloneCollection({
          collectionId: this.collectionIdAction,
          collectionName: this.formCollection.collectionName,
          limit: this.collectionsLimit
        })
        this.cancelDialog()
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `Unable to clone collection.`,
          showClose: true,
          type: 'error'
        })
      } finally {
        this.collectionAction = ''
        this.collectionIdAction = ''
      }
    },

    async deleteCollection (collection) {
      this.$confirm(`Are you sure you want to delete "${collection.name}" collection?`, `Delete ${collection.name}`, {
        cancelButtonText: 'Cancel',
        confirmButtonText: 'OK',
        type: 'warning'
      })
      .then(async () => {
        try {
          await this.doDeleteCollection(collection.id)
          if (!this.isInsidePanel) {
            this.$router.push({ name: this.CONSTANTS.ROUTES.CURATED.COLLECTIONS.NAME })
          }
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: `Unable to delete ${collection.name}.`,
            showClose: true,
            type: 'error'
          })
        }
      }).catch(() => {})
    },

    getTimeAgo (time) {
      return moment(time).fromNow()
    },

    handleCommand (command) {
      switch (command.type) {
        case 'link':
          this.handleGoToCollection(command.item)
          break
        case 'share':
          this.share(command.item)
          break
        case 'delete':
          this.deleteCollection(command.item)
          break
        case 'rename':
          this.handleRenameCollection(command.item)
          break
        case 'clone':
          this.handleCloneCollection(command.item)
          break
      }
    },

    handleCloneCollection (command) {
      this.collectionAction = this.CONSTANTS.COLLECTION_ACTIONS.CLONE
      this.openCollectionsDialog(command)
    },

    handleCollectionClick (collectionId) {
      this.$emit('handle-collection', collectionId)
    },

    handleCollectionClickInPanel (collectionId) {
      this.$emit('handle-collection', collectionId)
    },

    handleGoToCollection (command) {
      this.$router.push({
        name: this.CONSTANTS.ROUTES.CURATED.COLLECTIONS.COLLECTION.NAME,
        params: { id: command }
      }).catch(err => {})
    },

    handleRenameCollection (command) {
      this.collectionAction = this.CONSTANTS.COLLECTION_ACTIONS.RENAME
      this.openCollectionsDialog(command)
    },

    handleShareUrlSuccess () {
      this.shareUrlMessage.type = 'success'
      this.shareUrlMessage.message = 'COPIED! - you can now paste it into your email client or favorite link sharing tool'
    },

    handleShareUrlError () {
      this.shareUrlMessage.type = 'success'
      this.shareUrlMessage.message = 'Sorry, there was an error copying to clipboard - your browser might not support that functionality.'
    },

    loadNextPage () {
      if (this.hasNextPage) {
        this.doNextPage()
      }
    },

    openCollectionsDialog (collectionId) {
      this.collectionIdAction = collectionId
      this.showCollectionsDialog = true
      this.$nextTick(() => {
        this.$refs['formCollection'].clearValidate()
        this.$refs['editCollectionName'].$el.getElementsByTagName('input')[0].focus()
      })
    },

    async renameCollection () {
      try {
        await this.doRenameCollection({ collectionId: this.collectionIdAction, collectionName: this.formCollection.collectionName })
        this.cancelDialog()

        if (!this.isInsidePanel) {
          await this.$router.push({
            name: this.CONSTANTS.ROUTES.CURATED.COLLECTIONS.COLLECTION.NAME,
            params: { id: this.collectionIdAction }
          }).catch(err => {})
        }
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `Unable to rename collection.`,
          showClose: true,
          type: 'error'
        })
      } finally {
        this.collectionAction = ''
        this.collectionIdAction = ''
      }
    },

    share (collectionId) {
      this.shareUrlMessage.type = null
      this.shareUrlMessage.message = null

      let url = window.location.href
      const hashNdx = url.indexOf('#')
      url = `${url.substr(0, hashNdx + 1)}/shared-collection/${collectionId}`
      this.shareUrlMessage.url = url

      this.showShareLink = true
    },

    submitAction () {
      this.$refs['formCollection'].validate(async (valid) => {
        if (valid) {
          this.collectionAction === this.CONSTANTS.COLLECTION_ACTIONS.RENAME ? this.renameCollection() : this.cloneCollection()
        } else {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'Error submitting. Please try again.',
            showClose: true,
            type: 'error'
          })
          return false
        }

        this.showCollectionsDialog = false
      })
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.collections-listing {
  background-color: @color-tone-light;
  border-right: 1px solid @color-tone-lighter;
  height: calc(~'100vh - 34px');
  max-width: 260px;
  min-width: 260px;
  width: 100%;

  .scroll-container {
    height: 98%;
    overflow-x: visible;
    overflow-y: auto;
    width: 101%;
  }

  .collection {
    .flex-box();
    border-bottom: 1px solid transparent;
    border-top: 1px solid transparent;
    color: @color-primary;
    cursor: pointer;
    max-height: 55px;
    padding: 10px;
    width: 100%;

    &.active,
    .active {
      background: @color-base;
      border-bottom-color: @color-tone-lighter;
      border-top-color: @color-tone-lighter;
    }

    &:hover {
      .collection-info {
        .collection-info--name {
          color: @color-accent;
        }
      }
    }

    .collection-thumbnail {
      .no-items img,
      .thumbnail {
        .size(65px, 35px);
        min-height: 35px;
        object-fit: contain;
      }

      .no-items {
        background-color: @color-tone-lighter;
      }

      .thumbnail-container {
        &.sprite {
          object-fit: contain;
        }
      }
    }

    .collection-info {
      .flex-container-column();
      .justify-content-center();
      margin-left: 5px;

      .collection-info--name {
        font-family: @default-font-family-medium;
        font-size: 12px;
        margin-bottom: 3px;
      }

      p {
        margin: 0;

        &.time {
          color: @color-tone-medium;
          font-size: 0.5rem;
          opacity: 0.5;
        }
      }
    }

    .collection-actions {
      .flex-container-center();
      margin-left: auto;

      .el-button {
        background: transparent;
        border: 0 none;
        padding: 7px 12px;

        &:hover {
          background: transparent;
        }
      }

      i {
        font-size: 13px;

        &:hover {
          color: @color-accent;
        }
      }

      .share {
        margin-right: 10px;
      }
    }
  }

  .el-dialog__body {
    p {
      margin-top: 0;
    }
  }

  &.inside-panel {
    background-color: transparent;
    border-right: 0 none;
    height: calc(~'100vh - 150px');
    max-width: none;

    .scroll-container {
      height: 98%;
      width: 100%;
    }

    .collection {
      border: 0 none;
      margin-bottom: 20px;
      max-height: 60px;
      padding: 0;

      &:hover,
      &.active,
      .active {
        background-color: transparent;
        border: 0 none;
      }

      &:hover {
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
        transform: translate(-2px, -2px);
      }

      .no-items,
      .thumbnail {
        .size(100px, 60px);
        background: @color-dark-shadow;
        flex-grow: 0;
        min-width: 100px;
        overflow: hidden;
        position: relative;

        .overlay {
          .flex-container-column();
          .align-items-center();
          .justify-content-center();
          .size(100%, 100%);
          background-color: rgba(0, 0, 0, 0.7);
          color: @color-base;
          padding: 5px;
          position: absolute;
          text-align: center;
          top: 0;

          .count {
            font-size: 24px;
          }

          .files-text {
            color: @color-tone-darkest;
            font-size: 8px;
          }
        }

        .thumbnail-container {
          min-height: 60px;
          width: 100px;
        }

        .thumbnail-container.single span {
          background-size: cover;
        }
      }

      .no-items img {
        .size(100px, 60px);
        min-width: 100px;
        object-fit: contain;
      }

      .collection-info {
        .align-items-start();
        font-size: .7rem;
        padding: 10px;

        .collection-info--name {
          color: @color-base;
          margin-bottom: 3px;
        }

        p {
          &.time {
            color: @text-light;
          }
        }
      }

      .collection-actions {
        i {
          color: @color-tone;

          &:hover {
            color: @color-accent;
          }
        }
      }
    }
  }
}

.collection-actions-dropdown {
  &.el-dropdown-menu {
    .el-dropdown-menu__item {
      font-size: 11px;
      line-height: 2.2;
    }
  }
}

</style>
