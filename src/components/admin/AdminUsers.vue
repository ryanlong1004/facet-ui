<template>
  <div class="content-users">

    <h2>Users</h2>

    <div class="header">
      <el-radio-group v-model="userStatusFilter" size="mini">
        <el-radio-button @click.stop.prevent :label="USER_STATUS.ENABLED">Active Users</el-radio-button>
        <el-radio-button @click.stop.prevent :label="USER_STATUS.DISABLED">Disabled Users</el-radio-button>
      </el-radio-group>
      <div class="options">
        <div v-if="displayedUsers" class="search-for-user-input-wrapper">
          <input
            class="search-for-user__input el-input__inner"
            placeholder="Filter users by name, role, or email"
            type="text"
            v-model="searchedForUser"
          >
          <i v-if="searchedForUser !== ''" class="far fa-times" @click="searchedForUser = ''"></i>
        </div>

        <el-button type="text" @click="addNewUser">
          <i class="far fa-plus"></i>
          Add New
        </el-button>
      </div>
    </div>

    <table class="users-table" v-loading="loading">
      <thead>
        <tr>
          <th>User</th>
          <th>Role</th>
          <th>Groups</th>
          <th class="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="user in displayedUsers"
          :key="user.id">
          <td>
            <div class="info">
              <div class="image">
                <img
                  :alt="`${user.first_name} ${user.last_name}`"
                  :src="user.avatar"
                  v-if="user.avatar"
                />
                <avatar
                  backgroundColor="#00ce3e"
                  :username="`${user.first_name} ${user.last_name}`"
                  v-else
                >
                </avatar>
              </div>
              <div class="contact">
                <h3 v-if="user.first_name || user.last_name">
                  {{ `${user.first_name} ${user.last_name}` }}
                </h3>
                <p v-if="user.email">{{ user.email }}</p>
              </div>
            </div>
          </td>
          <td>
            <el-select
              placeholder="Role..."
              @change="changeUserRole(user)"
              v-model="user.role_id"
              v-if="user.id !== currentUser.id"
            >
              <el-option
                :key="role.id"
                :label="role.name"
                :value="role.id"
                v-for="role in roles"
              >
              </el-option>
            </el-select>
            <p v-else class="disclaimer">{{ currentUserRoleName }}</p>
          </td>
          <td>
            <el-select
              filterable
              multiple
              collapse-tags
              placeholder="User Groups..."
              @change="changeUserGroups(user)"
              v-model="user.group_ids"
              v-if="user.id !== currentUser.id"
            >
              <el-option
                :key="group.id"
                :label="group.name"
                :value="group.id"
                v-for="group in groups"
              >
              </el-option>
            </el-select>
            <p v-else class="disclaimer">{{ currentUserGroupNames }}</p>
          </td>
          <td class="actions">
            <div class="admin-table-row-buttons" :class="{ 'is-super-user': user.id === currentUser.id }">
              <el-tooltip
                class="item"
                content="Edit User"
                effect="dark"
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                <i class="far fa-pencil admin-table-row-buttons__icon" v-if="userStatusFilter === USER_STATUS.ENABLED" @click="editUser(user.id)"></i>
              </el-tooltip>
              <el-tooltip
                :content="userStatusFilter === USER_STATUS.ENABLED ? 'Disable user' : 'Re-enable user'"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
                class="item"
                effect="dark"
                placement="top"
                v-if="user.id !== currentUser.id"
              >
                <i class="admin-table-row-buttons__icon" :class="{ 'far fa-trash': userStatusFilter === USER_STATUS.ENABLED, 'fas fa-undo': userStatusFilter === USER_STATUS.DISABLED }" @click="toggleUser(user)"></i>
              </el-tooltip>
            </div>
          </td>
        </tr>
        <tr v-show="!displayedUsers.length">
          <td class="no-results" colspan="4">
            <p class="disclaimer">No users found.</p>
          </td>
        </tr>
      </tbody>
    </table>
    <el-dialog
      :before-close="hideUserForm"
      :visible.sync="showUserForm"
      :title="userIdToEdit ? 'Edit User' : 'Add User'"
      top="5%">
      <admin-user-form v-if="showUserForm" :user-id="userIdToEdit" @close-form="hideUserForm"/>
    </el-dialog>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import Avatar from 'vue-avatar'

