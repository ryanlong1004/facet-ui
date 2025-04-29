<template>
  <div class="content content-support">
    <h1>How can we help you?</h1>
    <div class="flex-container">
      <div class="help-box">
        <div class="content">
          <i class="fal fa-question-circle"></i>
          <h2>Wasabi AiR™ help desk</h2>
          <p>Drop us a line and we will send help right away.</p>
          <a class="button-link" href="mailto:support@wasabi.com?subject=Wasabi AiR Support">
            <span>Email Support</span>
          </a>
          <a
            class="button-link"
            href="https://wasabi.com/help/"
            target="_blank"
          >
            <span>Visit Support</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CONSTANTS } from 'src/constants'

export default {
  data () {
    return {
      SALESFORCE_LIVE_CHAT: CONSTANTS.SALESFORCE_LIVE_CHAT
    }
  },

  mounted: function () {
    if (!window._laq) { window._laq = [] }
    window._laq.push(function () {
      liveagent.showWhenOnline(CONSTANTS.SALESFORCE_LIVE_CHAT, document.getElementById('online'))
      liveagent.showWhenOffline(CONSTANTS.SALESFORCE_LIVE_CHAT, document.getElementById('offline'))
    })
    liveagent.init('https://d.la2-c1-phx.salesforceliveagent.com/chat', '57241000000LPis', '00D410000005dWH')
  },
  name: 'admin-support'
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    &.content-support {
      padding-top: 10px;

      h1 {
        font-weight: 300;
        font-size: 32px;
        line-height: 0.56;
        margin: 24px 0 26px;
        text-align: center;
      }

      i {
        color: @color-accent-calm;
        font-size: 70px;
        line-height: 1.2px;
      }

      .el-button,
      .el-button--primary,
      .button-link {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 1.1px;
        line-height: 1.36;
        margin: 0;
        padding-bottom: 8px;
        padding-top: 8px;
        width: 211.8px;
      }

      .flex-container {
        .flex-container-center();
        .justify-content-space-between();

        .help-box {
          .flex-container-center();
          .flex-direction(column);
          .justify-content-center();
          background-color: @background-grey;
          flex: 1 1 auto;
          height: 366.8px;
          margin: 0 7.6px 15.2px;
          padding: 0 10px;
          text-align: center;

          &:first-of-type {
            margin-left: 0;
          }

          &:last-of-type {
            margin-right: 0;
          }

          .content {
            margin: 0;
            padding: 0;
            width: 300px;
          }

          i {
            margin: 0;

            &::before {
              line-height: 1;
            }
          }

          h2 {
            font-size: 18px;
            font-weight: bold;
            line-height: 1;
            margin: 28px 0 5px;
          }

          p {
            font-size: 13px;
            line-height: 1.33;
            margin-bottom: 32px;
          }

          .button-link {
            display: inline-block;
            margin-bottom: 10px;
          }

          .el-button.warning {
            background-color: @color-tone;
            border-color: @color-tone;
            color: @text-lighter;
          }

          .el-button.el-button--primary,
          .button-link {
            background-color: @color-accent-calm;
            border-color: @color-accent-calm;

            &:hover {
              background-color: lighten(@color-accent-calm, 5%);
            }
          }
        }
      }

      .message {
        i {
          color: @color-accent;
          flex: 9%;
        }

        .content {
          .flex-container-center();
          .flex-direction(column);
          .align-items-start();
          flex: 80%;
          height: 70px;
          margin: 0 25px;

          p {
            line-height: 1.33;
            margin: 4px 0 0;
          }
        }
      }
    }
  }
}
</style>
