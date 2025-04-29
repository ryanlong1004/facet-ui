<template>
  <div class="vertical-timeline tags-descriptions-timeline" ref="timeline">
    <div class="timeline-loading" v-if="loading" v-loading="loading"></div>
    <div class="horizontal-timeline-container__empty-notification" v-if="!loading && !hasContent">We didn't detect any tags or descriptions in this file.</div>
    <ol class="timeline-items visible">
      <li class="buffer" ref="bigdata-buffer-top"></li>
      <li v-for="segment in displayItems" ref="displayItem" :key="segment.metaID" :class="{ 'timeline-item': true, active: activeItem && (activeItem.metaID === segment.metaID) }">
        <tags-descriptions-item-vuex
          :active="activeItem && activeItem.metaID === segment.metaID"
          :meta-id="segment.metaID"
          :index="segment.index"
          @refresh="handleBigDataResize()"
          @item-clicked="itemClicked(segment)"
        ></tags-descriptions-item-vuex>
      </li>
      <li class="buffer" ref="bigdata-buffer-bottom"></li>
    </ol>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { mapGetters } from 'vuex'

  import { SCOPES } from 'src/plugins/ScopeEnforcer'

  import VuexItemMixin from 'src/mixins/VuexItemMixin'
  import TagsDescriptionsItemVuex from 'src/components/item/timeline/TagsDescriptionsItemVuex.vue'

  import { TAGS, DESCRIPTIONS, EDIT_MODE } from 'src/store/storeModules'

  import { GET_ITEM_TAGS, GET_TAGS_LOADING } from 'src/store/modules/item/tags/getters'
  import { SET_TAG_COLLECTION_EDIT_MODE } from 'src/store/modules/item/tags/mutations'
  import { FETCH_TAGS } from 'src/store/modules/item/tags/actions'

  import { GET_ITEM_DESCRIPTIONS, GET_DESCRIPTIONS_LOADING } from 'src/store/modules/item/descriptions/getters'
  import { SET_DESCRIPTION_EDIT_MODE } from 'src/store/modules/item/descriptions/mutations'
  import { FETCH_DESCRIPTIONS } from 'src/store/modules/item/descriptions/actions'

  import { GET_EDIT_MODE, TOGGLE_EDIT_MODE } from 'src/store/modules/item/edit-mode'
  import VerticalTimelineMixin from './VerticalTimelineMixin'
  import TimelineType from './TimelineType'

  import {TAGS_PAGE_SIZE} from '../SegmentQuery'
  import { PROPERTY_PATHS } from 'src/property-paths'

  export default {
    name: 'tags-descriptions-vuex',
    mixins: [
      VerticalTimelineMixin,
      VuexItemMixin
    ],
    components: {
      TagsDescriptionsItemVuex
    },
    props: {
      currentTab: {
        type: String,
        default: ''
      }
    },
    data () {
      return {
        PROPERTY_PATHS: PROPERTY_PATHS,

        offsetTop: -20,
        bigDataScroll: {
          numToRender: 5,
          fixedHeight: 255
        }
      }
    },
    mounted () {
      this.applyChanges()
      this.$watch('currentTab', (newVal, oldVal) => {
        if (this.tabEnabled) {
          // load tags and descriptions
          this.$store.dispatch(`${TAGS}/${FETCH_TAGS}`)
          this.$store.dispatch(`${DESCRIPTIONS}/${FETCH_DESCRIPTIONS}`)
        }
      }, { immediate: true })
    },
    computed: {
      ...mapGetters(TAGS, {
        tags: GET_ITEM_TAGS,
        tagsLoading: GET_TAGS_LOADING
      }),
      ...mapGetters(DESCRIPTIONS, {
        descriptions: GET_ITEM_DESCRIPTIONS,
        descriptionsLoading: GET_DESCRIPTIONS_LOADING
      }),
      ...mapGetters(EDIT_MODE, {
        editMode: GET_EDIT_MODE
      }),
      segments () {
        let segments = []
        if (this.hasContent) {
          return this.tags.map(t => {
            return {
              index: t.index,
              metaID: t.metaID,
              displayTime: t.displayTime,
              start_at: t.start_at,
              end_at: t.end_at,
              key: t.start_at
            }
          })
        }
        return segments
      },
      loading () {
        return this.tagsLoading || this.descriptionsLoading
      },
      hasContent () {
        const numTags = _.get(this.tags, 'length', 0)
        const numDescriptions = _.get(this.descriptions, 'length', 0)
        if (!numTags || !numDescriptions) {
          return false
        }
        return !this.loading && (numTags === numDescriptions) && numTags && numDescriptions
      },
      tabEnabled () {
        return this.currentTab === this.CONSTANTS.VERTICAL_TABS.TAGS_DESCRIPTIONS_VUEX
      },
      canEdit () {
        return this.$hasScope(SCOPES.EDIT_TAGS_DESCRIPTIONS)
      }
    },
    watch: {
      segments: function () {
        this.applyChanges()
      }
    },
    methods: {
      toggleEditMode (id) {
        this.$store.commit(`${EDIT_MODE}/${TOGGLE_EDIT_MODE}`, {
          id
        })
      },

      applyChanges: function () {
        if (this.segments && this.segments.length && !this.filteredItems.length) {
          this.filteredItems = this.segments.map(item => {
            return _.assign({}, item, {
              active: false,
              segmentId: item.metaID
            })
          })
          this.initBigDataScrolling('.timeline-items.visible', '.timeline-items.visible > li', '.timeline-items.hidden', '.timeline-items.hidden > li',
            TimelineType.TAGS, Math.ceil(this.filteredItems.length / TAGS_PAGE_SIZE), TAGS_PAGE_SIZE)
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  .tags-descriptions-timeline .timeline-items {
    padding: 0px;
  }

  .no-data {
    position: absolute;
    top: 10px;
    left: 40px;
  }
</style>
