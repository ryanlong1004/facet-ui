<template>
  <div class="searched-for-term-audio" :class="{ empty: !terms || !terms.length }">
    <div class="search-within-search">
      <div class="el-input search-within-search__input">
        <i class="el-input__icon el-icon-search is-clickable"></i>
        <input type="text" placeholder="Search within this item..." autocomplete="off" class="el-input__inner" :value="$store.getters['COMPLIANCE/HIGHLIGHT_TEXT']" @keydown.enter="changeSearchTerm">
      </div>
    </div>
    <div class="empty-notification" v-if="terms && !terms.length">
      We didn't find any terms.
    </div>
    <div v-for="(item, index) in terms" :key="item.name">
      <div v-if="item.active" class="terms-timeline" @click="timelineClick(item.name)">
        <div class="name">{{item.name}}</div>
        <horizontal-timeline :items="item.value" :highlights="item.highlights"></horizontal-timeline>
      </div>
    </div>
  </div>
</template>

<script>
  import HorizontalTimeline from './timeline/HorizontalTimeline.vue'
  import _ from 'lodash'

  import * as storeModules from '../../store/storeModules'
  import * as complianceMutators from '../../store/modules/compliance/mutationTypes'

  export default {

    name: 'searched-for-term-audio-overlay',

    components: {
      HorizontalTimeline
    },

    props: {
      timelineClick: {
        type: Function,
        default: _.noop
      },
      id: String,
      items: Object,
      itemsTopResults: Object,
      onChangeSearchTerm: Function
    },

    data: function () {
      return {
        terms: []
      }
    },

    watch: {
      'items': function (newVal, oldVal) {
        this.updateTerms()
      }
    },

    methods: {
      changeSearchTerm: function (e) {
        this.$store.commit(storeModules.COMPLIANCE + '/' + complianceMutators.FORCED_SEARCH, {term: e.target.value})
        this.onChangeSearchTerm(e.target.value)
      },
      updateTerms: function () {
        this.terms = []
        this.$nextTick(() => {
          _.forOwn(this.items, (value, key) => {
            if (value.length > 0) {
              const highlights = _.orderBy(this.itemsTopResults[key], ['score'])
              const length = highlights.length
              _.each(highlights, function (val, i) {
                val.score = ((i + 1) / length) * 1
              })
              const obj = {
                name: key,
                value: value,
                highlights: highlights,
                active: true
              }
              this.terms.push(obj)
            }
          })
        })
      }
    }
  }
</script>

<style lang="less">
  .searched-for-term-audio {
    .terms-timeline {
      .horizontal-timeline {
        background-color: transparent;
      }
      .playhead{
        top: -5px;
      }
    }
  }
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
  .searched-for-term-audio {
    background-color: transparent;
  }

  .searched-for-term-audio.empty {
    border: 0 none;
  }

  .empty-notification {
    padding: 15px;
    padding-top: 31px;
  }

  .search-within-search {
    padding-top: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid @color-tone-lightest;
    margin-left: 0;
    padding-left: 10px;
    box-shadow: -2px 3px 8px -1px rgba(0,0,0,.41);
  }

  .search-within-search__input {
    max-width: 300px;
  }

  .name {
    position: relative;
    top: 10px;
    font-size: 11px;
    color: @text-medium;
  }
</style>
