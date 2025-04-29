<template>
  <div class="ext-audio">
    <header class="vertical-timeline__header">
      <div class="content-extaud">
        <div class="ext-audio-link-btn">
          <el-button type="text" @click="openExtAudioChooser">
            <i class="far fa-plus"></i>
            Link Audio Assets
          </el-button>
        </div>
      </div>
    </header>
    <div class="horizontal-timeline-container__empty-notification" v-if="extAudios.length === 0">There are currently no linked audio
      files.
    </div>
    <div class="audios-list-container sub-panel-container-padding">
      <div v-for="audio in extAudios"
           :key="audio.id"
           class="audio-item-row"
           :class="audio.id === enabledExtAudioId ? 'selected-track' : ''">
          <span class="audio-name1"
                @click="switchAudioTrack(audio.id)" :title="audio.name">
          {{ audio.name }}
          </span>
          <span @click.stop="unlinkExtAudio(audio.id)" class="button-unlink-audio">
            <i class="fa-solid fa-unlink" title="Unlink audio"></i>
          </span>
          <a :href="'/#/item/' + audio.id" class="button-open-audio" target="_blank">
            <i class="fa-solid fa-arrow-up-right-from-square" title="Opens file in new window/tab"></i>
          </a>
      </div>
    </div>

    <el-dialog
      title="Link External Audio Assets"
      :visible.sync="showExtAudioModal"
      :before-close="resetSearch"
    >
      <div class="external-audio-search">
        Perform a search for audio files in Wasabi AiR™ to link to this asset.
        <section class="extaud-search-input-wrapper">
          <input type="text" ref="basic-query-input" class="basic-query-input" v-model="keyword"
                 @keydown.enter.stop="executeExtAudSearch"/>
          <button v-if="isFormResetable" class="remove-pills" @click="resetSearch">
            <i class="fal fa-times"></i>
          </button>
          <button ref="extaud-search-button" class="extaud-search-button" @click="executeExtAudSearch">
            <i class="fas fa-search"></i>
          </button>
        </section>
        <section class="results">
          <div class="span-empty-search-result" v-if="searchResults.length === 0">
            No matching audio items, please refine your search and try again.
          </div>
          <div v-if="searchResults.length > 0">
            <div class="audios-list-container">
              <div v-for="result in searchResults"
                   class="audio-item-row searched-item-row"
                   :class="{ disabled: isItemLinked(result.id) }"
                   :key="result.id"
                   :item-id="result.id"
                   @click.stop="toggleSearchItemSelected(result.id)">
                <div
                  class="audio-item-checkbox"
                  :class="{ active: isSearchItemSelected(result.id) }">
                  <i class="fas fa-check" v-if="isSearchItemSelected(result.id)"></i>
                </div>
                {{ result.name }} <span v-if="isItemLinked(result.id)" style="margin-left: 4px">(Linked)</span>
              </div>
            </div>
            <el-button type="primary" size="mini" class="button-link-assets" @click="linkSelectedExtAudios">
              <i class="fa-solid fa-link"></i> Link selected audio assets
            </el-button>
          </div>
        </section>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import _ from 'lodash'

import { SEARCH_CONSTANTS } from 'src/constants-search'
// stores
import { EXT_AUDIOS, SEARCH } from 'src/store/storeModules'
import { GET_KEYWORD } from 'src/store/modules/search/getters'
import { SET_KEYWORD } from 'src/store/modules/search/mutations'
import api from '../../api'
import {mapActions, mapGetters} from 'vuex'
import {
  GET_EXT_AUDIOS,
  GET_EXT_AUDIOS_LOADING,
  GET_EXT_AUDIOS_LINKING,
  GET_EXT_AUDIOS_LINKING_ERROR,
  GET_EXT_AUDIOS_UNLINKING,
  GET_EXT_AUDIOS_UNLINKING_ERROR, GET_ENABLED_EXT_AUDIO_ID
} from '../../store/modules/item/ext-audios/getters'
import {LINK_EXT_AUDIOS, UNLINK_EXT_AUDIOS} from '../../store/modules/item/ext-audios/actions'
import {CONSTANTS} from '../../constants'
import {
  SET_EXT_AUDIOS_IS_CHANGED_ON_MENU,
  SET_EXT_ENABLED_AUDIO_ID
} from '../../store/modules/item/ext-audios/mutations'

