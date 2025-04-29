<template>
  <div>
    <div class="el-upload-list__item-name uploaded-file-list-file__details">
      <slot name="details"></slot>
    </div>

    <el-progress
      v-if="percentage > 0"
      :text-inside="false"
      :show-text="false"
      :stroke-width="strokeWidth"
      :percentage="percentage"
      :color="backgroundColor"
    ></el-progress>
  </div>
</template>

<script>
export default {
  name: 'progress-indicator-bar',

  props: {
    percentage: {
      type: Number,
      default: 0
    },
    strokeWidth: {
      type: Number,
      default: 2
    }
  },

  data () {
    return {
      backgroundColor: this.CONSTANTS.DEFAULT_BACKGROUND_COLOR_PROGRESS_BAR
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.el-upload-list {
  &.progress-indicator-bar {
    margin: 0 0 19.8px;
    width: 100%;

    .el-upload-list__item {
      margin: 0;

      &.is-cancelled {
        .el-upload-list__item-name {
          padding-right: 48px;
        }
      }

      .el-upload-list__item-name {
        .flex-container-between();
        margin-right: 0;
        padding: 11px 15px 5px 8.5px;
        pointer-events: all;

        p {
          font-size: 12px;
          letter-spacing: normal;
          line-height: 1.17;
          margin: 0;

          span {
            &.uploaded-file__filename {
              display: block;
              font-size: 9px;
              font-weight: 900;
              letter-spacing: 0.72px;
              line-height: 1.11;
              text-transform: uppercase;

              span {
                text-transform: none;
              }
            }

            &.progress-percentage {
              display: block;
              font-size: 15px;
              letter-spacing: normal;
              line-height: 1.2;
            }

            &.cancelled-job {
              color: @color-alert;
              font-size: 9px;
              text-transform: uppercase;
            }
          }

          &.files-processed {
            margin-top: -5px;

            .el-tag {
              margin-right: 5px;
            }

            i {
              display: inline-block;
              font-size: 15px;
              margin-left: 20px;
              position: relative;
              top: 1px;

              &:hover {
                color: @color-alert;
                cursor: pointer;
              }
            }
          }
        }
      }
    }

    .status-icon {
      font-size: 15px;

      &--complete {
        color: @color-accent;
      }
      &--error {
        color: @color-alert;
      }
    }

    .el-progress {
      top: 42px;

      .el-progress-bar__outer {
        height: 2px !important; // Elements UI adds this inline
      }
    }
  }
}
</style>
