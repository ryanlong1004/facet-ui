<template>
  <div class="content content-profile">
    <div class="user-profile">
      <div class="user-info">
        <h2>My Profile</h2>
        <p>{{ profile.email }}</p>
      </div>

      <user-avatar></user-avatar>
    </div>

    <el-form
      :model="profileForm"
      :rules="profileRules"
      inline-message
      label-position="top"
      label-width="100%"
      ref="userProfile"
      status-icon
      validate-on-rule-change
    >
      <el-form-item label="First Name" prop="nameFirst">
        <el-input
          type="text"
          v-model="profileForm.nameFirst"
          @keyup.enter.native="updateUserProfile"
        >
        </el-input>
      </el-form-item>
      <el-form-item label="Last Name" prop="nameLast">
        <el-input
          type="text"
          v-model="profileForm.nameLast"
          @keyup.enter.native="updateUserProfile"
        >
        </el-input>
      </el-form-item>
      <el-form-item class="contains-button">
        <el-button
          :disabled="!isDirtyProfileForm"
          @click="updateUserProfile"
          type="primary"
        >
          Update My Profile
        </el-button>
      </el-form-item>
    </el-form>


    <h2>Change Password</h2>
    <el-form
      :model="userPassword"
      :rules="passwordRules"
      inline-message
      label-position="top"
      label-width="100%"
      ref="userPassword"
      status-icon
      validate-on-rule-change
    >
      <el-form-item label="Password" prop="password">
        <el-input
          :placeholder="passwordFieldPlaceholder"
          type="password"
          v-model="userPassword.password"
          @keyup.enter.native="updateUserPassword"
        >
        </el-input>
      </el-form-item>

      <el-form-item label="Confirm Password" prop="passwordConfirm">
        <el-input v-model="userPassword.passwordConfirm" type="password" @keyup.enter.native="updateUserPassword"></el-input>
      </el-form-item>

      <el-form-item class="contains-button">
        <el-button
          :disabled="!isValidForm"
          @click="updateUserPassword"
          type="primary"
        >
          Update Password
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import Avatar from 'vue-avatar'
import avatarUpload from 'vue-image-crop-upload/upload-2.vue'
import Validator from 'async-validator'
import { mapGetters } from 'vuex'

import api from 'src/api'
import { getAPIErrorMsg } from 'src/apiHelpers'
import { SESSION } from 'src/store/storeModules'
import {
  FETCH_CURRENT_USER,
  GET_CURRENT_USER,
  GET_PASSWORD_MAX_LENGTH,
  GET_PASSWORD_MIN_LENGTH,
  GET_USER_ROLE,
  SET_CURRENT_USER
} from 'src/store/modules/session/session'
import UserAvatar from 'src/components/UserAvatar.vue'

export default {
  name: 'admin-profile',

  components: {
    UserAvatar
  },

  computed: {
    ...mapGetters(SESSION, {
      passwordMaxLength: GET_PASSWORD_MAX_LENGTH,
      passwordMinLength: GET_PASSWORD_MIN_LENGTH,
      userRole: GET_USER_ROLE
    }),

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

  watch: {
    userPassword: {
      handler (newValue, oldValue) {
        this.validator.validate(newValue, (errors, fields) => {
          this.isValidForm = !errors
        })
      },
      deep: true
    },
    profileForm: {
      handler (newValue, oldValue) {
        this.isDirtyProfileForm = true
      },
      deep: true
    },
    passwordValidationRules: {
      handler (newVal) {
        this.passwordRules['password'] = newVal
      },
      immediate: true
    }
  },

  data () {
    const passwordRules = {
      passwordConfirm: [
        {
          required: true,
          trigger: 'blur',
          validator: this.validatePasswordConfirm
        }
      ]
    }
    const profileRules = {
      nameFirst: [
        {
          required: true,
          message: 'First name is required',
          trigger: 'blur '
        }
      ],
      nameLast: [
        {
          required: true,
          message: 'Last name is required',
          trigger: 'blur'
        }
      ]
    }

    let currentUser = this.$store.getters[`${SESSION}/${GET_CURRENT_USER}`]

    return {
      isValidForm: false,
      isDirtyProfileForm: false,
      profile: {
        id: currentUser.id,
        nameFirst: currentUser.first_name,
        nameLast: currentUser.last_name,
        email: currentUser.email
      },
      profileForm: {
        nameFirst: currentUser.first_name,
        nameLast: currentUser.last_name
      },
      userPassword: {
        password: '',
        passwordConfirm: ''
      },
      profileRules,
      passwordRules,
      validator: new Validator(passwordRules)
    }
  },

  methods: {
    updateUserPassword () {
      this.$refs['userPassword'].validate(async (valid) => {
        if (valid) {
          try {
            const user = {
              id: this.profile.id,
              email: this.profile.email,
              password: this.userPassword.password
            }
            await api.updatePassword(user)
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: 'User password updated',
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
            this.userPassword.password = ''
            this.userPassword.passwordConfirm = ''
          }
        } else {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'User password not updated. Please try again.',
            showClose: true,
            type: 'error'
          })
        }
      })
    },

    updateUserProfile () {
      this.$refs['userProfile'].validate(async (valid) => {
        if (valid) {
          try {
            const user = {
              id: this.profile.id,
              first_name: this.profileForm.nameFirst,
              last_name: this.profileForm.nameLast
            }
            const response = await api.updatePartialUser(user)

            this.profile.nameFirst = response.first_name
            this.profile.nameLast = response.last_name
            this.isDirtyProfileForm = false
            this.$refs['userProfile'].clearValidate()

            // update current user
            this.$store.commit(`${SESSION}/${SET_CURRENT_USER}`, response)
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: 'Profile updated',
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
          }
        } else {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'Profile not updated. Please try again.',
            showClose: true,
            type: 'error'
          })
        }
      })
    },

    validatePasswordConfirm (rule, value, callback) {
      if (value === '') {
        callback(new Error('Please provide a password.'))
      } else if (value !== this.userPassword.password) {
        callback(new Error('Passwords do not match, please retype.'))
      } else {
        callback()
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';
@import '~src/styles/vue-image-crop-upload';

.admin-page {
  .content {
    &.content-profile {
      > h2,
      .user-profile,
      .el-form {
        max-width: 601.5px;
      }

      h2 {
        margin: 0 0 17px;
      }

      .user-profile {
        .flex-container-between();
        .align-items-start();
        margin-bottom: 29px;
        margin-top: 10px;

        .user-info {
          flex: 1 1 417.5px;
          height: 100%;
          margin-right: 64px;
          min-width: 417.5px;

          p {
            line-height: 1.33;
            margin: 0 0 6px;

            &.note {
              color: @color-accent;
              font-size: 12px;
              font-style: italic;
            }
          }
        }
      }
    }
  }
}
</style>
