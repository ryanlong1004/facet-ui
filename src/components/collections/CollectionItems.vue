<template>
  <div
    v-loading="collectionBusy"
    :class="{ 'inside-panel': isInsidePanel }"
    class="items"
  >
    <template v-if="!collectionBusy">
      <draggable
        v-model="items"
        ref="item"
        :options="dragOptionsCollection"
        @add="addItemToCollection($event)"
        @update="reorderCollection($event)"
        :move="onMove"
      >
        <transition-group name="list">
          <div
            v-for="(item, $index) in items"
            :key="item.item_id"
            :class="{
              'item-div': $index < itemsLength,
              'footer-div': $index === itemsLength,
              'selected': isSelected(item.item_id)
            }"
          >
            <div v-if="$index < itemsLength" class="collection-item">
              <router-link class="thumbnail" :to="{ name: 'itemDetails', params: { id: item.item_id } }">
                <thumbnail-image ref="thumbnail" :id="item.item_id" :thumb="item.thumbnail"></thumbnail-image>
                <div class="overlay"></div>
              </router-link>

              <router-link class="info" :to="{ name: 'itemDetails', params: { id: item.item_id } }">
                <div class="subtitle">
                  <el-tooltip
                    :content="displayName(item)"
                    placement="top"
                    :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                    :effect="tooltipColor"
                  >
                    <span v-truncate-text.end="truncateValue" class="result__title">{{displayName(item)}}</span>
                  </el-tooltip>
                </div>
                <div class="time">Added to collection {{getTimeAgo(item)}}</div>
              </router-link>

              <div class="collection-item-actions">
                <el-dropdown
                  placement="bottom-start"
                  trigger="click"
                  @command="handleCommand"
                >
                  <el-button>
                    <i class="far fa-ellipsis-h"></i>
                  </el-button>
                  <el-dropdown-menu slot="dropdown" class="collection-actions-dropdown">
                    <el-dropdown-item v-if="isInsidePanel" :command="{ type: 'link', item: collectionId }">
                      <el-tooltip
                        :effect="tooltipColor"
                        content="Go to parent collection"
                        placement="top"
                        :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                      >
                        <span><i class="far fa-link"></i> Go to parent collection</span>
                      </el-tooltip>
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ type: 'download', item }">
                      <el-tooltip
                        :effect="tooltipColor"
                        content="'Download asset'"
                        placement="top"
                        :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                      >
                        <span><i class="far fa-download"></i> Download asset</span>
                      </el-tooltip>
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ type: 'remove', item }">
                      <el-tooltip
                        :effect="tooltipColor"
                        content="Remove asset from collection"
                        placement="top"
                        :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                      >
                        <span><i class="far fa-trash-alt"></i> Remove asset from collection</span>
                      </el-tooltip>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
            </div>
            <div v-else-if="isInsidePanel && displayContext === 'collections-panel'" class="footer non-draggable">
              <div class="text non-draggable">
                + Drag a file here to add
              </div>
            </div>
          </div>
        </transition-group>
      </draggable>

      <div class="pagination" v-if="showPaginationForItems">
        <el-button
          @click="doPreviousPageItems({ collectionId })"
          size="mini"
          type="primary"
          v-if="hasPreviousPageItems"
        >
          <i class="far fa-angle-left"></i>
          {{ CONSTANTS.PAGINATION.PREVIOUS_PAGE }}
        </el-button>
        <el-button
          @click="doNextPageItems({ collectionId })"
          size="mini"
          type="primary"
          v-if="hasNextPageItems"
        >
          {{ CONSTANTS.PAGINATION.NEXT_PAGE }}
          <i class="far fa-angle-right"></i>
        </el-button>
      </div>
    </template>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import _ from 'lodash'
import moment from 'moment'
import api from 'src/api'
import { getFilenameFromItemData } from 'src/item-helper'
import session from 'src/session'
import { mapActions, mapGetters } from 'vuex'
import { COLLECTIONS } from 'src/store/storeModules'
import {
  GET_COLLECTION_BUSY,
  GET_COLLECTION_ITEMS,
  HAS_NEXT_PAGE_ITEMS,
  HAS_PREVIOUS_PAGE_ITEMS
} from 'src/store/modules/collections/getters'

