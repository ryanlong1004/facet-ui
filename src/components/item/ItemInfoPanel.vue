<template>
  <div>
    <ul class="item-tools">
      <li>
        <el-tooltip
          content="View Item Extractor History"
          effect="dark"
          placement="top"
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
        >
          <i class="far fa-clock" @click="openExtractorHistory"></i>
        </el-tooltip>
      </li>

      <li class="divider"></li>

      <li class="tool" @click="openManageCollectionsDialog">
        <el-tooltip
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
          :content="inCollectionTooltipMessage"
          placement="top"
          effect="dark"
        >
          <i
            :class="{ 'fas fa-heart': collectionsInfoLoaded && !collectionsBusy && isInCollection,
                      'far fa-heart': collectionsInfoLoaded && !collectionsBusy && !isInCollection,
                      'far fa-circle-notch fa-spin': !collectionsInfoLoaded || collectionsBusy}
            ">
          </i>
        </el-tooltip>
      </li>

      <li class="tool" @click="handleCommand('shareLink')">
        <el-tooltip
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          content="Share This Page"
          effect="dark"
          placement="top"
        >
          <i class="far fa-share-alt"></i>
        </el-tooltip>
      </li>

      <li class="tool" @click="handleCommand('comments')">
        <el-tooltip
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
          effect="dark"
          content="Comments"
          placement="top"
        >
          <i class="far fa-comment"></i>
        </el-tooltip>
      </li>

      <li class="divider"></li>

      <li
        v-if="$hasScope(SCOPES.ITEM_DOWNLOAD)"
        class="tool"
        @click="handleCommand('download')"
      >
        <el-tooltip
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
          effect="dark"
          :content="downloadTooltipText"
          placement="top"
        >
          <i class="far fa-download"></i>
        </el-tooltip>
      </li>

      <li
        v-if="!isSaasPlatform && $hasScope(SCOPES.HARVEST)"
        class="tool"
        @click="handleCommand('reHarvest')"
      >
        <el-tooltip
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
          effect="dark"
          content="Reanalyze Item"
          placement="top"
        >
          <i class="far fa-sync"></i>
        </el-tooltip>
      </li>

      <li
        v-if="$hasScope(SCOPES.ITEM_DELETE)"
        class="tool"
        @click="handleCommand('delete')"
      >
        <el-tooltip
          :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
          :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
          content="Delete Item"
          effect="dark"
          placement="top"
        >
          <i class="far fa-trash"></i>
        </el-tooltip>
      </li>
    </ul>

    <el-dialog
      class="overview-dialog"
      title="Overview"
      :visible.sync="showOverviewModal"
    >
      <iframe v-if="showOverviewModal" :src="`/api/data/v3/summary/items/${itemId}/overview`"></iframe>
    </el-dialog>

    <el-dialog
      title="Are you sure?"
      :visible.sync="showDeleteModal">
      <span style="line-height: 1.5rem;">
        Are you sure that you want to delete?<br>
        <strong>Note:</strong> This item will no longer be searchable, but the original file will not be deleted.
      </span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showDeleteModal = false">Cancel</el-button>
        <el-button type="danger" @click.stop="deleteItem">Yes, delete</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :title="collectionsDialogTitle"
      :visible.sync="showCollectionsModal"
      class="collection-selection-dialog">
      <p>{{collectionsDialogMsg}}</p>
      <el-select
        allow-create
        class="collection-selection-box"
        collapse-tags
        default-first-option
        filterable
        multiple
        no-data-text="No existing collections, type and select to create new ones"
        :placeholder="collectionsPlaceholderMsg"
        popper-class="collections-dropdown"
        v-model="selectedCollections"
      >
        <el-option
          v-for="collection in collections"
          :key="collection.id"
          :label="collection.name"
          :value="collection.id">
        </el-option>
      </el-select>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click.stop="changeCollectionsForItem(true)" :disabled="disableAddButton">{{collectionsDialogSaveText}}</el-button>
        <el-button type="text" @click="changeCollectionsForItem(false)">Cancel</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :visible.sync="showShareLink"
      class="share-link-dialog"
      title="Share URL"
    >
      <h4>Share a link to this page:</h4>
      <el-alert v-if="shareUrlMessage" :type="shareUrlMessage.type" :title="shareUrlMessage.message"></el-alert>
      <p>{{ thisPageUrl }}</p>
      <el-button
        type="primary"
        size="small"
        v-clipboard="thisPageUrl"
        @success="handleShareUrlSuccess"
        @error="handleShareUrlError"
      >Copy URL to clipboard</el-button>
    </el-dialog>

    <el-dialog
      :before-close="cancelDialog"
      title="Custom Data Fields"
      :visible.sync="dialogCustomDataFields"
    >
      <custom-data-fields></custom-data-fields>
    </el-dialog>

    <el-dialog
      title="Item Extractor History"
      :visible.sync="showExtractorHistoryModal"
    >
      <extractor-history/>
    </el-dialog>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'
