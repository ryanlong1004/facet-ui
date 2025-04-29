<template>
  <div>
    <div class="collections-wrapper">
      <collections-listing @handle-collection="handleCollectionClick"></collections-listing>

      <div v-if="!collectionBusy" class="collection-content">
        <div v-if="numItemsInCollection > 0">
          <collection-items
            :collection-id="collection.id"
            :viewed-collection-id="viewedCollectionId"
            @handle-asset="handleAssetClick"
          ></collection-items>
        </div>
        <p v-else class="no-results">Please add some <router-link :to="{ name: CONSTANTS.ROUTES.SEARCH.NAME }">items</router-link> to the <b>{{ collection.name }}</b> collection.</p>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import { COLLECTIONS } from 'src/store/storeModules'
import { GET_COLLECTION_BUSY, GET_COLLECTION } from 'src/store/modules/collections/getters'

import CollectionsListing from 'src/components/collections/CollectionsListing'
import CollectionItems from 'src/components/collections/CollectionItems'

export default {
  name: 'collections-collection',

  components: {
    CollectionItems,
    CollectionsListing
  },

  computed: {
    ...mapGetters(COLLECTIONS, {
      collection: GET_COLLECTION,
      collectionBusy: GET_COLLECTION_BUSY
    }),

    numItemsInCollection () {
      return _.get(this.collection, 'items.length', 0)
    },

    viewedCollectionId () {
      return _.get(this.$route, 'params.id', '')
    }
  },

  methods: {
    handleAssetClick (itemId) {
      this.$router.push({
        name: 'itemDetails',
        params: { id: itemId }
      }).catch(err => {})
    },

    handleCollectionClick (collectionId) {
      if (collectionId !== this.viewedCollectionId) {
        this.$router.push({
          name: this.CONSTANTS.ROUTES.CURATED.COLLECTIONS.COLLECTION.NAME,
          params: { id: collectionId }
        }).catch(err => {})
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.collections-wrapper {
  .flex-box();
  background: @color-base;

  .pagination {
    .el-button {
      [class*=" el-icon-"],
      [class^=el-icon-] {
        display: none;

        + span {
          margin: 0;
        }
      }
    }
  }

  .collection-content {
    height: calc(~'100vh - 74px');
    min-width: 725px;
    overflow-y: auto;
    padding: 20px;
    width: 100%;

    .no-results {
      color: @color-tone-medium;
      font-size: 12px;
      font-style: italic;
    }

    .pagination {
      .el-button {
        [class*=" el-icon-"],
        [class^=el-icon-] {
          display: none;
        }
      }
    }
  }
}
</style>
