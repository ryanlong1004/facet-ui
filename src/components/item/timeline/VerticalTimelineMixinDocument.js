import _ from 'lodash'
import moment from 'moment'
import {tween} from 'shifty'

export default {
  mounted: function () {
    // keep this in beause if overwrites VerticalTimelineMixin
    // this.bigDataScroll.resizeCallback = _.throttle(this.handleBigDataResize, 100)
    // this.bigDataScroll.scrollCallback = _.throttle(this.handleBigDataScroll, 100)
  },
  methods: {
    onMouseDown: function (event) {
    },
    onMouseUp: function (event) {
    },
    _loadPageRange: function (page) {
    },
    _loadPage: function (...pages) {
    },

    scrollToActiveElement: function () {
      this.$nextTick(() => {
        const scrollFrom = this.$el.scrollTop + this.offsetTop

        let tops = []
        let heights = []
        const displayItems = this.$refs['displayItem']
        for (let i = 0, len = displayItems.length; i < len; i++) {
          tops[i] = displayItems[i].offsetTop
          heights[i] = displayItems[i].offsetHeight
        }

        const scrollTo = tops[this.activeItemIndex]
        this.paging.stopPaging = true
        tween({
          from: { offsetTop: scrollFrom },
          to: { offsetTop: scrollTo },
          easing: 'easeInOutQuad',
          step: function (e) {
            this.$el.scrollTop = e.offsetTop
          }.bind(this)
        }).then(() => {
          this.paging.stopPaging = false

          // difference between this and VerticaltmelineMixin
          // this._loadPageRange(this.paging.lastPageRequested)
        })
      })
    },
    initBigDataScrolling: function (timelineType) {
      this.timelineType = timelineType
      this.displayItems = this.filteredItems

      if (this.bigDataScroll.initialized) {
        this.removeBigDataEventListeners()
      }

      this.bigDataScroll.initialized = true
      if (this.tabActive || this.$options._componentTag === this.currentTab) {
        this.addBigDataEventListeners()
        this.$nextTick(() => {
          this.currentTimeUpdated()
        })
      }
    },
    addBigDataEventListeners: function () {
      if (!this.bigDataScroll.listenersAdded) {
        this.$nextTick(() => {
          if (!this.bigDataScroll.listenersAdded) {

            this.bigDataScroll.listenersAdded = true
          }
          this.currentTimeUpdated()
        })
      }
    },
    removeBigDataEventListeners: function () {
      if (this.bigDataScroll.listenersAdded) {
        this.bigDataScroll.listenersAdded = false
      }
    },
    handleBigDataResize: function () {
      // empty to override
    },
    handleBigDataScroll: function () {
      // empty to override
    }
  }
}
