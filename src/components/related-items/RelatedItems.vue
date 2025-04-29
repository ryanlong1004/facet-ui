<template>
  <div class="related-items" ref="scrollArea">
    <div class="buffer" ref="buffer"></div>
    <draggable :list="items" :options="{group:{name: 'collections', pull: 'clone', put: 'false'}, sort: false, disabled: !collectionsOpen}" :clone="onDragClone" :move="onMove" class="results-draggable">
      <div v-for="(item, $index) in items" :data-id="item._id" ref="item" class="item" :class="getClass($index)" :key="item._id">
        <div class="thumbnail" @click.prevent.stop="goToItem(item)">
          <thumbnail-image :id="item._id" :thumb="item.thumbnail" :live="false"></thumbnail-image>
          <div class="overlay"></div>
        </div>
        <div class="info">
          <div class="subtitle">
            {{getName(item.name) || getName(item.filename) || getName(item.stow_url)}}
          </div>
        </div>
      </div>
    </draggable>
    <div class="buffer"></div>

    <span v-show="showPreviousArrow" class="nav previous" @click.prevent.stop="backward()">
      <i class="far fa-chevron-left fa-2x" aria-hidden="true"></i>
    </span>
    <span v-show="showNextArrow" class="nav next" @click.prevent.stop="forward()">
      <i class="far fa-chevron-right fa-2x" aria-hidden="true"></i>
    </span>

  </div>
</template>

