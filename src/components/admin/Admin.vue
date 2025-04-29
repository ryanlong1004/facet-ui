<template>
  <div class="admin admin-page dashboard-page">
    <div class="app-fluid-container page-content">
      <div class="app-fluid-container__section--left">
        <nav>
          <router-link :to="{ name: 'admin-profile' }" name="profile">
            <span>My Profile</span>
          </router-link>
          <router-link v-if="$hasAnyScope(SCOPES.ADMIN_USERS, SCOPES.ADMIN_ROLES, SCOPES.ADMIN_GROUPS)" :to="{ name: 'admin-users-roles-groups' }" name="user-roles-group">
            <span>Users &amp; Roles</span>
          </router-link>
          <router-link v-if="$hasAnyScope(SCOPES.BILLING_ADMIN) && isSaasPlatform" :to="{ name: redirectSaasUser }" name="account">
            <span>Account</span>
          </router-link>
          <router-link :to="{ name: 'admin-developers' }" name="developers">
            <span>Developers</span>
          </router-link>
          <router-link v-if="!isSaasPlatform && $hasScope(SCOPES.ADMIN_EXTRACTORS)" :to="{ name: 'extractor-profile', params: { id: 'default' } }" name="extractors">
            <span>Extractor Profiles</span>
          </router-link>
          <router-link v-if="!isSaasPlatform && $hasScope(SCOPES.ADMIN_ACTIVITY)" :to="{ name: 'admin-activity' }" name="activity">
            <span>Activity</span>
          </router-link>
          <router-link v-if="$hasScope(SCOPES.STORAGE_MANAGE, SCOPES.STORAGE_VIEW)" :to="{ name: 'admin-storage' }" name="storage">
            <span>Connect</span>
          </router-link>
          <router-link v-if="$hasScope(SCOPES.ADMIN_ANALYTICS)" :to="{ name: 'analytics' }" name="analytics">
            <span>Analytics</span>
          </router-link>
          <router-link v-if="$hasScope(SCOPES.ADMIN_FIELDS)" :to="{ name: 'admin-custom-data' }" name="admin-custom-data">
            <span>Custom Data</span>
          </router-link>
          <router-link v-if="$hasScope(SCOPES.ADMIN_BRANDING)" :to="{ name: 'admin-branding' }" name="admin-branding">
            <span>Branding</span>
          </router-link>
          <a href="https://exchange.adobe.com/apps/cc/103567/graymeta-curio" target="_blank">
            <span>Extensions</span>
          </a>
          <router-link :to="{ name: 'admin-support' }" name="support">
            <span>Support</span>
          </router-link>
        </nav>
      </div>
      <div class="app-fluid-container__section--middle">
        <router-view name="content"></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { mapActions } from 'vuex'
import { DASHBOARD } from 'src/store/storeModules'
import { FETCH_BILLING, GET_USER_BILLING } from 'src/store/modules/dashboard/dashboard'
import LocationEnforcerMixin from 'src/components/global/LocationEnforcerMixin'
import UploadFiles from 'src/components/global/UploadFiles.vue'

export default {
  name: 'admin',
  mixins: [LocationEnforcerMixin],
  computed: {
    hasBillingInfo () {
      return !!this.$store.getters[`${DASHBOARD}/${GET_USER_BILLING}`].default_payment_source
    },

    redirectSaasUser () {
      return this.hasBillingInfo ? 'admin-dashboard' : 'admin-payment'
    }
  },

  components: {
    UploadFiles
  },

  beforeMount () {
    this.$store.dispatch(`${DASHBOARD}/${FETCH_BILLING}`)
  },

  methods: {
    ...mapActions(DASHBOARD, [
      'FETCH_BILLING'
    ])
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .app-fluid-container {
    &.page-content {
      .app-fluid-container__section--left {
        .justify-content-start();
        .align-items-start();
        nav {
          a {
            font-size: 11px;
            letter-spacing: 0;
          }
        }
      }

      .app-fluid-container__section--middle {
        background-color: @color-base;
        height: 100vh;
        width: calc(~'100vw - 330px');

        > .content {
          height: calc(~'100vh - 40px');
          margin: 0;
          overflow-y: auto;
          padding: 10px 20px;

          &.content-analytics,
          &.content-extractors {
            padding-top: 20px;
          }
        }
      }

      .page-header {
        .app-fluid-container__section--middle {
          .flex-container-end();
          background-color: @background-grey;
          margin: 7px 28px;
          min-height: 28px;
        }
      }
    }
  }
}
</style>
