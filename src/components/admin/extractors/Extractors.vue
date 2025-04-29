<template>
  <div class="extractor-profiles" v-loading="loading">
    <header>
      <h1>Extractor Profiles</h1>
    </header>

    <div class="content-wrapper" v-if="!loading">
      <nav class="side-nav">
        <ul class="extractor-settings-nav-tabs">
          <li :class="{ active: activeTab === TABS.CONFIG }"><router-link :to="{ name: 'extractor-secrets' }">Service Config</router-link></li>
          <li :class="{ active: activeTab === TABS.PROFILES }"><router-link :to="{ name: 'extractor-profile', params: { id: 'default' } }">Profiles</router-link></li>
        </ul>
        <secrets-nav v-if="activeTab === TABS.CONFIG"/>
        <profiles-nav v-else/>
      </nav>
      <div class="contents">
        <router-view name="extractorProfileContents"></router-view>
      </div>
    </div> <!-- content wrapper -->

  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'

import SecretsNav from './SecretsNav.vue'
import ProfilesNav from './ProfilesNav.vue'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  // getters
  GET_EXTRACTOR_PROFILES,
  GET_INSTALLED_EXTRACTORS,
  GET_EXTRACTORS_WITH_SECRETS,
  GET_PROVIDERS_WITH_SECRETS,
  GET_NUM_SECRETS_BY_EXTRACTOR,
  GET_EXTRACTOR_SECRETS,
  // actions
  FETCH_EXTRACTOR_PROFILES,
  FETCH_EXTRACTOR_PROFILE,
  FETCH_INSTALLED_EXTRACTORS,
  SELECT_PROFILE,
  FETCH_EXTRACTOR_SECRETS
} from 'src/store/modules/admin/extractors'

const TABS = {
  CONFIG: 'service-config',
  PROFILES: 'profiles'
}

export default {
  name: 'extractors',
  components: {
    SecretsNav,
    ProfilesNav
  },
  async beforeMount () {
    this.loading = true
    await this.fetchInstalledExtractors()
    await this.fetchProfiles()
    await this.fetchExtractorSecrets()
    this.loading = false
  },
  mounted () {
    this.$watch('$route.name', newVal => {
      this.setActiveTab()
    }, { immediate: true })
  },
  data () {
    return {
      activeTab: '',
      loading: false,
      TABS
    }
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      installedExtractors: GET_INSTALLED_EXTRACTORS,
      providersWithSecrets: GET_PROVIDERS_WITH_SECRETS,
      secretExtractors: GET_EXTRACTORS_WITH_SECRETS,
      secrets: GET_EXTRACTOR_SECRETS,
      profiles: GET_EXTRACTOR_PROFILES,
      numSecretsByExtractor: GET_NUM_SECRETS_BY_EXTRACTOR
    })
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      fetchInstalledExtractors: FETCH_INSTALLED_EXTRACTORS,
      fetchProfiles: FETCH_EXTRACTOR_PROFILES,
      fetchProfile: FETCH_EXTRACTOR_PROFILE,
      fetchExtractorSecrets: FETCH_EXTRACTOR_SECRETS
    }),
    setActiveTab () {
      const routeName = this.$route.name
      if (routeName === 'extractor-secrets') {
        this.activeTab = TABS.CONFIG
      } else {
        this.activeTab = TABS.PROFILES
      }
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.extractor-profiles {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);

  > header {
    background-color: @color-base;
    border-bottom: 1px solid @box-border-grey;
    h1 {
      color: @color-primary;
      font-size: 18px;
      margin: 0;
      padding: 15px;
    }
  }

  .content-wrapper {
    display: flex;
    flex-direction: row;
    .side-nav {
      background-color: @background-grey;
      flex: 0 0 200px;
      height: calc(100vh - 80px);
      overflow-y: auto;
      ul.nav-links {
        list-style: none;
        margin: 0;
        padding: 10px 0;
        li {
          font-size: 11px;
          text-transform: uppercase;
          a {
            color: @color-primary;
            display: block;
            padding: 10px;
            text-decoration: none;
          }
          &.active {
            background-color: @color-base;
            a {
              color: @color-accent;
            }
          }
          &:hover a {
            color: @color-accent;
            text-decoration: none;
          }
        }
      }
    }
    .contents {
      background-color: white;
      border-left: 1px solid @box-border-grey;
      flex: 1 1 auto;
      height: calc(100vh - 80px);
      overflow-y: auto;
      padding: 20px;
    }
  }

  ul.extractor-settings-nav-tabs {
    background-color: @color-base;
    border-bottom: 1px solid @box-border-grey;
    list-style: none;
    margin: 0;
    padding: 0;
    .flex-container();
    li {
      border-bottom: 2px solid transparent;
      color: @text-medium;
      cursor: pointer;
      font-size: 11px;
      padding: 10px 12px;
      &:hover {
        color: @color-accent;
      }
      > a {
        color: @text-medium;
        &:hover {
          color: @color-accent;
          text-decoration: none;
        }
      }
      &.active {
        border-bottom-color: @color-accent;
        color: @color-accent;
        > a {
          color: @color-accent;
        }
      }
    }
  }
}
</style>
