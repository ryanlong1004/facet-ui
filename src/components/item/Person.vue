<template>
  <div class="people-list__item" :class="{ active: personStatus }">
    <template v-if="personKnown">
      <drop @drop="knownPerson => $emit('handle-drop-person', knownPerson)">
        <div class="face-image known-person" :style="{ 'background-image': `url(${personFaceUrl})` }"></div>
      </drop>
      <p>{{ personName }}</p>
      <img src="../../assets/Combine.svg" class="group-into-icon">
    </template>
    <div v-else class="face-image unknown-person" :style="{ 'background-image': `url(${personFaceUrl})` }"></div>
  </div>
</template>

<script>
export default {
  name: 'person',

  props: {
    personFaceUrl: {
      type: String,
      required: true
    },
    personId: {
      type: String,
      required: true
    },
    personKnown: {
      type: Boolean,
      required: true
    },
    personName: {
      type: String,
      required: true
    },
    personStatus: {
      type: Boolean,
      required: true
    }
  }
}
</script>

<style lang="less" scoped>
  @import '../../styles/_variables';
  @import '../../styles/_mixins';

  @menu-face-image-size: 60px;

  .people-list__item {
    .flex-container();
    cursor: pointer;
    margin: 8px 8px 0 0;
    position: relative;
    transition: 100ms ease-out;

    .face-image {
      .size(60px, 60px);
      background: center no-repeat;
      background-size: cover;
      border: 3px solid @item-grey;
      border-radius: 6px;
      box-sizing: border-box;
      margin-right: 5px;
    }

    &.active {
      .face-image {
        border-color: @primary-button-color;
      }
    }

    > p {
      color: @text-medium;
      font-size: 12px;
      padding-left: 10px;
    }

    img.group-into-icon {
      .abs-pos(-1px, auto, auto, -1px);
      .size(20px, 20px);
      background-color: @color-dark-shadow;
      border-radius: 100%;
      display: none;
      padding: 3px;
    }

    &.dragged-over {
      img.group-into-icon {
        display: inline-block;
      }
    }
  }

</style>
