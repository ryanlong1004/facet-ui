<template>
  <div class="searched-for-term items horizontal-timeline-container" v-loading="loading">
    <div class="search-within-search horizontal-timeline-container--left horizontal-timeline-container--padded">
      <div class="search-within-search-input-wrapper">
        <input
          class="search-within-search__input el-input__inner"
          v-model="searchTerm"
          placeholder="Search within this item..."
          type="text"
          @keydown.enter="submitSearch"
        >
        <i class="far fa-search"></i>
      </div>
      <ul class="horizontal-timeline-container__topics-list">
        <li
          :class="{ active: searchTimeline.active }"
          :key="searchTimeline.id"
          @click.stop="toggleItem(searchTimeline)"
          v-for="searchTimeline in uniqueSearchTimelines"
          ref="topics-list-item"
        >
          <i class="fa-circle" :class="{ 'fas': searchTimeline.active, 'far': !searchTimeline.active }"></i>
          <span>{{ unescapeHTML(searchTimeline.value) }}</span>
        </li>
      </ul>
    </div>
    <!--expanded view-->
    <div class="timeline-wrapper horizontal-timeline-container--right" v-if="!collapseHorizontalTimelines">
      <div class="horizontal-timeline-container__empty-notification" v-if="uniqueSearchTimelines && !uniqueSearchTimelines.length">
        We didn't find any terms matching your search query.
      </div>
      <div class="timelines" v-else>
        <div class="scrolling-timelines-container" @mouseover="getFocus()" ref="timelineContainer">
          <div class="timeline-section timelines-container summary" ref="overview-timeline">
            <div class="timeline-term">Asset Overview</div>
            <horizontal-timeline
              :items="summaryItems"
              :summary="true"
              :is-summary="false"
              :scale="0.4">
            </horizontal-timeline>
          </div>
          <div
            :key="searchTimeline.id"
            class="timeline-section"
            v-for="searchTimeline in uniqueSearchTimelines"
            ref="term-timeline"
          >
            <template v-if="searchTimeline.active">
              <div class="timeline-term">
                <span>{{ unescapeHTML(searchTimeline.value) }}</span>
              </div>
              <p class="empty-notification" v-if="!searchTimeline.results || searchTimeline.results.length === 0">
                We didn't find any matches for the search query "{{ unescapeHTML(searchTimeline.value) }}".
              </p>
              <template v-else>
                <div
                  :key="r.id"
                  class="typed-timeline"
                  v-for="r in searchTimeline.results"
                  ref="term-topic-timeline"
                  @click="timelineClicked(r.type)"
                >
                  <div class="timeline-type"><i :class="r.iconClass"></i> {{ r.label }}</div>
                  <horizontal-timeline
                    :items="r.timeline" @timeline-clicked="timelineClicked(r.type)"
                    :is-summary="false">
                  </horizontal-timeline>
                </div>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
    <!--collapsed view-->
    <div class="timeline-wrapper horizontal-timeline-container--right" v-if="collapseHorizontalTimelines">
      <div class="horizontal-timeline-container__empty-notification" v-if="uniqueSearchTimelines && !uniqueSearchTimelines.length">
        We didn't find any terms matching your search query.
      </div>
      <div class="timelines" v-else>
        <div class="scrolling-timelines-container" @mouseover="getFocus()" ref="timelineContainer">
          <div
            :key="searchTimeline.id"
            class="timeline-section-compacted"
            v-for="searchTimeline in uniqueSearchTimelines"
            ref="term-timeline"
          >
            <template v-if="searchTimeline.active">
              <p class="empty-notification-compacted" v-if="!searchTimeline.results || searchTimeline.results.length === 0">
                We didn't find any matches for the search query "{{ unescapeHTML(searchTimeline.value) }}".
              </p>
              <template v-if="searchTimeline.results || searchTimeline.results.length > 0">
                <div
                  :key="r.id"
                  class="typed-timeline-compacted"
                  v-for="r in searchTimeline.results"
                  ref="term-topic-timeline"
                  @click="timelineClicked(r.type)"
                >
                  <div class="timeline-type-compacted">{{ unescapeHTML(searchTimeline.value) }} : {{ r.label }}</div>
                  <horizontal-timeline
                    :items="r.timeline" @timeline-clicked="timelineClicked(r.type)"
                    :is-summary="false">
                  </horizontal-timeline>
                </div>
              </template>
            </template>
          </div>
          <!--summary timeline-->
          <div class="timeline-section timelines-container" ref="overview-timeline">
            <horizontal-timeline
              :items="summaryItems"
              :is-summary="true"
              :scale="0.4"
            >
            </horizontal-timeline>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import shortid from 'shortid'
  import {
    mapActions,
    mapGetters,
    mapMutations
  } from 'vuex'

  import api from 'src/api'
  import HorizontalTimeline from './timeline/HorizontalTimeline.vue'
  import { getSearchQueryFromStore } from 'src/components/search/search-helper'
  import { HIGHLIGHTS, SEARCH_WITHIN_ITEM } from 'src/store/storeModules'
  import {
    ADD_GLOBAL_HIGHLIGHT_TERM,
    ADD_HIGHLIGHT_TERM,
    GET_GLOBAL_HIGHLIGHT_TERMS,
    REMOVE_GLOBAL_HIGHLIGHT_TERM,
    REMOVE_HIGHLIGHT_TERM
  } from 'src/store/modules/highlights/highlights'
  import {
    CLEAR_SEARCH_TIMELINES,
    FETCH_SEARCH_TIMELINES,
    GET_SEARCH_TIMELINES,
    GET_SEARCH_WITHIN_ITEM_BUSY,
    GET_SEARCH_WITHIN_ITEM_NO_RESULTS,
    SET_TIMELINE_ACTIVE
  } from 'src/store/modules/item/search-within-item/search-within-item'
  import VuexItemMixin from 'src/mixins/VuexItemMixin'
  import VuexItemUIStateMixin from 'src/mixins/VuexItemUIStateMixin'
  import { parseSearchQuery } from 'src/string-helper'
  import {
    findSearchWithinByType
  } from 'src/search-within-helper'

  export default {
    name: 'searched-for-term',

    mixins: [
      VuexItemMixin,
      VuexItemUIStateMixin
    ],

    components: {
      HorizontalTimeline
    },

    data () {
      return {
        //isCollapsedView: this.collapseHorizontalTimelines,
        isSummary: false,
        searchTerm: '',
        searchTerms: []
      }
    },

    mounted () {
      this.processStoredQueryTimelines()
      let from = _.get(this.$route, 'query.from')
      if (from === 'social-trends') {
        let key = _.get(this.$route, 'query.key')
        this.searchTerm = key
        this.submitSearch()
      }
    },

    computed: {
      ...mapGetters(HIGHLIGHTS, {
        globalHighlightTerms: GET_GLOBAL_HIGHLIGHT_TERMS
      }),

      ...mapGetters(SEARCH_WITHIN_ITEM, {
        loading: GET_SEARCH_WITHIN_ITEM_BUSY,
        searchTimelines: GET_SEARCH_TIMELINES
      }),

      hasSearchTermTimeline () {
        return !!this.searchTerms.find(t => t.query.toLowerCase() === this.searchTerm.toLowerCase())
      },

      summaryItems () {
        let summary = []
        _.each(this.uniqueSearchTimelines, searchTimeline => {
          if (_.get(searchTimeline, 'active')) {
            _.each(_.get(searchTimeline, 'results'), t => {
              summary = summary.concat(t.timeline)
            })
          }
        })
        return summary
      },

      uniqueSearchTimelines () {
        return this.searchTimelines.filter((item, index) => this.searchTimelines.findIndex(i => i.value === item.value) === index)
      }
    },

    methods: {
      ...mapActions(SEARCH_WITHIN_ITEM, {
        fetchSearchTimelines: FETCH_SEARCH_TIMELINES
      }),

      ...mapMutations(HIGHLIGHTS, {
        addGlobalHighlightTerm: ADD_GLOBAL_HIGHLIGHT_TERM,
        addHighlightTerm: ADD_HIGHLIGHT_TERM,
        removeGlobalHighlightTerm: REMOVE_GLOBAL_HIGHLIGHT_TERM,
        removeHightlightTerm: REMOVE_HIGHLIGHT_TERM
      }),

      ...mapMutations(SEARCH_WITHIN_ITEM, {
        clearSearchTimelines: CLEAR_SEARCH_TIMELINES,
        setTimelineActive: SET_TIMELINE_ACTIVE
      }),

      toggleCollapseTimelines () {
        this.isCollapsedView = !this.isCollapsedView
      },

      executeQuerySearchSteps (query = '', type = null) {
        if (query.length > 0) {
          this.searchTerms.push({ query, type })
          this.highlightTerms(query, type)
          this.fetchSearchTimelines({ query: query })
        }
      },

      getFocus () {
        this.$refs['timelineContainer'].focus()
      },

      highlightTerms (value, type) {
        if (type === 'keyword' || !type) {
          this.addGlobalHighlightTerm(value)
        } else {
          this.addHighlightTerm({
            type: this.CONSTANTS.HIGHLIGHT_TYPES[type],
            term: value
          })
        }
      },

      processStoredQueryTimelines () {
        if (_.get(this.searchTimelines, 'length', 0) > 0) {
          this.clearSearchTimelines()
        }

        const storedQuery = getSearchQueryFromStore(this.$route.query.key)
        if (!_.isEmpty(storedQuery)) {
          const storedQueryResults = []
          storedQueryResults.push({
            query: _.get(storedQuery, 'query', '') || '',
            queryByType: _.get(storedQuery, 'filters.full_text', []) || [],
            queryByTypePhrase: _.get(storedQuery, 'filters.full_text_phrase', []) || []
          })

          for (const sq of storedQueryResults) {
            const query = _.get(sq, 'query', {})
            const queryByType = [...sq.queryByType, ...sq.queryByTypePhrase]
            const config = _.get(storedQuery, 'config', {})

            const parsedQuery = parseSearchQuery(query)
            parsedQuery.forEach(word => {
              this.executeQuerySearchSteps(word)
            })

            if (queryByType.length > 0) {
              for (const results of queryByType) {
                const term = _.get(results, 'value')
                const field = _.get(results, 'field')
                const fieldType = this.CONSTANTS.SEARCH_TERM_FIELD_TYPES[field]

                try {
                  const termConfig = findSearchWithinByType(fieldType)
                  this.executeQuerySearchSteps(term, termConfig.highlightType)
                } catch (err) {
                  console.error(err)
                }
              }
            }
          }
        }
      },

      submitSearch (e) {
        if (this.searchTimelines.length > 0) {
          if (this.hasSearchTermTimeline) {
            // if the search terms already exists in search timelines, we want to skip any new behavior and clear the searchTerms
            this.searchTerm = ''
            return false
          } else {
            this.executeQuerySearchSteps(this.searchTerm)
          }
        } else {
          this.executeQuerySearchSteps(this.searchTerm)
        }
        this.searchTerm = ''
      },

      toggleItem (item) {
        const willBeActive = !item.active
        this.setTimelineActive({ timelineID: item.id, active: willBeActive })
        if (willBeActive) {
          if (item.type !== 'keyword') {
            item.results.forEach(r => {
              this.addHighlightTerm({
                type: this.CONSTANTS.HIGHLIGHT_TYPES[r.highlightType],
                term: item.value
              })
            })
          } else {
            this.addGlobalHighlightTerm(item.value)
          }
        } else {
          if (item.type !== 'keyword') {
            item.results.forEach(r => {
              this.removeHightlightTerm({
                type: this.CONSTANTS.HIGHLIGHT_TYPES[r.highlightType],
                term: item.value
              })
            })
          } else {
            this.removeGlobalHighlightTerm(item.value)
          }
        }
      },

      timelineClicked (timeline) {
        const typeConfig = findSearchWithinByType(timeline)
        const vtab = _.get(typeConfig, 'verticalTab')
        if (vtab) {
          this.setVerticalTab({ name: vtab })
        }
      },

      escapeHTML (html) {
        let escapeEl = document.createElement('textarea')
        escapeEl.textContent = html
        return escapeEl.innerHTML
      },

      unescapeHTML (html) {
        let escapeEl = document.createElement('textarea')
        escapeEl.innerHTML = html
        return escapeEl.textContent
      }
    }
  }
