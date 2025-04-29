<template>
  <video v-if="previewPath" ref="video" class="video-js vjs-default-skin vjs-big-play-centered"
    :poster="'/files/' + itemId + '/video_main_frames/frame-0000000000.jpg'" preload="none" width="100%" controls="true"
    :data-setup="videoConfig">
    <source :src="'/files/' + previewPath" type="video/mp4">
    <track v-for="(caption, index) in captionsList" :key="caption.id" kind="captions"
      :src="'/api/data/v3/items/' + itemId + '/captions/download-vtt?caption_id=' + caption.id"
      :srclang="caption.srclang" :label="caption.label">
    <audio v-for="audio in extAudios" v-if="!extAudiosLoading" :id="'myaudio-' + audio.id" class="myaudioclass"
      ref="myaudio" :key="audio.id" controls>
      <source :src="'/files/' + audio.id + '/audio_previews/playback.mp3'" type="audio/mpeg" />
    </audio>
  </video>
  <div v-else>
    <img class="no-preview" src="../../assets/no-preview.png" />
  </div>
</template>

<script>
import videojs from 'video.js'
import videotimecodeplugin from '../../plugins/videotimecodeplugin'
import { SCOPES } from 'src/plugins/ScopeEnforcer'
import { CAPTIONS, EXT_AUDIOS, ITEM, ITEM_UI_STATE, SESSION } from 'src/store/storeModules'
import { GET_USER_SCOPES } from 'src/store/modules/session/session'
import VuexItemMixin from 'src/mixins/VuexItemMixin'
import PlayheadMixin from 'src/mixins/PlayheadMixin'
import { PROPERTY_PATHS } from 'src/property-paths'
import { mapGetters } from 'vuex'
import { ITEM_ID, VIDEO_DATA } from 'src/store/modules/item/getterTypes'
import VuexItemUIStateMixin from '../../mixins/VuexItemUIStateMixin'
import {
  GET_CAPTIONS_LIST,
  GET_CURRENT_CAPTION
} from '../../store/modules/item/captions/getters'

import {
  GET_ENABLED_EXT_AUDIO_ID,
  GET_EXT_AUDIOS, GET_EXT_AUDIOS_IS_CHANGED_ON_MENU,
  GET_EXT_AUDIOS_LOADING
} from '../../store/modules/item/ext-audios/getters'
import {
  SET_EXT_AUDIOS_IS_CHANGED_ON_MENU,
  SET_EXT_ENABLED_AUDIO_ID
} from '../../store/modules/item/ext-audios/mutations'

