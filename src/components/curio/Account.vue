<template>
  <el-container class="curio">
    <el-header height="69.5" class="site-cap">
      <h1>
        <a href="/#/curio"><span>Wasabi AiR™</span></a>
      </h1>
    </el-header>
    <el-main class="inner-container">
      <progress-bar></progress-bar>
      <div class="account">
        <router-view name="content"></router-view>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import ProgressBar from './ProgressBar.vue'

export default {
  name: 'curio-account',

  components: {
    ProgressBar
  }
}
</script>
