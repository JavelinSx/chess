<template>
    <UModal v-model="isOpen">
        <UCard>
            <template #header>
                <h3 class="text-lg font-semibold">Promote Pawn</h3>
            </template>
            <div class="flex justify-around">
                <button v-for="piece in promotionOptions" :key="piece" @click="selectPiece(piece)"
                    class="promotion-piece">
                    {{ getPieceSymbol(piece, props.color) }}
                </button>
            </div>
        </UCard>
    </UModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { PieceType } from '~/entities/game/model/board.model';
import { useGameStore } from '~/store/game';

const props = defineProps<{
    color: 'white' | 'black';
}>();

const emit = defineEmits<{
    (e: 'select', piece: PieceType): void;
}>();

const gameStore = useGameStore()
const isOpen = ref(true);
const promotionOptions: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];

function getPieceSymbol(piece: PieceType, color: 'white' | 'black'): string {
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
    gameStore.promotion.piece = piece
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