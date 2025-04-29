<template>
  <div class="content developers">
    <div class="content-api">
      <el-dialog
        :before-close="cancelDialog"
        :visible.sync="dialogAPIKeysVisible"
        :title="editingMode ? 'Edit API Key' : 'Add API Key'"
        top="5%"
      >
        <el-form
          :model="formKeys"
          :rules="rules"
          inline-message
          label-position="top"
          label-width="100%"
          ref="formKeys"
          status-icon
          validate-on-rule-change
        >
          <el-form-item
            :label="editingMode ? 'Edit existing API Key' : 'Add new API Key'"
            prop="apiName"
          >
            <el-input
              placeholder="API Key name"
              ref="apiName"
              v-model="formKeys.apiName"
              @keydown.native.enter.prevent.stop="submitAPIKey"
            >
            </el-input>
          </el-form-item>
          <input type="hidden" v-model="formKeys.id" />
        </el-form>

        <span slot="footer" class="dialog-footer">
          <el-button type="text" size="mini" @click="cancelDialog">Cancel</el-button>
          <el-button
            size="mini"
            :disabled="!isValidForm"
            @click="submitAPIKey"
            type="primary"
          >
            Save
          </el-button>
        </span>
      </el-dialog>

      <div class="header">
        <h2>API Keys</h2>
        <el-button type="text" @click="openDialog">
          <i class="far fa-plus"></i>
          Add New
        </el-button>
      </div>

      <div v-if="!apiKeys.length">
        <p class="no-results">No API Keys found.</p>
      </div>

      <el-tabs v-else v-model="apiKeyActiveName">
        <el-tab-pane label="Active API keys" name="activeKeys"></el-tab-pane>
        <el-tab-pane label="Disabled API keys" name="inactiveKeys"></el-tab-pane>
      </el-tabs>
      <table class="keys" v-if="apiKeys.length">
        <thead>
          <tr>
            <th>State</th>
            <th>Description</th>
            <th>Key</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            :key="key.id"
            v-for="key in apiKeys"
            v-show="(key.active && apiKeyActiveName === 'activeKeys') || (!key.active && apiKeyActiveName === 'inactiveKeys')"
          >
            <td>
              <i
                :class="{ inactive: !key.active }"
                @click="toggleKey(key)"
                class="far fa-toggle-on"
              ></i>
            </td>
            <td class="description">
              <div>
                <span>{{key.name}}</span>
                <i class="far fa-pencil admin-table-row-buttons__icon" @click="editAPIName(key)"></i>
              </div>
            </td>
            <td class="key-info">
              <p v-if="key.masked">{{key.jwtMasked}}</p>
              <p v-else>{{key.jwt}}</p>
            </td>
            <td class="info-actions">
              <div>
                <i
                  :class="{'unmasked': !key.masked}"
                  @click="key.masked = !key.masked"
                  class="far fa-eye admin-table-row-buttons__icon"
                ></i>
                <el-button v-clipboard="key.jwt" size="mini" type="primary">
                  <i class="far fa-paste"></i>
                  <span>Copy Api Key</span>
                </el-button>
              </div>
            </td>
          </tr>
          <tr v-if="!activeAPIKeys.length && apiKeyActiveName === 'activeKeys'">
            <td class="no-results" colspan="3">
              <p class="no-results">No active API Keys found.</p>
            </td>
          </tr>
          <tr v-if="!disabledAPIKeys.length && apiKeyActiveName === 'inactiveKeys'">
            <td class="no-results" colspan="3">
              <p class="no-results">No disabled API Keys found.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="content-documentation">
      <h2>Documentation</h2>
      <div class="message">
        <div>
          <p>Wasabi AiR™ API integration guide.</p>
          <p>Get familiar with our product and explore the features we provide.</p>
        </div>
        <div>
          <!-- Leaving the previous router link in case we want to go back to personalized API docs -->
          <!-- <router-link :to="{ name: CONSTANTS.ROUTES.DOCUMENTATION.NAME }" class="button-link" target="_blank">
            <i class="far fa-file-alt"></i>
            <span>View API Documentation</span>
          </router-link> -->
          <a href="https://docs.wasabi.com/docs/wasabi-air-api-reference" class="button-link" target="_blank">
            <i class="far fa-file-alt"></i>
            <span>View API Documentation</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import Vue from 'vue'

import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { getAPIErrorMsg } from 'src/apiHelpers'
import session, { DEFAULT_AUTH_ROLES } from 'src/session'

const NUM_CHARS_TO_SHOW = 15

function maskToken (jwt) {
  const head = jwt.slice(0, NUM_CHARS_TO_SHOW)
  const middle = jwt.slice(NUM_CHARS_TO_SHOW, jwt.length - NUM_CHARS_TO_SHOW)
  const tail = jwt.slice(jwt.length - NUM_CHARS_TO_SHOW)
  return head + middle.replace(/[a-z0-9]/gi, 'X') + tail
}

