<script setup lang="ts">
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Preferences } from '@capacitor/preferences'
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'
import VueJsBarcode from 'vue-jsbarcode'
import QrcodeVue from 'qrcode.vue'
import bwipjs from 'bwip-js'
import { detectBarcodeFormat, type BarcodeFormatType } from '@/utils/barcodeUtils' //getVueBarcodeFormat

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
const gs1Canvas = ref<HTMLCanvasElement | null>(null)
const error = ref('')
const loading = ref(true)
const showBarcode = ref(false)

const barcodeFormat = computed(() => {
    return cardData.value?.barcodeFormat || 'CODE128B'
})

const isQRCode = computed(() => barcodeFormat.value === 'QR_CODE')
const isGS1DataBar = computed(() => barcodeFormat.value === 'GS1_DATABAR')
const isStandardBarcode = computed(() =>
    ['CODE128', 'CODE128A', 'CODE128B', 'CODE128C', 'EAN13'].includes(barcodeFormat.value)
)

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

        const barcodeFormatValue = cardData.value.barcodeFormat || detectBarcodeFormat(cardData.value.barcode)

        const newCard = {
            id: newId,
            name: cardData.value.name,
            logo: cardData.value.logo,
            bgColor: cardData.value.bgColor,
            textColor: cardData.value.textColor,
            barcode: cardData.value.barcode,
            barcodeFormat: barcodeFormatValue,
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

async function renderBarcode() {
    await nextTick()
    if (!cardData.value?.barcode) return

    const format = cardData.value.barcodeFormat || 'CODE128B'

    try {
        if (format === 'GS1_DATABAR') {
            if (gs1Canvas.value) {
                await bwipjs.toCanvas(gs1Canvas.value, {
                    bcid: 'databarexpandedstacked',
                    text: cardData.value.barcode,
                    scale: 1.5,
                    height: 40,
                    segments: 8
                })
            }
            return
        }

        if (format === 'QR_CODE') {
            showBarcode.value = true
            return
        }

        showBarcode.value = true
    } catch (error) {
        console.error('Error rendering barcode:', error)
        showBarcode.value = false
    }
}

watch(cardData, async () => {
    if (cardData.value) {
        await renderBarcode()
    }
})
</script>

<template>
    <div class="share-receive-container">
        <header class="detail-header">
            <button class="back-button" @click="router.push('/')">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </button>
            <h1 class="detail-title">{{ t('shareReceive.cardReceived') }}</h1>
            <div style="width: 40px;"></div>
        </header>
        <div class="card-content">
            <div v-if="loading" class="state-container">
                <div class="spinner"></div>
                <p class="state-text">{{ t('shareReceive.decrypting') }}</p>
            </div>
            <div v-else-if="error" class="state-container error-state">
                <div class="error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#FF4444" stroke-width="2" />
                        <path d="M12 8v4M12 16h.01" stroke="#FF4444" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </div>
                <h2 class="state-title">{{ t('shareReceive.errorTitle') }}</h2>
                <p class="state-description">{{ error }}</p>
                <button class="btn-save" @click="router.push('/')">
                    {{ t('shareReceive.backToHome') }}
                </button>
            </div>
            <div v-else-if="cardData" class="success-content">
                <p class="page-subtitle">{{ t('shareReceive.cardReceivedDescription') }}</p>
                <div class="card-display" :style="{ backgroundColor: cardData.bgColor, color: cardData.textColor }">
                    <div class="card-logo">
                        <div v-if="cardData.isCustomCard" class="logo-initials">
                            {{ getInitials(cardData.name) }}
                        </div>
                        <img v-else :src="'https://api.pocketz.app/logo/' + cardData.logo" :alt="cardData.name"
                            style="max-width: 120px; max-height: 80px; object-fit: contain;" />
                        <span class="card-brand-name">{{ cardData.name }}</span>
                    </div>
                </div>
                <div class="barcode-section">
                    <div class="barcode">
                        <vue-js-barcode v-if="isStandardBarcode" :value="cardData.barcode" :format="barcodeFormat"
                            :width="2" :height="100" :display-value="false" :margin="0" />
                        <div v-else-if="isQRCode" class="qr-code-display">
                            <qrcode-vue :value="cardData.barcode" :size="200" level="H"></qrcode-vue>
                        </div>
                        <canvas v-else-if="isGS1DataBar" ref="gs1Canvas" class="gs1-canvas"></canvas>
                    </div>
                    <div class="card-number">{{ cardData.cardNumber }}</div>
                </div>
                <div class="actions">
                    <button class="btn-save" @click="saveCard">
                        {{ t('shareReceive.saveCard') }}
                    </button>
                    <button class="btn-cancel" @click="router.push('/')">
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
    background-color: var(--bg-primary);
    display: flex;
    flex-direction: column;
}

.detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    padding-top: calc(15px + max(0px, env(safe-area-inset-top)));
}

.back-button {
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: var(--text-primary);
}

.back-button svg {
    stroke: var(--text-primary);
}

.detail-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
}

.card-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    flex: 1;
}

.state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 60px 20px;
    flex: 1;
}

.error-state {
    text-align: center;
}

.success-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.page-subtitle {
    font-size: 15px;
    color: var(--text-tertiary);
    text-align: center;
    line-height: 1.5;
    margin: 0;
}

.state-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 8px 0 0 0;
}

.state-description {
    font-size: 15px;
    color: var(--text-tertiary);
    margin: 0;
    text-align: center;
}

.state-text {
    font-size: 15px;
    color: var(--text-tertiary);
    margin: 0;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.error-icon {
    padding: 16px;
    background: rgba(255, 68, 68, 0.1);
    border-radius: 50%;
}

.card-display {
    border-radius: 16px;
    padding: 40px 30px;
    box-shadow: 0 4px 12px var(--shadow-medium);
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.card-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.logo-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 700;
    width: 120px;
    height: 120px;
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.2);
    text-align: center;
}

.card-brand-name {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 1px;
    text-align: center;
}

.barcode-section {
    background-color: var(--bg-secondary);
    border-radius: 16px;
    padding: 15px 15px 30px 15px;
    box-shadow: 0 2px 8px var(--shadow-light);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.barcode {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    padding: 1rem;
    border-radius: 18px;
}

.qr-code-display {
    display: flex;
    align-items: center;
    justify-content: center;
}

.gs1-canvas {
    max-width: 100%;
    height: auto;
}

.card-number {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: 1px;
    text-align: center;
    word-break: break-all;
    overflow-wrap: break-word;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 10px;
}

.btn-save {
    width: 100%;
    padding: 14px 20px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: #667eea;
    color: white;
}

.btn-save:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-save:active {
    transform: scale(0.98);
}

.btn-cancel {
    width: 100%;
    padding: 14px 20px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--bg-secondary);
    color: var(--text-secondary);
}

.btn-cancel:hover {
    background: var(--border-subtle);
}

@media (min-width: 640px) {
    .card-content {
        max-width: 500px;
        margin: 0 auto;
        width: 100%;
    }

    .actions {
        flex-direction: row;
    }

    .btn-save,
    .btn-cancel {
        flex: 1;
    }
}

@media (min-width: 768px) {
    .share-receive-container {
        background-color: rgba(0, 0, 0, 0.5);
    }

    .detail-header,
    .card-content {
        max-width: 500px;
        margin: 0 auto;
        width: 100%;
    }

    .detail-header {
        border-radius: 0;
        margin-top: 40px;
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
    }

    .card-content {
        background-color: var(--bg-primary);
        border-bottom-left-radius: 16px;
        border-bottom-right-radius: 16px;
        padding-bottom: 40px;
    }
}
</style>