</script>

<style lang="less" scoped>
  @import (reference) '../../styles/main';

  // overriding this specificity from _base.css
  .horizontal-timeline-container--left .horizontal-timeline-container__topics-list > li {
    text-transform: none;
  }

  .search-within-search-input-wrapper {
    margin-bottom: 15px;
    position: relative;
    .search-within-search__input {
      border: 1px solid @box-border-grey;
      border-radius: 0;
      color: @text-medium;
      font-size: 13px;
      height: 32px;
      position: relative;
    }
    i.fa-search {
      color: @text-dark;
      position: absolute;
      right: 8px;
      top: 7px;
    }
  }

  .empty-notification {
    color: @text-medium;
    font-size: 12px;
    font-style: italic;
    padding: 0 0 10px 0;
  }

  .empty-notification-compacted {
    color: @text-medium;
    font-size: 12px;
    font-style: italic;
  }

  .horizontal-timeline-container__topics-list {
    margin-top: 15px;
  }

  .timelines {
    min-height: 100%;
    min-width: 100%;
    overflow: hidden;
    position: relative;

    .scrolling-timelines-container {
      padding: 10px;

      .timeline-section {
        .horizontal-timeline-section-base();
        border-bottom: 0 none;
        margin-bottom: 13px;
        padding: 0;

        &.summary {
          border-bottom: solid 1px @line-grey;
          padding-bottom: 10px;
        }

        .horizontal-timeline {
          border-bottom: 0 none;
          padding-bottom: 10px;
        }
      }

      .timeline-section-compacted {
        .horizontal-timeline-section-base();
        border-bottom: 0 none;
        margin: -0;
        padding: 0;

        &.summary {
          border-bottom: solid 1px @line-grey;
          padding-bottom: 0;
        }

        .horizontal-timeline {
          border-bottom: 0 none;
          padding-bottom: 0;
        }
      }
    }
  }

  .search-for-term {
    line-height: 1rem;
    .search-within-search {
      padding: 10px;
    }
  }

  .timeline-term {
    .horizontal-timeline-name-base();
  }

  .collapse-expand-label {
    .horizontal-timeline-name-base();
    cursor: pointer;
    padding-bottom: 10px;
  }

  .timeline-type {
    .horizontal-timeline-name-subtitle-base();
  }

  .timeline-type-compacted {
    .horizontal-timeline-name-compacted();
    position: absolute;
    margin-left: 3px;
    z-index: 1;
    margin-top: 6px;
  }

  .typed-timeline {
    margin-bottom: 10px;
  }

  .typed-timeline-compacted {
    margin-top: 0;
  }

  .timeline-term-compacted {
    .horizontal-timeline-name-compacted();
    position: absolute;
    margin-left: 3px;
    z-index: 1;
    margin-top: 6px;
  }
</style>
