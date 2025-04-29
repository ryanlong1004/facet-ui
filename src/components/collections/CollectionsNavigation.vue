<template>
  <div class="nav">
    <header class="collections-nav__header">
      <div class="collections-nav__back">
        <button v-if="isViewingCollectionItems" @click.prevent="backToOverview">
          <i class="far fa-chevron-left"></i>
        </button>
      </div>
      <h3 class="collections-nav__header-title">
        <i class="icon-collections"></i>
        Collections
      </h3>
    </header>

    <div class="heading" :class="{ 'not-empty': isViewingCollectionItems }">
      <h4 v-if="isViewingCollectionItems && !editNameMode" class="collection-title">
        {{ collectionName }} ({{ numItemsInCollection }})
        <i class="far fa-pencil" @click.stop="startEditName"></i>
      </h4>
      <div v-if="isViewingCollectionItems && editNameMode" class="edit-name">
        <el-input
          ref="editCollectionNameField"
          v-model="tempName"
          @click.native.prevent.stop
          @keyup.esc="cancelEditName"
          @keyup.enter.native.prevent.stop="stopEditName"
          @blur="cancelEditName"></el-input>
      </div>
      <div class="menu-parent" v-if="!editNameMode && isViewingCollectionItems" @click.prevent.stop="">
        <el-button-group :class="{ 'disabled': viewingFirst || viewingLast }">
           <el-tooltip
            content="View previous item in this collection"
            placement="top"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            effect="light"
          >
            <el-button
              type="primary"
              icon="el-icon-arrow-up"
              :disabled="viewingFirst"
              @click.native="viewPreviousItem"
            ></el-button>
          </el-tooltip>
          <el-tooltip
            content="View next item in this collection"
            placement="top"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            effect="light"
          >
            <el-button
              type="primary"
              icon="el-icon-arrow-down"
              :disabled="viewingLast"
              @click.native="viewNextItem"
            ></el-button>
          </el-tooltip>
        </el-button-group>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import Validator from 'async-validator'
import { mapActions, mapGetters } from 'vuex'
import { COLLECTIONS } from 'src/store/storeModules'
import {
  GET_COLLECTION_BUSY,
  GET_COLLECTION,
  GET_COLLECTION_ITEMS,
  GET_COLLECTION_NAME,
  GET_COLLECTIONS,
  IS_VIEWING_COLLECTION_ITEMS
} from 'src/store/modules/collections/getters'
import { RESET_COLLECTION } from 'src/store/modules/collections/mutations'
import { LOAD_COLLECTIONS, RENAME_COLLECTION } from 'src/store/modules/collections/actions'

