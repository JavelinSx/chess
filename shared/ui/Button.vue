<!-- components/BaseButton.vue -->
<template>
    <button :class="[
        'base-button',
        `base-button--${variant}`,
        { 'base-button--loading': loading }
    ]" :disabled="disabled || loading" @click="handleClick">
        <span v-if="loading" class="base-button__loader"></span>
        <span v-else class="base-button__content">
            <slot></slot>
        </span>
    </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
    variant: {
        type: String,
        default: 'primary',
        validator: (value: string) => ['primary', 'secondary', 'danger'].includes(value)
    },
    disabled: {
        type: Boolean,
        default: false
    },
    serverAction: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['click']);

const loading = ref(false);

const handleClick = async (event: MouseEvent) => {
    if (props.serverAction) {
        loading.value = true;
        try {
            await emit('click', event);
        } finally {
            loading.value = false;
        }
    } else {
        emit('click', event);
    }
};
</script>

<style lang="scss" scoped>
.base-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    font-weight: 500;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;
    outline: none;

    &:focus {
        box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    &--primary {
        background-color: #3498db;
        color: #ffffff;

        &:hover:not(:disabled) {
            background-color: #2980b9;
        }
    }

    &--secondary {
        background-color: #ecf0f1;
        color: #2c3e50;

        &:hover:not(:disabled) {
            background-color: #bdc3c7;
        }
    }

    &--danger {
        background-color: #e74c3c;
        color: #ffffff;

        &:hover:not(:disabled) {
            background-color: #c0392b;
        }
    }

    &--loading {
        .base-button__loader {
            display: inline-block;
            width: 1rem;
            height: 1rem;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
        }

        .base-button__content {
            display: none;
        }
    }

    @media (max-width: 768px) {
        font-size: 0.875rem;
        padding: 0.4rem 0.8rem;
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>