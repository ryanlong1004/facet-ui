<template>
  <div class="item-details ocr-item" @click.stop="$emit('item-clicked')">
    <time-code-label v-if="isVideo" :start-at='startAt'/>
    <div v-if="isVideo" class="arrow-left"></div>
    <div :class="(isEditingOcr)? 'editing-elements' : 'elements'">
      <span v-for="(phrase, phraseIndex) in phrases" :key="phrase.id" class="phrase">
        <span
          class="text"
          :innerHTML.prop="phrase.text | highlightFilter({ insights: true, type: CONSTANTS.HIGHLIGHT_TYPES.OCR })"
          :contenteditable="isEditingOcr"
          @blur="editAction($event, phrase, phraseIndex)"
          @keydown="editAction($event, phrase, phraseIndex)"
          @dblclick="forcePhraseFocus($event)"
        >{{ phrase.text }}</span>
        <span class="phrase-padding"></span>
      </span>
    </div>
    <div class="editing-commands" v-if="$hasScope(SCOPES.EDIT_OCR)">
      <button
        v-if="isEditingOcr"
        tabindex="0"
        type="button"
        class="btn-save"
        @keydown.enter.stop.prevent="leaveEditMode($event)"
        @click.stop.prevent="leaveEditMode($event)"
        @blur.prevent="saveButtonUnfocus($event)"
      ><i class="far fa-check-circle"></i></button>
      <button
        v-else
        tabindex="0"
        type="button"
        class="btn-edit"
        @click="editToggle($event)"
      ><i class="far fa-pencil"></i></button>
    </div>
  </div>
</template>

<script>
import { AllHtmlEntities } from 'html-entities'
import { mapGetters } from 'vuex'
import { CONSTANTS } from 'src/constants'
import api from 'src/api'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import * as storeModules from 'src/store/storeModules'
import { EDIT_OCR, EDIT_OCR_IMAGE, RESET_OCR_EDITING_INDEX } from 'src/store/modules/item/ocrs/actions'
import { GET_OCR_EDITING_INDEX, GET_ITEM_OCR } from 'src/store/modules/item/ocrs/getters'
import { SET_OCR_EDITING_INDEX } from 'src/store/modules/item/ocrs/mutations'
import TimeCodeLabel from './TimeCodeLabel'

