<!-- pages/game/[id].vue -->
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
                <p>Board data: {{ JSON.stringify(gameStore.currentGame.board) }}</p>
                <chess-board :board="gameStore.currentGame.board" :current-turn="gameStore.currentGame.currentTurn"
                    @move="makeMove" />
                <div>
                    <p>Current turn: {{ gameStore.currentGame.currentTurn }}</p>
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
import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGameStore } from '~/features/game-logic/model/game.store';
import ChessBoard from '~/entities/game/ui/ChessBoard.vue';

const route = useRoute();
const router = useRouter();
const gameStore = useGameStore();

const errorMessage = ref<string | null>(null);

let eventSource: EventSource | null = null;

onMounted(async () => {
    const gameId = route.params.id as string;

    try {
        await gameStore.fetchGame(gameId);
        console.log('Game fetched:', JSON.stringify(gameStore.currentGame, null, 2));
        setupSSE(gameId);
    } catch (error) {
        console.error('Failed to fetch game:', error);
        errorMessage.value = 'Failed to load the game. Please try again.';
    }
});

onUnmounted(() => {
    closeSSE();
});

function setupSSE(gameId: string) {
    eventSource = new EventSource(`/api/sse/game-moves?gameId=${gameId}`);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'game_update' && data.game) {
            gameStore.updateGameState(data.game);
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        errorMessage.value = 'Lost connection to the game. Trying to reconnect...';
        closeSSE();
        setTimeout(() => setupSSE(gameId), 5000); // Попытка переподключения через 5 секунд
    };
}

function closeSSE() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
}

function makeMove(from: [number, number], to: [number, number]) {
    gameStore.makeMove(from, to);
}
</script>



<style scoped>
.error-message {
    color: red;
    font-weight: bold;
}
</style>