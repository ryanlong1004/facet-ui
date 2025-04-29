<template>
  <div class="categories-with-summary horizontal-timeline-container">
    <div class="horizontal-timeline-container__empty-notification" v-if="loading">
      Loading {{title}}.
    </div>
    <div class="horizontal-timeline-container__empty-notification" v-else-if="!categories || !categories.length">
      We didn't detect any {{title}} in this file.
    </div>
    <div class="horizontal-timeline-container--left horizontal-timeline-container--padded" v-else>
      <ul class="horizontal-timeline-container__topics-list">
        <li
          :class="{ active: loadedCategories[item.id] }"
          :key="item.id"
          @click.stop="toggleCategory(item)"
          v-for="item in categories"
          >
          <i class="fa-circle" :class="{ 'fas': loadedCategories[item.id], 'far': !loadedCategories[item.id] }"></i>
          <span>{{ item.name }}</span>
        </li>
      </ul>
    </div>
    <!--expanded view-->
    <div class="horizontal-timeline-container--right" v-if="categories && categories.length && !collapseHorizontalTimelines">
      <div
        @mouseover="getFocus()"
        ref="timelineContainer"
        class="scrolling-timelines-container"
      >
        <div v-if="showSummary" class="categories-with-summary-timeline summary">
          <div class="overview">Asset Overview</div>
          <horizontal-timeline
            :summary="true"
            :items="summary.values"
            :scale="0.4"
          ></horizontal-timeline>
        </div>

        <div v-for="category in categories" class="categories-with-summary-timeline" :key="category.id">
          <template v-if="loadedCategories[category.id]">
            <div class="name">{{category.name}}</div>
            <horizontal-timeline
              :items="category.values"
              :scale="0.4"
            ></horizontal-timeline>
          </template>
        </div>
      </div>
    </div>
    <!--collapsed view-->
    <div class="horizontal-timeline-container--right" v-if="categories && categories.length && collapseHorizontalTimelines">
      <div
        @mouseover="getFocus()"
        ref="timelineContainer"
        class="scrolling-timelines-container"
      >
        <div v-for="category in categories" class="categories-with-summary-timeline-compacted" :key="category.id">
          <template v-if="loadedCategories[category.id]">
            <div class="name-compacted">{{category.name}}</div>
            <horizontal-timeline
              :items="category.values"
              :scale="0.4"
            ></horizontal-timeline>
          </template>
        </div>

        <!--summary timeline-->
        <div class="categories-with-summary-timeline-compacted summary">
          <horizontal-timeline
            :summary="true"
            :is-summary="true"
            :items="summary.values"
            :scale="0.4"
          ></horizontal-timeline>
        </div>

      </div>
    </div>

  </div>
</template>

<script>
import _ from 'lodash'
import HorizontalTimeline from './timeline/HorizontalTimeline.vue'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import {mapGetters} from 'vuex'
import {ITEM_ID} from 'src/store/modules/item/getterTypes'
import {ITEM} from 'src/store/storeModules'
import VuexItemUIStateMixin from '../../mixins/VuexItemUIStateMixin'

export default {
  name: 'categories-with-summary',

  mixins: [
    VuexItemMixin,
    VuexItemUIStateMixin
  ],

  components: {
    HorizontalTimeline
  },

  props: {
    title: {
      type: String,
      default: ''
    },
    categoriesVuexPrefix: {
      type: String,
      default: ''
    },
    showSummary: {
      type: Boolean,
      default: true
    }
  },

  data: function () {
    return {
      loadedCategories: {},
      summary: {
        values: []
      }
    }
  },

  computed: {
    ...mapGetters(ITEM, {
      itemId: ITEM_ID
    }),

    //  can't bind directly to the timeline, because map getters expects a string literal, and will not work with a prop

    categories () {
      let timelines = this.$store.getters[`${this.categoriesVuexPrefix}/GET_${this.categoriesVuexPrefix}_TIMELINES`]
      return timelines || []
    },

    loading () {
      return this.$store.getters[`${this.categoriesVuexPrefix}/GET_${this.categoriesVuexPrefix}_BUSY`]
    }
  },

  watch: {
    'itemId': function () {
      this.loadData()
    }
  },

  beforeMount: function () {
    this.$watch('loadedCategories', (newVal, oldVal) => {
      this.summary.values = []
      _.forEach(this.categories, cat => {
        if (newVal[cat.id]) {
          this.summary.values = _.unionWith(this.summary.values, cat.values, _.isEqual)
        }
      })
    }, {immediate: true, deep: true})
  },

  mounted: function () {
    this.loadData()
  },

  methods: {
    async loadData () {
      try {
        await this.$store.dispatch(`${this.categoriesVuexPrefix}/LOAD_${this.categoriesVuexPrefix}_TIMELINES`)
        const result = this.$store.getters[`${this.categoriesVuexPrefix}/GET_${this.categoriesVuexPrefix}_TIMELINES`]

        if (result) {
          this.loadedCategories = result.reduce((loadedCategories, cat) => {
            return {
              ...loadedCategories,
              [cat.id]: false
            }
          }, {})
        }
      } catch (err) {
        console.error(err)
      }
    },
    getFocus () {
      this.$refs['timelineContainer'].focus()
    },
    toggleCategory: function (category) {
      this.loadedCategories[category.id] = !this.loadedCategories[category.id]
    }
  }
}
</script>

<style lang="less" scoped>
  @import (reference) '../../styles/main';

  .overview {
    .horizontal-timeline-name-base();
  }

  .name {
    .horizontal-timeline-name-subtitle-base();
  }

  .name-compacted {
    .horizontal-timeline-name-compacted();
    position: absolute;
    margin-left: 3px;
    z-index: 1;
    margin-top: 6px;
  }

  .horizontal-timeline-container--right {
    position: relative;

    .scrolling-timelines-container {
      padding: 10px;
    }

    .categories-with-summary-timeline {
      &.summary {
        border-bottom: solid 1px @line-grey;
        padding-bottom: 10px;
      }

      .horizontal-timeline {
        margin-bottom: 13px;
      }
    }

    .categories-with-summary-timeline-compacted {
      .horizontal-timeline {
        padding-bottom: 0;
      }
    }
  }
</style>
