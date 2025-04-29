<template>
  <div class="content content-users-roles-group">
    <section ref="top" class="header">
      <h2>Users, Roles, and Groups</h2>
    </section>

    <ul class="tab-selector-tabs">
      <li :class="{ active: $route.name === TABS.USERS }">
        <router-link :to="{ name: 'admin-users' }">Manage Users</router-link>
      </li>
      <li :class="{ active: $route.name === TABS.ROLES }">
        <router-link :to="{ name: 'admin-roles' }">Roles</router-link>
      </li>
      <li :class="{ active: $route.name === TABS.GROUPS }">
        <router-link :to="{ name: 'admin-groups' }">Groups</router-link>
      </li>
    </ul>

    <router-view name="admin-route-content"></router-view>

  </div>
</template>

<script>

const TABS = {
  USERS: 'admin-users',
  ROLES: 'admin-roles',
  GROUPS: 'admin-groups'
}

export default {
  name: 'admin-users-roles-groups',
  data () {
    return {
      activeTab: TABS.USERS,
      TABS
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.content-users-roles-group {
  .header {
    margin-top: 10px;
  }
  ul.tab-selector-tabs {
    background-color: @color-base;
    border-bottom: 1px solid @box-border-grey;
    list-style: none;
    margin: 0 0 20px 0;
    padding: 0;
    .flex-container();
    li {
      border-bottom: 2px solid transparent;
      padding: 10px 12px;
      > a {
        color: @text-medium;
        font-size: 11px;
        text-decoration: none;
      }
      &:hover {
        > a {
          color: @color-accent;
          text-decoration: none;
        }
      }
      &.active {
        border-bottom-color: @color-accent;
        > a {
          color: @color-accent;
        }
      }
    }
  }
}

.el-select-dropdown {
  &.el-popper {
    &.jump-to-dropdown {
      margin-left: 0;
      min-width: 140px !important;
      width: 140px;
    }
  }
}
</style>
