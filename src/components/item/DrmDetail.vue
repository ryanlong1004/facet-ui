<template>
  <div class="drm-details timeline-layout horizontal-timelines-flex-wrapper">
    <div class="top">
      <div class="audio-playback">
        <div class="waveform">
          <div class="center-container">
            <i class="far fa-lock-alt"></i>
            <div class="subtitle">DRM Protected</div>
          </div>
        </div>
      </div>

      <div class="right-area">
        <div class="center-container">
          <i class="far fa-lock-alt"></i>This file is protected with Digital Rights Management and cannot be analyzed.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'drm-detail'
}
</script>

<style lang="less" scoped>
  @import (reference) '../../styles/_variables';
  @import (reference) '../../styles/_mixins';

  .drm-details {
    .flex-container-column();

    height: 100%;
    overflow: hidden;
    padding-left: 30px;
    padding-right: 30px;
    padding-top: 30px;

    .top {
      .flex-box();
      .flex-direction(row);
      min-height: 335px;
      margin-bottom: 30px;
      width: 100%;

      .audio-playback {
        border: 1px solid @box-border-grey;
        .flex-box();
        .flex-direction(column);
        .justify-content-space-between();

        .waveform {
          .flex-box();
          .flex-direction(column);

          background-image: linear-gradient(299deg, @color-saas-pro, @color-accent);
          height: 335px;
          width: 581px;

          .center-container {
            .fa-lock-alt {
              color: @color-base;

              font-size: 180px;
              font-weight: 300;

              line-height: 1.21;
              letter-spacing: normal;
              opacity: 0.17;
              text-align: center;
            }

            .subtitle {
              color: @color-base;
              opacity: 0.17;
              text-align: center;
            }
          }
        }

      }

      .right-area {
        .flex-box();

        background-color: @color-tone-light;
        color: @color-primary;
        font-size: 15px;
        font-style: italic;
        line-height: 1.2;
        margin-left: 20px;

        width: calc(~'100vw - 581px');

        .fa-lock-alt {
          margin-right: 6px;
        }

        .center-container {
          font-size: 13px;
          padding-left: 10px;
          padding-right: 10px;
        }
      }
    }

    .center-container {
      margin: auto;
    }
  }
</style>
