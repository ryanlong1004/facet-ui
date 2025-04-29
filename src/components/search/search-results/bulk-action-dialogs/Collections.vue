<template>
  <div v-loading="isBusy">
    <h2>Choose one or more collections to add the selected {{ selectedItemCountHumanized }} to:</h2>
    <el-select
      :disabled="isBusy"
      collapse-tags
      multiple
      no-data-text="No existing collections, please create one first then return"
      popper-class="collections-dropdown"
      v-model="selectedCollections">
      <el-option
        v-for="collection in collections"
        :key="collection.id"
        :label="collection.name"
        :value="collection.id">
      </el-option>
    </el-select>
    <el-button size="mini" type="primary" @click="addToCollections" :disabled="isButtonDisabled"><i class="fas fa-check"></i> {{ buttonText }}</el-button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { pluralize } from 'humanize-plus'

import { BULK_ACTIONS, COLLECTIONS } from 'src/store/storeModules'
import {
  //getters
  IS_BUSY,
  GET_SELECTED_ITEMS,
  // actions
  ADD_ITEMS_TO_COLLECTIONS
} from 'src/store/modules/bulk-actions'
import {
  GET_COLLECTIONS
} from 'src/store/modules/collections/getters'
import {
  LOAD_COLLECTIONS
} from 'src/store/modules/collections/actions'

export default {
  name: 'bulk-collections',
  beforeMount () {
    this.fetchCollections({ limit: this.CONSTANTS.LIMIT.COLLECTIONS_MAX, listingOnly: true })
  },
  data () {
    return {
      selectedCollections: []
    }
  },
  computed: {
    ...mapGetters(BULK_ACTIONS, {
      isBusy: IS_BUSY,
      selectedItems: GET_SELECTED_ITEMS
    }),
    ...mapGetters(COLLECTIONS, {
      collections: GET_COLLECTIONS
    }),
    buttonText () {
      return `Add to ${pluralize(this.selectedCollections.length, 'collection', 'collections')}`
    },
    isButtonDisabled () {
      return this.isBusy || !this.selectedCollections.length
    },
    selectedItemCount () {
      return this.selectedItems.length
    },
    selectedItemCountHumanized () {
      return `${this.selectedItemCount} ${pluralize(this.selectedItemCount, 'file', 'files')}`
    }
  },
  methods: {
    ...mapActions(BULK_ACTIONS, {
      doAddToCollections: ADD_ITEMS_TO_COLLECTIONS
    }),
    ...mapActions(COLLECTIONS, {
      fetchCollections: LOAD_COLLECTIONS
    }),
    async addToCollections () {
      try {
        await this.doAddToCollections(this.selectedCollections)
        this.$notify({
          title: 'Success',
          message: `Files added to ${this.selectedCollections.length} ${this.selectedCollections.length === 1 ? 'collection' : 'collections' }`,
          type: 'success'
        });
      } catch (err) {
        console.error(err)
        this.$notify({
          title: 'Error',
          message: 'Error adding files to collection(s), please try again',
          type: 'error'
        })
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.el-select {
  margin-bottom: 20px;
  width: 100%;
}
</style>
