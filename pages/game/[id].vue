<template>
    <UContainer class="py-8 px-0 sm:px-1">
        <UCard v-if="errorMessage" color="red" class="mb-4 ">
            <p>{{ t(errorMessage) }}</p>
        </UCard>
        <template v-if="gameStore.currentGame">
            <UCard v-if="gameStore.currentGame.status === 'waiting'" class="mb-4">
                <p class="text-center">{{ t('game.waitingForOpponent') }}</p>
            </UCard>
            <template v-else>
                <chess-board :game="gameStore.currentGame" :board="gameStore.currentGame.board"
                    :current-turn="gameStore.currentGame.currentTurn" @move="makeMove" class="mb-4" />
                <captured-pieces :captured-pieces="gameStore.currentGame.capturedPieces" />
            </template>
        </template>
        <UCard v-else-if="!errorMessage" class="mb-4">
            <USkeleton class="h-full w-full" />
            <p class="text-center mt-2">{{ t('game.loadingGame') }}</p>
        </UCard>
    </UContainer>
    <GameResultModal v-if="gameStore.showResultModal" />
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGameStore } from '~/store/game';
import ChessBoard from '~/features/game/ui/ChessBoard.vue';
import CapturedPieces from '~/features/game/ui/CapturedPieces.vue';
import GameResultModal from '~/features/game/ui/GameResultModal.vue';
import { useGameMovesSSE } from '~/composables/sse/useGameMovesSSE';

const { t } = useI18n();
const route = useRoute();
const gameStore = useGameStore();
const gameId = route.params.id as string;
const errorMessage = ref<string | null>(null);

useGameMovesSSE(gameId)

onMounted(async () => {
    try {
        await gameStore.fetchGame(gameId);

    } catch (error) {
        errorMessage.value = 'Failed to load the game. Please try again.';
    }
});

async function makeMove(from: [number, number], to: [number, number]) {
    try {
        await gameStore.makeMove(from, to);
    } catch (error) {
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