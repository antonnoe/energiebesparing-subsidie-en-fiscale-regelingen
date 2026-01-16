function zoekPostcode() {
  const pcRaw = document.getElementById("postcode").value || "";
  const pc = pcRaw.replace(/\D/g, "").slice(0, 5);

  const out = document.getElementById("locatieResultaat");
  out.innerHTML = "";

  if (pc.length !== 5) {
    out.innerHTML = "Vul een postcode met 5 cijfers in.";
    return;
  }

  out.innerHTML = "Zoeken…";

  const url =
    "https://geo.api.gouv.fr/communes?codePostal=" + encodeURIComponent(pc) +
    "&fields=nom,code,departement,region&format=json";

  fetch(url, { method: "GET" })
    .then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        out.innerHTML = "Geen gemeente gevonden. Gebruik het France Rénov’-loket.";
        return;
      }

      // Als er meerdere communes zijn, toon de eerste + melding
      const c = data[0];
      const multi = data.length > 1
        ? "<br><em>Meerdere communes bij deze postcode; dit is de eerste match.</em>"
        : "";

      const dep = c.departement ? (c.departement.nom + " (" + c.departement.code + ")") : "(onbekend)";
      const reg = c.region ? (c.region.nom) : "(onbekend)";

      out.innerHTML =
        "<strong>Gemeente:</strong> " + c.nom +
        "<br><strong>Département:</strong> " + dep +
        "<br><strong>Regio:</strong> " + reg +
        multi;
    })
    .catch(err => {
      // Toon echte oorzaak compact (handig voor debug) + fallback
      out.innerHTML =
        "Postcode-service niet bereikbaar (" + String(err.message || err) + "). " +
        "Gebruik het France Rénov’-loket.";
    });
}


function bereken() {
  const status = document.getElementById("status").value;
  const mpr = document.getElementById("mpr").value;
  const out = document.getElementById("uitkomst");

  let html = "<h2>Indicatieve uitkomst</h2><ul>";

  if (status === "gestart") {
    html += "<li><strong>MaPrimeRénov’:</strong> risico – werk al gestart.</li>";
    html += "<li><strong>CEE:</strong> doorgaans te laat.</li>";
  } else if (status === "getekend") {
    html += "<li><strong>MaPrimeRénov’:</strong> check nodig vóór uitvoering.</li>";
    html += "<li><strong>CEE:</strong> meestal niet meer mogelijk.</li>";
  } else {
    html += "<li><strong>MaPrimeRénov’:</strong> kansrijk (timing OK).</li>";
    html += "<li><strong>CEE:</strong> mogelijk mits vóór ondertekenen.</li>";
  }

  if (mpr === "ampleur") {
    html += "<li><strong>Combinaties:</strong> let op bij rénovation d’ampleur – CEE kan anders lopen.</li>";
  }

  html += "</ul>";
  html += "<p><strong>Volgende stap:</strong> bevestig dit altijd via een France Rénov’-adviseur.</p>";
  html += "<p><a href='https://france-renov.gouv.fr/preparer-projet/trouver-conseiller' target='_blank'>Naar France Rénov’ loket</a></p>";

  out.innerHTML = html;
}
