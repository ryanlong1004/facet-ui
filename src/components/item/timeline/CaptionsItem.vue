<template>
  <div class="item-details ocr-item" @click.stop="$emit('item-clicked')">
    <time-code-label :start-at='startAt'/>
    <div class="arrow-left"></div>
    <div>
      <span :innerHTML.prop="textContent || '&nbsp;' | highlightFilter({ insights: true, type: CONSTANTS.HIGHLIGHT_TYPES.CAPTIONS })"></span>
    </div>
  </div>
</template>

<script>
import TimeCodeLabel from './TimeCodeLabel'

export default {
  name: 'captions-item',
  components: {TimeCodeLabel},
  props: {
    textContent: {
      type: String,
      required: true
    },
    displayTime: {
      type: String,
      required: true
    },
    startAt: {
      type: Number,
      required: true
    }
  }
}
</script>