<script>
  import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage'
  import draggable from 'vuedraggable'
  import _ from 'lodash'
  import Session from 'src/session.js'
  import { Tweenable } from 'shifty'

  import * as storeModules from 'src/store/storeModules'
  import {mapActions, mapGetters, mapMutations} from 'vuex'
  import {COLLECTIONS_OPEN} from 'src/store/modules/rightPanel/getterTypes'
  import {
  GET_CURRENT_ITEM_NDX,
  GET_HITS_PER_PAGE,
  GET_RELATED_ITEMS,
  GET_SCROLL_DIRECTION, GET_SHOW_NEXT_ARROW, GET_SHOW_PREVIOUS_ARROW,
  GET_TOTAL_HITS
  } from 'src/store/modules/item/related-items/getters'
  import {FETCH_RELATED_ITEMS} from 'src/store/modules/item/related-items/actions'
  import {
  SCROLL_TO_END,
  SCROLL_TO_ROUTE,
  SCROLL_TO_START,
  SET_CURRENT_ITEM_NDX
  } from 'src/store/modules/item/related-items/mutations'

  export default {
    name: 'related-items',

    components: {
      ThumbnailImage,
      draggable
    },

    data () {
      return {
        session: Session,
        movement: new Tweenable(),
        scrolling: false
      }
    },

    computed: {
      ...mapGetters(storeModules.RIGHT_PANEL, {
        collectionsOpen: COLLECTIONS_OPEN
      }),
      ...mapGetters(storeModules.RELATED_ITEMS, {
        items: GET_RELATED_ITEMS,
        hitsPerPage: GET_HITS_PER_PAGE,
        totalHits: GET_TOTAL_HITS,
        scrollDirection: GET_SCROLL_DIRECTION,
        currentItemNdx: GET_CURRENT_ITEM_NDX,
        showPreviousArrow: GET_SHOW_PREVIOUS_ARROW,
        showNextArrow: GET_SHOW_NEXT_ARROW
      })
    },

    mounted () {
      this.$watch('items', (newVal, oldVal) => {
        if (!this.items.length) {
          return
        }
        if (this.scrollDirection === SCROLL_TO_ROUTE || this.scrollDirection === SCROLL_TO_START) {
          this.setCurrentItemNdx(0)
          this.$nextTick(() => {
            this._scrollToItem(this.items[0]._id)
          })
        } else if (this.scrollDirection === SCROLL_TO_END) {
          this.setCurrentItemNdx(this.items.length - 1)
          this.$nextTick(() => {
            this._scrollToItem(this.items[this.items.length - 1]._id)
          })
        }
      })
      this.$refs['scrollArea'].addEventListener('scroll', this._scrollEvent)
    },

    beforeDestroy () {
      this.movement.dispose()
      this.$refs['scrollArea'].removeEventListener('scroll', this._scrollEvent)
    },

    methods: {
      ...mapActions(storeModules.RELATED_ITEMS, {
        fetchRelatedItems: FETCH_RELATED_ITEMS
      }),
      ...mapMutations(storeModules.RELATED_ITEMS, {
        setCurrentItemNdx: SET_CURRENT_ITEM_NDX
      }),
      _scrollEvent (event) {
        if (this.scrolling || !this.items.length) {
          return
        }
        let bufferWidth = this.$refs['buffer'].offsetWidth

        let firstEl = this.$refs['item'][0]

        let scrollAreaLeft = this.$refs['scrollArea'].scrollLeft
        let scrollAreaWidth = this.$refs['scrollArea'].offsetWidth
        let currentCenter = scrollAreaLeft + (scrollAreaWidth / 2)
        let elTotalWidth = firstEl.offsetWidth + parseInt(window.getComputedStyle(firstEl).marginLeft) + parseInt(window.getComputedStyle(firstEl).marginRight)

        let ndx = (currentCenter - bufferWidth) / elTotalWidth
        ndx = Math.floor(ndx)
        this.setCurrentItemNdx(ndx)
      },

      _scrollToItem (itemId) {
        let itemEl = _.find(this.$refs['item'], el => {
          return el.dataset.id === itemId
        })

        if (itemEl && this.$refs['scrollArea'] && this.$refs['buffer']) {
          let scrollFrom = this.$refs['scrollArea'].scrollLeft
          // scroll to left minus halfway across the screen
          let scrollTo = itemEl.offsetLeft - (this.$refs['scrollArea'].offsetWidth / 2 - itemEl.offsetWidth / 2) + this.$refs['buffer'].offsetWidth
          this._scroll(scrollFrom, scrollTo)
        } else {
        }
      },

      _scroll (from, to) {
        this.scrolling = true
        if (this.movement) {
          try {
            this.movement.stop()
          } catch (err) {
          }
        }

        this.movement.tween({
          from: { left: from },
          to: { left: to },
          easing: 'easeInOutQuad',
          step: function (state) {
            this.$refs['scrollArea'].scrollLeft = state.left
          }.bind(this)
        })
          .then(response => {
            this.scrolling = false
          })
          .catch(err => {
          })
      },

      getName (path = '') {
        return path.split('/')[path.split('/').length - 1].split(':')[path.split(':').length - 1]
      },

      getClass (index) {
        let className = ''

        // active item
        if (index === this.currentItemNdx) {
          className = 'selected'

        }
        return className
      },

      onMove (evt, originalEvent) {
        // https://github.com/SortableJS/Vue.Draggable/issues/45
        let draggedId = evt.draggedContext.element._id
        let targetList = evt.relatedContext.list
        let inList = _.find(targetList, {_id: draggedId})
        if (inList) {
          return false
        }
      },

      onDragClone (object) {
        return {
          _id: object._id,
          filename: object.name,
          thumbnail: object.thumbnail,
          toDelete: false,
          fake: false
        }
      },

      goToItem (item) {
        let to = {
          name: 'itemDetails',
          params: {
            id: item._id
          },
          query: {
            highlight: this.$route.query.highlight,
            itemPage: item.page,
            key: this.$route.query.key
          }
        }

        this.$router.push(to)
      },

      backward () {
        this.setCurrentItemNdx(this.currentItemNdx - 1)

        if (this.currentItemNdx > -1) {
          this._scrollToItem(this.items[this.currentItemNdx]._id)

        } else {
          // search based on the first item
          let lastItem = this.items[0]

          this.fetchRelatedItems({
            searchKey: this.$route.query.key,
            itemPage: lastItem.page,
            currentItemId: this.$route.params.id,
            loadOptions: {isBackNav: true},
            scrollDirection: SCROLL_TO_END})
        }
      },

      forward () {
        this.setCurrentItemNdx(this.currentItemNdx + 1)

        if (this.items.length > this.currentItemNdx) {
          this._scrollToItem(this.items[this.currentItemNdx]._id)

        } else {
          // search based on the last item
          let lastItem = this.items[this.items.length - 1]

          this.fetchRelatedItems({
              searchKey: this.$route.query.key,
              itemPage: lastItem.page,
              currentItemId: this.$route.params.id,
              loadOptions: {isForwardNav: true},
              scrollDirection: SCROLL_TO_START})
        }
      },

      stop () {
        if (this.movement) {
          this.movement.stop()
        }
      }
    }
  }
