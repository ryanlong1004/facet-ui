<template>
  <div class="content admin-content-storage">
    <div class="spinner" v-loading="loadingInitData"></div>
    <div v-if="!loadingInitData" :class="{ 'connected': location }" class="content-storage">
      <h2 class="title">
        <div class="icon" :class="{ 'has-image': !isLocationKindType }">
          <i v-if="(location.kind === LOCATION_LOCAL) || (location.kind === LOCATION_LOAD_STORE)" class="far fa-cloud"></i>
          <i v-else-if="location.kind === LOCATION_REMOTE" class="far fa-server"></i>
          <img v-else :src="getImageUrl(location.kind)" />
        </div>
        <span>Analyze folders for location "{{ location.name }}"</span>
      </h2>
      <div v-if="containersError" class="container-error-message">
        <h4>Sorry, we are having a problem connecting to your storage location.</h4>
        <p>Please <router-link :to="{ name: 'admin-edit-location', params: { locationId: location.id } }">verify your settings</router-link> and try connecting again.</p>
        <el-button size="mini" type="info" @click="cancel">Go Back</el-button>
      </div>
      <div v-else>
        <div class="account-content-connected">
          <h4>Choose which folders to analyze from your <span>{{ location.name }}</span> account. Selected folders will automatically update Wasabi AiR™ in {{harvestRefreshTime}} hours.</h4>
          <table class="containers-list" v-if="containers.length > 0">
            <thead>
              <tr>
                <th>Folder name</th>
                <th>Extractor profile</th>
                <th>User group(s)</th>
                <th>Options</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="container in filteredContainers" :key="container.id">
                <td class="container-name">
                  <i
                    :class="{ inactive: !container.enabled, disabled: !container.profile_id }"
                    @click="doToggleContainer(locationId, container)"
                    class="far fa-toggle-on"
                  ></i>
                  {{container.name}}
                </td>
                <td>
                  <el-select
                    v-model="container.profile_id"
                    placeholder="Extractor profile (required)"
                    @change="updateContainerProfile(container)">
                    <el-option
                      v-for="profile in extractorProfiles"
                      :key="profile.id"
                      :label="profile.name"
                      :value="profile.id">
                    </el-option>
                  </el-select>
                </td>
                <td>
                  <el-select
                    v-model="container.groups"
                    :placeholder="container.enabled ? `User group(s) (optional)` : `Enable container first...`"
                    multiple
                    collapse-tags
                    :disabled="!container.enabled"
                    @change="doEditGroup(container)">
                    <!--  not sure why, but if I try to implement this the same way as storage locations
                      the first page does not refresh appropriately, subsequent pages do.
                        in order to apply bulk changes, this needs to be fixed -->
                    <el-option
                      v-for="group in sortedGroups"
                      :key="group.id"
                      :label="group.name"
                      :value="group.id">
                    </el-option>
                  </el-select>
                </td>
                <td>
                  <el-button type="primary" :disabled="!container.enabled" size="mini" @click="harvestContainer(container)">Analyze Now</el-button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <el-button
              @click="paginationPrevious()"
              icon="el-icon-arrow-left"
              size="mini"
              type="primary"
              v-if="page > 0"
            >
              Previous Page
            </el-button>
            <el-button
              @click="paginationNext()"
              size="mini"
              type="primary"
              v-if="page < cursors.length - 1"
            >
              Next Page
              <i class="el-icon-arrow-right"></i>
            </el-button>
          </div>

          <div class="flex-container confirmation-tools">
            <message>Verify that you want to process all content inside a folder before toggling it on.</message>
            <router-link
              :to="{ name: 'admin-storage' }"
              class="button-link"
              name="storage"
            >
              <span>Done</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import moment from 'moment'

import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { getAPIErrorMsg } from 'src/apiHelpers'

import session, { DEFAULT_AUTH_ROLES, GET_CURRENT_USER, GET_HARVEST_REFRESH_TIME } from 'src/store/modules/session/session'

import Message from 'src/components/global/Message'

