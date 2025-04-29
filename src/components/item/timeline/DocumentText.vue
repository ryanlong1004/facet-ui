<template>
  <div class="document-text" v-loading="loading">
    <div v-if="!loading">
      <div v-if="currentPageText.html">
        <span :innerHTML.prop="currentPageText.html | highlightFilter({ insights: true })" class="text-with-linebreaks"></span>
      </div>
      <div v-else>
        <p class="empty-notification">No text found on this page</p>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapGetters } from 'vuex'

import VuexItemMixin from 'src/mixins/VuexItemMixin'
import PlayheadMixin from 'src/mixins/PlayheadMixin'
import { DOCUMENT_TEXT } from 'src/store/storeModules'
import {
  GET_DOCUMENT_TEXT_LOADING,
  GET_DOCUMENT_TEXT_LOADING_ERROR,
  GET_ITEM_DOCUMENT_TEXT
} from 'src/store/modules/item/document-text/getters'
import { FETCH_DOCUMENT_TEXT } from 'src/store/modules/item/document-text/actions'

const PLACEHOLDER_TEXT = { html: '' }

export default {
  name: 'document-text',

  mixins: [
    VuexItemMixin,
    PlayheadMixin
  ],

  beforeMount () {
    this.fetchDocumentText()
  },

  computed: {
    ...mapGetters(DOCUMENT_TEXT, {
      loading: GET_DOCUMENT_TEXT_LOADING,
      loadingError: GET_DOCUMENT_TEXT_LOADING_ERROR,
      documentText: GET_ITEM_DOCUMENT_TEXT
    }),

    currentPageText () {
      return this.documentText[this.currentPlayheadTime] || PLACEHOLDER_TEXT
    }
  },

  methods: {
    ...mapActions(DOCUMENT_TEXT, {
      fetchDocumentText: FETCH_DOCUMENT_TEXT
    })
  }
}
</script>

<style lang="less" scoped>
@import (reference) '../../../styles/_variables.less';

.document-text {
  padding: 20px;
  .text-with-linebreaks {
    white-space: pre-wrap;
  }
  .empty-notification {
    color: @color-tone-medium;
    font-size: 12px;
    font-style: italic;
    margin: 0;
    padding: 0;
    text-align: left;
  }
}
</style>
