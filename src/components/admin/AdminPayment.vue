<template>
  <div class="content">
    <saas-plan-changing v-if="isChangingSaasPlan"></saas-plan-changing>
    <div class="content-account" v-else>
      <div class="header">
        <h2>Add Payment Method</h2>
      </div>
      <div
        v-if="isSaasTrailMode"
        :class="{'in-trial': isSaasTrailMode, 'over-limit': isOverLimit}"
        class="your-plan feature-wrapper"
      >
        <h3>
          <i :class="[isOverLimit ? 'far fa-exclamation-triangle' : 'far fa-check-circle']"></i>
          Wasabi AiR™ Trial
        </h3>
        <p v-if="isOverLimit">Your trial has reached a combination of {{ maxLimit }} credits and {{ formatVideoRuntime }} hours of video runtime.</p>
        <p v-else>Your trial comes with a combination of {{ maxLimit }} credits and {{ formatVideoRuntime }} hours of video runtime.</p>
        <router-link
          :to="{ name: 'admin-plan', query: { edit: true } }"
          name="plan"
        >
          <span>Enter a payment method below to upgrade.</span>
        </router-link>
      </div>

      <div class="your-plan feature-wrapper" :class="'plan-' + billingInfo.plan">
        <div class="feature-wrapper__info">
          <h3><i class="far fa-check-circle"></i> Wasabi AiR™ {{ billingInfo.plan }}</h3>
          <p>You will be billed ${{ planAmount }}/month starting {{ formatInvoiceDate(billingInfo.trial_ends) }}</p>
        </div>
        <div class="feature-wrapper__action" v-if="hasBillingInfo">
          <router-link :to="{ name: 'admin-plan' }" class="button-link">Review/Edit</router-link>
        </div>
      </div>

      <!-- current discount -->
      <div class="current-promotion discount-code feature-wrapper" v-if="currentDiscountDescription.length && !showEnterDiscount">
        <h4>Current Discount:</h4>
        <p>{{ currentDiscountDescription }} (<span @click="showEnterDiscount = true">Change</span>)</p>
      </div>

      <!-- enter discount -->
      <div class="discount-code feature-wrapper" v-else>
        <div class="feature-wrapper__info">
          <el-input
            @keyup.native.enter.prevent.stop="submitDiscountCode(discountCode)"
            @keyup.native.esc.prevent.stop="resetDiscountCode"
            placeholder="Discount code"
            type="text"
            size="small"
            v-model="discountCode"
            :disabled="savingDiscountCode"
          ></el-input>
        </div>
        <div class="feature-wrapper__action">
          <el-button
            :disabled="discountCode === '' || savingDiscountCode"
            @click="submitDiscountCode(discountCode)"
            type="primary"
            size="small"
          >
            <i class="far fa-spinner fa-spin" v-if="savingDiscountCode"></i> Apply
          </el-button>
        </div>
      </div>

      <el-form
        :model="accountBilling"
        :rules="validationRules"
        id="account-billing"
        inline-message
        label-position="top"
        label-width="100%"
        ref="accountBilling"
        status-icon
        validate-on-rule-change
      >
        <el-form-item label="Name on Card" prop="name">
          <el-input
            id="name"
            data-tid="name-label"
            type="text"
            v-model="accountBilling.name"
            @keyup.enter.native="submitBilling"
          ></el-input>
        </el-form-item>
        <el-form-item label="Billing Address 1" prop="address_line1">
          <el-input
            id="address_line1"
            data-tid="address_line1_label"
            type="text"
            v-model="accountBilling.address_line1"
            @keyup.enter.native="submitBilling"
          ></el-input>
        </el-form-item>
        <el-form-item label="Billing Address 2 (apt, suite, etc)" prop="address_line2">
          <el-input
            id="address_line2"
            data-tid="address_line2_label"
            type="text"
            v-model="accountBilling.address_line2"
            @keyup.enter.native="submitBilling"
          ></el-input>
        </el-form-item>
        <el-form-item
          class="address_city"
          label="City"
          prop="address_city"
        >
          <el-input
            id="address_city"
            data-tid="address_city-label"
            type="text"
            v-model="accountBilling.address_city"
            @keyup.enter.native="submitBilling"
          ></el-input>
        </el-form-item>
        <el-form-item
          class="address_state"
          label="State"
          prop="address_state"
        >
          <el-select
            id="address_state"
            data-tid="address_state-label"
            v-model="accountBilling.address_state"
            filterable
            placeholder="Select..."
            @keyup.enter.native="submitBilling"
          >
            <el-option
              v-for="state in STATES"
              :key="state.abbreviation"
              :label="state.abbreviation"
              :value="state.name">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          class="address_country"
          label="Country"
          prop="address_country"
        >
          <el-select
            id="address_country"
            data-tid="address_country_label"
            v-model="accountBilling.address_country"
            filterable
            placeholder="Select..."
            @keyup.enter.native="submitBilling"
          >
            <el-option
              v-for="country in COUNTRIES"
              :key="country.abbreviation"
              :label="country.name"
              :value="country.name">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          class="address_zip"
          label="Billing Zip"
          prop="address_zip"
        >
          <div class="el-input">
            <input
              class="el-input__inner"
              id="address_zip"
              data-tid="address_zip_label"
              type="text"
              v-numeric-input
              maxlength="5"
              v-model="accountBilling.address_zip"
              @keyup.enter.native="submitBilling"
            >
          </div>
        </el-form-item>

        <div class="credit-card-information">
          <!-- The following input is populated by Stripe.js. Was able to wrap their <div> with ElementsUI <div> to maintain some styling -->
          <div class="el-form-item el-form-item--feedback is-required">
            <label for="number" class="el-form-item__label">Card Information</label>
            <div id="credit-card">
              <!-- A Stripe Element will be inserted here. -->
            </div>

            <div id="card-errors" role="alert"></div>
          </div>
          <el-form-item class="has-button">
            <el-button type="primary" :disabled="!isAllValid || savingBillingInfo" @click="submitBilling"><i class="far fa-spinner fa-spin" v-if="savingBillingInfo"></i> Continue</el-button>
          </el-form-item>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import moment from 'moment'
