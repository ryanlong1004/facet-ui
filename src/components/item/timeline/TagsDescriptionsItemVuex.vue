<template>
  <div class="item-details tags-item" :class="{ editing: editMode, active: active }" @click="$emit('item-clicked')">
    <time-code-label :start-at='segmentDescription.start_at'/>
    <div>
      <header class="tags-item__header">
        <span v-if="!editMode && !description">Add description...</span>
        <span v-if="!editMode && description" @click.stop="enableEditDescription()" class="description-text"
          :innerHTML.prop="description | highlightFilter({ insights: true, type: CONSTANTS.HIGHLIGHT_TYPES.DESCRIPTIONS })"></span>
        <input v-if="editMode" type="text" placeholder="Enter a new description and press ENTER" @keyup.enter="saveDescription" class="el-input__inner" :data-meta-id="metaId"
               :id="'description-input-' + metaId" tabindex @focus="$emit('item-clicked')" :value="description" @blur="cancelEditDescription()">
        <div v-if="$hasScope(SCOPES.EDIT_TAGS_DESCRIPTIONS)" class="editing-commands">
          <button title="Edit frame description" type="button" class="btn-edit" v-if="!editMode" @click.stop="enableEditDescription()" tabindex="-1"><i class="far fa-pencil"></i></button>
        </div>
      </header>
      <div class="tags-wrapper" :class="{ expanded: tagsExpanded }">
        <p class="no-tags" v-if="!segmentTags || !segmentTags.tags || !segmentTags.tags.length">No tags detected</p>
        <div v-if="segmentTags.tags && segmentTags.tags.length" class="tags">
            <span class="tag" :class="{ 'user-generated': segmentTags.tags.source === 'userinput' }" v-for="tag in segmentTags.tags" :key="tag.id">
              <span class="text"
                :innerHTML.prop="tag.text | highlightFilter({ insights: true, type: CONSTANTS.HIGHLIGHT_TYPES.TAGS })"></span>
              <span class="percent">&nbsp;({{ tag.source === 'userinput' ? 'user' : tag.confidence + '%' }})</span>
              <button v-if="$hasScope(SCOPES.EDIT_TAGS_DESCRIPTIONS)" class="delete-tag-button" @click.stop="deleteTag(tag)">
                <i class="far fa-times"></i>
              </button>
            </span>
        </div>
      </div>
      <div class="tag-expander" :class="{ disabled: !showTagsExpander }" @click="expandTags">
        <div class="line"></div>
        <span v-if="!tagsExpanded">MORE <i class="far fa-caret-down"></i></span>
        <span v-if="tagsExpanded">LESS <i class="far fa-caret-up"></i></span>
      </div>
      <div v-if="$hasScope(SCOPES.EDIT_TAGS_DESCRIPTIONS)" class="tags-add">
        <div class="el-input">
          <input type="text" placeholder="add one or more tags separated by a comma" @keyup.enter="addNewTags" class="el-input__inner" :data-meta-id="metaId" tabindex @focus="$emit('item-clicked')">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import {TAGS, DESCRIPTIONS} from 'src/store/storeModules'
import { ADD_TAGS, DELETE_TAG } from 'src/store/modules/item/tags/actions'
import { GET_ITEM_DESCRIPTIONS } from 'src/store/modules/item/descriptions/getters'
import { GET_ITEM_TAGS } from 'src/store/modules/item/tags/getters'
import api from 'src/api'
import { pluralize } from 'humanize-plus'
import {normalizeTagsConfidence} from '../item-helper'
import VuexItemMixin from '../../../mixins/VuexItemMixin'
import {ADD_DESCRIPTION, EDIT_DESCRIPTION} from '../../../store/modules/item/descriptions/actions'
import TimeCodeLabel from './TimeCodeLabel'