export default {
  name: 'collections-navigation',

  props: {
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
      collection: GET_COLLECTION,
      collectionBusy: GET_COLLECTION_BUSY,
      collectionItems: GET_COLLECTION_ITEMS,
      collectionName: GET_COLLECTION_NAME,
      collections: GET_COLLECTIONS,
      isViewingCollectionItems: IS_VIEWING_COLLECTION_ITEMS
    }),

    collectionId () {
      return _.get(this.collection, 'id', '')
    },

    collectionsLimit () {
      return this.isInsidePanel ? this.CONSTANTS.LIMIT.COLLECTIONS_IN_PANEL : this.CONSTANTS.LIMIT.COLLECTIONS
    },

    numCollections () {
      return this.collections ? this.collections.length : 0
    },

    numItemsInCollection () {
      return _.get(this.collection, 'num_items', 0)
    },

    viewingFirst () {
      const viewingNdx = this.collectionItems.findIndex(item => item.item_id === this.currentItemId)
      return viewingNdx === 0
    },

    viewingLast () {
      const viewingNdx = this.collectionItems.findIndex(item => item.item_id === this.currentItemId)
      return viewingNdx === this.numItemsInCollection - 1
    }
  },

  data () {
    return {
      editNameMode: false,
      tempName: ''
    }
  },

  mounted () {
    this.$watch('isViewingCollectionItems', (newVal, oldVal) => {
      this.editNameMode = false
      this.tempName = ''
    }, { immediate: true })
  },

  methods: {
    ...mapActions(COLLECTIONS, {
      doLoadCollections: LOAD_COLLECTIONS,
      renameCollection: RENAME_COLLECTION
    }),

    async backToOverview () {
      // need to reload collections here, not just removing the viewed collection, because the thumbnails and other details might have changed
      this.$store.commit(`${COLLECTIONS}/${RESET_COLLECTION}`)
      await this.loadCollections()
    },

    async loadCollections () {
      try {
        await this.doLoadCollections({
          limit: this.CONSTANTS.LIMIT.COLLECTIONS,
          limitItems: this.CONSTANTS.LIMIT.COLLECTION_ITEMS
        })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Unable to load collections',
          showClose: true,
          type: 'error'
        })
      }
    },

    viewPreviousItem () {
      if (this.currentItemId) {
        const currentIndex = this.collectionItems.findIndex(item => item.item_id === this.currentItemId)
        const nextItemId = _.get(this.collectionItems, '[' + (currentIndex - 1) + '].item_id')

        if (nextItemId) {
          // change route
          const to = {
            name: 'itemDetails',
            params: {
              id: nextItemId
            }
          }

          this.$router.push(to).catch(err => {})
        }
      }
    },

    viewNextItem () {
      if (this.currentItemId) {
        const currentIndex = this.collectionItems.findIndex(item => item.item_id === this.currentItemId)
        const nextItemId = _.get(this.collectionItems, '[' + (currentIndex + 1) + '].item_id')

        if (nextItemId) {
          // change route
          const to = {
            name: 'itemDetails',
            params: {
              id: nextItemId
            }
          }

          this.$router.push(to).catch(err => {})
        }
      }
    },

    cancelEditName () {
      this.editNameMode = false
    },

    startEditName () {
      this.editNameMode = true
      this.tempName = this.collectionName

      this.$nextTick(() => {
        this.$refs['editCollectionNameField'].$el.getElementsByTagName('input')[0].focus()
      })
    },

    async stopEditName () {
      this.tempName = this.tempName.trim()

      if (this.tempName !== '') {
        try {
          await this.renameCollection({ collectionId: this.collectionId, collectionName: this.tempName, limit: this.collectionsLimit })
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: `Unable to edit ${event.name} collection.`,
            showClose: true,
            type: 'error'
          })
        }
      }
      this.editNameMode = false
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';

  .nav {
    .heading {
      .edit-name {
        input {
          height: 30px;
        }
      }

      .el-button-group {
        .el-button {
          background-color: transparent;
          border: 0 none;
          padding: 0;

          &:first-child {
            margin-right: 10px;
          }

          i.far {
            color: @text-light;
            font-size: 16px;
          }

          &:hover {
            background-color: transparent;

            i,
            [class*=" el-icon-"],
            [class^=el-icon-] {
              color: @color-accent;
            }
          }
        }

        &.disabled {
          .is-disabled {
            i.far {
              color: @text-dark;
            }
          }
        }
      }
    }
  }
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';

.collections-nav__header {
  border-bottom: 1px solid @color-tone-medium;
  display: flex;
  justify-content: center;
  margin-bottom: 13px;
  padding-bottom: 13px;
  position: relative;

  .collections-nav__back {
    position: absolute;
    left: 0;
    top: -4px;

    > button {
      background-color: transparent;
      border: 0 none;
      border-radius: 0;
      color: @text-light;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      padding: 0;
      text-transform: uppercase;

      &:hover {
        color: @color-accent;
      }

      &:focus, &:active {
        outline: none;
      }
    }
  }

  .collections-nav__header-title {
    align-self: center;
    color: @color-base;
    font-size: 12px;
    font-weight: 700;
    margin: 0;
    padding: 0;
    text-transform: uppercase;
  }
}

.collection-title {
  font-size: 16px;
  font-weight: 300;
  margin: 0;
  padding: 0;
  text-transform: none;

  i.far {
    color: @text-light;
    cursor: pointer;
    font-size: 12px;
    margin-left: 6px;

    &:hover {
      color: @color-accent;
    }
  }
}

// navigation section at the top
.nav {
  width: 100%;

  .heading {
    align-items: center;
    display: flex;
    color: @color-base;

    &.not-empty {
      padding-bottom: 15px;
    }

    .menu-parent {
      margin-left: auto;
    } // .el-button-group

    .edit-name {
      flex-grow: 1;

      input {
        height: 9px;
      }
    }
  }
}
</style>