import Validator from 'async-validator'
import { mapState, mapMutations, mapGetters } from 'vuex'

import numericInput from 'src/directives/numeric-input.directive'
import { SESSION, DASHBOARD } from 'src/store/storeModules'
import {
  GET_USER_BILLING,
  GET_CURRENT_DISCOUNT,
  GET_CURRENT_DISCOUNT_DESCRIPTION,
  GET_IS_SAAS_TRIAL_MODE,
  SET_PROGRESS,
  FETCH_BILLING
} from 'src/store/modules/dashboard/dashboard'
import {
  GET_MAX_LIMIT,
  GET_SAAS_ONBOARDED,
  GET_SAAS_PLAN_AMOUNTS,
  GET_SUMMARY_DATA
} from 'src/store/modules/session/session'
import api from 'src/api'
import { CONSTANTS } from 'src/constants'
import { LOCALE } from 'src/locale-constants'
import { getAPIErrorMsg } from 'src/apiHelpers'
import SaasPlanChanging from 'src/components/admin/SaasPlanChanging.vue'
import SaasMixin from 'src/components/admin/SaasMixin'

const getDefaultBilling = () => {
  return {
    address_city: '',
    address_country: CONSTANTS.DEFAULT_COUNTRY,
    address_line1: '',
    address_line2: '',
    address_state: '',
    address_zip: '',
    name: ''
  }
}

const validationRules = {
  address_city: [
    {
      message: 'City is required',
      required: true,
      trigger: 'blur'
    }
  ],
  address_country: [
    {
      message: 'Country is required',
      required: true,
      trigger: 'change'
    }
  ],
  address_line1: [
    {
      message: 'Please provide your address.',
      required: true,
      trigger: 'blur'
    }
  ],
  address_state: [
    {
      message: 'State is required',
      required: true,
      trigger: 'change'
    }
  ],
  address_zip: [
    {
      message: 'ZIP is required',
      required: true,
      trigger: 'blur'
    }
  ],
  name: [
    {
      message: 'Your name is required',
      required: true,
      trigger: 'blur'
    }
  ]
}

const validator = new Validator(validationRules)

