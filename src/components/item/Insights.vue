<template>
  <div class="horizontal-timeline-container insights" v-loading="loading">
    <div
      key="no-insights"
      class="horizontal-timeline-container__empty-notification"
      v-if="!insightGroups || !insightGroups.length"
    >
      We didn't find any matching Insights.
    </div>
    <div
      class="horizontal-timeline-container--left horizontal-timeline-container--padded"
      key="has-insights"
      v-else
      >
      <ul class="horizontal-timeline-container__topics-list">
        <li
          :class="{ 'active': group.isActive }"
          :key="group.id"
          v-for="group in insightGroups"
          @click="togglePhrase(group)"
          :style="{'color': group.isActive ? group.color : '#666'}"
        >
          <i class="fa-circle" :class="{ 'fas': group.isActive, 'far': !group.isActive }" :style="{ color: group.isActive ? group.color : 'inherit' }"></i>
          <span>{{ group.name }}</span>
        </li>
      </ul>
    </div>
    <!--expanded view-->
    <div class="horizontal-timeline-container--right" v-if="insightGroups && insightGroups.length && !collapseHorizontalTimelines">
      <div class="scrolling-timelines-container" @mouseover="getFocus()" ref="timelineContainer">
        <template v-for="group in insightGroups">
          <div
            :key="group.id"
            class="crude-language-timeline"
            v-if="duration && group.isActive"
          >
            <div class="name" :style="{'color': group.isActive ? group.color : '#666'}">{{group.name}}</div>
            <div
              :key="timeline.type"
              class="timeline-instance-wrapper"
              v-for="timeline in group.timelines"
              @click="insightTimelineClicked(timeline.type)"
            >
              <div class="timeline-name">{{ timeline.label }}</div>
              <horizontal-timeline
                :color="group.color"
                :items="timeline.histogram"
                @timeline-clicked="insightTimelineClicked(timeline.type)"
              ></horizontal-timeline>
            </div>
          </div>
        </template>
      </div>
    </div>
    <!--collapsed view-->
    <div class="horizontal-timeline-container--right" v-if="insightGroups && insightGroups.length && collapseHorizontalTimelines">
      <div class="scrolling-timelines-container" @mouseover="getFocus()" ref="timelineContainer">
        <template v-for="group in insightGroups">
          <div
            :key="group.id"
            class="crude-language-timeline"
            v-if="duration && group.isActive"
          >
            <div
              :key="timeline.type"
              class="timeline-instance-wrapper-compacted"
              v-for="timeline in group.timelines"
              @click="insightTimelineClicked(timeline.type)"
            >
              <div class="timeline-name-compacted">{{group.name}}: {{ timeline.label }}</div>
              <horizontal-timeline
                :color="group.color"
                :items="timeline.histogram"
                :is-insights="true"
                @timeline-clicked="insightTimelineClicked(timeline.type)"
              ></horizontal-timeline>
            </div>
          </div>
        </template>
      </div>
    </div>

  </div>
</template>

<script>
  import _ from 'lodash'
  import shortid from 'shortid'
  import { mapActions, mapGetters } from 'vuex'

  import api from 'src/api'
  import HorizontalTimeline from './timeline/HorizontalTimeline.vue'
  import {
    findSearchWithinByType
  } from 'src/search-within-helper'

  import { INSIGHTS } from 'src/store/storeModules'
  import { GET_INSIGHTS_BUSY, GET_INSIGHTS_GROUPS } from 'src/store/modules/item/insights/getters'
  import {LOAD_INSIGHTS, UPDATE_INSIGHTS} from 'src/store/modules/item/insights/actions'
  import PlayheadMixin from 'src/mixins/PlayheadMixin'
  import VuexItemUIStateMixin from 'src/mixins/VuexItemUIStateMixin'
  import VuexItemMixin from 'src/mixins/VuexItemMixin'
  import {REGEXES_WITH_COLORS} from 'src/store/modules/item/insights/mutations'

  export default {
    name: 'insights',

    components: {
      HorizontalTimeline
    },

    mixins: [
      PlayheadMixin,
      VuexItemMixin,
      VuexItemUIStateMixin
    ],

    computed: {
      ...mapGetters(INSIGHTS, {
        insightGroups: GET_INSIGHTS_GROUPS,
        loading: GET_INSIGHTS_BUSY
      })
    },

    mounted () {
      this.loadInsights({ isActive: false })
    },

    methods: {
      ...mapActions(INSIGHTS, {
        loadInsights: LOAD_INSIGHTS,
        updateInsights: UPDATE_INSIGHTS
      }),

      getFocus () {
        this.$refs['timelineContainer'].focus()
      },

      insightTimelineClicked (timeline) {
        const typeConfig = findSearchWithinByType(timeline)
        const vtab = _.get(typeConfig, 'verticalTab')
        if (vtab) {
          this.setVerticalTab({ name: vtab })
        }
      },

      togglePhrase (phrase, forceOn = false) {
        if (forceOn === true) {
          phrase.isActive = true
        } else {
          phrase.isActive = !phrase.isActive
        }
        // update regexes in store
        this.updateInsights()
      }
    }
  }
</script>

<style lang="less">
  @import '../../styles/main.less';

  .horizontal-timeline-container--right {
    position: relative;
  }

  .insights {
    .horizontal-timeline-container--left {
      .horizontal-timeline-container__topics-list > li {
        margin-bottom: 8px;

        &:last-of-type {
          margin-bottom: 0;
        }
      }
    }

    .crude-language-timeline {
      padding: 10px 10px;
      border-bottom: 1px solid @line-grey;

      .name {
        .horizontal-timeline-name-base();
        color: @unselected-text;
      }

      .timeline-instance-wrapper {
        &:not(:last-child) {
          padding-bottom: 10px;
        }

        .timeline {
          padding-bottom: 13px;

          &:last-child {
            padding-bottom: 0;
          }
        }

        .timeline-name {
          .horizontal-timeline-name-subtitle-base()
        }

        .horizontal-timeline {
          top: 0;
          margin-top: 5px;

          .timeline {
            margin: 0;
          }

          ol {
            top: -15px;
          }
        }
      }
    }
  }

  .timeline-instance-wrapper-compacted {
    &:not(:last-child) {
      padding-bottom: 0;
    }
    .horizontal-timeline {
      border-bottom: 0 none;
      padding-bottom: 0;
    }

    .timeline-name-compacted {
      .horizontal-timeline-name-subtitle-base-compacted();
      position: absolute;
      margin-left: 3px;
      z-index: 1;
      margin-top: 6px;
    }
  }
</style>

<style scoped lang="less">
  @import '../../styles/_variables';

  .phrase-list__item {
    border: 1px solid @color-dark;
    cursor: pointer;
    display: inline-block;
    font-weight: 400;
    margin-right: 2px;
  }
</style>