import AlphanumericInput from 'src/directives/alphanumeric-input.directive'
import AlphanumericcommaInput from 'src/directives/alphanumericcomma-input.directive'
import api from 'src/api'
import { pluralize } from 'humanize-plus'
import { ANALYTICS_CATEGORIES, ANALYTICS_ACTIONS } from 'src/config/analytics'

import {
  COLLECTIONS,
  CUSTOM_DATA,
  EXTRACTORS,
  ITEM,
  ITEM_EXTRACTOR_HISTORY,
  ITEM_UI_STATE,
  RIGHT_PANEL
} from 'src/store/storeModules'
import {
  GET_COLLECTION_ADDED,
  GET_COLLECTION_IDS,
  GET_COLLECTION_REMOVED,
  GET_COLLECTIONS,
  GET_COLLECTIONS_BUSY,
  GET_COLLECTIONS_BY_ITEM_ID,
  GET_SELECTED_COLLECTIONS_BY_ITEM_ID
} from 'src/store/modules/collections/getters'
import {
  ADD_COLLECTIONS_TO_ITEM,
  CREATE_NEW_COLLECTION,
  LOAD_COLLECTIONS,
  LOAD_COLLECTIONS_FOR_ITEM,
  REMOVE_COLLECTIONS_FROM_ITEM
} from 'src/store/modules/collections/actions'
import { COLLECTIONS_OPEN } from 'src/store/modules/rightPanel/getterTypes'
import { SET_SHOW_TECHNICAL_METADATA } from 'src/store/modules/item/ui-state/mutations'

import LocationEnforcerMixin from 'src/components/global/LocationEnforcerMixin'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import { TOGGLE_COMMENTS } from 'src/store/modules/rightPanel/mutationTypes'
import { ITEM_ID } from 'src/store/modules/item/getterTypes'
import { FETCH_ITEM_CUSTOM_DATA } from 'src/store/modules/item/custom-data-fields/actions'
import { FETCH_INSTALLED_EXTRACTORS } from 'src/store/modules/admin/extractors'

import {
  FETCH_ITEM_EXTRACTOR_HISTORY
} from 'src/store/modules/item/extractor-history/actions'

import CustomDataFields from 'src/components/item/custom-data-fields/CustomDataFields'
import ExtractorHistory from 'src/components/item/ExtractorHistory.vue'

