<template>
  <div class="shared-collection">
    <header class="collection-header">
      <h1>Shared collection - "{{collection.name}}"</h1>
      <h3>{{byline}}</h3>
      <p>{{collection.num_items}} items in this collection <span class="error" v-if="numErroredFiles > 0">{{ numErroredFilesSummary }}</span></p>
      <el-button v-if="numErroredFiles === 0" type="primary" size="mini" @click="cloneCollection">Clone this collection</el-button>
    </header>
    <section class="collection-items">
      <search-result-item
        v-for="result in items"
        :key="result.itemId"
        :item-id="result.itemId"
        :root-id="result.rootId"
        :item-type="result.gm_item_type"
        :filename="result.name"
        :thumbnail="result.thumbnail"
        :last-analyzed="result.lastHarvested"
        :file-size="result.fileSize"
        :duration-time="result.durationTime"
        :hit-counts="result.hit_counts"
        :hide-selector="true"
      />
    </section>
  </div>
</template>

<script>
import _ from 'lodash'
import moment from 'moment'
import { pluralize } from 'humanize-plus'

import api from 'src/api'
import { getFilenameFromItemData } from 'src/item-helper'
import SearchResultItem from 'src/components/search/search-results/SearchResultItem.vue'

const getReactiveSearchResult = (result, hitCounts = {}) => {
  const thumb = _.get(result, 'thumbnail', {}) || {}
  const frameCount = _.get(thumb, 'frame_count', 0)
  return {
    itemId: result.id,
    rootId: result.root_id || result.id,
    gm_item_type: result.gm_item_type,
    hit_counts: hitCounts,
    name: getFilenameFromItemData(result),
    thumbnail: { ...thumb, frames: { count: frameCount } }
  }
}

export default {
  name: 'shared-collection',
  components: {
    SearchResultItem
  },
  beforeMount () {
    this.collectionId = this.$route.params.collectionId
    this.loadCollection(this.$route.params.collectionId)
  },
  data () {
    return {
      author: {},
      collectionId: '',
      collection: {},
      items: [],
      loadingCollection: false,
      loadingItems: false,
      numErroredFiles: 0
    }
  },
  computed: {
    byline () {
      if (this.author.email) {
        return `Created by ${this.author.email} on ${moment(this.collection.updated_at).format('dddd, MMMM Do YYYY')}`
      }
      return 'A user has shared a collection with you.'
    },
    numErroredFilesSummary () {
      return `(You do not have access to ${this.numErroredFiles} ${pluralize(this.numErroredFiles, 'file', 'files')})`
    }
  },
  methods: {
    async loadCollection (id) {
      this.loadingCollection = true
      try {
        const response = await api.loadCollection({ collectionId: id, limit: 1000 })
        const collection = _.get(response, 'collection', {}) || {}
        this.collection = collection

        this.loadAuthor(collection.user_id)

        const items = _.get(response, 'items', []) || []
        const itemIds = items.map(i => i.item_id)
        this.loadItems(itemIds)
      } catch (err) {
        console.error('error loading collection', err)
      } finally {
        this.loadingCollection = false
      }
    },
    async loadAuthor (userId) {
      try {
        const userResponse = await api.getUser(userId)
        this.author = userResponse
      } catch (err) {
        console.error('error loading author', err)
      }
    },
    async loadItems (itemIds = []) {
      this.loadingItems = true
      try {
        const response = await api.getBulkItems(itemIds)
        const responseItems = _.get(response, 'results', []) || []
        const items = []
        itemIds.forEach(itemId => {
          const itemErr = _.get(responseItems, `[${itemId}].error`, null)
          if (itemErr) {
            this.numErroredFiles++
          } else {
            const itemObj = _.get(responseItems, `[${itemId}].object`, {}) || {}
            if (itemObj) {
              items.push(getReactiveSearchResult(itemObj))
            }
          }
        })
        this.items = items
      } catch (err) {
        console.error('error loading items', err)
      } finally {
        this.loadingItems = false
      }
    },
    async cloneCollection () {
      try {
        const response = await api.cloneCollection({
          collectionId: this.collectionId,
          collectionName: `Copy of ${this.collection.name}`
        })
        const newId = _.get(response, 'id', null)
        if (newId) {
          this.$notify({
            title: 'Collection cloned',
            message: 'You can now edit your own version of this collection',
            type: 'success'
          });
          this.$router.push({
            name: this.CONSTANTS.ROUTES.CURATED.COLLECTIONS.COLLECTION.NAME,
            params: {
              id: newId
            }
          })
        }        
      } catch (err) {
        console.error(err)
        this.$notify({
          title: 'Error',
          message: 'Error cloning collection, please try again',
          type: 'error'
        })
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

@appHeaderHeight: 40px;

.shared-collection {
  .min-max-width(100%);
  .min-max-height(calc(100vh - @appHeaderHeight));
  background-color: @color-base;
  overflow: scroll;

  .collection-header {
    border-bottom: 1px solid @color-tone-lightest;
    margin: 20px;
    padding-bottom: 20px;
    width: 100%;
    h1 {
      color: @color-primary;
      font-family: @default-font-family-medium;
      font-size: 20px;
      font-weight: normal;
    }
    h3 {
      color: @color-tone-medium;
      font-size: 13px;
    }
    p {
      color: @color-tone-medium;
      font-size: 12px;
      span.error {
        color: @color-alert;
      }
    }
  }

  .collection-items {
    .flex-container();
    .min-max-width(100%);
    flex-wrap: wrap;  
    padding: 10px 20px;

    .search-result-item {
      margin: 0 10px 10px 0;
    }
  }
}
</style>
