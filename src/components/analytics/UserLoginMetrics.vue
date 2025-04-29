<template>
  <div class="user-metrics">
    <div class="layout-row">
      <div class="layout-col">
        <h2>Users</h2>
      </div>
      <div class="layout-col-end">
        <el-select v-model="value" @change="fetchUserLogins(value)" placeholder="Select date range" size="large">
          <el-option
            v-for="item in this.options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </div>
    <div class="layout-row">
      <div class="layout-col center summary-label large">{{ this.totalUserLogins }}
        <p>Total Logins</p>
      </div>
      <div class="layout-col center summary-label large">{{ this.totalUniqueUserLogins }}
        <p v-if="this.totalUniqueUserLogins > 1">Users logged in</p>
        <p v-else>User logged in</p>
      </div>
      <div class="layout-col center">
        <div class="scrollable-box-header">
          <div class="layout-row small">
            <div class="layout-col small summary-label">User</div>
            <div class="layout-col small end summary-label">Logins</div>
          </div>
        </div>
        <div class="scrollable-box">
          <div class="layout-row small" v-for="user in this.userLoginCounts">
            <div class="layout-col small" v-if="user.first_name && user.last_name"><p>{{ user.first_name }} {{ user.last_name }}</p></div>
            <div class="layout-col small" v-else><p>{{ user.email }}</p></div>
            <div class="layout-col small end"><p>{{ user.count }}</p></div>
          </div>
        </div>
      </div>
    </div>
    <hr>
  </div>
</template>

<script>
import api from '../../api'
import moment from 'moment'

const WEEK = 'week'
const MONTH = 'month'
const YEAR = 'year'
const EXCLUDE_USER_EMAIL = 'admin@graymeta.com'

export default {

  name: 'user-login-metrics',

  beforeMount () {
    this.fetchUserLogins(MONTH)
  },

  data () {
    return {
      options: [
        {
          value: WEEK,
          label: 'This week'
        },
        {
          value: MONTH,
          label: 'This month'
        },
        {
          value: YEAR,
          label: 'This year'
        }
      ],
      value: MONTH,
      userLoginData: [],
      totalUserLogins: 0,
      totalUniqueUserLogins: 0,
      userLoginCounts: {}
    }
  },

  methods: {
    async fetchUserLogins (dateRangeName) {
      let from, to
      switch (dateRangeName) {
        case MONTH:
          from = moment().startOf(MONTH).toISOString()
          to = moment().endOf(MONTH).toISOString()
          break
        case YEAR:
          from = moment().startOf(YEAR).toISOString()
          to = moment().endOf(YEAR).toISOString()
          break
        default:
          from = moment().startOf(WEEK).toISOString()
          to = moment().endOf(WEEK).toISOString()
      }

      let allUsers = await api.getUsers(from, to)
      let users = this.excludeUsersWithEmail(EXCLUDE_USER_EMAIL, allUsers)

      let excludedUserId = allUsers.find(user => user.email === EXCLUDE_USER_EMAIL).id

      let allUserLogins = await api.getUserLogins(from, to)
      let userLogins = this.excludeLoginsWithExcludedUserId(excludedUserId, allUserLogins)

      this.totalUserLogins = userLogins.length
      this.totalUniqueUserLogins = new Set(userLogins.map(userLogin => userLogin.user_id)).size
      this.userLoginCounts = this.countUserLogins(users, userLogins)
    },

    mapUsersToLogins (users, userLogins) {
      return users.map(user => ({
        ...userLogins.find((userLogin) => (user.id === userLogin.user_id)),
        ...user
      })).filter(merged => merged.count)
    },

    countUserLogins (users, userLogins) {
      const map = new Map()
      userLogins.forEach(userLogin => {
        const entry = map.get(userLogin.user_id)
        if (!entry) {
          map.set(userLogin.user_id, {user_id: userLogin.user_id, count: 1})
        } else {
          ++entry.count
        }
      })
      const uniqueUserLogins = [...map.values()]
      let loginCounts = this.mapUsersToLogins(users, uniqueUserLogins)
      return loginCounts.sort(
        (l1, l2) => (l1.count < l2.count) ? 1 : (l1.count > l2.count) ? -1 : 0)
    },

    excludeUsersWithEmail (excludedEmail, users) {
      return users.filter(function (user) {
        return user.email !== excludedEmail
      })
    },

    excludeLoginsWithExcludedUserId (excludedId, userLogins) {
      return userLogins.filter(function (userLogin) {
        return userLogin.user_id !== excludedId
      })
    }
  }
}

</script>

<style lang="less">
@import (reference) '~src/styles/_variables.less';
@import (reference) '~src/styles/_mixins.less';

.user-metrics {
  .summary-label {
    font-size: 15px;
    font-weight: bolder;
    &.large {
      font-size: 50px;
      font-weight: lighter;
    }
  }
  p {
    line-height: 0!important;
  }
  .layout-row {
    &.small {
      line-height: 1.5em;
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      width: 100%;
    }
    .flex-container-between();
    .layout-col {
      .flex-container-column();
      width: 100%;

      &.center {
        align-items: center;
      }

      &.small {
        .flex-container-column();
        flex-direction: column;
        padding: 0;
        margin: 0;
        line-height: 1.5em;
        width: 50%;
        align-items: start;

        &.end {
          align-items: end;
        }
      }
    }
  }
}

.scrollable-box-header {
  height: 2em;
  line-height: 1em;
  margin: 20px 20px 10px 0;
  padding: 15px;
  width: 90%;
}

.scrollable-box {
  width: 90%;
  overflow: scroll;
  overflow-x: hidden;
  padding: 15px;
  margin-right: 20px;
  height: 150px;
}

</style>
