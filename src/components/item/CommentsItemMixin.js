export default {
  props: {

  },
  data () {
    return {
      commentsToggle: false
    }
  },
  mounted: function () {
  },
  beforeDestroy: function () {
  },
  watch: {
  },
  methods: {
    handleCommand ($event) {
      if ($event === 'comment') {
        this.commentsToggle = !this.commentsToggle
      }
    }
  }
}
