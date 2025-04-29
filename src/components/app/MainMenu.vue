<template>
  <section v-if="showMainMenu" class="main-menu">
    <el-tooltip
      content="Advanced Search and Saved Searches"
      placement="right"
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
    >
      <a @click="startNewSearch" :class="{ active: isSearchSection }">
        <i class="far fa-search"></i>
        <span>Find Content</span>
      </a>
    </el-tooltip>

    <nav>
      <a @click="startNewSearch" name="search-results" :class="{
        active: isNewSearchPage,
        'router-link-exact-active': isNewSearchPage
        }">
        <span>New Search</span>
      </a>

      <router-link :to="{ name: CONSTANTS.ROUTES.SAVED_SEARCHES.NAME }" name="search-saved">
        <span>Saved Searches</span>
      </router-link>
    </nav>

    <el-tooltip
      v-if="showPeopleFaces && $hasAnyScope(SCOPES.MODEL_TRAINING_PEOPLE, SCOPES.MODEL_TRAINING_LOGOS, SCOPES.AWS_CUSTOM_TAGS_ADMIN, SCOPES.AWS_CUSTOM_TAGS_TAG)"
      content="AI Studio Model Training"
      placement="right"
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
    >
      <router-link :to="{ name: 'model-training' }">
        <i class="far fa-tag"></i>
        <span>AI Studio</span>
      </router-link>
    </el-tooltip>

    <nav>
      <router-link v-if="$hasScope(SCOPES.MODEL_TRAINING_PEOPLE)" :to="{ name: 'model-training-people' }" name="model-training-logos">
        <span>
          <span>People &amp; Faces</span>
        </span>
      </router-link>
      <router-link v-if="showAWSCustomTags" :to="{ name: CONSTANTS.ROUTES.AI_STUDIO.CUSTOM_TAGS.NAME }" name="model-training-custom-tags">
        <span>
          <span>Custom Tags</span>
        </span>
      </router-link>
      <!-- temp remove AI Studio Logos -->
      <!-- <router-link v-if="!isSaasPlatform && $hasScope(SCOPES.MODEL_TRAINING_LOGOS)" :to="{ name: 'model-training-logos' }" name="model-training-logos">
        <span>
          <span>Logos &amp; Graphics</span>
        </span>
      </router-link> -->
    </nav>

    <el-tooltip
      content="Collections and Categories"
      placement="right"
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
    >
      <router-link :to="{ name: 'curated' }">
        <i class="far fa-list"></i>
        <span>Curated</span>
      </router-link>
    </el-tooltip>

    <nav>
      <router-link
        :to="{ name: 'categories' }"
        name="categories"
        @click.native.stop="checkCategoriesRoute"
      >
        <span>Categories</span>
      </router-link>

      <router-link
        :to="{ name: 'curated-collections' }"
        name="curated-collections"
        @click.native.stop="checkCollectionRoute"
      >
        <span>Collections</span>
      </router-link>
    </nav>

    <router-link v-if="$hasScope(SCOPES.EDIT_KEYWORDS)" :to="{ name: 'insights' }" name="insights">
      <i class="far fa-lightbulb"></i>
      <span>Insights</span>
    </router-link>

    <el-tooltip
      v-if="showPeopleFaces"
      content="Name People &amp; Faces" placement="right"
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
    >
      <router-link :to="{ name: 'people-faces' }">
        <i class="far fa-smile"></i>
        <span>People &amp; Faces</span>
      </router-link>
    </el-tooltip>

    <el-tooltip
      content="Manage Duplicates"
      placement="right"
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
    >
      <router-link :to="{ name: 'duplicates' }" name="duplicate-files">
        <i class="far fa-clone"></i>
        <span>Duplicate Files</span>
      </router-link>
    </el-tooltip>

    <!-- Hide trending -->
    <!-- <el-tooltip
      content="Find trending content"
      placement="right"
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
    >
      <router-link :to="{ name: 'social-trends' }">
        <i class="far fa-analytics"></i>
        <span>Social Trends</span>
      </router-link>
    </el-tooltip> -->

    <!-- Hide Pro-sumer and GM Storage -->
    <!-- <el-tooltip
      :content="contentBoxDropboxGMStorage"
      placement="right"
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
    >
      <a class="non-navigation-link">
        <i class="far fa-server"></i>
        <span>Cloud Storage</span>
      </a>
    </el-tooltip> -->

    <!-- <nav>
      <router-link
        v-if="hasOneDrive"
        :to="{ name: CONSTANTS.ROUTES.CONNECTED.ONEDRIVE.NAME }"
        :name="CONSTANTS.ROUTES.CONNECTED.ONEDRIVE.NAME"
      >
        <span>OneDrive</span>
      </router-link>
      <router-link
        v-if="hasSharePoint"
        :to="{ name: CONSTANTS.ROUTES.CONNECTED.SHAREPOINT.NAME }"
        :name="CONSTANTS.ROUTES.CONNECTED.SHAREPOINT.NAME"
      >
        <span>SharePoint</span>
      </router-link>
      <router-link
        v-if="hasBox"
        :to="{ name: CONSTANTS.ROUTES.CONNECTED.BOX.NAME }"
        :name="CONSTANTS.ROUTES.CONNECTED.BOX.NAME"
      >
        <span>Box.com</span>
      </router-link>

      <router-link
        v-if="hasDropbox"
        :to="{ name: CONSTANTS.ROUTES.CONNECTED.DROPBOX.NAME }"
        :name="CONSTANTS.ROUTES.CONNECTED.DROPBOX.NAME"
      >
        <span>Dropbox</span>
      </router-link>

      <router-link
        v-if="hasDropboxTeams"
        :to="{ name: CONSTANTS.ROUTES.CONNECTED.DROPBOXTEAMS.NAME }"
        :name="CONSTANTS.ROUTES.CONNECTED.DROPBOXTEAMS.NAME"
      >
        <span>Dropbox for Business</span>
      </router-link>

      <router-link
        v-if="isEnterpriseLoadstore && $hasScope(SCOPES.STORAGE_MANAGE, SCOPES.STORAGE_VIEW)"
        :to="{ name: CONSTANTS.ROUTES.CONNECTED.GM_STORAGE.NAME }"
        :name="CONSTANTS.ROUTES.CONNECTED.GM_STORAGE.NAME"
      >
        <span>GrayMeta Storage</span>
      </router-link>

      <upload-files :currentFolderPath="currentFolder.path"></upload-files>
    </nav> -->

    <div class="space-break">
      <el-tooltip
        content="Profile"
        placement="top"
        :open-delay="200"
        effect="light"
      >
        <router-link :to="{ name: 'admin-profile' }">
          <i class="far fa-user"></i>
        </router-link>
      </el-tooltip>

      <el-tooltip
        content="Settings"
        placement="top"
        :open-delay="200"
        effect="light"
      >
        <router-link :to="{ name: firstAdminLink }" :class="{ 'active': isAdminPath }">
          <i class="far fa-cog"></i>
        </router-link>
      </el-tooltip>

      <el-tooltip
        content="Logout"
        placement="top"
        :open-delay="200"
        effect="light"
      >
        <a @click="logout()">
          <i class="far fa-sign-out"></i>
        </a>
      </el-tooltip>
    </div>
  </section>
