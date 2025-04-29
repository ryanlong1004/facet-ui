<template>
  <div class="social-trends">
    <tools-header>
      <template v-slot:middle>
        <ul class="providers" v-if="providers">
          <template v-for="provider in providers">
            <li v-if="provider.hasTopics" :key="provider.name" :class="{ active: currentProvider.name === provider.name }">
              <router-link :to="{ name: 'social-trends', params: { provider: provider.name.toLowerCase(), topic: provider.topics[0].text } }">
                <i :class="`fab fa-${provider.name}`"></i> {{ provider.display }}
              </router-link>
            </li>
          </template>
        </ul>
      </template>
      <template v-slot:right>
        <h5>{{ paging.totalResults }} result<span v-if="paging.totalResults !== 1">s</span></h5>
      </template>
    </tools-header>

    <div class="social-trends__content">
      <header class="topics-header">
        <ul class="topics">
          <li v-for="topic in currentProvider.topics" :key="topic.text" :class="{ active: topic.active }">
            <router-link :to="{ name: 'social-trends', params: { provider: currentProvider.name, topic: topic.text } }">{{ topic.display }}</router-link>
          </li>
        </ul>
      </header>
      <section class="results" v-loading.body="loading">
        <p class="no-results" v-if="results.length === 0">
          No results found for "{{ currentTopic.text }}".
        </p>
        <item-grid :items="results" :collections="true" :from="'social-trends'" :search-key="currentTopic.text"></item-grid>
      </section>
      <el-button type="primary" class="load-more-button" v-if="paging.totalPages > 1 && paging.totalResults > results.length" @click="loadMore()" :loading="loading">Load More</el-button>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import moment from 'moment'
import api from 'src/api'
import { PROVIDERS, MAX_TOPICS } from './config'
import ToolsHeader from 'src/components/global/ToolsHeader.vue'
import SearchQuery from 'src/components/search/SearchQuery'
import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage'
import draggable from 'vuedraggable'
import ItemGrid from 'src/components/global/ItemGrid.vue'
import { putSearchQueryInStore, getSearchQueryFromStore } from 'src/components/search/search-helper'
import { getPrettyLastHarvestedDate } from 'src/date-helper'

