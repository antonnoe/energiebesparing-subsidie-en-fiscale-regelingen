function zoekPostcode() {
  const pc = document.getElementById("postcode").value;
  const out = document.getElementById("locatieResultaat");
  out.innerHTML = "Zoeken…";

  fetch("https://geo.api.gouv.fr/communes?codePostal=" + pc)
    .then(r => r.json())
    .then(data => {
      if (!data.length) {
        out.innerHTML = "Geen gemeente gevonden. Gebruik het France Rénov’-loket.";
        return;
      }
      const c = data[0];
      out.innerHTML =
        "<strong>Gemeente:</strong> " + c.nom +
        "<br><strong>Département:</strong> " + c.departement.code +
        "<br><strong>Regio:</strong> " + c.region.nom;
    })
    .catch(() => {
      out.innerHTML = "Postcode-service niet bereikbaar.";
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
