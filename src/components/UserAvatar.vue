<template>
  <div class="update-photo">
    <i class="far fa-pencil" @click.stop="showAvatarUpload = true"></i>
    <div class="has-image">
      <div class="avatar">
        <img
          :alt="getUsersName"
          :src="avatarUrl"
          v-if="avatarUrl"
          />
        <avatar
          :backgroundColor="backgroundColor"
          :username="getUsersName"
          v-else
        >
        </avatar>
      </div>
    </div>
    <avatar-upload
      :headers="uploadHeaders"
      :height="200"
      :url="avatarPostUrl"
      :value.sync="showAvatarUpload"
      :width="200"
      @crop-upload-fail="cropUploadFail"
      @crop-upload-success="cropUploadSuccess"
      class="avatar-uploader"
      field="avatar"
      lang-type="en"
      :lang-ext="languageConfig"
      v-model="showAvatarUpload"
    >
    </avatar-upload>
  </div>
</template>

<script>
import api from 'src/api'
import Avatar from 'vue-avatar'
import avatarUpload from 'vue-image-crop-upload/upload-2.vue'
import { CONSTANTS } from 'src/constants'
import { SESSION } from 'src/store/storeModules'
import { GET_CURRENT_USER, GET_AVATAR, GET_AUTH_TOKEN, SET_AVATAR } from 'src/store/modules/session/session'

// custom messaging for avatar uploader
const languageConfig = {
  error: {
    onlyImg: 'File must be a .jpg or .png image',
    outOfSize: 'Image exceeds the size limit of ',
    lowestPx: 'Image dimensions are too small, must be at least '
  }
}

export default {
  name: 'user-avatar',

  components: {
    'avatar-upload': avatarUpload,
    Avatar
  },

  computed: {
    currentUser () {
      return this.$store.getters[`${SESSION}/${GET_CURRENT_USER}`]
    },

    avatarPostUrl () {
      return '/api/data/users/' + this.currentUser.id + '/avatar'
    },

    avatarUrl () {
      return this.$store.getters[`${SESSION}/${GET_AVATAR}`]
    },

    getUsersName () {
      return this.currentUser.first_name + ' ' + this.currentUser.last_name
    },

    uploadHeaders () {
      return {
        'Authorization': 'Bearer ' + this.$store.getters[`${SESSION}/${GET_AUTH_TOKEN}`]
      }
    }
  },

  data () {
    return {
      backgroundColor: CONSTANTS.DEFAULT_BACKGROUND_COLOR,
      showAvatarUpload: false,
      languageConfig
    }
  },

  methods: {
    cropUploadSuccess (jsonData, field) {
      this.$store.commit(`${SESSION}/${SET_AVATAR}`, jsonData)
      this.showAvatarUpload = false
    },

    cropUploadFail (status, field) {
      this.$message({
        duration: CONSTANTS.MESSAGE_DURATION,
        message: status,
        showClose: true,
        type: 'error'
      })
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';
@import '~src/styles/vue-image-crop-upload';

.update-photo {
  .flex-container-center();
  .align-items-start();
  flex: 1 1 120px;
  max-width: 120px;
  position: relative;

  i {
    .abs-pos(2px, 0, auto, auto);
    color: @text-dark;
    cursor: pointer;
    font-size: 14px;
    text-align: right;

    &:hover {
      color: @color-accent;
    }
  }

  .has-image {
    display: flex;
    flex-direction: column;
    padding-top: 20px;
    width: 120px;

    .avatar {
      .size(111px, 111px);
      border-radius: 50%;
      overflow: hidden;

      .vue-avatar--wrapper {
        height: 111px !important;
        width: 111px !important;
      }

      img {
        .size(111px, 111px);
      }
    }
  }

  .avatar-uploader {
    .flex-container-center();
    .size(111px, 111px);
    background-color: transparent;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    z-index: auto;
  }
}

.curio {
  .update-photo {
    flex: 1 1 180px;
    max-width: 180px;

    .has-image {
      padding-top: 0;
      width: 180px;

      .avatar {
        .size(180px, 180px);

      .vue-avatar--wrapper {
        height: 180px !important;
        width: 180px !important;
      }

        img {
          .size(180px, 180px);
        }
      }
    }
  }
}
</style>