export default {
  name: 'social-trends',
  components: {
    ItemGrid,
    ToolsHeader,
    ThumbnailImage,
    draggable
  },
  data () {
    return {
      trends: [],
      trendsLastUpdated: null,
      trendsNextUpdate: null,
      providers: [],
      currentProvider: {},
      currentTopic: {},
      results: [],
      currentFilters: [],
      params: {},
      loading: false,
      paging: {
        pagesLoaded: 0,
        totalPages: 0,
        totalResults: 0
      }
    }
  },
  watch: {
    '$route.query' (newVal, oldVal) {
      this.handleRouteChange()
    }
  },
  mounted () {
    this.providers = PROVIDERS.map(p => {
      return _.assign({}, p, { topics: [], hasTopics: false })
    })
    this.loadTrends()
  },
  methods: {
    loadTrends () {
      api.getSocialTrends()
        .then(response => {
          this.trendsLastUpdated = moment(response.updated_at).fromNow()
          this.trendsNextUpdate = moment(response.next_update_at).fromNow()
          _.each(response.trends, topic => {
            const cleanTopic = decodeURIComponent(topic.text).replace(/["']/g, '').replace(/[+]/g, ' ')
            const provider = _.find(this.providers, { name: topic.source.toLowerCase() })
            if (provider) {
              provider.hasTopics = true
              if (provider.topics.length < MAX_TOPICS) {
                provider.topics.push(_.assign({}, topic, { text: cleanTopic, active: false }))
              }
            }
          })
          this.handleRouteChange()
        })
        .catch(err => {
          console.error('error loading trends', err)
        })
    },
    handleRouteChange () {
      const urlParams = this.$route.params
      // const queryParams = this.$route.query
      let key = _.get(this.$route, 'query.key')
      let searchQuery = getSearchQueryFromStore(key)
      // set provider...
      const provider = _.find(this.providers, { name: urlParams.provider })
      if (provider) {
        this.setCurrentProvider(provider)
      } else {
        const firstProviderWithTopics = _.find(this.providers, { hasTopics: true })
        if (firstProviderWithTopics) {
          this.setCurrentProvider(firstProviderWithTopics)
        }
      }
      // set topic...
      let topicSet = false
      if (urlParams.topic) {
        // make sure this topic is in the current provider
        const topic = _.find(this.currentProvider.topics, { text: urlParams.topic })
        if (topic) {
          this.setCurrentTopic(topic)
          topicSet = true
        }
      }
      if (!topicSet) {
        // get first topic for current provider
        const firstTopic = this.currentProvider.topics[0]
        this.setCurrentTopic(firstTopic)
      }
      // get filters and search...
      this.params = new SearchQuery(`"${this.currentTopic.text}"`)
      if (!_.isEmpty(searchQuery)) {
        this.params.applyQueryParams(searchQuery)
      }
      this.doSearch(this.params)
    },
    setCurrentProvider (provider) {
      if (this.currentTopic) {
        this.currentTopic.active = false
      }
      this.currentProvider = provider
    },
    setCurrentTopic (topic) {
      if (this.currentTopic) {
        this.currentTopic.active = false
      }
      topic.active = true
      this.currentTopic = topic
    },
    applyFilter (path, field, value, enabled = true) {
      if (enabled) {
        this.params.addMultiTerm(field, value)
      } else {
        this.params.removeMultiTerm(field, value)
      }
      this.params.page(0)
      this.applyUrlChange()
    },
    removeFilter (filter) {
      this.params.removeMultiTerm(filter.field, filter.val)
      this.params.page(0)
      this.applyUrlChange()
    },
    applyUrlChange () {
      let query = new SearchQuery(this.currentTopic.text)
      query.applyQueryParams(this.params)
      let key = putSearchQueryInStore(query)
      this.$router.push({ path: '/social-trends/' + this.currentProvider.name.toLowerCase() + '/' + this.currentTopic.text, query: {key: key} })
    },
    doSearch (params) {
      this.loading = true
      api.search(params.getQueryObject())
        .then(response => {
          _.each(response.results, result => {
            result.result.lastHarvested = getPrettyLastHarvestedDate(result.result.last_harvested)
            const hitCounts = _.get(result.result, 'hit_counts', {}) || {}
            // copy the item stuff into the top level
            _.assign(result, result.result, { nsfw: _.get(result, 'result.summary.nsfw.nsfw', false), hit_counts: hitCounts })
          })
          if (response.page > 0) {
            this.results = this.results.concat(response.results)
          } else {
            this.results = response.results
          }
          this.paging = {
            pagesLoaded: response.page,
            totalPages: Math.ceil(response.total_hits / response.limit),
            totalResults: response.total_hits
          }
        })
        .finally(() => {
          this.loading = false
        })
    },
    loadMore () {
      this.params.page(this.paging.pagesLoaded + 1)
      this.doSearch(this.params)
    },
    goToItemDetail (itemId) {
      this.$router.push({ path: '/item/' + itemId })
    }
  }
}
</script>

<style lang="less">
@import (reference) '../../styles/_variables.less';
@import (reference) '../../styles/_mixins';

.social-trends {
  background-color: @color-base;
  height: 100vh;

  .social-trends__content {
    padding: 0;
  }

  .social-trends__result-count {
    .align-items-center();
    color: @text-light;
    font-size: 10px;
    font-weight: 900;
    margin: 0;
    padding: 0 0 0 15px;
    text-transform: uppercase;
  }
  .providers {
    .flex-box();
    list-style: none;
    margin: 10px 0 8px 12px;
    padding: 0;

    > li {
      border-radius: 2px;
      color: @color-tone;
      font-size: 10px;
      padding: 4px 8px;
      a {
        color: @color-tone;
        cursor: pointer;
        text-decoration: none;
      }
      i.fab {
        font-size: 15px;
        margin-right: 5px;
      }
      &.active a {
        color: @color-primary;
      }
    }

    + div {
      .flex-container-end();
      margin-left: auto;

      h5 {
        margin-right: 10px;
      }
    }
  }
  .topics-header {
    border-bottom: 1px solid @box-border-grey;
    margin-left: 20px;
  }
  .topics {
    .flex-box();
    .flex-direction(row);
    list-style: none;
    margin: 0;
    padding: 0;
    > li {
      font-size: 12px;
      a {
        color: @text-medium;
        cursor: pointer;
        display: inline-block;
        padding: 12px 20px;
        text-decoration: none;
        &:hover {
          color: @text-dark;
        }
      }
      &.active {
        border-bottom: 3px solid @primary-button-color;
      }
      &.active a,
      &.active a:hover {
        color:  @primary-button-color;
      }
    }
  }
  .results {
    // subtract the height of the search-results__header and topics-header
    height: calc(~'100vh - 200px');
    overflow-y: auto;
    padding: 20px;
    .results--item-grid.responsive-item-grid {
      margin-top: 0;
    }
  }
  .no-results {
    font-size: 15px;
    font-style: italic;
    margin-top: 20px;
  }

  .el-button.el-button--primary {
    margin: 20px;
  }
}
</style>
