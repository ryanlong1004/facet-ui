<template>
  <div class="progress-bar">
    <div class="steps">
      <div class="step">
        <span>Account Setup</span>
      </div>
      <div class="step">
        <span>Content</span>
      </div>
      <div class="step">
        <span>Your Team</span>
      </div>
      <div class="step">
        <span>Success</span>
      </div>
    </div>
    <div class="bar">
      <div
        :key="n"
        class="step"
        v-for="n of (steps.length - 1)"
      ></div>
      <div class="bar-filling" :style="barStyle"></div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { CURIO } from 'src/store/storeModules'

export default {
  name: 'curio-progress-bar',

  computed: {
    ...mapState(CURIO, [
      'step',
      'steps'
    ]),

    barStyle () {
      return {
        width: ((this.step / (this.steps.length - 1)) * 100) + '%'
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.progress-bar {
  .align-items-center();
  .flex-box();
  .flex-direction(column);
  background-color: @color-tone-light;
  min-height: 44px;
  width: 100%;

  .bar,
  .steps {
    margin: 0 auto;
    max-width: 1003.5px;
    width: 100%;
  }

  .bar {
    .step {
      border-right: 1px solid @color-tone-light;
      width: 100%;
    }
  }

  .steps {
    .flex-box();
    .justify-content-space-between();
    margin-bottom: 6px;
    margin-top: 3px;
    width: 100%;

    .step {
      .flex(1, 0, 0);

      &:first-of-type {
        .flex(0.5, 1, 0);

        span {
          text-align: left;
        }
      }

      &:last-of-type {
        .flex(0.5, 1, 0);

        span {
          text-align: right;
        }
      }

      span {
        .base-font-uppercase();
        color: @color-primary;
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        text-align: center;
        width: 100%;
      }
    }
  }
}
</style>
