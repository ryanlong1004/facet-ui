<template>
  <div class="extractor" :class="{ active: showForm }">
    <header>
      <h4 class="extractor-title" @click="titleClicked">{{ extractorDetails.display_name }}</h4>
      <p class="extractor-description" @click="titleClicked">{{ extractorDetails.description }}</p>
      <div class="extractor-toggles">
        <el-tooltip content="Configure" placement="top" v-if="isConfigured && hasConfiguration">
          <i class="fas fa-cog configure-btn" @click="toggleConfigForm"></i>
        </el-tooltip>
        <el-tooltip content="Enabled" placement="top">
          <i
            class="far fa-toggle-on toggle-btn"
            :class="{ inactive: !isActive, disabled: !isConfigured }"
             @click="toggleExtractor"
          ></i>
        </el-tooltip>
      </div>
    </header>
    <div class="alert-wrapper" v-if="showForm && !isConfigured">
      <el-alert type="error" title="You must first configure this exactor before turning it on"/>
    </div>
    <extractor-config-form v-if="showForm" :extractor-name="extractorName" @on-close="handleFormClosed"/>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'

import ExtractorConfigForm from './ExtractorConfigForm.vue'

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
  TOGGLE_EXTRACTOR_ACTIVE,
  INSTALL_EXTRACTOR_TO_PROFILE
} from 'src/store/modules/admin/extractors'

export default {
  name: 'extractor',
  components: {
    ExtractorConfigForm
  },
  props: {
    extractorName: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      showForm: false
    }
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      currentProfileId: GET_CURRENT_EXTRACTOR_PROFILE_ID,
      installedExtractors: GET_INSTALLED_EXTRACTORS,
      profileExtractorNames: PROFILE_EXTRACTOR_NAMES,
      profileConfigs: GET_PROFILE_CONFIGS
    }),
    extractorDetails () {
      return this.installedExtractors.find(e => e.extractor_name === this.extractorName)
    },
    extractorDisplayName () {
      return this.extractorDetails.display_name
    },
    currentConfig () {
      const c = this.profileConfigs[this.currentProfileId]
      if (c) {
        const config = c.find(e => e.extractor_name === this.extractorName)
        if (config) {
          return config
        }
      }
      return null
    },
    extractorId () {
      return _.get(this.currentConfig, 'id', '')
    },
    fields () {
      return _.get(this.extractorDetails, 'config.fields', []) || []
    },
    secretFields () {
      return _.get(this.extractorDetails, 'secret.fields', []) || []
    },
    hasConfiguration () {
      return this.fields.length > 0 || this.secretFields.length > 0
    },
    isActive () {
      return this.currentConfig ? this.currentConfig.active : false
    },
    isConfigured () {
      return this.currentConfig !== null
    }
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      doToggleExtractor: TOGGLE_EXTRACTOR_ACTIVE,
      doInstallExtractor: INSTALL_EXTRACTOR_TO_PROFILE
    }),
    handleFormClosed () {
      this.showForm = false
    },
    titleClicked () {
      if (!this.showForm) {
        this.showForm = true
      }
    },
    toggleConfigForm () {
      this.showForm = !this.showForm
    },
    async toggleExtractor () {
      if (!this.hasConfiguration) {
        if (!this.isConfigured) {
          await this.doInstallExtractor({
            profileId: this.currentProfileId,
            extractorName: this.extractorName
          })
        } else {
          await this.doToggleExtractor({ extractorId: this.extractorId, active: !this.isActive })
        }
      } else if (this.isConfigured) {
        await this.doToggleExtractor({ extractorId: this.extractorId, active: !this.isActive })
      } else {
        this.showForm = true
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.extractor {
  &.active {
    background-color: @background-grey;
    > header .extractor-title {
      color: @color-accent;
    }
  }
  > header {
    .flex-container();
    border-top: 1px solid @box-border-grey;
    justify-content: space-between;
    padding: 10px;
    .extractor-title {
      color: @text-dark;
      cursor: pointer;
      flex: 0 0 30%;
      font-family: @default-font-family-medium;
      font-size: 12px;
      margin: 0;
      padding: 0;
    }
    .extractor-description {
      color: @text-medium;
      flex: 1 1 auto;
      font-size: 11px;
      font-style: italic;
      margin: 0;
      padding: 0;
      text-align: left;
    }
    .extractor-toggles {
      align-items: center;
      display: flex;
      justify-content: flex-end;
      text-align: right;
      width: 60px;
      
      .configure-btn {
        color: @text-medium;
        cursor: pointer;
        font-size: 14px;
        margin-right: 6px;
        &:hover {
          color: @color-accent;
        }
      }
      .toggle-btn {
        color: @primary-button-color;
        cursor: pointer;
        font-size: 19px;
        &.inactive {
          color: @color-alert;
          transform: rotate(180deg);
        }
        &.disabled {
          color: @color-tone-darkest !important;
        }
      }
    }
  }
  .alert-wrapper {
    padding: 10px 20px 0 20px;
    .el-alert {
      margin-bottom: 0;
    }
  }
  .extractor-config-form {
    padding: 20px;
  }
}
</style>
