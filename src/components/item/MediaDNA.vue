<template lang="html">
  <div class="horizontal-timeline-container media-dna">
    <div class="horizontal-timeline-container--left media-dna-nav">
      <div @click="showExportModal = false" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 2;" v-if="showExportModal"></div>
      <div style="position: relative;" @click.stop="() => {}">
        <button
          class="button-export-media-dna"
          :disabled="!canExportData"
          @click.stop="toggleExportModal()">
          Export Active Timelines<i class="far fa-file-export"></i>
        </button>
        <div class="export-popup-modal" v-if="showExportModal">
          <el-tooltip
            :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            content="Export MediaDNA timelines data into an XML file"
            effect="light"
            placement="top"
          >
            <button class="download-as-xml" @click.stop="exportMediaDNA('xml')"><i class="fa fa-download"></i> Export XML </button>
          </el-tooltip>
          <el-tooltip
            :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            content="Export MediaDNA timelines data into a CSV file"
            effect="light"
            placement="top"
          >
            <button class="download-as-csv" @click.stop="exportMediaDNA('csv')"><i class="fa fa-download"></i> Export CSV </button>
          </el-tooltip>
          <el-tooltip
            :hide-after="CONSTANTS.TOOLTIP.HIDE_DELAY"
            :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
            content="Export MediaDNA timelines data into a CSV file(Adobe)"
            effect="light"
            placement="top"
          >
            <button class="download-as-csv" @click.stop="exportMediaDNA('csv-adobe')"><i class="fa fa-download"></i> Export CSV Adobe</button>
          </el-tooltip>
        </div>
      </div>
      <el-collapse>
        <el-collapse-item name="search" title="Search term" v-if="uniqueSearchTimelines && uniqueSearchTimelines.length">
          <ul class="horizontal-timeline-container__topics-list">
            <li
              :class="{ active: searchTimeline.active }"
              :key="searchTimeline.id"
              @click.stop="toggleItem(searchTimeline)"
              v-for="searchTimeline in uniqueSearchTimelines"
              ref="topics-list-item"
            >
              <i class="fa-circle" :class="{ 'fas': searchTimeline.active, 'far': !searchTimeline.active }"></i>
              <span>{{ searchTimeline.value }}</span>
            </li>
          </ul>
        </el-collapse-item>
        <el-collapse-item name="people" title="Known People" v-if="knownPeople && knownPeople.length">
          <ul class="horizontal-timeline-container__topics-list">
            <li
              v-for="person in knownPeople"
              @click="togglePerson(person)"
              :key="person.person_id"
              :class="{ active: isPersonActive(person.person_id) }">
              <i class="fa-circle" :class="{ 'fas': isPersonActive(person.person_id), 'far': !isPersonActive(person.person_id) }"></i>
              <span>{{ person.name }}</span>
            </li>
          </ul>
        </el-collapse-item>
        <el-collapse-item name="logos" title="Known Graphics" v-if="knownGraphics && knownGraphics.length">
          <ul class="horizontal-timeline-container__topics-list">
            <li
              v-for="timeline in knownGraphics"
              :key="timeline.id"
              @click.stop="toggleKnownGraphics(timeline.id)"
              :class="{ active: activeGraphicsCategories[timeline.id] }">
              <i class="fa-circle" :class="{ 'fas': activeGraphicsCategories[timeline.id], 'far': !activeGraphicsCategories[timeline.id] }"></i>
              <span>{{ timeline.name }}</span>
            </li>
          </ul>
        </el-collapse-item>
        <el-collapse-item name="insights" title="Insights" v-if="insightGroups && insightGroups.length">
          <ul class="horizontal-timeline-container__topics-list" v-loading="loadingInsights">
            <li
              v-for="group in insightGroups"
              :key="group.id"
              @click.stop="toggleInsights(group)"
              :class="{ active: activeInsightsCategories[group.id] }"
              :style="{'color': group.isActive ? group.color : '#666'}"

            >
              <i class="fa-circle" :class="{ 'fas': activeInsightsCategories[group.id], 'far': !activeInsightsCategories[group.id] }"></i>
              <span>{{ group.name }}</span>
            </li>
          </ul>
        </el-collapse-item>
        <el-collapse-item name="audio" title="Audio" v-if="audio && audio.length">
          <ul class="horizontal-timeline-container__topics-list">
            <li
              v-for="timeline in audio"
              :key="timeline.id"
              @click.stop="toggleAudio(timeline.id)"
              :class="{ active: activeAudioCategories[timeline.id] }">
              <i class="fa-circle" :class="{ 'fas': activeAudioCategories[timeline.id], 'far': !activeAudioCategories[timeline.id] }"></i>
              <span>{{ timeline.name }}</span>
            </li>
          </ul>
        </el-collapse-item>
        <el-collapse-item name="adult" title="Adult Content" v-if="adult && adult.length">
          <ul class="horizontal-timeline-container__topics-list">
            <li
              v-for="timeline in adult"
              :key="timeline.id"
              @click.stop="toggleAdult(timeline.id)"
              :class="{ active: activeAdultCategories[timeline.id] }">
              <i class="fa-circle" :class="{ 'fas': activeAdultCategories[timeline.id], 'far': !activeAdultCategories[timeline.id] }"></i>
              <span>{{ timeline.name }}</span>
            </li>
          </ul>
        </el-collapse-item>
        <el-collapse-item name="techData" title="Technical Cues" v-if="tech && tech.length">
          <ul class="horizontal-timeline-container__topics-list">
            <li
              v-for="timeline in tech"
              :key="timeline.id"
              @click.stop="toggleTech(timeline.id)"
              :class="{ active: activeTechCategories[timeline.id] }">
              <i class="fa-circle" :class="{ 'fas': activeTechCategories[timeline.id], 'far': !activeTechCategories[timeline.id] }"></i>
              <span>{{ timeline.name }}</span>
            </li>
          </ul>
        </el-collapse-item>
        <el-collapse-item name="sports" title="Sports" v-if="sports && sports.length">
          <ul class="horizontal-timeline-container__topics-list">
            <li
              v-for="timeline in sports"
              :key="timeline.id"
              @click.stop="toggleSport(timeline.id)"
              :class="{ active: activeSportCategories[timeline.id] }">
              <i class="fa-circle" :class="{ 'fas': activeSportCategories[timeline.id], 'far': !activeSportCategories[timeline.id] }"></i>
              <span>{{ timeline.name }}</span>
            </li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!--expanded view-->
    <div class="horizontal-timeline-container--right" v-if="!collapseHorizontalTimelines">
      <div class="scrolling-timelines-container" @mouseover="getFocus()" ref="timelineContainer">
        <div class="timeline-section summary">
          <div class="section-name">Asset Overview</div>
          <horizontal-timeline :summary="true" :items="summaryItems"></horizontal-timeline>
        </div>
        <div
          :key="searchTimeline.id"
          class="timeline-section"
          v-for="searchTimeline in uniqueSearchTimelines"
          ref="term-timeline"
          v-if="searchTimeline.active"
        >
          <template v-if="searchTimeline.active">
            <div class="timeline-term">
              <span>{{ searchTimeline.value }}</span>
            </div>
            <p class="empty-notification" v-if="!searchTimeline.results || searchTimeline.results.length === 0">
              We didn't find any matches for the search query "{{ searchTimeline.value }}".
            </p>
            <template v-else>
              <div
                :key="r.id"
                class="typed-timeline"
                v-for="r in searchTimeline.results"
                ref="term-topic-timeline"
                @click="searchTermTimelineClicked(r.type)"
              >
                <div class="timeline-type"><i :class="r.iconClass"></i> {{ r.label }}</div>
                <horizontal-timeline
                  :items="r.timeline" @timeline-clicked="searchTermTimelineClicked(r.type)"
                  :is-summary="false">
                </horizontal-timeline>
              </div>
            </template>
          </template>
        </div>
        <div v-if="activeCategories.people" class="timeline-section">
          <div class="section-name">Known People</div>
          <div v-for="person in activePeople" :key="person.person_id">
            <div class="timeline-name">
              <span>{{ person.name }}</span>
            </div>
            <horizontal-timeline :items="getPersonTimeline(person.person_id)"></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.knownGraphics" class="timeline-section">
          <div class="section-name">Logos</div>
          <div
            v-for="category in knownGraphics"
            v-if="activeGraphicsCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name">
              <span>{{ category.name }}</span>
            </div>
            <horizontal-timeline :items="category.values"></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.insights" class="timeline-section category-insights" v-loading="loadingInsights">
          <div class="section-name">Insights</div>
          <div
            v-for="category in insightGroups"
            v-if="activeInsightsCategories[category.id]"
            :key="category.id"
            class="insights-group"
          >
            <div class="name" :style="{'color': category.isActive ? category.color : '#666'}">{{ category.name }}</div>
            <div
              v-for="timeline in category.timelines"
              :key="timeline.type"
              @click="insightTimelineClicked(timeline.type)"
              class="timeline-instance-wrapper">
              <div class="timeline-name">{{ timeline.label }}</div>
              <horizontal-timeline :color="category.color" :items="timeline.histogram" @timeline-clicked="insightTimelineClicked(timeline.type)"></horizontal-timeline>
            </div>
          </div>
        </div>
        <div v-if="activeCategories.audio" class="timeline-section">
          <div class="section-name">Audio</div>
          <div
            v-for="category in audio"
            v-if="activeAudioCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name">{{category.name}}</div>
            <horizontal-timeline :items="category.values"></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.adult" class="timeline-section category-adult">
          <div class="section-name">Adult Content</div>
          <div
            v-for="category in adult"
            class="adult-content-timeline"
            v-if="activeAdultCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name">{{category.name}}</div>
            <horizontal-timeline :items="category.values"></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.tech" class="timeline-section">
          <div class="section-name">Technical Cues</div>
          <div
            v-for="category in tech"
            v-if="activeTechCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name">{{category.name}}</div>
            <horizontal-timeline :items="category.values"></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.sports" class="timeline-section">
          <div class="section-name">Sports</div>
          <div
            v-for="category in sports"
            v-if="activeSportCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name">{{category.name}}</div>
            <horizontal-timeline :items="category.values"></horizontal-timeline>
          </div>
        </div>
      </div>
    </div>

    <!--collapsed view-->
    <div class="horizontal-timeline-container--right" v-if="collapseHorizontalTimelines">
      <div class="scrolling-timelines-container" @mouseover="getFocus()" ref="timelineContainer">
        <div
          :key="searchTimeline.id"
          class="timeline-section-compacted"
          v-for="searchTimeline in uniqueSearchTimelines"
          ref="term-timeline"
        >
          <template v-if="searchTimeline.active">
            <p class="empty-notification-compacted" v-if="!searchTimeline.results || searchTimeline.results.length === 0">
              We didn't find any matches for the search query "{{ searchTimeline.value }}".
            </p>
            <template v-if="searchTimeline.results || searchTimeline.results.length > 0">
              <div
                :key="r.id"
                class="typed-timeline-compacted"
                v-for="r in searchTimeline.results"
                ref="term-topic-timeline"
                @click="searchTermTimelineClicked(r.type)"
              >
                <div class="timeline-type-compacted">{{ searchTimeline.value }} : {{ r.label }}</div>
                <horizontal-timeline
                  :items="r.timeline" @timeline-clicked="searchTermTimelineClicked(r.type)"
                  :is-summary="false">
                </horizontal-timeline>
              </div>
            </template>
          </template>
        </div>
        <div v-if="activeCategories.people" class="timeline-section-compacted">
          <div v-for="person in activePeople" :key="person.person_id">
            <div class="timeline-name-compacted">
              <span>KNOWN PEOPLE: {{ person.name }}</span>
            </div>
            <horizontal-timeline :items="getPersonTimeline(person.person_id)"></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.knownGraphics" class="timeline-section-compacted">
          <div
            v-for="category in knownGraphics"
            v-if="activeGraphicsCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name-compacted">
              <span>LOGOS: {{ category.name }}</span>
            </div>
            <horizontal-timeline
              :items="category.values"
            ></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.insights" class="timeline-section-compacted category-insights" v-loading="loadingInsights">
          <div
            v-for="category in insightGroups"
            v-if="activeInsightsCategories[category.id]"
            :key="category.id"
          >
            <div
              v-for="timeline in category.timelines"
              :key="timeline.type"
              @click="insightTimelineClicked(timeline.type)"
              class="timeline-instance-wrapper">
              <div class="timeline-name-compacted">{{ category.name }}: {{ timeline.label }}</div>
              <horizontal-timeline :color="category.color" :items="timeline.histogram" @timeline-clicked="insightTimelineClicked(timeline.type)"></horizontal-timeline>
            </div>
          </div>
        </div>
        <div v-if="activeCategories.audio" class="timeline-section-compacted">
          <div
            v-for="category in audio"
            v-if="activeAudioCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name-compacted">AUDIO: {{category.name}}</div>
            <horizontal-timeline :items="category.values"></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.adult" class="timeline-section-compacted category-adult">
          <div
            v-for="category in adult"
            class="adult-content-timeline"
            v-if="activeAdultCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name-compacted">ADULT CONTENT: {{category.name}}</div>
            <horizontal-timeline :items="category.values"></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.tech" class="timeline-section-compacted">
          <div
            v-for="category in tech"
            v-if="activeTechCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name-compacted">TECHNICAL CUES: {{category.name}}</div>
            <horizontal-timeline :items="category.values"></horizontal-timeline>
          </div>
        </div>
        <div v-if="activeCategories.sports" class="timeline-section-compacted">
          <div
            v-for="category in sports"
            v-if="activeSportCategories[category.id]"
            :key="category.id"
          >
            <div class="timeline-name-compacted">SPORTS: {{category.name}}</div>
            <horizontal-timeline :items="category.values"></horizontal-timeline>
          </div>
        </div>
        <horizontal-timeline
          :summary="true"
          :items="summaryItems"
          :is-summary="true"
        ></horizontal-timeline>
      </div>
    </div>

  </div>
