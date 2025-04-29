<template>
  <div class="content">
    <div class="content-platform-features">
      <admin-insights v-if="$hasScope(SCOPES.EDIT_KEYWORDS)"></admin-insights>
    </div>
  </div>
</template>

<script>
import AdminInsights from './AdminInsights.vue'

export default {
  name: 'admin-platform-features',

  components: {
    AdminInsights
  }
}
</script>
