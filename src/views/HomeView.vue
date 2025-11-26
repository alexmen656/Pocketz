<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CardDetail from '@/components/CardDetail.vue'
import { Preferences } from '@capacitor/preferences';
import TouchBar from '@/components/TouchBar.vue'
import CardsHeader from '@/components/CardsHeader.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const API_BASE_URL = 'https://api.pocketz.app'

interface Card {
  id: number
  name: string
  logo: string
  bgColor: string
  textColor: string
  isCustomCard?: boolean
  deleted?: boolean
  isPinned?: boolean
}

const getLogoUrl = (domain: string) => `${API_BASE_URL}/logo/${domain}`

const getInitials = (name: string): string => {
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

const cards = ref<Card[]>([]);
const selectedCard = ref<Card | null>(null)

function openCard(card: Card) {
  selectedCard.value = card
}

function closeCard() {
  selectedCard.value = null
}

function updateCard(updatedCard: Card) {
  if (updatedCard.deleted) {
    const cardIndex = cards.value.findIndex(c => c.id === updatedCard.id)
    if (cardIndex !== -1) {
      cards.value.splice(cardIndex, 1)
      saveCards()
    }
  } else {
    const cardIndex = cards.value.findIndex(c => c.id === updatedCard.id)
    if (cardIndex !== -1) {
      cards.value[cardIndex] = updatedCard
      saveCards()
    }
  }
}

function togglePinCard(card: Card) {
  const cardIndex = cards.value.findIndex(c => c.id === card.id)
  if (cardIndex !== -1) {
    const pinCard = cards.value[cardIndex]
    if (pinCard) {
      pinCard.isPinned = !pinCard.isPinned
      saveCards()
    }
  }
}

const pinnedCards = () => cards.value.filter(c => c.isPinned)

async function saveCards() {
  await Preferences.set({
    key: 'cards',
    value: JSON.stringify(cards.value),
  });
}

const getCards = async (): Promise<Card[]> => {
  const { value } = await Preferences.get({ key: 'cards' });
  if (!value) return []
  return JSON.parse(value)
};

onMounted(async () => {
  cards.value = await getCards();
});
</script>

<template>
  <div class="app-container">
    <div class="spacer"></div>
    <CardsHeader />
    <div v-if="pinnedCards().length === 0" class="new-section-title"></div>
    <div v-if="pinnedCards().length > 0" class="section-title">PINNED CARDS</div>
    <div v-if="pinnedCards().length > 0" class="cards-grid">
      <div v-for="card in pinnedCards()" :key="card.id" class="card"
        :style="{ backgroundColor: card.bgColor, color: card.textColor }" @click="openCard(card)">
        <div class="card-name">
          <div v-if="card.isCustomCard" class="card-initials">
            {{ getInitials(card.name) }}
          </div>
          <img v-else :src="getLogoUrl(card.logo)" alt=""
            style="max-width: 200px; max-height: 100px; object-fit: contain;">
        </div>
      </div>
    </div>
    <div v-if="pinnedCards().length > 0" class="section-title">{{ t('home.allCards') }}</div>
    <div class="cards-grid">
      <div v-for="card in cards" :key="card.id" class="card"
        :style="{ backgroundColor: card.bgColor, color: card.textColor }" @click="openCard(card)">
        <div class="card-name">
          <div v-if="card.isCustomCard" class="card-initials">
            {{ getInitials(card.name) }}
          </div>
          <img v-else :src="getLogoUrl(card.logo)" alt=""
            style="max-width: 200px; max-height: 100px; object-fit: contain;">
        </div>
      </div>
    </div>
    <CardDetail v-if="selectedCard" :card="selectedCard" @close="closeCard" @updateCard="updateCard"
      @togglePin="togglePinCard(selectedCard)" />
    <TouchBar />
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.spacer {
  height: calc(4px + max(0px, env(safe-area-inset-top)));
  background-color: var(--bg-primary);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.app-container {
  min-height: 100vh;
  background-color: var(--bg-primary);
  padding-bottom: 120px;
  /*padding-top: 120px;*/
  padding-top: calc(4px + max(0px, env(safe-area-inset-top)));
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-user-select: none;
  user-select: none;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.new-section-title {
  height: 16px;
  width: 100%;
}

.section-title {
  padding: 15px 20px 10px 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  background-color: var(--bg-primary);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 16px;
  width: 100%;
  box-sizing: border-box;
  /*scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;*/
}

/*.cards-grid::-webkit-scrollbar,
.cards-grid::-webkit-scrollbar-button {
  display: none;
}*/

.card {
  aspect-ratio: 1.4;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 8px var(--shadow-medium);
  width: 100%;
  min-width: 0;
}

.card:active {
  transform: scale(0.98);
}

.card-name {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  padding: 16px;
  letter-spacing: 1px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-initials {
  font-size: 32px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
    max-width: 800px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .cards-grid {
    grid-template-columns: repeat(4, 1fr);
    max-width: 1200px;
  }
}
</style>