</template>

<script>
  import _ from 'lodash'
  import {mapActions, mapGetters, mapMutations} from 'vuex'
  import api from 'src/api'
  import HorizontalTimeline from './timeline/HorizontalTimeline'
  import {
    findSearchWithinByType
  } from 'src/search-within-helper'
  import {
    ADULT,
    AUDIO, HIGHLIGHTS,
    INSIGHTS,
    ITEM,
    KNOWN_GRAPHICS,
    PEOPLE_FACES, SEARCH_WITHIN_ITEM,
    SPORTS,
    TECH
  } from 'src/store/storeModules'

  import {
    AUDIO_DATA,
    AUDIO_TRACK_INFO, DOCUMENT_METADATA, EXIV2,
    EXTERNAL_METADATA, GENERAL_METADATA,
    IMAGE_DATA,
    ITEM_ID,
    ITEM_INFO, LOUDNESS_DATA,
    STOW_METADATA,
    VIDEO_DATA
  } from 'src/store/modules/item/getterTypes'
  import { GET_KNOWN_PEOPLE, GET_PERSON_TIMELINES } from 'src/store/modules/people-faces/getters'
  import { FETCH_ITEM_PEOPLE, FETCH_ITEM_PERSON_TIMELINE } from 'src/store/modules/people-faces/actions'
  import { GET_INSIGHTS_BUSY, GET_INSIGHTS_GROUPS } from 'src/store/modules/item/insights/getters'
  import {LOAD_INSIGHTS, UPDATE_INSIGHTS} from 'src/store/modules/item/insights/actions'

  import LocationEnforcerMixin from 'src/components/global/LocationEnforcerMixin'
  import VuexItemUIStateMixin from 'src/mixins/VuexItemUIStateMixin'
  import VuexItemMixin from 'src/mixins/VuexItemMixin'
  import {GET_ADULT_TIMELINES} from 'src/store/modules/item/adult/getters'
  import {LOAD_ADULT_TIMELINES} from 'src/store/modules/item/adult/actions'
  import {GET_AUDIO_TIMELINES} from 'src/store/modules/item/audio/getters'
  import {GET_KNOWN_GRAPHICS_TIMELINES} from 'src/store/modules/item/known–graphics/getters'
  import {GET_SPORTS_TIMELINES} from 'src/store/modules/item/sports/getters'
  import {GET_TECH_TIMELINES} from 'src/store/modules/item/tech/getters'
  import {
    CLEAR_SEARCH_TIMELINES,
    GET_SEARCH_TIMELINES,
    GET_SEARCH_WITHIN_ITEM_BUSY, SET_TIMELINE_ACTIVE
  } from '../../store/modules/item/search-within-item/search-within-item'
  import {
    ADD_GLOBAL_HIGHLIGHT_TERM,
    ADD_HIGHLIGHT_TERM,
    REMOVE_GLOBAL_HIGHLIGHT_TERM, REMOVE_HIGHLIGHT_TERM
  } from '../../store/modules/highlights/highlights'
  import {getDisplayTimeCodeOrFrame} from '../../store/modules/item/helpers'

  export default {
    name: 'media-dna',
    mixins: [
      LocationEnforcerMixin,
      VuexItemMixin,
      VuexItemUIStateMixin
    ],
    components: {
      HorizontalTimeline
    },
    mounted () {
      this.loadData()
    },
    data () {
      return {
        activeAdultCategories: {},
        activeAudioCategories: {},
        activeGraphicsCategories: {},
        activeInsightsCategories: {},
        activeSportCategories: {},
        activeTechCategories: {},
        activePeople: [],
        showExportModal: false,
        xhttp: null
      }
    },

    computed: {
      ...mapGetters(ITEM, {
        itemId: ITEM_ID,
        videoData: VIDEO_DATA,
        itemInfo: ITEM_INFO,
        stowMetadata: STOW_METADATA,
        externalMetadata: EXTERNAL_METADATA,
        imageData: IMAGE_DATA,
        audioTrackInfo: AUDIO_TRACK_INFO,
        loudnessData: LOUDNESS_DATA,
        audioData: AUDIO_DATA,
        generalMetadata: GENERAL_METADATA,
        exiv2: EXIV2,
        documentMetadata: DOCUMENT_METADATA
      }),

      ...mapGetters(PEOPLE_FACES, {
        knownPeople: GET_KNOWN_PEOPLE,
        peopleTimelines: GET_PERSON_TIMELINES
      }),

      ...mapGetters(ADULT, {
        adult: GET_ADULT_TIMELINES
      }),

      ...mapGetters(AUDIO, {
        audio: GET_AUDIO_TIMELINES
      }),

      ...mapGetters(KNOWN_GRAPHICS, {
        knownGraphics: GET_KNOWN_GRAPHICS_TIMELINES
      }),

      ...mapGetters(SPORTS, {
        sports: GET_SPORTS_TIMELINES
      }),

      ...mapGetters(TECH, {
        tech: GET_TECH_TIMELINES
      }),

      ...mapGetters(INSIGHTS, {
        insightGroups: GET_INSIGHTS_GROUPS,
        loadingInsights: GET_INSIGHTS_BUSY
      }),

      ...mapGetters(SEARCH_WITHIN_ITEM, {
        searching: GET_SEARCH_WITHIN_ITEM_BUSY,
        searchTimelines: GET_SEARCH_TIMELINES
      }),

      uniqueSearchTimelines () {
        return this.searchTimelines.filter((item, index) => this.searchTimelines.findIndex(i => i.value === item.value) === index)
      },

      canExportData () {
        let noDataFlag = true

        if (this.activePeople.length > 0) {
          return true
        }

        if (this.uniqueSearchTimelines) {
          _.each(this.uniqueSearchTimelines, searchTimeline => {
            if (_.get(searchTimeline, 'active')) {
              noDataFlag = false
              return false
            }
          })
        }
        if (!noDataFlag) {
          return true
        }

        if (this.insightGroups) {
          _.forEach(this.insightGroups, timeline => {
            if (this.activeInsightsCategories[timeline.id] && 'timelines' in timeline) {
              _.forEach(timeline.timelines, time => {
                _.forEach(time.histogram, histogram => {
                  noDataFlag = false
                  return false
                })
              })
            }
          })
        }
        if (!noDataFlag) {
          return true
        }

        if (this.adult) {
          _.forEach(this.adult, timeline => {
            if (this.activeAdultCategories[timeline.id] && 'values' in timeline) {
              noDataFlag = false
              return false
            }
          })
        }
        if (!noDataFlag) {
          return true
        }

        if (this.audio) {
          _.forEach(this.audio, timeline => {
            if (this.activeAudioCategories[timeline.id] && 'values' in timeline) {
              noDataFlag = false
              return false
            }
          })
        }
        if (!noDataFlag) {
          return true
        }

        if (this.knownGraphics) {
          _.forEach(this.knownGraphics, timeline => {
            if (this.activeGraphicsCategories[timeline.id] && 'values' in timeline) {
              noDataFlag = false
              return false
            }
          })
        }
        if (!noDataFlag) {
          return true
        }

        if (!this.isSaasPlatform && this.sports) {
          _.forEach(this.sports, timeline => {
            if (this.activeSportCategories[timeline.id] && 'values' in timeline) {
              noDataFlag = false
              return false
            }
          })
        }
        if (!noDataFlag) {
          return true
        }

        if (this.tech) {
          _.forEach(this.tech, timeline => {
            if (this.activeTechCategories[timeline.id] && 'values' in timeline) {
              noDataFlag = false
              return false
            }
          })
        }

        return !noDataFlag
      },

      summaryItems () {
        let summary = []

        if (this.uniqueSearchTimelines) {
          _.each(this.uniqueSearchTimelines, searchTimeline => {
            if (_.get(searchTimeline, 'active')) {
              _.each(_.get(searchTimeline, 'results'), t => {
                summary = summary.concat(t.timeline)
              })
            }
          })
        }

        if (this.insightGroups) {
          _.forEach(this.insightGroups, timeline => {
            if (this.activeInsightsCategories[timeline.id] && 'timelines' in timeline) {
              _.forEach(timeline.timelines, time => {
                summary = summary.concat(time.histogram)
              })
            }
          })
        }

        if (this.adult) {
          _.forEach(this.adult, timeline => {
            if (this.activeAdultCategories[timeline.id] && 'values' in timeline) {
              summary = summary.concat(timeline.values.map(value => value))
            }
          })
        }

        if (this.audio) {
          _.forEach(this.audio, timeline => {
            if (this.activeAudioCategories[timeline.id] && 'values' in timeline) {
              summary = summary.concat(timeline.values.map(value => value))
            }
          })
        }

        if (this.knownGraphics) {
          _.forEach(this.knownGraphics, timeline => {
            if (this.activeGraphicsCategories[timeline.id] && 'values' in timeline) {
              summary = summary.concat(timeline.values.map(value => value))
            }
          })
        }

        if (!this.isSaasPlatform && this.sports) {
          _.forEach(this.sports, timeline => {
            if (this.activeSportCategories[timeline.id] && 'values' in timeline) {
              summary = summary.concat(timeline.values.map(value => value))
            }
          })
        }

        if (this.tech) {
          _.forEach(this.tech, timeline => {
            if (this.activeTechCategories[timeline.id] && 'values' in timeline) {
              summary = summary.concat(timeline.values.map(value => value))
            }
          })
        }

        this.activePeople.forEach(person => {
          summary = summary.concat(this.getPersonTimeline(person.person_id))
        })

        return summary
      },

      activeCategories () {
        let adultActive = !!_.find(this.activeAdultCategories, active => { return active })
        let audioActive = !!_.find(this.activeAudioCategories, active => { return active })
        let insightsActive = !!_.find(this.activeInsightsCategories, active => { return active })
        let knownGraphicsActive = !!_.find(this.activeGraphicsCategories, active => { return active })
        let sportsActive = !!_.find(this.activeSportCategories, active => { return active })
        let techActive = !!_.find(this.activeTechCategories, active => { return active })
        return {
          adult: adultActive,
          audio: audioActive,
          insights: insightsActive,
          knownGraphics: knownGraphicsActive,
          people: this.activePeople.length > 0,
          sports: sportsActive,
          tech: techActive
        }
      }
    },

    methods: {
      ...mapActions(PEOPLE_FACES, {
        fetchPeopleByItem: FETCH_ITEM_PEOPLE,
        fetchPersonTimeline: FETCH_ITEM_PERSON_TIMELINE
      }),

      ...mapActions(INSIGHTS, {
        loadInsights: LOAD_INSIGHTS,
        updateInsights: UPDATE_INSIGHTS
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

      getFocus () {
        this.$refs['timelineContainer'].focus()
      },

      getPersonTimeline (personId) {
        return _.get(this.peopleTimelines, `[${personId}].timelines[${this.CONSTANTS.ALL_EMOTIONS}]`, []) || []
      },

      searchTermTimelineClicked (timeline) {
        const typeConfig = findSearchWithinByType(timeline)
        const vtab = _.get(typeConfig, 'verticalTab')
        if (vtab) {
          this.setVerticalTab({ name: vtab })
        }
      },

      insightTimelineClicked (timeline) {
        const typeConfig = findSearchWithinByType(timeline)
        const vtab = _.get(typeConfig, 'verticalTab')
        if (vtab) {
          this.setVerticalTab({ name: vtab })
        }
      },

      async loadAdult () {
        try {
          this.activeAdultCategories = {}
          _.forEach(this.adult, cat => {
            this.$set(this.activeAdultCategories, cat.id, false)
          })
        } catch (err) {
          console.error(err)
        }
      },
      loadAudio () {
        this.activeAudioCategories = this.audio.reduce((activeAudioCategories, cat) => {
          return {
            ...activeAudioCategories,
            [cat.id]: false
          }
        }, {})
      },
      loadData () {
        this.loadAdult()
        this.loadAudio()
        this.loadInsightGroups()
        this.loadKnownGraphics()
        this.fetchPeopleByItem(this.itemId)
        this.loadTechData()

        if (!this.isSaasPlatform) {
          this.loadSports()
        }
      },
      loadKnownGraphics () {
        this.activeGraphicsCategories = this.knownGraphics.reduce((activeGraphicsCategories, cat) => {
          return {
            ...activeGraphicsCategories,
            [cat.id]: false
          }
        }, {})
      },
      async loadInsightGroups () {
        try {
          await this.loadInsights({ isActive: false })

          this.activeInsightsCategories = this.insightGroups.reduce((activeInsightsCategories, cat) => {
            return {
              ...activeInsightsCategories,
              [cat.id]: false
            }
          }, {})
        } catch (err) {
          console.error('error loading insights', err)
          throw err
        }
      },
      loadSports () {
        this.activeSportCategories = this.sports.reduce((activeSportCategories, cat) => {
          return {
            ...activeSportCategories,
            [cat.id]: false
          }
        }, {})
      },
      loadTechData () {
        this.activeTechCategories = this.tech.reduce((activeTechCategories, cat) => {
          return {
            ...activeTechCategories,
            [cat.id]: false
          }
        }, {})
      },
      toggleAudio (id) {
        this.activeAudioCategories[id] = !this.activeAudioCategories[id]
      },
      toggleAdult (id) {
        this.activeAdultCategories[id] = !this.activeAdultCategories[id]
      },
      toggleInsights (group) {
        this.activeInsightsCategories[group.id] = !this.activeInsightsCategories[group.id]
        group.isActive = !group.isActive

        // update regexes in store
        this.updateInsights()
      },
      toggleKnownGraphics (id) {
        this.activeGraphicsCategories[id] = !this.activeGraphicsCategories[id]
      },
      toggleSport (id) {
        this.activeSportCategories[id] = !this.activeSportCategories[id]
      },
      toggleTech (id) {
        this.activeTechCategories[id] = !this.activeTechCategories[id]
      },
      togglePerson (person) {
        const personId = person.person_id
        const existingIndex = this.activePeople.findIndex(p => p.person_id === personId)
        if (existingIndex >= 0) {
          this.activePeople.splice(existingIndex, 1)
        } else {
          this.fetchPersonTimeline({ itemId: this.itemId, personId })
          this.activePeople.push(person)
        }
      },
      isPersonActive (personId) {
        const existingIndex = this.activePeople.findIndex(p => p.person_id === personId)
        return existingIndex >= 0
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
      toggleExportModal () {
        this.showExportModal = !this.showExportModal
      },
      jsonToExport () {
        let jsonData
        let noDataFlag = true

        let searchTimelinesToExport = []
        let insightGroupsToExport = []
        let adultsToExport = []
        let audiosToExport = []
        let knownGraphicsToExport = []
        let sportsToExport = []
        let techToExport = []

        let frameRate, frameCount
        if (this.videoData && this.videoData.details) {
          let videoInfo = this.videoData.details
          if (videoInfo && videoInfo.video && videoInfo.video.frame_rate) {
            frameRate = videoInfo.video.frame_rate
          }
          if (videoInfo && videoInfo.video && videoInfo.video.frame_count) {
            frameCount = videoInfo.video.frame_count
          }
        }
        if (!frameRate) {
          frameRate = 24 // default 24 FPS
        }

        let peopleTimelinesToExport = this.activePeople
        peopleTimelinesToExport.forEach(person => {
          let timelinesData = this.getPersonTimeline(person.person_id)
          person.timelines = timelinesData.map((item) => {
            return {
              ...item,
              duration: getDisplayTimeCodeOrFrame(item.end_at - item.start_at, frameRate, frameCount, undefined, 'timecode'),
              start_frame_no: getDisplayTimeCodeOrFrame(item.start_at, frameRate, frameCount, undefined, 'framenumber'),
              end_frame_no: getDisplayTimeCodeOrFrame(item.end_at, frameRate, frameCount, undefined, 'framenumber')
            }
          })
        })
        if (peopleTimelinesToExport.length > 0) {
          noDataFlag = false
        }

        if (this.uniqueSearchTimelines) {
          _.each(this.uniqueSearchTimelines, searchTimeline => {
            if (_.get(searchTimeline, 'active')) {
              searchTimelinesToExport.push({
                ...searchTimeline,
                results: searchTimeline.results.map((result) => {
                  return {
                    ...result,
                    timeline: result.timeline.map((timeline) => {
                      return {
                        ...timeline,
                        duration: getDisplayTimeCodeOrFrame(timeline.end_at - timeline.start_at, frameRate, frameCount, undefined, 'timecode'),
                        start_frame_no: getDisplayTimeCodeOrFrame(timeline.start_at, frameRate, frameCount, undefined, 'framenumber'),
                        end_frame_no: getDisplayTimeCodeOrFrame(timeline.end_at, frameRate, frameCount, undefined, 'framenumber')
                      }
                    })
                  }
                })
              })
              noDataFlag = false
            }
          })
        }

        if (this.insightGroups) {
          _.forEach(this.insightGroups, timeline => {
            if (this.activeInsightsCategories[timeline.id] && 'timelines' in timeline) {
              _.forEach(timeline.timelines, time => {
                _.forEach(time.histogram, histogram => {
                  insightGroupsToExport.push({
                    ...histogram,
                    label: timeline.name,
                    matched_search_terms: time.type + ' - ' + histogram.matched_search_terms,
                    duration: getDisplayTimeCodeOrFrame(histogram.end_at - histogram.start_at, frameRate, frameCount, undefined, 'timecode'),
                    start_frame_no: getDisplayTimeCodeOrFrame(histogram.start_at, frameRate, frameCount, undefined, 'framenumber'),
                    end_frame_no: getDisplayTimeCodeOrFrame(histogram.end_at, frameRate, frameCount, undefined, 'framenumber')
                  })
                  noDataFlag = false
                })
              })
            }
          })
        }

        if (this.adult) {
          _.forEach(this.adult, timeline => {
            if (this.activeAdultCategories[timeline.id] && 'values' in timeline) {
              adultsToExport.push({
                ...timeline,
                name: 'adult - ' + timeline.name,
                values: timeline.values.map((item) => {
                  return {
                    ...item,
                    duration: getDisplayTimeCodeOrFrame(item.end_at - item.start_at, frameRate, frameCount, undefined, 'timecode'),
                    start_frame_no: getDisplayTimeCodeOrFrame(item.start_at, frameRate, frameCount, undefined, 'framenumber'),
                    end_frame_no: getDisplayTimeCodeOrFrame(item.end_at, frameRate, frameCount, undefined, 'framenumber')
                  }
                })
              })
              noDataFlag = false
            }
          })
        }

        if (this.audio) {
          _.forEach(this.audio, timeline => {
            if (this.activeAudioCategories[timeline.id] && 'values' in timeline) {
              audiosToExport.push({
                ...timeline,
                values: timeline.values.map((item) => {
                  return {
                    ...item,
                    duration: getDisplayTimeCodeOrFrame(item.end_at - item.start_at, frameRate, frameCount, undefined, 'timecode'),
                    start_frame_no: getDisplayTimeCodeOrFrame(item.start_at, frameRate, frameCount, undefined, 'framenumber'),
                    end_frame_no: getDisplayTimeCodeOrFrame(item.end_at, frameRate, frameCount, undefined, 'framenumber')
                  }
                })
              })
              noDataFlag = false
            }
          })
        }

        if (this.knownGraphics) {
          _.forEach(this.knownGraphics, timeline => {
            if (this.activeGraphicsCategories[timeline.id] && 'values' in timeline) {
              knownGraphicsToExport.push({
                ...timeline,
                values: timeline.values.map((item) => {
                  return {
                    ...item,
                    duration: getDisplayTimeCodeOrFrame(item.end_at - item.start_at, frameRate, frameCount, undefined, 'timecode'),
                    start_frame_no: getDisplayTimeCodeOrFrame(item.start_at, frameRate, frameCount, undefined, 'framenumber'),
                    end_frame_no: getDisplayTimeCodeOrFrame(item.end_at, frameRate, frameCount, undefined, 'framenumber')
                  }
                })
              })
              noDataFlag = false
            }
          })
        }

        if (!this.isSaasPlatform && this.sports) {
          _.forEach(this.sports, timeline => {
            if (this.activeSportCategories[timeline.id] && 'values' in timeline) {
              sportsToExport.push({
                ...timeline,
                values: timeline.values.map((item) => {
                  return {
                    ...item,
                    duration: getDisplayTimeCodeOrFrame(item.end_at - item.start_at, frameRate, frameCount, undefined, 'timecode'),
                    start_frame_no: getDisplayTimeCodeOrFrame(item.start_at, frameRate, frameCount, undefined, 'framenumber'),
                    end_frame_no: getDisplayTimeCodeOrFrame(item.end_at, frameRate, frameCount, undefined, 'framenumber')
                  }
                })
              })
              noDataFlag = false
            }
          })
        }

        if (this.tech) {
          _.forEach(this.tech, timeline => {
            if (this.activeTechCategories[timeline.id] && 'values' in timeline) {
              techToExport.push({
                ...timeline,
                values: timeline.values.map((item) => {
                  return {
                    ...item,
                    duration: getDisplayTimeCodeOrFrame(item.end_at - item.start_at, frameRate, frameCount, undefined, 'timecode'),
                    start_frame_no: getDisplayTimeCodeOrFrame(item.start_at, frameRate, frameCount, undefined, 'framenumber'),
                    end_frame_no: getDisplayTimeCodeOrFrame(item.end_at, frameRate, frameCount, undefined, 'framenumber')
                  }
                })
              })
              noDataFlag = false
            }
          })
        }

        if (noDataFlag) {
          return null
        }

        jsonData = {
          'mediaDna': {
            'itemId': this.itemId,
            'videoData': this.videoData,
            'stowMetadata': this.stowMetadata,
            'externalMetadata': this.externalMetadata,
            'imageData': this.imageData,
            'audioTrackInfo': this.audioTrackInfo,
            'loudnessData': this.loudnessData,
            'audioData': this.audioData,
            'generalMetadata': this.generalMetadata,
            'itemInfo': {
              ...this.itemInfo,
              details: {
                file_name: this.itemInfo.details['File Name'],
                graymeta_item_type: this.itemInfo.details['GrayMeta Item Type'],
                item_id: this.itemInfo.details['Item ID'],
                location_id: this.itemInfo.details['Location ID'],
                location_name: this.itemInfo.details['Location Name'],
                mime_type: this.itemInfo.details['Mime Type'],
                size: this.itemInfo.details['Size'],
                stow_name: this.itemInfo.details['Stow Name'],
                stow_container_id: this.itemInfo.details['Stow Container ID'],
                stow_url: this.itemInfo.details['Stow URL']
              }
            },
            'exiv2': this.exiv2,
            'documentMetadata': this.documentMetadata,
            'externalMetaData': this.externalMetaData,
            'search': searchTimelinesToExport,
            'insightGroups': insightGroupsToExport,
            'adult': adultsToExport,
            'audio': audiosToExport,
            'knownGraphics': knownGraphicsToExport,
            'sports': sportsToExport,
            'tech': techToExport,
            'people': peopleTimelinesToExport
          }
        }

        return jsonData
      },

      async exportMediaDNA (format) {
        this.toggleExportModal()
        const jsonToExport = this.jsonToExport()
        if (!jsonToExport) {
          return
        }

        console.debug("debug::jsonToExport", jsonToExport)
        const xmlTxt = this.jsonToXML(jsonToExport)
        let xsl
        if (format === 'csv') {
          xsl = this.loadXMLDoc('/static/xslt/mediadna.xslt')
        } else if (format === 'csv-adobe') {
          xsl = this.loadXMLDoc('/static/xslt/csvadobe.xslt')
        } else if (format === 'xml') {
          xsl = this.loadXMLDoc('/static/xslt/xmeml.xslt')
        }

        let documentFragmentString

        if (window.ActiveXObject || this.xhttp.responseType === 'msxml-document') {
          let xml = new ActiveXObject('MSXML2.DOMDocument')
          xml.async = false
          xml.loadXML(xmlTxt)
          if (xml.parseError.errorCode !== 0) {
            document.write('Error in XML<br><br>Line ' + xml.parseError.line + ': ' + xml.parseError.reason)
            alert('Error in XML\n\nLine ' + xml.parseError.line + ': ' + xml.parseError.reason)
            return false
          }
          documentFragmentString = xml.transformNode(xsl)
        } else if (document.implementation && document.implementation.createDocument) { // code for Chrome, Firefox, Opera, etc.
          let xsltProcessor = new XSLTProcessor()
          xsltProcessor.importStylesheet(xsl)
          let doc = new DOMParser()
          const xml = doc.parseFromString(xmlTxt, 'text/xml')
          const resultDocument = xsltProcessor.transformToFragment(xml, document)

          const serializer = new XMLSerializer()
          documentFragmentString = serializer.serializeToString(resultDocument)
        }

        let fileName = ''
        let csvContent = ''

        if (format === 'csv') {
          fileName = 'AiR_export_' + this.itemId + '.csv'
          csvContent = 'data:text/csv;charset=utf-8,' + documentFragmentString
        } else if (format === 'csv-adobe') {
          fileName = 'AiR_export_adobe_' + this.itemId + '.csv'
          csvContent = 'data:text/plain;charset=utf-8,' + documentFragmentString
        } else if (format === 'xml') {
          fileName = 'AiR_export_' + this.itemId + '.xml'
          csvContent = 'data:text/plain;charset=utf-8,' +
            '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n' + documentFragmentString
        }


        var encodedUri = encodeURI(csvContent)
        var link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', fileName)
        document.body.appendChild(link)

        link.click()
      },

      jsonToXML (obj) {
        let xml = ''
        for (const prop in obj) {
          xml += obj[prop] instanceof Array ? '' : '<' + prop + '>'
          if (obj[prop] instanceof Array) {
            for (const array in obj[prop]) {
              xml += '<' + prop + '>'
              xml += this.jsonToXML(new Object(obj[prop][array]))
              xml += '</' + prop + '>'
            }
          } else if (typeof obj[prop] === 'object') {
            xml += this.jsonToXML(new Object(obj[prop]))
          } else {
            xml += obj[prop]
          }
          xml += obj[prop] instanceof Array ? '' : '</' + prop + '>'
        }
        xml = xml.replace(/<\/?[0-9]{1,}>/g, '')
                .replace('&', '&#38;')
        return xml

      },

      loadXMLDoc (filename) {
        if (window.ActiveXObject) {
          this.xhttp = new ActiveXObject('Msxml2.XMLHTTP')
        } else {
          this.xhttp = new XMLHttpRequest()
        }
        this.xhttp.open('GET', filename, false)

        try {
          this.xhttp.responseType = 'msxml-document'
        } catch (err) {} // Helping IE11
        this.xhttp.send('')
        return this.xhttp.responseXML
      }
    }
  }
</script>

<style lang="less" scoped>
@import (reference) '../../styles/main';
@export-button-height: 40px;
@export-button-background-light: lighten(@color-accent, 10%);
@export-button-background-medium: darken(@color-accent, 10%);
@export-button-background-dark: darken(@color-accent, 10%);
@export-button-background-darker: darken(@color-accent, 25%);

.media-dna {

  .button-export-media-dna {
    align-items: center;
    background-color: transparent;
    border: 0 none;
    border-radius: 0;
    cursor: pointer;
    display: flex;
    height: @export-button-height;
    padding-left: 15px;
    padding-right: 15px;
    width: 100%;
    justify-content: end;
    i.far {
      font-size: 15px;
      margin-left: 4px;
    }
    &.active:hover {
      color: @export-button-background-medium;
    }
    &.active {
      background-color: @export-button-background-medium;
      color: @color-base;
    }
    &:focus, &:active {
      outline: none;
    }
  }

  .export-popup-modal {
    background: #479db9;
    z-index: 3;
    position: absolute;
    right: 0;
    color: white;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .export-popup-modal button {
      background-color: @export-button-background-light;
      border: none;
      border-bottom: 1px solid white;
      border-radius: 0;
      color: @color-base;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 10px;
      text-transform: uppercase;
      &:hover {
        background-color: @color-base;
        color: @export-button-background-light;
      }
      &:focus, &:active {
        outline: none;
      }
  }

  .horizontal-timeline-container--left {
    .horizontal-timeline-container__topics-list > li {
      margin-bottom: 8px;

      &:last-of-type {
        margin-bottom: 0;
      }
    }
  }

  .horizontal-timeline-container--right {
    position: relative;
  }

  .section-name {
    .horizontal-timeline-name-base();
  }

  .timeline-section-compacted {
    margin-top: 0;
    .horizontal-timeline {
      border-bottom: 0 none;
      padding-bottom: 0;
    }
  }

  .timeline-section {
    .horizontal-timeline-section-base();

    &.category-insights {
      padding-left: 0;
      padding-right: 0;
      padding-bottom: 0;
      border-bottom: none;

      .section-name {
        padding-left: 10px;
      }

      .insights-group {
        padding: 10px;

        &.first {
          padding: 0 10px 10px 10px;
        }

        .name {
          font-size: 0.8em;
          font-weight: bold;
          text-transform: uppercase;
          color: @color-primary;
        }

        border-bottom: 1px solid @line-grey;
      }
    }

  }

  .typed-timeline-compacted {
    margin-top: 0;
  }

  .timeline-name {
    .horizontal-timeline-name-subtitle-base()
  }

  .timeline-name-compacted {
    .horizontal-timeline-name-subtitle-base-compacted();
    position: absolute;
    margin-left: 3px;
    z-index: 1;
    margin-top: 6px;
  }

  .vertical-scrubber--wrap {
    position: absolute;
    height: 100%;
    left: 10px;
    right: 10px;
    .vertical-scrubber--wrap-inner {
      bottom: 0;
      position: absolute;
      left: 0;
      top: 0;
      z-index: 1;
    }
    i.far {
      color: @text-dark;
      // note: kinda hacky, but no way around it...
      font-size: 20px;
      left: -6px;
      position: absolute;
      top: -7px;
    }
    .vertical-scrubber {
      width: 2px;
      height: 100%;
      background-color: @text-dark;
      margin-left: -1px;
      cursor: pointer;
    }
  }
}

</style>
<style lang="less">
  .media-dna {
    .media-dna-nav {
      .el-collapse {
        border: none;
        overflow: hidden;

        .el-collapse-item__arrow {
          line-height: 30px;
        }

        .el-collapse-item__content {
          padding: 10px 15px 25px;
        }

        .el-collapse-item.is-active .el-collapse-item__header__arrow {
          transform: rotate(90deg);
        }

        .el-collapse-item__header {
          background-color: rgb(217, 217, 217) !important;
          border: none;
          margin-bottom: 1px;
          height: 30px;
          line-height: 34px;
          text-transform: uppercase;
          font-weight: bold;
          font-size: .8em;
          position: relative;
          color: black;
          padding-left: 15px;

          .el-collapse-item__header__arrow {
            position: absolute;
            right: 5px;
            top: 10px;
            transform: scaleX(-1);

            &::before {
              content: "\e606";
            }
          }
        }

        .el-collapse-item__wrap {
          background: transparent;
          border: none;
        }
      }
    }
  }
</style>
