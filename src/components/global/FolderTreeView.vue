<template>
  <div class="folder-tree">
    <ul>
      <li v-for="(folder, index) in sortedFolderList" :key="index">
        <div class="folder-info" :class="{'top-level': sortedFolderList[0], 'last-level': !hasChildren(folder)}">
          <i
            v-if="hasChildren(folder)"
            class="folder-expand fal fa-angle-right"
            @click="toggleExpanded(folder)"
            :class="{'expanded': folder.expanded}"
          ></i>
          <div :class="{ selected: folder.selected }" @click="selectFolder(folder)">
            <i class="fas fa-folder"></i>
            <span v-if="folder.path === '/'">GrayMeta Storage</span>
            <span v-else>{{ folder.name }}</span>
          </div>
        </div>
        <folder-tree-view
          v-if="folder.children.length > 0"
          :folders="folder.children"
          @folder-selected="selectFolder"
          :class="{'expanded': folder.expanded}"
        ></folder-tree-view>
      </li>
    </ul>
  </div>
</template>

<script>
import { folderSorter } from 'src/sort-helper'

export default {
  name: 'folder-tree-view',

  props: {
    folders: {
      type: Array,
      default: []
    }
  },

  computed: {
    sortedFolderList () {
      return [...this.folders].sort(folderSorter)
    }
  },

  methods: {
    hasChildren (folder) {
      return folder.children.length
    },

    selectFolder (folder) {
      this.$emit('folder-selected', folder)
    },

    toggleExpanded (folder) {
      folder.expanded = !folder.expanded
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.folder-tree {
  ul {
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      margin-bottom: 3px;

      i {
        color: @color-info;
        display: inline-block;
        font-size: 18px;
        margin: 0 5.4px 0 0;

        &.folder-expand {
          font-weight: 500;
          margin-top: -2px;

          &:hover {
            cursor: pointer;
          }

          &.expanded {
            transform: rotate(90deg);
          }
        }
      }

      span {
        display: inline-block;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.33;
        position: relative;
        top: -2px;
      }

      .selected {
        > i,
        > span {
          color: @color-accent;
        }
      }

      div.folder-info {
        .flex-container();

        &.last-level {
          margin-left: 13px;

          &.top-level {
            div {
              &:hover {
                cursor: cursor;
              }
            }
          }
        }

        div {
          margin-left: 5px;
          margin-top: 1px;

          &:hover {
            cursor: pointer;
          }
        }

        + .folder-tree {
          display: none;
          margin-top: 3px;

          &.expanded {
            display: block;
          }

          ul {
            margin-left: 24.8px;
            margin-bottom: 3px;

            li {
              &:last-of-type {
                margin-bottom: 0;
              }
            }
          }
        }
      }
    }
  }
}
</style>
