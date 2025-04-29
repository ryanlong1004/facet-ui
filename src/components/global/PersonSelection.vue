<script>
  import CroppedImage from '../thumbnail/CroppedImage.vue'

  export default {
    name: 'person-selection',
    functional: true,
    components: {
      CroppedImage
    },
    render: function (h, ctx) {
      ctx.props.item.rect = {height: 162, left: 188, top: 123, width: 162}
      ctx.props.item.url = '/files/068bb3332979d7db36a3bdb6e02dd138/video_main_frames/frame-0000000043.jpg'
      let item = ctx.props.item

      return h('li', ctx.data, [
        h('cropped-image', {attrs: {url: item.url, rect: item.rect, rounded: true, width: '30px'}}, [item]),
        h('div', { attrs: { class: 'value' } }, [item.value])
      ])
    },
    props: {
      item: {
        type: Object,
        required: true
      }
    }
  }
</script>

<style lang="less" scoped>
  li {
    display: flex;
    align-items: center;

    padding-top: 6px;
    padding-bottom: 6px;

    font-size: 20px;
    font-weight: 300;
    canvas {
      width: 50px;
      height: 50px;

      margin-right: 10px;
    }
  }
</style>
