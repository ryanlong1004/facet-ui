<template>
  <el-form
    :model="formUser"
    :rules="formValidationRules"
    inline-message
    label-position="top"
    label-width="100%"
    ref="formUser"
    status-icon>
    <el-form-item prop="first_name" label="First Name">
      <el-input
        placeholder="Required"
        ref="first-name"
        v-model="formUser.first_name"
        @keyup.enter.native="submitForm"
      >
      </el-input>
    </el-form-item>

    <el-form-item prop="last_name" label="Last Name">
      <el-input placeholder="Required" v-model="formUser.last_name" @keyup.enter.native="submitForm"></el-input>
    </el-form-item>

    <el-form-item prop="email" label="Email">
      <el-input
        placeholder="Required"
        type="email"
        v-model="formUser.email"
        @keyup.enter.native="submitForm"
      ></el-input>
    </el-form-item>

    <el-form-item
      label="Password"
      prop="password"
      v-if="!editingMode"
    >
      <el-input
        :placeholder="passwordFieldPlaceholder"
        type="password"
        v-model="formUser.password"
        @keyup.enter.native="submitForm"
      ></el-input>
    </el-form-item>

    <el-form-item prop="role_id" label="Role" class="admin-user-roles">
      <el-select
        v-model="formUser.role_id"
        placeholder="Choose Role (Required)..."
        @keyup.enter.native="submitForm"
      >
        <el-option
          :key="role.id"
          :label="role.name"
          :value="role.id"
          v-for="role in roles">
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item prop="userGroups" label="Group" class="admin-user-groups">
      <el-select
        filterable
        multiple
        collapse-tags
        placeholder="Add One or More Groups (Optional)..."
        v-model="formUser.group_ids"
        @keyup.enter.native="submitForm"
      >
        <el-option
          :key="group.id"
          :label="group.name"
          :value="group.id"
          v-for="group in groups"
        >
        </el-option>
      </el-select>
    </el-form-item>

    <span class="dialog-footer">
      <el-button size="mini" type="text" @click="closeForm">Cancel</el-button>
      <el-button
        @click="submitForm"
        type="primary"
        size="mini">
        Save
      </el-button>
    </span>
  </el-form>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'
import Validator from 'async-validator'

import { FAKE_PASSWORD } from './users.config'
import {
  GROUPS,
  ROLES,
  SESSION,
  USERS
} from 'src/store/storeModules'
import {
  GET_PASSWORD_MIN_LENGTH,
  GET_PASSWORD_MAX_LENGTH
} from 'src/store/modules/session/session'
import { GET_GROUPS } from 'src/store/modules/admin/groups'
import { GET_ROLES } from 'src/store/modules/admin/roles'
import {
  // getters
  GET_USERS,
  // actions
  ADD_USER,
  UPDATE_USER,
  UPDATE_USER_GROUPS
} from 'src/store/modules/admin/users'

const getBlankForm = () => {
  return {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id: '',
    group_ids: []
  }
}

export default {
  name: 'admin-user-form',
  props: {
    userId: {
      type: String,
      default: ''
    }
  },
  mounted () {
    if (this.userId) {
      const user = this.users.find(u => u.id === this.userId)
      this.formUser = _.assign({}, user)
    }
  },
  data () {
    return {
      formUser: getBlankForm(),
      isValidForm: false
    }
  },
  computed: {
    ...mapGetters(GROUPS, {
      groups: GET_GROUPS
    }),
    ...mapGetters(ROLES, {
      roles: GET_ROLES
    }),
    ...mapGetters(SESSION, {
      passwordMinLength: GET_PASSWORD_MIN_LENGTH,
      passwordMaxLength: GET_PASSWORD_MAX_LENGTH
    }),
    ...mapGetters(USERS, {
      users: GET_USERS
    }),
    editingMode () {
      return this.userId.length > 0
    },
    formValidationRules () {
      let rules = {
        first_name: [
          {
            message: 'Please provide a first name.',
            required: true,
            trigger: 'blur'
          }
        ],
        last_name: [
          {
            message: 'Please provide a last name.',
            required: true,
            trigger: 'blur'
          }
        ],
        email: [
          {
            message: 'Please provide a valid email address.',
            required: true,
            trigger: 'blur',
            type: 'email'
          }
        ],
        password: [],
        role_id: [
          {
            message: 'Please assign a role.',
            required: true,
            trigger: 'blur'
          }
        ]
      }
      if (!this.editingMode) {
        rules.password = this.passwordValidationRules
      }
      return rules
    },
    passwordFieldPlaceholder () {
      return `Between ${this.passwordMinLength} and ${this.passwordMaxLength} characters`
    },
    passwordValidationRules () {
      return [
        {
          message: 'Please provide a password.',
          required: true,
          trigger: 'blur'
        },
        {
          min: this.passwordMinLength,
          max: this.passwordMaxLength,
          message: `Please provide a password between ${this.passwordMinLength} and ${this.passwordMaxLength} characters in length.`,
          trigger: 'blur'
        }
      ]
    }
  },
  methods: {
    ...mapActions(USERS, {
      doAddUser: ADD_USER,
      doUpdateUser: UPDATE_USER
    }),
    closeForm () {
      this.$emit('close-form')
    },
    resetForm () {
      this.formUser = getBlankForm()
      this.$nextTick(() => {
        this.$refs['formUser'].clearValidate()
      })
    },
    async submitForm () {
      this.$refs['formUser'].validate(async (valid) => {
        if (valid) {
          // are we editing an existing user?
          if (this.editingMode) {
            try {
              await this.doUpdateUser({ userId: this.userId, updatedFields: this.formUser })
              this.$notify({
                type: 'success',
                title: 'User updated',
                message: 'User was successfully updated'
              })
              this.closeForm()
            } catch (err) {
              this.$notify({
                type: 'error',
                title: 'Error',
                message: 'Unable to update user, please try again'
              })
            }
          } else { // creating a new user
            try {
              await this.doAddUser(this.formUser)
              this.$notify({
                type: 'success',
                title: 'User updated',
                message: 'User was successfully updated'
              })
              this.closeForm()
            } catch (err) {
              this.$notify({
                type: 'error',
                title: 'Error',
                message: 'Unable to create new user, please try again'
              })
            }
          }
        }
      })
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

</style>
