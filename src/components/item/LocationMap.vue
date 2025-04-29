<template>
  <div class="location-maps">
    <div class="location">
      <div class="map" v-if="location.geometry"></div>
      <div class="location-info">
        <h5>{{ location.properties.name }} ({{ location.properties.confidence * 100 }}%)</h5>
        <p v-if="location.geometry">
          Latitude: {{ location.geometry.coordinates[0] }}<br>
          Longitude: {{ location.geometry.coordinates[1] }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'location-map',
  data () {
    return {
      googleApiKey: 'AIzaSyBGPpU1h1xStl3FhsYD_CKLddWvZotnulA'
    }
  },
  props: {
    locations: {
      type: Array,
      default: []
    }
  },
  mounted: function () {
    if (this.locations && this.locations.length) {
      this.drawMap()
    }
  },
  methods: {
    drawMap: function () {
      const position = { lat: this.location.geometry.coordinates[0], lng: this.location.geometry.coordinates[1] }
      const map = new window.google.maps.Map(this.$el.querySelector('.map'), {
        zoom: 15,
        center: position
      })
      const marker = new window.google.maps.Marker({
        map,
        position
      })
      return [map, marker]
    }
  },
  computed: {
    location: function () {
      return this.locations[0]
    }
  }
}
</script>

<style lang="less" scoped>
@import (reference) '~src/styles/_variables';

.location {
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 15px;
  .map {
    background-color: @color-base;
    border: 1px solid @color-tone;
    height: 175px;
    margin-right: 15px;
    padding: 2px;
    width: 250px;
  }
  .location-info {
    flex: 1;
    h5 {
      font-size: 13px;
      font-weight: normal;
      margin: 5px 0 10px 0;
    }
    p {
      font-size: 13px;
      line-height: 20px;
    }
  }
}

</style>
