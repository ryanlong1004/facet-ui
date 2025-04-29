<template>
  <div class="content">
    <saas-plan-changing v-if="isChangingSaasPlan"></saas-plan-changing>
    <div class="content-account" v-else>
      <div class="header">
        <h2>
          <template v-if="!isOnboarded">Select your plan</template>
          <template v-else>Edit plan</template>
        </h2>
        <el-button size="mini" class="cancel-button" @click="showCancel = true">Cancel my subscription</el-button>
      </div>
      <div class="select-plan">
        <div class="plan">
          <div class="plan-header"></div>
          <div class="plan-content alternate">
            <h2>Curio {{ BILLING_PLAN_OPTION_1 }}</h2>
            <p class="cost">
              <sup>$</sup>
              <span>{{ BILLING_AMOUNT_OPTION_1 }}</span>
              <sub>/MO</sub>
            </p>
            <p class="types">Docs &amp; Images</p>
            <p>Curio for smaller teams that are just getting started with AI.</p>
            <el-button
              @click="changeUserPlan(BILLING_PLAN_OPTION_1)"
              type="primary"
              :class="{ 'edit-mode': isOnboarded && billingInfo.plan === BILLING_PLAN_OPTION_1 }"
              :disabled="billingInfo.plan === BILLING_PLAN_OPTION_1"
            >
              <template v-if="isOnboarded">
                <template v-if="billingInfo.plan === BILLING_PLAN_OPTION_2">Change to Curio {{ BILLING_PLAN_OPTION_1 }}</template>
                <template v-else>
                  <i class="fal fa-check-circle"></i>
                  Your Current Plan
                </template>
              </template>
              <template v-else>Select Curio {{ BILLING_PLAN_OPTION_1 }}</template>
            </el-button>
          </div>
          <div class="plan-content">
            <h2>Curio {{ BILLING_PLAN_OPTION_2 }}</h2>
            <p class="cost">
              <sup>$</sup>
              <span>{{ BILLING_AMOUNT_OPTION_2 }}</span>
              <sub>/MO</sub>
            </p>
            <p class="types">Docs, Images &amp; Video</p>
            <p>Powerful AI tools for small to medium-sized businesses.</p>
            <el-button
              @click="changeUserPlan(BILLING_PLAN_OPTION_2)"
              type="primary"
              :class="{ 'edit-mode': isOnboarded && billingInfo.plan === BILLING_PLAN_OPTION_2 }"
              :disabled="billingInfo.plan === BILLING_PLAN_OPTION_2"
            >
              <template v-if="isOnboarded">
                <template v-if="billingInfo.plan === BILLING_PLAN_OPTION_1">Change to Curio {{ BILLING_PLAN_OPTION_2 }}</template>
                <template v-else>
                  <i class="fal fa-check-circle"></i>
                  Your Current Plan
                </template>
              </template>
              <template v-else>Select Curio {{ BILLING_PLAN_OPTION_2 }}</template>
            </el-button>
          </div>
        </div>
        <div class="plan plan-block">
          <div class="plan-header">
            <h3>Content</h3>
            <p>1 Credit = 1 File, Document Page or Image</p>
          </div>
          <div class="plan-content alternate">
            <p>2,500 credits*/month</p>
          </div>
          <div class="plan-content">
            <p>5,000 credits*/month</p>
          </div>
        </div>
        <div class="plan">
          <div class="plan-header">
            <h3>Video &amp; Audio</h3>
          </div>
          <div class="plan-content alternate">
            <p>Additional Cost</p>
          </div>
          <div class="plan-content">
            <p>10 runtime hours/month included</p>
          </div>
        </div>
        <div class="plan">
          <div class="plan-header">
            <h3>Storage</h3>
          </div>
          <div class="plan-content alternate">
            <p>250GB storage</p>
          </div>
          <div class="plan-content">
            <p>1TB storage</p>
          </div>
        </div>
        <div class="plan">
          <div class="plan-header">
            <h3>AI-Driven Insights</h3>
          </div>
          <div class="plan-content alternate">
            <ul>
              <li>Visual Tags</li>
              <li>Celebrity recognition</li>
              <li>Person recognition</li>
              <li>Speech-to-text</li>
              <li>Visual text (OCR)</li>
              <li>Known graphics &amp; logos</li>
              <li>Locations &amp; landmarks</li>
              <li>NSFW adult content</li>
            </ul>
          </div>
          <div class="plan-content">
            <ul>
              <li>Visual Tags</li>
              <li>Celebrity recognition</li>
              <li>Person recognition</li>
              <li>Speech-to-text</li>
              <li>Visual text (OCR)</li>
              <li>Known graphics &amp; logos</li>
              <li>Locations &amp; landmarks</li>
              <li>NSFW adult content</li>
            </ul>
          </div>
        </div>
        <div class="plan">
          <div class="plan-header">
            <h3>Machine Learning</h3>
          </div>
          <div class="plan-content alternate">
            <ul>
              <li>Object Training</li>
              <li>Person Training</li>
            </ul>
          </div>
          <div class="plan-content">
            <ul>
              <li>Object Training</li>
              <li>Person Training</li>
            </ul>
          </div>
        </div>
        <div class="plan">
          <div class="plan-header">
            <h3>Editors</h3>
          </div>
          <div class="plan-content alternate">
            <p>&ndash;</p>
          </div>
          <div class="plan-content">
            <p>Adobe Premiere Pro Plugin access</p>
          </div>
        </div>
        <div class="plan">
          <div class="plan-header">
            <h3>Developers</h3>
          </div>
          <div class="plan-content alternate">
            <p>&ndash;</p>
          </div>
          <div class="plan-content">
            <p>API access</p>
          </div>
        </div>
        <div class="plan">
          <div class="plan-header">
            <h3>Additional Costs</h3>
          </div>
          <div class="plan-content alternate">
            <ul>
              <li>$0.05/additional credit*, over 10,000</li>
              <li>$50.00/runtime hour of audio/video</li>
              <li>$0.04/GB/month, over 250GB</li>
            </ul>
          </div>
          <div class="plan-content">
            <ul>
              <li>$0.05/additional credit*, over 20,000</li>
              <li>$25.00/runtime hour of video, over 10 hours</li>
              <li>$0.35/GB/month, over 1TB</li>
            </ul>
          </div>
        </div>
      </div>
      <p class="note">*1 Credit = 1 File, Document Page or Image. Number of files within an archived file (Zip, Rar, etc) are counted individually.</p>
    </div>
    <el-dialog :visible.sync="showCancel" title="Cancel subscription" width="500px" class="cancel-dialog">
      <div v-loading="cancelling">
        <p>By continuing, your subscription will be cancelled effective {{ cancelDate }}.</p>
        <label>Type "{{ CANCEL_STRING }}" in the box below to confirm</label>
        <el-input v-model="cancelConfirmText" type="text" size="small"></el-input>
        <div class="button-row">
          <el-button type="text" size="mini" @click="showCancel = false">Close</el-button>
          <el-button type="primary" size="mini" :disabled="!cancelButtonEnabled" @click="doCancel">Cancel my subscription</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import moment from 'moment'
