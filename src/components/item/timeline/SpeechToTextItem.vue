<template>
  <div class="item-details speech-to-text-item">
    <time-code-label :start-at='sttItem.start_at'/>
    <header class="stt-item__header">
      <div
        class="stt-item--no-edit"
        v-if="!editMode"
        :innerHTML.prop="sttItem.text | highlightFilter({ insights: true, type: CONSTANTS.HIGHLIGHT_TYPES.SPEECH_TO_TEXT })" ref="highlight"
      ></div>
      <textarea
        tabindex
        v-if="editMode"
        class="stt-item--edit"
        :style="{width: '100%', height: editHeight}"
        placeholder="Enter new content and press ENTER to save changes"
        :data-s2tid="sttItemId"
        :id="'stt-input-' + startTimeId"
        :value="newText"
        @focus="onFocus($event)"
        @keydown.enter="save($event)"
        @keydown.esc="cancelEdit"
        @blur="cancelEdit">
      </textarea>
      <div class="editing-commands" v-if="$hasScope(SCOPES.EDIT_S2T)">
        <el-tooltip placement="top" content="Press ENTER to save changes" v-if="!editMode" :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
          <button
            tabindex="-1"
            type="button"
            class="btn-edit"
            @click.stop="edit($event)">
              <i class="far fa-pencil"></i>
          </button>
        </el-tooltip>
        <el-popconfirm
          title="Are you sure you want to delete this Speech-to-text entry?"
          confirm-button-text="Delete"
          cancel-button-text="Cancel"
          @onConfirm="deleteLine"> <!-- note, @on-confirm does not work -->
          <el-tooltip
            slot="reference"
            placement="top"
            content="Delete this entry"
            v-if="!editMode"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
            <button
              tabindex="-1"
              type="button"
              class="btn-edit">
                <i class="far fa-times-circle"></i>
            </button>
          </el-tooltip>
        </el-popconfirm>
      </div>
    </header>
  </div>
</template>

<script>
import _ from 'lodash'
import {mapGetters, mapActions} from 'vuex'

import api from 'src/api'
import { getAPIErrorMsg } from 'src/apiHelpers'

import VuexItemMixin from 'src/mixins/VuexItemMixin'

// s2t store
import {S2T} from 'src/store/storeModules'
import { GET_ACTIVE_S2T_TRANSCRIPT } from 'src/store/modules/item/s2t/getters'
import { EDIT_S2T, DELETE_S2T_LINE } from 'src/store/modules/item/s2t/actions'
import TimeCodeLabel from './TimeCodeLabel'

export default {
  name: 'speech-to-text-item',
  components: {TimeCodeLabel},
  props: {
    clickCallback: Function,
    sttItemId: {
      type: String,
      required: true
    }
  },
  mixins: [
    VuexItemMixin
  ],

  data () {
    return {
      editHeight: 0,
      editMode: false,
      newText: ''
    }
  },
  computed: {
    ...mapGetters(S2T, {
      sourceTranscript: GET_ACTIVE_S2T_TRANSCRIPT
    }),
    transcript () {
      return _.get(this, 'sourceTranscript.transcript', []) || []
    },
    sttItem () {
      return _.get(_.filter(this.transcript, stt => {
        return stt.id === this.sttItemId
      }), '[0]', {})
    },
    text () {
      return this.sttItem.text
    },
    displayTime () {
      return this.sttItem.displayTime
    },
    startTimeId () {
      return this.sttItem.start_at.toString().replace(/./g, '')
    }
  },
  methods: {
    ...mapActions(S2T, {
      doDeleteLine: DELETE_S2T_LINE
    }),
    onFocus ($event) {
      this.$emit('item-clicked')
    },
    deleteLine () {
      this.doDeleteLine(this.sttItemId)
    },
    edit ($event) {
      let valueBox = this.$el.querySelector('.stt-item--no-edit')
      this.editHeight = Math.max(22, (valueBox.offsetHeight + 4)) + 'px'
      this.editMode = true
      this.newText = this.text
      this.$nextTick(() => {
        const input = this.$el.querySelector('textarea')
        if (input) {
          input.focus()
        }
      })
    },
    cancelEdit (e) {
      this.editMode = false
    },

    async save (e) {
      if (e.shiftKey) {
        return
      }
      e.preventDefault()
      try {
        const input = e.currentTarget
        this.newText = input.value.trim()
        await this.$store.dispatch(`${S2T}/${EDIT_S2T}`, {
          s2tID: input.dataset.s2tid,
          newText: this.newText
        })
        if (this.sttItem.savingError) {
          throw this.sttItem.savingError
        }
        this.editMode = false
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Speech to text updated',
          showClose: true,
          type: 'success'
        })
        // trigger a resize since element heights probably changed
        this.$emit('stt-modified')
      } catch (err) {
        console.error('Error saving speech to text', err)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      } finally {
        this.editMode = false
      }
    }
  }
}
</script>
<style lang="less" scoped>
  @import (reference) '../../../styles/_variables';

  .stt-item__header {
    align-items: flex-start;
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    textarea {
      font-family: inherit;
      font-size: inherit;
      line-height: 1.2;
      padding: 0;
      border: none;
      outline: 0;
    }

    .stt-item--no-edit {
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .stt-item--edit {
      background-color: @background-grey;
      padding: 2px;
    }

    input[type="text"] {
      font-size: 14px;
    }
    .editing-commands {
      display: flex;
      margin-right: 4px;
      button.btn-edit {
        background-color: transparent;
        border: 0 none;
        border-radius: 50%;
        cursor: pointer;
        margin-left: 8px;
        padding: 0;
        text-align: center;
        &:focus {
          outline: 0;
        }
        i.far {
          color: @header-color;
          font-size: 11px;
          font-weight: normal;
        }
        &:hover {
          i.far {
            color: darken(@header-color, 30%);
          }
        }
      } // button
    }
    &:hover {
      .editing-commands {
        opacity: 1;
      }
    }
  }
</style>
