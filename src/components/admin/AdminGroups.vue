<template>
  <div v-loading="loading" class="content-groups">
    <el-dialog
      :before-close="cancelDialog"
      :visible.sync="dialogGroupVisible"
      :title="editingMode ? 'Edit Group' : 'Add Group'"
      top="5%"
    >

      <el-form
        :model="formGroup"
        :rules="formValidationRules"
        inline-message
        label-position="top"
        label-width="100%"
        ref="formGroup"
        status-icon
        validate-on-rule-change
      >
        <el-form-item label="Group Name" prop="groupName">
          <el-input
            ref="group-name"
            v-model="formGroup.groupName"
            @keydown.native.enter.stop.prevent="doSubmit"
          >
          </el-input>
        </el-form-item>

        <el-form-item class="has-textarea" label="Description">
          <el-input type="textarea" v-model="formGroup.description"></el-input>
        </el-form-item>

        <input type="hidden" v-model="formGroup.id" />
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button size="mini" type="text" @click="cancelDialog">Cancel</el-button>
        <el-button
          :disabled="!isValidForm"
          @click="doSubmit"
          type="primary"
          size="mini">Save</el-button>
      </span>
    </el-dialog>

    <div class="header">
      <h2>Groups</h2>
      <div class="options">
        <div v-if="displayedGroups" class="search-for-group-input-wrapper">
          <input
            @keyup.enter="searchForGroups"
            @keyup.esc="showAllGroups"
            class="search-for-group__input el-input__inner"
            placeholder="Filter groups by name or description"
            type="text"
            v-model="searchedForGroup"
          >
          <i v-if="searchedForGroup !== ''" class="far fa-times" @click="showAllGroups"></i>
          <i
            v-else
            class="far fa-search"
            @click="searchForGroups"
          ></i>
        </div>

        <el-button type="text" @click="openDialog">
          <i class="far fa-plus"></i>
          Add New
        </el-button>
      </div>
    </div>

    <div v-if="!displayedGroups.length">
      <p>No groups found.</p>
    </div>

    <table v-else>
      <tbody>
        <tr v-for="group in displayedGroups" :key="group.id">
          <td>
            <div class="info">
              <div class="icon">
                <i class="far fa-users"></i>
              </div>
              <div class="contact">
                <h3>
                  {{ group.name }}
                </h3>
                <p v-if="group.description">{{ group.description }}</p>
              </div>
            </div>
          </td>
          <td>
            <div class="admin-table-row-buttons" v-if="!group.locked">
              <el-tooltip
                class="item"
                content="Edit group"
                effect="dark"
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                <i class="far fa-pencil admin-table-row-buttons__icon" @click="populateGroupDialog(group)"></i>
              </el-tooltip>
              <el-tooltip
                class="item"
                content="Delete group"
                effect="dark"
                placement="top"
                :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY">
                <i class="far fa-trash admin-table-row-buttons__icon" @click="doDeleteGroup(group)"></i>
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
import Validator from 'async-validator'
import { mapActions, mapGetters } from 'vuex'
import session, { DEFAULT_AUTH_ROLES } from 'src/session'
import { GROUPS } from 'src/store/storeModules'
import {
  // getters
  GET_GROUPS,
  // actions
  FETCH_GROUPS,
  ADD_GROUP,
  UPDATE_GROUP,
  DELETE_GROUP
} from 'src/store/modules/admin/groups'

const formValidationRules = {
  groupName: [
    {
      message: 'Group name is required',
      required: true,
      trigger: 'blur'
    }
  ]
}

const validator = new Validator(formValidationRules)