export default {
  name: 'item-info-panel',

  components: {
    CustomDataFields,
    ExtractorHistory
  },

  mixins: [
    LocationEnforcerMixin,
    VuexItemMixin
  ],

  directives: {
    AlphanumericInput,
    AlphanumericcommaInput
  },

  data () {
    return {
      dialogCustomDataFields: false,
      savedCollections: [],
      selectedCollections: [],
      shareUrlMessage: null,
      showCollectionsModal: false,
      showDeleteModal: false,
      showExtractorHistoryModal: false,
      showOverviewModal: false,
      showShareLink: false
    }
  },

  computed: {
    ...mapGetters(ITEM, {
      itemId: ITEM_ID
    }),

    ...mapGetters(COLLECTIONS, {
      collectionAdded: GET_COLLECTION_ADDED,
      collectionRemoved: GET_COLLECTION_REMOVED,
      collections: GET_COLLECTIONS,
      collectionsBusy: GET_COLLECTIONS_BUSY,
      collectionsByItemId: GET_COLLECTIONS_BY_ITEM_ID,
      existingCollectionIds: GET_COLLECTION_IDS,
      selectedCollectionIdsByItemId: GET_SELECTED_COLLECTIONS_BY_ITEM_ID
    }),

    downloadTooltipText () {
      return this.item.id !== this.item.root_id ? 'Download parent archive file' : 'Download file'
    },

    thisPageUrl: function () {
      return window.location.href
    },

    collectionsDialogSaveText () {
      return this.isInCollection ? 'Save' : 'Add'
    },

    collectionsDialogTitle () {
      return this.isInCollection ? 'Add or Remove from Collection' : 'Add to Collection'
    },

    collectionsDialogMsg () {
      if (this.isInCollection) {
        return 'Please select any collections that you would like to add or remove this file from.'
      } else if (_.get(this.collections, 'length')) {
        return 'Please select any collections that you would like to add this file to.'
      } else {
        return 'Please add one or more collections by typing.'
      }
    },

    collectionsPlaceholderMsg () {
      if (this.selectedCollections.length === 0) {
        return _.get(this.collections, 'length') ? 'Choose collection...' : 'Type to add collection...'
      } else {
        return ''
      }
    },

    disableAddButton () {
      return this.collectionsDialogSaveText === 'Add' && this.selectedCollections.length === 0
    },

    inCollectionTooltipMessage () {
      let tooltip = 'Add to collection'

      if (!this.collectionsInfoLoaded) {
        tooltip = 'Loading collections data'

      } else if (this.isInCollection) {
        tooltip = 'Edit collections'
      }
      return tooltip
    },

    isInCollection () {
      return _.get(this.selectedCollectionIdsByItemId, 'length', 0) > 0
    },

    isLoadnStore () {
      return _.get(this.item, 'data.location_kind', '') === this.CONSTANTS.LOCATION_KIND.LOADNSTORE.id
    },

    collectionsInfoLoaded () {
      return this.selectedCollectionIdsByItemId !== null && !this.collectionsBusy
    },

    shouldShowAssetSummmaryIcon () {
      return this.isVideo
    }
  },

  async beforeMount () {
    await this.getCollectionsForItem()
  },

  mounted () {
    this.$watch('itemId', async (newVal, oldVal) => {
      if (this.itemId) {
        await this.getCollectionsForItem()
      }
    }, { immediate: true })
  },

  methods: {
    ...mapActions(CUSTOM_DATA, {
      loadItemCustomData: FETCH_ITEM_CUSTOM_DATA
    }),
    ...mapActions(EXTRACTORS, {
      fetchInstalledExtractors: FETCH_INSTALLED_EXTRACTORS
    }),
    ...mapActions(ITEM_EXTRACTOR_HISTORY, {
      fetchItemExtractorHistory: FETCH_ITEM_EXTRACTOR_HISTORY
    }),

    ...mapActions(COLLECTIONS, {
      addCollectionsToItem: ADD_COLLECTIONS_TO_ITEM,
      createNewCollection: CREATE_NEW_COLLECTION,
      loadCollections: LOAD_COLLECTIONS,
      loadCollectionsForItem: LOAD_COLLECTIONS_FOR_ITEM,
      removeCollectionsFromItem: REMOVE_COLLECTIONS_FROM_ITEM
    }),

    cancelDialog () {
      this.dialogCustomDataFields = false
    },

    toggleComments () {
      this.$store.commit(`${RIGHT_PANEL}/${TOGGLE_COMMENTS}`)
    },

    openExtractorHistory () {
      this.fetchInstalledExtractors()
      this.fetchItemExtractorHistory()
      this.showExtractorHistoryModal = true
    },

    shareLink () {
      this.shareUrlMessage = null
      this.showShareLink = true
    },

    handleShareUrlSuccess: function () {
      this.shareUrlMessage = {
        type: 'success',
        message: 'URL copied to clipboard - you can now paste it into your email client or favorite link sharing tool'
      }
    },

    handleShareUrlError: function () {
      this.shareUrlMessage = {
        type: 'success',
        message: 'Sorry, there was an error copying to clipboard - your browser might not support that functionality.'
      }
    },

    async getCollectionsForItem () {
      try {
        await this.loadCollectionsForItem()
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Error getting collections for this item',
          showClose: true,
          type: 'error'
        })
        console.error('error getting collections item', err)
      }
    },

    async openManageCollectionsDialog () {
      this.savedCollections = _.assign([], this.selectedCollectionIdsByItemId)
      this.selectedCollections = _.assign([], this.selectedCollectionIdsByItemId)
      await this.loadCollections({ limit: this.CONSTANTS.LIMIT.COLLECTIONS_MAX, listingOnly: true })
      this.showCollectionsModal = true
    },

    async changeCollectionsForItem (save) {
      if (save) {
        const removedCollections = _.difference(this.savedCollections, this.selectedCollections)
        const addedCollections = _.difference(this.selectedCollections, this.savedCollections)
        const namesOfNewCollections = _.difference(this.selectedCollections, this.existingCollectionIds)

        try {
          for (const name of namesOfNewCollections) {
            await this.createNewCollection(name)
            const index = addedCollections.indexOf(name)
            addedCollections[index] = _.get(this.collectionAdded, 'id')
          }

          if (addedCollections.length) {
            await this.addCollectionsToItem(addedCollections)
          }

          if (removedCollections.length) {
            await this.removeCollectionsFromItem(removedCollections)
          }

          if (!this.$store.getters[`${RIGHT_PANEL}/${COLLECTIONS_OPEN}`]) {
            let msg = ''
            if (removedCollections.length) {
              msg += `Removed from ${removedCollections.length} ${pluralize(removedCollections.length, 'collection')}`
            }
            if (addedCollections.length) {
              if (msg === '') {
                msg += `Added to ${addedCollections.length} ${pluralize(addedCollections.length, 'collection')}`
              } else {
                msg += ` and added to ${addedCollections.length} ${pluralize(addedCollections.length, 'collection')}`
              }
            }

            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: msg,
              showClose: true,
              type: 'success'
            })
          }
        } catch (err) {
          console.error(err)

          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'Error modifying collection',
            showClose: true,
            type: 'error'
          })
        }
      }

      this.showCollectionsModal = false
    },

    handleCommand: function (command) {
      let analyticsAction = false
      if (command === 'download') {
        this.downloadItem()
        // analytics track is in api.js
      } else if (command === 'techInfo') {
        this.$store.commit(`${ITEM_UI_STATE}/${SET_SHOW_TECHNICAL_METADATA}`, true)
        analyticsAction = ANALYTICS_ACTIONS.ITEM_TECH_INFO
      } else if (command === 'shareLink') {
        this.shareLink()
        analyticsAction = ANALYTICS_ACTIONS.ITEM_SHARE
      } else if (command === 'reHarvest') {
        api.reharvestItem(this.itemId)
          .then((response) => {
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: 'Reharvesting this file now.',
              showClose: true,
              type: 'success'
            })
          })
          .catch((err) => {
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: 'There was an error reharvesting.',
              showClose: true,
              type: 'error'
            })
            console.error(err)
          })
          .finally(() => {
            this.loaded = true
          })
          // analytics track is in api.js
      } else if (command === 'delete') {
        this.showDeleteModal = true
      } else if (command === 'overview') {
        this.showOverviewModal = true
        analyticsAction = ANALYTICS_ACTIONS.ITEM_ASSET_OVERVIEW
      } else if (command === 'comments') {
        this.toggleComments()
      }
      if (analyticsAction) {
        this.$ma.trackEvent({
          action: analyticsAction,
          properties: {
            category: ANALYTICS_CATEGORIES.ITEM_DETAILS,
            itemId: this.itemId
          }
        })
      }
    },

    async downloadItem () {
      let itemId = _.get(this.item, 'root_id')
      try {
        await api.downloadItem(itemId)
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Item is unavailable for download, ' +
            'this is likely due to the file being removed or renamed in storage.',
          showClose: true,
          type: 'error'
        })
        console.error(err)
      }
    },

    async deleteItem () {
      try {
        await api.deleteItem(this.itemId)
        this.showDeleteModal = false
        this.$router.push({ path: '/' })
      } catch (err) {
        console.error('error deleting item', err)
      }
    },

    async openCustomDialog () {
      await this.loadItemCustomData()
      this.dialogCustomDataFields = true
    }
  }
}
</script>

<style lang="less">
  @import (reference) '~src/styles/_variables';
  @import (reference) '~src/styles/_mixins';
  @import '~src/styles/selection-box.less';

  .item-tools {
    .flex-container();
    list-style: none;
    margin: 13px 0;
    padding: 0;

    li {
      margin-left: 17px;

      &.divider {
        .size(1.5px, 20.9px);
        border-left: 1px dotted @color-primary;
      }

      i {
        color: @color-primary;
        font-size: 14px;

        &:hover {
          color: @color-accent;
          cursor: pointer;
        }
      }
    }
  }

  .share-link-dialog,
  .collection-selection-dialog {
    .el-dialog {
      min-width: 550px;

      .el-dialog__body {
        p,
        h4 {
          margin-top: 0;
        }
      }
    }

    .collection-selection-box {
      width: 100%;
    }
  }
</style>
