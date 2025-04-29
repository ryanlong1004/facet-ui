<template>
  <div class="extractor-profile" v-if="!loading">
    <profile-form v-if="showDetailsForm" :profile-id="profileDetails.id" @close="cancelEditDetails" />
    <header class="profile-details" v-else>
      <div>
        <h1>{{ profileName }} <i class="fas fa-pencil edit-details-icon" @click="startEditDetails"
            v-if="canEditProfileName"></i></h1>
        <p>{{ profileDetails.description || 'No description provided...' }}</p>
      </div>
      <el-popconfirm v-if="canEditProfileName" confirmButtonText="Yes" cancelButtonText="Cancel" icon="el-icon-info"
        iconColor="red" title="Are you sure you want to delete this profile?" @onConfirm="deleteProfile">
        <span slot="reference">
          <el-button class="delete-btn" size="mini">Delete Profile</el-button>
        </span>
      </el-popconfirm>

    </header>

    <ul class="extractor-settings-nav-tabs">
      <li :class="{ active: activeTab === TABS.MACHINE_LEARNING }" @click="setActiveTab(TABS.MACHINE_LEARNING)">Machine
        Learning Extractors</li>
      <li :class="{ active: activeTab === TABS.MEDIA_SETTINGS }" @click="setActiveTab(TABS.MEDIA_SETTINGS)">Media/File
        Settings</li>
    </ul>

    <section v-if="activeTab === TABS.MEDIA_SETTINGS" class="file-settings">
      <!-- video settings -->
      <section class="minified-settings">
        <h3><i class="fas fa-video"></i> Video Settings</h3>
        <video-previews-extractor />
        <boolean-extractor extractor-name="audioinfo" label="Extract audio information from video files" />
      </section>
      <!-- audio settings -->
      <section class="minified-settings">
        <h3><i class="fas fa-microphone-alt"></i> Audio Settings</h3>
        <boolean-extractor extractor-name="audio_previews"
          label="Generate a low-res .mp3 proxy for playback inside the Wasabi AiR™ UI" />
      </section>
      <!-- document settings -->
      <section class="minified-settings">
        <h3><i class="fas fa-file"></i> Rich-Document Settings</h3>
        <p>In addition to extracting text from documents (such as PDF and DocX), with this option turned on we will also
          extract
          images for vision-based ML services such as OCR, Scene Descriptions, Tags, etc.
        </p>
        <boolean-extractor extractor-name="document_pages" label="Process rich document files with embedded images" />
      </section>
      <!-- document settings -->
      <section class="minified-settings">
        <h3><i class="fas fa-clone"></i> OP-Atom Settings</h3>
        <p>
        </p>
        <boolean-extractor extractor-name="manifest" label="Extract and index OP-Atom metadata from harvest" />
      </section>
      <!-- archive settings -->
      <section class="minified-settings">
        <h3><i class="fas fa-file-archive"></i> Archive Settings</h3>
        <p>Note that files found inside an archive will behave as configured in this profile.
          For example, a video file inside an archive will inherit the same “Video Settings” described above.
        </p>
        <boolean-extractor extractor-name="archive" label="Process files inside of archive files (.zip, .rar, etc)" />
      </section>
      <!-- closed captioning -->
      <section class="minified-settings">
        <h3><i class="fas fa-closed-captioning"></i> Closed-caption settings</h3>
        <boolean-extractor extractor-name="captions" label="Extract embedded captions from video files" />
        <caption-files-extractor />
      </section>
      <!-- file types -->
      <section class="minified-settings">
        <h3><i class="far fa-font"></i> Text-based file types</h3>
        <p>Includes file formats that generally contain text-based content. We will extract the text tokens from these
          files and make their contents searchable.</p>
        <div class="file-types">
          <boolean-extractor v-for="type in FILE_TYPE_EXTRACTORS" :key="type.id" :extractor-name="type.id"
            :label="type.name" />
        </div>
      </section>
    </section>

    <section v-else> <!-- activeTab === TABS.MACHINE_LEARNING -->
      <video-main-frames-extractor />
      <section class="filters">
        <div>
          <h6>Filter Extractors by profile status:</h6>
          <el-radio-group v-model="statusFilterValue" size="mini">
            <el-radio-button @click.stop.prevent :label="STATUS_FILTERS.ALL"></el-radio-button>
            <el-radio-button @click.stop.prevent :label="STATUS_FILTERS.ENABLED"></el-radio-button>
            <el-radio-button @click.stop.prevent :label="STATUS_FILTERS.DISABLED"></el-radio-button>
          </el-radio-group>
        </div>
        <div>
          <h6>Filter by capability/category:</h6>
          <el-select @click.stop.prevent v-model="selectedCategoryFilter" size="mini" clearable placeholder="Select">
            <el-option v-for="category in categorizedExtractors" :key="category.id" :label="category.name"
              :value="category.id">
              <template><i :class="`${category.icon}`"></i> {{ category.name }}</template>
            </el-option>
          </el-select>
        </div>
      </section> <!-- .filters -->

      <section class="extractors-list">
        <extractor v-for="extractor in filteredExtractors" :key="extractor.extractor_name"
          :extractor-name="extractor.extractor_name" />
      </section>
    </section>

  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'

