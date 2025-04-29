<template>
  <div class="file-browser">
    <tools-header>
      <template v-slot:right>
        <collections-button></collections-button>
      </template>
    </tools-header>
    <div class="search-results__container">
      <section class="search-results__results">
        <ul v-if="locations !== null && locations.length > 0" class="locations-list">
          <li v-for="location in locations" :key="location.id"
            @click="setCurrentLocation(location.id)"
            class="location"
            :class="{ 'location--active': location.active }">
            <i :class="setLocationIconClass(location.kind)"></i> {{ location.name }} </li>
        </ul>
        <div class="scroll-wrapper">
          <p class="no-storage-found" v-if="locations !== null && locations.length === 0">No browsable storage detected. <router-link :to="{ name: 'admin-add-cloud-storage' }">Connect a cloud storage account</router-link> and refresh this page.</p>
          <h5 v-if="currentPath.length > 0" class="current-folder-path">
            <span v-for="path in currentPath" :key="path.path">
              <span v-if="path.first && path.last">{{ currentLocation.name }}</span>
              <span v-else-if="path.first" class="path-link" @click="setCurrentPath(path.path)">{{ currentLocation.name }}</span>
              <span v-if="!path.first && !path.last" class="path-link" @click="setCurrentPath(path.path)">{{ path.name }}</span>
              <span v-else-if="!path.first">{{ path.name }}</span>
              <span v-if="!path.last"><i class="far fa-angle-right"></i></span>
            </span>
          </h5>
          <ul v-if="folders.length > 0" class="folder-list">
            <li class="folder-list__folder" v-for="folder in folders" :key="folder.path">
              <div class="folder-list__column folder-list__column--name" @click="setCurrentPath(folder.path)"><i class="fas fa-folder"></i> {{ folder.name }}</div>
            </li>
          </ul> <!-- .folder-list -->

          <!-- grid view -->
          <item-grid v-if="viewMode === 'grid'" :items="files" :collections="true" :from="'file-browser'"></item-grid>
          <!-- list view -->
          <draggable v-if="viewMode === 'list'" :list="files" :options="{group:{name: 'collections', pull: 'clone', put: 'false'}, sort: false, disabled: !collectionsOpen}" :clone="onDragClone" :move="onMove" class="results-draggable">
            <div v-for="file in files" :key="file._id" class="search-result">
              <div class="search-result__preview">
                <router-link :to="{ name: 'itemDetails', params: { id: file._id }, query: { from: 'file-browser' } }">
                  <thumbnail-image :id="file._id" :thumb="file.thumbnail"></thumbnail-image>
                </router-link>
              </div>
              <div class="search-result__details">
                <div class="search-result__details--top">
                  <div>
                    <router-link :to="{ name: 'itemDetails', params: { id: file._id }, query: { from: 'file-browser' } }" class="search-result__title">
                      <span>
                        <h3>{{ getName(file.name) || getName(file.filename) || getName(file.stow_url) }}</h3>
                      </span>
                    </router-link>
                    <p class="item-categories" v-if="file.categories && file.categories.length">
                      {{ file.categories.join(', ') }}
                    </p>
                  </div>
                  <el-tooltip effect="light" content="Download" placement="top" :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                    <i class="far fa-download" aria-hidden="true" v-on:click="download(file._id)"></i>
                  </el-tooltip>
                </div>
                <div class="search-result__details--bottom">
                  <p class="file-stats">
                    {{file.lastHarvested}} &middot;
                    {{file.fileSize }}
                    <span v-if="file.durationTime"> &middot; {{file.durationTime}}</span>
                  </p>
                </div>
              </div>
            </div>
          </draggable>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters } from 'vuex'
import moment from 'moment'
import humanize from 'humanize-plus'
import draggable from 'vuedraggable'

import {getName} from 'src/item-helper'
import { cleanVideoDuration, millisToHHMMSS } from 'src/components/search/search-results-helper'
import api from 'src/api'
import { getAPIErrorMsg } from 'src/apiHelpers'
import ToolsHeader from 'src/components/global/ToolsHeader.vue'
import CollectionsButton from 'src/components/collections/CollectionsButton'
import SearchQuery from 'src/components/search/SearchQuery'
import ThumbnailImage from 'src/components/thumbnail/ThumbnailImage.vue'
import ItemGrid from 'src/components/global/ItemGrid.vue'
import { CONSTANTS } from 'src/constants'
import { setCookie, getCookie } from 'src/cookie-helper'

import { RIGHT_PANEL } from 'src/store/storeModules'
import { COLLECTIONS_OPEN } from 'src/store/modules/rightPanel/getterTypes'