import { mapActions, mapGetters } from 'vuex'
import { GET_GROUPS, FETCH_GROUPS } from 'src/store/modules/admin/groups'
import {
  EDIT_GROUPS,
  GET_LOCATION,
  GET_LOCATIONS,
  LOAD_LOCATIONS
} from 'src/store/modules/locations/locations'
import {
  LOAD_CONTAINERS,
  LOAD_PAGE,
  PAGE_DOWN,
  PAGE_UP,
  TOGGLE_CONTAINER,
  HARVEST_CONTAINER,
  UPDATE_CONTAINER
} from 'src/store/modules/containers/actions'
import {
  CONTAINERS,
  GROUPS,
  LOCATIONS,
  SESSION,
  EXTRACTORS
} from 'src/store/storeModules'
import {
  GET_CONTAINERS,
  GET_CURSORS,
  GET_PAGE
} from 'src/store/modules/containers/getters'
import { RESET_STORE } from 'src/store/store-helpers'
import {
  // getters
  GET_EXTRACTOR_PROFILES,
  // actions
  FETCH_EXTRACTOR_PROFILES
} from 'src/store/modules/admin/extractors'

const CONTAINER_ALL = 'All'

export default {
  name: 'content-storage',
  components: {
    Message
  },
  async beforeMount () {
    await this.loadGroups()
    await this.loadStorageLocations()
    await this.loadStorageContainers(this.locationId)
    await this.loadExtractorProfiles()
  },

  async mounted () {
    this.$watch('locationId', async (newVal, oldVal) => {
      await this.loadStorageContainers(newVal)
    })
  },

  data () {
    return {
      CONSTANTS,
      containersError: false,
      loadingInitData: true,
      LOCATION_REMOTE: CONSTANTS.LOCATION_KIND.REMOTE.id,
      LOCATION_LOCAL: CONSTANTS.LOCATION_KIND.LOCAL.id,
      LOCATION_LOAD_STORE: CONSTANTS.LOCATION_KIND.LOADNSTORE.id
    }
  },
  computed: {
    ...mapGetters(GROUPS, {
      sortedGroups: GET_GROUPS
    }),
    ...mapGetters(CONTAINERS, {
      cursors: GET_CURSORS,
      containers: GET_CONTAINERS,
      page: GET_PAGE
    }),
    ...mapGetters(LOCATIONS, {
      locations: GET_LOCATIONS
    }),
    ...mapGetters(EXTRACTORS, {
      extractorProfiles: GET_EXTRACTOR_PROFILES
    }),
    location () {
      if (!this.locationId || !this.locations.length) {
        return {kind: ''}
      }
      return _.find(this.locations, { id: this.locationId })
    },
    harvestRefreshTime () {
      const seconds = this.$store.getters[`${SESSION}/${GET_HARVEST_REFRESH_TIME}`]
      return seconds / 60 / 60 // calculate hours
    },
    isLocationKindType () {
      return (this.location.kind === this.LOCATION_LOCAL || this.location.kind === this.LOCATION_LOAD_STORE || this.location.kind === this.LOCATION_REMOTE)
    },
    locationId () {
      return this.$route.params.locationId || ''
    },
    filteredContainers () {
      return this.containers.filter(c => c.name !== CONTAINER_ALL)
    }
  },
  methods: {
    ...mapActions(GROUPS, {
      loadGroups: FETCH_GROUPS
    }),
    ...mapActions(CONTAINERS, {
      loadContainers: LOAD_CONTAINERS,
      loadPage: LOAD_PAGE,
      toggleContainer: TOGGLE_CONTAINER,
      editGroups: EDIT_GROUPS,
      doHarvestContainer: HARVEST_CONTAINER,
      doUpdateContainer: UPDATE_CONTAINER
    }),
    ...mapActions(LOCATIONS, {
      loadStorageLocations: LOAD_LOCATIONS
    }),
    ...mapActions(EXTRACTORS, {
      loadExtractorProfiles: FETCH_EXTRACTOR_PROFILES
    }),

    cancel () {
      this.$router.push({ name: 'admin-storage' })
    },
    getImageUrl (kind) {
      return _.get(this.location, 'kind', '') ? require(`../../assets/curio/cloud-${kind}.png`) : ''
    },

    async loadStorageContainers (locId) {
      try {
        this.containersError = false
        this.loadingInitData = true
        await this.loadContainers({locId, force: true})
      }
      catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: 'Please check your credentials and try again.',
          showClose: true,
          type: 'error'
        })
        this.containersError = true
      }
      finally {
        this.loadingInitData = false
      }
    },

    async doEditGroup (container) {
      console.log({ container })
      try {
        await this.editGroups({container})
      }
      catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      }
    },

    async paginationNext () {
      await this.loadPage({locId: this.locationId, direction: PAGE_UP})
    },

    async paginationPrevious () {
      await this.loadPage({locId: this.locationId, direction: PAGE_DOWN})
    },

    async doToggleContainer (locId, container) {
      if (!container.profile_id) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: 'Select an extractor profile before turning on a container',
          showClose: true,
          type: 'error'
        })
        return
      }
      try {
        const msg = await this.toggleContainer({locId, container})
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: msg,
          showClose: true,
          type: 'success'
        })
      }
      catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      }
    },

    async updateContainerProfile (container) {
      try {
        const msg = await this.doUpdateContainer({
          locationId: this.locationId,
          containerId: container.id,
          profileId: container.profile_id,
          enabled: container.enabled
        })
      } catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: 'Unable to change extractor profile',
          showClose: true,
          type: 'error'
        })
      }
    },

    async harvestContainer (container) {
      try {
        const ok = await this.doHarvestContainer({
          locationId: this.locationId,
          containerId: container.id
        })
        if (ok) {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'Container is being analyzed now',
            showClose: true,
            type: 'success'
          })
        } else {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'Container is already being analyzed',
            showClose: true,
            type: 'error'
          })
        }
      } catch (err) {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: 'An error occurred, please try again',
          showClose: true,
          type: 'error'
        })
      }
    }
  },

  beforeDestroy () {
    this.$store.commit(`${CONTAINERS}/${RESET_STORE}`)
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

h2.title {
  align-items: center;
  display: flex;
  .icon {
    margin-right: 5px;
    img {
      .size(80px, auto);
      display: inline-block;
      margin-left: -20px;
      margin-top: -21px;
    }

    &.has-image {
      + span {
        display: inline-block;
        margin-top: -21px;
      }
    }
  }
}

.container-error-message {
  background-color: lighten(@color-alert, 90);
  border-left: 2px solid @color-alert;
  padding: 15px;
  > h4 {
    color: @color-alert;
    margin: 0 0 10px 0;
  }
  > p {
    margin: 0 0 15px 0;
  }
  a {
    color: @primary-button-color;
  }
}

.containers-list {
  background-color: transparent !important;
  border-bottom: 1px dotted @box-border-grey;
  margin-bottom: 0 !important;

  thead tr th {
    background-color: transparent;
    border-bottom: 1px solid @box-border-grey;
    color: @text-light;
    font-size: 12px;
    letter-spacing: 0;
    padding-bottom: 10px;
    text-align: left !important;
    text-transform: none;
  }
  tbody tr td {
    background-color: transparent;
    border-bottom: 1px dotted @box-border-grey;
    &.container-name {
      color: @text-dark;
      font-size: 12px;
      vertical-align: center;
      .fa-toggle-on {
        color: @primary-button-color;
        font-size: 24px;
        margin-right: 5px;

        &.inactive {
          color: @color-alert;
          transform: rotate(180deg);
        }
        &.disabled {
          color: @color-tone-darkest !important;
          cursor: not-allowed;
        }
      }
    }
    .el-select {
      min-width: 200px;
    }
    .el-button--mini {
      font-size: 11px;
      letter-spacing: 0;
    }
  }
  tbody tr {
    &:hover {
      td {
        background-color: @background-grey;
      }      
    }
  }
}

.flex-container {
  .flex-container-end();

  a {
    .base-font-uppercase();
    color: @color-primary;
    display: inline-block;
    font-size: 14px;
    font-weight: 700;
    margin-right: 21px;
  }
}

.admin-page {
  .content {
    .content-storage {
      max-width: 601.5px;

      &.connected {
        max-width: none;
      }

      .el-form-item {
        &.has-checkbox {
          margin-bottom: 22px;
        }
      }

      .connected-services {
        background-color: @color-tone-light;
        list-style: none;
        margin: 7px 0 24px;
        padding: 8px 14px;

        li {
          .flex-container();

          > span {
            border-right: 1px solid @color-tone-lightest;
            display: inline-block;
            padding-right: 15px;

            img {
              max-width: 74px;
            }
          }

          p {
            font-size: 13px;
            line-height: 1.33;
            margin: 0 0 0 15px;
          }

          .connected {
            margin-left: auto;

            span {
              .base-font-uppercase();
              .rel-pos(-3px, auto, auto, auto);
              display: inline-block;
              font-size: 12px;
              font-weight: 700;
              margin-left: 5px;
            }

            i {
              color: @color-accent;
              font-size: 20px;
            }
          }
        }
      }

      h3,
      h4,
      p {
        span {
          &.kind {
            text-transform: capitalize;
          }
        }
      }
    }
  }
}

.confirmation-tools {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
  .message {
    margin: 0;
  }
  .button-link {
    margin-right: 0;
  }
}
</style>
