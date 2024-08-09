<!-- components/BaseInput.vue -->
<template>
  <div class="input-wrapper">
    <label :for="id" class="input-label">{{ label }}</label>
    <input :id="id" :type="type" :value="modelValue" @input="handleInput"
      :class="['input-field', { 'input-error': error }]" :placeholder="placeholder" :required="required"
      :disabled="disabled" :minlength="minLength" :maxlength="maxLength" :pattern="pattern" novalidate />
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'text',
    validator: (value: string) => ['text', 'email', 'password', 'number'].includes(value),
  },
  placeholder: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  minLength: {
    type: Number,
    default: 0,
  },
  maxLength: {
    type: Number,
    default: 60, // HTML input max length
  },
  pattern: {
    type: String,
    default: '',
  },
});

const validateEmail = (email: string): boolean => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const emit = defineEmits(['update:modelValue', 'error']);

const error = ref('');

const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

const validateInput = (value: string): string => {
  if (props.required && !value) {
    return 'This field is required';
  }

  if (props.type === 'email' && !validateEmail(value)) {
    return 'Invalid email format';
  }

  if (value.length < props.minLength) {
    return `Minimum length is ${props.minLength} characters`;
  }

  if (value.length > props.maxLength) {
    return `Maximum length is ${props.maxLength} characters`;
  }

  if (props.pattern && !new RegExp(props.pattern).test(value)) {
    return 'Invalid input format';
  }

  return '';
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const sanitizedValue = sanitizeInput(target.value);
  const newError = validateInput(sanitizedValue);

  error.value = newError;
  emit('error', newError);
  emit('update:modelValue', sanitizedValue);
};
</script>

<style lang="scss" scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  width: 100%;

  .input-label {
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    color: #4a5568;
  }

  .input-field {
    padding: 0.5rem 0.75rem;
    border: 1px solid #cbd5e0;
    border-radius: 0.25rem;
    font-size: 1rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      outline: none;
      border-color: #4299e1;
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
    }

    &.input-error {
      border-color: #f56565;
    }
  }

  .error-message {
    font-size: 0.75rem;
    color: #f56565;
    margin-top: 0.25rem;
  }
}

@media (max-width: 640px) {
  .input-wrapper {
    .input-field {
      font-size: 0.875rem;
    }
  }
}
</style>