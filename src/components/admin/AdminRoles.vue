<template>
  <div class="content-roles" v-loading="loading">

    <el-dialog
      :before-close="cancelDialog"
      :title="editingMode ? 'Edit Role' : 'Add Role'"
      :visible.sync="dialogRoleVisible"
      class="role-selections"
      top="1%"
    >

      <el-form
        :model="formRole"
        :rules="formValidationRules"
        inline-message
        label-position="top"
        label-width="100%"
        ref="formRole"
        status-icon
        validate-on-rule-change
      >
        <el-form-item label="Role" prop="role">
          <el-input
            placeholder="Role"
            ref="role-name"
            v-model="formRole.role"
            @keydown.native.enter.stop.prevent="doSubmit"
          >
          </el-input>
        </el-form-item>
        <el-form-item class="has-textarea alternate" label="Description">
          <el-input type="textarea" v-model="formRole.description"></el-input>
        </el-form-item>

        <el-form-item class="role-scopes" prop="scopes">
          <el-checkbox-group v-model="formRole.scopes">
            <div
              :key="scope.sort_order"
              v-for="scope in scopes"
              class="group"
            >
              <h4>{{scope.name}}</h4>
              <div class="checkboxes" :style="{ height: ((Math.ceil(scope.scopes.length / 2)) * checkboxGroupContainer) + 'px'}">
                <el-checkbox
                  :key="item.name"
                  :label="item.name"
                  name="scopes"
                  v-for="item in scope.scopes"
                >
                  {{item.display_name}}
                </el-checkbox>
              </div>
            </div>
          </el-checkbox-group>
        </el-form-item>

        <input type="hidden" v-model="formRole.id" />
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button type="text" size="mini" @click="cancelDialog">Cancel</el-button>
        <el-button
          :disabled="!isValidForm"
          @click="doSubmit"
          type="primary"
          size="mini">
          Save
        </el-button>
      </span>
    </el-dialog>

    <div class="header">
      <h2>Roles</h2>
      <div class="options">
        <div v-if="displayedRoles" class="search-for-role-input-wrapper">
          <input
            @keyup.enter="searchForRoles"
            @keyup.esc="showAllRoles"
            class="search-for-role__input el-input__inner"
            placeholder="Filter roles by name or description"
            type="text"
            v-model="searchedForRole"
          >
          <i v-if="searchedForRole !== ''" class="far fa-times" @click="showAllRoles"></i>
          <i
            v-else
            class="far fa-search"
            @click="searchForRoles"
          ></i>
        </div>

        <el-button type="text" @click="openDialog">
          <i class="far fa-plus"></i>
          Add New
        </el-button>
      </div>
    </div>

    <div v-if="!displayedRoles.length">
      <p>No roles found.</p>
    </div>

    <table v-else>
      <tbody>
        <tr v-for="role in displayedRoles" :key="role.id">
          <td>
            <div class="info">
              <div class="icon">
                <i class="far fa-shield"></i>
              </div>
              <div class="contact">
                <h3>
                  {{ role.name }}
                </h3>
                <p v-if="role.description">{{ role.description }}</p>
              </div>
            </div>
          </td>
          <td>
            <div class="admin-table-row-buttons" v-if="role.id !== ROOT_ROLE_ID">
              <el-tooltip
                class="item"
                content="Edit role"
                effect="dark"
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                <i class="far fa-pencil admin-table-row-buttons__icon" @click="populateRoleDialog(role)"></i>
              </el-tooltip>
              <el-tooltip
                class="item"
                content="Delete role"
                effect="dark"
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                <i class="far fa-trash admin-table-row-buttons__icon" @click="doDeleteRole(role)"></i>
              </el-tooltip>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import _ from 'lodash'
import api from 'src/api'

import { mapActions, mapGetters } from 'vuex'
import session from 'src/session'
import Validator from 'async-validator'

import { ROLES } from 'src/store/storeModules'
import {
  // getters
  GET_ROLES,
  GET_SCOPES,
  // actions
  FETCH_ROLES,
  FETCH_SCOPES,
  ADD_ROLE,
  UPDATE_ROLE,
  DELETE_ROLE
} from 'src/store/modules/admin/roles'

const CHECKBOX_HEIGHT = 36
const ROOT_ROLE_ID = 'root'

const formValidationRules = {
  role: [
    {
      message: 'Please provide a role.',
      required: true,
      trigger: 'blur'
    }
  ]
}

const validator = new Validator(formValidationRules)