export default {
  name: 'video-player',
  mixins: [VuexItemMixin, VuexItemUIStateMixin, PlayheadMixin],
  data() {
    return {
      onKeyDownID: null,
      videoPlayer: null
    }
  },
  mounted() {
    this.$watch('seekTo', function (newVal, oldVal) {
      if (newVal >= 0 && this.videoPlayer) {
        if (!this.videoPlayer.hasStarted()) {
          let cvol = this.videoPlayer.volume()
          this.videoPlayer.volume(0)
          this.videoPlayer.currentTime(newVal)
          setTimeout(() => {
            this.videoPlayer.play()
              .then(() => {
                this.videoPlayer.pause()
                this.videoPlayer.volume(cvol)
              })
              .catch(error => {
                console.error(error)
              })
          })
        } else {
          this.videoPlayer.currentTime(newVal)
          this.videoPlayer.pause()
        }
      }
    }, { immediate: true })

    this.$watch('forceStopCount', function (newVal, oldVal) {
      if ((newVal !== oldVal) && this.videoPlayer) {
        this.videoPlayer.pause()
      }
    })

    this.$watch('previewPath', function (newVal, oldVal) {
      if (newVal.length) {
        this.$nextTick(() => {
          this.setupVideo()
        })
      }
    }, { immediate: true })

    this.$watch('extAudios', () => {
      this.setupAudioTracks()
      this.syncVideoAndAudioTime()
    })

    this.$watch('enabledAudioId', () => {
      if (!this.isAudioTrackChangedFromMenu) {
        this.setupAudioTracks()
      }
      this.onAudioTrackSwitched()
    })

    this.$watch('captionsList', () => {
      if (this.videoPlayer) {
        let tracks = this.videoPlayer.textTracks()
        for (let i = tracks.length - 1; i >= 0; i--) {
          this.videoPlayer.removeRemoteTextTrack(tracks[i])
        }
      }

      this.captionsList.forEach((caption, index) => {

        let captionOption = {
          kind: 'captions',
          srclang: caption.srclang,
          label: caption.label,
          src: '/api/data/v3/items/' + this.itemId + '/captions/download-vtt?caption_id=' + caption.id
        }
        this.videoPlayer.addRemoteTextTrack(captionOption)
      })
    })
  },
  beforeDestroy: function () {
    if (this.videoPlayer && this.videoPlayer.dispose) {
      this.videoPlayer.dispose()
    }
    document.removeEventListener('keydown', this.onKeyDownID)
    this.onKeyDownID = null
  },
  methods: {
    setupVideo: function () {
      if (this.$refs['video'] && this.videoPlayer === null) {
        this.videoPlayer = videojs(this.$refs['video'])
        this.videoPlayer.videotimecodeplugin({
          debug: false,
          textcolor: 'white',
          framerate: this.frameRate, // Must round for videotimecodeplugin
          toggleTimeCodeCallBack: (timeCodeOrFrame) => {
            this.setTimeCodeOrFrame(timeCodeOrFrame)
          },
          timecodeoffset: {
            format: 'OFFSET_IN_SMPTE',
            offset: this.timecodeOffset
          }
        })
        this.onKeyDownID = this.onKeyDown.bind(this)

        this.videoPlayer.on('ready', e => {
          this.videoPlayer.on('timeupdate', this.onTimeChange)
          this.videoPlayer.on('play', this.onPlay)
          this.videoPlayer.on('pause', this.onPause)
          this.videoPlayer.on('stop', this.onStop)
          this.videoPlayer.on('ended', this.onEnded)
          let initSeeked = false
          this.videoPlayer.on('durationchange', () => {
            const d = this.videoPlayer.duration()
            if (this.seekTo > 0 && d > this.seekTo && !initSeeked) {
              initSeeked = true
              this.videoPlayer.currentTime(this.seekTo)
              setTimeout(() => {
                this.videoPlayer.play()
                  .then(() => {
                    this.videoPlayer.pause()
                    this.videoPlayer.muted(false)
                  })
                  .catch(error => {
                    console.error(error)
                  })
              })
            }
          })
          document.addEventListener('keydown', this.onKeyDownID)
          // Disable right-click on video for non-admins based on the ITEM_DOWNLOAD scope
          if (this.$store.getters[`${SESSION}/${GET_USER_SCOPES}`].indexOf(SCOPES.ITEM_DOWNLOAD) < 0) {
            this.videoPlayer.on('contextmenu', e => {
              e.preventDefault()
            })
          }
        }) // ready
      }
    },
    setupAudioTracks() {
      let audioTrackList = this.videoPlayer.audioTracks()
      for (let i = audioTrackList.length - 1; i >= 0; i--) {
        audioTrackList.removeTrack(audioTrackList[i])
      }
      audioTrackList.removeEventListener('change')

      let track = new videojs.AudioTrack({
        id: 'embeded-audio-track',
        label: 'Embeded Audio',
        language: 'eng',
        enabled: this.enabledAudioId === '' || !this.enabledAudioId
      })

      audioTrackList.addTrack(track)

      this.extAudios.forEach((audio, index) => {
        track = new videojs.AudioTrack({
          id: 'audio-track-' + audio.id,
          label: audio.name,
          enabled: audio.id === this.enabledAudioId
        })
        audioTrackList.addTrack(track)
      })

      // Listen to the "change" event.
      audioTrackList.addEventListener('change', () => this.onAudioTrackSwitched())
    },
    onAudioTrackSwitched() {
      if (this.videoPlayer) {
        this.videoPlayer.pause()
        let audioTrackList = this.videoPlayer.audioTracks()
        for (let i = 0; i < audioTrackList.length; i++) {
          const track = audioTrackList[i]
          if (track.enabled) {
            if (this.$refs['myaudio']) {
              let enabledAudioPlayer = this.$refs['myaudio'].filter(element => !element.paused)[0]
              if (enabledAudioPlayer) {
                enabledAudioPlayer.pause()
              }
              if (track.id === 'embeded-audio-track') {
                this.videoPlayer.muted(false)
                this.$store.commit(`${EXT_AUDIOS}/${SET_EXT_AUDIOS_IS_CHANGED_ON_MENU}`, true)
                this.$store.commit(`${EXT_AUDIOS}/${SET_EXT_ENABLED_AUDIO_ID}`, '')
              } else {
                this.videoPlayer.muted(true)
                const audioId = track.id.substring(12)
                let enabledAudioPlayer = this.$refs['myaudio'].filter(element => element.id === 'myaudio-' + audioId)[0]
                if (enabledAudioPlayer) {
                  enabledAudioPlayer.currentTime = this.videoPlayer.currentTime()
                  enabledAudioPlayer.pause()
                }
                this.$store.commit(`${EXT_AUDIOS}/${SET_EXT_AUDIOS_IS_CHANGED_ON_MENU}`, true)
                this.$store.commit(`${EXT_AUDIOS}/${SET_EXT_ENABLED_AUDIO_ID}`, audioId)
              }
            }
            break
          }
        }
      }
    },
    syncVideoAndAudioTime() {
      let videoPaused = true
      try {
        videoPaused = this.videoPlayer.paused()
      } catch (e) { }
      if (this.videoPlayer && !videoPaused) {
        const videoTime = this.videoPlayer.currentTime()
        if (this.$refs['myaudio']) {
          let enabledAudioPlayer = this.$refs['myaudio'].filter(element => element.id === 'myaudio-' + this.enabledAudioId)[0]
          if (enabledAudioPlayer) {
            const audioTime = enabledAudioPlayer.currentTime
            if (Math.abs(audioTime - videoTime) > 0.5) {
              enabledAudioPlayer.currentTime = videoTime
            }
          }
        }
      }
      setTimeout(() => this.syncVideoAndAudioTime(), 1000)
    },
    playSidecarAudio() {
      if (this.$refs['myaudio']) {
        let enabledAudioPlayer = this.$refs['myaudio'].filter(element => element.id === 'myaudio-' + this.enabledAudioId)[0]
        if (enabledAudioPlayer) {
          enabledAudioPlayer.play()
        }
      }
    },
    pauseSidecarAudio() {
      if (this.$refs['myaudio']) {
        let enabledAudioPlayer = this.$refs['myaudio'].filter(element => element.id === 'myaudio-' + this.enabledAudioId)[0]
        if (enabledAudioPlayer) {
          enabledAudioPlayer.pause()
        }
      }
    },
    stopSidecarAudio() {
      if (this.$refs['myaudio']) {
        let enabledAudioPlayer = this.$refs['myaudio'].filter(element => element.id === 'myaudio-' + this.enabledAudioId)[0]
        if (enabledAudioPlayer) {
          enabledAudioPlayer.stop()
        }
      }
    },
    sidecarAudioTimeChange() {
      let videoPaused = true
      try {
        videoPaused = this.videoPlayer.paused()
      } catch (e) { }
      if (this.videoPlayer && !videoPaused) {
        const videoTime = this.videoPlayer.currentTime()
        if (this.$refs['myaudio']) {
          let enabledAudioPlayer = this.$refs['myaudio'].filter(element => element.id === 'myaudio-' + this.enabledAudioId)[0]
          if (enabledAudioPlayer) {
            const audioTime = enabledAudioPlayer.currentTime
            if (Math.abs(audioTime - videoTime) > 0.5) {
              enabledAudioPlayer.currentTime = videoTime
            }
          }
        }
      }
    },
    onTimeChange: function (e) {
      this.currentPlayheadTime = this.videoPlayer.currentTime()
      this.sidecarAudioTimeChange()
    },
    onPlay: function (e) {
      this.playSidecarAudio()
    },
    onPause: function (e) {
      this.pauseSidecarAudio()
    },
    onStop: function (e) {
      this.stopSidecarAudio()
    },
    onEnded: function (e) {
      this.stopSidecarAudio()
    },
    onKeyDown: function (e) {
      if (e.keyCode === 32 && ['INPUT', 'TEXTAREA'].indexOf(e.srcElement.nodeName.toUpperCase()) < 0) {
        let videoPaused = true
        try {
          videoPaused = this.videoPlayer.paused()
        } catch (e) { }
        if (videoPaused) {
          this.videoPlayer.play()
          this.playSidecarAudio()
        } else {
          this.videoPlayer.pause()
          this.pauseSidecarAudio()
        }
        e.preventDefault()
      }
    }
  },
  computed: {
    ...mapGetters(ITEM, {
      itemId: ITEM_ID,
      videoData: VIDEO_DATA
    }),

    ...mapGetters(CAPTIONS, {
      captionsList: GET_CAPTIONS_LIST,
      currentCaption: GET_CURRENT_CAPTION
    }),

    ...mapGetters(EXT_AUDIOS, {
      extAudiosLoading: GET_EXT_AUDIOS_LOADING,
      extAudios: GET_EXT_AUDIOS,
      enabledAudioId: GET_ENABLED_EXT_AUDIO_ID,
      isAudioTrackChangedFromMenu: GET_EXT_AUDIOS_IS_CHANGED_ON_MENU
    }),

    previewPath() {
      return _.get(this.item, PROPERTY_PATHS.PREVIEW_PATH.path)
    },

    videoConfig: function () {
      return JSON.stringify({
        aspectRatio: '16:9',
        controlBar: {
          pictureInPictureToggle: false
        },
        muted: false,
        playbackRates: [0.5, 1, 1.5, 2, 4, 8, 16],
        preload: true
      })
    },

    timecodeOffset: function () {
      let offset
      if (this.videoData && this.videoData.details) {
        let videoInfo = this.videoData.details
        if (videoInfo && videoInfo.other && videoInfo.other.time_code_of_first_frame) {
          offset = videoInfo.other.time_code_of_first_frame
        }
      }
      return offset
    },

    frameRate: function () {
      let frameRate = 24 // default 24 FPS
      if (this.videoData && this.videoData.details) {
        let videoInfo = this.videoData.details
        if (videoInfo && videoInfo.video && videoInfo.video.frame_rate) {
          frameRate = videoInfo.video.frame_rate
        }
      }
      return parseFloat(frameRate)
    }
  }
}
</script>

<style>
.vjs-menu-button-popup .vjs-menu .vjs-menu-content {
  width: auto !important;
  white-space: nowrap;
  overflow-x: hidden;
  text-overflow: ellipsis;
  right: 0;
  z-index: 1;
}

.vjs-menu li.vjs-menu-item {
  padding-left: 4px;
  padding-right: 4px;
}
</style>

<style lang="less" scoped>
video {
  width: 100%;
  height: auto;
}

.no-preview {
  width: 100%;
}
</style>
