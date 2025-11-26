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



        Card 2 (02111568344951)
        A:
        <vue-js-barcode value="02111568344951" format="CODE128A" :height="80" :width="2"
            display-value="true"></vue-js-barcode><!-- doesnt look like original-->

        B:
        <vue-js-barcode value="02111568344951" format="CODE128B" :height="80" :width="2"
            display-value="true"></vue-js-barcode><!-- doesnt look like original-->

        C:
        <vue-js-barcode value="02111568344951" format="CODE128C" :height="80" :width="2"
            display-value="true"></vue-js-barcode><!-- does actually look like original-->


        Card 3 (2411956886828), apparantly it should be EAN13 instead of code128
        A:
        <vue-js-barcode value="2411956886828" format="CODE128A" :height="80" :width="2"
            display-value="true"></vue-js-barcode><!-- doesnt look like original-->

        B:
        <vue-js-barcode value="2411956886828" format="CODE128B" :height="80" :width="2"
            display-value="true"></vue-js-barcode><!-- doesnt look like original-->

        C:
        <vue-js-barcode value="2411956886828" format="CODE128C" :height="80" :width="2"
            display-value="true"></vue-js-barcode><!-- doesnt look like original-->

        <vue-js-barcode value="2411956886828" format="EAN13" :height="80" :width="2"
            display-value="true"></vue-js-barcode><!-- does actually look like original-->


        Card 4 (not barcode lol). ggs GS1 DataBar Expanded Stacked
        ((01) 09010374 00001 9 (21) 08130755701138663732 (10) 01105944150)
        <div style="background-color: #fff;">
            <canvas ref="canvas"></canvas><!-- wtf this shit works??????-->
        </div>


        <h2>Qr code cards</h2>

        1. card (4102522044):
        <qrcode-vue value="4102522044" :size="200" level="H"></qrcode-vue><!--doesnt look right-->
        <qrcode-vue value="4102522044" :size="200" level="L"></qrcode-vue><!--doesnt look right-->
        <qrcode-vue value="4102522044" :size="200" level="M"></qrcode-vue><!--doesnt look right-->

        <qrcode-vue value="4102 522044" :size="200" level="H"></qrcode-vue><!--doesnt look right-->
        <qrcode-vue value="4102 522044" :size="200" level="M"></qrcode-vue><!--doesnt look right-->
        <qrcode-vue value="4102 522044" :size="200" level="L"></qrcode-vue><!--doesnt look right-->

        <!-- Apparantly it doesn't make a difference how it looks if the value is the same lol-->
    </div>
</template>

<script setup>
import bwipjs from 'bwip-js';
import { onMounted, ref } from 'vue';
import VueJsBarcode from 'vue-jsbarcode';
import QrcodeVue from 'qrcode.vue';

const pages = ref([
    { id: '05wuj2' },
]);


const canvas = ref(null);

onMounted(() => {
    bwipjs.toCanvas(canvas.value, {
        bcid: 'databarexpandedstacked',
        //text: '(01) 09010374 00001 9 (21) 08130755701138663732 (10) 01105944150',
        text: '(01)09010374000019(21)08130755701138663732(10)01105944150',
        scale: 2,
        height: 10,
        segments: 8
    });
});
/*
bwip-js.js?v=ab36b76f:264 Uncaught (in promise) Error: bwipp.GS1valueTooLong#3540: AI 01: Too long
    at testBarcodeGeneration.vue:131:12

    */
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
