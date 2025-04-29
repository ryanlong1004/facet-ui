<template>
  <div>
    <div class="horizontal-timeline-container__empty-notification" v-if="transcript && transcript.length === 0">We didn't detect any speech-to-text for this file.</div>
    <div class="filter-row" v-if="transcript && transcript.length">
      <el-select
        v-if="sourceList.length > 1"
        v-model="transcriptIndex"
        class="source-selector"
        placeholder="Select..."
        popper-class="alternate small"
        size="mini"
        @change="setActiveTranscript"
        >
        <el-option v-for="(source, index) in sourceList" :key="source" :label="source" :value="index"></el-option>
      </el-select>
      <div v-else>&nbsp;</div>
      <div class="dl-button" @click="downloadSpeechToText()">
        <i class="far fa-download" aria-hidden="true"></i>
        <div class="text">Download SRT</div>
      </div>
    </div>
    <div class="vertical-timeline" ref="timeline">
      <ol class="timeline-items visible">
        <li class="buffer" ref="bigdata-buffer-top"></li>
        <li v-for="sttItem in displayItems" :key="sttItem.start_at" :class="{ 'timeline-item': true, active: activeItem === sttItem }" @click.stop="itemClicked(sttItem)">
          <speech-to-text-item
            :active="activeItem === sttItem"
            @stt-modified="applyChanges"
            @item-clicked="itemClicked(sttItem)"
            :stt-item-id="sttItem.id"></speech-to-text-item>
        </li>
        <li class="buffer" ref="bigdata-buffer-bottom"></li>
      </ol>
      <ol class="timeline-items hidden">
        <li v-for="item in filteredItems" :key="item.start_at" class="timeline-item">
          <div class="item-details speech-to-text-item">
            <div class="time" v-once>{{item.displayTime}}</div>
            <div v-html="item.text"></div>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { mapGetters, mapActions } from 'vuex'

  import api from 'src/api'
  import SpeechToTextItem from './SpeechToTextItem.vue'
  import VerticalTimelineMixin from './VerticalTimelineMixin'
  import VuexItemMixin from 'src/mixins/VuexItemMixin'
  import TimelineType from './TimelineType'


  import { ITEM, S2T } from 'src/store/storeModules'
  import {
    GET_ACTIVE_S2T_TRANSCRIPT,
    GET_ACTIVE_S2T_TRANSCRIPT_INDEX,
    GET_S2T_TRANSCRIPTS_LIST
  } from 'src/store/modules/item/s2t/getters'
  import {
    SET_ACTIVE_TRANSCRIPT
  } from 'src/store/modules/item/s2t/actions'
  import { ITEM_ID } from 'src/store/modules/item/getterTypes'



  export default {
    name: 'speech-to-text',
    mixins: [
      VerticalTimelineMixin,
      VuexItemMixin
    ],
    components: {
      SpeechToTextItem
    },
    props: {
      active: {
        type: Boolean,
        default: false
      }
    },
    data () {
      return {
        offsetTop: 0,
        filteredItems: [],
        transcriptIndex: 0
      }
    },
    computed: {
      ...mapGetters(S2T, {
        activeSource: GET_ACTIVE_S2T_TRANSCRIPT,
        activeSourceIndex: GET_ACTIVE_S2T_TRANSCRIPT_INDEX,
        sourceList: GET_S2T_TRANSCRIPTS_LIST
      }),
      ...mapGetters(ITEM, {
        itemId: ITEM_ID
      }),
      transcript () {
        return _.get(this, 'activeSource.transcript', []) || []
      }
    },
    mounted: function () {
      this.applyChanges()
    },
    watch: {
      transcript: function () {
        this.applyChanges()
      }
    },
    methods: {
      ...mapActions(S2T, {
        setActiveTranscript: SET_ACTIVE_TRANSCRIPT
      }),
      downloadSpeechToText: function () {
        api.downloadSpeechToText(this.itemId, this.activeSource.source)
      },

      applyChanges: function () {
        if (this.transcript && this.transcript.length) {
          this.filteredItems = this.transcript.map(item => {
            return _.assign({}, item, {
              key: item.start_at,
              active: false,
              newText: item.text
            })
          })
          this.initBigDataScrolling('.timeline-items.visible', '.timeline-items.visible > li', '.timeline-items.hidden', '.timeline-items.hidden > li', this.CONSTANTS.VERTICAL_TABS.SPEECH_TO_TEXT)
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  @import (reference) '~src/styles/_variables';

  .filter-row {
    align-items: center;
    background-color: @item-grey;
    border-bottom: 1px solid @box-border-grey;
    display: flex;
    justify-content: space-between;
    height: 40px;
    padding: 0 15px;
    position: absolute;
    width: 100%;
    z-index: 1;

    .dl-button {
      display: flex;
      flex-direction: row;
      cursor: pointer;
      color: @text-dark;
      font-weight: 700;
      letter-spacing: 1.05px;
      text-transform: uppercase;

      .far {
        font-size: 15px;
        margin-right: 3px;
      }

      .text {
        font-size: 10px;
      }
    }
    .detected-language {
      color: @text-dark;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
  }
  .vertical-timeline {
    padding-top: 40px;
  }
  .source-selector {
    width: 250px;
  }
</style>

<style lang="less">
@import (reference) '~src/styles/_variables';
.source-selector.el-select {
  min-width: 225px;
  .el-input {
    .el-input__inner {
      background-color: @box-border-grey;
      font-size: 12px;
      font-weight: normal;
    }
    .el-input__suffix {
      margin-top: 0;
    }
  }
}
</style>
