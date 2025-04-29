<template>
  <div v-if="!loadingInitData" class="account-add-user">
    <h2>Invite users to Curio, your plan comes with 5 user accounts</h2>
    <el-form
        :model="accountAddUser"
        inline-message
        label-position="top"
        label-width="100%"
        ref="accountAddUser"
        status-icon
        validate-on-rule-change
      >
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="!atMaxUsers">
            <tr
              :key="index"
              v-for="(user, index) in accountAddUser.users"
            >
              <td>
                <el-form-item
                  :class="{ 'empty-field': !user.email }"
                  :prop="`users.${index}.email`"
                  :rules="{
                    trigger: 'blur',
                    validator: validateEmail.bind(null, index)
                  }"
                >
                  <el-input
                    auto-complete="on"
                    placeholder="Add User (optional)"
                    type="email"
                    v-model="user.email"
                    @keyup.enter.native="isAddingNewUsers"
                  ></el-input>
                </el-form-item>
              </td>
              <td>
                <el-form-item
                  :class="{ 'empty-field': !user.role }"
                  :prop="`users.${index}.role`"
                  :rules="{
                    trigger: 'change',
                    validator: validateRole.bind(null, index)
                  }"
                  class="has-select"
                >
                  <el-select
                    :disabled="!user.email"
                    placeholder="Choose One..."
                    v-model="user.role"
                    @keyup.enter.native="isAddingNewUsers"
                  >
                    <el-option
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                      v-for="item in roleListing"
                    >
                    </el-option>
                  </el-select>
                </el-form-item>
              </td>
            </tr>
          </template>
          <template v-if="userListing.length > 0">
            <tr>
              <td colspan="2"><h3>Existing Users</h3></td>
            </tr>
            <tr
              v-for="user in userListing"
              :key="user.id"
              class="listing"
            >
              <td>
                {{ user.email }}
                <span v-if="user.id === currentUser.id">(Your account)</span>
              </td>
              <td>
                <el-select
                  v-if="user.id !== currentUser.id"
                  disabled
                  v-model="user.role_id"
                >
                  <el-option
                    :key="role.id"
                    :label="role.name"
                    :value="role.id"
                    v-for="role in roleListing"
                  >
                  </el-option>
                </el-select>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div class="form-footer">
        <b v-show="totalUsers < maxUsers" @click="addNewUser">
          <i class="far fa-plus"></i>
          Add Another User
        </b>
        <div>
          <message>Experience the full value of Curio when your team collaborates together.</message>
          <el-form-item>
            <el-button
              :disabled="!allUsersValid"
              @click="isAddingNewUsers"
              type="primary"
            >
              Continue
            </el-button>

            <router-link
              :to="{ name: 'curio-account-success' }"
              class="el-button el-button--text"
              name="curio-account-success"
            >
              <span>Skip</span>
            </router-link>
          </el-form-item>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script>
import q from 'q'
import Validator from 'async-validator'
import { mapMutations } from 'vuex'

import api from 'src/api'
import { CURIO, SESSION } from 'src/store/storeModules'
import { FAKE_PASSWORD } from 'src/components/admin/users.config'
import { sortByName, userSorter } from 'src/sort-helper'
import { getAPIErrorMsg } from 'src/apiHelpers'
import { CONSTANTS } from 'src/constants'
import { GET_CURRENT_USER } from 'src/store/modules/session/session'
import Message from 'src/components/global/Message'

const MAX_USERS = 5
const NUM_USERS = 1

const rules = {
  email: [
    {
      message: 'Please provide a valid email address.',
      trigger: 'blur',
      type: 'email'
    }
  ]
}

const validator = new Validator(rules)

