export const STANDAARD_SJABLOON_HTML = `<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 7pt; line-height: 1.4; color: #1a1a1a; }
  .naam { font-size: 10pt; font-weight: bold; margin-bottom: 2mm; }
  .blok { margin-top: 1.5mm; }
  .label-titel { font-size: 5.5pt; font-weight: bold; text-transform: uppercase; color: #555; letter-spacing: 0.5pt; margin-bottom: 0.5mm; }
  table.voedingswaarden { width: 100%; border-collapse: collapse; font-size: 6pt; margin-top: 0.5mm; }
  table.voedingswaarden th { text-align: left; border-bottom: 0.5pt solid #999; padding: 0.5mm 0; }
  table.voedingswaarden td { border-bottom: 0.3pt solid #ddd; padding: 0.3mm 0; }
  table.voedingswaarden td:last-child { text-align: right; }
</style>

<div class="naam">{{productnaam}}</div>

<div class="blok">
  <div class="label-titel">Ingrediënten</div>
  <div>{{ingredienten}}</div>
</div>

<div class="blok">
  <div class="label-titel">Allergenen</div>
  <div><strong>Bevat:</strong> {{allergenen_bevat}}</div>
  <div>Kan bevatten: {{allergenen_kan_bevatten}}</div>
</div>

<div class="blok">
  <div class="label-titel">Houdbaar tot</div>
  <div>{{houdbaarheid}}</div>
</div>

<div class="blok">
  <div class="label-titel">Producent</div>
  <div>{{producent}}</div>
</div>

<div class="blok">{{voedingswaarden}}</div>`

export const BESCHIKBARE_TOKENS = [
  { token: '{{productnaam}}',           label: 'Productnaam' },
  { token: '{{ingredienten}}',          label: 'Ingrediëntenlijst (EU)' },
  { token: '{{allergenen_bevat}}',      label: 'Allergenen: bevat' },
  { token: '{{allergenen_kan_bevatten}}', label: 'Allergenen: kan bevatten' },
  { token: '{{voedingswaarden}}',       label: 'Voedingswaardetabel' },
  { token: '{{houdbaarheid}}',          label: 'Houdbaarheidsdatum' },
  { token: '{{producent}}',             label: 'Producent' },
]