</template>

<script>
import _ from 'lodash'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import {
  GET_AWS_CUSTOM_TAGS_ENABLED,
  GET_FACES_ENABLED
  } from 'src/store/modules/session/session'
import { SCOPES } from 'src/plugins/ScopeEnforcer'
import { SEARCH_DEFAULT } from 'src/components/search/search-results-helper'
import { SESSION, LOADNSTORE, SEARCH, SEARCH_RESULTS } from 'src/store/storeModules'
import {
  SET_UPLOAD_FILES_OPTIONS,
  SHOW_UPLOAD_FILE_OPTIONS,
  TOGGLE_UPLOAD_FILES_OPTIONS
} from 'src/store/modules/loadnstore/loadnstore'
import {
  RESET_SEARCH_STATE
} from 'src/store/modules/search/mutations'

import LocationEnforcerMixin from 'src/components/global/LocationEnforcerMixin'
import UploadFiles from 'src/components/global/UploadFiles.vue'
import {RESET_STORE} from 'src/store/store-helpers'

export default {
  name: 'main-menu',

  components: {
    UploadFiles
  },

  mixins: [LocationEnforcerMixin],

  computed: {
    ...mapGetters(LOADNSTORE, {
      showUploadFilesOptions: SHOW_UPLOAD_FILE_OPTIONS
    }),

    ...mapGetters(SESSION, {
      awsCustomTagsEnabled: GET_AWS_CUSTOM_TAGS_ENABLED,
      showPeopleFaces: GET_FACES_ENABLED
    }),

    isAdminPath () {
      return this.$route.path.includes('admin') && !this.$route.path.includes('/profile')
    },
    // returns the first found admin route name that the user has access to
    firstAdminLink () {
      if (this.$hasAnyScope(SCOPES.ADMIN_USERS, SCOPES.ADMIN_ROLES, SCOPES.ADMIN_GROUPS)) {
        return 'admin-users-roles-groups'
      } else if (this.$hasScope(SCOPES.EDIT_KEYWORDS)) {
        return 'admin-platform-features'
      } else {
        return 'admin-developers'
      }
    },
    contentBoxDropboxGMStorage () {
      return this.hasBoxDropboxGMStorage ? this.CONSTANTS.CONNECTED_CLOUD_LOCATIONS : this.CONSTANTS.ADD_BOX_DROPBOX
    },
    showAWSCustomTags () {
      return this.$hasAnyScope(SCOPES.AWS_CUSTOM_TAGS_ADMIN, SCOPES.AWS_CUSTOM_TAGS_TAG) && this.awsCustomTagsEnabled
    },
    showMainMenu () {
      return !this.$route.path.includes('curio')
    },
    isSearchSection () {
      return this.$route.name === this.CONSTANTS.ROUTES.SEARCH.NAME || this.$route.name === this.CONSTANTS.ROUTES.SAVED_SEARCHES.NAME
    },
    isNewSearchPage () {
      return (this.$route.name === this.CONSTANTS.ROUTES.SEARCH.NAME) && (_.get(this.$route, 'query.key.length', 0) === 0)
    }
  },

  data () {
    // when click outside of upload-button container, close options
    // having second thoughts about this implementation, considering a different
    // approach, but this whole implemtnation is out of scope, but this works for now
    const onClickUploadButton = (e) => {
      if (e.target.id !== 'upload-button') {
        if (this.$store.getters[`${LOADNSTORE}/${SHOW_UPLOAD_FILE_OPTIONS}`]) {
          this.$store.commit(`${LOADNSTORE}/${SET_UPLOAD_FILES_OPTIONS}`, false)
        }
      }
    }

    const folders = _.cloneDeep(this.CONSTANTS.GM_STORAGE_FOLDER)

    return {
      SEARCH_DEFAULT,
      currentFolder: folders[0],
      folders,
      onClickUploadButton
    }
  },

  mounted () {
    window.addEventListener('click', this.onClickUploadButton)
  },

  destroyed () {
    window.removeEventListener('click', this.onClickUploadButton)
  },

  methods: {
    ...mapMutations(SEARCH, {
      resetSearchState: RESET_SEARCH_STATE
    }),
    ...mapMutations(SEARCH_RESULTS, {
      resetSearchResultsState: RESET_STORE
    }),
    checkCategoriesRoute (e) {
      // prevent click event if the user is already in the categories route
      if (_.get(this.$router.history.current.params, 'slug')) {
        e.preventDefault()
      }
    },

    checkCollectionRoute (e) {
      // prevent click event if the user is already in the collections route
      if (_.get(this.$router.history.current.params, 'id')) {
        e.preventDefault()
      }
    },

    logout () {
      document.cookie = 'gm_access_token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      document.cookie = 'return_to=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      window.location.href = '/logout'
    },

    startNewSearch () {
      this.resetSearchState()
      this.resetSearchResultsState()
      // this prevents a duplicate route navigation error if we're already on the page
      if (!this.isNewSearchPage) {
        this.$router.push({ name: this.CONSTANTS.ROUTES.SEARCH.NAME })
      }
    }
  }
}
</script>

