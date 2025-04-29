<template>
  <div class="account-setup">
    <h2>Please start by completing your profile</h2>
    <el-form
        :model="accountSetup"
        :rules="rules"
        inline-message
        label-position="top"
        label-width="100%"
        ref="accountSetup"
        status-icon
        validate-on-rule-change
      >
      <div class="complete-profile">
        <el-form-item label="First Name" prop="first_name">
          <el-input
            auto-complete="on"
            type="text"
            v-model="accountSetup.first_name"
            @keyup.enter.native="updateUser"
          >
          </el-input>
        </el-form-item>

        <el-form-item label="Last Name" prop="last_name">
          <el-input
            auto-complete="on"
            type="text"
            v-model="accountSetup.last_name"
            @keyup.enter.native="updateUser"
          >
          </el-input>
        </el-form-item>

        <el-form-item class="contains-button">
          <el-button
            :disabled="!isValidForm"
            @click="updateUser"
            type="primary"
          >
            Continue
          </el-button>
        </el-form-item>
      </div>

      <user-avatar></user-avatar>

      <input type="hidden" v-model="accountSetup.id" />
    </el-form>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapMutations, mapState } from 'vuex'
import api from 'src/api'
import { getAPIErrorMsg } from 'src/apiHelpers'
import { CONSTANTS } from 'src/constants'
import Validator from 'async-validator'

import { CURIO, SESSION } from 'src/store/storeModules'
import { GET_CURRENT_USER } from 'src/store/modules/session/session'
import UserAvatar from '../UserAvatar.vue'

const rules = {
  first_name: [
    {
      message: 'Please provide your first name.',
      required: true,
      trigger: 'blur'
    }
  ],
  last_name: [
    {
      message: 'Please provide your last name.',
      required: true,
      trigger: 'blur'
    }
  ]
}

const validator = new Validator(rules)

export default {
  name: 'curio-account-setup',

  beforeMount () {
    this.setProgress('setup')
  },

  components: {
    UserAvatar
  },

  watch: {
    accountSetup: {
      handler (newValue, oldValue) {
        validator.validate(newValue, (errors, fields) => {
          if (errors) {
            this.errorMessage = errors[0].message
          } else {
            this.errorMessage = null
          }
        })
      },
      deep: true
    }
  },

  computed: {
    isValidForm () {
      return !this.errorMessage
    }
  },

  data () {
    const CURRENT_USER = this.$store.getters[`${SESSION}/${GET_CURRENT_USER}`]

    return {
      accountSetup: {
        id: CURRENT_USER.id,
        first_name: CURRENT_USER.first_name,
        last_name: CURRENT_USER.last_name
      },
      errorMessage: null,
      rules
    }
  },

  methods: {
    ...mapMutations(CURIO, [
      'setProgress'
    ]),

    updateUser () {
      this.$refs['accountSetup'].validate((valid) => {
        if (valid) {
          const user = {
            id: this.accountSetup.id,
            first_name: this.accountSetup.first_name,
            last_name: this.accountSetup.last_name
          }
          api.updatePartialUser(user.id, {
            first_name: user.first_name,
            last_name: user.last_name
          })
          .catch(err => {
            this.$message({
              duration: CONSTANTS.MESSAGE_DURATION,
              message: getAPIErrorMsg(err),
              showClose: true,
              type: 'error'
            })
          })
          this.$router.push({ name: 'curio-account-content' })
        } else {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: this.errorMessage,
            showClose: true,
            type: 'error'
          })
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.el-form-item {
  .el-input {
    .el-input__inner {
      .input();
    }
  }
}

form {
  .flex-box();
  .flex-direction(row);
  .justify-content-space-between();

  .complete-profile {
    .flex(1, 1, 640px);
    height: 100%;
    max-width: 640px;
  }
}
</style>
