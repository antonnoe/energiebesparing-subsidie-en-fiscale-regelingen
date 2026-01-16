/* script.js */
(function(){
  var $ = function(id){ return document.getElementById(id); };

  var state = {
    communes: [],
    selected: null,
    geo: { commune:"", insee:"", dep:"", depName:"", reg:"", regName:"", epci:"" }
  };

  function sanitizeCp(v){ return (v || "").replace(/\D/g,"").slice(0,5); }

  function escapeHtml(s){
    return (s || "")
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function setStatus(msg, isError){
    var el = $("nlfr_cp_status");
    el.innerHTML = msg || "";
    el.style.color = isError ? "#8a1f1f" : "#444";
  }

  function show(el){ el.classList.remove("nlfr-hidden"); }
  function hide(el){ el.classList.add("nlfr-hidden"); }

  function geoSummary(){
    var txt = [];
    if(state.geo.commune) txt.push("<strong>Commune:</strong> " + escapeHtml(state.geo.commune));
    if(state.geo.depName || state.geo.dep) txt.push("<strong>Département:</strong> " + escapeHtml(state.geo.depName ? (state.geo.depName + " ("+state.geo.dep+")") : state.geo.dep));
    if(state.geo.regName || state.geo.reg) txt.push("<strong>Région:</strong> " + escapeHtml(state.geo.regName ? (state.geo.regName + " ("+state.geo.reg+")") : state.geo.reg));
    if(state.geo.epci) txt.push("<strong>EPCI:</strong> " + escapeHtml(state.geo.epci));

    $("nlfr_geo_text").innerHTML = txt.join("<br>");
    if(txt.length) show($("nlfr_geo_summary")); else hide($("nlfr_geo_summary"));
  }

  function applySelectedCommune(idx){
    var c = state.communes[idx];
    if(!c) return;
    state.selected = c;

    state.geo.commune = c.nom || "";
    state.geo.insee = c.code || "";
    state.geo.dep = (c.departement && c.departement.code) ? c.departement.code : "";
    state.geo.depName = (c.departement && c.departement.nom) ? c.departement.nom : "";
    state.geo.reg = (c.region && c.region.code) ? c.region.code : "";
    state.geo.regName = (c.region && c.region.nom) ? c.region.nom : "";
    state.geo.epci = (c.epci && c.epci.nom) ? c.epci.nom : "";

    geoSummary();
  }

  function fetchCommunes(cp){
    var url = "https://geo.api.gouv.fr/communes?codePostal=" + encodeURIComponent(cp) + "&fields=nom,code,departement,region,epci&format=json";
    setStatus("Zoeken…", false);

    return fetch(url, { method:"GET" })
      .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(data){
        if(!data || !data.length){
          state.communes = [];
          state.selected = null;
          hide($("nlfr_commune_wrap"));
          hide($("nlfr_geo_summary"));
          setStatus("Geen commune gevonden voor deze postcode. Controleer de 5 cijfers.", true);
          return;
        }

        state.communes = data;
        var sel = $("nlfr_commune");
        sel.innerHTML = "";

        data.forEach(function(c, i){
          var opt = document.createElement("option");
          opt.value = String(i);
          opt.textContent = c.nom + " (INSEE " + c.code + ")";
          sel.appendChild(opt);
        });

        if(data.length > 1) show($("nlfr_commune_wrap")); else hide($("nlfr_commune_wrap"));

        sel.value = "0";
        applySelectedCommune(0);

        setStatus((data.length > 1) ? "Meerdere communes bij deze postcode: kies hieronder." : "Commune gevonden.", false);
      })
      .catch(function(){
        state.communes = [];
        state.selected = null;
        hide($("nlfr_commune_wrap"));
        hide($("nlfr_geo_summary"));
        setStatus("Postcode-lookup mislukt (API tijdelijk onbereikbaar). Gebruik direct het France Rénov’-loket.", true);
      });
  }

  function badge(color, text){
    var bg = (color === "green") ? "rgba(0,128,0,.08)" : (color === "amber") ? "rgba(255,165,0,.12)" : "rgba(220,0,0,.08)";
    var bd = (color === "green") ? "rgba(0,128,0,.35)" : (color === "amber") ? "rgba(255,165,0,.45)" : "rgba(220,0,0,.35)";
    var fg = (color === "green") ? "#1b5e20" : (color === "amber") ? "#8a5a00" : "#8a1f1f";
    return '<span style="display:inline-block;padding:4px 10px;border-radius:999px;border:1px solid '+bd+';background:'+bg+';color:'+fg+';font-weight:800;font-size:13px;">'+escapeHtml(text)+'</span>';
  }

  function linkBtn(href, text, primary){
    var bg = primary ? "#800000" : "rgba(128,0,0,.06)";
    var fg = primary ? "#fff" : "#800000";
    var bd = "rgba(128,0,0,.35)";
    return '<a href="'+href+'" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block;padding:9px 11px;border-radius:10px;border:1px solid '+bd+';background:'+bg+';color:'+fg+';font-weight:800;">'+escapeHtml(text)+'</a>';
  }

  function card(title, statusHtml, bodyHtml, linksHtml){
    return (
      '<div class="nlfr-card">' +
        '<div class="nlfr-card-head">' +
          '<div class="nlfr-card-title">'+escapeHtml(title)+'</div>' +
          '<div>'+statusHtml+'</div>' +
        '</div>' +
        '<div style="margin-top:8px;">'+bodyHtml+'</div>' +
        (linksHtml ? ('<div class="nlfr-card-links">'+linksHtml+'</div>') : '') +
      '</div>'
    );
  }

  function compute(){
    var usage = $("nlfr_usage").value;
    var age = $("nlfr_age").value;
    var stage = $("nlfr_stage").value;
    var work = $("nlfr_work").value;
    var mprPath = $("nlfr_mpr_path").value;

    var isBeforeSignature = (stage === "before" || stage === "quotes");
    var isSignedOrStarted = (stage === "signed" || stage === "started");
    var isStarted = (stage === "started");
    var isRp = (usage === "rp");
    var isRent = (usage === "rent");

    // MaPrimeRénov’
    var mprColor = "green", mprLabel = "Kansrijk (pre-check)", mprWhy = [];
    if(isStarted){
      mprColor = "red"; mprLabel = "Risico: vaak te laat";
      mprWhy.push("Werk is gestart: bij MaPrimeRénov’ hoort uitvoering pas na acceptatie van de aanvraag.");
    } else if(isSignedOrStarted){
      mprColor = "amber"; mprLabel = "Check nodig";
      mprWhy.push("Devis is getekend: laat door het loket bevestigen of dit gevolgen heeft voor uw traject; uitvoering hoort pas na acceptatie.");
    } else {
      mprWhy.push("U zit vóór start: dit is de juiste volgorde voor MaPrimeRénov’ (dossier → acceptatie → uitvoering).");
    }
    if(mprPath === "ampleur"){
      mprWhy.push("Rénovation d’ampleur: doorgaans begeleiding (Mon Accompagnateur Rénov’) en strakkere spelregels.");
    }

    // CEE
    var ceeColor = "green", ceeLabel = "Kansrijk (pre-check)", ceeWhy = [];
    if(!isBeforeSignature){
      ceeColor = "red"; ceeLabel = "Blokkade-risico";
      ceeWhy.push("CEE-dossiers vragen doorgaans inschrijving/aanvraag vóór ondertekenen van het devis. Als u al tekende, kan dat te laat zijn.");
    } else {
      ceeWhy.push("U zit vóór ondertekenen: dit past bij CEE (eerst inschrijven/akkoord, dan pas devis).");
    }
    if(age === "no"){
      ceeColor = "red"; ceeLabel = "Niet passend";
      ceeWhy.push("CEE geldt doorgaans voor woningen die >2 jaar geleden zijn opgeleverd.");
    }
    if(work === "unknown"){
      ceeWhy.push("Type werk onzeker: CEE hangt af van standaardoperaties/werksoort. Laat dit bevestigen.");
      if(ceeColor === "green"){ ceeColor = "amber"; ceeLabel = "Check nodig"; }
    }

    // Éco-PTZ
    var ptzColor = "green", ptzLabel = "Kansrijk (pre-check)", ptzWhy = [];
    if(!isRp){
      ptzColor = "red"; ptzLabel = "Niet passend (meestal)";
      ptzWhy.push("Éco-PTZ is gekoppeld aan résidence principale (of bestemd om dat te worden).");
    } else {
      ptzWhy.push("Résidence principale: basisvoorwaarde lijkt aanwezig.");
    }
    if(age === "no"){
      ptzColor = "red"; ptzLabel = "Niet passend";
      ptzWhy.push("Éco-PTZ vereist doorgaans dat de woning >2 jaar oud is bij start van de werken.");
    } else if(age === "unknown"){
      ptzWhy.push("Leeftijd woning onbekend: check of het logement >2 jaar oud is.");
      if(ptzColor === "green"){ ptzColor = "amber"; ptzLabel = "Check nodig"; }
    }
    if(isRent && ptzColor !== "red"){
      ptzWhy.push("Bailleur kan, maar er gelden verhuurverplichtingen/termijnen. Laat dit bevestigen.");
      if(ptzColor === "green"){ ptzColor = "amber"; ptzLabel = "Check nodig"; }
    }

    // TVA 5,5%
    var tvaColor = "green", tvaLabel = "Kansrijk (pre-check)", tvaWhy = [];
    if(age === "no"){
      tvaColor = "red"; tvaLabel = "Niet passend";
      tvaWhy.push("TVA à 5,5% (en 10%) geldt doorgaans alleen voor logementen >2 jaar.");
    } else if(age === "unknown"){
      tvaColor = "amber"; tvaLabel = "Check nodig";
      tvaWhy.push("Leeftijd woning onbekend: de 2-jaargrens is meestal bepalend.");
    } else {
      tvaWhy.push("Woning >2 jaar: basisvoorwaarde lijkt aanwezig.");
    }
    tvaWhy.push("Sinds 1 maart 2025 volstaat een ‘simple mention’ op devis/facture (i.p.v. attest) als de voorwaarden zijn vervuld.");
    if(work === "unknown"){
      tvaWhy.push("Type werk onzeker: 5,5% geldt voor energieprestatie-werken met technische criteria.");
      if(tvaColor === "green"){ tvaColor = "amber"; tvaLabel = "Check nodig"; }
    }

    // Local
    var locColor = "amber", locLabel = "Altijd checken", locWhy = [];
    locWhy.push("Lokale regelingen variëren per mairie/EPCI/département/région en wijzigen regelmatig. Routeer altijd via France Rénov’ adviseur + vaste zoekstrategie.");

    // Cards
    var cards = "";
    cards += card(
      "MaPrimeRénov’",
      badge(mprColor, mprLabel),
      "<ul style='margin:0;padding-left:18px;'>" + mprWhy.map(function(x){ return "<li style='margin:6px 0;'>"+escapeHtml(x)+"</li>"; }).join("") + "</ul>",
      linkBtn("https://infofrankrijk.com/ma-prime-renov-in-frankrijk-voorwaarden-werking-en-aandachtspunten/","Detailartikel MaPrimeRénov’", false) +
      linkBtn("https://france-renov.gouv.fr/preparer-projet/trouver-conseiller","France Rénov’ loket", true)
    );

    cards += card(
      "CEE / primes énergie",
      badge(ceeColor, ceeLabel),
      "<ul style='margin:0;padding-left:18px;'>" + ceeWhy.map(function(x){ return "<li style='margin:6px 0;'>"+escapeHtml(x)+"</li>"; }).join("") + "</ul>",
      linkBtn("https://infofrankrijk.com/cee-en-primes-energie-energiebesparingspremies-in-frankrijk-uitgelegd/","Detailartikel CEE", false) +
      linkBtn("https://france-renov.gouv.fr/preparer-projet/trouver-conseiller","Check via France Rénov’", true)
    );

    cards += card(
      "Éco-PTZ (renteloze lening)",
      badge(ptzColor, ptzLabel),
      "<ul style='margin:0;padding-left:18px;'>" + ptzWhy.map(function(x){ return "<li style='margin:6px 0;'>"+escapeHtml(x)+"</li>"; }).join("") + "</ul>",
      linkBtn("https://infofrankrijk.com/eco-ptz-renteloze-lening-voor-energierenovatie-in-frankrijk/","Detailartikel Éco-PTZ", false) +
      linkBtn("https://france-renov.gouv.fr/preparer-projet/trouver-conseiller","Route via adviseur", true)
    );

    cards += card(
      "TVA à 5,5% (verlaagd btw-tarief)",
      badge(tvaColor, tvaLabel),
      "<ul style='margin:0;padding-left:18px;'>" + tvaWhy.map(function(x){ return "<li style='margin:6px 0;'>"+escapeHtml(x)+"</li>"; }).join("") + "</ul>",
      linkBtn("https://infofrankrijk.com/tva-a-55-bij-renovatie-in-frankrijk-wanneer-geldt-het-lage-btw-tarief/","Detailartikel TVA 5,5%", false) +
      linkBtn("https://france-renov.gouv.fr/preparer-projet/trouver-conseiller","Controleer voorwaarden", true)
    );

    cards += card(
      "Lokale steun (commune / EPCI / département / région)",
      badge(locColor, locLabel),
      "<ul style='margin:0;padding-left:18px;'>" + locWhy.map(function(x){ return "<li style='margin:6px 0;'>"+escapeHtml(x)+"</li>"; }).join("") + "</ul>",
      linkBtn("https://infofrankrijk.com/lokale-subsidies-voor-energierenovatie-in-frankrijk-zo-vindt-u-wat-er-geldt/","Zo vindt u lokale steun", false) +
      linkBtn("https://france-renov.gouv.fr/preparer-projet/trouver-conseiller","Loket per postcode", true)
    );

    $("nlfr_cards").innerHTML = cards;

    // Combinations block
    var combo = [];
    combo.push("<div style='margin:0 0 8px 0;'><strong>Meestal probleemloos:</strong></div>");
    combo.push("<ul style='margin:0;padding-left:18px;'>"
      + "<li style='margin:6px 0;'><strong>MaPrimeRénov’ + éco-PTZ</strong> (subsidie + financiering).</li>"
      + "<li style='margin:6px 0;'><strong>MaPrimeRénov’ + TVA 5,5%</strong> (subsidie + btw-tarief).</li>"
      + "<li style='margin:6px 0;'><strong>CEE + TVA 5,5%</strong> (premie + btw-tarief).</li>"
      + "<li style='margin:6px 0;'><strong>MaPrimeRénov’ + lokale hulp</strong> (kan, maar lokaal heeft eigen voorwaarden/deadlines).</li>"
      + "</ul>");

    combo.push("<div style='margin:10px 0 8px 0;'><strong>Waar het in de praktijk misgaat:</strong> timing en ‘dubbele route’.</div>");
    var warn = [];
    if(mprPath === "ampleur"){
      warn.push("Bij rénovation d’ampleur (parcours accompagné) kan de behandeling van CEE anders lopen dan bij ‘par geste’. Bespreek vóór u apart een CEE-aanvraag start.");
    }
    if(!isBeforeSignature){
      warn.push("Als u al tekende: CEE is vaak te laat. Vermijd dan ‘achteraf nog even CEE regelen’ zonder bevestiging.");
    }
    if(isStarted){
      warn.push("Als u al gestart bent: laat meteen door het loket beoordelen welke sporen nog open staan.");
    }
    if(warn.length){
      combo.push("<ul style='margin:0;padding-left:18px;'>" + warn.map(function(x){ return "<li style='margin:6px 0;'>"+escapeHtml(x)+"</li>"; }).join("") + "</ul>");
    } else {
      combo.push("<div style='font-size:13px;color:#444;'>U zit nog in de veilige fase (vóór tekenen/start). Houd dat vast totdat loket/voorwaarden bevestigd zijn.</div>");
    }

    $("nlfr_combo_block").innerHTML =
      "<div style='border:1px solid rgba(128,0,0,.16);border-radius:14px;padding:12px 12px;background:#fff;'>"
      + combo.join("")
      + "</div>";

    // Local block
    var geoParts = [];
    if(state.geo.commune) geoParts.push("<strong>Commune:</strong> " + escapeHtml(state.geo.commune));
    if(state.geo.epci) geoParts.push("<strong>EPCI:</strong> " + escapeHtml(state.geo.epci));
    if(state.geo.depName || state.geo.dep) geoParts.push("<strong>Département:</strong> " + escapeHtml(state.geo.depName ? (state.geo.depName + " ("+state.geo.dep+")") : state.geo.dep));
    if(state.geo.regName || state.geo.reg) geoParts.push("<strong>Région:</strong> " + escapeHtml(state.geo.regName ? (state.geo.regName + " ("+state.geo.reg+")") : state.geo.reg));

    var localHtml = "";
    if(geoParts.length){
      localHtml += "<div style='margin:0 0 8px 0;'>" + geoParts.join("<br>") + "</div>";
      localHtml += "<div style='margin:0 0 10px 0;'>Vraag bij uw <strong>mairie</strong> en/of <strong>EPCI</strong> of er een lokaal renovatieprogramma loopt. Verifieer via <strong>France Rénov’</strong>.</div>";
    } else {
      localHtml += "<div style='margin:0 0 10px 0;'>Vul een postcode in om de bestuurslagen te tonen. Als postcode-lookup faalt: gebruik direct het France Rénov’ loket.</div>";
    }
    localHtml += "<div style='display:flex;gap:10px;flex-wrap:wrap;'>";
    localHtml += linkBtn("https://france-renov.gouv.fr/preparer-projet/trouver-conseiller","France Rénov’ adviseur", true);
    localHtml += linkBtn("https://france-renov.gouv.fr/aides/collectivites-locales","Aides locales (France Rénov’)", false);
    localHtml += "</div>";
    $("nlfr_local_block").innerHTML = localHtml;

    // Action plan
    var lines = [];
    lines.push("SUBSIDIE-ROUTE (indicatief) — " + new Date().toLocaleDateString());
    if(state.geo.commune) lines.push("Locatie: " + state.geo.commune + (state.geo.dep ? " ("+state.geo.dep+")" : ""));
    lines.push("");
    lines.push("0) Timing (kritiek):");
    if(isStarted){
      lines.push("- U bent gestart: laat direct beoordelen welke sporen nog open staan (France Rénov’).");
    } else if(isSignedOrStarted){
      lines.push("- U heeft getekend: CEE is vaak te laat; MPR: laat bevestigen, en start pas na acceptatie.");
    } else {
      lines.push("- U zit vóór tekenen/start: houd dit zo totdat loket en voorwaarden zijn bevestigd.");
    }
    lines.push("");
    lines.push("1) Trajectkeuze MPR: " + (mprPath === "ampleur" ? "Rénovation d’ampleur (parcours accompagné)" : (mprPath === "geste" ? "Par geste" : "Onzeker")));
    lines.push("2) Combinaties (algemeen): MPR kan cumuleren met CEE/éco-PTZ/TVA onder voorwaarden; CEE cumul met MPR/éco-PTZ is toegestaan. Verifieer details bij loket.");
    lines.push("");
    lines.push("3) Juiste loketten/links:");
    lines.push("- France Rénov’ adviseur: https://france-renov.gouv.fr/preparer-projet/trouver-conseiller");
    lines.push("- MaPrimeRénov’: https://infofrankrijk.com/ma-prime-renov-in-frankrijk-voorwaarden-werking-en-aandachtspunten/");
    lines.push("- CEE: https://infofrankrijk.com/cee-en-primes-energie-energiebesparingspremies-in-frankrijk-uitgelegd/");
    lines.push("- Éco-PTZ: https://infofrankrijk.com/eco-ptz-renteloze-lening-voor-energierenovatie-in-frankrijk/");
    lines.push("- TVA 5,5%: https://infofrankrijk.com/tva-a-55-bij-renovatie-in-frankrijk-wanneer-geldt-het-lage-btw-tarief/");
    lines.push("- Lokale zoekstrategie: https://infofrankrijk.com/lokale-subsidies-voor-energierenovatie-in-frankrijk-zo-vindt-u-wat-er-geldt/");
    $("nlfr_plan").value = lines.join("\n");

    show($("nlfr_results"));
    try{ $("nlfr_results").scrollIntoView({ behavior:"smooth", block:"start" }); }catch(e){}
  }

  $("nlfr_cp_btn").addEventListener("click", function(){
    var cp = sanitizeCp($("nlfr_cp").value);
    $("nlfr_cp").value = cp;
    if(cp.length !== 5){ setStatus("Vul een postcode met 5 cijfers in.", true); return; }
    fetchCommunes(cp);
  });

  $("nlfr_commune").addEventListener("change", function(){
    var idx = parseInt(this.value,10); if(isNaN(idx)) idx = 0;
    applySelectedCommune(idx);
  });

  $("nlfr_calc_btn").addEventListener("click", function(){ compute(); });

  $("nlfr_copy_btn").addEventListener("click", function(){
    var t = $("nlfr_plan").value || "";
    $("nlfr_copy_status").textContent = "";
    if(!t){ return; }

    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t)
        .then(function(){ $("nlfr_copy_status").textContent = "Gekopieerd."; })
        .catch(function(){ $("nlfr_copy_status").textContent = "Kopiëren lukt niet automatisch; selecteer de tekst handmatig."; });
    } else {
      $("nlfr_copy_status").textContent = "Selecteer de tekst en kopieer handmatig (Ctrl/Cmd+C).";
    }
  });

  $("nlfr_cp").addEventListener("keydown", function(e){
    if(e.key === "Enter"){ e.preventDefault(); $("nlfr_cp_btn").click(); }
  });

})();
