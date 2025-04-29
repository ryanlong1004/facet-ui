<template>
  <div class="account-success">
    <div class="progress-status">
      <ul>
        <li class="fade-in-animated">Complete Profile</li>
        <li class="fade-in-animated">Add content</li>
        <li class="fade-in-animated">Your team</li>
        <li class="fade-in-animated">Analyzing content</li>
      </ul>
    </div>
    <div class="success-experience fade-in-animated">
      <h2>Congratulations!</h2>
      <h2>You're ready to start using Curio</h2>

      <p>We are currently analyzing your content with our AI engines – this process may take several hours depending on how much content was uploaded.</p>
      <p>While we’re processing, go ahead and jump in.</p>
      <router-link :to="{ path: '/'}" class="button-link">
        Great job, go to Curio
        <i class="fal fa-arrow-right"></i>
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState } from 'vuex'
import { CURIO, SESSION } from 'src/store/storeModules'
import { SET_SAAS_ONBOARDED } from 'src/store/modules/session/session'
import { CONSTANTS } from 'src/constants'
import api from 'src/api'

export default {
  name: 'curio-account-success',

  async beforeMount () {
    this.setProgress('success')
    // set the 'onboarded' feature flag to true so users won't see it again
    try {
      await api.updateFeatureFlag(CONSTANTS.FEATURE_FLAGS.SAAS_ONBOARDED, true)
      this.$store.commit(`${SESSION}/${SET_SAAS_ONBOARDED}`, true)
    } catch (err) {
      console.error('err setting onboarded flag to true', err)
    }
  },

  methods: {
    ...mapMutations(CURIO, [
      'setProgress'
    ])
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

@keyframes fadeIn {
  from { opacity: 0}
  to { opacity: 1 }
}

&.fade-in-animated {
  animation: fadeIn .25s forwards;
  opacity: 0;
}

.account-success {
  .flex-container();
  margin-top: 48.8px;
}

.progress-status {
  flex: 0 0 415px;
  margin-right: 28.5px;
  padding: 0;

  ul {
    list-style: none;
    margin: 0 0 0 40px;
    padding: 15px 0 0 0;

    li {
      font-size: 35px;
      font-weight: 300;
      line-height: 1.31;
      margin-bottom: 50px;
      position: relative;

      &::before {
        .rel-pos(2px, auto, auto, -16px);
        color: @color-accent;
        content: '\f058';
        font-family: @default-font-icon-family;
        font-size: 40px;
        font-weight: 300;
        line-height: 1.2;
      }

      &.fade-in-animated {
        &:nth-of-type(2) {
          animation-delay: 1s;
        }

        &:nth-of-type(3) {
          animation-delay: 1.5s;
        }

        &:nth-of-type(4) {
          animation-delay: 2s;
        }
      }
    }
  }
}

.success-experience {
  .flex-container-center();
  .flex-direction(column);
  .align-items-start();
  border-left: 1px solid @color-tone;
  flex: 1;
  min-height: 368px;
  padding: 0 45.5px;
  text-align: left;

  h2 {
    font-size: 35px;
    font-weight: 100;
    line-height: 1.32;
    margin: 0 0 5px;

    &:last-of-type {
      margin-bottom: 17px;
    }
  }

  p {
    font-size: 18px;
    line-height: 1.33;
    margin-top: 0;
  }

  &.fade-in-animated {
    animation-delay: 2.5s;
  }
}
</style>
