<template>
  <el-tooltip placement="top" :content="tooltipText" :open-delay="openDelay">
    <div class="pencil-button" @click.stop="handleClick">
      <i v-if="!editMode" class="far fa-pencil"></i>
      <i v-else class="far fa-times"></i>
    </div>
  </el-tooltip>
</template>

<script>
import { CONSTANTS } from 'src/constants'

export default {
  name: 'pencil-edit-button',
  props: {
    tooltipText: {
      type: String,
      default: 'Click to edit'
    },
    editMode: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    openDelay () {
      return CONSTANTS.TOOLTIP.OPEN_DELAY
    }
  },
  methods: {
    handleClick () {
      this.$emit('on-click')
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';

.pencil-button {
  cursor: pointer;
  font-size: 12px;
  display: inline-block;
  padding: 2px;
  > i {
    color: @color-primary;
  }
  &:hover {
    > i {
      color: @color-accent;
    }
  }
}
</style>
