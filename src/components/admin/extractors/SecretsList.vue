<template>
  <div class="extractor-secrets-list">
    <header>
      <h3>{{ extractorDetails.name }}</h3>
      <p>{{ extractorDetails.description }}</p>
    </header>
    
    <div class="contents-wrapper">
      <table class="secrets-list" v-if="tableData.data.length">
        <thead>
          <tr>
            <th>Name</th>
            <th v-for="field in tableData.fieldNames" :key="field">{{ field }}</th>
            <th>Operations</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableData.data" :key="row.id">
            <td>{{ row.name }}</td>
            <td v-for="field in tableData.fieldNames" :key="field">{{ row[field] }}</td>
            <td class="operations">
              <span @click="editSecret(row.id)"><el-tooltip content="Edit" placement="top"><i class="fas fa-pencil"></i></el-tooltip></span>
              <el-popconfirm
                popper-class="confirm-delete-profile-popconfirm"
                confirmButtonText="Yes"
                cancelButtonText="Cancel"
                icon="el-icon-info"
                iconColor="red"
                title="Are you sure you want to delete this config?"
                @onConfirm="deleteSecret(row.id)">
                <span slot="reference">
                  <el-tooltip content="Delete" placement="top"><i class="fas fa-trash"></i></el-tooltip>
                </span>
              </el-popconfirm>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!showForm">
        <p v-if="tableData.data.length === 0" class="no-content">No secrets found for this extractor</p>
        <el-button type="" class="add-secret-btn" size="mini" @click="addNewSecret"><i class="far fa-plus"></i> Add Secret</el-button>
      </div>

      <secrets-form v-if="showForm" :secret-id="editSecretId" :extractor-name="extractorName" @cancel-form="cancelForm"/>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'

import SecretsForm from './SecretsForm.vue'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  // getters
  GET_INSTALLED_EXTRACTORS,
  GET_NUM_SECRETS_BY_EXTRACTOR,
  GET_EXTRACTOR_SECRETS,
  GET_EXTRACTOR_SECRET_VALUES,
  // actions
  FETCH_EXTRACTOR_PROFILES,
  FETCH_EXTRACTOR_PROFILE,
  FETCH_INSTALLED_EXTRACTORS,
  SELECT_PROFILE,
  FETCH_EXTRACTOR_SECRETS,
  FETCH_SECRET_VALUES_BY_EXTRACTOR,
  DELETE_SECRET_VALUES
} from 'src/store/modules/admin/extractors'

export default {
  name: 'secrets-list',
  components: {
    SecretsForm
  },
  props: {
    extractorName: {
      type: String,
      required: true
    }
  },
  async beforeMount () {
    await this.fetchExtractorSecretValues(this.extractorName)
  },
  data () {
    return {
      editSecretId: '',
      showForm: false
    }
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      installedExtractors: GET_INSTALLED_EXTRACTORS,
      numSecretsByExtractor: GET_NUM_SECRETS_BY_EXTRACTOR,
      allSecrets: GET_EXTRACTOR_SECRETS,
      secretValues: GET_EXTRACTOR_SECRET_VALUES
    }),
    numSecrets () {
      return this.numSecretsByExtractor[this.extractorName]
    },
    secrets () {
      return this.allSecrets.filter(s => s.extractor_name === this.extractorName)
    },
    extractorConfig () {
      return this.installedExtractors.find(e => e.extractor_name === this.extractorName)
    },
    extractorDetails () {
      return {
        name: _.get(this.extractorConfig, 'display_name'),
        description: _.get(this.extractorConfig, 'description')
      }
    },
    extractorSecretsConfig () {
      return _.get(this.extractorConfig, 'secret.fields', []) || []
    },
    tableData () {
      let fieldNames = []
      const data = this.secrets.map(s => {
        let d = {
          id: s.id,
          name: s.name
        }
        const vals = this.secretValues[s.id] || []
        vals.forEach(v => {
          const config = this.extractorSecretsConfig.find(c => c.key === v.key)
          d[config.description] = v.value
          if (fieldNames.indexOf(config.description) < 0) {
            fieldNames.push(config.description)
          }
        })
        return d
      })
      return {
        data,
        fieldNames
      }
    }
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      fetchExtractorSecretValues: FETCH_SECRET_VALUES_BY_EXTRACTOR,
      doDeleteExtractorSecret: DELETE_SECRET_VALUES
    }),
    addNewSecret () {
      this.editSecretId = ''
      this.showForm = true
    },
    cancelForm () {
      this.editSecretId = ''
      this.showForm = false
    },
    async deleteSecret (id) {
      try {
        await this.doDeleteExtractorSecret(id)
      } catch (err) {
        const msg = _.get(err, 'body.error.message', '') || ''
        if (msg === 'secret in use') {
          this.$notify({
            type: 'error',
            title: 'Error deleting secret',
            message: 'This secret configuration is currently used in an extractor profile and cannot be deleted'
          })
        } else {
          this.$notify({
            type: 'error',
            title: 'Error deleting secret',
            message: 'An unknown error occurred, please try again'
          })
        }
      }
    },
    editSecret (id) {
      this.editSecretId = id
      this.showForm = true
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.extractor-secrets-list {
  position: relative;

  > header {
    margin-bottom: 15px;
    h3 {
      color: @color-accent;
      font-family: @default-font-family-medium;
      font-size: 16px;
      margin: 0 0 8px 0;
      padding: 0;
    }
    p {
      color: @color-disabled;
      font-size: 12px;
      margin: 0;
      padding: 0;
    }
  }

  .add-secret-btn:hover {
    background-color: @color-base;
    color: @color-accent;
  }

  .secrets-list {
    width: 100%;
    margin-bottom: 10px;
    thead {
      th {
        border-bottom: 1px dotted @box-border-grey;
        color: @color-tone-darkest;
        font-size: 11px;
        padding: 0 10px 10px 0;
        text-align: left;
      }
    }
    tbody {
      tr {
        td {
          border-bottom: 1px dotted @box-border-grey;
          color: @color-primary;
          font-size: 12px;
          padding: 8px 10px 8px 0;
          text-align: left;
          vertical-align: top;
          &.operations {
            text-align: center;
            width: 60px;
            > span {
              cursor: pointer;
              display: inline-block;
              &:first-child {
                margin-right: 10px;
              }
              &:hover {
                color: @color-accent;
              }
            }
          }
        }
        &:last-child td {
          border-bottom: 0 none;
        }
      }      
    }
  } // .secrets-list table

  p.no-content {
    color: @color-tone-darkest;
    font-size: 11px;
    font-style: italic;    
  }
}
</style>
