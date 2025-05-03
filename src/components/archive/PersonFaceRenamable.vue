<template>
  <div class="person-face-renamable" :class="{ 'dark-mode': darkMode }" @click.stop="handleClick">
    <slot name="overlay"></slot>
    <person-face-image
      v-if="!hideImage"
      :image-url="faceImageUrl"
      border-radius="4px"
      height="50px"
      width="50px"/>
    <div v-if="!editMode">
      {{ personName }} <pencil-edit-button tooltip-text="Click to rename" :edit-mode="false" @on-click="handlePencilClick" />
    </div>
    <div v-else>
      <person-rename-typeahead
        :person-name="personName"
        :disabled="savingPersonRename"
        @on-cancel="renameCancel"
        @on-submit="renameSubmit"
        @on-select="renameSelect"
      />
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

import PencilEditButton from 'src/components/global/PencilEditButton.vue'
import PersonFaceImage from './PersonFaceImage.vue'
import PersonRenameTypeahead from 'src/components/people-faces/PersonRenameTypeahead.vue'

export default {
  name: 'person-face-renamable',
  props: {
    personId: {
      type: String,
      required: true
    },
    personName: {
      type: String,
      required: true
    },
    faceImageUrl: {
      type: String,
      required: true
    },
    hideImage: {
      type: Boolean,
      default: false
    },
    // is this on top of a dark background?
    darkMode: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      editMode: false,
      savingPersonRename: false
    }
  },
  components: {
    PencilEditButton,
    PersonFaceImage,
    PersonRenameTypeahead
  },
  methods: {
    handleClick () {
      this.$emit('click')
    },
    handlePencilClick ($event) {
      this.editMode = true
      this.$nextTick(() => {
        const input = this.$el.querySelector('input[type="text"]')
        if (input) {
          input.select()
        }
      })
    },
    renameCancel () {
      this.editMode = false
    },
    renameSubmit (newName) {
      this.$emit('renamed', newName)
      this.editMode = false
    },
    renameSelect (selectedPerson) {
      this.$emit('renamed-existing', selectedPerson)
      this.editMode = false
    }
  }
}
</script>

<style lang="less">
@import '../../styles/_variables.less';
@import '../../styles/_mixins.less';
.person-face-renamable {
  .flex-container();
  color: @color-primary;
  font-size: 11px;
  font-weight: 700;
  position: relative;
  .person-face-image {
    .flex(0, 0, 50px);
    margin-right: 10px;
  }
  .el-input {
    .el-input__inner {
      font-size: 12px;
      height: 26px;
      padding: 3px;
    }
  }
  &.dark-mode {
    color: @color-base;
    .pencil-button > i.fa-pencil {
      color: @color-accent;
      &:hover {
        color: @color-base;
      }
    }
    .el-input {
      
      .el-input__inner {
        background-color: @color-gray-shadow;
        border-color: @color-tone-medium;
        color: @color-base;
        font-size: 12px;
        height: 26px;
        padding: 3px;
      }    
    }
  }
}
</style>