export default {
  name: 'admin-payment',

  directives: {
    numericInput
  },

  mixins: [SaasMixin],

  components: {
    SaasPlanChanging
  },

  watch: {
    accountBilling: {
      handler (newValue, oldValue) {
        validator.validate(newValue, (errors, fields) => {
          this.isValidForm = !errors
        })
      },
      deep: true
    }
  },

  beforeMount () {
    this.$store.commit(`${DASHBOARD}/${SET_PROGRESS}`, 'payment')
  },

  mounted () {
    let billingWatcher = _.noop
    billingWatcher = this.$watch('billingInfo', val => {
      const key = _.get(val, 'stripe_publishable_key', '') || ''
      if (key && key.length) {
        this.setUpStripe()
        billingWatcher()
      }
    }, { immediate: true })
  },

  computed: {
    ...mapGetters(DASHBOARD, {
      billingInfo: GET_USER_BILLING,
      currentDiscount: GET_CURRENT_DISCOUNT,
      currentDiscountDescription: GET_CURRENT_DISCOUNT_DESCRIPTION,
      isSaasTrailMode: GET_IS_SAAS_TRIAL_MODE
    }),

    ...mapGetters(SESSION, {
      isOnboarded: GET_SAAS_ONBOARDED,
      maxLimit: GET_MAX_LIMIT,
      planAmounts: GET_SAAS_PLAN_AMOUNTS,
      summaryData: GET_SUMMARY_DATA
    }),

    formatVideoRuntime () {
      const videoRuntime = _.get(this.summaryData, 'video_runtime_second', 0)
      return moment(videoRuntime).format('H')
    },

    hasBillingInfo () {
      return !!this.billingInfo.default_payment_source
    },

    isAllValid () {
      return this.isValidForm && this.isStripeComplete
    },

    isOnboarded () {
      return this.$store.getters[`${SESSION}/${GET_SAAS_ONBOARDED}`]
    },

    isOverLimit () {
      const totalFiles = _.get(this.summaryData, 'total_files', 0)
      const deletedFiles = _.get(this.summaryData, 'deleted_files', 0)
      return (totalFiles + deletedFiles) >= this.maxLimit
    },

    planAmount () {
      const plan = this.planAmounts.find(plan => this.CONSTANTS.BILLING_PLAN_OPTION_1 === plan.name)
      if (plan) {
        return (_.get(plan, 'amount', 0) / 100).toFixed(2)
      }
      return '0.00'
    }
  },

  data () {
    return {
      accountBilling: getDefaultBilling(),
      credit_card: null,
      discountCode: '',
      isStripeComplete: false,
      isValidForm: false,
      savingBillingInfo: false,
      paymentMethodType: 'card',
      savingDiscountCode: false,
      stripe: null,
      showEnterDiscount: false,
      validationRules,
      COUNTRIES: LOCALE.COUNTRIES,
      STATES: LOCALE.STATES
    }
  },

  methods: {
    ...mapMutations(DASHBOARD, [
      SET_PROGRESS
    ]),

    formatInvoiceDate (date) {
      return moment(date).format('MM/DD/YY')
    },

    listenForStripeEvents () {
      this.credit_card.addEventListener('change', event => {
        this.$nextTick(() => {
          const el = document.getElementById('credit-card')
          this.isStripeComplete = el.classList.contains('StripeElement--complete')
        })

        const displayError = document.getElementById('card-errors')
        if (event.error) {
          displayError.textContent = event.error.message
        } else {
          displayError.textContent = ''
        }
      })
    },

    setUpStripe () {
      const stripe = Stripe(this.billingInfo.stripe_publishable_key)
      this.stripe = stripe
      const elements = stripe.elements({
        fonts: [{ cssSrc: 'https://fonts.googleapis.com/css?family=Roboto' }]
      })

      const elementStyles = {
        invalid: {
          color: CONSTANTS.STRIPE_ERROR,

          '::placeholder': {
            color: CONSTANTS.STRIPE_PLACEHOLDER
          }
        }
      }

      this.credit_card = elements.create(CONSTANTS.DEFAULT_BILLING_TYPE, {
        hidePostalCode: true,
        style: elementStyles
      })

      this.credit_card.mount('#credit-card')
      this.listenForStripeEvents()
    },

    resetDiscountCode () {
      this.discountCode = ''
      this.showEnterDiscount = false
      this.savingDiscountCode = false
    },

    submitDiscountCode (code) {
      this.savingDiscountCode = true

      api.applyDiscountCode(code)
        .then(() => {
          this.$store.dispatch(`${DASHBOARD}/${FETCH_BILLING}`)
            .then(() => {
              this.$message({
                duration: CONSTANTS.MESSAGE_DURATION,
                message: 'Discount applied.',
                showClose: true,
                type: 'success'
              })
              this.resetDiscountCode()
              this.showEnterDiscount = false
            })
        })
        .catch(err => {
          this.$message({
            duration: CONSTANTS.MESSAGE_DURATION,
            message: 'The coupon code you entered is invalid.',
            showClose: true,
            type: 'error'
          })
          this.savingDiscountCode = false
        })
    },

    submitBilling () {
      const options = _.assign({
        address_city,
        address_country,
        address_line1,
        address_line2,
        address_state,
        address_zip,
        name
      }, this.accountBilling)

      if (this.isAllValid) {
        this.savingBillingInfo = true
        this.stripe.createToken(this.credit_card, options).then(result => {
          if (result.token) {
            api.createPaymentMethod({ token: result.token.id, type: this.paymentMethodType })
              .then(() => {
                this.$store.dispatch(`${DASHBOARD}/${FETCH_BILLING}`)
                this.$router.push({ name: 'admin-dashboard' })
              })
              .catch(err => {
                this.$message({
                  duration: CONSTANTS.MESSAGE_DURATION,
                  message: getAPIErrorMsg(err),
                  showClose: true,
                  type: 'error'
                })
              })
              .finally(() => {
                this.savingBillingInfo = false
              })
          } else {
            this.savingBillingInfo = false
            this.$message({
              duration: CONSTANTS.MESSAGE_DURATION,
              message: result.error.message,
              showClose: true,
              type: 'error'
            })
          }
        })
      } else {
        this.$message({
          duration: CONSTANTS.MESSAGE_DURATION,
          message: 'Please complete all required fields and try again.',
          showClose: true,
          type: 'error'
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
      margin-top: 25px;
      max-width: 600px;

      form,
      .options {
        max-width: 600px;
        min-width: 600px;
      }

      .options {
        .flex-box();
        margin: 14.4px 0;

        label {
          .flex-box();
          font-size: 14px;
          font-weight: 500;
          line-height: 1.36;
          text-transform: capitalize;
          width: auto;

          .cost,
          .discount {
            display: block;
            font-size: 10px;
            line-height: 1.3;
            padding-left: 0;
          }

          .cost {
            font-weight: 300;
            padding-top: 3px;
          }

          .discount {
            color: @color-accent-bright;
            text-decoration: line-through;
          }
        }
      }

      form {
        .flex-box();
        .flex-wrap(wrap);
        margin-top: 25px;

        .el-form-item {
          flex: 0 0 600px;


          &.address_city,
          &.address_country {
            flex: 0 0 450px;
            margin-right: 11px;
          }

          &.address_state,
          &.address_zip {
            flex: 0 0 138px;
          }

          &.discount {
            border-top: 1px solid @color-tone-lighter;
            padding-top: 15.2px;
          }
        }

        .credit-card-information {
          .flex-box();
          margin-top: 13px;
          max-width: 600px;
          width: 100%;

          .el-form-item {
            flex: 0 0 450px;
            margin-right: 11px;
            &.has-button {
              flex: 0 0 138px;
              margin-right: 0;
              margin-top: 20px;
              .el-button {
                font-size: 11px;
                padding: 12px 9px;
                width: 100%;
              }
            }
          }
        }
      }

      .feature-wrapper {
        .flex-container-between();
        margin-bottom: 6px;
        padding: 14px 15px;
        .feature-wrapper__info {
          color: @color-base;
          flex: 0 0 435px;
          margin-right: 11px;
        }
        .feature-wrapper__action {
          flex: 0 0 123px;
        }
        &.your-plan {
          padding: 9px 15px;
          &.plan-pro {
            background-color: @color-saas-pro;
          }
          &.plan-premium {
            background-color: @color-saas-premium;
          }
          h3 {
            .base-font-uppercase();
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1.4px;
            margin: 0;
          }
          &.in-trial,
          &.over-limit {
            .flex-container-column();
            background: @color-accent;
            color: @color-base;
            padding-right: 40px;

            h3 {
              font-size: 18px;
              font-weight: 900;
              letter-spacing: 1.4px;
              line-height: 1.17;
              margin-bottom: 5px;
              text-transform: uppercase;
            }

            p, a {
              font-size: 12px;
              line-height: 1.17;
            }

            a {
              color: @color-base;
              margin-left: 25px;

              span {
                font-weight: bold;
              }
            }
          }
          &.over-limit {
            background-color: @color-alert;
          }
          p {
            font-size: 12px;
            margin: 0 0 0 25px;
          }
        }
        &.discount-code {
          background-color: @color-tone-lighter;
          &.current-promotion {
            h4 {
              font-size: 11px;
              margin: 0;
              padding: 0;
              text-transform: uppercase;
            }
            p {
              font-size: 13px;
              margin: 0;
              padding: 0;
              span {
                color: @color-anchor;
                cursor: pointer;
                text-decoration: underline;
              }
            }
          }
          .el-input__inner {
            background-color: @color-base;
          }
          .el-button {
            &:not(:disabled) {
              background-color: @color-accent;
              color: @color-base;
            }
          }
        }
        .el-button, .button-link {
          background-color: rgba(0, 0, 0, 0.15);
          border: 0 none;
          color: @color-base;
          font-size: 10px;
          padding: 8px 22px;
          text-transform: uppercase;
          width: 100%;
        }
      } // .feature-wrapper
    }
  }
}

.StripeElement {
  background-color: @box-background;
  border: 1px solid @box-border-grey;
  color: @text-dark;
  font-size: 13px;
  font-weight: 900;
  height: 40px;
  line-height: 1.33;
  padding: 11px 10px;
  width: 100%;

  &::placeholder,
  &::-webkit-input-placeholder {
    color: @placeholder-text-color;
    font-size: 13px;
    font-weight: normal;
    line-height: 1.33;
  }

  &[type=number]::-webkit-inner-spin-button,
  &[type=number]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
}

#card-errors {
  color: @color-danger;
  font-size: 12px;
  line-height: 1;
  padding-top: 3px;
}
</style>
