<template>
  <div class="extractor-config-form">
    <el-form
      ref="extractor-config-form"
      :model="formData">
      <el-form-item v-if="hasSecret" class="secret-selector" prop="secret_id">
        <div>
          <label for="secret_id">Choose a service config {{isSecretRequired ? '(Required)' : '(Optional)' }}</label>
          <el-select v-model="formData.secretId.value">
            <el-option v-for="secret in extractorSecrets" :key="secret.id" :label="secret.name" :value="secret.id"></el-option>
          </el-select>
        </div>        
        <p class="link-to-config">
          <span v-if="!extractorSecrets.length && isSecretRequired">You will need to setup a service config for this extractor.</span>
          <span v-else>Need to create a new service config for this extractor?</span>
          <br>
          <router-link :to="secretConfigLink">Click here to create one</router-link>
        </p>
      </el-form-item>

      <div v-for="fieldGroup in fieldsNested" :key="fieldGroup.id">
        
        <div :class="{ 'field-group': fieldGroup.type === 'group' }" v-if="fieldGroup.type === 'group'">

          <h2 v-if="fieldGroup.type === 'group'" class="field-group-title">{{ fieldGroup.label }}</h2>

          <template v-for="field in fieldGroup.children">
            <extractor-config-form-input
              v-if="field.display"
              :key="field.key"
              :input-type="field.type"
              :input-key="field.key"
              :input-label="field.description"
              :input-value="formData[field.key].value"
              :required="field.required === true"
              :extractor-name="extractorName"
              :select-options="field.options"
              @value-changed="handleInputValueChanged" />
          </template>
        </div> <!-- group? -->

        <div v-else>
          <template v-for="field in fieldGroup.children">
            <extractor-config-form-input
              v-if="field.display"
              :key="field.key"
              :input-type="field.type"
              :input-key="field.key"
              :input-label="field.description"
              :input-value="formData[field.key].value"
              :required="field.required === true"
              :extractor-name="extractorName"
              :select-options="field.options"
              @value-changed="handleInputValueChanged" />
          </template>
        </div>

      </div> <!-- v-for field in fields -->

      <div class="btn-row">
        <el-button type="primary" size="mini" @click="saveConfig" :disabled="isSubmitDisabled">Save configuration</el-button>
        <el-button type="text" size="mini" @click="cancelConfig">or cancel</el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'
import shortid from 'shortid'

import { FIELD_TYPES } from './extractor-constants'
import ExtractorConfigFormInput from './ExtractorConfigFormInput.vue'


import { EXTRACTORS } from 'src/store/storeModules'
import {
  // getters
  GET_EXTRACTOR_PROFILES,
  GET_INSTALLED_EXTRACTORS,
  GET_PROFILE_CONFIGS,
  GET_EXTRACTOR_SECRETS,
  GET_CURRENT_EXTRACTOR_PROFILE_ID,
  GET_PROVIDERS_WITH_SECRETS,
  // actions
  FETCH_EXTRACTOR_PROFILE,
  INSTALL_EXTRACTOR_TO_PROFILE,
  UPDATE_EXTRACTOR_CONFIG
} from 'src/store/modules/admin/extractors'