<style lang="less" scoped>
  @import (reference) '~src/styles/_variables';
  @import (reference) '~src/styles/_mixins';

  .main-menu {
    .flex-container-column();
    .align-items-center();
    background-color: @background-dark;
    height: calc(~'100vh - 40px');
    padding: 15px 0 0;
    width: 180px;

    .non-navigation-link,
    a {
      .flex-container();
      color: @color-tone-darkest;
      font: 500 10px @default-font-family-medium;
      padding: 10px 18px;
      width: 100%;
      background-color: @background-dark;

      &:hover {
        color: @color-accent;
        cursor: pointer;
        text-decoration: none;
      }

      &.active {
        background: @background-darker;
        color: @color-accent;

        + nav {
          background: @background-darker;

          a {
            background: @background-darker;

            &.active {
              span {
                color: @color-base;
              }
            }
          }
        }
      }

      &.inactive {
        color: @color-tone-medium;
        cursor: not-allowed;
        pointer: none;
      }

      i,
      span {
        display: inline-block;
      }

      i {
        font-size: 13px;
        text-align: center;
        width: 15px;
      }

      span {
        font-size: 12px;
        margin-left: 8px;
        text-transform: uppercase;
      }
    }

    .non-navigation-link {
      &:hover {
        color: @color-tone-darkest;
        cursor: default;
      }
    }

    nav {
      padding-bottom: 15px;
      width: 100%;
      background-color: @background-dark;
      a {
        padding-left: 42px;
        padding-bottom: 5px;
        padding-top: 5px;

        span {
          font-size: 10px;
          margin-left: 0;
        }

        &.router-link-exact-active {
          color: @color-base;
        }
      }
    }

    .space-break {
      .flex-container();
      margin-top: auto;
      width: 100%;

      a {
        .flex-container-center();
        .size(33.33%, 60px);
        text-align: center;

        &:first-of-type {
          background-color: @main-menu-background1;
        }

        &:last-of-type {
          background-color: @main-menu-background3;
        }

        &:nth-of-type(2) {
          background-color: @main-menu-background2;
        }
      }
    }
  }
</style>