export default {
  name: 'ext-audio',

  data () {
    return {
      showExtAudioModal: false,
      searchResults: [],
      selectedSearchItemIds: [],
      selectedLinkedItemIds: []
    }
  },
  mounted () {
    const ref = this.$refs['basic-query-input']
    if (ref && ref.focus) {
      ref.focus()
    }
  },
  computed: {
    ...mapGetters(EXT_AUDIOS, {
      loading: GET_EXT_AUDIOS_LOADING,
      extAudios: GET_EXT_AUDIOS,
      unlinkingError: GET_EXT_AUDIOS_UNLINKING_ERROR,
      linkingError: GET_EXT_AUDIOS_LINKING_ERROR,
      enabledExtAudioId: GET_ENABLED_EXT_AUDIO_ID
    }),

    isFormResetable () {
      return this.keyword.length > 0
    },
    keyword: {
      get () {
        return this.$store.getters[`${SEARCH}/${GET_KEYWORD}`]
      },
      set (val) {
        this.$store.commit(`${SEARCH}/${SET_KEYWORD}`, val)
      }
    },
    isNewSearchPage () {
      return (_.get(this.$route, 'name', '') === this.CONSTANTS.ROUTES.SEARCH.NAME) && (_.get(this.$route, 'query.key.length', 0) === 0)
    },
    itemTypes () {
      return SEARCH_CONSTANTS.GM_ITEM_TYPES
    }
  },
  methods: {
    ...mapActions(EXT_AUDIOS, {
      linkExtAudios: LINK_EXT_AUDIOS,
      unlinkExtAudios: UNLINK_EXT_AUDIOS
    }),
    openExtAudioChooser () {
      this.showExtAudioModal = true
    },

    async executeExtAudSearch () {
      await this.doSearch()
    },
    async doSearch () {
      const request = this.getAudioSearchPayload()
      const res = await api.doSearch(request)
      this.searchResults = res.results.map(res => {
          return {
            'id': res.result._id,
            'location_id': res.result.location_id,
            'parent_id': '',
            'audio_parent_id': '',
            'root_id': res.result.root_id,
            'stow_url': res.result.stow_url,
            'name': res.result.name
          }
        }
      )
    },
    resetSearch () {
      this.showExtAudioModal = false
      this.keyword = ''
      this.searchResults = []
      this.selectedSearchItemIds = []
    },
    getAudioSearchPayload (from, to) {
      return {
        query: this.keyword,
        filters: {
          ranges: [{
            from: from,
            to: to,
            field: 'last_harvested'
          }],
          exact_terms: [{
            field: 'gm_item_type',
            value: 'audio'
          }]
        },
        limit: 25
      }
    },
    isSearchItemSelected (itemId) {
      return this.selectedSearchItemIds.includes(itemId)
    },
    addToSelectedSearchItems (itemId) {
      if (!this.selectedSearchItemIds.includes(itemId)) {
        this.selectedSearchItemIds.push(itemId)
      }
    },
    removeFromSelectedSearchItems (itemId) {
      const index = this.selectedSearchItemIds.indexOf(itemId)
      this.selectedSearchItemIds.splice(index, 1)
    },
    isItemLinked (itemId) {
      return this.extAudios.filter(audio => audio.id === itemId).length > 0
    },
    toggleSearchItemSelected (itemId) {
      if (!this.isItemLinked(itemId)) {
        if (this.isSearchItemSelected(itemId)) {
          this.removeFromSelectedSearchItems(itemId)
        } else {
          this.addToSelectedSearchItems(itemId)
        }
      }
    },
    isLinkedItemSelected (itemId) {
      return this.selectedLinkedItemIds.includes(itemId)
    },
    addToSelectedLinkedItems (itemId) {
      if (!this.selectedLinkedItemIds.includes(itemId)) {
        this.selectedLinkedItemIds.push(itemId)
      }
    },
    removeFromSelectedLinkedItems (itemId) {
      const index = this.selectedLinkedItemIds.indexOf(itemId)
      this.selectedLinkedItemIds.splice(index, 1)
    },
    toggleLinkedItemSelected (itemId) {
      if (this.isLinkedItemSelected(itemId)) {
        this.removeFromSelectedLinkedItems(itemId)
      } else {
        this.addToSelectedLinkedItems(itemId)
      }
    },
    async linkSelectedExtAudios () {
      if (this.selectedSearchItemIds.length > 0) {
        this.showExtAudioModal = false
        try {
          await this.linkExtAudios(this.searchResults.filter(item => this.selectedSearchItemIds.includes(item.id)))
          this.resetSearch()

          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'Selected audio items are linked',
            showClose: true,
            type: 'success'
          })
        } catch (err) {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: this.linkingError,
            showClose: true,
            type: 'error'
          })
        }
      }
    },
    async unlinkSelectedExtAudios () {
      if (this.selectedLinkedItemIds.length > 0) {
        try {
          await this.unlinkExtAudios(this.extAudios.filter(item => this.selectedLinkedItemIds.includes(item.id)).map(item => item.id))
          if (this.selectedLinkedItemIds.includes(this.enabledExtAudioId)) {
            this.$store.commit(`${EXT_AUDIOS}/${SET_EXT_AUDIOS_IS_CHANGED_ON_MENU}`, false)
            this.$store.commit(`${EXT_AUDIOS}/${SET_EXT_ENABLED_AUDIO_ID}`, '')
          }
          this.selectedLinkedItemIds = []
          this.selectedSearchItemIds = []

          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'Audio item is unlinked',
            showClose: true,
            type: 'success'
          })
        } catch (err) {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: this.unlinkingError,
            showClose: true,
            type: 'error'
          })
        }
      }
    },
    unlinkExtAudio (itemId) {
      this.selectedLinkedItemIds = []
      this.selectedLinkedItemIds.push(itemId)
      this.unlinkSelectedExtAudios()
    },
    switchAudioTrack (itemId) {
      this.$store.commit(`${EXT_AUDIOS}/${SET_EXT_AUDIOS_IS_CHANGED_ON_MENU}`, false)
      this.$store.commit(`${EXT_AUDIOS}/${SET_EXT_ENABLED_AUDIO_ID}`, itemId)
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.ext-audio {
  padding-bottom: 50px;
  .vertical-timeline__header {
    .el-popover {
      word-break: break-word;
    }

    .ext-audio-link-btn {
      align-items: center;
      background-color: transparent;
      border: 0 none;
      border-radius: 0;
      cursor: pointer;
      display: flex;
      padding-left: 15px;
      padding-right: 15px;

      i.far {
        font-size: 10px;
        margin-right: 4px;
      }

      &:focus,
      &:active {
        outline: none;
      }

      .el-button {
        font-size: 10px;
      }
    }
  }

  .extaud-search-input-wrapper {
    .flex-container();
    position: relative;

    button {
      .size(31px, 31px);
      background-color: @color-tone-light;
      border: 1px solid @color-tone-lighter;
      border-left: 0;

      i {
        color: @color-tone-lighter;
      }

      &:hover {
        background-color: @color-accent;
        cursor: pointer;

        i {
          color: @color-base;
        }
      }

      &.extaud-search-button {
        background-color: @color-accent;
        cursor: pointer;

        i {
          color: @color-base;
        }

        &:disabled {
          background-color: @color-tone-lightest;
          cursor: not-allowed;

          &:hover {
            background-color: @color-tone-lightest;
          }
        }

        &:hover,
        &:focus {
          background-color: @primary-button-color-darken__hover;
        }

        &:focus {
          border-color: @primary-button-color-darken__hover;
        }
      }
    }

    .basic-query-input {
      .size(620px, 31px);
      background-color: @color-base;
      border: 1px solid @box-border-grey;
      border-right: 0;
      color: @color-primary;
      padding: 0 10px;
    }
  }

  .audios-list-container {
    padding-top: 20px;
    display: flex;
    flex-direction: column;

    .audio-name {
      color: @color-primary;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .audio-name1 {
      width: 100%;
      color: @color-primary;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .audio-item-row {
      display: flex;
      align-items: center;
      cursor: pointer;
      opacity: .6;
      padding: 2px 15px;

      .audio-item-checkbox {
        .flex-container-center();
        background-color: @color-base;
        border: 1px solid @color-tone-lightest;
        cursor: pointer;
        padding: 0;
        margin-right: 8px;
        height: 14px;
        width: 14px;
        > i {
          color: @color-base;
          font-size: 8px;
        }
        &.active {
          background-color: @color-accent;
          border-color: @color-accent;
        }
      }
    }

    .audio-item-row.searched-item-row {
      opacity: 1;
    }

    .audio-item-row.selected-track {
      background: white;
      opacity: 1;
      border-left: 2px solid @color-accent;
    }

    .audio-item-row.disabled {
      color: gray;
      font-style: italic;
    }

    .audio-item-row.disabled .audio-item-checkbox {
      background-color: @color-tone-lighter;
    }

    .button-unlink-audio {
      margin: auto 6px;
      color: @color-primary;
    }

    .button-open-audio {
      color: @color-primary;
    }

    .button-unlink-audio:hover,
    .button-open-audio:hover {
      color: @color-accent
    }
  }

  .span-empty-search-result {
    padding: 20px 6px;
    color: @text-light;
  }

  .sub-panel-container-padding {
    padding: 0;
  }

  .button-link-assets {
    margin-top: 20px;
  }

  .link-button-container {
    padding: 0 15px;
  }
}
</style>
