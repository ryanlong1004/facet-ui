import _ from 'lodash'
import moment from 'moment'
import {tween} from 'shifty'
import {ITEM} from 'src/store/storeModules'
import {IS_DOCUMENT} from 'src/store/modules/item/getterTypes'
import {mapGetters} from 'vuex'

export default {
  props: {
    items: Array,
    currentVideoTime: Number,
    setCurrentVideoTime: Function,
    enterEditMode: Function,
    currentTab: String,
    highlightQuery: String,

    lineBreaks: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      activeItemQuerySelector: 'ol.timeline-items.hidden > li.timeline-item.active',
      filteredItems: [],
      displayItems: [],
      scrollItems: [],
      ignoreTimeChanges: false,
      offsetTop: -10,
      activeItem: null,
      activeItemIndex: -1,
      tabActive: false,
      bigDataScroll: {
        initialized: false,
        numToRender: 30,
        fixedHeight: null,
        tops: [],
        heights: [],
        listenersAdded: false,
        resizeCallback: null,
        scrollCallback: null,
        displayListQuerySelector: '',
        displayItemsQuerySelector: '',
        allListQuerySelector: '',
        allItemsQuerySelector: '',

        bufferTopRefName: 'bigdata-buffer-top',
        bufferBottomRefName: 'bigdata-buffer-bottom'
      },
      paging: {
        pagesLoaded: {},
        stopPaging: false,
        lastPageRequested: -1,
        maxPage: 0,
        pageSize: 0
      },

      timelineType: null
    }
  },
  beforeMount () {
    this.$watch('activeItem', (newVal, oldVal) => {
      if (newVal) {
        this.activeItemIndex = _.indexOf(this.scrollItems, newVal)
      }
    }, {immediate: true})
  },
  mounted: function () {
    this.bigDataScroll.resizeCallback = _.throttle(this.handleBigDataResize, 100)
    this.bigDataScroll.scrollCallback = _.throttle(this.handleBigDataScroll, 100)
  },
  beforeDestroy: function () {
    this.removeBigDataEventListeners()
  },
  watch: {
    currentVideoTime: function (newVal, oldVal) {
      if (newVal !== undefined && newVal >= 0) {
        this.currentTimeUpdated()
      }
    },
    currentTab: function (newVal, oldVal) {
      this.tabActive = this.$options._componentTag === newVal
      this.$nextTick(() => {
        if (this.tabActive && this.bigDataScroll.initialized) {
          this.addBigDataEventListeners()
        } else {
          this.removeBigDataEventListeners()
        }
      })
    }
  },
  computed: {
    ...mapGetters(ITEM, {
      isDocument: IS_DOCUMENT
    })
  },
  methods: {
    onMouseDown: function (event) {
      this.paging.stopPaging = true
    },
    onMouseUp: function (event) {
      this.paging.stopPaging = false
      // this._loadPageRange(this.paging.lastPageRequested)
    },
    // _loadPageRange: function (page) {
    //   this.paging.lastPageRequested = page
    //   if (typeof this.getPage === 'function' && !this.isDocument) {
    //     this._loadPage(page - 1, page, page + 1)
    //   }
    // },
    // _loadPage: function (...pages) {
    //   if (typeof this.getPage === 'function' && !this.isDocument) {
    //     let pageSize = this.paging.pageSize
    //     _.each(pages, page => {
    //       if (page >= 0 && page <= this.paging.maxPage && !this.paging.pagesLoaded[page]) {

    //         if (!this.paging.stopPaging) {
    //           this.paging.pagesLoaded[page] = true
    //           // load the new page, and then overlay the new data on top of the existing structure (to get a nice render)
    //           this.getPage(page, pageSize)
    //           .then(response => {
    //             const pageStart = page * pageSize

    //             for (let i = 0; i < pageSize; i++) {
    //               const filteredItemsNdx = i + pageStart

    //               _.assign(this.filteredItems[filteredItemsNdx],
    //                 response[i],
    //                 {active: false, startAtPretty: this.getDisplayTime(response[i].key), status: 'LOADED'})
    //             }
    //           })
    //         }
    //       }
    //     }

    //   )
    //   }
    // },
    itemClicked: function (item) {
      this.$nextTick(() => {
        this.activeItem = item
        this.ignoreTimeChanges = true
        this.setCurrentVideoTime(item.key)
      })
    },
    currentTimeUpdated: function () {
      if (this.ignoreTimeChanges) {
        this.ignoreTimeChanges = false
        return null
      }

      this.scrollItems = this.filteredItems
      // always using displayItems for documents... no big data scroll
      if (this.isDocument) {
        this.scrollItems = this.displayItems
      }

      _.each(this.scrollItems, (item, i) => {
        let nextStartTime = 60 * 60 * 60 // 60 hours - some totally unreasonable video length
        if (i < this.scrollItems.length - 1) {
          nextStartTime = this.scrollItems[i + 1].start_at || this.scrollItems[i + 1].key
        }

        if ((!this.isDocument && ((item.start_at || item.key) <= this.currentVideoTime && nextStartTime > this.currentVideoTime) ||
            this.isDocument && (item.key === this.currentVideoTime))) {
          if (this.activeItem !== item) {
            this.$nextTick(() => {
              this.scrollToActiveElement()
            })
          }
          this.activeItem = item
        }
      })
    },
    scrollToActiveElement: function () {
      this.$nextTick(() => {
        const scrollFrom = this.$el.scrollTop + this.offsetTop
        const scrollTo = this.bigDataScroll.tops[this.activeItemIndex]
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
          // this._loadPageRange(this.paging.lastPageRequested)
        })
      })
    },
    initBigDataScrolling: function (displayListQuerySelector, displayItemsQuerySelector, allListQuerySelector, allItemsQuerySelector,
      timelineType, maxPage, pagingSize) {
      this.timelineType = timelineType
      this.paging.maxPage = maxPage
      this.paging.pageSize = pagingSize

      if (this.bigDataScroll.initialized) {
        this.removeBigDataEventListeners()
      }
      this.bigDataScroll.displayListQuerySelector = displayListQuerySelector
      this.bigDataScroll.displayItemsQuerySelector = displayItemsQuerySelector
      this.bigDataScroll.allListQuerySelector = allListQuerySelector
      this.bigDataScroll.allItemsQuerySelector = allItemsQuerySelector
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
            if (!this.bigDataScroll.fixedHeight) {
              window.addEventListener('resize', this.bigDataScroll.resizeCallback)
            }
            this.$el.addEventListener('scroll', this.bigDataScroll.scrollCallback)
            this.$el.addEventListener('mouseup', this.onMouseUp)
            this.$el.addEventListener('mousedown', this.onMouseDown)
            this.bigDataScroll.listenersAdded = true
          }
          this.handleBigDataResize()
          this.currentTimeUpdated()
        })
      }
    },
    removeBigDataEventListeners: function () {
      if (this.bigDataScroll.listenersAdded) {
        if (!this.bigDataScroll.fixedHeight) {
          window.removeEventListener('resize', this.bigDataScroll.resizeCallback)
        }
        this.$el.removeEventListener('scroll', this.bigDataScroll.scrollCallback)
        this.$el.removeEventListener('mouseup', this.onMouseUp)
        this.$el.removeEventListener('mousedown', this.onMouseDown)
        this.bigDataScroll.listenersAdded = false
      }
    },
    handleBigDataResize: function () {
      let tops = []
      let heights = []

      if (!this.bigDataScroll.fixedHeight) {
        const allList = this.$el.querySelector(this.bigDataScroll.allListQuerySelector)
        const displayList = this.$el.querySelector(this.bigDataScroll.displayListQuerySelector)
        if (allList) {
          allList.style.display = 'block'
          if (this.lineBreaks) {
            allList.style['white-space'] = 'pre-wrap'
          }
          if (displayList) {
            allList.style.width = displayList.offsetWidth + 'px'
          }
        }
        const allItemsEl = this.$el.querySelectorAll(this.bigDataScroll.allItemsQuerySelector)
        for (let i = 0, len = allItemsEl.length; i < len; i++) {
          tops[i] = allItemsEl[i].offsetTop
          heights[i] = allItemsEl[i].offsetHeight
        }
        this.$nextTick(() => {
          if (allList) {
            allList.style.display = 'none'
          }
        })
      } else {
        for (let i = 0, len = this.filteredItems.length; i < len; i++) {
          tops[i] = this.bigDataScroll.fixedHeight * i
          heights[i] = this.bigDataScroll.fixedHeight
        }
      }
      this.bigDataScroll.tops = tops
      this.bigDataScroll.heights = heights
      const reducer = (accumulator, currentValue) => accumulator + currentValue
      let totHeight = heights.reduce(reducer, 0)
      if (this.$refs['scrollBody']) {
        this.$refs['scrollBody'].style.height = totHeight + 'px'
      }

      this.handleBigDataScroll()
    },
    handleBigDataScroll: function (e) {
      if (this.isDocument) {
        this.displayItems = this.filteredItems
        return
      }
      const scrollStart = this.$el.scrollTop
      const container = this.$el
      const scrollTop = container.scrollTop
      let topBuff = 0
      let btmBuff = 0
      let numAbove = 0
      let y = this.bigDataScroll.heights[0]
      let i = 0
      while (y < scrollTop) {
        i++
        numAbove++
        y = this.bigDataScroll.tops[i] + this.bigDataScroll.heights[i]
      }

      topBuff = this.bigDataScroll.tops[Math.max(0, i - 1)]
      if (numAbove > 0) {
        topBuff += this.bigDataScroll.heights[Math.max(0, i - 1)]
      }
      i += this.bigDataScroll.numToRender
      while (i < this.filteredItems.length) {
        btmBuff += this.bigDataScroll.heights[i]
        i++
      }

      if (this.$refs['displaced']) {
        this.$refs['displaced'].style.top = topBuff + 'px'
      }

      if (this.$refs[this.bigDataScroll.bufferBottomRefName]) {
        this.$refs[this.bigDataScroll.bufferBottomRefName].style.height = btmBuff + 'px'
      }

      if (this.$refs[this.bigDataScroll.bufferTopRefName]) {
        this.$refs[this.bigDataScroll.bufferTopRefName].style.height = topBuff + 'px'
      }

      this.displayItems = this.filteredItems.slice(numAbove, numAbove + this.bigDataScroll.numToRender)

      // if we're in tags and descriptions, grab the next 2 and previous pages
      // if (typeof this.getPage === 'function' && !this.isDocument) {
      //   const indexNextItem = numAbove + this.bigDataScroll.numToRender + 1
      //   const pageSize = this.paging.pageSize
      //   const page = Math.floor(indexNextItem / pageSize)
      //   this._loadPageRange(page)
      // }
    }
  }
}
