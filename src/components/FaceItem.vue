<template>
    <div class="face" :style="style">
        <!-- Remove Button -->
        <div class="remove-face-button" v-if="removable" @click="$emit('remove', face)">
            <i class="far fa-times">X</i>
        </div>

        <!-- Face Image -->
        <PersonFaceImage :image-url="face.imageUrl" :border-radius="faceBorderRadius" :height="faceHeight"
            :width="faceWidth" />
    </div>
</template>

<script setup>
import { defineProps } from 'vue'
import PersonFaceImage from './PersonFaceImage.vue'

defineProps({
    face: {
        type: Object,
        required: true
    },
    removable: {
        type: Boolean,
        default: false
    },
    faceBorderRadius: {
        type: String,
        default: '0px'
    },
    faceHeight: {
        type: String,
        default: '100px'
    },
    faceWidth: {
        type: String,
        default: '100px'
    },
    style: {
        type: Object,
        default: () => ({})
    }
})
</script>

<style scoped>
.face {
    position: relative;
    display: flex;
    flex-direction: row;
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .remove-face-button {
        position: absolute;
        top: 4px;
        right: 4px;
        background-color: red;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
    }
}
</style>
