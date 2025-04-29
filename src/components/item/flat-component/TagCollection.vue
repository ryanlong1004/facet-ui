<template>
  <div class="tag-collection">
    <div v-if="!tags.length" class="empty-notification">
      {{ noTagsMessage }}
    </div>
    <div v-else class="tags">
      <div v-for="tag in tags" class="tag" :key="tag.id">
        <span :innerHTML.prop="tag.text | highlightFilter({ insights: true, type: CONSTANTS.HIGHLIGHT_TYPES.TAGS })"></span>&nbsp;({{ tag.confidence }}%)
        <button
          class="delete-tag-button"
          v-if="canEdit"
          @click.stop="deleteTag(tag.text)">
          <i class="far fa-times"></i>
        </button>
      </div>
    </div>
    <input
      type="text"
      placeholder="enter new tags seperated by commas and press enter"
      class="tags-input"
      v-if="canEdit"
      v-model="tagsToAdd"
      @click.stop
      @keyup.enter.stop="addNewTags"
    >
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters } from 'vuex'
import { CONSTANTS } from 'src/constants'
import { SCOPES } from 'src/plugins/ScopeEnforcer'
import VuexItemMixin from 'src/mixins/VuexItemMixin'

import { TAGS, EDIT_MODE } from 'src/store/storeModules'
import { SET_TAG_COLLECTION_EDIT_MODE } from 'src/store/modules/item/tags/mutations'
import {
  DELETE_TAG,
  ADD_TAGS
} from 'src/store/modules/item/tags/actions'
import { GET_EDIT_MODE, TOGGLE_EDIT_MODE } from 'src/store/modules/item/edit-mode'

export default {
  name: 'tag-collection',
  mixins: [VuexItemMixin],
  props: {
    noTagsMessage: {
      type: String,
      default: 'No tags detected'
    },
    tagCollectionIndex: {
      type: Number,
      default: CONSTANTS.NO_SEGMENT_INDEX
    },
    tagCollectionImageIndex: {
      type: Number,
      default: CONSTANTS.NO_EMBEDDED_IMAGE_INDEX
    },
    tagCollectionMetaId: {
      type: String,
      default: ''
    },
    tags: {
      type: Array,
      default: () => []
    },
    editModeId: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      SCOPES,
      tagsToAdd: ''
    }
  },
  computed: {
    ...mapGetters(EDIT_MODE, {
      rawEditMode: GET_EDIT_MODE
    }),
    editMode () {
      return this.rawEditMode[this.editModeId]
    },
    canEdit () {
      return this.editMode && this.$hasScope(SCOPES.EDIT_TAGS_DESCRIPTIONS)
    }
  },
  methods: {
    toggleEditMode () {
      this.commit(`${EDIT_MODE}/${TOGGLE_EDIT_MODE}`, { id: this.editModeId })
    },
    async deleteTag (tagName) {
      try {
        await this.$store.dispatch(`${TAGS}/${DELETE_TAG}`, {
          index: this.tagCollectionIndex,
          imageIndex: this.tagCollectionImageIndex,
          metaID: this.tagCollectionMetaId,
          tagName
        })
      } catch (err) {
        console.error(err)
      }
    },
    async addNewTags () {
      const currentTags = this.tags.map(t => {
        return t.text
      })
      let newTags = []
      const tagsA = this.tagsToAdd.split(',')
      _.each(tagsA, t => {
        t = t.trim()
        if ((currentTags.indexOf(t) < 0) && (newTags.indexOf(t) < 0) && (t.length >= 2)) {
          newTags.push(t)
        }
      })
      if (newTags.length) {
        try {
          await this.$store.dispatch(`${TAGS}/${ADD_TAGS}`, {
            index: this.tagCollectionIndex,
            imageIndex: this.tagCollectionImageIndex,
            metaID: this.tagCollectionMetaId,
            tags: newTags
          })
          this.tagsToAdd = ''
        } catch (err) {
          console.error('error adding tags', err)
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'Error adding new tags, please try again',
            showClose: true,
            type: 'error'
          })
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '../../../styles/_variables.less';

.empty-notification {
  color: @color-tone-medium;
  font-size: 12px;
  font-style: italic;
  padding: 5px 0;
  text-align: left;
}
.tags-input {
  background-color: @color-tone-lighter;
  border: 0 none;
  display: block;
  color: @color-primary;
  font-size: 12px;
  margin-top: 5px;
  padding: 6px;
  width: 100%;
}
</style>