export default {
  name: 'curio-account-team',

  components: {
    Message
  },

  data () {
    return {
      CONSTANTS: CONSTANTS,
      accountAddUser: {
        users: []
      },
      addingNewUsers: false,
      defaultUserGroupId: null,
      loadingInitData: true,
      maxUsers: MAX_USERS,
      roleListing: [],
      userListing: []
    }
  },

  beforeMount () {
    this.setProgress('team')

    this.loadingInitData = true
    q.all([api.getRoles(), api.getUsers(), api.getGroups()])
      .spread((roles, users, groups) => {
        this.roleListing = roles.roles.filter(role => role.id !== 'root').sort(sortByName)
        this.userListing = users.filter(user => user.enabled === true).sort(userSorter)
        const defaultGroup = _.find(groups, { locked: true })
        if (defaultGroup) {
          this.defaultUserGroupId = defaultGroup.id
        }
      })
      .catch(err => {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      })
      .then(() => {
        let roleCalls = []
        for (const role of this.roleListing) {
          roleCalls.push(api.getRole(role.id))
        }
        q.all(roleCalls)
          .then(responses => {
            _.each(responses, (roleDetail, i) => {
              this.roleListing[i] = _.assign(this.roleListing[i], roleDetail)
            })
          })
          .catch(err => {
            this.$message({
              duration: CONSTANTS.MESSAGE_DURATION,
              message: getAPIErrorMsg(err),
              showClose: true,
              type: 'error'
            })
          })
          .finally(() => {
            this.loadingInitData = false
            this.accountAddUser.users.push({
              email: '',
              hasValidEmail: true,
              hasValidRole: true,
              role: ''
            })
          })
      })
  },

  computed: {
    allUsersValid () {
      return this.accountAddUser.users.every(user => user.hasValidEmail && user.hasValidRole)
    },

    atMaxUsers () {
      return this.userListing.length >= MAX_USERS
    },

    currentUser () {
      return this.$store.getters[`${SESSION}/${GET_CURRENT_USER}`]
    },

    totalUsers () {
      return this.accountAddUser.users.length + this.userListing.length
    }
  },

  methods: {
    ...mapMutations(CURIO, [
      'setProgress'
    ]),

    addNewUser () {
      this.accountAddUser.users.push({
        email: '',
        hasValidEmail: true,
        hasValidRole: true,
        role: ''
      })
    },

    addUsers () {
      if (this.allUsersValid) {

        const addUsersAPICalls = this.accountAddUser.users.map(user => {
          const newUser = {
            admin: false,
            email: user.email,
            enabled: true,
            password: FAKE_PASSWORD,
            role_id: user.role
          }
          return api.addUser(newUser)
            .then(newUser => {
              this.userListing.unshift(newUser)
              // add user to our default group if we have one
              if (this.defaultUserGroupId) {
                api.modifyUserGroups(newUser.id, [{ type: 'add', id: this.defaultUserGroupId }])
              }
              return newUser.id
            })
        })

        Promise.all(addUsersAPICalls)
          .then(() => {
            this.addingNewUsers = false
            this.$router.push({ name: 'curio-account-success' })
          })
          .catch(err => {
            this.$message({
              duration: CONSTANTS.MESSAGE_DURATION,
              message: getAPIErrorMsg(err),
              showClose: true,
              type: 'error'
            })
          })
      }
    },

    isAddingNewUsers () {
      this.addingNewUsers ? this.addUsers() : this.$router.push({ name: 'curio-account-success' })
    },

    validateEmail (index, rule, value, callback) {
      const user = this.accountAddUser.users[index]

      if (!value) {
        user.hasValidEmail = true
        user.role = ''
        this.addingNewUsers = false
        return callback()
      }

      validator.validate({ email: value }, (errors, fields) => {
        this.addingNewUsers = true
        if (errors) {
          user.hasValidEmail = false
          callback(new Error('Please provide a valid email address.'))
        } else {
          user.hasValidEmail = true
          user.hasValidRole = !!user.role
          callback()
        }
      })
    },

    validateRole (index, rule, value, callback) {
      const user = this.accountAddUser.users[index]

      if (!value && user.email) {
        user.hasValidRole = false
        callback(new Error('Please select role.'))
      } else {
        user.hasValidRole = true
        callback()
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.curio {
  h3 {
    font-weight: 700;
  }
}

.account-add-user {
  .flex-box();
  .flex-direction(column);
  .justify-content-space-between();
}

.el-select {
  width: 278px;
}

.el-form-item {
  &::before {
    display: none;
  }

  .el-form-item__content {
    margin-top: -1px;
  }

  .el-input {
    margin-right: 7.3px;
    width: 712.6px;

    .el-input__inner {
      .input();
    }
  }
}

.form-footer,
table {
  width: 1003.8px;

  tr {
    &.listing {
      td {
        padding-bottom: 5px;
      }
    }
  }

  th {
    .base-font-uppercase();
    font-size: 10px;
    line-height: 1.8;
    padding-bottom: 0;
    text-align: left;

    i {
      color: @color-info;
      display: inline-block;
    }
  }

  td {
    vertical-align: top;

    .el-form-item {
      height: 58px;
    }
  }
}

.el-tooltip {
  border: 0 none;
  border-radius: 0;
  margin-left: 5px;
  padding: 0;
  text-align: left;

  &:hover {
    background-color: transparent;
  }
}

.form-footer {
  .flex-box();
  margin-top: 24px;

  b {
    .base-font-uppercase();
    cursor: pointer;
    font-size: 12px;

    i {
      color: @color-primary;
      font-size: 14px;
    }
  }

  > div {
    .align-items-center();
    .flex-box();
    margin-left: auto;

    p {
      margin-bottom: 0;
      margin-top: 0;
    }

    .el-form-item {
      height: auto;
      margin-left: 14px;

      &:last-of-type {
        height: auto;
      }
    }
  }
}
</style>