import ProfileForm from './ProfileForm.vue'
import BooleanExtractor from './BooleanExtractor.vue'
import Extractor from './Extractor.vue'
import CaptionFilesExtractor from './CaptionFilesExtractor.vue'
import VideoPreviewsExtractor from './VideoPreviewsExtractor.vue'
import VideoMainFramesExtractor from './VideoMainFramesExtractor.vue'

import {
  DEFAULT_EXTRACTOR_PROFILE_ID,
  EXTRACTOR_CATEGORIES,
  FILE_TYPE_EXTRACTORS,
  BOOLEAN_EXTRACTORS,
  IGNORED_EXTRACTORS,
  VIDEO_MAIN_FRAME_ACCURACY
} from './extractor-constants'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  // getters
  GET_EXTRACTOR_PROFILES,
  GET_INSTALLED_EXTRACTORS,
  GET_PROFILE_CONFIGS,
  GET_CURRENT_EXTRACTOR_PROFILE_ID,
  INSTALLED_EXTRACTOR_NAMES,
  PROFILE_EXTRACTOR_NAMES,
  // actions
  FETCH_EXTRACTOR_PROFILE,
  FETCH_EXTRACTOR_SECRETS,
  TOGGLE_EXTRACTOR_ACTIVE,
  INSTALL_EXTRACTOR_TO_PROFILE,
  DELETE_EXTRACTOR_PROFILE
} from 'src/store/modules/admin/extractors'

const STATUS_FILTERS = {
  ALL: 'All',
  ENABLED: 'Enabled',
  DISABLED: 'Disabled'
}

const TABS = {
  MACHINE_LEARNING: 'machine-learning',
  MEDIA_SETTINGS: 'media-settings'
}

