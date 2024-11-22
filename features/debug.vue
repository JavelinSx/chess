<!-- DebugLogger.vue -->
<template>
    <UCard v-if="showDebug" class="fixed bottom-0 left-0 right-0 z-50 max-h-48 overflow-auto bg-white dark:bg-gray-800">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-sm font-semibold">Debug Logs</h3>
            <div class="flex gap-2">
                <USelect v-model="logType" :options="logTypes" size="xs" />
                <UButton @click="clearLogs" size="xs">Clear</UButton>
            </div>
        </div>
        <div class="text-xs font-mono">
            <div v-for="(log, index) in filteredLogs" :key="index" :class="{
                'text-red-500': log.type === 'error',
                'text-yellow-500': log.type === 'warn',
                'text-blue-500': log.type === 'info'
            }" class="py-1">
                [{{ log.type }}] {{ log.timestamp }}: {{ log.message }}
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
interface LogEntry {
    type: 'log' | 'error' | 'warn' | 'info';
    message: string;
    timestamp: string;
    key: string;
}

const showDebug = ref(true);
const logs = ref<LogEntry[]>([]);
const logType = ref('all');
const logCache = new Set<string>();

const logTypes = [
    { label: 'All', value: 'all' },
    { label: 'Errors', value: 'error' },
    { label: 'Warnings', value: 'warn' },
    { label: 'Info', value: 'info' },
    { label: 'Logs', value: 'log' }
];

const filteredLogs = computed(() => {
    if (logType.value === 'all') return logs.value;
    return logs.value.filter(log => log.type === logType.value);
});

const addLog = (type: LogEntry['type'], message: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = typeof message === 'object' ?
        JSON.stringify(message, null, 2) :
        String(message);

    const key = `${type}-${formattedMessage}-${timestamp}`;

    if (logCache.has(key)) return;

    // Сохраняем ключ в кэше на 2 секунды
    logCache.add(key);
    setTimeout(() => logCache.delete(key), 2000);

    const newLog: LogEntry = {
        type,
        message: formattedMessage,
        timestamp,
        key
    };

    logs.value.push(newLog);

    if (logs.value.length > 100) {
        logs.value = logs.value.slice(-100);
    }
};

const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
};

console.log = (...args) => {
    originalConsole.log(...args);
    addLog('log', args[0]);
};

console.error = (...args) => {
    originalConsole.error(...args);
    addLog('error', args[0]);
};

console.warn = (...args) => {
    originalConsole.warn(...args);
    addLog('warn', args[0]);
};

console.info = (...args) => {
    originalConsole.info(...args);
    addLog('info', args[0]);
};

onMounted(() => {
    window.onerror = (message, source, lineno, colno, error) => {
        addLog('error', `${message} (${source}:${lineno}:${colno})`);
        return false;
    };

    window.addEventListener('unhandledrejection', (event) => {
        addLog('error', `Unhandled Promise Rejection: ${event.reason}`);
    });
});

const clearLogs = () => {
    logs.value = [];
    logCache.clear();
};

defineExpose({ addLog, clearLogs });
</script>