export default {
  name: 'extractor-config-form',
  components: {
    ExtractorConfigFormInput
  },
  props: {
    extractorName: {
      type: String,
      required: true
    }
  },
  beforeMount () {
    this._saturateFormData()
    this.$watch('profileConfigs', newVal => {
      this._saturateFormData()
    })
    this.$watch('secrets', newVal => {
      this._saturateFormData()
    })
    this.$watch('isConfigured', newVal => {
      this._saturateFormData()
    })
  },
  data () {
    return {
      formData: {},
      saving: false
    }
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      currentProfileId: GET_CURRENT_EXTRACTOR_PROFILE_ID,
      installedExtractors: GET_INSTALLED_EXTRACTORS,
      profileConfigs: GET_PROFILE_CONFIGS,
      secrets: GET_EXTRACTOR_SECRETS,
      providersWithSecrets: GET_PROVIDERS_WITH_SECRETS
    }),
    extractor () {
      return this.installedExtractors.find(e => e.extractor_name === this.extractorName)
    },
    extractorSecrets () {
      return this.secrets.filter(e => e.extractor_name === this.extractorName)
    },
    fields () {
      return _.get(this.extractor, 'config.fields', []) || []
    },
    fieldsNested () {
      let fields = []
      let lastGroupName = ''
      let lastGroup = null
      this.fields.forEach(f => {
        let display = false
        if (f.parents && f.parents.length > 0) {
          for (let key of f.parents) {
            if (!_.isUndefined(this.formData[key])) {
              if (this.formData[key].value) {
                display = true
              }
            }
          }
        } else {
          display = true
        }
        f.display = display
        const fieldGroupName = _.get(f, 'group', '') || ''
        if (fieldGroupName.length > 0 && fieldGroupName !== lastGroupName) {
          lastGroup = { type: 'group', label: fieldGroupName, children: [f], id: shortid.generate() }
          lastGroupName = fieldGroupName
          fields.push(lastGroup)
        } else if (fieldGroupName.length > 0) {
          lastGroup.children.push(f)
        } else {
          fields.push({ children: [f], id: shortid.generate() })
          lastGroup = null
          lastGroupName = ''
        }
      })
      return fields
    },
    secretFields () {
      return _.get(this.extractor, 'secret.fields', []) || []
    },
    hasSecret () {
      return _.get(this.extractor, 'has_secret', false)
    },
    isSecretRequired () {
      let required = false
      this.secretFields.forEach(f => {
        if (f.required) {
          required = true
        }
      })
      return required
    },
    isSubmitDisabled () {
      if (this.isSecretRequired && this.formData.secretId.value.length === 0) {
        return true
      }
      return false
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
      return _.get(this.currentConfig, 'id', '') || ''
    },
    isActive () {
      return this.currentConfig ? this.currentConfig.active : false
    },
    isConfigured () {
      return this.currentConfig !== null
    },
    initValues () {
      if (this.isConfigured) {
        return _.get(this.currentConfig, 'config.values', []) || []
      }
      return []
    },
    secretConfigLink () {
      const p = this.providersWithSecrets.find(p => p.name === this.extractor.provider_name)
      if (p) {
        return {
          name: 'extractor-secrets',
          params: { provider: p.id }
        }
      }
      return { name: 'extractor-secrets' }
    }
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      doInstallExtractor: INSTALL_EXTRACTOR_TO_PROFILE,
      doUpdateExtractorConfig: UPDATE_EXTRACTOR_CONFIG
    }),
    cancelConfig () {
      this.$emit('on-close')
    },
    handleInputValueChanged (keyVal) {
      this.formData[keyVal.key].value = keyVal.val
    },
    async saveConfig () {
      let configFields = []
      this.fields.forEach(f => {
        let fieldVal = this.formData[f.key].value
        if (f.type === FIELD_TYPES.STRING || f.type === FIELD_TYPES.NUMBER || f.type === FIELD_TYPES.BOOLEAN) {
          fieldVal = _.toString(fieldVal)
        }
        configFields.push({
          key: f.key,
          value: fieldVal
        })
      })
      if (!this.isConfigured) {
        try {
          await this.doInstallExtractor({
            profileId: this.currentProfileId,
            extractorName: this.extractorName,
            configFields,
            secretId: this.formData.secretId.value
          })
          this.$emit('on-close', { saved: true })
        } catch (err) {
          this.showError()
        }        
      } else {
        try {
          await this.doUpdateExtractorConfig({
            profileId: this.currentProfileId,
            extractorId: this.extractorId,
            configFields,
            secretId: this.formData.secretId.value
          })
          this.$emit('on-close', { saved: true })
        } catch (err) {
          this.showError()
        }
      }
    },
    showError (err = 'Error configuring extractor, please try again') {
      this.$notify({
        type: 'error',
        title: 'Error',
        message: err
      })
    },
    _saturateFormData () {
      let formData = {
        secretId: {
          value: '',
          error: ''
        }
      }
      this.fields.forEach(f => {
        let initVal = ''
        const type = f.type
        const defaultVal = f.default
        if (type === FIELD_TYPES.MULTIPLE) {
          initVal = []
        } else if (type === FIELD_TYPES.NUMBER) {
          initVal = defaultVal ? parseFloat(defaultVal) : null
        } else if (type === FIELD_TYPES.BOOLEAN) {
          initVal = defaultVal === 'true'
        } else {
          initVal = defaultVal ? defaultVal : ''
        }
        formData[f.key] = {
          value: initVal,
          error: ''
        }
      })
      if (this.initValues.length) {
        this.initValues.forEach(v => {
          let val = v.value
          if (v.type === FIELD_TYPES.NUMBER) {
            val = parseFloat(val)
          } else if (v.type === FIELD_TYPES.BOOLEAN) {
            val = val === 'true'
          }
          formData[v.key].value = val
        })
      }
      if (this.currentConfig) {
        formData.secretId.value = this.currentConfig.secret_id
      }
      Vue.set(this, 'formData', formData)
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.extractor-config-form {
  .el-form {
    display: flex;
    flex-direction: column;
  }
  .el-form-item {
    height: auto;
    margin-bottom: 15px;
    width: 100%;
    .el-form-item__content {
      line-height: normal;
    }
    &.short {
      margin-bottom: 5px;
    }
    &.secret-selector .el-form-item__content {
      .flex-container();
      justify-content: flex-start;
      > div {
        display: flex;
        flex-direction: column;
        width: 50%;
        .el-select {
          width: 100%;
        }
      }
      > p {
        color: @text-medium;
        font-size: 11px;
        margin: 15px 0 0 10px;
        > a {
          color: @color-accent;
        }
      }
      
    }
  }
  .el-select {
    width: 50%;
    .el-input__suffix {
      top: 6px !important;
    }
  }
  .el-checkbox {
    .el-checkbox__label {
      color: @text-medium;
      font-family: @default-font-family-medium;
      font-size: 11px;
    }
    &.is-checked .el-checkbox__label {
      color: @text-dark;
    }
  }
  .video-accuracy-slider {
    margin-bottom: 10px;
    margin-left: 0;
  }
  .field-group {
    background-color: @color-base;
    border: 1px dashed @box-border-grey;
    margin-bottom: 20px;
    padding: 10px 10px 5px 10px;
    .field-group-title {
      font-size: 13px;
      margin: 0 0 15px 0;
    }
  }
}
</style>