export default {
  name: 'extractor-profile',
  components: {
    BooleanExtractor,
    Extractor,
    ProfileForm,
    CaptionFilesExtractor,
    VideoMainFramesExtractor,
    VideoPreviewsExtractor
  },
  async beforeMount() {
    await this.loadData()
    this.$watch('currentProfileId', async newVal => {
      await this.loadData()
    })
  },
  data() {
    return {
      activeTab: TABS.MACHINE_LEARNING,
      categoryAccordion: [],
      loading: false,
      FILE_TYPE_EXTRACTORS,
      STATUS_FILTERS,
      statusFilterValue: STATUS_FILTERS.ALL,
      selectedCategoryFilter: '',
      showDetailsForm: false,
      TABS,
      videoAccuracy: 0
    }
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      profiles: GET_EXTRACTOR_PROFILES,
      installedExtractors: GET_INSTALLED_EXTRACTORS,
      installedExtractorNames: INSTALLED_EXTRACTOR_NAMES,
      profileExtractorNames: PROFILE_EXTRACTOR_NAMES,
      profileConfigs: GET_PROFILE_CONFIGS,
      currentProfileId: GET_CURRENT_EXTRACTOR_PROFILE_ID
    }),
    profileDetails() {
      return this.profiles.find(p => p.id === this.currentProfileId)
    },
    profileName() {
      return this.profileDetails.name
    },
    installedExtractorsWithoutRequired() {
      return this.installedExtractors.filter(e => !e.required)
    },
    // current list of enabled extractors, minus any required extractors
    profileExtractors() {
      const all = this.profileConfigs[this.currentProfileId] || []
      return all.filter(e => !e.required)
    },
    enabledExtractors() {
      return this.profileExtractors.filter(e => e.active)
    },
    enabledExtractorIds() {
      return this.enabledExtractors.map(e => e.extractor_name)
    },
    // a list of extractors that should be ignored when rendering a list of options
    ignoredExtractors() {
      return FILE_TYPE_EXTRACTORS.concat(BOOLEAN_EXTRACTORS).concat(IGNORED_EXTRACTORS).map(e => e.id)
    },
    // array of currently installed/configured extractor names, minus required
    configuredExtractorIds() {
      return this.profileExtractors.map(e => e.extractor_name)
    },
    // generates a list of extractors to display based on the status/category filters
    filteredExtractors() {
      let initialExtractors = []
      if (this.statusFilterValue === STATUS_FILTERS.ENABLED) {
        initialExtractors = initialExtractors.concat(this.enabledExtractors)
      } else if (this.statusFilterValue === STATUS_FILTERS.DISABLED) {
        initialExtractors = initialExtractors.concat(this.installedExtractorsWithoutRequired)
        initialExtractors = initialExtractors.filter(e => {
          let enabled = false
          if (this.enabledExtractorIds.indexOf(e.extractor_name) >= 0) {
            enabled = true
          }
          return !enabled
        })
      } else {
        initialExtractors = initialExtractors.concat(this.installedExtractorsWithoutRequired)
      }
      // drop ignored extractors
      let filteredExtractors = initialExtractors.filter(e => {
        let ignored = false
        if (this.ignoredExtractors.indexOf(e.extractor_name) >= 0) {
          ignored = true
        }
        return !ignored
      })

      if (this.selectedCategoryFilter) {
        filteredExtractors = filteredExtractors.filter(e => {
          const installed = this.installedExtractors.find(i => i.extractor_name === e.extractor_name)
          if (installed) {
            const cats = _.get(installed, 'categories', []) || []
            return cats.indexOf(this.selectedCategoryFilter) >= 0
          }
          return false
        })
      }
      return _.sortBy(filteredExtractors, ['display_name'])
    },
    categorizedExtractors() {
      let cats = []
      EXTRACTOR_CATEGORIES.forEach(cat => {
        let extractors = []
        this.installedExtractors.forEach(e => {
          if (e.categories.indexOf(cat.id) >= 0) {
            extractors.push({
              extractor_name: e.extractor_name,
              display_name: e.display_name
            })
          }
        })
        cats.push(_.assign({}, cat, { extractors }))
      })
      return cats
    },
    canEditProfileName() {
      return this.currentProfileId !== DEFAULT_EXTRACTOR_PROFILE_ID
    }
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      fetchExtractorProfile: FETCH_EXTRACTOR_PROFILE,
      fetchExtractorSecrets: FETCH_EXTRACTOR_SECRETS,
      doToggleExtractor: TOGGLE_EXTRACTOR_ACTIVE,
      doInstallExtractor: INSTALL_EXTRACTOR_TO_PROFILE,
      doDeleteExtractorProfile: DELETE_EXTRACTOR_PROFILE
    }),
    async loadData() {
      this.loading = true
      try {
        await this.fetchExtractorSecrets()
        await this.fetchExtractorProfile(this.currentProfileId)
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    cancelEditDetails() {
      this.showDetailsForm = false
    },
    async deleteProfile() {
      try {
        await this.doDeleteExtractorProfile(this.currentProfileId)
        this.$router.push({ name: 'extractor-profile', params: { id: 'default' } })
      } catch (err) {
        let message = _.get(err, 'body.error.message', '')
        if (message === 'profile in use') {
          message = 'This profile is currently in use and cannot be deleted'
        } else {
          message = 'Error deleting extractor profile, please try again'
        }
        this.$notify({
          type: 'error',
          title: 'Error',
          message
        })
      }
    },
    setActiveTab(which) {
      this.activeTab = which
    },
    startEditDetails() {
      this.showDetailsForm = true
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.extractor-profile {
  .profile-details {
    .flex-container();
    justify-content: space-between;
    margin-bottom: 25px;
    width: 100%;

    h1 {
      color: @text-dark;
      font-family: @default-font-family-medium;
      font-size: 16px;
      margin: 0 0 8px 0;
      padding: 0;

      .edit-details-icon {
        cursor: pointer;
        font-size: 12px;

        &:hover {
          color: @color-accent;
        }
      }
    }

    p {
      color: @text-medium;
      font-size: 12px;
      margin: 0;
      padding: 0;
    }

    .delete-btn {
      color: @text-light;
      font-size: 11px;
      letter-spacing: 0;

      &:hover {
        background-color: transparent;
        border-color: @color-alert;
        color: @color-alert;
      }
    }
  }

  .profile-form {
    margin-bottom: 25px;
  }

  .file-settings {
    margin-top: 20px;
  }

  .el-checkbox__label {
    color: @text-light;
    font-family: @default-font-family-medium;
    font-size: 11px;
  }

  &.is-checked .el-checkbox__label {
    color: @text-medium;
  }

  .minified-settings {
    margin-bottom: 20px;

    >h3 {
      border-bottom: 1px solid @box-border-grey;
      color: @text-dark;
      font-family: @default-font-family-medium;
      font-size: 12px;
      margin: 0 0 10px 0;
      padding: 0 0 10px 0;
      text-transform: uppercase;

      i {
        color: @text-dark;
        margin-right: 5px;
      }
    }

    >p {
      color: @color-tone-darkest;
      font-size: 11px;
      margin: 0 0 10px 0;
      padding: 0 0 0 20px;
    }

    .el-checkbox {
      margin-left: 20px;
    }

    .file-types {
      .flex-container();
      flex-wrap: wrap;
      margin-left: 20px;

      .el-checkbox {
        flex: 0 0 25%;
        margin-left: 0;
      }
    }
  }

  section.filters {
    .flex-container();
    justify-content: space-between;
    margin-bottom: 15px;
    padding: 15px 0;

    h6 {
      color: @text-medium;
      font-family: @default-font-family-medium;
      font-size: 11px;
      margin: 0 0 6px 0;
      padding: 0;
      text-transform: uppercase;
    }

    .el-radio-group {
      >label {
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

    .el-select {
      width: 250px;
    }
  }
}
</style>
