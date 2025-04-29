<template>
  <div class="document-tags-descriptions" v-loading="tagsLoading || descriptionsLoading">
    <div v-if="!tagsLoading && !descriptionsLoading">
      <div class="empty-notification" v-if="!tags.length || !descriptions.length">No tags/descriptions found on this item.</div>
      <div v-else>
        <h3 class="section-title">Page Summary</h3>
        <section class="summary-wrapper">
          <div class="page-tags-descriptions">
            <flat-description
              v-if="currentPageDescriptions"
              no-description-message="No description found for the page summary"
              :description-index="currentPage"
              :description-image-index="-1"
              :description-meta-id="currentPageDescriptions.metaID"
              :description-text="currentPageDescriptions.description.text"
              :description-id="currentPageDescriptions.description.id"
              :edit-mode-id="currentPageHashID"
              :show-edit="false"
            >
            </flat-description>
            <!-- using the descriptions editMode on purpose for tags so they stay in sync -->
            <tag-collection
              v-if="currentPageTags"
              no-tags-message="No tags found for this page summary"
              :tag-collection-index="currentPage"
              :tag-collection-image-index="-1"
              :tag-collection-meta-id="currentPageTags.metaID"
              :tags="currentPageTags.tags"
              :edit-mode-id="currentPageHashID"
            >
            </tag-collection>
          </div>
          <div class="edit-button-wrapper" v-if="$hasScope(SCOPES.EDIT_TAGS_DESCRIPTIONS)">
            <pencil-edit-button :edit-mode="editMode[currentPageHashID]" @on-click="toggleEditMode(currentPageHashID)"></pencil-edit-button>
          </div>
        </section>
      </div>

      <h3 class="section-title" v-if="currentPageImages.length">Embedded Images</h3>

      <div v-for="(image, index) in currentPageImages" :key="image.imageID" class="image-row">
        <div :style="{ 'background-image': `url(${image.path})` }" class="image-wrapper"></div>
        <div class="image-tags-descriptions">
          <flat-description
            v-if="currentPageDescriptions"
            no-description-message="No description found for this embedded image"
            :description-index="currentPage"
            :description-image-index="index"
            :description-meta-id="image.imageID"
            :description-text="image.description.text"
            :description-id="image.description.id"
            :description-updating="image.description.updating"
            :edit-mode-id="image.imageID"
            :show-edit="false"
          >
          </flat-description>
          <!-- using the descriptions editMode on purpose for tags so they stay in sync -->
          <tag-collection
            v-if="currentPageTags"
            no-tags-message="No tags found in this image"
            :tag-collection-index="currentPage"
            :tag-collection-image-index="index"
            :tag-collection-meta-id="image.imageID"
            :tags="image.tags"
            :edit-mode-id="image.imageID"
          >
          </tag-collection>
        </div>
        <div class="edit-button-wrapper" v-if="$hasScope(SCOPES.EDIT_TAGS_DESCRIPTIONS)">
          <pencil-edit-button :edit-mode="editMode[image.imageID]" @on-click="toggleEditMode(image.imageID)"></pencil-edit-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import { SCOPES } from 'src/plugins/ScopeEnforcer'
import { CONSTANTS } from 'src/constants'
import PencilEditButton from 'src/components/global/PencilEditButton.vue'
import FlatDescription from 'src/components/item/flat-component/FlatDescription.vue'
import TagCollection from 'src/components/item/flat-component/TagCollection.vue'

import VuexItemMixin from 'src/mixins/VuexItemMixin'
import PlayheadMixin from 'src/mixins/PlayheadMixin'

