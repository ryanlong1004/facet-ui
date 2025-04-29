<template>
  <div class="secrets-form">
    <el-form>
      <el-form-item label="Configuration Name">
        <input
          v-model="formData.name.value"
          :disabled="saving"
          placeholder="Required"
        >
        <p class="field-error" v-if="formData.name.error">{{ formData.name.error }}</p>
      </el-form-item>
      <el-form-item v-for="field in secretFields" :key="field.key" :label="field.description">
        <input
          :type="field.type === 'secret_password' ? 'password' : 'text'"
          v-model="formData[field.key].value"
          :disabled="saving"
          placeholder="Required"
        >
        <p class="field-error" v-if="formData[field.key].error">{{ formData[field.key].error }}</p>
      </el-form-item>
      <div>
        <el-button @click="save" :disabled="saving" type="primary" size="mini">Save Configuration</el-button>
        <el-button @click="cancel" type="text" size="mini">or cancel</el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import _ from 'lodash'
import Vue from 'vue'
import { mapGetters, mapActions } from 'vuex'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  // getters
  GET_INSTALLED_EXTRACTORS,
  GET_EXTRACTOR_SECRETS,
  GET_EXTRACTOR_SECRET_VALUES,
  // actions
  CREATE_SECRET_VALUES,
  UPDATE_SECRET_VALUES
} from 'src/store/modules/admin/extractors'

export default {
  name: 'secrets-form',
  props: {
    secretId: {
      type: String,
      required: false
    },
    extractorName: {
      type: String,
      required: true
    }
  },
  beforeMount () {
    this.$watch('secretId', this._saturateFormData, { immediate: true })
  },
  data () {
    return {
      formData: {},
      saving: false
    }
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      allSecrets: GET_EXTRACTOR_SECRETS,
      installedExtractors: GET_INSTALLED_EXTRACTORS,
      secretValues: GET_EXTRACTOR_SECRET_VALUES
    }),
    initName () {
      const s = this.allSecrets.find(s => s.id === this.secretId)
      if (s) {
        return s.name
      }
    },
    initValues () {
      if (!this.secretId) {
        return []
      }
      return this.secretValues[this.secretId] || []
    },
    secretFields () {
      const e = this.installedExtractors.find(e => e.extractor_name === this.extractorName)
      return _.get(e, 'secret.fields', []) || []
    }
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      doCreateSecret: CREATE_SECRET_VALUES,
      doUpdateSecret: UPDATE_SECRET_VALUES
    }),
    cancel () {
      this.$emit('cancel-form')
    },
    async save () {
      const valid = this._validateForm()
      if (valid) {
        this.saving = true
        const vals = this._getFormValPairs()
        try {
          if (this.secretId) { // existing secret
            await this.doUpdateSecret({
              secretId: this.secretId,
              name: this.formData.name.value,
              vals
            })
          } else { // new secret
            await this.doCreateSecret({
              extractorName: this.extractorName,
              name: this.formData.name.value,
              vals
            })
          }
          this.cancel()
        } catch (err) {
          console.error(err)
        } finally {
          this.saving = false
        }
      }
    },
    _saturateFormData () {
      let formData = {
        name: {
          value: '',
          error: ''
        }
      }
      this.secretFields.forEach(f => {
        formData[f.key] = {
          value: '',
          error: ''
        }
      })
      if (this.initValues.length) {
        formData.name.value = this.initName
        this.initValues.forEach(v => {
          formData[v.key].value = v.value
        })
      }
      Vue.set(this, 'formData', formData)
    },
    _getFormValPairs () {
      let vals = []
      for (let key in this.formData) {
        if (key !== 'name') {
          const currentVal = this.formData[key].value
          let initVal = ''
          const initValObj = this.initValues.find(v => v.key === key)
          if (initValObj) {
            initVal = initValObj.value
          }
          if (!this.secretId || (initVal !== currentVal)) {
            vals.push({
              key,
              value: currentVal
            })
          }          
        }
      }
      return vals
    },
    _validateForm () {
      let valid = true
      for (let key in this.formData) {
        let isRequired = false
        const configField = this.secretFields.find(f => f.key === key)
        if (configField && configField.required) {
          isRequired = true
        }
        if (isRequired && this.formData[key].value === '') {
          this.formData[key].error = 'This field is required'
          valid = false
        } else {
          this.formData[key].error = ''
        }
      }
      return valid
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.secrets-form {
  background-color: @color-tone-light;
  border: 1px dashed @box-border-grey;
  padding: 20px;
  input {
    background-color: @color-base;
    border: 1px solid @box-border-grey;
    color: @color-primary;
    font-size: 12px;
    margin: 0;
    padding: 8px 10px;
    width: 100%;
  }
  p.field-error {
    color: @color-alert;
    font-size: 11px;
    font-style: italic;
    line-height: 11px;
    margin: 6px 0 0 0;
    padding: 0;
  }
}
</style>
