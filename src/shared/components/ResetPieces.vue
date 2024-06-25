<template>
    <div class="white-piece-reset">
        <div class="piece-wrapper" v-for="piece in pieceReset">
            <Piece :piece="piece"></Piece>
        </div>
    </div>
</template>
<script setup lang="ts">

defineProps({

})
</script>
<style lang="scss"></style>