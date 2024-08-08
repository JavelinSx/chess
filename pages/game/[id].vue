<template>
    <div class="game-page">
        <h1>Chess Game</h1>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <template v-if="gameStore.currentGame">
            <div v-if="gameStore.currentGame.status === 'waiting'">
                Waiting for opponent to join...
            </div>
            <template v-else>
                <p>Game Status: {{ gameStore.currentGame.status }}</p>
                <chess-board :game="gameStore.currentGame" :board="gameStore.currentGame.board"
                    :current-turn="gameStore.currentGame.currentTurn" @move="makeMove" />
                <div>
                    <p>Ваш цвет: {{ playerColor }}</p>
                    <p>Ходит: {{ gameStore.currentGame.currentTurn }}</p>
                    <p v-if="gameStore.currentGame.status === 'completed'">
                        Game over! Winner: {{ gameStore.currentGame.winner || 'Draw' }}
                    </p>
                </div>
            </template>
        </template>
        <div v-else-if="!errorMessage">
            Loading game...
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '~/store/game';
import { useUserStore } from '~/store/user';
import ChessBoard from '~/entities/game/ui/ChessBoard.vue';
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

const playerColor = computed(() => {
    if (gameStore.currentGame) {
        if (gameStore.currentGame.players.white === userStore._id) {
            return 'White';
        } else if (gameStore.currentGame.players.black === userStore._id) {
            return 'Black';
        }
    }
    return 'Unknown';
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
.error-message {
    color: red;
    font-weight: bold;
}
</style>