export default {
  name: 'ocr-item',
  components: {TimeCodeLabel},
  mixins: [
    VuexItemMixin
  ],
  props: {
    active: {
      type: Boolean,
      default: false
    },
    imageIndex: {
      type: Number,
      default: CONSTANTS.NO_EMBEDDED_IMAGE_INDEX
    },
    segmentIndex: {
      type: Number,
      default: null
    },
    phrases: {
      type: Array,
      required: true
    },
    displayTime: {
      type: String,
      required: true
    },
    startAt: {
      type: Number,
      required: true
    }
  },

  data () {
    return {
      segmentIndexData: null
    }
  },
  // TODO: kill these, should come in via props
  created () {
    // set the segment index to 0 for image detail pages
    this.segmentIndexData = this.isImage ? CONSTANTS.INDEX_FOR_IMAGE_DATA : this.segmentIndex
  },
  updated () {
    // update the segmentIndexData when component gets a new segmentIndex value from prop
    this.segmentIndexData = this.isImage ? CONSTANTS.INDEX_FOR_IMAGE_DATA : this.segmentIndex
  },

  computed: {
    ...mapGetters(storeModules.OCR, {
      ocrEditingIndex: GET_OCR_EDITING_INDEX
    }),
    segmentOcrs () {
      // encode ocr text for safe use in the DOM
      let segmentOcr = this.phrases
      let segmentOcrEncoded = []
      // check if imageIndex is >= 0 and use it in the images array
      let raw = segmentOcr.ocrs
      if (this.imageIndex >= 0) {
        raw = segmentOcr.images[this.imageIndex].ocrs
      }
      segmentOcrEncoded = raw.map(phrase => {
        return {
          id: phrase.id,
          text: AllHtmlEntities.encode(phrase.text)
        }
      })
      return _.assign({}, segmentOcr, { ocrs: segmentOcrEncoded })
    },
    isEditingOcr () {
      return (this.ocrEditingIndex === this.segmentIndexData)
    }
  },
  methods: {
    editAction (e, phrase, phraseIndex) {
      let originalText = _.get(this.phrases, `[${phraseIndex}].text`, '')
      let originalTextDecoded = AllHtmlEntities.decode(originalText)

      // Document pages with OCR will have an images array, we provide the imageIndex so that we associate
      // the data with the appropriate image in the document
      // if (this.isDocument) {
      //   originalText = this.phrases[phraseIndex].images[this.imageIndex].ocrs[phraseIndex].text
      //   originalTextDecoded = AllHtmlEntities.decode(originalText)
      // }

      let isUserEdited = e.target.innerText !== originalText &&
                         e.target.innerText !== originalTextDecoded

      if (e.type === 'keydown') {
        // stop keydown events from bubbling up;
        // like stopping the space key from starting the video player
        e.stopPropagation()
        if (e.key === 'Escape') {
          // throw away any current edit so it does not persist to the blur event
          // replace target's innerText with value from the store
          e.target.innerText = originalText
          this.$store.dispatch(`${storeModules.OCR}/${RESET_OCR_EDITING_INDEX}`)

        } else if (e.key === 'Enter') {
          // disallow adding line breaks in OCR phrases
          e.preventDefault()
          // check if there was an edit by compairing it with the current text
          if (isUserEdited) {
            this.editSave(e, phrase, this.segmentIndexData)
          }
          this.$store.dispatch(`${storeModules.OCR}/${RESET_OCR_EDITING_INDEX}`)

        } else if (e.key === 'Tab' && e.shiftKey) {
          // if shift-tabbing from first phrase, kill it (to keep positioned on first phrase)
          const firstEl = this.$el.querySelector('.editing-elements .phrase:first-child > .text')
          if (firstEl === e.target) {
            e.preventDefault()
          }
        }
      }
      // check if there was an edit by compairing it with the current text from the store
      if (e.type === 'blur' &&
        isUserEdited &&
        this.ocrEditingIndex === this.segmentIndexData) { // cancel edit if user scrolls during edit (this matches other editing behavior)
        // save OCR edit
        this.editSave(e, phrase, this.segmentIndexData)
      }
    },
    editSave (e, phrase, segmentIndex) {
      try {
        if (this.isImage) {
          this.$store.dispatch(`${storeModules.OCR}/${EDIT_OCR_IMAGE}`, {
            itemType: this.itemType,
            imageIndex: this.imageIndex,
            ocrID: phrase.id,
            newText: e.target.textContent
          })
        } else {
          this.$store.dispatch(`${storeModules.OCR}/${EDIT_OCR}`, {
            itemType: this.itemType,
            segmentIndex: segmentIndex,
            imageIndex: this.imageIndex,
            ocrID: phrase.id,
            newText: e.target.textContent
          })
        }
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'There was an error editing the OCR.',
          showClose: true,
          type: 'error'
        })
        console.error(err)
      }
    },
    forcePhraseFocus (e) {
      this.$store.commit(`${storeModules.OCR}/${SET_OCR_EDITING_INDEX}`, this.segmentIndexData)
      this.$nextTick(() => {
        e.target.focus()
      })
    },
    editToggle () {
      this.$store.commit(`${storeModules.OCR}/${SET_OCR_EDITING_INDEX}`, this.segmentIndexData)
      this.$nextTick(this.focusFirstPhrase)
    },
    leaveEditMode () {
      this.$store.commit(`${storeModules.OCR}/${SET_OCR_EDITING_INDEX}`, null)
    },
    saveButtonUnfocus () {
      this.focusFirstPhrase()
    },
    focusFirstPhrase () {
      const firstEl = this.$el.querySelector('.editing-elements .phrase:first-child > .text')
      if (firstEl) {
        firstEl.focus()
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '../../../styles/_variables';
@import (reference) '../../../styles/_mixins';
.ocr-document-content {
  white-space: pre-wrap;
}
.item-details.ocr-item {
  .flex-box();
  width: 100%;
  .editing-commands {
    margin-left: auto;
    .flex-container-column();
    button {
      background-color: transparent;
      border: 0 none;
      border-radius: 50%;
      cursor: pointer;
      margin-left: 5px;
      text-align: center;
      i.far {
        color: @header-color;
        font-size: 1rem;
        font-weight: normal;
      }
      &:hover {
        i.far {
          color: darken(@header-color, 30%);
        }
      }
      &:focus {
        i.far {
          color: @color-accent;
        }
      }
      &:first-child {
        margin-left: 0;
      }
    } // button
  }
  .editing-elements span.phrase {
    .text {
      &:hover {
        background-color: @highlight-edit-hover;
        cursor: text;
      }
      &:focus {
        background-color: @highlight-edit-focus;
      }
      display: inline-block;
      min-width: 5px;
    }
  }
}
</style>
