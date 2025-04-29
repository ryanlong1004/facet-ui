<template>
  <div class="time">{{ formattedTime }}<i class="arrow fas fa-caret-right"></i></div>
</template>

<script>
import VuexItemUIStateMixin from '../../../mixins/VuexItemUIStateMixin'
import {mapGetters} from 'vuex'
import {ITEM} from '../../../store/storeModules'
import {ITEM_ID, VIDEO_DATA} from '../../../store/modules/item/getterTypes'
import {getDisplayTimeCodeOrFrame} from '../../../store/modules/item/helpers'

export default {
  name: 'time-code-label',
  mixins: [
    VuexItemUIStateMixin
  ],
  props: {
    startAt: {
      type: Number,
      required: true
    }
  },
  computed: {
    ...mapGetters(ITEM, {
      itemId: ITEM_ID,
      videoData: VIDEO_DATA
    }),
    formattedTime () {
      let offset
      if (this.videoData && this.videoData.details) {
        let videoInfo = this.videoData.details
        if (videoInfo && videoInfo.other && videoInfo.other.time_code_of_first_frame) {
          offset = videoInfo.other.time_code_of_first_frame
        }
      }

      let frameRate, frameCount
      if (this.videoData && this.videoData.details) {
        let videoInfo = this.videoData.details
        if (videoInfo && videoInfo.video && videoInfo.video.frame_rate) {
          frameRate = videoInfo.video.frame_rate
        }
        if (videoInfo && videoInfo.video && videoInfo.video.frame_count) {
          frameCount = videoInfo.video.frame_count
        }
      }
      if (!frameRate) {
        frameRate = 24 // default 24 FPS
      }

      return getDisplayTimeCodeOrFrame(this.startAt, frameRate, frameCount, offset, this.timeCodeOrFrame)
    }
  }
}
</script>