const VIEW_MODE_LIST = 'list'
const VIEW_MODE_GRID = 'grid'
const VIEW_MODE_COOKIE_NAME = 'gm_file_browser_view_mode'

const getReactiveLocation = function (loc) {
  return {
    id: loc.location_id,
    name: loc.location_name,
    kind: loc.location_kind,
    rootFolders: loc.root_folders || [],
    active: false
  }
}
const getReactiveFolder = function (folder, locationId) {
  return _.assign({}, folder, { locationId })
}

export default {
  name: 'file-browser',
  components: {
    draggable,
    CollectionsButton,
    ThumbnailImage,
    ItemGrid,
    ToolsHeader
  },
  data () {
    return {
      getName,
      CONSTANTS,
      locations: null,
      currentLocation: '',
      currentPath: [],
      folders: [],
      files: [],
      viewMode: 'list'
    }
  },
  watch: {
    '$route.query' (newVal, oldVal) {
      this.handleRouteChange()
    }
  },
  mounted () {
    this.viewMode = getCookie(VIEW_MODE_COOKIE_NAME) || VIEW_MODE_LIST
    this.getLocations()
  },
  methods: {
    setViewMode (mode = 'list') {
      if (mode === VIEW_MODE_LIST || mode === VIEW_MODE_GRID) {
        this.viewMode = mode
        setCookie(VIEW_MODE_COOKIE_NAME, mode)
      }
    },
    async handleRouteChange () {
      // clear out folders on route change
      this.folders = []
      let activeLocation = this.getActiveLocation()

      if (typeof activeLocation.newLoc === 'undefined') {
        await this.getLocations()
        activeLocation = this.getActiveLocation()
      }

      if (activeLocation.currentLoc && activeLocation.currentLoc.id !== activeLocation.queryParams.location_id) {
        activeLocation.currentLoc.active = false
      }
      if (activeLocation.newLoc) {
        activeLocation.newLoc.active = true
        this.currentLocation = activeLocation.newLoc
      }
      if (!activeLocation.path) {
        this.currentPath = []
        this.files = []
        if (_.get(activeLocation.newLoc, 'rootFolders')) {
          this.folders = activeLocation.newLoc.rootFolders.concat([])
        }
        if (_.get(activeLocation.newLoc, 'kind') === CONSTANTS.LOCATION_KIND.DROPBOX.id) {
          this.getFolderContent(this.currentLocation.id, '')
        } else if (_.get(activeLocation.newLoc, 'kind') === CONSTANTS.LOCATION_KIND.ONEDRIVE.id) {
          this.getFolderContent(this.currentLocation.id, '/')
        } else if (_.get(activeLocation.newLoc, 'kind') === CONSTANTS.LOCATION_KIND.SHAREPOINT.id) {
          this.getFolderContent(this.currentLocation.id, '/')
        }
      } else {
        this.currentPath = []
        let pathParts = []
        if (activeLocation.path === '/') {
          pathParts.push('/')
          this.currentPath.push({
            name: '/',
            path: '/',
            first: true,
            last: true
          })
        } else {
          _.each(activeLocation.path.split('/'), p => {
            pathParts.push(p)
            this.currentPath.push({
              name: p,
              path: pathParts.join('/'),
              first: false,
              last: false
            })
          })
          // rig to fix dropbox
          if ((_.get(activeLocation.newLoc, 'kind') === CONSTANTS.LOCATION_KIND.DROPBOX.id) || (_.get(activeLocation.newLoc, 'kind') === CONSTANTS.LOCATION_KIND.DROPBOXTEAMS.id)) {
            pathParts.unshift('')
            this.currentPath.unshift({
              name: '',
              path: '',
              first: true,
              last: false,
            })
          }
          this.currentPath[0].first = true
          this.currentPath[this.currentPath.length - 1].last = true
        }
        this.getFolderContent(this.currentLocation.id, activeLocation.path)
      }
    },
    // get active location
    getActiveLocation () {
      const queryParams = this.$route.query
      return {
        queryParams: queryParams,
        currentLoc: _.find(this.locations, { active: true }),
        newLoc: _.find(this.locations, { id: queryParams.location_id }),
        path: queryParams.path
      }
    },
    getLocationKind (routeName) {
      switch (routeName) {
        case CONSTANTS.ROUTES.CONNECTED.BOX.NAME:
          return CONSTANTS.LOCATION_KIND.BOX.id
        case CONSTANTS.ROUTES.CONNECTED.DROPBOX.NAME:
          return CONSTANTS.LOCATION_KIND.DROPBOX.id
        case CONSTANTS.ROUTES.CONNECTED.DROPBOXTEAMS.NAME:
          return CONSTANTS.LOCATION_KIND.DROPBOXTEAMS.id
        case CONSTANTS.ROUTES.CONNECTED.ONEDRIVE.NAME:
          return CONSTANTS.LOCATION_KIND.ONEDRIVE.id
        case CONSTANTS.ROUTES.CONNECTED.SHAREPOINT.NAME:
          return CONSTANTS.LOCATION_KIND.SHAREPOINT.id
      }
    },
    async getLocations () {
      const kind = this.getLocationKind(this.$route.name)
      try {
        const response = await api.getFileBrowser()
        const locs = _.filter(response.locations, { 'location_kind': kind })
        if (locs.length) {
          this.locations = locs.map(l => {
            return getReactiveLocation(l)
          })
          // if location is not in the query params, set it to the first one
          let locationId = _.get(this, '$route.query.location_id', this.locations[0].id)
          this.setCurrentLocation(locationId)
        } else {
          this.locations = []
        }
      } catch (err) {
        console.error(getAPIErrorMsg(err))
      }
    },
    async getFolderContent (locationId, path) {
      try {
        const response = await api.getFileBrowser(locationId, path)
        const folders = _.get(response, 'folders', []) || []
        this.folders = folders.map(f => {
          return getReactiveFolder(f, response.location_id)
        })
        const files = _.get(response, 'files', []) || []
        this.files = files.map(r => {
          if (r.result.categories && !_.isArray(r.result.categories)) {
            r.result.categories = [r.result.categories]
          }
          r.result.lastModified = moment(r.result.last_modified).fromNow()
          r.result.lastHarvested = moment(r.result.last_harvested).format('MM/DD/YYYY')
          r.result.fileSize = humanize.fileSize(r.result.file_size)
          r.result.nsfw = _.get(r.result, 'nsfw.is_adult_content', false)
          const vt = _.get(r.result, 'mediainfo.video.duration_time', 0)
          const vd = _.get(r.result, 'mediainfo.video.duration', 0)
          const at = _.get(r.result, 'mediainfo.audio.duration_time', 0)
          const ad = _.get(r.result, 'mediainfo.audio.duration', 0)
          if (vt) {
            r.result.durationTime = cleanVideoDuration(vt)
          } else if (at) {
            r.result.durationTime = cleanVideoDuration(at)
          }
          if (vd) {
            r.result.durationHHMMSS = millisToHHMMSS(vd)
          } else if (ad) {
            r.result.durationHHMMSS = millisToHHMMSS(ad)
          }
          return r.result
        })
      } catch (err) {
        console.error(getAPIErrorMsg(err))
      }

    },
    setCurrentLocation (locationId) {
      let queryPath = _.get(this, '$route.query.path', '')
      // Box.com expects the base queryPath to be "All Files"
      if (this.$route.name === CONSTANTS.ROUTES.CONNECTED.BOX.NAME) {
        if (queryPath === '' || (locationId !== this.$route.query.location_id)) {
          queryPath = 'All Files'
        }
      } else if (this.$route.name === CONSTANTS.ROUTES.CONNECTED.ONEDRIVE.NAME) {
        if (queryPath === '' || (locationId !== this.$route.query.location_id)) {
          queryPath = '/'
        }
      } else if (this.$route.name === CONSTANTS.ROUTES.CONNECTED.SHAREPOINT.NAME) {
        if (queryPath === '' || (locationId !== this.$route.query.location_id)) {
          queryPath = '/'
        }
      }
      this.$router.push({ name: this.$router.name, query: { location_id: locationId, ts: moment().unix(), path: queryPath } })
    },
    setCurrentPath (path) {
      this.$router.push({ name: this.$router.name, query: { location_id: this.currentLocation.id, ts: moment().unix(), path } })
    },
    setLocationIconClass (kind) {
      switch (kind) {
        case CONSTANTS.LOCATION_KIND.BOX.id:
          return 'icon-box_flat'
        case CONSTANTS.LOCATION_KIND.DROPBOX.id:
          return 'fab fa-dropbox'
        default:
          return ''
      }
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
    download: function (itemId) {
      api.downloadItem(itemId)
    }
  },
  computed: {
    ...mapGetters(RIGHT_PANEL, {
      collectionsOpen: COLLECTIONS_OPEN
    })
  }
}
</script>

<style lang="less">
@import '~src/styles/file-browser';
</style>
