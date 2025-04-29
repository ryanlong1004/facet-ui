<template>
  <!-- new project form -->
  <el-form
    class="profile-form"
    :model="profileForm"
    :rules="profileValidationRules"
    inline-message
    label-position="top"
    label-width="100%"
    ref="profile-form"
    status-icon
    validate-on-rule-change
  >
    <h2 class="new-title" v-if="!profileId">Create a new extractor profile</h2>
    <el-form-item prop="name" label="Profile Name (required)">
      <el-input
        class="profile-name"
        placeholder="Required"
        ref="name"
        v-model="profileForm.name"
        @keyup.enter.native="saveForm"
      >
      </el-input>
    </el-form-item>

    <el-form-item prop="description" label="Description">
      <el-input
        placeholder="Optional"
        ref="description"
        v-model="profileForm.description"
        @keyup.enter.native="saveForm"
      >
      </el-input>
    </el-form-item>

    <el-button
      @click="saveForm"
      :disabled="isProjectSubmitDisabled"
      type="primary"
      size="mini">
      <i class="fas fa-check"></i> Save and Continue
    </el-button>
    <el-button
      v-if="profileId"
      @click="cancelEdits"
      :disabled="isProjectSubmitDisabled"
      type="text"
      size="mini">
      or cancel edits
    </el-button>
  </el-form>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapActions } from 'vuex'
import Validator from 'async-validator'

import { EXTRACTORS } from 'src/store/storeModules'
import {
  GET_EXTRACTOR_PROFILES,
  CREATE_EXTRACTOR_PROFILE,
  UPDATE_EXTRACTOR_PROFILE
} from 'src/store/modules/admin/extractors'

const profileValidationRules = {
  name: [
    {
      message: 'Please provide a profile name.',
      required: true,
      trigger: 'blur'
    }
  ]
}
const validator = new Validator(profileValidationRules)

export default {
  name: 'profile-form',
  watch: { // validator errors when using `this.$watch`
    profileForm: {
      handler (newValue, oldValue) {
        validator.validate(newValue, (errors, fields) => {
          this.isValidForm = !errors
        })
      },
      deep: true
    }
  },
  mounted () {
    if (this.profileId) {
      const p = this.profiles.find(p => p.id === this.profileId)
      if (p) {
        this.profileForm.name = p.name
        this.profileForm.description = p.description
      }
    } else {
      this.clearForm()
    }
  },
  props: {
    profileId: {
      type: String,
      required: false
    }
  },
  data () {
    return {
      profileForm: {
        name: '',
        description: ''
      },
      profileValidationRules
    }
  },
  computed: {
    ...mapGetters(EXTRACTORS, {
      profiles: GET_EXTRACTOR_PROFILES
    }),
    isProjectSubmitDisabled () {
      return this.profileForm.name.length === 0
    }
  },
  methods: {
    ...mapActions(EXTRACTORS, {
      doCreateExtractorProfile: CREATE_EXTRACTOR_PROFILE,
      doUpdateExtractorProfile: UPDATE_EXTRACTOR_PROFILE
    }),
    clearForm () {
      this.$refs['profile-form'].clearValidate()
      this.profileForm = {
        name: '',
        description: ''
      }      
    },
    async saveForm () {
      this.$refs['profile-form'].validate(async (valid) => {
        if (valid) {
          try {
            if (this.profileId) { // updating existing profile...
              await this.doUpdateExtractorProfile({
                profileId: this.profileId,
                name: this.profileForm.name,
                description: this.profileForm.description
              })
            } else { // creating new profile
              await this.doCreateExtractorProfile({
                name: this.profileForm.name,
                description: this.profileForm.description
              })
              const newProfile = this.profiles.find(p => p.name === this.profileForm.name)
              if (newProfile) {
                this.$router.push({
                  name: 'extractor-profile',
                  params: {
                    id: newProfile.id
                  }
                })
              }
            }
            this.cancelEdits()
          } catch (err) {
            console.error(err)
          }
        }
      })
    },
    cancelEdits () {
      this.clearForm()
      this.$emit('close')
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.profile-form {
  .new-title {
    color: @text-dark;
    font-size: 16px;
    margin: 0 0 20px 0;
    padding: 0;
  }
}
</style>
