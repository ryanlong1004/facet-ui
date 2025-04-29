<template>
  <div class="horizontal-timeline square">
    <div v-if="!isSummary || isInsights">
      <div class="timeline-loading" v-if="!duration" v-loading="!duration"></div>
      <div class="timeline"></div>
      <ol v-show="duration">
        <li
          v-for="item in itemsData"
          :class="{ 'timeline-segment': true, 'summary': summary }"
          :key="item.timelineId"
          :style="{
            left: item.startPercent + '%',
            width: item.percentage + '%',
            'background-color': color ? color : null
          }">
        </li>
        <li v-for="item in highlightsData"
            class="timeline-highlight"
            :class="{ 'timeline-segment': true, 'summary': summary }"
            :key="item.timelineId"
            :style="{ left: item.startPercent + '%' }"
        >
        </li>
      </ol>
      <div :class="!collapseHorizontalTimelines ? 'playhead' : 'playhead-compacted'" :style="{ left: currentPlaybackPercent + '%' }"></div>
      <div class="timeline-overlay" v-on:click="timelineClicked($event)"></div>
    </div>
    <div v-if="!collapseHorizontalTimelines || isSummary || isInsights">
      <ul class="paginator">
        <li><i class="fas fa-chevron-circle-left" @click.stop="goPreviousTick()"></i></li>
        <li><i class="fas fa-chevron-circle-right" @click.stop="goNextTick()"></i></li>
      </ul>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import shortid from 'shortid'
import PlayheadMixin from 'src/mixins/PlayheadMixin'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import VuexItemUIStateMixin from '../../../mixins/VuexItemUIStateMixin'

export default {
  name: 'horizontal-timeline',

  mixins: [
    PlayheadMixin,
    VuexItemMixin,
    VuexItemUIStateMixin
  ],

  props: {
    items: {
      type: Array,
      required: true
    },
    highlights: {
      type: Array,
      default: () => []
    },
    summary: {
      type: Boolean,
      default: false
    },
    scale: {
      type: Number,
      default: 1
    },
    color: {
      type: String
    },
    hideScrubbers: {
      type: Boolean,
      default: false
    },
    isCollapsedView: {
      type: Boolean,
      default: false
    },
    searchTerm: {
      type: String
    },
    searchTerms: {
      type: Array,
      default: () => []
    },
    isSummary: {
      type: Boolean,
      default: false
    },
    isInsights: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      itemsData: [],
      highlightsData: []
    }
  },

  beforeMount () {
    this.$watch('items', (newVal, oldVal) => {
      if (newVal) {
        this.drawItems()
      }
    })
    this.$watch('highlights', (newVal, oldVal) => {
      if (newVal) {
        this.drawHighlights()
      }
    })
    this.$watch('duration', (newVal, oldVal) => {
      if (newVal) {
        this.drawItems()
        this.drawHighlights()
      }
    })
  },

  mounted: function (e) {
    this.drawItems()
    this.drawHighlights()
  },

  computed: {
    hasData () {
      return _.get(this.items, 'length') || _.get(this.highlights, 'length')
    },
    currentPlaybackPercent () {
      return (this.currentPlayheadTime / this.duration) * 100 + 0.01
    }
    // checkForLast () {
    //   return this.$parent.$children[this.$parent.$children.length - 1] === this
    // }
  },

  methods: {
    drawItems () {
      this.itemsData = this.items.map(entry => {
        return _.assign({}, entry, {
          active: false,
          timelineId: shortid.generate(),
          startPercent: (entry.start_at / this.duration) * 100,
          percentage: Math.max(0.1, ((entry.end_at - entry.start_at) / this.duration) * 100)
        })
      })
      this.itemsData = _.sortBy(this.itemsData, ['start_at']) // this is important for paginating asset overview timelines
    },
    timelineClicked (e) {
      // Firefox has no `srcElement` attribute
      let target = e.srcElement !== undefined ? e.srcElement : e.target
      const x = e.offsetX
      const t = (x / target.offsetWidth) * this.duration
      this.jumpToTime(t)
    },
    drawHighlights () {
      let highlightsData = []
      _.each(this.highlights, function (entry) {
        //entry.active = false
        entry.timelineId = id.generate(),
        entry.startPercent = (entry.start_at / this.duration) * 100
        entry.percentage = Math.max(0.1, (((entry.end_at + 0.01) - entry.start_at) / this.duration) * 100)
        if (entry.startPercent >= 0) {
          highlightsData.push(_.assign({}, entry))
        }
      })
      if (highlightsData.length) {
        this.highlightsData = highlightsData
      }
    },
    goPreviousTick () {
      let previousTime = 0
      for (let i = this.itemsData.length-1; i >= 0; i--) {
        if (this.itemsData[i].start_at < this.currentPlayheadTime) {
          previousTime = this.itemsData[i].start_at
          break
        }
      }
      this.jumpToTime(previousTime)
    },
    goNextTick () {
      for (let i = 0; i < this.itemsData.length; i++) {
        if ((this.itemsData[i].start_at) > this.currentPlayheadTime + 0.1) { // currentPlayheadTime needs a slight buffer to prevent minor seek changes in the player
          this.jumpToTime(this.itemsData[i].start_at)
          break
        }
      }
    },
    jumpToTime (t) {
      this.$emit('timeline-clicked')
      if (this.isDocument) {
        this.setPlayheadTime(t)
      } else {
        this.setSeekTo(t)
      }
    }
  }
}

</script>

<style lang="less" scoped>
  @import (reference) '~src/styles/_variables.less';
  @import (reference) '~src/styles/_mixins.less';

  @border-radius: 8px;
  horizontal-timeline-border {
    padding: 0;
  }

  .horizontal-timeline {
    background-color: @background-grey;
    overflow: hidden;
    position: relative;
    padding: 7px 0;

    .timeline-loading {
      height: 0px;
      min-height: 0px;
    }
    .timeline {
      background-color: @timeline-background;
      border-radius: @border-radius;
      cursor: pointer;
      height: 15px;
      margin: 0;
    }
    .timeline-overlay {
      height: 24px;
      opacity: 0;
      cursor: pointer;
      background-color: transparent;

      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
    }
    ol {
      position: relative;
      top: -14px;
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        height: 14px;
        width: 14px;
        background-color: @timeline-tick;
        &.summary {
          background-color: @color-accent-calm;
        }
        border-radius: @border-radius;
        position: absolute;
        transition: background-color 400ms;
        cursor: pointer;
        opacity: 0.25;
      }
    }
  }

  .square {
    .timeline {
      border-radius: 0;
    }
    ol {
      top: -15px;

      li:not(.circle) {
        width: auto;
        min-width: 4px;
        height: 15px;
        opacity: 0.8;
        border-radius: 0;

        &.timeline-highlight {
          border-radius: 0;
        }
      }
    }
  }

  .playhead {
    width: 4px;
    height: 25px;
    background-color: @playhead;
    border-radius: 1.5px;
    position: absolute;
    top: 2px;
    margin-left: -2px;
    cursor: pointer;
  }

  .playhead-compacted {
    width: 4px;
    height: 25px;
    background-color: @playhead;
    border-radius: 1.5px;
    position: absolute;
    top: -1px;
    margin-left: -2px;
    cursor: pointer;
  }

  .paginator {
    display: flex;
    list-style: none;
    margin: 0 0 0 4px;
    padding: 0;
    > li {
      &:last-child {
        margin-left: 2px;
      }
      > i {
        color: @timeline-background;
        cursor: pointer;
        font-size: 12px;
        &:hover {
          color: @color-accent;
        }
      }
    }
  }

</style>
