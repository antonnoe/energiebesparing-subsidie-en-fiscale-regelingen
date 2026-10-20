// Controle van de bedragen in de tool tegen peil/waarden.json, de kopie van de waarden uit Peil (het parameterregister van Communities Abroad).
// Draaien: node tests/peil.test.mjs (geen netwerk, geen afhankelijkheden).
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const lees = (...p) => fs.readFileSync(path.join(here, "..", ...p), "utf8");
const indexHtml = lees("index.html");
const script = lees("script.js");
const html = indexHtml + "\n" + script;
const WAARDEN = JSON.parse(lees("peil", "waarden.json"));
const UITLEG_URL = "https://infofrankrijk.com/ons-manifest-hoe-wij-werken/";
const perId = new Map(WAARDEN.parameters.map((p) => [p.id, p]));

// ---- Peil-blok uit de pagina laden
const blok = /\/\/ PEIL-BEGIN([\s\S]*?)\/\/ PEIL-EINDE/.exec(script);
const fouten = [];
const fout = (m) => fouten.push(m);
if (!blok) { console.log("FOUT Peil-blok (PEIL-BEGIN tot PEIL-EINDE) niet gevonden in script.js."); process.exit(1); }
function laad(code) {
  const ctx = { document: { getElementById: () => null }, console };
  vm.createContext(ctx);
  vm.runInContext(code + "\n;globalThis.__p={PEIL_STAND,PEIL_LABEL_AAN,PEIL_UITLEG_URL,peilStandNl,peilStandKort,peilRegelHtml,peilRegelMd,peilVoetHtml};", ctx);
  return ctx.__p;
}
const P = laad(blok[1]);

// ---- Vaste onderdelen
const nl = P.peilStandNl(), kort = P.peilStandKort();
if (P.PEIL_LABEL_AAN !== true) fout("PEIL_LABEL_AAN moet true zijn.");
if (P.PEIL_UITLEG_URL !== UITLEG_URL) fout("De link gaat niet naar het manifest.");
if (!/^\d{4}-\d{2}-\d{2}$/.test(P.PEIL_STAND)) fout("PEIL_STAND is geen datum als JJJJ-MM-DD.");
if (WAARDEN.stand !== P.PEIL_STAND) fout(`stand in peil/waarden.json is ${WAARDEN.stand}, maar PEIL_STAND is ${P.PEIL_STAND}.`);
if (P.PEIL_STAND === "2026-10-20" && (nl !== "20 oktober 2026" || kort !== "20 okt 2026")) fout(`Datumopmaak klopt niet: '${nl}' en '${kort}'.`);
const h = P.peilRegelHtml();
if (!h.includes(`href="${UITLEG_URL}"`) || !h.includes('target="_blank"') || !h.includes('rel="noopener"')) fout("Stempel linkt niet naar het manifest met target _blank en rel noopener.");
if (!h.includes(`aria-label="Bedragen gecontroleerd tegen Peil, stand ${nl}, lees hoe wij werken"`)) fout("Stempel mist de aria-label met volledige datum.");
if (!h.includes("Gecontroleerd tegen Peil</span>") || !h.includes(`stand ${kort}<span class="peil-pijl" aria-hidden="true">&#8599;</span></span>`)) fout("Stempel mist de twee korte regels met pijltje.");
if ((h.match(/<a /g) || []).length !== 1 || !h.includes("<svg") || !h.includes('stroke="#800000"')) fout("Stempel moet één link met inline svg in #800000 zijn.");
if (P.peilRegelMd() !== `[Bedragen gecontroleerd tegen Peil, stand ${nl}](${UITLEG_URL})`) fout("Markdownregel klopt niet.");
if (!/window\.peilRegelMd\(\)[\s\S]{0,120}lines\.push\(peilMd\)/.test(script)) fout("Het kopieerbare actieplan bevat de Peil-regel niet.");
const v = P.peilVoetHtml();
if (!v.startsWith('<span class="peil-merk"') || !v.includes("<strong>Over de bedragen in deze tool.</strong> Alle wettelijke tarieven, bedragen en grenzen komen uit Peil, het register waarin wij deze gegevens bijhouden. Elk daarvan is gecontroleerd bij de officiële bron, de laatste controle was op " + nl + ". Waar de tool met een aanname of schatting rekent, staat dat bij de uitkomst. <a href=\"" + UITLEG_URL + "\" target=\"_blank\" rel=\"noopener\">Lees in ons manifest hoe wij werken</a>")) fout("Voettekstalinea wijkt af van het goedgekeurde ontwerp.");
{
  const uit = laad(blok[1].replace("const PEIL_LABEL_AAN = true;", "const PEIL_LABEL_AAN = false;"));
  if (uit.peilRegelMd() !== "" || uit.peilRegelHtml() !== "" || uit.peilVoetHtml() !== "") fout("Met de schakelaar uit moet het Peil-label verdwijnen.");
}
if (!/id="peilStempel"/.test(indexHtml) || !/id="peilVoet"/.test(indexHtml)) fout("Plaatsen voor stempel (#peilStempel) en voettekst (#peilVoet) ontbreken.");
if (indexHtml.indexOf('id="peilStempel"') < indexHtml.indexOf("Bij twijfel: laat het bevestigen")) fout("De stempel moet na de regel met het voorbehoud (Bij twijfel: laat het bevestigen) staan.");
if (/antonnoe\.github\.io\/peil-nl-fr/.test(html)) fout("De pagina verwijst naar de openbare Peil-site.");
if (/(19|20) oktober 2026/.test(indexHtml)) fout("Er staat een vaste peildatum in de pagina; de datum mag alleen uit PEIL_STAND komen.");