</script>

<style lang="less">
  @import (reference) '../../styles/_variables';
  @import (reference) '../../styles/_mixins';

  .translateY (@y) {
    -webkit-transform: translateY(@y);
    -moz-transform: translateY(@y);
    -ms-transform: translateY(@y);
    -o-transform: translateY(@y);
    transform: translateY(@y);
  }

  .translateX (@x) {
    -webkit-transform: translateX(@x);
    -moz-transform: translateX(@x);
    -ms-transform: translateX(@x);
    -o-transform: translateX(@x);
    transform: translateX(@x);
  }

  .scale (@num) {
    -webkit-transform: scale(@num);
    -moz-transform: scale(@num);
    -ms-transform: scale(@num);
    -o-transform: scale(@num);
    transform: scale(@num);
  }

  .translate (@x, @y) {
    -webkit-transform: translate(@x, @y);
    -moz-transform: translate(@x, @y);
    -ms-transform: translate(@x, @y);
    -o-transform: translate(@x, @y);
    transform: translate(@x, @y);
  }

  .scaleTranslateX (@scale, @x) {
    -webkit-transform: scale(@scale) translateX(@x);
    -moz-transform: scale(@scale) translateX(@x);
    -ms-transform: scale(@scale) translateX(@x);
    -o-transform: scale(@scale) translateX(@x);
    transform: scale(@scale) translateX(@x);
  }

  .related-items {
    .flex-box();
    overflow-y: hidden;
    overflow-x: scroll;
    height: 210px;

    .buffer {
      min-height: 100%;
      min-width: 20px;
      width: 20px;
    }

    .results-draggable {
      .flex-container();
      position: relative;

      .item {
        margin: 0 10px;
        transition: all 0.25s ease-in-out;

        .thumbnail {
          background-color: @color-dark-shadow;
          border: solid 2px @color-dark;
          cursor: pointer;
          position: relative;
          transition: all 0.25s ease-in-out;

          .overlay {
            .abs-pos(0, auto, auto, auto);
            background-color: @color-dark-shadow-medium;
            height: 100%;
            transition: all 0.25s ease-in-out;
            width: 100%;
          }

          .thumbnail-container {
            height: 136px;
            min-height: 136px;
            top: 0;
            width: 242px;
          }
        }

        .info {
          color: transparent;
          text-align: center;
          transition: all 0.25s ease-in-out;

          .subtitle {
            font-size: 13px;
            line-height: 1.2;
            max-height: 18px;
            max-width: 242px;
            overflow: hidden;
            text-align: center;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        &:hover,
        &.selected {
          .thumbnail {
            border: solid 2px @color-tone-dark;

            .overlay {
              background-color: transparent;
            }
          }

          .info {
            color: @color-base;
          }
        }
      }
    }

    .nav {
      .flex-container-center();
      background-color: @color-light-shadow;
      border-radius: 50%;
      box-shadow: 2px 2px 5px @color-dark-shadow;
      color: @color-dark-shadow;
      cursor: pointer;
      height: 50px;
      top: 110px;
      transition: all 0.25s ease-in-out;
      width: 50px;

      &.previous {
        position: absolute;
        left: 15px;
      }

      &.next {
        position: absolute;
        right: 15px;
      }

      &:hover {
        color: @color-gray-shadow;
        cursor: pointer;
      }
    }
  }
</style>
