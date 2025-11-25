<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Preferences } from '@capacitor/preferences'
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'
import VueBarcode from '@chenfengyuan/vue-barcode'
import { detectBarcodeFormat, getVueBarcodeFormat, type BarcodeFormatType } from '@/utils/barcodeUtils'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

interface CardData {
    name: string
    logo: string
    bgColor: string
    textColor: string
    barcode: string
    barcodeFormat?: BarcodeFormatType
    cardNumber: string
    isCustomCard?: boolean
}

const cardData = ref<CardData | null>(null)
const error = ref('')
const loading = ref(true)

const barcodeFormatToUse = computed(() => {
    if (cardData.value?.barcodeFormat) {
        return getVueBarcodeFormat(cardData.value.barcodeFormat)
    }

    if (cardData.value?.barcode) {
        const detected = detectBarcodeFormat(cardData.value.barcode)
        return getVueBarcodeFormat(detected)
    }
    return 'CODE128'
})

onMounted(async () => {
    try {
        await decryptCard()
    } catch (err) {
        console.error('Error decrypting card:', err)
        error.value = t('shareReceive.decryptionError')
    } finally {
        loading.value = false
    }
})

async function decryptCard() {
    const encryptedData = route.query.d as string
    if (!encryptedData) {
        error.value = t('shareReceive.invalidLink')
        return
    }

    const keyBase64 = window.location.hash.slice(1)
    if (!keyBase64) {
        error.value = t('shareReceive.missingKey')
        return
    }

    const base64ToBytes = (str: string) => {
        const padded = str + '='.repeat((4 - str.length % 4) % 4)
        const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')
        return naclUtil.decodeBase64(base64)
    }

    const fullMessage = base64ToBytes(encryptedData)
    const key = base64ToBytes(keyBase64)

    const nonce = fullMessage.slice(0, nacl.secretbox.nonceLength)
    const encrypted = fullMessage.slice(nacl.secretbox.nonceLength)

    const decrypted = nacl.secretbox.open(encrypted, nonce, key)
    if (!decrypted) {
        error.value = t('shareReceive.decryptionFailed')
        return
    }

    const jsonString = naclUtil.encodeUTF8(decrypted)
    cardData.value = JSON.parse(jsonString)
}

function saveCard() {
    if (!cardData.value) return

    saveCardToPreferences()
}

async function saveCardToPreferences() {
    if (!cardData.value) return

    try {
        const existingCardsJson = await Preferences.get({ key: 'cards' })
        const existingCards = existingCardsJson.value ? JSON.parse(existingCardsJson.value) : []

        const newId = existingCards.length > 0
            ? Math.max(...existingCards.map((c: any) => c.id)) + 1
            : 1

        const barcodeFormat = cardData.value.barcodeFormat || detectBarcodeFormat(cardData.value.barcode)

        const newCard = {
            id: newId,
            name: cardData.value.name,
            logo: cardData.value.logo,
            bgColor: cardData.value.bgColor,
            textColor: cardData.value.textColor,
            barcode: cardData.value.barcode,
            barcodeFormat: barcodeFormat,
            cardNumber: cardData.value.cardNumber,
            isCustomCard: cardData.value.isCustomCard || false
        }

        existingCards.push(newCard)
        await Preferences.set({
            key: 'cards',
            value: JSON.stringify(existingCards),
        })

        router.push('/')
    } catch (err) {
        console.error('Error saving card:', err)
    }
}

function getInitials(name: string): string {
    const trimmed = name.trim()

    if (trimmed.length <= 5) {
        return trimmed.toUpperCase()
    }

    const words = trimmed.split(/\s+/)

    if (words.length === 1) {
        return trimmed.substring(0, 2).toUpperCase()
    }

    return words.map(w => w.charAt(0)).join('').toUpperCase().substring(0, 2)
}
</script>

