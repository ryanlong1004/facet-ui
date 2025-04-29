<template>
  <div ref="big-data-scroller" class="big-data-scroller" :style="{ maxHeight: `calc(100% - ${offsetTop}px`, minHeight: `calc(100% - ${offsetTop}px` }">
    <div ref="pages-wrapper" class="pages-wrapper">
      <div v-for="page in pages" :key="page.pageIndex" :data-page-num="page.pageIndex" class="page" ref="page" :style="{ height: page.height === 'auto' ? 'auto' : `${page.height}px` }">
        <ul class="list timeline-items" v-if="page.visible">
          <li
            v-for="segment in page.segments"
            :key="segment.index"
            :class="{ 'timeline-item': true, active: activeSegKey === segment.key }"
            @click="timelineClick(segment)">
            <slot :segment="segment" :active="activeSegKey === segment.key" :clickFn="timelineClick"></slot>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'
  import moment from 'moment'
  import { tween } from 'shifty'

  import PlayheadMixin from 'src/mixins/PlayheadMixin'

  const DEFAULT_PAGE_SIZE = 100

  export default {
    name: 'big-data-scroller',
    mixins: [PlayheadMixin],
    props: {
      segments: {
        type: Array,
        default: () => []
      },
      pageSize: {
        type: Number,
        default: DEFAULT_PAGE_SIZE
      },
      offsetTop: {
        type: Number,
        default: 0
      },
      enabled: {
        type: Boolean,
        default: true
      }
    },
    data () {
      return {
        pages: [],
        eventsEnabled: false,
        intersectionObserver: null,
        firstIntersection: true,
        initializing: true,
        resizeHandler: _.noop,
        playheadWatcher: _.noop,
        activeSegKey: -1
      }
    },
    beforeMount () {
      this.resizeHandler = _.debounce(this.handleResize, 150)
    },
    mounted () {
      this.$watch('segments', async (newVal, oldVal) => {
        if (newVal && (newVal !== oldVal)) {
          setTimeout(() => {
            this.chunkData(newVal)
          }, 100)
        }
      }, { immediate: true })
      this.$watch('enabled', newVal => {
        if (newVal) {
          this.enableEvents()
        } else {
          this.disableEvents()
        }
      })
    },
    beforeUnmount () {
      this.disableEvents()
    },
    methods: {
      async chunkData (segments) {
        if (!this.segments.length) {
          return
        }
        let p = 0
        const pages = _.chunk(segments, this.pageSize).map(segments => {
          return {
            activeTimeRange: false,
            activeItemIndex: 0,
            visible: p === 0,
            height: p === 0 ? 'auto' : 0,
            offsetTop: 0,
            pageIndex: p++,
            start_at: segments[0].start_at,
            end_at: segments[segments.length - 1].end_at,
            segments
          }
        })
        this.pages = pages
        await this.$nextTick()
        const avgHeight = await this.getAverageSegmentHeight(0)
        this.avgSegmentHeight = avgHeight
        this.mockPageHeights(avgHeight, [0])
        this.enableEvents()
      },

      async enableEvents () {
        if (!this.segments.length || this.eventsEnabled) {
          await this.$nextTick()
          this.monitorPlayhead(this.currentPlayheadTime)
          return
        }
        this.playheadWatcher = this.$watch('currentPlayheadTime', this.monitorPlayhead)
        window.addEventListener('resize', this.resizeHandler)
        await this.$nextTick()
        const pageWrappers = this.$el.querySelectorAll('.page')
        let threshold = []
        for (let i=0; i<=1.0; i+= 0.01) {
          threshold.push(i);
        }
        const intersectOptions = {
          root: this.$el.querySelector('.big-data-scroller'),
          rootMargin: '0px',
          threshold
        }
        this.intersectionObserver = new IntersectionObserver(this.handleIntersection, intersectOptions)
        pageWrappers.forEach(page => {
          this.intersectionObserver.observe(page)
        })
        this.eventsEnabled = true
        await this.$nextTick()
        this.monitorPlayhead(this.currentPlayheadTime)
      },
      disableEvents () {
        window.removeEventListener('resize', this.resizeHandler)
        if (this.playheadWatcher) {
          this.playheadWatcher()
          this.playheadWatcher = null
        }
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect()
        }
        this.eventsEnabled = false
      },

      handleIntersection (entries, observer) {
        entries.forEach(entry => {
          const tgtPage = entry.target
          const tgtPageIndex = parseInt(tgtPage.getAttribute('data-page-num'))
          if (entry.isIntersecting && this.pages[tgtPageIndex].visible === false) {
            this.displayPage(tgtPageIndex)
          } else if (entry.isIntersecting === false && this.pages[tgtPageIndex].visible === true) {
            this.hidePage(tgtPageIndex)
          }
        })
      },

      displayPage (page = 0) {
        this.pages[page].visible = true
        this.pages[page].height = 'auto'
      },

      hidePage (page = 0) {
        let totalHeight = 0
        const pageWrapper = this.$el.querySelectorAll('.page')[page]
        const listItems = pageWrapper.querySelectorAll('.list > li')
        if (listItems.length) {
          for (let i = 0; i < listItems.length; i++) {
            totalHeight += listItems[i].offsetHeight
          }
          this.pages[page].height = totalHeight
        }
        this.pages[page].visible = false
      },

      async getAverageSegmentHeight (page = 0) {
        let pageHeight = 0
        const pageWrapper = this.$el.querySelectorAll('.page')[page]
        const listItems = pageWrapper.querySelectorAll('.list > li')
        return new Promise(resolve => {
          listItems.forEach(li => {
            const h = li.offsetHeight
            pageHeight += h
          })
          const avgHeight = pageHeight / listItems.length
          resolve(avgHeight)
        })
      },

      mockPageHeights (height = 0, excludedPages = []) {
        this.pages.forEach((page, i) => {
          if (excludedPages.indexOf(i) < 0) {
            const numSegments = this.pages[i].segments.length
            page.height = numSegments * height
          }
        })
      },

      async handleResize (e) {
        const activePageIndices = this.pages.filter(p => p.visible).map(p => p.pageIndex)
        const avgHeight = await this.getAverageSegmentHeight(activePageIndices[0])
        this.avgSegmentHeight = avgHeight
        this.mockPageHeights(avgHeight, activePageIndices)
      },

      async monitorPlayhead (time) {
        const cpageIndex = this.pages.findIndex(p => {
          return p.end_at >= time
        })
        if (cpageIndex >= 0) {
          const cpage = this.pages[cpageIndex]
          if (!cpage.activeTimerange) {
            this.pages.forEach(p => {
              p.activeTimerange = false
            })
            cpage.activeTimerange = true
          }
          if (!cpage.visible) {
            this.displayPage(cpage.pageIndex)
            await this.$nextTick()
          }
          let activeSegmentIndex = cpageIndex * this.pageSize
          const citemIndex = cpage.segments.findIndex(s => {
            return s.end_at >= time
          })
          if (citemIndex >= 0 && cpage.activeItemIndex !== citemIndex) {
            activeSegmentIndex += citemIndex
            this.activeSegKey = this.segments[activeSegmentIndex].key
            cpage.activeItemIndex = citemIndex
            // get offset to scroll
            const pageEl = this.$refs[`page`][cpage.pageIndex]
            if (!pageEl) {
              return
            }
            let tgt = pageEl.offsetTop
            const listItems = pageEl.querySelectorAll('ul > li')
            for (let i = 0; i < citemIndex; i++) {
              tgt += listItems[i].offsetHeight
            }
            this.scrollToPosition(tgt)
          }
        }
      },
      scrollToPosition (tgt) {
        const componentEl = this.$refs['big-data-scroller']
        if (!componentEl) {
          return
        }
        const scrollFrom = componentEl.scrollTop
        tween({
          from: { scrollTop: scrollFrom },
          to: { scrollTop: tgt },
          easing: 'easeInOutQuad',
          step: function (e) {
            componentEl.scrollTop = e.scrollTop
          }.bind(this)
        })
      },

      timelineClick (segment) {
        this.setSeekTo(segment.start_at)
        this.activeSegKey = segment.key
      }
    }
  }
</script>

<style lang="less">
  @import (reference) '../../../styles/_variables.less';

  .big-data-scroller {
    max-width: 100%;
    overflow: auto;
    position: relative;
    .fake-scroller {
      width: 100%;
    }
    .pages-wrapper {
      left: 0;
      top: 0;
      position: absolute;
      width: 100%;
    }
    .rendering-remaining {
      color: @color-primary;
      font-size: 12px;
      > i.fa-spin {
        color: @color-accent;
      }
    }
    .page {
      position: relative;
      &:last-child {
        ul.list {
          > li:last-child {
            border-bottom: 0 none;
          }
        }
      }
    }
  }
</style>
