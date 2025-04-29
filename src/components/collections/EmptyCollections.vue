<template>
  <empty-states :page="CONSTANTS.EMPTY_STATES.COLLECTIONS"></empty-states>
</template>

<script>
import EmptyStates from 'src/components/global/EmptyStates'

export default {
  name: 'empty-collections',

  components: {
    EmptyStates
  }
}
</script>