export default {
  name: 'tags-descriptions-item-vuex',
  components: {TimeCodeLabel},
  mixins: [
    VuexItemMixin
  ],

  props: {
    metaId: {
      type: String,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    },
    startAt: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      showTagsExpander: false,
      tagsExpanded: false,
      throttledResize: null,
      editMode: false,
      itemCategory: 'video'
    }
  },
  mounted: function () {
    this.throttledResize = _.throttle(this.handleResize, 100)
    window.addEventListener('resize', this.throttledResize)
    this.$nextTick(() => {
      this.handleResize()
    })
  },
  updated: function () {
    this.handleResize()
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.throttledResize)
  },
  computed: {
    segmentTags () {
      return this.$store.getters[`${TAGS}/${GET_ITEM_TAGS}`][this.index]
    },
    segOrImageIndex () {
      return _.get(this.segmentTags, 'key')
    },
    segmentDescription () {
      return this.$store.getters[`${DESCRIPTIONS}/${GET_ITEM_DESCRIPTIONS}`][this.index]
    },
    descriptionId () {
      return _.get(this.segmentDescription, 'description.id')
    },
    description () {
      return _.get(this.segmentDescription, 'description.text')
    }
  },
  methods: {

    async addNewTags (e) {
      const input = e.currentTarget
      const metaId = input.dataset.metaId

      const currentTags = (_.get(this.segmentTags, 'tags', []) || []).map(t => {
        return t.text
      })

      let newTags = []
      const tagsA = input.value.split(',')

      _.each(tagsA, t => {
        t = t.trim()
        if ((currentTags.indexOf(t) < 0) && (newTags.indexOf(t) < 0) && (t.length >= 2)) {
          newTags.push(t)
        }
      })

      if (newTags.length) {
        try {
          await this.$store.dispatch(`${TAGS}/${ADD_TAGS}`, {
            index: this.index,
            imageIndex: -1,
            metaID: this.metaId,
            tags: newTags
          })
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: `${newTags.length} new ${pluralize(newTags.length, 'tag')} added`,
            showClose: true,
            type: 'success'
          })

          input.value = ''
          this.$emit('refresh') // trigger a resize since element heights probably changed
        }
        catch (err) {
          console.error('error adding tags', err)
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'Error adding new tags, please try again',
            showClose: true,
            type: 'error'
          })
        }
      }
    },

    async deleteTag (tag) {
      try {
        await this.$store.dispatch(`${TAGS}/${DELETE_TAG}`, {
          index: this.index,
          imageIndex: -1,
          metaID: this.metaId,
          tagName: tag.text
        })
      } catch (err) {
        console.error('error deleting tag', err)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `Error deleting tag "${tag.text}", please try again`,
          showClose: true,
          type: 'error'
        })
      }
    },

    enableEditDescription () {
      this.editMode = true
      this.$nextTick(() => {
        this.$el.querySelector('#description-input-' + this.metaId).focus()
      })
    },

    cancelEditDescription () {
      this.editMode = false
    },

    async saveDescription (e) {
      const input = e.currentTarget
      let newVal = input.value.trim()

      try {
        let response
        if (this.descriptionId) {
          await this.$store.dispatch(`${DESCRIPTIONS}/${EDIT_DESCRIPTION}`, {
            segmentIndex: this.index,
            imageIndex: this.CONSTANTS.NO_EMBEDDED_IMAGE_INDEX,
            descId: this.descriptionId,
            newDescription: newVal
          })
        }
        else {
          await this.$store.dispatch(`${DESCRIPTIONS}/${ADD_DESCRIPTION}`, {
            itemType: this.itemCategory,
            segmentIndex: this.index,
            imageIndex: this.CONSTANTS.NO_EMBEDDED_IMAGE_INDEX,
            newDescription: newVal
          })
        }

        this.editMode = false
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Description updated',
          showClose: true,
          type: 'success'
        })
        this.$emit('refresh') // trigger a resize since element heights probably changed
      } catch (err) {
        console.error('Error saving description', err)
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'Error updating description, please try again',
          showClose: true,
          type: 'error'
        })
      }
    },

    expandTags: function (e) {
      if (this.showTagsExpander) {
        e.stopPropagation()
        this.tagsExpanded = !this.tagsExpanded
        this.$nextTick(() => {
          this.handleResize()
        })
      }
    },
    handleResize: function () {
      if (this.tagsExpanded) {
        this.showTagsExpander = true
      } else {
        if (!this.$el.querySelector('.tags')) {
          this.showTagsExpander = false
        } else {
          const listHeight = this.$el.querySelector('.tags').offsetHeight
          const wrapperHeight = this.$el.querySelector('.tags-wrapper').offsetHeight
          if (listHeight > wrapperHeight) {
            this.showTagsExpander = true
          }
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
  @import (reference) '../../../styles/_variables';

  .tags-descriptions-timeline {
    .timeline-items {
      .timeline-item {
        .item-details {
          border: 1px solid @box-border-grey;
          background-color: white;

          padding: 0;
          //width: 100%;

          &.active {
            .tags-item__header {
              background-color: #dee7f0;
            }
          }

          .tags-item__header {
            align-items: flex-start;
            display: flex;
            flex-direction: row;
            justify-content: space-between;

            border-bottom: 1px solid @box-border-grey;
            padding: 9px 9px 9px 15px;
            height: 61px;

            .description-text {
              font-size: 11px;
              line-height: 15px;
            }
            input[type="text"] {
              font-size: 14px;
            }
            .editing-commands {
              display: flex;
              margin: -5px -5px 0 10px;
              // opacity: 0;
              button {
                background-color: transparent;
                border: 0 none;
                border-radius: 50%;
                cursor: pointer;
                margin-left: 5px;
                width: 30px;
                height: 30px;
                text-align: center;
                &:focus {
                  outline: 0;
                }
                i.far {
                  color: @header-color;
                  font-size: 1.15rem;
                  font-weight: normal;
                  line-height: 22px;
                }
                &:hover {
                  i.far {
                    color: darken(@header-color, 30%);
                  }
                }
                &:first-child {
                  margin-left: 0;
                }
              } // button
            }
            &:hover {
              .editing-commands {
                opacity: 1;
              }
            }
          }

          .tags-wrapper {
            height: 95px;
            overflow-y: hidden;
            padding: 15px;
            transition: height 100ms ease-out;
            &.expanded {
              height: auto;
            }
          }
          .tag-expander {
            color: @color-tone-lighter;
            font-size: 10px;
            line-height: 15px;
            padding-top: 5px;
            padding-left: 15px;
            padding-right: 15px;
            text-align: center;
            .line {
              border-bottom: 1px dotted @color-tone-lighter;
              height: 0;
              margin-bottom: 2px;
              width: 100%;
            }
            &:hover {
              color: @color-accent;
            }
            &.disabled {
              .line {
                border-bottom-color: transparent;
              }
              span {
                opacity: 0;
              }
            }
          }
          .no-tags {
            font-size: 14px;
            font-style: italic;
            margin: 0;
            padding: 0;
          }
          .tags {
            .tag {
              .text {
                margin-right: 2px;
              }
            }
          }
          .tags-add {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            padding: 5px 15px 15px 15px;
            button {
              margin-left: 10px;
            }
          }

          .el-tag-proxy {
            padding: 5px;
          }
          .el-input-proxy {
            height: 36px;
          }
        }
      }
    }
  }

  .el-dropdown-menu {
    /*border: 1px solid red;*/
    padding: 0;
    margin: 2px;

    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 1.1px;
    font-weight: 400;

    .el-dropdown-menu__item {
      background-color: @dropdown-item;
      color: @dropdown-item-text;

      line-height: 19px;

      &:hover {
        background-color: @dropdown-item__hover;
        color: @dropdown-item-text;
      }
    }
  }

</style>
