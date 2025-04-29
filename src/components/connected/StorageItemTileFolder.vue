<template>
  <div class="folder-list__folder">
    <div class="folder-information" @click="$emit('select')">
      <i class="fas fa-folder"></i>
      <span>{{ folder.name }}</span>
    </div>
    <div class="actions">
      <el-checkbox :checked="folder.selected" @change="$emit('toggleCheckbox')"></el-checkbox>
      <el-dropdown
        placement="bottom-start"
        trigger="click"
        @command="command"
      >
        <el-button>
          <i class="fal fa-ellipsis-h"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item :command="{ type: 'download', item: folder }">
            <i class="far fa-download"></i>
            Download
          </el-dropdown-item>
          <el-dropdown-item :command="{ type: 'delete', item: folder }">
            <i class="far fa-trash-alt"></i>
            Delete
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
export default {
  name: 'storage-folder-item-tile',

  props: {
    command: {
      type: Function,
      required: true
    },

    folder: {
      type: Object,
      required: true
    }
  }
}
</script>

<style lang="less">
@import '../../styles/file-browser.less';

.el-dropdown-menu {
  .el-dropdown-menu__item {
    font-size: 10px !important;
    font-weight: 900;
    letter-spacing: 0.8px;
    line-height: 1.33;
    margin-bottom: 13px;
    padding: 0 8px;
    text-transform: uppercase;

    &:last-of-type {
      margin-bottom: 0;
    }

    i {
      display: inline-block;
      font-size: 14px;
      margin-right: 4px;
      text-align: center;
      width: 24px;
    }
  }
}
</style>