import { mapState, mapMutations } from 'vuex'

import { setSaasPlanChangeCookie } from 'src/cookie-helper'
import { SESSION, DASHBOARD } from 'src/store/storeModules'
import { GET_USER_BILLING, SET_PROGRESS, FETCH_BILLING } from 'src/store/modules/dashboard/dashboard'
import { GET_SAAS_ONBOARDED } from 'src/store/modules/session/session'
import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { getAPIErrorMsg } from 'src/apiHelpers'
import SaasPlanChanging from 'src/components/admin/SaasPlanChanging.vue'
import SaasMixin from 'src/components/admin/SaasMixin'

const CANCEL_STRING = 'CANCEL'

export default {
  name: 'admin-plan',

  mixins: [SaasMixin],

  components: {
    SaasPlanChanging
  },

  beforeMount () {
    this.$store.commit(`${DASHBOARD}/${SET_PROGRESS}`, 'plan')
  },

  computed: {
    billingInfo () {
      return this.$store.getters[`${DASHBOARD}/${GET_USER_BILLING}`]
    },
    isOnboarded () {
      return this.$store.getters[`${SESSION}/${GET_SAAS_ONBOARDED}`]
    },
    cancelDate () {
      const cycleEndDate = _.get(this.billingInfo, 'subscription.current_period_end')
      return moment.unix(cycleEndDate).format('MM/DD/YYYY')
    },
    cancelButtonEnabled () {
      return this.cancelConfirmText.toLowerCase() === CANCEL_STRING.toLowerCase()
    }
  },

  data () {
    return {
      showCancel: false,
      cancelConfirmText: '',
      CANCEL_STRING,
      cancelling: false,
      newPlan: null,
      BILLING_AMOUNT_OPTION_2: CONSTANTS.DEFAULT_BILLING_AMOUNT_OPTION_2,
      BILLING_AMOUNT_OPTION_1: CONSTANTS.DEFAULT_BILLING_AMOUNT_OPTION_1,
      BILLING_PLAN_OPTION_2: CONSTANTS.BILLING_PLAN_OPTION_2,
      BILLING_PLAN_OPTION_1: CONSTANTS.BILLING_PLAN_OPTION_1
    }
  },

  methods: {
    ...mapMutations(DASHBOARD, [
      SET_PROGRESS
    ]),

    changeUserPlan (newPlan) {
      api.changeBillingPlan(newPlan)
        .then(() => {
          setSaasPlanChangeCookie(this.billingInfo.plan, newPlan)
          this.$router.push({ name: this.isOnboarded ? 'admin-dashboard' : 'admin-payment' })
        })
        .catch(() => {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'Your plan cannot be changed. Please contact us for help.',
            showClose: true,
            type: 'error'
          })
        })
    },
    doCancel () {
      if (this.cancelButtonEnabled) {
        this.cancelling = true
        api.cancelSubscription()
          .then(response => {
            this.$message({
              duration: CONSTANTS.MESSAGE_DURATION,
              message: 'Your subscription cancellation request has been processed.',
              showClose: true,
              type: 'success'
            })
            this.$store.dispatch(`${DASHBOARD}/${FETCH_BILLING}`)
            this.$router.push({ name: 'admin-dashboard' })
          })
          .catch(err => {
            this.$message({
              duration: CONSTANTS.MESSAGE_DURATION,
              message: 'Error cancelling your subscription. Please contact us for help.',
              showClose: true,
              type: 'error'
            })
            this.cancelling = false
          })
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';
@import (reference) '~src/styles/_mixins';

.admin-page {
  .content {
    .content-account {
      margin-bottom: 20px;
      padding-top: 15px;

      h3,
      p,
      li {
        font-size: 12px;
        line-height: 1.67;
        margin: 0;
      }

      h3 {
        font-weight: 900;
        text-transform: uppercase;
      }

      h2,
      p {
        text-align: center;
      }

      ul {
        list-style: none;
        margin: 0;
        padding: 0;

        li {
          text-align: center;
        }
      }

      p {
        &.note {
          color: @color-tone;
          font-size: 10px;
          line-height: 1.3;
          text-align: left;
        }
      }

      .cancel-button {
        background-color: transparent;
        border: 0 none;
        color: @color-alert;
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0;
        padding: 5px 0;
        text-transform: none;
      }

      .header, .select-plan {
        max-width: 898px;
      }

      .select-plan {
        margin-bottom: 29px;

        .plan {
          .flex-box();
          border-bottom: 1px solid @color-tone-lighter;

          &:first-of-type,
          &:last-of-type {
            border-bottom: 0;
          }

          &:first-of-type {
            padding-bottom: 0;

            .plan-header,
            .plan-content {
              border-top: 8px solid @color-tone-lighter;
            }

            .plan-content {
              border-color: @color-anchor;
              padding-top: 24px;

              &:last-of-type {
                border-color: @color-accent-calm;

                h2 {
                  color: @color-accent-calm;
                }

                .el-button {
                  background-color: @color-accent-calm;
                  border-color: @color-accent-calm;

                  &.edit-mode {
                    background-color: transparent;
                    color: @color-accent-calm;
                  }
                }

                p.types {
                  color: @color-accent-calm;
                }
              }

              h2 {
                .base-font-uppercase();
                color: @color-anchor;
                font-size: 20px;
                font-weight: 700;
                letter-spacing: 1.6px;
              }

              .el-button {
                background-color: @color-anchor;
                border-color: @color-anchor;

                &.edit-mode {
                  background-color: transparent;
                  color: @color-anchor;
                }
              }

              p {
                max-width: 166px;

                &.types {
                  .base-font-uppercase();
                  color: @color-anchor;
                  font-size: 10px;
                  font-weight: 700;
                  letter-spacing: 0.8px;
                  margin-bottom: 10px;
                }

                &.cost {
                  span {
                    display: inline-block;
                    font-size: 60px;
                    font-weight: 100;
                    letter-spacing: -4.8px;
                    line-height: 1.32;
                    margin-left: 5px;
                    position: relative;
                  }

                  sup {
                    font-size: 29px;
                    font-weight: 300;
                    left: 8px;
                    letter-spacing: 0.8px;
                    line-height: 1.33;
                    position: relative;
                    top: -13px;
                  }

                  sub {
                    font-size: 20px;
                  }
                }
              }
            }
          }

          .plan-header,
          .plan-content {
            background: @translucent-gray;
            flex: 1;
            padding: 16.5px 9px;
          }

          .plan-header {
            flex: 0 0 190px;

            p {
              color: @color-tone;
              font-size: 9px;
              line-height: 1.22;
              text-align: left;
            }
          }

          .plan-content {
            .flex-container-column();
            .align-items-center();
            .justify-content-center();

            &.alternate {
              background: @color-base;
            }

            p {
              line-height: 1.33;
              max-width: 220px;
            }

            .el-button {
              font-size: 13px;
              letter-spacing: 1.1px;
              line-height: 1.36;
              margin-top: 18px;
              max-width: 240px;
              padding: 12px;
              width: 100%;

              &.is-disabled {
                cursor: not-allowed;
              }
            }
          }
        }
      }
    }
  }
  .cancel-dialog {
    .el-dialog__body {
      padding-top: 0px;
      p {
        font-size: 13px;
        margin: 0 0 15px 0;
        padding: 0;
      }
      label {
        display: block;
        padding-bottom: 3px;
      }
      .button-row {
        .flex-container-end();
        margin-top: 25px;
        .el-button--primary {
          &:not(.is-disabled) {
            background-color: @color-alert;
            border-color: @color-alert;
            &:hover {
              background-color: @primary-button-color__hover;
            }
          }
        }
      }
    }
  }
}
</style>