import {
  FETCH_NEXT_PAGE_ITEMS,
  FETCH_PREVIOUS_PAGE_ITEMS,
  REORDER_ITEMS_IN_COLLECTION,
  UPSERT_ITEMS_IN_COLLECTION
} from 'src/store/modules/collections/actions'

import TruncateText from 'src/directives/truncate-text.directive'

import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage'

export default {
  name: 'collection-items',

  components: {
    ThumbnailImage,
    draggable
  },

  directives: {
    TruncateText
  },

  props: {
    collectionId: {
      type: String,
      required: true
    },
    currentItemId: {
      type: String,
      default: ''
    },
    isInsidePanel: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters(COLLECTIONS, {
      collectionBusy: GET_COLLECTION_BUSY,
      collectionItems: GET_COLLECTION_ITEMS,
      hasNextPageItems: HAS_NEXT_PAGE_ITEMS,
      hasPreviousPageItems: HAS_PREVIOUS_PAGE_ITEMS
    }),

    displayContext () {
      return this.$parent._vnode.data.staticClass
    },

    itemsLength () {
      return this.items.length - 1
    },

    showPaginationForItems () {
      return !!this.hasNextPageItems || !!this.hasPreviousPageItems
    },

    tooltipColor () {
      return this.isInsidePanel ? 'light' : 'dark'
    },

    truncateValue () {
      return this.isInsidePanel ? 12 : 80
    }
  },

  data () {
    return {
      session: session,
      items: [],
      dragOptionsCollection: {
        group: {
          name: 'collections',
          pull: 'false'
        }
      }
    }
  },

  mounted () {
    this.$watch('collectionItems', (newVal, oldVal) => {
      if (newVal) {
        this._initData()
      }
    }, { immediate: true })
  },

  methods: {
    ...mapActions(COLLECTIONS, {
      doNextPageItems: FETCH_NEXT_PAGE_ITEMS,
      doPreviousPageItems: FETCH_PREVIOUS_PAGE_ITEMS,
      doReorderCollection: REORDER_ITEMS_IN_COLLECTION,
      upsertItemsInCollection: UPSERT_ITEMS_IN_COLLECTION
    }),

    _initData () {
      let items = _.clone(this.collectionItems)

      if (!items) {
        items = []
      }

      items.push({
        added_at: moment.parseZone(Date.now()).utc().format(),
        collection_id: this.collectionId,
        display_order: 0,
        item_id: 'id',
        name: '',
        stow_url: '',
        stow_name: '',
        thumbnail: { frames: { count: 0 } },
        toDelete: false,
        fake: true
      })

      this.items = items
    },

    async addItemToCollection ($event) {
      let index = $event.newIndex

      // if we inserted past the fake item, the index would be too big
      if (index > this.collectionItems.length) {
        index = this.collectionItems.length
      }

      const addItem = $event.item._underlying_vm_
      try {
        await this.upsertItemsInCollection({ collectionId: this.collectionId, itemToAdd: addItem._id })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Unable to add item to your collection.',
          showClose: true,
          type: 'error'
        })
      }
    },

    displayName (item) {
      return getFilenameFromItemData(item)
    },

    downloadItem (item) {
      api.downloadItem(item.item_id)
    },

    getTimeAgo (item) {
      return moment(item.added_at).fromNow()
    },

    handleCommand (command) {
      switch (command.type) {
        case 'link':
          this.handleGoToCollection(command.item)
          break
        case 'remove':
          this.removeItemFromCollection(command.item)
          break
        case 'download':
          this.downloadItem(command.item)
          break
      }
    },

    handleGoToCollection (command) {
      this.$router.push({
        name: this.CONSTANTS.ROUTES.CURATED.COLLECTIONS.COLLECTION.NAME,
        params: { id: command }
      }).catch(err => {})
    },

    isSelected (itemId) {
      return this.currentItemId === itemId
    },

    onMove (evt, originalEvent) {
      // https://github.com/SortableJS/Vue.Draggable/issues/45
      const isFake = evt.draggedContext.element.fake

      if (isFake) {
        return false
      }
    },

    async removeItemFromCollection (item) {
      this.$confirm(`Are you sure you want to remove "${item.name}" from this collection?`, `Remove ${item.name}`, {
        cancelButtonText: 'Cancel',
        confirmButtonText: 'OK',
        type: 'warning',
        customClass: 'remove-delete-collection'
      })
      .then(async () => {
        try {
          await this.upsertItemsInCollection({ collectionId: this.collectionId, itemToDelete: item.item_id })
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: `Unable to delete ${item.name} from your collection.`,
            showClose: true,
            type: 'error'
          })
        }
      })
      .catch(() => {})
    },

    async reorderCollection ($event) {
      const noFake = _.filter(this.items, item => {
        return item.fake === undefined || item.fake === false
      })

      const itemOrder = _.map(noFake, item => item.item_id)
      try {
        await this.doReorderCollection({ collectionId: this.collectionId, itemIds: itemOrder })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Unable to reorder your collection.',
          showClose: true,
          type: 'error'
        })
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.collection-item-actions {
  .el-button {
    background: transparent;
    border: 0 none;
    padding: 7px 12px;

    &:hover {
      background: transparent;

      i {
        color: @color-accent;
      }
    }
  }

  i {
    font-size: 13px;

    &:hover {
      color: @color-accent;
    }
  }
}

