import { mapGetters } from 'vuex'
import { getSaasPlanChangeCookieFormatted, deleteSaasPlanChangeCookie } from 'src/cookie-helper'
import { DASHBOARD } from 'src/store/storeModules'
import { GET_CURRENT_PLAN, FETCH_BILLING } from 'src/store/modules/dashboard/dashboard'

export default {
  data () {
    return {
      isChangingSaasPlan: false,
      checkSaasPlanCookieInterval: false
    }
  },
  mounted () {
    this.checkSaasPlanCookieInterval = setInterval(this.checkSaasPlanChangeCookie, 10 * 1000)
    this.checkSaasPlanChangeCookie()
  },
  beforeDestroy () {
    clearInterval(this.checkSaasPlanCookieInterval)
  },
  computed: {
    ...mapGetters(DASHBOARD, {
      currentPlan: GET_CURRENT_PLAN
    })
  },
  methods: {
    checkSaasPlanChangeCookie () {
      const c = getSaasPlanChangeCookieFormatted()
      if (c !== null) {
        this.isChangingSaasPlan = this.currentPlan !== c.new
        if (!this.isChangingSaasPlan) {
          deleteSaasPlanChangeCookie()
          clearInterval(this.checkSaasPlanCookieInterval)
        } else {
          this.$store.dispatch(`${DASHBOARD}/${FETCH_BILLING}`)
        }        
      } else {
        clearInterval(this.checkSaasPlanCookieInterval)
      }
    }
  }
}