<template>
    <div class="share-receive-container">
        <!-- Header -->
        <header class="header">
            <div class="logo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="6" fill="#0066FF" />
                    <rect x="6" y="8" width="12" height="2" rx="1" fill="white" />
                    <rect x="6" y="11" width="8" height="2" rx="1" fill="white" />
                    <rect x="6" y="14" width="10" height="2" rx="1" fill="white" />
                </svg>
                <span class="logo-text">Pocketz</span>
            </div>
        </header>

        <div class="content">
            <!-- Loading State -->
            <div v-if="loading" class="state-container">
                <div class="spinner"></div>
                <p class="state-text">{{ t('shareReceive.decrypting') }}</p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="state-container">
                <div class="error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#FF3B30" stroke-width="2" />
                        <path d="M12 8v4M12 16h.01" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </div>
                <h2 class="state-title">{{ t('shareReceive.errorTitle') }}</h2>
                <p class="state-description">{{ error }}</p>
                <button class="btn btn-secondary" @click="router.push('/')">
                    {{ t('shareReceive.backToHome') }}
                </button>
            </div>

            <!-- Success State -->
            <div v-else-if="cardData" class="state-container">
                <h1 class="page-title">{{ t('shareReceive.cardReceived') }}</h1>
                <p class="page-subtitle">{{ t('shareReceive.cardReceivedDescription') }}</p>

                <!-- Card Preview -->
                <div class="card-wrapper">
                    <div class="card-preview" :style="{ backgroundColor: cardData.bgColor, color: cardData.textColor }">
                        <div class="card-content">
                            <div v-if="cardData.isCustomCard" class="card-initials">
                                {{ getInitials(cardData.name) }}
                            </div>
                            <img v-else :src="'https://api.pocketz.app/logo/' + cardData.logo" :alt="cardData.name"
                                class="card-logo" />
                            <span class="card-name">{{ cardData.name }}</span>
                        </div>
                    </div>
                </div>

                <!-- Barcode Section -->
                <div class="barcode-section">
                    <vue-barcode :value="cardData.barcode"
                        :options="{ format: barcodeFormatToUse, lineColor: '#000', width: 2, height: 60, displayValue: false }"
                        class="barcode" />
                    <span class="barcode-number">{{ cardData.cardNumber }}</span>
                </div>

                <!-- Actions -->
                <div class="actions">
                    <button class="btn btn-primary" @click="saveCard">
                        {{ t('shareReceive.saveCard') }}
                    </button>
                    <button class="btn btn-ghost" @click="router.push('/')">
                        {{ t('shareReceive.cancel') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.share-receive-container {
    min-height: 100vh;
    background-color: #FAFAFA;
    display: flex;
    flex-direction: column;
}

/* Header */
.header {
    padding: 16px 24px;
    padding-top: calc(16px + max(0px, env(safe-area-inset-top)));
    background: white;
    border-bottom: 1px solid #F0F0F0;
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo-text {
    font-size: 20px;
    font-weight: 700;
    color: #1A1A1A;
    letter-spacing: -0.5px;
}

/* Content */
.content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 40px 24px;
}

.state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    max-width: 400px;
    width: 100%;
}

/* Typography */
.page-title {
    font-size: 32px;
    font-weight: 700;
    color: #1A1A1A;
    margin: 0;
    letter-spacing: -0.5px;
    text-align: center;
}

.page-subtitle {
    font-size: 16px;
    color: #6B6B6B;
    margin: 0 0 8px 0;
    text-align: center;
    line-height: 1.5;
}

.state-title {
    font-size: 24px;
    font-weight: 600;
    color: #1A1A1A;
    margin: 8px 0 0 0;
}

.state-description {
    font-size: 15px;
    color: #6B6B6B;
    margin: 0;
    text-align: center;
}

.state-text {
    font-size: 15px;
    color: #6B6B6B;
    margin: 0;
}

/* Spinner */
.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #F0F0F0;
    border-top-color: #0066FF;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Error Icon */
.error-icon {
    padding: 16px;
    background: #FFF5F5;
    border-radius: 50%;
}

/* Card Preview */
.card-wrapper {
    width: 100%;
    margin: 16px 0;
}

.card-preview {
    border-radius: 16px;
    padding: 48px 24px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: center;
    align-items: center;
}

.card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.card-logo {
    max-width: 100px;
    max-height: 80px;
    object-fit: contain;
}

.card-initials {
    font-size: 40px;
    font-weight: 700;
    opacity: 0.9;
}

.card-name {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.5px;
}

/* Barcode Section */
.barcode-section {
    width: 100%;
    background: white;
    border-radius: 12px;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #F0F0F0;
}

.barcode {
    width: 100%;
    max-width: 280px;
}

.barcode-number {
    font-size: 18px;
    font-weight: 600;
    color: #1A1A1A;
    letter-spacing: 2px;
}

/* Actions */
.actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    margin-top: 8px;
}

/* Buttons */
.btn {
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    width: 100%;
}

.btn-primary {
    background: #0066FF;
    color: white;
}

.btn-primary:hover {
    background: #0052CC;
}

.btn-primary:active {
    transform: scale(0.98);
}

.btn-secondary {
    background: #1A1A1A;
    color: white;
}

.btn-secondary:hover {
    background: #333;
}

.btn-ghost {
    background: transparent;
    color: #6B6B6B;
}

.btn-ghost:hover {
    background: #F0F0F0;
    color: #1A1A1A;
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
    .share-receive-container {
        background-color: #0A0A0A;
    }

    .header {
        background: #1A1A1A;
        border-bottom-color: #2A2A2A;
    }

    .logo-text {
        color: #FFFFFF;
    }

    .page-title,
    .state-title {
        color: #FFFFFF;
    }

    .page-subtitle,
    .state-description,
    .state-text {
        color: #8B8B8B;
    }

    .spinner {
        border-color: #2A2A2A;
        border-top-color: #0066FF;
    }

    .error-icon {
        background: rgba(255, 59, 48, 0.1);
    }

    .card-preview {
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    }

    .barcode-section {
        background: #1A1A1A;
        border-color: #2A2A2A;
    }

    .barcode-number {
        color: #FFFFFF;
    }

    .btn-ghost {
        color: #8B8B8B;
    }

    .btn-ghost:hover {
        background: #2A2A2A;
        color: #FFFFFF;
    }
}

/* Responsive */
@media (min-width: 640px) {
    .content {
        align-items: center;
        padding: 60px 24px;
    }

    .actions {
        flex-direction: row;
    }

    .btn {
        width: auto;
        flex: 1;
    }
}
</style>
