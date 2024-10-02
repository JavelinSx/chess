<template>
    <UModal v-model="isOpen">
        <UCard>
            <template #header>
                <h3 class="text-lg font-semibold">{{ t('game.promotionPawn') }}</h3>
            </template>
            <div class="flex justify-around">
                <button v-for="piece in promotionOptions" :key="piece" @click="selectPiece(piece)"
                    class="promotion-piece">
                    {{ getPieceSymbol(piece, color) }}
                </button>
            </div>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { PieceType, PieceColor } from '~/server/types/game';

const { t } = useI18n();

const props = defineProps<{
    color: PieceColor;
}>();

const emit = defineEmits<{
    (e: 'select', piece: PieceType): void;
}>();

const isOpen = ref(true);
const promotionOptions: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

function getPieceSymbol(piece: PieceType, color: PieceColor): string {
    const symbols: Record<PieceType, string> = {
        king: color === 'white' ? '♔' : '♚',
        queen: color === 'white' ? '♕' : '♛',
        rook: color === 'white' ? '♖' : '♜',
        bishop: color === 'white' ? '♗' : '♝',
        knight: color === 'white' ? '♘' : '♞',
        pawn: color === 'white' ? '♙' : '♟'
    };
    return symbols[piece];
}

function selectPiece(piece: PieceType) {
    emit('select', piece);
    isOpen.value = false;
}
</script>

<style scoped>
.promotion-piece {
    font-size: 2rem;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
}

.promotion-piece:hover {
    background-color: #f0f0f0;
}
</style>