export default {
  name: 'admin-groups',

  async beforeMount () {
    this.loading = true
    await this.fetchGroups()
    this.loading = false
  },

  mounted () {
    this.$watch('groups', newVal => {
      this.showAllGroups()
    }, { immediate: true })
  },

  data () {
    return {
      dialogGroupVisible: false,
      displayedGroups: [],
      enabled: false,
      editingMode: false,
      formGroup: {
        description: '',
        groupName: ''
      },
      groupsBusy: false,
      isValidForm: false,
      formValidationRules,
      loading: false,
      searchedForGroup: '',
      session: session
    }
  },

  computed: {
    ...mapGetters(GROUPS, {
      groups: GET_GROUPS
    })
  },

  watch: {
    formGroup: {
      handler (newValue, oldValue) {
        validator.validate(newValue, (errors, fields) => {
          this.isValidForm = !errors
        })
      },
      deep: true
    }
  },

  methods: {
    ...mapActions(GROUPS, {
      fetchGroups: FETCH_GROUPS,
      addGroup: ADD_GROUP,
      deleteGroup: DELETE_GROUP,
      loadGroups: FETCH_GROUPS,
      updateGroup: UPDATE_GROUP
    }),

    cancelDialog () {
      this.dialogGroupVisible = false
      this.editingMode = false
      this.clearFields()
    },

    clearFields () {
      this.formGroup = {
        description: '',
        groupName: ''
      }
    },

    doDeleteGroup (group) {
      if (group.locked) {
        return
      }
      this.$confirm(`Are you sure you want to delete ${group.name}?`, 'Warning', {
        cancelButtonText: 'Cancel',
        confirmButtonText: 'OK',
        type: 'warning'
      }).then(async () => {
        try {
            await this.deleteGroup(group.id)

            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: `${group.name} deleted.`,
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

    getGroupNameById (groupId) {
      const group = this.groups.find(group => group.id === groupId)
      return _.get(group, 'name', '').toLowerCase()
    },

    populateGroupDialog (group) {
      if (group.locked) {
        return
      }
      this.dialogGroupVisible = true
      this.editingMode = true
      this.$nextTick(() => {
        this.$refs['formGroup'].clearValidate()
      })
      _.assign(this.formGroup, {
        description: group.description,
        groupName: group.name,
        id: group.id
      })
    },

    doSubmit () {
      this.editingMode ? this.doUpdateGroup() : this.submitGroup()
    },

    openDialog () {
      this.dialogGroupVisible = true
      this.clearFields()
      this.$nextTick(() => {
        this.$refs['formGroup'].clearValidate()
        this.$refs['group-name'].$el.getElementsByTagName('input')[0].focus()
      })
    },

    async searchForGroups () {
      if (this.searchedForGroup) {
        this.displayedGroups = this.groups
        const searchValue = this.searchedForGroup.toLowerCase()
        const regExSearchValue = new RegExp(searchValue, 'i')

        const filteredGroups = [
          ...this.displayedGroups.filter(group =>
            regExSearchValue.test(_.get(group, 'description', '').toLowerCase()) ||
            regExSearchValue.test(_.get(group, 'name', '').toLowerCase())
          ),
          ...this.displayedGroups.filter(group => this.getGroupNameById(_.get(group, 'id', '')) === searchValue)
        ]

        this.displayedGroups = [...new Set(filteredGroups)]
      } else {
        this.showAllGroups()
      }
    },

    showAllGroups () {
      this.displayedGroups = this.groups
      this.searchedForGroup = ''
    },

    submitGroup () {
      this.editingMode = false
      this.$refs['formGroup'].validate(async (valid) => {
        if (valid) {
          const group = {
            description: this.formGroup.description,
            name: this.formGroup.groupName
          }

          try {
            await this.addGroup(group)

            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: `${group.name} created.`,
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

          this.dialogGroupVisible = false
        } else {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'Error submitting. Please try again.',
            showClose: true,
            type: 'error'
          })
          return false
        }
      })
    },

    async doUpdateGroup () {
      const group = {
        id: this.formGroup.id,
        description: this.formGroup.description,
        name: this.formGroup.groupName
      }

      try {
        await this.updateGroup(group)

        this.$message({
          duration: this.CONSTANTS.MESSAGE_DURATION,
          message: `${group.name} updated.`,
          showClose: true,
          type: 'success'
        })
        this.dialogGroupVisible = false
        this.editingMode = false
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
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin.admin-page {
  .content {
    h2 {
      font-size: 16px;
    }

    .header {
      .options {
        .flex-box();
        margin-left: auto;

        .search-for-group-input-wrapper {
          margin-right: 30px;
          position: relative;

          .search-for-group__input {
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
  }
}
</style>
