<template>
  <div class="collections-panel">
    <div v-if="!isBusy" class="collections-data">
      <collections-navigation :is-inside-panel="true" :current-item-id="currentItemId"></collections-navigation>

      <button
        v-if="!isViewingCollectionItems"
        @click.prevent.stop="createNew()"
        class="create-new"
      >
        + Create New Collection
      </button>

      <template v-if="collections.length">
        <collections-listing
          v-if="!isViewingCollectionItems"
          :is-inside-panel="true"
          @handle-collection="handleCollectionClickInPanel"
        ></collections-listing>

        <collection-items
          v-if="isViewingCollectionItems"
          :collection-id="collection.id"
          :current-item-id="currentItemId"
          :is-inside-panel="true"
          @handle-asset="handleAssetClick"
        ></collection-items>
      </template>
    </div>

    <div v-else class="state-overlay thinking-overlay">
      <div class="spinner-div" v-loading="isBusy"></div>
    </div>

    <el-dialog title="Create new collection" :visible.sync="createNewFormVisible">
      <el-form :model="form" ref="createNewForm" @submit.native.prevent>
        <el-form-item
          class="new-collection-input"
          label="Name"
          prop="newCollectionName"
          :rules="{ required: true, message: 'Name is required', trigger: 'focus' }"
        >
          <el-input
            ref="createNewForm-nameInput"
            v-alphanumeric-input
            v-model="form.newCollectionName"
            @keyup.native.enter.prevent.stop="submitAddCollection"
          ></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitAddCollection" :disabled="form.newCollectionName === ''">Create</el-button>
        <el-button type="text" @click="closeAddCollectionDialog">Cancel</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import { COLLECTIONS } from 'src/store/storeModules'
import {
  GET_COLLECTION_BUSY,
  GET_COLLECTION,
  GET_COLLECTIONS,
  GET_COLLECTIONS_BUSY,
  IS_VIEWING_COLLECTION_ITEMS
} from 'src/store/modules/collections/getters'
import { RESET_COLLECTION } from 'src/store/modules/collections/mutations'
import {
  CREATE_NEW_COLLECTION,
  LOAD_COLLECTION,
  LOAD_COLLECTIONS
} from 'src/store/modules/collections/actions'

import CollectionItems from 'src/components/collections/CollectionItems'
import CollectionsListing from 'src/components/collections/CollectionsListing'
import CollectionsNavigation from 'src/components/collections/CollectionsNavigation'

import AlphanumericInput from 'src/directives/alphanumeric-input.directive'

export default {
  name: 'collections-panel',

  components: {
    CollectionItems,
    CollectionsListing,
    CollectionsNavigation
  },

  directives: {
    AlphanumericInput
  },

  computed: {
    ...mapGetters(COLLECTIONS, {
      collection: GET_COLLECTION,
      collectionBusy: GET_COLLECTION_BUSY,
      collections: GET_COLLECTIONS,
      collectionsBusy: GET_COLLECTIONS_BUSY,
      isViewingCollectionItems: IS_VIEWING_COLLECTION_ITEMS
    }),

    currentItemId () {
      return _.get(this.$route, 'params.id', '')
    },

    isBusy () {
      return this.collectionBusy || this.collectionsBusy
    }
  },

  props: {
    open: Boolean
  },

  data () {
    return {
      createNewFormVisible: false,
      form: {
        newCollectionName: ''
      }
    }
  },

  mounted () {
    this.$watch('open', async (newVal, oldVal) => {
      this.$store.commit(`${COLLECTIONS}/${RESET_COLLECTION}`)

      if (this.open) {
        await this.loadCollections()
      }
    }, { immediate: true })
  },

  methods: {
    ...mapActions(COLLECTIONS, {
      doAddCollection: CREATE_NEW_COLLECTION,
      doLoadCollection: LOAD_COLLECTION,
      doLoadCollections: LOAD_COLLECTIONS
    }),

    closeAddCollectionDialog () {
      this.createNewFormVisible = false
      this.form.newCollectionName = ''
      this.$nextTick(() => {
        this.$refs['createNewForm'].clearValidate()
      })
    },

    createNew () {
      this.createNewFormVisible = true
      this.$nextTick(() => this.$refs['createNewForm-nameInput'].focus())
    },

    handleAssetClick (itemId) {
      this.$router.push({
        name: 'itemDetails',
        params: { id: itemId }
      }).catch(err => {})
    },

    async loadCollections () {
      try {
        await this.doLoadCollections({
          limit: this.CONSTANTS.LIMIT.COLLECTIONS,
          limitItems: this.CONSTANTS.LIMIT.COLLECTION_ITEMS_MAX
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

    handleCollectionClickInPanel (collectionId) {
     this.doLoadCollection({ collectionId, limit: this.CONSTANTS.LIMIT.COLLECTION_ITEMS_MAX })
    },

    submitAddCollection () {
      this.$refs['createNewForm'].validate(async valid => {
        if (valid) {
          try {
            await this.doAddCollection(this.form.newCollectionName)
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: `${this.form.newCollectionName} collection created.`,
              showClose: true,
              type: 'success'
            })
            this.closeAddCollectionDialog()
          } catch (err) {
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: `Unable to create ${this.form.newCollectionName} collection.`,
              showClose: true,
              type: 'error'
            })
          }
        }
      })
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.state-overlay {
  &.thinking-overlay {
    .spinner-div {
      .el-loading-mask {
        background-color: @color-dark;
        height: calc(~'100vh - 40px');
        opacity: .85;
        top: 0;

        .el-loading-spinner {
          left: 130px;
          top: 15%;
          width: auto;

          .path {
            stroke: @color-base;
          }
        }
      }
    }
  }
}

.new-collection-input {
  margin-bottom: 0;
}
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.collections-panel {
  .flex-container-column();
  height: calc(~'100vh - 70px');
  margin: 15px;
  position: relative;

  .collections-data {
    .flex-container-column();
    width: 100%;
  }

  .create-new {
    background-color: transparent;
    border: 0 none;
    color: @color-base;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 15px;
    padding: 10px;
    text-align: center;
    text-transform: uppercase;
    width: 100%;

    &:hover {
      color: @primary-button-color;
    }

    &:focus, &:active {
      outline: none;
    }
  }

  .state-overlay {
    .abs-pos(-15px, 0, auto, -15px);
    .flex-container-column();
    background: @translucent-black;
    height: calc(~'100vh - 40px');
    width: 113%;

    .el-button {
      align-self: center;
      font-size: 12px;
    }
  }
}
</style>
