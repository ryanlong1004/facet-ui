<template>
  <div id="trial-banner" v-if="$hasAnyScope(SCOPES.BILLING_ADMIN) && showBanner">
    <p v-if="isCancellationMode">{{ trialMessage }} <strong class="restore-link" @click="showRestore = true">Restore my account</strong>.</p>
    <p v-else>{{ trialMessage }} <a @click="tryUpgrade">Upgrade now</a>.</p>
    <el-dialog :visible.sync="showRestore" title="Restore subscription" width="500px" class="restore-dialog">
      <div v-loading="restoring">
        <p>{{ trialMessage }}</p>
        <div class="button-row">
          <el-button type="text" size="mini" @click="showRestore = false">Close</el-button>
          <el-button type="primary" size="mini" :disabled="restoring" @click="doRestore">Restore my subscription</el-button>
        </div>
      </div>
    </el-dialog>
    <el-dialog :visible.sync="showUpgrade" title="Account Upgrade" width="354px" class="upgrade-dialog">
      <p>You can upgrade your account after completing the on-boarding process.</p>
      <div class="button-row">
        <el-button type="primary" size="mini" @click="showUpgrade = false">OK</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import moment from 'moment'
import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { DASHBOARD, SESSION } from 'src/store/storeModules'
import { FETCH_BILLING, GET_USER_BILLING, GET_IS_SAAS_TRIAL_MODE } from 'src/store/modules/dashboard/dashboard'
import { GET_SAAS_ONBOARDED } from 'src/store/modules/session/session'
import LocationEnforcerMixin from './LocationEnforcerMixin'

export default {
  name: 'trial-banner',

  mixins: [LocationEnforcerMixin],

  beforeMount () {
    this.$store.dispatch(`${DASHBOARD}/${FETCH_BILLING}`)
  },

  data () {
    return {
      restoring: false,
      showRestore: false,
      showUpgrade: false
    }
  },

  computed: {
    ...mapGetters(DASHBOARD, {
      billingInfo: GET_USER_BILLING,
      isSaasTrialMode: GET_IS_SAAS_TRIAL_MODE
    }),

    showBanner () {
      return this.isSaasTrialMode || this.isCancellationMode
    },

    isCancellationMode () {
      return _.get(this.billingInfo, 'subscription.cancel_at_period_end', false)
    },

    remainingTrialDays () {
      const today = moment().endOf('day')
      const endDate = moment(_.get(this.billingInfo, 'trial_ends')).endOf('day')
      const duration = moment.duration(endDate.diff(today))
      const remainingDays = duration.asDays()
      return remainingDays
    },

    trialMessage () {
      if (this.isCancellationMode) {
        const cycleEndDate = _.get(this.billingInfo, 'subscription.current_period_end')
        const endDate = moment.unix(cycleEndDate).format('MM/DD/YYYY')
        return `Your account is scheduled to be cancelled effective ${endDate}.`
      }
      if (this.remainingTrialDays < 0) {
        return 'Your trial has expired.'
      } else if (this.remainingTrialDays === 0) {
        return 'Your trial ends today.'
      } else {
        return `Thanks for trying Curio! You have ${this.remainingTrialDays} days remaining on your free trial.`
      }
    },

    restoreButtonEnabled () {
      return this.restoreConfirmText.toLowerCase() === RESTORE_STRING.toLowerCase()
    }
  },

  methods: {
    doRestore () {
      this.restoring = true
      api.cancelSubscription(false)
        .then(response => {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'Your subscription has been restored.',
            showClose: true,
            type: 'success'
          })
          this.showRestore = false
          this.$store.dispatch(`${DASHBOARD}/${FETCH_BILLING}`)
          this.$router.push({ name: 'admin-dashboard' })
        })
        .catch(err => {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'Error restoring your subscription. Please contact us for help.',
            showClose: true,
            type: 'error'
          })
        })
        .finally(() => {
          this.restoring = false
        })
    },

    tryUpgrade () {
      if (this.$store.getters[`${SESSION}/${GET_SAAS_ONBOARDED}`]) {
        this.$router.push({ name: 'admin-payment' })
      } else {
        this.showUpgrade = true
      }
    }
  }
}
</script>

<style lang="less">
/* Created non-scoped styles for Elements UI appended classes */
.restore-dialog {
  .el-dialog {
    .el-dialog__body {
      padding-top: 0;
    }
  }
}

.upgrade-dialog {
  .el-dialog {
    .el-dialog__header {
      padding: 9px 9px 9px 16.7px;

      .el-dialog__headerbtn {
        top: 11px;
      }
    }

    .el-dialog__body {
      padding: 14px 22px 22px 18px;
    }
  }
}
</style>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

#trial-banner {
  .flex-container();
  .justify-content-center();
  background: @color-progress-bar;
  color: @color-base;
  padding: 3px;
  position: relative;

  p {
    font-size: 15px;
    line-height: 1.33;
    margin: 0;
    padding: 0;
    text-align: center;

    a {
      color: @color-base;
      cursor: pointer;
      font-weight: 700;
    }
  }

  i {
    .abs-pos(11px, 10px, auto, auto);
  }

  .restore-link {
    cursor: pointer;
    font-weight: bold;
  }

  .upgrade-dialog,
  .restore-dialog {
    .el-dialog__body {
      p {
        font-size: 13px;
        margin: 0 0 15px 0;
        padding: 0;
        text-align: left;
      }
      .button-row {
        .flex-container-end();
        margin-top: 25px;
      }
    }
  }

  .upgrade-dialog {
    .el-dialog__body {
      p {
        max-width: 225px;
      }

      .button-row {
        margin-top: 0;

        button {
          min-width: 94px;
        }
      }
    }
  }
}
</style>
