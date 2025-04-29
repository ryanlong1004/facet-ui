<template>
  <div class="content">
    <div class="spinner" v-loading="loading"></div>
    <div class="content-storage" v-if="!loading">
      <div class="header">
        <h2>Storage</h2>
        <router-link
          :to="{ name: 'admin-add-cloud-storage' }"
          name="add-cloud-storage"
          v-if="$hasScope(SCOPES.STORAGE_MANAGE)"
        >
          <span>
            <i class="far fa-plus"></i>
            <span>Add New</span>
          </span>
        </router-link>
      </div>

      <empty-states :page="CONSTANTS.EMPTY_STATES.LOCATIONS" v-if="locations && !locations.length"></empty-states>
      <template v-else>
        <div class="table">
          <div class="locations" v-for="location in editableLocations" :key="location.id">
            <div class="flex-container">
              <div class="info">
                <div class="icon">
                  <template v-if="(location.kind === LOCATION_LOCAL) || (location.kind === LOCATION_LOAD_STORE)">
                    <i class="far fa-cloud"></i>
                  </template>
                  <template v-else-if="location.kind === LOCATION_REMOTE">
                    <i class="far fa-server"></i>
                  </template>
                  <template v-else>
                    <img :src="getImageUrl(location.kind)" :alt="location.name" />
                  </template>
                </div>
                <div class="contact">
                  <h3 class="storage-name">{{ location.name }}</h3>
                </div>
              </div>
              <div class="admin-table-row-buttons" v-if="$hasScope(SCOPES.STORAGE_MANAGE)">
                <el-select
                  v-model="locationGroupMap[location.id]"
                  placeholder="Add groups to storage location..."
                  multiple
                  @visible-change="doEditGroups($event, location, locationGroupMap[location.id])"
                  @remove-tag="removeGroup($event, location, locationGroupMap[location.id])"
                  >
                  <el-option
                    v-for="group in groups"
                    :key="group.id"
                    :label="group.name"
                    :value="group.id">
                  </el-option>
                </el-select>
                <el-tooltip
                  class="item"
                  content="Edit Containers for Storage Location"
                  effect="dark"
                  placement="top"
                  :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                  <i class="far fa-container-storage admin-table-row-buttons__icon" @click="viewContainers(location)"></i>
                </el-tooltip>
                <template v-if="location.editable">
                  <el-tooltip
                    class="item"
                    content="Edit Storage"
                    effect="dark"
                    placement="top"
                    :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                    <i class="far fa-pencil admin-table-row-buttons__icon" @click="editStorageLocation(location)"></i>
                  </el-tooltip>
                </template>
                <template v-else>
                  <el-tooltip
                    class="item"
                    content="Cannot Edit Storage"
                    effect="dark"
                    placement="top"
                    :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                    <i class="far fa-pencil admin-table-row-buttons__icon disabled"></i>
                  </el-tooltip>
                </template>
                <el-tooltip
                  class="item"
                  content="Delete Storage"
                  effect="dark"
                  placement="top"
                  :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                  <i class="far fa-trash-alt admin-table-row-buttons__icon" @click="deleteStorageLocation(location)"></i>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { getAPIErrorMsg } from 'src/apiHelpers'
import ContentStorage from './ContentStorage.vue'
import EmptyStates from 'src/components/global/EmptyStates.vue'
import { DASHBOARD, GROUPS, LOCATIONS } from 'src/store/storeModules'
import { GET_IS_SAAS_TRIAL_MODE } from 'src/store/modules/dashboard/dashboard'
import { GET_GROUPS, FETCH_GROUPS } from 'src/store/modules/admin/groups'

import {
  DELETE_GROUP, DELETE_LOCATION,
  EDIT_GROUPS,
  GET_LOCATION_KINDS,
  GET_LOCATIONS,
  GET_LOCATIONS_BUSY,
  LOAD_LOCATION_KINDS,
  LOAD_LOCATIONS
} from 'src/store/modules/locations/locations'

