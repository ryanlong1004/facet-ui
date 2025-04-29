<template>
  <div class="flat-description">
    <div class="description" v-if="!editMode">
      <span class="description-text" v-if="hasDescriptionText" :innerHTML.prop="descriptionText | highlightFilter({ insights: true, type: CONSTANTS.HIGHLIGHT_TYPES.DESCRIPTIONS })"></span>
      <span class="description-text" v-else>{{ noDescriptionMessage }}</span>
      <pencil-edit-button v-if="canEdit" :edit-mode="editMode" @on-click="toggleEditMode"></pencil-edit-button>
    </div>
    <input
      type="text"
      class="description-input"
      ref="edit-description-input"
      placeholder="Enter new description and press ENTER"
      v-if="editMode"
      v-model="newDescription"
      :disabled="descriptionUpdating"
      @click.stop
      @keyup.enter.stop="saveDescription"
      @keydown.esc="toggleEditMode"
    >
  </div>
</template>

<script>
  import _ from 'lodash'
  import { mapGetters } from 'vuex'

  import api from 'src/api'
  import { getAPIErrorMsg } from 'src/apiHelpers'
  import { CONSTANTS } from 'src/constants'
  import { SCOPES } from 'src/plugins/ScopeEnforcer'

  import PencilEditButton from 'src/components/global/PencilEditButton.vue'
  import VuexItemMixin from 'src/mixins/VuexItemMixin'

  // descriptions store
  import { DESCRIPTIONS, EDIT_MODE } from 'src/store/storeModules'
  import {
    ADD_DESCRIPTION,
    EDIT_DESCRIPTION
  } from 'src/store/modules/item/descriptions/actions'
  import { GET_EDIT_MODE, TOGGLE_EDIT_MODE, SET_EDIT_MODE } from 'src/store/modules/item/edit-mode'

  export default {
    name: 'flat-description',
    components: {
      PencilEditButton
    },
    mixins: [
      VuexItemMixin
    ],
    props: {
      noDescriptionMessage: {
        type: String,
        default: 'Add description...'
      },
      descriptionIndex: {
        type: Number,
        default: CONSTANTS.NO_SEGMENT_INDEX
      },
      descriptionImageIndex: {
        type: Number,
        default: CONSTANTS.NO_EMBEDDED_IMAGE_INDEX
      },
      descriptionMetaId: {
        type: String,
        default: ''
      },
      descriptionText: {
        type: String,
        default: ''
      },
      descriptionId: {
        type: String,
        default: ''
      },
      descriptionUpdating: {
        type: Boolean,
        default: false
      },
      editModeId: {
        type: String,
        default: ''
      },
      // whether or not to show the edit pencil
      showEdit: {
        type: Boolean,
        default: true
      }
    },
    mounted () {
      this.$watch('editMode', newVal => {
        if (newVal) {
          this.newDescription = this.descriptionText || ''
          this.$nextTick(() => {
            this.$refs['edit-description-input'].focus()
          })
        }
      })
    },
    data () {
      return {
        newDescription: this.descriptionText
      }
    },
    computed: {
      ...mapGetters(EDIT_MODE, {
        rawEditMode: GET_EDIT_MODE
      }),
      editMode () {
        return this.rawEditMode[this.editModeId] || false
      },
      hasDescriptionText () {
        return _.get(this.descriptionText, 'length', 0) > 0
      },
      canEdit () {
        return this.showEdit && this.$hasScope(SCOPES.EDIT_TAGS_DESCRIPTIONS)
      }
    },
    methods: {
      toggleEditMode () {
        this.$store.commit(`${EDIT_MODE}/${TOGGLE_EDIT_MODE}`, { id: this.editModeId })
      },
      async saveDescription (e) {
        if (this.newDescription) {
          try {
            if (!this.descriptionId) {
              await this.$store.dispatch(`${DESCRIPTIONS}/${ADD_DESCRIPTION}`, {
                segmentIndex: this.descriptionIndex,
                imageIndex: this.descriptionImageIndex,
                metaID: this.descriptionMetaId,
                itemType: this.itemType,
                newDescription: this.newDescription
              })
            } else {
              await this.$store.dispatch(`${DESCRIPTIONS}/${EDIT_DESCRIPTION}`, {
                segmentIndex: this.descriptionIndex,
                imageIndex: this.descriptionImageIndex,
                metaID: this.descriptionMetaId,
                descId: this.descriptionId,
                newDescription: this.newDescription
              })
            }
          } catch (err) {
            this.$message({
              duration: CONSTANTS.MESSAGE_DURATION,
              message: 'Error updating description',
              showClose: true,
              type: 'error'
            })
          } finally {
            this.$store.commit(`${EDIT_MODE}/${SET_EDIT_MODE}`, { id: this.editModeId, editMode: false })
          }
        }
      }
    }
  }
</script>

<style lang="less" scoped>
@import (reference) '../../../styles/_variables';
.flat-description {
  margin: 5px 0;
  .description {
    .description-text {
      color: @color-primary;
      font-size: 12px;
    }
  }
  .description-input {
    background-color: @color-tone-lighter;
    border: 0 none;
    display: block;
    color: @color-primary;
    font-size: 12px;
    height: 24px;
    padding: 6px;
    width: 100%;
  }
}
</style>