export default {
  name: 'admin-roles',

  async beforeMount () {
    this.loading = true
    await this.fetchRoles()
    await this.fetchScopes()
    this.loading = false
  },

  mounted () {
    this.$watch('roles', newVal => {
      this.showAllRoles()
    }, { immediate: true })
  },

  data () {
    return {
      dialogRoleVisible: false,
      displayedRoles: [],
      enabled: false,
      editingMode: false,
      formRole: {
        description: '',
        role: '',
        scopes: []
      },
      isValidForm: false,
      loading: false,
      role: '',
      roleDetails: {},
      formValidationRules,
      searchedForRole: '',
      session: session,
      ROOT_ROLE_ID
    }
  },

  computed: {
    ...mapGetters(ROLES, {
      roles: GET_ROLES,
      scopes: GET_SCOPES
    }),
    checkboxGroupContainer () {
      return CHECKBOX_HEIGHT
    }
  },

  watch: {
    formRole: {
      handler (newValue, oldValue) {
        validator.validate(newValue, (errors, fields) => {
          this.isValidForm = !errors
        })
      },
      deep: true
    }
  },

  methods: {
    ...mapActions(ROLES, {
      fetchRoles: FETCH_ROLES,
      fetchScopes: FETCH_SCOPES,
      addRole: ADD_ROLE,
      doUpdateRole: UPDATE_ROLE,
      deleteRole: DELETE_ROLE
    }),

    cancelDialog () {
      this.dialogRoleVisible = false
      this.editingMode = false
      this.clearFields()
    },

    clearFields () {
      this.formRole = {
        description: '',
        role: '',
        scopes: []
      }
    },

    doDeleteRole (role) {
      this.$confirm(`Are you sure you want to delete ${role.name}?`, 'Warning', {
        cancelButtonText: 'Cancel',
        confirmButtonText: 'OK',
        type: 'warning'
      }).then(async () => {
        try {
          await this.deleteRole(role.id)

          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: `${role.name} deleted`,
            showClose: true,
            type: 'success'
          })
        } catch (err) {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: err,
            showClose: true,
            type: 'error'
          })
          throw err
        }
      }).catch(() => {})
    },

    getRoleNameById (roleId) {
      const role = this.roles.find(role => role.id === roleId)
      return _.get(role, 'name', '').toLowerCase()
    },

    async populateRoleDialog (role) {
      try {
        this.roleDetails = await api.getRole(role.id)

        _.assign(this.formRole, this.roleDetails, { role: this.roleDetails.name })
        this.dialogRoleVisible = true
        this.editingMode = true
        this.$nextTick(() => {
          this.$refs['formRole'].clearValidate()
        })
      } catch (err) {
        throw err
      }
    },

    doSubmit () {
      this.editingMode ? this.updateRole() : this.submitRole()
    },

    openDialog () {
      this.dialogRoleVisible = true
      this.clearFields()
      this.$nextTick(() => {
        this.$refs['formRole'].clearValidate()
        this.$refs['role-name'].$el.getElementsByTagName('input')[0].focus()
      })
    },

    async searchForRoles () {
      if (this.searchedForRole) {
        this.displayedRoles = this.roles
        const searchValue = this.searchedForRole.toLowerCase()
        const regExSearchValue = new RegExp(searchValue, 'i')

        const filteredRoles = [
          ...this.displayedRoles.filter(role => regExSearchValue.test(_.get(role, 'description', '').toLowerCase()) || regExSearchValue.test(_.get(role, 'name', '').toLowerCase())),
          ...this.displayedRoles.filter(role => this.getRoleNameById(_.get(role, 'id', '')) === searchValue)
        ]

        this.displayedRoles = [...new Set(filteredRoles)]
      } else {
        this.showAllRoles()
      }
    },

    showAllRoles () {
      this.displayedRoles = this.roles
      this.searchedForRole = ''
    },

    submitRole () {
      this.editingMode = false
      this.$refs['formRole'].validate(async (valid) => {
        if (valid) {
          const role = {
            description: this.formRole.description,
            name: this.formRole.role,
            scopes: this.formRole.scopes
          }

          try {
            await this.addRole(role)
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: `${role.name} added.`,
              showClose: true,
              type: 'success'
            })
          } catch (err) {
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: err,
              showClose: true,
              type: 'error'
            })
            throw err
          } finally {
            this.clearFields()
          }

          this.dialogRoleVisible = false
        } else {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'Error submitting form, please try again.',
            showClose: true,
            type: 'error'
          })
          return false
        }
      })
    },

    async updateRole () {
      try {
        this.doUpdateRole({role: this.roleDetails, updatedRole: this.formRole})

        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${this.formRole.name} updated.`,
          showClose: true,
          type: 'success'
        })
      } catch (err) {
        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: err,
          showClose: true,
          type: 'error'
        })
        throw err
      } finally {
        this.dialogRoleVisible = false
        this.editingMode = false
        this.clearFields()
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    h2 {
      font-size: 16px;
    }

    .header {
      .options {
        .flex-box();
        margin-left: auto;

        .search-for-role-input-wrapper {
          margin-right: 30px;
          position: relative;

          .search-for-role__input {
            border: 1px solid @box-border-grey;
            border-radius: 0;
            color: @text-medium;
            font-size: 13px;
            height: 32px;
            position: relative;
            width: 316px;
          }

          i {
            color: @color-tone-darkest;
            position: absolute;
            right: 8px;
            top: 7px;

            &:hover {
              cursor: pointer;
            }
          }
        }

        button {
          padding-top: 5px;
        }
      }
    }

    .content-roles {
      .info {
        .icon {
          i {
            cursor: default;
          }
        }
      }

      table {
        .admin-table-row-buttons i {
          font-size: 12px;
          color: @text-medium;
          cursor: pointer;
          margin: 0;
          &:first-child {
            margin: 0 10px 0 4px;
          }
          &:hover {
            color: @color-accent;
          }
        }
      }

      .group {
        margin-bottom: 12px;

        h4 {
          border-bottom: 1px solid @box-border-grey;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
          line-height: 1.36;
          margin-bottom: 4px;
          margin-top: 0;
          padding-bottom: 4px;
          text-transform: uppercase;
          width: 100%;
        }

        .checkboxes {
          display: flex;
          flex-flow: column wrap;
          padding-top: 7px;
        }
      }
    }
  }
}
</style>