export default {
  beforeMount () {
    this.loadApiKeys()
  },

  computed: {
    activeAPIKeys () {
      return this.apiKeys.filter(key => key.active)
    },

    disabledAPIKeys () {
      return this.apiKeys.filter(key => !key.active)
    }
  },

  data () {
    return {
      CONSTANTS,
      apiKeyActiveName: 'activeKeys',
      apiKeys: [],
      dialogAPIKeysVisible: false,
      editingMode: false,
      formKeys: {
        apiName: ''
      },
      isValidForm: false,
      rules: {
        apiName: [
          {
            message: 'API Key name is required.',
            required: true,
            trigger: 'blur'
          }
        ]
      },
      saving: false,
      session: session
    }
  },

  methods: {
    cancelDialog () {
      this.dialogAPIKeysVisible = false
      this.editingMode = false
      this.clearFields()
    },

    clearFields () {
      this.formKeys.apiName = ''
      this.$nextTick(() => {
        this.$refs['formKeys'].resetFields()
      })
    },

    editAPIName (apiKey) {
      this.dialogAPIKeysVisible = true
      this.editingMode = true
      this.formKeys.apiName = apiKey.name
      this.formKeys.id = apiKey.id
      this.isValidForm = true
    },

    async loadApiKeys () {
      this.session.loading = true

      try {
        const keys = await api.getApiKeys()
        this.apiKeys = keys.map(key => {
          return {
            jwtMasked: maskToken(key.jwt),
            masked: true,
            ...key
          }
        })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      } finally {
        this.session.loading = false
      }
    },

    openDialog () {
      this.formKeys.apiName = ''
      this.dialogAPIKeysVisible = true
      this.$nextTick(() => {
        this.$refs['apiName'].$el.getElementsByTagName('input')[0].focus()
      })
    },

    submitAPIKey () {
      if (this.editingMode) {
        this.$refs['formKeys'].validate(async valid => {
          if (valid) {
            this.saving = true
            const apiKey = {
              name: this.formKeys.apiName,
              id: this.formKeys.id
            }

            try {
              const response = await api.updateApiKey(apiKey)
              const apiKeyIndex = this.apiKeys.findIndex(apiKey => apiKey.id === response.id)

              if (apiKeyIndex !== -1) {
                Vue.set(this.apiKeys, apiKeyIndex, { ...this.apiKeys[apiKeyIndex], ...response })
              }

              this.$message({
                duration: this.CONSTANTS.MESSAGE_DURATION,
                message: 'API Key updated.',
                showClose: true,
                type: 'success'
              })

              this.dialogAPIKeysVisible = false
              this.editingMode = false
            } catch (err) {
              this.$message({
                duration: this.CONSTANTS.MESSAGE_DURATION,
                message: getAPIErrorMsg(err),
                showClose: true,
                type: 'error'
              })
            } finally {
              this.clearFields()
              this.loadApiKeys()
              this.editingMode = false
              this.saving = false
            }
          }
        })
      } else {
        this.$refs['formKeys'].validate(async valid => {
          if (valid) {
            this.saving = true
            const key = this.formKeys.apiName

            try {
              await api.addApiKey(key)
              this.apiKeys.push(key)

              this.$message({
                duration: this.CONSTANTS.MESSAGE_DURATION,
                message: 'API key updated.',
                showClose: true,
                type: 'success'
              })

              this.dialogAPIKeysVisible = false
            } catch (err) {
              this.$message({
                duration: this.CONSTANTS.MESSAGE_DURATION,
                message: getAPIErrorMsg(err),
                showClose: true,
                type: 'error'
              })
            } finally {
              this.clearFields()
              this.loadApiKeys()
              this.saving = false
            }
          }
        })
      }
    },

    async toggleKey (key) {
      key.active = !key.active
      try {
        const response = await api.updateApiKey(key)
        const keyIndex = this.apiKeys.findIndex(key => key.id === response.id)
        if (keyIndex !== -1) {
          response.active = this.apiKeys[keyIndex].active
        }
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: 'API Key updated.',
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: getAPIErrorMsg(err),
          showClose: true,
          type: 'error'
        })
      } finally {
        this.saving = false
      }
    }
  },

  name: 'admin-developers',

  watch: {
    formKeys: {
      handler (newValue, oldValue) {
        const keyForm = this.$refs['formKeys']
        if (keyForm) {
          keyForm.validate(valid => {
            this.isValidForm = valid
          })
        }
      },
      deep: true
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '../../styles/_variables';

.admin-page {
  .content {
    .content-api {
      table {
        tr {
          th,
          td {
            &:first-of-type {
              width: 40px;

              &.no-results {
                text-align: left;
                width: auto;
              }
            }
          }

          td {
            &.info-actions {
              > div {
                button {
                  margin-right: 0;
                }
              }
            }

            .fa-toggle-on {
              color: @primary-button-color;
              font-size: 30px;

              &.inactive {
                color: @color-alert;
                transform: rotate(180deg);
              }
            }
          }
        }
      }
    }

    .content-documentation {
      .message {
        margin-top: 7px;

        p {
          margin: 0;
        }
      }
    }
  }
}
</style>
