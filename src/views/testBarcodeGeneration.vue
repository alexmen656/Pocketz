<template>
    <div class="barcode-generator">
        <h2>Code128 Barcode Generator</h2>

        <!-- test code -->
        <div v-for="page in pages" :key="page.id" class="barcode-item">
            -
            <vue-js-barcode :value="page.id" format="CODE128" :height="80" :width="2"
                display-value="true"></vue-js-barcode>

            a
            <vue-js-barcode :value="page.id" format="CODE128A" :height="80" :width="2"
                display-value="true"></vue-js-barcode>

            <!--
                Explanation from perplexity:
                CODE128A = Großbuchstaben, Zahlen, Steuerzeichen (ASCII 0-95)
                CODE128B = Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen (ASCII 32-127)
            -->

            <!--Code 39 (3 of 9)

            Am häufigsten bei einfachen Loyalty Cards, Key Tags und Gift Cards

            Standard in Einzelhandel und Fitnessstudios

            Typisch: 8-10 stellige Nummern (z.B. "12345678")

            Einfacher, benötigt keinen Check-Digit​

            Code 128

            Häufig bei moderneren Membership Cards

            Wenn alphanumerische IDs genutzt werden (wie dein "05wuj2")

            Kompakter als Code 39, mehr Zeichen möglich

            Standard bei Logistik und komplexeren Systemen​

            EAN-13/UPC

            Retail Gift Cards und Store Cards

            Nur Zahlen, 13 Stellen
            Gleicher Standard wie Produkt-Barcodes
            -->

            b <!-- Problem solved, my card was type B -->
            <vue-js-barcode :value="page.id" format="CODE128B" :height="80" :width="2"
                display-value="true"></vue-js-barcode>

            c
            <vue-js-barcode :value="page.id" format="CODE128C" :height="80" :width="2"
                display-value="true"></vue-js-barcode>
        </div>

        <div class="barcode-container">
            <vue-js-barcode value="05wuj2" format="CODE128" :height="50" :width="1.5" :margin="0" :font-size="14"
                font="monospace" text-align="center" display-value="true" background="#ffffff"
                line-color="#000000"></vue-js-barcode>
        </div>

        <div class="barcode-container">
            <vue-js-barcode value="05wuj2" format="CODE128" :height="50" :width="1.5" :margin="0" :font-size="14"
                font="monospace" text-align="center" display-value="true" background="#ffffff"
                line-color="#000000"></vue-js-barcode>
        </div>

        <vue-js-barcode :value="'05wuj2'" format="CODE128" :height="38" :width="1.3" :margin="7" display-value="false"
            background="#fff" line-color="#000"></vue-js-barcode>



        <!-- how it should look-->
        <img src="https://barcode.tec-it.com/barcode.ashx?data=05wuj2%0A&code=Code128&translate-esc=on" alt=""></img>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import VueJsBarcode from 'vue-jsbarcode';

const pages = ref([
    { id: '05wuj2' },
]);
</script>

<style scoped>
.barcode-item {
    margin: 20px 0;
    padding: 10px;
    border: 1px solid #ddd;
}

.barcode-container {
    padding: 10px;
    background: white;
}

.barcode-container svg {
    display: block;
    margin: 0 auto;
}
</style>
