<template>
  <ul class="cognitive-icons">
    <li class="cognitive-icons__icon cognitive-icons__icon--adult" v-if="matches[HIT_TYPES.NSFW]" @click.stop>
      <el-tooltip effect="light" placement="top" content="Not safe for work"><i class="far fa-eye-slash"></i></el-tooltip>
    </li>
    <li class="cognitive-icons__icon cognitive-icons__icon--logos" v-if="matches[HIT_TYPES.LOGOS]" @click.stop>
      <el-tooltip effect="light" placement="top" content="Known Graphics / Logos"><i class="far fa-images"></i></el-tooltip>
    </li>
    <li class="cognitive-icons__icon cognitive-icons__icon--ocr" v-if="matches[HIT_TYPES.OCR]" @click.stop>
      <el-tooltip effect="light" placement="top" content="Visual Text (OCR)"><i class="icon-OCR"></i></el-tooltip>
    </li>
    <li class="cognitive-icons__icon cognitive-icons__icon--people" v-if="matches[HIT_TYPES.PEOPLE]" @click.stop>
      <el-tooltip effect="light" placement="top" content="People / Celebrities"><i class="far fa-user"></i></el-tooltip>
    </li>
    <li class="cognitive-icons__icon cognitive-icons__icon--s2t" v-if="matches[HIT_TYPES.SPEECH_TO_TEXT]" @click.stop>
      <el-tooltip effect="light" placement="top" content="Speech to Text"><i class="far fa-comments-alt"></i></el-tooltip>
    </li>
    <li class="cognitive-icons__icon cognitive-icons__icon--tags" v-if="matches[HIT_TYPES.TAGS]" @click.stop>
      <el-tooltip effect="light" placement="top" content="Tags"><i class="far fa-tags"></i></el-tooltip>
    </li>
    <li class="cognitive-icons__icon cognitive-icons__icon--tags" v-if="matches[HIT_TYPES.CUSTOM_TAGS]" @click.stop>
      <el-tooltip effect="light" placement="top" content="Custom Tags"><i class="far fa-user-tag"></i></el-tooltip>
    </li>
    <li class="cognitive-icons__icon cognitive-icons__icon--tags" v-if="matches[HIT_TYPES.CAPTIONS]" @click.stop>
      <el-tooltip effect="light" placement="top" content="Closed Captions"><i class="far fa-closed-captioning"></i></el-tooltip>
    </li>
  </ul>
</template>

<script>
const HIT_TYPES = {
  CAPTIONS: 'caption',
  CUSTOM_TAGS: 'custom_tag',
  LOGOS: 'logos',
  NSFW: 'nsfw',
  OCR: 'ocr',
  PEOPLE: 'people',
  SPEECH_TO_TEXT: 'speech_to_text',
  TAGS: 'tag'
}
export default {
  name: 'cognitive-icons',
  data () {
    return {
      HIT_TYPES
    }
  },
  props: {
    matches: {
      type: Object,
      default: () => {}
    },
    nsfw: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="less">
@import (reference) '~src/styles/_variables';
.cognitive-icons {
  display: flex;
  flex-direction: row;
  list-style: none;
  margin: 0;
  padding: 0;
  &__icon {
    line-height: 11px;
    padding: 8px 0 8px 8px;
    > i {
      color: @color-base;
      font-size: 11px;
    }
  }
}
</style>
