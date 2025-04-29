<template>
  <div class="save-search">
    <div
      class="save-search-btn"
      @click="showSaveDialog">
      <i class="fas fa-save"></i> Save Search
    </div>
    <el-dialog
      :visible.sync="dialogSaveSearchVisible"
      :append-to-body="true"
      title="Save Search"
      class="save-search">
      <el-alert
        v-if="saveSearchError"
        :title="`Error saving search: ${saveSearchError}`"
        type="error"></el-alert>
      <p v-if="!isSearchSaved">Save the current search by entering a description and click save...</p>
      <p v-else class="confirmation-message"><i class="far fa-check-circle"></i> Your search was saved!</p>
      <el-input
        v-model="savedSearchName"
        @keyup.enter.native="doSaveSearch"
        size="mini"
        class="save-name"
         :disabled="isSearchSaved || saving"
        :class="{'error': nameError}">
      </el-input>
      <span slot="footer" class="dialog-footer">
        <el-button type="text" size="mini" @click="dialogSaveSearchVisible = false" :disabled="isSearchSaved || saving">Cancel</el-button>
        <el-button type="primary" size="mini" @click="doSaveSearch" :disabled="isSearchSaved || saving">SAVE</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import { SEARCH, SAVED_SEARCHES } from 'src/store/storeModules'
import {
  GET_SEARCH_POST_BODY
} from 'src/store/modules/search/getters'
import {
  SAVE_SEARCH
} from 'src/store/modules/saved-searches/actions'

export default {
  name: 'save-search',
  data () {
    return {
      dialogSaveSearchVisible: false,
      isSearchSaved: false,
      nameError: false,
      saving: false,
      saveSearchError: '',
      savedSearchName: '',
    }
  },
  computed: {
    ...mapGetters(SEARCH, {
      getSearchBody: GET_SEARCH_POST_BODY
    })
  },
  methods: {
    ...mapActions(SAVED_SEARCHES, {
      saveSearch: SAVE_SEARCH
    }),
    showSaveDialog () {
      this.saving = false
      this.isSearchSaved = false
      this.dialogSaveSearchVisible = true
    },
    async doSaveSearch () {
      if (!this.savedSearchName.length) {
        this.nameError = true
        return
      }
      this.saving = true
      try {
        const queryStr = encodeURIComponent(JSON.stringify(this.getSearchBody))
        await this.saveSearch({
          name: this.savedSearchName,
          params: queryStr
        })
        this.isSearchSaved = true
        setTimeout(() => {
          this.dialogSaveSearchVisible = false
        }, 3000)        
      } catch (err) {
        this.saveSearchError = err
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.save-search {
  .save-search-btn {
    .flex-container-center();
    color: @color-tone-darkest;
    cursor: pointer;
    font-family: @default-font-family-black;
    font-size: 10px;
    text-transform: uppercase;
    white-space: nowrap;
    > i {
      font-size: 12px;
      margin-right: 5px;
    }
    &:hover {
      color: @color-accent;
    }
  }
  p {
    margin: 0 0 10px 0;
    &.confirmation-message {
      color: @color-accent;
    }
  }
}
</style>