import { TAGS, DESCRIPTIONS, EDIT_MODE } from 'src/store/storeModules'
import {
  GET_TAGS_LOADING,
  GET_TAGS_LOADING_ERROR,
  GET_ITEM_TAGS
} from 'src/store/modules/item/tags/getters'
import { SET_TAG_COLLECTION_EDIT_MODE } from 'src/store/modules/item/tags/mutations'
import {
  FETCH_TAGS,
  ADD_TAGS,
  DELETE_TAG
} from 'src/store/modules/item/tags/actions'
import {
  GET_DESCRIPTIONS_LOADING,
  GET_DESCRIPTIONS_LOADING_ERROR,
  GET_ITEM_DESCRIPTIONS
} from 'src/store/modules/item/descriptions/getters'
import { SET_DESCRIPTION_EDIT_MODE } from 'src/store/modules/item/descriptions/mutations'
import {
  FETCH_DESCRIPTIONS,
  EDIT_DESCRIPTION,
  ADD_DESCRIPTION
} from 'src/store/modules/item/descriptions/actions'
import { GET_EDIT_MODE, TOGGLE_EDIT_MODE } from 'src/store/modules/item/edit-mode'

export default {
  name: 'document-tags-descriptions',
  mixins: [
    VuexItemMixin,
    PlayheadMixin
  ],
  components: {
    PencilEditButton,
    FlatDescription,
    TagCollection
  },
  beforeMount () {
    this.$store.dispatch(`${TAGS}/${FETCH_TAGS}`)
    this.$store.dispatch(`${DESCRIPTIONS}/${FETCH_DESCRIPTIONS}`)
  },
  computed: {
    ...mapGetters(TAGS, {
      tagsLoading: GET_TAGS_LOADING,
      tagsLoadingError: GET_TAGS_LOADING_ERROR,
      tags: GET_ITEM_TAGS
    }),
    ...mapGetters(DESCRIPTIONS, {
      descriptionsLoading: GET_DESCRIPTIONS_LOADING,
      descriptionsLoadingError: GET_DESCRIPTIONS_LOADING_ERROR,
      descriptions: GET_ITEM_DESCRIPTIONS
    }),
    ...mapGetters(EDIT_MODE, {
      editMode: GET_EDIT_MODE
    }),
    currentPage () {
      return this.currentPlayheadTime
    },
    currentPageHashID () {
      return `doctagsdescriptionspage${this.currentPage}`
    },
    currentPageTags () {
      return this.tags[this.currentPlayheadTime]
    },
    currentPageDescriptions () {
      return this.descriptions[this.currentPlayheadTime]
    },
    currentPageImages () {
      const imagesWithTags = _.get(this.currentPageTags, 'images', []) || []
      // marry descriptions to the tags
      const married = imagesWithTags.map(img => {
        const description = _.get(this.currentPageDescriptions, `images[${img.imageIndex}].description`)
        return _.assign(
          {}, img, { description }
        )
      })
      return married
    }
  },
  methods: {
    toggleEditMode (id) {
      this.$store.commit(`${EDIT_MODE}/${TOGGLE_EDIT_MODE}`, {
        id
      })
    }
  }
}
</script>

<style lang="less">
@import (reference) '../../../styles/_variables.less';

.document-tags-descriptions {
  display: flex;
  flex-direction: column;
  height: auto;
  .section-title {
    background-color: @color-tone-lighter;
    font-size: 10px;
    font-weight: 700;
    margin: 0;
    padding: 5px 20px;
    text-transform: uppercase;
  }
  .summary-wrapper {
    display: flex;
    justify-content: space-between;
    padding: 10px 20px 20px 20px;
    .page-tags-descriptions {
      flex: 1 1 auto;
    }
  }
  .empty-notification {
    color: @color-tone-medium;
    font-size: 12px;
    font-style: italic;
    padding: 20px;
    text-align: left;
  }
  .summary-wrapper, .image-row {
    border-bottom: 1px solid @color-tone-lighter;
  }
  .image-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 20px;
    &:last-child {
      border-bottom: 0 none;
    }
    .image-wrapper {
      background-position: center center;
      background-repeat: no-repeat;
      background-size: contain;
      flex: 0 0 100px;
      height: 100px;
      width: 100px;
    }
    .image-tags-descriptions {
      flex: 1 1 auto;
      padding: 0 15px;
    }
  }
  .edit-button-wrapper {
    align-items: top;
    flex: 0 0 24px;
    margin-left: 20px;
  }
}
</style>