import session from 'src/session'
import { userSorter } from 'src/sort-helper'

import AdminUserForm from './AdminUserForm.vue'

import {
  GROUPS,
  ROLES,
  SESSION,
  USERS
} from 'src/store/storeModules'
import {
  GET_CURRENT_USER,
  GET_IS_SAAS,
  GET_PASSWORD_MIN_LENGTH,
  GET_PASSWORD_MAX_LENGTH
} from 'src/store/modules/session/session'
import { GET_GROUPS, FETCH_GROUPS } from 'src/store/modules/admin/groups'
import { GET_ROLES, FETCH_ROLES, FETCH_SCOPES } from 'src/store/modules/admin/roles'

import {
  // getters
  GET_USERS,
  // actions
  FETCH_USERS,
  UPDATE_USER,
  UPDATE_USER_GROUPS
} from 'src/store/modules/admin/users'

const USER_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled'
}

export default {
  name: 'admin-users',

  components: {
    AdminUserForm,
    Avatar
  },

  async beforeMount () {
    this.loading = true
    await this.fetchUsers()
    await this.fetchGroups()
    await this.fetchRoles()
    await this.fetchScopes()
    this.loading = false
  },

  data () {
    return {
      loading: false,
      searchedForUser: '',
      session: session,
      showUserForm: false,
      USER_STATUS,
      userStatusFilter: USER_STATUS.ENABLED,
      userIdToEdit: ''
    }
  },

  computed: {
    ...mapGetters(GROUPS, {
      groups: GET_GROUPS
    }),

    ...mapGetters(ROLES, {
      roles: GET_ROLES,
    }),

    ...mapGetters(SESSION, {
      currentUser: GET_CURRENT_USER,
      isSaas: GET_IS_SAAS,
      passwordMinLength: GET_PASSWORD_MIN_LENGTH,
      passwordMaxLength: GET_PASSWORD_MAX_LENGTH
    }),

    ...mapGetters(USERS, {
      users: GET_USERS
    }),

    currentUserRoleName () {
      return this.getRoleNameById(this.currentUser.role_id)
    },
    currentUserGroupNames () {
      const userGroups = _.get(this, 'currentUser.groups.shortlist', []) || []
      return userGroups.map(ug => ug.name).join(', ') || 'N/A'
    },
    displayedUsers () {
      const enabled = this.userStatusFilter === USER_STATUS.ENABLED
      let filteredUsers = this.users.filter(u => u.enabled === enabled)
      if (this.searchedForUser) {
        filteredUsers = this.users.map(user => {
          return {
            ...user,
            role_name: this.getRoleNameById(_.get(user, 'role_id', '')).toLowerCase()
          }
        })
        const searchValue = this.searchedForUser.toLowerCase().split(' ').join('|')
        const regExSearchValue = new RegExp(searchValue, 'i')

        filteredUsers = [
          ...filteredUsers.filter(user =>
            regExSearchValue.test(_.get(user, 'first_name', '').toLowerCase()) ||
            regExSearchValue.test(_.get(user, 'last_name', '').toLowerCase()) ||
            regExSearchValue.test(_.get(user, 'email', '').toLowerCase()) ||
            regExSearchValue.test(_.get(user, 'role_name', '').toLowerCase())
          )
        ]
      }
      return filteredUsers
    }
  },

  methods: {
    ...mapActions(GROUPS, {
      fetchGroups: FETCH_GROUPS
    }),
    ...mapActions(ROLES, {
      fetchRoles: FETCH_ROLES,
      fetchScopes: FETCH_SCOPES
    }),
    ...mapActions(USERS, {
      fetchUsers: FETCH_USERS,
      updateUser: UPDATE_USER,
      updateUserGroups: UPDATE_USER_GROUPS
    }),

    addNewUser (user) {
      this.userIdToEdit = ''
      this.showUserForm = true
    },

    hideUserForm () {
      this.userIdToEdit = ''
      this.showUserForm = false
    },

    async changeUserRole (user) {
      try {
        await this.updateUser({
          userId: user.id,
          updatedFields: {
            role_id: user.role_id
          }
        })
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${user.first_name} ${user.last_name} role updated.`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: err,
          showClose: true,
          type: 'error'
        })
      }
    },

    async changeUserGroups (user) {
      try {
        await this.updateUserGroups({ userId: user.id, newGroupIds: user.group_ids })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATIONN,
          message: 'Error changing user groups, please try again',
          showClose: true,
          type: 'error'
        })
      }
    },

    doDeleteUser (user) {
      this.$confirm(`Are you sure you want to delete ${user.name}?`, 'Warning', {
        cancelButtonText: 'Cancel',
        confirmButtonText: 'OK',
        type: 'warning'
      }).then(() => {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATIONN,
          message: `${user.name} disabled.`,
          showClose: true,
          type: 'info'
        })
      }).catch(() => {})
    },

    getRoleNameById (roleId) {
      const role = this.roles.find(role => role.id === roleId)
      return _.get(role, 'name', '')
    },

    editUser (userId) {
      this.userIdToEdit = userId
      this.showUserForm = true
    },

    async toggleUser (user) {
      try {
        await this.updateUser({ userId: user.id, updatedFields: { enabled: !user.enabled }})
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${user.first_name} ${user.last_name} ${ user.enabled ? 'enabled' : 'disabled' }`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: err,
          showClose: true,
          type: 'error'
        })
        throw err
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    h2 {
      font-size: 16px;
    }

    .header {
      margin-bottom: 25px;
      .options {
        .flex-box();
        margin-left: auto;

        .search-for-user-input-wrapper {
          margin-right: 30px;
          position: relative;

          .search-for-user__input {
            border: 1px solid @box-border-grey;
            border-radius: 0;
            color: @text-medium;
            font-size: 13px;
            height: 32px;
            position: relative;
            width: 316px;
          }

          i {
            color: @color-tone-darkest;
            position: absolute;
            right: 8px;
            top: 7px;

            &:hover {
              cursor: pointer;
            }
          }
        }

        button {
          padding-top: 5px;
        }
      }
    }

    .content-users {
      table.users-table {
        background-color: transparent;
        thead {
          th {
            background-color: transparent;
            border-bottom: 1px dotted @box-border-grey;
            color: @color-tone-darkest;
            font-family: @default-font-family-medium;
            font-size: 11px;
            letter-spacing: 0;
            padding: 0 10px 10px 0;
            text-align: left;
            text-transform: none;
            &:first-child {
              padding-left: 5px;
            }
            &.actions {
              width: 40px;
            }
          }
        }
        tr {
          &:nth-child(odd) td {
            background-color: @background-grey;
          }
          td {
            border-bottom: 1px dotted @box-border-grey;
            padding: 10px 10px 10px 0;
            width: 40%;
            
            .disclaimer {
              font-size: 12px;
              margin: 0;
              padding-left: 13px;
            }
            &:first-child {
              padding-left: 5px;
            }
            &.no-results {
              text-align: left;
              width: auto;
            }
            &.actions {
              width: 40px;
              i {
                font-size: 12px;
                color: @text-medium;
                cursor: pointer;
                margin: 0;
                &:first-child {
                  margin: 0 10px 0 4px;
                }
                &:hover {
                  color: @color-accent;
                }
              }
            }
            .admin-table-row-buttons {
              justify-content: flex-start;
              min-width: 40px;
            }
          }
        }
      }
    }
  }
}

</style>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';
.admin-page {
  .admin-user-groups {
    .el-input {
      .el-input__suffix {
        top: -2px;
      }
    }
  }
}
.content-users {
  table.users-table {
    .el-select .el-input .el-input__inner {
      min-width: 250px;
    }
  }
  .el-radio-group {
    > label {
      width: auto;
    }
    .el-radio-button__inner:hover {
      color: @color-accent;
    }
    .el-radio-button__orig-radio:checked+.el-radio-button__inner {
      background-color: @color-accent;
      border-color: @color-accent;
      box-shadow: -1px 0 0 0 @color-accent;
      &:hover {
        color: @color-base;
      }
    }
  }
}
</style>
