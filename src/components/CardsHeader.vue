<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDarkMode } from '@/composables/useDarkMode'
const { t } = useI18n()
const { isDarkMode } = useDarkMode()
</script>

<template>
    <header class="header">
        <h1 class="title">{{ t('home.title') }}</h1>
        <button :class="['add-button', { 'add-button-dark': isDarkMode }]"
            @click="$router.push('/create-card')">+</button>
    </header>
</template>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    background-color: var(--bg-secondary);
    padding-top: calc(14px + max(0px, env(safe-area-inset-top)));
    background-color: var(--bg-primary);
}

.title {
    font-size: 36px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.5px;
}

.add-button {
    width: 42px;
    height: 42px;
    border: none;
    color: var(--text-muted);
    font-size: 28px;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
    text-align: center;
}

.add-button-dark {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
}
</style>