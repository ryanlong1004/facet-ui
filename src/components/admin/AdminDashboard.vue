<template>
  <saas-plan-changing v-if="isChangingSaasPlan"></saas-plan-changing>
  <div class="content" v-else>
    <div class="content-account">
      <div class="spinner" v-loading="loadingInitData"></div>
      <div class="flex-container" v-if="!loadingInitData">
        <div class="current-plan">
          <h2>Plan details</h2>
          <div class="your-plan" :class="'plan-' + billingInfo.plan">
            <div>
              <h3>Curio {{ billingInfo.plan }}</h3>
              <p>${{ planAmount }}/month</p>
            </div>
            <router-link
              :to="{ name: 'admin-plan', query: { edit: true } }"
              class="button-link"
              name="plan"
            >
              <span>Edit</span>
            </router-link>
          </div>
          <div class="info">
            <template v-if="billingInfo.invoices && billingInfo.invoices.length > 0">
              <div v-for="invoice in billingInfo.invoices" :key="invoice.id">
                <p><a :href="invoice.invoice_pdf" target="_blank">{{ formatInvoiceDate(invoice.date) }}</a></p>
                <p>{{ formatAmount(invoice.total) }}</p>
              </div>
            </template>
            <p v-else class="no-results">No invoices.</p>
          </div>
          <div class="actions current-promotion" v-if="currentDiscountDescription.length && !showEnterDiscount">
            <h4>Current Discount:</h4>
            <p>{{ currentDiscountDescription }} (<span @click="showEnterDiscount = true">Change</span>)</p>
          </div>
          <div class="actions" v-else>
            <el-input
              :disabled="savingDiscountCode"
              @keyup.native.enter.prevent.stop="submitDiscountCode(discountCode)"
              @keyup.native.esc.prevent.stop="resetDiscountCode"
              placeholder="Discount code"
              type="text"
              v-model="discountCode"
            ></el-input>
            <el-button
              :disabled="discountCode === '' || savingDiscountCode"
              @click="submitDiscountCode(discountCode)"
              type="primary"
            >
              Apply
            </el-button>
          </div>
        </div>
        <div class="payment-methods">
          <h2>Payment method</h2>
          <div class="info" v-loading="savingDefaultPaymentMethod">
            <div v-if="allCreditCards && allCreditCards.length > 0" class="card-list">
              <div v-for="card of allCreditCards" :key="card.id" class="card-list__card-wrapper">
                <div @click="changeDefaultPaymentMethod(card.id)" :class="{ active: card.id === paymentMethod }" class="card-detail">
                  <i class="fa-circle" :class="{ 'far': card.id !== paymentMethod, 'fas': card.id === paymentMethod }"></i>
                  <i class="fal fa-credit-card-front"></i>
                  <span><i class="fal fa-asterisk" v-for="(asterick, index) in asterisksCreditCard" :key="index"></i> {{ card.last4 }}</span>
                </div>
                <i class="fal fa-trash-alt delete-icon" v-if="card.id !== paymentMethod" @click="deletePaymentMethod('card', card)"></i>
              </div>
            </div>
            <p v-else class="no-results">No saved payment methods.</p>
          </div>
          <div class="actions">
            <router-link
              :to="{ name: 'admin-payment', query: { edit: true } }"
              class="button-link"
              name="payment"
            >
              <span>Add new payment method</span>
            </router-link>
          </div>
        </div>
        <div class="statistics">
          <h2>Usage statistics</h2>
          <div class="info">
            <template v-if="billingInfo.usage.items && billingInfo.usage.items.length > 0">
              <div v-for="(stat, index) in billingInfo.usage.items" :key="index">
                <p>{{ stat.item.description }}</p>
                <p>{{ stat.quantity }}</p>
              </div>
            </template>
            <p v-else class="no-results">No usage statistics.</p>
            <p>As of {{ formatTimestamp(billingInfo.usage.timestamp) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import moment from 'moment'
import { mapState, mapMutations, mapGetters } from 'vuex'
import { SESSION, DASHBOARD } from 'src/store/storeModules'
import {
  FETCH_BILLING,
  GET_CURRENT_DISCOUNT_DESCRIPTION,
  GET_CURRENT_DISCOUNT,
  GET_USER_BILLING,
  SET_PROGRESS
} from 'src/store/modules/dashboard/dashboard'
import { GET_SAAS_PLAN_AMOUNTS } from 'src/store/modules/session/session'
import api from 'src/api'
import { getAPIErrorMsg } from 'src/apiHelpers'
import SaasPlanChanging from 'src/components/admin/SaasPlanChanging.vue'
import SaasMixin from 'src/components/admin/SaasMixin'

export default {
  name: 'admin-dashboard',

  mixins: [SaasMixin],

  components: {
    SaasPlanChanging
  },

  computed: {
    ...mapGetters(DASHBOARD, {
      billingInfo: GET_USER_BILLING,
      currentDiscount: GET_CURRENT_DISCOUNT,
      currentDiscountDescription: GET_CURRENT_DISCOUNT_DESCRIPTION
    }),

    ...mapGetters(SESSION, {
      planAmounts: GET_SAAS_PLAN_AMOUNTS
    }),

    planAmount () {
      const plan = this.planAmounts.find(plan => this.CONSTANTS.BILLING_PLAN_OPTION_1 === plan.name)
      if (plan) {
        return (_.get(plan, 'amount', 0) / 100).toFixed(2)
      }
      return '0.00'
    }
  },

  beforeMount () {
    this.$store.commit(`${DASHBOARD}/${SET_PROGRESS}`, 'dashboard')
    this.getPaymentMethods()
  },

  data () {
    return {
      allBankAccounts: {},
      allCreditCards: {},
      allPaymentMethods: {},
      asterisksBank: this.CONSTANTS.NUM_OF_BANK_ASTERISKS,
      asterisksCreditCard: this.CONSTANTS.NUM_OF_CC_ASTERISKS,
      discountCode: '',
      loadingInitData: true,
      paymentMethod: '',
      savingDefaultPaymentMethod: false,
      savingDiscountCode: false,
      showEnterDiscount: false
    }
  },

  methods: {
    ...mapMutations(DASHBOARD, [
      SET_PROGRESS
    ]),

    changeDefaultPaymentMethod (cardId) {
      this.savingDefaultPaymentMethod = true
      return api.changeDefaultPaymentSource(cardId)
        .then(() => {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'Default payment method updated.',
            showClose: true,
            type: 'success'
          })
          this.getPaymentMethods()
            .finally(() => {
              this.savingDefaultPaymentMethod = false
            })
        })
        .catch(err => {
          console.error(err)
          this.savingDefaultPaymentMethod = false
        })
    },

    deletePaymentMethod (type, info) {
      this.$confirm('Are you sure you want to delete the card ' + info.last4 + '?', 'Warning', {
        cancelButtonText: 'Cancel',
        confirmButtonText: 'OK',
        type: 'warning'
      }).then(() => {
        api.deletePaymentMethod(type, info.id)
          .then(() => {
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: 'Payment method deleted.',
              showClose: true,
              type: 'success'
            })
            this.getPaymentMethods()
          })
          .catch(err => {
            this.$message({
              duration: this.CONSTANTS.MESSAGE_DURATION,
              message: getAPIErrorMsg(err),
              showClose: true,
              type: 'error'
            })
          })
      }).catch(() => {})
    },

    formatAmount (number) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number / 100)
    },

    formatInvoiceDate (date) {
      return moment.unix(date).format('MMM DD, YYYY')
    },

    formatTimestamp (date) {
      return moment(date).format('MMMM DD, YYYY, h:mm a')
    },

    getPaymentMethods () {
      return api.getPaymentMethods()
        .then(response => {
          this.allPaymentMethods = response
          this.allBankAccounts = this.allPaymentMethods.bank_accounts
          this.allCreditCards = this.allPaymentMethods.cards
          this.paymentMethod = this.allPaymentMethods.default_payment_source_id
          this.loadingInitData = false
        })
        .catch(() => {
          this.$message({
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'Error loading payment methods, please try again',
            showClose: true,
            type: 'error'
          })
        })
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
                duration: this.CONSTANTS.MESSAGE_DURATION,
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
            duration: this.CONSTANTS.MESSAGE_DURATION,
            message: 'The coupon code you entered is invalid.',
            showClose: true,
            type: 'error'
          })
          this.savingDiscountCode = false
        })
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
      padding-top: 15px;

      .flex-container {
        .flex-container();
        .flex-wrap(wrap);
        .align-items-start();

        div {
          &.current-plan,
          &.payment-methods,
          &.statistics {
            flex: 0 0 274px;
            height: 231.92px;
            margin: 0 15.1px 24px 0;
            max-width: 274px;

            h2 {
              margin-bottom: 6px;
            }

            .your-plan {
              .flex-container-between();
              background: @color-accent-calm;
              color: @color-base;
              padding: 7px 13px 7px 12.9px;
              position: relative;
              width: 100%;

              h3 {
                .base-font-uppercase();
                color: @color-base;
                font-weight: 700;
                font-size: 15px;
                margin: 0;
                text-align: center;
              }

              p {
                font-size: 12px;
                line-height: 1.33;
                margin: 0;
              }

              a {
                color: @color-base;
                font-size: 12px;
                line-height: 1.33;
                text-decoration: underline;
              }

              .button-link {
                background: darken(@color-accent-calm, 6%);
                font-size: 10px;
                padding: 8px 22px;
                text-decoration: none;
              }

              &.plan-pro {
                background: @color-anchor;

                .button-link {
                  background: darken(@color-anchor, 6%);
                }
              }
            }

            .info {
              height: 101px;
              overflow-y: auto;
            }
          }

          &.current-plan {
            .info {
              padding: 0 12.8px;

              > div {
                &:last-of-type {
                  border-bottom: 0;
                }
              }

              p {
                a {
                  color: @color-anchor;
                }
              }
            }

            .content {
              .flex-container-center();
              height: 105px;

              .button-link {
                margin: 0 auto;
                width: 212px;
              }
            }
          }

          &.payment-methods,
          &.statistics {
            .info {
              height: 148px;
              padding: 0 12px 17px;

              > div {
                &:last-of-type {
                  border-bottom-width: 0;
                }

                p {
                  flex: 1;

                  &:last-of-type {
                    flex: 1;
                  }

                  a {
                    color: @color-primary;
                  }
                }

                &.el-radio-group {
                  .flex-flow(nowrap, column);
                }
              }
            }
          }

          &.payment-methods {
            .card-list {
              align-items: center;
              display: block;
              flex-direction: column;
              font-size: 13px;
              .card-list__card-wrapper {
                border-bottom: 1px solid @color-tone-lighter;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                &:last-child {
                  border-bottom: 0 none;
                  padding-bottom: 0;
                }
                .card-detail {
                  display: flex;
                  justify-content: flex-start;
                  &.active {
                    color: @color-accent;
                  }
                }
                .delete-icon {
                  cursor: pointer;
                  &:hover {
                    color: @color-accent;
                  }
                }
              }
            }

            .fa-asterisk {
              font-size: 6px;
              position: relative;
              top: -3px;
              &:first-child {
                margin-left: 10px;
              }
              &:nth-child(4n) {
                &::after {
                  content: " ";
                  display: inline-block;
                  width: 4px;
                }
              }
            }

            .isBank {
              .fa-asterisk {
                &:nth-child(4n) {
                  &::after {
                    display: none;
                    width: 0;
                  }
                }
              }
            }
          }

          &.statistics {
            margin-right: 0;

            .your-plan {
              background-color: @color-accent;

              div {
                h3 {
                  text-align: left;

                  i {
                    font-size: 20px;
                  }
                }

                p {
                  line-height: 1.36;
                  max-width: 230px;
                }
              }
            }

            .info {
              min-height: 207px;

              > div {
                &:last-of-type {
                  border-bottom-width: 1px;
                  margin-bottom: 11px;
                }
              }

              p {
                color: @color-primary;
              }
            }
          }
        }

        .info {
          .flex-container-column();
          background: @color-tone-light;

          > div {
            .flex-container-between();
            border-bottom: 1px solid @color-tone-lighter;
            padding: 9px 0;
            width: 100%;

            p {
              color: @color-primary;
              flex: 2;
              font-size: 12px;
              line-height: 1.33;

              &:last-of-type {
                flex: 1;
                margin-left: auto;
                text-align: right;
              }
            }
          }

          p.no-results {
            color: @color-primary;
            font-size: 12px;
            margin: 15px 0;
          }
        }

        .actions {
          .flex-container();
          background: @color-tone-lighter;
          padding: 14px 12.9px 12.6px;

          &.current-promotion {
            .flex-container-column();
            h4 {
              font-size: 11px;
              margin: 0 0 5px 0;
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

          .el-input {
            font-size: 13px;
            margin-right: 8.9px;
          }

          .el-button {
            font-size: 10px;
            padding: 10px 15px;
          }

          p {
            font-size: 10px;
            line-height: 1.3;
            margin: 0;
            text-align: center;
          }

          a {
            .base-font-uppercase();
            color: @color-base;
            display: inline-block;
            font-size: 10px;
            font-weight: 900;
            text-align: center;
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
