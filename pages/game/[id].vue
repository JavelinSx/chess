<template>
    <UContainer class="py-8">
        <h1 class="text-3xl font-bold mb-6 text-center">Chess Game</h1>
        <UCard v-if="errorMessage" color="red" class="mb-4">
            <p>{{ errorMessage }}</p>
        </UCard>
        <template v-if="gameStore.currentGame">
            <UCard v-if="gameStore.currentGame.status === 'waiting'" class="mb-4">
                <p class="text-center">Waiting for opponent to join...</p>
            </UCard>
            <template v-else>
                <chess-board :game="gameStore.currentGame" :board="gameStore.currentGame.board"
                    :current-turn="gameStore.currentGame.currentTurn" @move="makeMove" class="mb-4" />

                <captured-pieces :captured-pieces="gameStore.currentGame.capturedPieces" />
            </template>
        </template>
        <UCard v-else-if="!errorMessage" class="mb-4">
            <USkeleton class="h-64 w-full" />
            <p class="text-center mt-2">Loading game...</p>
        </UCard>
    </UContainer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '~/store/game';
import { useUserStore } from '~/store/user';
import ChessBoard from '~/entities/game/ui/ChessBoard.vue';
import CapturedPieces from '~/features/game-logic/ui/CapturedPieces.vue';
import { useGameSSE } from '~/composables/useGameSSE';

const route = useRoute();
const userStore = useUserStore()
const gameStore = useGameStore();
const gameId = route.params.id as string;
const errorMessage = ref<string | null>(null);
useGameSSE(gameId)
onMounted(async () => {
    try {
        await gameStore.fetchGame(gameId);

    } catch (error) {
        console.error('Error fetching game:', error);
        errorMessage.value = 'Failed to load the game. Please try again.';
    }
});

async function makeMove(from: [number, number], to: [number, number]) {
    console.log(`Making move from [${from}] to [${to}]`);
    try {

        await gameStore.makeMove(from, to);
    } catch (error) {
        console.error('Error making move:', error);
        errorMessage.value = 'Failed to make move. Please try again.';
    }
}
</script>

<style scoped>
.game-page {
    max-width: 800px;
    margin: 0 auto;
}

@media (max-width: 768px) {
    .game-page {
        padding: 1rem;
    }
}
</style>