// ---- Regels in de tool
const vereist = (id) => { const p = perId.get(id); if (!p) { fout(`${id}: staat niet in peil/waarden.json.`); return null; } return p; };
{ const p = vereist("p.fr.renov.ouderdomsgrens_woning");
  if (p) { const n = p.waarde;
    if (!script.includes(`>${n} jaar`) || !indexHtml.includes(`≥ ${n} jaar`) || !indexHtml.includes(`< ${n} jaar`) && !indexHtml.includes(`&lt; ${n} jaar`) || !indexHtml.includes(`ouder dan ${n} jaar`)) fout(`${p.id} (${p.naam}): de tool noemt niet overal een ouderdomsgrens van ${n} jaar.`); } }
{ const p = vereist("p.fr.tva.tarief_renovatie");
  if (p) { const t = String(p.waarde).replace(".", ",");
    if (!script.includes(`TVA à ${t}%`) || !indexHtml.includes(`TVA ${t}%`)) fout(`${p.id} (${p.naam}): de tool noemt niet ${t}% btw.`); } }
{ const p = vereist("p.fr.renov.maprimerenov_plafond");
  // De tool noemt geen bedragen (alleen een route). Het getal 24500 in index.html is het voorbeeld bij het postcodeveld en geen plafond.
  if (p) {
    const zonderPostcode = indexHtml.replace(/placeholder="Bijv\. 24500"/, "");
    if (/24\.?500/.test(zonderPostcode + script)) fout(`${p.id}: de tool noemt 24500 als bedrag, dat staat niet in Peil.`);
    for (const n of [p.waarde.rénovation_ampleur_gain_2_klassen_HT, p.waarde.rénovation_ampleur_gain_3_of_meer_klassen_HT]) {
      const nl = Number(n).toLocaleString("nl-NL");
      if (new RegExp(`${nl}|${n}`).test(zonderPostcode + script)) fout(`${p.id}: de tool noemt een plafondbedrag (${nl}) terwijl hij verder geen bedragen toont; controleer tegen Peil.`);
    } } }
if (!/geen bedragen/.test(indexHtml)) console.log("info de tool zegt niet meer 'geen bedragen'; controleer of er nieuwe bedragen zijn die tegen Peil moeten.");

for (const p of WAARDEN.parameters) console.log(`ok   ${p.id}`);
if (fouten.length) { console.log(`\n${fouten.length} afwijking(en):`); fouten.forEach((m) => console.log(`FOUT ${m}`)); process.exit(1); }
console.log(`\nAlle ${WAARDEN.parameters.length} parameters komen overeen met peil/waarden.json (stand ${P.PEIL_STAND}).`);
