<template>
  <div class="category list">
    <el-tooltip
      :content="listName"
      :open-delay="CONSTANTS.TOOLTIP.OPEN_DELAY"
      class="item"
      effect="dark"
      placement="top-start"
    >
      <div class="category-name"><span v-truncate-text.end="30">{{ listName }}</span> ({{ listCount }})</div>
    </el-tooltip>
  </div>
</template>

<script>
  import TruncateText from 'src/directives/truncate-text.directive'

  export default {
    name: 'category',
    directives: {
      TruncateText
    },
    props: {
      listName: {
        type: String,
        default: ''
      },
      listCount: {
        type: Number,
        default: 0
      }
    }
  }
</script>