.remove-delete-collection {
  width: 50%;
}

.items {
  .footer {
    .flex-container-center();
    .size(100%, 50px);
    border: solid 1px @text-dark;
    color: @text-light;
    margin-top: 20px;

    .text {
      color: @color-base;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
  }

  .footer-div {
    margin-bottom: 20px;
    flex-grow: 1;
    user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-drag: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }

  // by default draggable shows a copy of the origin DOM object.  We're overriding that to be a gray line.
  .right-panel .sortable-chosen.sortable-ghost {
    background-color: @color-tone-lighter;
    border: dashed 2px @box-border-grey-dark;
    height: 4px;
    margin: 10px 0px 30px 0px;
    max-height: 4px;
    overflow: hidden;
    padding: 0px;
    width: 100%;
  }

  .non-draggable {
    user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-drag: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }
}
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.items {
  .item-div {
    min-height: 60px;

    &.selected {
      .collection-item {
        background-color: @color-primary;
      }
    }

    .collection-item {
      .flex-container();
      .align-items-start();
      background: @color-tone-light;
      color: @color-primary;
      cursor: pointer;
      margin-bottom: 10px;
      max-height: 115px;
      overflow: hidden;

      &:hover {
        text-decoration: none;
      }

      .thumbnail {
        .size(200px, 115px);

        .thumbnail-container {
          &.single {
            .size(200px, 115px);
            min-height: unset;
          }

          &.sprite {
            object-fit: contain;
          }
        }
      }

      .subtitle {
        color: @color-primary;
        font-size: 14px;

        &:hover {
          color: @color-accent;
        }
      }

      .time {
        color: @color-primary;
        font-size: 12px;
      }

      .info,
      .collection-item-actions {
        height: 115px;
      }

      .info {
        .flex-container-column();
        .justify-content-space-between();
        min-width: calc(~'100% - 300px');
        padding: 10px;

        &:hover {
          text-decoration: none;

          .subtitle {
            color: @color-accent;
          }
        }
      }

      .edit-icon {
        margin-right: 15px;
      }

      .collection-item-actions {
        .flex-container-center();
        margin-right: 5px;
        margin-left: auto;

        i {
          color: @color-primary;
          margin-right: 0px;

          &:first-of-type {
            margin-right: 5px;
          }

          &:hover {
            color: @color-accent;
          }
        }
      }

      &:hover {
        .show-on-hover {
          color: @text-light;
        }
      }

      .show-on-hover {
        color: fade(@color-base, 0%);
      }
    }
  }

  &.inside-panel {
    width: 100%;

    .item-div {
      flex-grow: 0;

      &.selected {
        .collection-item {
          background-color: @color-primary;
        }
      }

      .collection-item {
        .align-items-center();
        background: transparent;
        color: @color-primary;
        transition: background 0.25s ease-in-out;

        &:hover {
          box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
          transform: translate(-2px, -2px);
        }

        .thumbnail {
          .size(100px, 60px);

          .thumbnail-container {
            &.single {
              .size(100px, 60px);
            }
          }
        }

        .info,
        .collection-item-actions {
          height: 60px;
        }

        .info {
          .justify-content-center();
          min-width: calc(~'100% - 200px');

          .subtitle {
            color: @color-base;
            font-size: .7em;
            margin-bottom: 3px;
          }

          .time {
            color: @text-light;
            font-size: .5em;
          }

          &:hover {
            .subtitle {
              color: @color-accent;
            }
          }
        }

        .collection-item-actions {
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
}
</style>