export default {
  name: 'admin-storage',

  mounted () {
    this.loadGroups()
    this.loadLocationKinds()
    this.loadStorageLocations()

    this.$watch('locations', (newVal, oldVal) => {
      _.each(newVal, val => {
        this.locationGroupMap[val.id] = val.groups
      })

    }, {immediate: true})
  },

  components: {
    ContentStorage,
    EmptyStates
  },

  data () {
    return {
      CONSTANTS,
      LOCATION_REMOTE: CONSTANTS.LOCATION_KIND.REMOTE.id,
      LOCATION_LOCAL: CONSTANTS.LOCATION_KIND.LOCAL.id,
      LOCATION_LOAD_STORE: CONSTANTS.LOCATION_KIND.LOADNSTORE.id,
      locationGroupMap: {}
    }
  },

  computed: {
    ...mapGetters(DASHBOARD, {
      isSaasTrailMode: GET_IS_SAAS_TRIAL_MODE
    }),
    ...mapGetters(GROUPS, {
      groups: GET_GROUPS
    }),
    ...mapGetters(LOCATIONS, {
      loading: GET_LOCATIONS_BUSY,
      locations: GET_LOCATIONS,
      locationKinds: GET_LOCATION_KINDS
    }),

    editableLocations () {
      return this.locations.map(location => ({
        ...location,
        editable: _.get((this.locationKinds.find(kind => kind.id === location.kind) || { editable: true }), 'editable', true)
      }))
    }
  },

  methods: {
    ...mapActions(GROUPS, {
      loadGroups: FETCH_GROUPS
    }),

    ...mapActions(LOCATIONS, {
      loadLocationKinds: LOAD_LOCATION_KINDS,
      loadStorageLocations: LOAD_LOCATIONS,
      editGroups: EDIT_GROUPS,
      deleteGroup: DELETE_GROUP,
      deleteLocation: DELETE_LOCATION
    }),

    deleteStorageLocation (location) {
      this.$confirm('Are you sure you want to permanently remove this storage location?', `Delete: ${location.name}`, {
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Continue',
        type: 'warning'
      }).then(async () => {
        try {
          await this.deleteLocation(location.id)
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: location.name + ' deleted.',
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
      })
    },

    getImageUrl (kind) {
      return require(`../../assets/curio/cloud-${kind}.png`)
    },

    viewContainers (location) {
      this.$router.push({ name: 'content-storage', params: { locationId: location.id } })
    },

    editStorageLocation (location) {
      this.$router.push({ name: 'admin-edit-location', params: { locationId: location.id } })
    },

    async removeGroup ($event, oldLocation, newGroups) {
      try {
        await this.deleteGroup(
          {
            locationId: oldLocation.id,
            groupId: $event
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

    async doEditGroups ($event, oldLocation, newGroups) {
      if ($event === false) {
        const groupsToAdd = newGroups
          .filter(groupId => !oldLocation.groups.includes(groupId))
          .map(id => ({ id, type: 'add' }))

        const groupsToRemove = oldLocation.groups
          .filter(groupId => !newGroups.includes(groupId))
          .map(id => ({ id, type: 'delete' }))
        try {
          await this.$store.dispatch(`${LOCATIONS}/${EDIT_GROUPS}`,
            {
              locationId: oldLocation.id,
              groupsToAdd: groupsToAdd,
              groupsToRemove: groupsToRemove
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
      }

    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content-storage {
    .empty-message {
      color: @text-medium;
      font-size: 13px;
      font-style: italic;
    }
    .table {
      .locations {
        border-bottom: 1.5px solid @box-background;

        .flex-container {
          align-items: center;
          display: flex;
          min-height: 60px;

          > div {
            padding: 0 20px 0 9px;
          }

          .info {
            flex: 1;

            .icon,
            .image {
              align-self: center;
              height: auto;
              width: 60px;

              img {
                height: 100%;
                max-width: none;
                width: 100%;
              }
            }

            .icon {
              max-width: 60px;
              min-height: 56.2px;
              min-width: 60px;
            }

            .storage-name {
              margin: 0;
            }
          }

          .admin-table-row-buttons {
            .align-items-center();
            flex: 2;
            margin-left: auto;

            &__icon {
              margin-left: 15px;

              &.disabled {
                color: @color-tone;
                cursor: not-allowed;
              }
            }
          }
        }
      }
    }

    p.list {
      color: @color-primary;
      font-size: 12px;
      line-height: 1.33;

      span {
        + span:before {
          content: ", ";
        }
      }
    }
  }
}
</style>
