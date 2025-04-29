<template>
  <h1 class="centered">{{reason}}</h1>
</template>

<script>
export default {
  name: 'error',
  data: function () {
    return {
      reason: this.$route.query.reason
    }
  }
}
</script>

<style>
  .centered {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>
