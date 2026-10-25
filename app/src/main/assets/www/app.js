// KNJIŽNICA CENTRALNIH REKUPERATORJEV (Zehnder, Paul, Helios, Pichler, Dantherm, Brink, Mitsubishi)
const HRV_DEVICES_DB = [
  { id: 'zehnder_q350', name: 'Zehnder ComfoAir Q350 TR (standardni diamantni izmenjevalnik)', eff: 90, flow: 350, spi: 0.24, area: '120–220 m²', type: 'Protitočni' },
  { id: 'zehnder_q350_erv', name: 'Zehnder ComfoAir Q350 ERV (entalpijski - vrača vlago)', eff: 86, flow: 350, spi: 0.24, area: '120–220 m²', type: 'Entalpijski' },
  { id: 'zehnder_q450', name: 'Zehnder ComfoAir Q450 TR', eff: 89, flow: 450, spi: 0.26, area: '180–280 m²', type: 'Protitočni' },
  { id: 'paul_novus300', name: 'Paul Novus 300 (vrhunski PHI izkoristek)', eff: 93, flow: 300, spi: 0.24, area: '100–200 m²', type: 'Protitočni' },
  { id: 'paul_novus300_f', name: 'Paul Novus F 300 (entalpijski - vrača vlago)', eff: 89, flow: 300, spi: 0.25, area: '100–200 m²', type: 'Entalpijski' },
  { id: 'helios_kwl300', name: 'Helios KWL EC 300 W', eff: 88, flow: 300, spi: 0.29, area: '110–190 m²', type: 'Protitočni' },
  { id: 'helios_kwl340_et', name: 'Helios KWL 340 D (entalpijski)', eff: 85, flow: 340, spi: 0.30, area: '120–220 m²', type: 'Entalpijski' },
  { id: 'pichler_lg350', name: 'Pichler LG 350', eff: 88, flow: 350, spi: 0.28, area: '130–230 m²', type: 'Protitočni' },
  { id: 'dantherm_hcv400', name: 'Dantherm HCV 400 P2', eff: 87, flow: 360, spi: 0.29, area: '120–230 m²', type: 'Protitočni' },
  { id: 'brink_flair325', name: 'Brink Flair 325', eff: 91, flow: 325, spi: 0.21, area: '110–210 m²', type: 'Protitočni' },
  { id: 'mitsubishi_lossnay', name: 'Mitsubishi Lossnay VL-350CZPVU-R-E', eff: 85, flow: 350, spi: 0.27, area: '120–210 m²', type: 'Protitočni' }
];

// INTERAKTIVNI GLASER CANVAS Z DETEKCIJO MIŠKE
function drawGlaserCanvas(canvasId, el, res, hoverXRatio = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);
  const padL = 48, padR = 48, padT = 24, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const ti = state.boundary.ti, teEff = ti - el.fx * (ti - state.boundary.te);
  const minT = Math.min(teEff, ...res.nodes.map(n => n.Tdew), -15) - 3, maxT = Math.max(ti, 25) + 3;
  const yFromT = (T) => padT + plotH * (1 - (T - minT) / (maxT - minT));
  const totalD = Math.max(1, res.sumD), xFromCm = (cm) => padL + plotW * (cm / totalD);

  const allMats = getAllMaterials();
  let curCm = 0;
  res.computedLayers.forEach(l => {
    const x1 = xFromCm(curCm), x2 = xFromCm(curCm + (parseFloat(l.d) || 0));
    const matObj = allMats.find(m => m.id === l.matId);
    ctx.fillStyle = matObj ? matObj.color + '33' : '#cbd5e133';
    ctx.fillRect(x1, padT, Math.max(1, x2 - x1), plotH);
    ctx.strokeStyle = '#94a3b8'; ctx.strokeRect(x1, padT, Math.max(1, x2 - x1), plotH);
    if (l.isVentAir && (x2 - x1 > 18)) {
      ctx.fillStyle = '#0284c7'; ctx.font = '700 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🌬️ ZRAK', (x1 + x2) / 2, padT + 25);
    } else if (l.woodPct > 0 && (x2 - x1 > 28)) {
      ctx.fillStyle = '#b45309'; ctx.font = '700 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`🪵 ${l.woodPct}% les`, (x1 + x2) / 2, padT + 25);
    }
    if (x2 - x1 > 34) {
      ctx.fillStyle = state.darkMode ? '#e2e8f0' : '#334155'; ctx.font = '600 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${l.d} cm`, (x1 + x2) / 2, padT + 13);
    }
    curCm += (parseFloat(l.d) || 0);
  });

  if (minT < 0 && maxT > 0) {
    const y0 = yFromT(0);
    ctx.strokeStyle = '#94a3b8'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(padL, y0); ctx.lineTo(W - padR, y0); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('0 °C', padL - 6, y0 + 3);
  }

  for (let i = 0; i < res.nodes.length - 1; i++) {
    if (res.nodes[i].condenses || res.nodes[i + 1].condenses) {
      const x1 = xFromCm(res.nodes[i].x_cm), x2 = xFromCm(res.nodes[i + 1].x_cm);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)'; ctx.fillRect(x1, padT, x2 - x1, plotH);
    }
  }

  ctx.strokeStyle = '#0284c7'; ctx.lineWidth = 2.2; ctx.setLineDash([5, 4]);
  ctx.beginPath();
  res.nodes.forEach((n, idx) => { const x = xFromCm(n.x_cm), y = yFromT(n.Tdew); if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke(); ctx.setLineDash([]);

  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  res.nodes.forEach((n, idx) => { const x = xFromCm(n.x_cm), y = yFromT(n.T); if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();

  res.nodes.forEach(n => {
    const x = xFromCm(n.x_cm);
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(x, yFromT(n.T), 3.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0284c7'; ctx.beginPath(); ctx.arc(x, yFromT(n.Tdew), 2.8, 0, Math.PI * 2); ctx.fill();
  });

  if (hoverXRatio !== null && hoverXRatio >= 0 && hoverXRatio <= 1) {
    const cmPos = hoverXRatio * totalD;
    const xPx = xFromCm(cmPos);
    let segIdx = 0;
    for (let i = 0; i < res.nodes.length - 1; i++) {
      if (cmPos >= res.nodes[i].x_cm && cmPos <= res.nodes[i + 1].x_cm) { segIdx = i; break; }
    }
    const n1 = res.nodes[segIdx], n2 = res.nodes[segIdx + 1] || n1;
    const span = Math.max(0.001, n2.x_cm - n1.x_cm);
    const f = Math.min(1, Math.max(0, (cmPos - n1.x_cm) / span));
    const curT = n1.T + f * (n2.T - n1.T);
    const curTdew = n1.Tdew + f * (n2.Tdew - n1.Tdew);
    const curP = n1.p + f * (n2.p - n1.p);
    const curRh = Math.min(100, (curP / psat(curT)) * 100);
    const layerName = (res.computedLayers[segIdx] ? res.computedLayers[segIdx].name : '').substring(0, 28);

    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(xPx, padT); ctx.lineTo(xPx, padT + plotH); ctx.stroke();

    const boxW = 215, boxH = 54;
    const bx = Math.min(W - padR - boxW - 4, Math.max(padL + 4, xPx + 8));
    const by = padT + 18;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.fillStyle = '#fff'; ctx.font = '700 10px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`${cmPos.toFixed(1)} cm | ${layerName}`, bx + 6, by + 15);
    ctx.fillStyle = '#fca5a5'; ctx.fillText(`T = ${curT.toFixed(1)} °C`, bx + 6, by + 31);
    ctx.fillStyle = '#7dd3fc'; ctx.fillText(`T_ros = ${curTdew.toFixed(1)} °C`, bx + 95, by + 31);
    ctx.fillStyle = '#10b981'; ctx.fillText(`Rel. vlaga φ = ${curRh.toFixed(0)} %`, bx + 6, by + 46);
  }

  const txtCol = state.darkMode ? '#f8fafc' : '#0f172a';
  ctx.fillStyle = txtCol; ctx.font = '700 11px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(`Znotraj (${ti}°C)`, 6, padT + 12);
  ctx.fillStyle = '#ef4444'; ctx.fillText(`Tsi: ${res.Tsi.toFixed(1)}°C`, 6, padT + 26);
  ctx.fillStyle = txtCol; ctx.textAlign = 'right'; ctx.fillText(`Zunaj (${teEff.toFixed(1)}°C)`, W - 6, H - 10);
  ctx.textAlign = 'left'; ctx.font = '600 11px sans-serif';
  ctx.fillStyle = '#ef4444'; ctx.fillText('━━ Temperatura T(x)', padL, H - 8);
  ctx.fillStyle = '#0284c7'; ctx.fillText('╌╌ Rosišče T_ros(x) (zapelji z miško)', padL + 145, H - 8);
}

function attachGlaserHover(canvasId, el, res) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const padL = 48, padR = 48, plotW = rect.width - padL - padR;
    const ratio = (e.clientX - rect.left - padL) / Math.max(1, plotW);
    drawGlaserCanvas(canvasId, el, res, Math.min(1, Math.max(0, ratio)));
  };
  canvas.onmouseleave = () => drawGlaserCanvas(canvasId, el, res, null);
}

function drawSolarBatteryChart(canvasId, sim) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);
  const padL = 44, padR = 16, padT = 24, padB = 28;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxVal = Math.max(500, ...sim.months.map(m => Math.max(m.pvM, m.loadM))) * 1.1;

  const colW = plotW / 12;
  sim.months.forEach((m, i) => {
    const xBase = padL + i * colW;
    const hPv = (m.pvM / maxVal) * plotH;
    const hSelf = ((m.directM + m.batM) / maxVal) * plotH;
    const hGrid = (m.gridWithBatM / maxVal) * plotH;

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(xBase + 6, padT + plotH - hPv, colW * 0.34, hPv);

    const xLoad = xBase + 6 + colW * 0.38;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(xLoad, padT + plotH - hSelf, colW * 0.34, hSelf);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(xLoad, padT + plotH - hSelf - hGrid, colW * 0.34, hGrid);

    ctx.fillStyle = state.darkMode ? '#94a3b8' : '#64748b';
    ctx.font = '600 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(m.m, xBase + colW * 0.45, H - 9);
  });

  ctx.textAlign = 'left'; ctx.font = '700 11px sans-serif';
  ctx.fillStyle = '#f59e0b'; ctx.fillText('██ Proizvodnja SE', padL, 15);
  ctx.fillStyle = '#10b981'; ctx.fillText('██ Pokrito (SE + Baterija)', padL + 135, 15);
  ctx.fillStyle = '#ef4444'; ctx.fillText('██ Dokup iz omrežja', padL + 310, 15);
}

function buildMaterialOptions(selectedId) {
  const allMats = getAllMaterials(), groups = {};
  allMats.forEach(m => { if (!groups[m.group]) groups[m.group] = []; groups[m.group].push(m); });
  let html = '';
  for (const gName in groups) {
    html += `<optgroup label="${gName}">`;
    groups[gName].forEach(m => {
      html += `<option value="${m.id}" ${m.id === selectedId ? 'selected' : ''}>${m.name} (λ=${m.lambda}, μ=${m.mu})</option>`;
    });
    html += `</optgroup>`;
  }
  return html;
}

function renderScenarioBar(totals) {
  const wrap = document.getElementById('scenarioBarWrap');
  if (!state.scenarioA) { wrap.innerHTML = ''; return; }
  const sa = state.scenarioA;
  const curEur = Math.round(calcFuelAnnualCost(state.fuels[0], totals.netHeatingKwh, totals.annualDhwKwh).annualEur);
  const dW = Math.round(totals.totalW - sa.totalW), dKwh = Math.round(totals.annualKwh - sa.annualKwh), dEur = curEur - sa.eur;
  const fmt = (v, u) => `<strong style="color:${v <= 0 ? '#10b981' : '#ef4444'}">${v > 0 ? '+' : ''}${v.toLocaleString('sl-SI')} ${u}</strong>`;
  wrap.innerHTML = `<div class="scenario-bar"><div><strong>⚖️ Primerjava s Scenarijem A</strong> <span style="color:var(--muted); margin-left:8px;">(A: ${Math.round(sa.totalW)} W | ${Math.round(sa.annualKwh)} kWh | ${sa.eur} €/leto)</span></div><div class="scenario-deltas"><span>Moč: ${fmt(dW, 'W')}</span><span>Energija: ${fmt(dKwh, 'kWh')}</span><span>Strošek TČ: ${fmt(dEur, '€/leto')}</span><button class="btn-danger btn-sm" onclick="clearScenarioA()">✕ Počisti</button></div></div>`;
}

function renderTabs(totals) {
  const tabsDef = [
    { id: 'walls', label: '🧱 Zidovi', badge: `${Math.round(totals.wallsQ)} W` },
    { id: 'roofs', label: '🏠 Streha / Strop', badge: `${Math.round(totals.roofsQ)} W` },
    { id: 'floors', label: '🪵 Tla', badge: `${Math.round(totals.floorsQ)} W` },
    { id: 'bom', label: '📦 Popis materiala', badge: 'm² / m³' },
    { id: 'materials', label: '📚 Knjižnica materialov', badge: `${getAllMaterials().length} mat.` },
    { id: 'windows', label: '🪟 Okna + Sonce', badge: `${Math.round(totals.windowsQ)} W` },
    { id: 'doors', label: '🚪 Vrata', badge: `${Math.round(totals.doorsQ)} W` },
    { id: 'bridges', label: '📐 Toplotni mostovi (Ψ)', badge: `${Math.round(totals.bridgesQ)} W` },
    { id: 'ventilation', label: '💨 Prezračevanje', badge: `${Math.round(totals.ventQ)} W` },
    { id: 'dhw', label: '🚿 Sanitarna voda & Vrtina', badge: `${Math.round(totals.annualDhwKwh)} kWh` },
    { id: 'hp_power', label: '⚙️ Toplotna črpalka & Varovalke', badge: `${totals.effectiveHpElAtTeKw.toFixed(2)} kW el.` },
    { id: 'meter_solar', label: '📟 Števec, SE & Baterija', badge: `${totals.solarBatSim.selfSuffWithBatAnnualPct.toFixed(0)} % samooskrba` },
    { id: 'fuels_compare', label: '📊 Primerjava energentov', badge: 'ROI' },
    { id: 'rooms', label: '🛋️ Talno gretje & Hidravlika', badge: `${state.rooms.length} sob` },
    { id: 'roi', label: '📈 Investicija Prej/Potem', badge: 'Prihranki' }
  ];
  document.getElementById('categoryTabs').innerHTML = tabsDef.map(t => `<button class="tab-btn ${state.activeTab === t.id ? 'active' : ''}" onclick="switchTab('${t.id}')"><span>${t.label}</span><span class="tab-badge">${t.badge}</span></button>`).join('');
}

function renderLayeredGroup(groupKey, titleLabel) {
  const list = state[groupKey];
  const stdLimits = STANDARD_LIMITS[groupKey] || STANDARD_LIMITS.walls;
  const rWidth = state.rafterHelper.widthCm || 10, rSpacing = Math.max(10, state.rafterHelper.spacingCm || 80);
  const calcWoodPct = Math.min(90, (rWidth / rSpacing) * 100);

  let html = `<div class="card"><div class="card-title"><span>${titleLabel} – U-vrednost, PURES-3, Pasivni standard, špirovci in interaktivno rosišče</span><div style="display:flex; gap:6px; flex-wrap:wrap;"><button class="btn-secondary btn-sm" onclick="switchTab('materials')">📚 Uredi ali dodaj material</button><button class="btn-primary btn-sm" onclick="addElement('${groupKey}')">+ Dodaj nov sklop</button></div></div>`;

  list.forEach((el, elIdx) => {
    const res = calcAssembly(el);
    const isCokel = el.name.toLowerCase().includes('cokel');
    const puresLimit = isCokel ? 0.25 : stdLimits.puresU, passiveLimit = isCokel ? 0.20 : stdLimits.passiveU;
    const meetsPures = res.uVal <= puresLimit, meetsPassive = res.uVal <= passiveLimit;
    const hasCond = res.condensationZones.length > 0, moldOk = res.fRsi >= 0.70, phiHours = res.phaseShiftHours;
    const phiClass = phiHours >= 10 ? 'badge-ok' : (phiHours >= 7 ? 'badge-warn' : 'badge-err');

    const reqPuresCm = calcRequiredInsulationThickness(el, puresLimit, 0.031);
    const reqPassivCm = calcRequiredInsulationThickness(el, passiveLimit, 0.031);

    let defaultLayerIdx = el.rafterTargetLayer !== undefined ? el.rafterTargetLayer : el.layers.findIndex(l => (l.woodPct || 0) > 0);
    if (defaultLayerIdx < 0 || defaultLayerIdx >= el.layers.length) defaultLayerIdx = el.layers.findIndex(l => l.lambda <= 0.045);
    if (defaultLayerIdx < 0) defaultLayerIdx = 0;

    const layerSelectOpts = el.layers.map((l, lIdx) => `<option value="${lIdx}" ${lIdx === defaultLayerIdx ? 'selected' : ''}>Sloj #${lIdx + 1}: ${l.name.substring(0, 32)}</option>`).join('');

    html += `
      <div class="element-box">
        <div class="element-header">
          <div class="field"><label>Naziv sklopa</label><input type="text" value="${el.name}" onchange="updateElField('${groupKey}', ${elIdx}, 'name', this.value)"></div>
          <div class="field"><label>Površina A (m²)</label><input type="number" step="1" value="${el.area}" onchange="updateElField('${groupKey}', ${elIdx}, 'area', this.value)"></div>
          <div class="field"><label>Faktor korekcije temp. fx</label>
            <select onchange="updateElField('${groupKey}', ${elIdx}, 'fx', this.value)">
              <option value="1" ${el.fx == 1 ? 'selected' : ''}>Proti zunanjosti (fx = 1.0)</option>
              <option value="0.8" ${el.fx == 0.8 ? 'selected' : ''}>Proti neogrev. podstrešju (fx = 0.8)</option>
              <option value="0.5" ${el.fx == 0.5 ? 'selected' : ''}>Proti zemljini / kleti (fx = 0.5)</option>
            </select>
          </div>
          <div style="display:flex; gap:5px;">
            <button class="btn-secondary btn-sm" onclick="cloneElement('${groupKey}', ${elIdx})" title="Podvoji ta sklop z vsemi sloji">📋 Podvoji</button>
            <button class="btn-danger btn-sm" onclick="removeElement('${groupKey}', ${elIdx})">Izbriši</button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="layers-table">
            <thead>
              <tr>
                <th style="width:26px;">#</th><th>Sloj materiala (od NOTRANJE proti ZUNANJI strani)</th>
                <th style="width:68px;">d (cm)</th><th style="width:74px;">λ (W/mK)</th>
                <th style="width:82px;">🪵 Špirovci (%)</th><th style="width:65px;">μ (para)</th>
                <th style="width:68px;">ρ (kg/m³)</th><th style="width:68px;">c (J/kgK)</th>
                <th style="width:80px;">R (m²K/W)</th><th style="width:62px;">Zamik</th><th style="width:84px;">Vrstni red</th>
              </tr>
            </thead>
            <tbody>
              ${res.computedLayers.map((l, lIdx) => `
                <tr style="${l.bypassedByVent ? 'background:#0284c71a;' : (l.woodPct > 0 ? 'background:#f59e0b1a;' : '')}">
                  <td><strong>${lIdx + 1}.</strong></td>
                  <td><select onchange="selectMaterial('${groupKey}', ${elIdx}, ${lIdx}, this.value)">${buildMaterialOptions(l.matId)}</select></td>
                  <td><input type="number" step="0.5" min="0.01" value="${l.d}" onchange="updateLayer('${groupKey}', ${elIdx}, ${lIdx}, 'd', this.value)"></td>
                  <td>
                    <input type="number" step="0.001" min="0.01" value="${l.lambda}" onchange="updateLayer('${groupKey}', ${elIdx}, ${lIdx}, 'lambda', this.value)">
                    ${l.woodPct > 0 ? `<div style="font-size:0.65rem; color:#d97706; font-weight:700;">λ_eff=${l.lamEff.toFixed(3)}</div>` : ''}
                  </td>
                  <td><input type="number" step="0.5" min="0" max="90" value="${l.woodPct || 0}" onchange="updateLayer('${groupKey}', ${elIdx}, ${lIdx}, 'woodPct', this.value)"></td>
                  <td><input type="number" step="1" min="1" value="${l.mu}" onchange="updateLayer('${groupKey}', ${elIdx}, ${lIdx}, 'mu', this.value)"></td>
                  <td><input type="number" step="10" min="1" value="${l.rho}" onchange="updateLayer('${groupKey}', ${elIdx}, ${lIdx}, 'rho', this.value)"></td>
                  <td><input type="number" step="50" min="100" value="${l.c}" onchange="updateLayer('${groupKey}', ${elIdx}, ${lIdx}, 'c', this.value)"></td>
                  <td>${l.bypassedByVent ? `<span class="badge badge-info">🌬️ Prezr.</span>` : `<strong>${l.r.toFixed(2)}</strong>`}</td>
                  <td>${l.layerPhi.toFixed(1)} h</td>
                  <td>
                    <button class="btn-secondary btn-sm" onclick="moveLayer('${groupKey}', ${elIdx}, ${lIdx}, -1)">▲</button>
                    <button class="btn-secondary btn-sm" onclick="moveLayer('${groupKey}', ${elIdx}, ${lIdx}, 1)">▼</button>
                    <button class="btn-danger btn-sm" onclick="removeLayer('${groupKey}', ${elIdx}, ${lIdx})">✕</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
          <button class="btn-secondary btn-sm" onclick="addLayer('${groupKey}', ${elIdx})">+ Dodaj sloj v sestavo</button>
          <span style="font-size:0.75rem; color:var(--muted);">💡 <strong>Pametni nasvet za izolacijo (λ=0.031):</strong> Za PURES priporočeno min. ~${reqPuresCm} cm, za pasivni standard ~${reqPassivCm} cm.</span>
        </div>
        <div class="rafter-calc-bar">
          <div><strong>🪵 Kalkulator deleža špirovcev (lesa):</strong></div>
          <div class="rafter-calc-inputs">
            <span>Širina špirovca:</span>
            <input type="number" step="0.5" min="2" max="40" style="width:58px;" value="${rWidth}" onchange="updateRafterHelper('widthCm', this.value)">
            <span>cm ÷ Osni razmak (e):</span>
            <input type="number" step="1" min="20" max="200" style="width:62px;" value="${rSpacing}" onchange="updateRafterHelper('spacingCm', this.value)">
            <span>cm = <strong style="font-size:0.84rem; color:#d97706;">${calcWoodPct.toFixed(1)} % lesa</strong></span>
            <select id="rafterTargetLayer_${groupKey}_${elIdx}" onchange="saveRafterTargetLayer('${groupKey}', ${elIdx}, this.value)" style="max-width:210px;">${layerSelectOpts}</select>
            <button class="btn-primary btn-sm" onclick="applyRafterPctToLayer('${groupKey}', ${elIdx}, ${calcWoodPct.toFixed(1)})">Prenesi ${calcWoodPct.toFixed(1)} % v sloj</button>
          </div>
        </div>
        <div class="metrics-bar">
          <div class="metric-item"><span class="metric-label">Skupna debelina</span><span class="metric-val">${res.sumD.toFixed(1)} cm</span></div>
          <div class="metric-item"><span class="metric-label">Prehodnost U</span><span class="metric-val" style="color:${meetsPures ? 'var(--success)' : 'var(--warning)'}">${res.uVal.toFixed(3)} W/m²K</span></div>
          <div class="metric-item"><span class="metric-label">Fazni zamik Φ (poletje)</span><span class="metric-val">${phiHours.toFixed(1)} ur (f=${res.decrementFactor.toFixed(2)})</span></div>
          <div class="metric-item"><span class="metric-label">Toplotna izguba</span><span class="metric-val" style="color:var(--primary)">${Math.round(res.qLoss)} W</span></div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <span class="badge ${meetsPures ? 'badge-ok' : 'badge-err'}">${meetsPures ? '✓ PURES-3 ok' : '✗ Nad PURES-3'}</span>
            <span class="badge ${meetsPassive ? 'badge-ok' : 'badge-info'}">${meetsPassive ? '🏆 Pasivni ok' : 'ℹ️ Pasivni: U ≤ ' + passiveLimit.toFixed(2)}</span>
            <span class="badge ${phiClass}">☀️ ${phiHours.toFixed(1)} h</span>
          </div>
        </div>
        <div class="dew-panel">
          <div class="dew-header">
            <strong>💧 Interaktivni Glaserjev diagram rosišča (Sd = ${res.sumSd.toFixed(2)} m | Tsi = ${res.Tsi.toFixed(1)} °C):</strong>
            <div>
              ${hasCond ? `<span class="badge badge-err">⚠ Kondenzacija v prerezu!</span>` : `<span class="badge badge-ok">✓ Brez kondenzacije</span>`}
              ${moldOk ? `<span class="badge badge-ok">✓ Brez nevarnosti plesni</span>` : `<span class="badge badge-err">⚠ Tveganje za plesen na površini!</span>`}
            </div>
          </div>
          <canvas id="canvas_${groupKey}_${elIdx}" class="glaser-canvas"></canvas>
        </div>
      </div>`;
  });

  html += `</div>`;
  document.getElementById('categoryContent').innerHTML = html;
  list.forEach((el, elIdx) => {
    const res = calcAssembly(el);
    drawGlaserCanvas(`canvas_${groupKey}_${elIdx}`, el, res);
    attachGlaserHover(`canvas_${groupKey}_${elIdx}`, el, res);
  });
}

function renderBomTab() {
  const wasteFactor = 1 + ((parseFloat(state.bomWastePct) || 5) / 100);
  const bomMap = {};

  ['walls', 'roofs', 'floors'].forEach(gKey => {
    (state[gKey] || []).forEach(el => {
      const area = parseFloat(el.area) || 0;
      (el.layers || []).forEach(l => {
        if (l.matId === 'zrak_prezr' || l.matId === 'zrak_mir' || l.matId === 'zrak_slabo_prezr') return;
        const d_cm = parseFloat(l.d) || 0;
        const key = `${l.matId}_${d_cm}`;
        if (!bomMap[key]) {
          bomMap[key] = { name: l.name, d_cm, netAreaM2: 0, netVolM3: 0, usedIn: [] };
        }
        const effArea = l.woodPct > 0 ? area * (1 - l.woodPct / 100) : area;
        bomMap[key].netAreaM2 += effArea;
        bomMap[key].netVolM3 += effArea * (d_cm / 100);
        if (!bomMap[key].usedIn.includes(el.name)) bomMap[key].usedIn.push(el.name);
      });
    });
  });

  const rows = Object.values(bomMap).map(item => `
    <tr>
      <td><strong>${item.name}</strong></td>
      <td>${item.d_cm} cm</td>
      <td style="font-size:0.72rem; color:var(--muted);">${item.usedIn.join(', ')}</td>
      <td>${item.netAreaM2.toFixed(1)} m²</td>
      <td><strong>${(item.netAreaM2 * wasteFactor).toFixed(1)} m²</strong></td>
      <td>${item.netVolM3.toFixed(2)} m³</td>
      <td><strong style="color:var(--primary)">${(item.netVolM3 * wasteFactor).toFixed(2)} m³</strong></td>
    </tr>`).join('');

  document.getElementById('categoryContent').innerHTML = `
    <div class="card">
      <div class="card-title">
        <span>📦 Avtomatski popis materiala za nakup in izvoz v Excel (.csv)</span>
        <div style="display:flex; align-items:center; gap:8px; font-size:0.8rem;">
          <button class="btn-success btn-sm" onclick="exportBomToCSV()">📥 Izvozi popis v Excel (.csv)</button>
          <span>Kalo (%):</span>
          <input type="number" step="1" min="0" max="30" style="width:55px; padding:4px;" value="${state.bomWastePct}" onchange="updateBomWaste(this.value)">
        </div>
      </div>
      <div class="table-wrap">
        <table class="layers-table">
          <thead>
            <tr>
              <th>Material</th><th>Debelina</th><th>Uporabljeno v sklopu</th>
              <th>Neto m²</th><th>Z odrezom (+${state.bomWastePct}%) m²</th>
              <th>Neto m³</th><th>Za naročilo m³</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

// Izvoz popisa materialov v Excel CSV
function exportBomToCSV() {
  const wasteFactor = 1 + ((parseFloat(state.bomWastePct) || 5) / 100);
  let csv = 'Material;Debelina (cm);Uporabljeno v sklopu;Neto m2;Z odrezom m2;Neto m3;Za narocilo m3\n';
  ['walls', 'roofs', 'floors'].forEach(gKey => {
    (state[gKey] || []).forEach(el => {
      const area = parseFloat(el.area) || 0;
      (el.layers || []).forEach(l => {
        if (l.matId.includes('zrak')) return;
        const effArea = l.woodPct > 0 ? area * (1 - l.woodPct / 100) : area;
        const netM2 = effArea.toFixed(2), totalM2 = (effArea * wasteFactor).toFixed(2);
        const netM3 = (effArea * (l.d / 100)).toFixed(3), totalM3 = (effArea * (l.d / 100) * wasteFactor).toFixed(3);
        csv += `"${l.name}";${l.d};"${el.name}";${netM2};${totalM2};${netM3};${totalM3}\n`;
      });
    });
  });
  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'popis-materiala-kalkulator-v10.2.csv'; a.click();
}

function renderMaterialsLibraryTab() {
  const allMats = getAllMaterials();
  const rowsHtml = allMats.map(m => {
    const isCustom = (state.customMaterials || []).some(cm => cm.id === m.id);
    const isMod = !!m.isModifiedBase;
    return `
      <tr style="${isCustom ? 'background:#10b9811a;' : (isMod ? 'background:#0284c71a;' : '')}">
        <td style="width:42px; text-align:center;"><input type="color" value="${m.color || '#94a3b8'}" style="width:28px; height:26px; padding:1px;" onchange="editExistingMaterial('${m.id}', 'color', this.value)"></td>
        <td><input type="text" value="${m.name}" onchange="editExistingMaterial('${m.id}', 'name', this.value)"></td>
        <td style="font-size:0.73rem; color:var(--muted);">${m.group}</td>
        <td style="width:80px;"><input type="number" step="0.5" min="0.01" value="${m.defD || 5}" onchange="editExistingMaterial('${m.id}', 'defD', this.value)"></td>
        <td style="width:92px;"><input type="number" step="0.001" min="0.005" value="${m.lambda}" onchange="editExistingMaterial('${m.id}', 'lambda', this.value)"></td>
        <td style="width:85px;"><input type="number" step="1" min="1" value="${m.mu}" onchange="editExistingMaterial('${m.id}', 'mu', this.value)"></td>
        <td style="width:85px;"><input type="number" step="10" min="1" value="${m.rho}" onchange="editExistingMaterial('${m.id}', 'rho', this.value)"></td>
        <td style="width:85px;"><input type="number" step="50" min="100" value="${m.c}" onchange="editExistingMaterial('${m.id}', 'c', this.value)"></td>
        <td style="width:120px;">
          ${isCustom ? `<button class="btn-danger btn-sm" onclick="deleteCustomMaterial('${m.id}')">✕ Izbriši</button>` : (isMod ? `<button class="btn-secondary btn-sm" onclick="resetSingleMaterialOverride('${m.id}')">↺ Ponastavi</button>` : `<span style="font-size:0.7rem; color:var(--muted);">Tovarniški</span>`)}
        </td>
      </tr>`;
  }).join('');

  document.getElementById('categoryContent').innerHTML = `
    <div class="card">
      <div class="card-title"><span>➕ Dodaj nov material v spisek</span><span class="badge badge-info">Skupaj: ${allMats.length} materialov</span></div>
      <div class="boundary-grid" style="margin-bottom:12px;">
        <div class="field" style="grid-column: span 2;"><label>Naziv materiala</label><input type="text" id="newMatName" placeholder="Vpiši ime materiala..."></div>
        <div class="field"><label>Skupina</label>
          <select id="newMatGroup">
            <option value="Moji materiali">⭐ Moji materiali</option>
            <option value="Toplotne izolacije">Toplotne izolacije</option>
            <option value="Strešne kritine in zračni kanali">Strešne kritine in zračni kanali</option>
            <option value="Zidaki in beton">Zidaki in beton</option>
            <option value="Ometi, malte in estrihi">Ometi, malte in estrihi</option>
            <option value="Les, suhomontaža in obloge">Les, suhomontaža in obloge</option>
            <option value="Folije in hidroizolacije">Folije in hidroizolacije</option>
          </select>
        </div>
        <div class="field"><label>Privzeta d (cm)</label><input type="number" id="newMatDefD" step="0.5" value="10"></div>
        <div class="field"><label>λ (W/mK)</label><input type="number" id="newMatLambda" step="0.001" value="0.035"></div>
        <div class="field"><label>Faktor μ (-)</label><input type="number" id="newMatMu" step="1" value="30"></div>
        <div class="field"><label>Gostota ρ (kg/m³)</label><input type="number" id="newMatRho" step="10" value="50"></div>
        <div class="field"><label>Spec. toplota c (J/kgK)</label><input type="number" id="newMatC" step="50" value="1400"></div>
        <div class="field"><label>Barva</label><input type="color" id="newMatColor" value="#0284c7" style="height:33px; padding:2px;"></div>
        <div class="field"><label>Vrsta sloja</label><select id="newMatVent"><option value="no">Običajen sloj</option><option value="yes">🌬️ Prezračevan zrak</option></select></div>
      </div>
      <button class="btn-success" onclick="addNewCustomMaterial()">➕ Dodaj material v spisek</button>
    </div>
    <div class="card">
      <div class="card-title"><span>✏️ Urejanje vseh materialov v knjižnici (${allMats.length})</span></div>
      <div class="table-wrap"><table class="layers-table"><thead><tr><th>Barva</th><th>Naziv materiala</th><th>Skupina</th><th>Privz. d</th><th>λ (W/mK)</th><th>μ</th><th>ρ (kg/m³)</th><th>c (J/kgK)</th><th>Dejanje</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>
    </div>`;
}

function renderWindowsTab() {
  const deltaT = Math.max(0, state.boundary.ti - state.boundary.te);
  let totalArea = 0, totalLoss = 0, totalSolar = 0;
  const rowsHtml = state.windows.map((w, idx) => {
    const area = (w.w * w.h * w.count) || 0, loss = area * w.uw * deltaT * (w.fx || 1);
    const orientObj = SOLAR_WINTER_IRR[w.orient] || SOLAR_WINTER_IRR.J;
    const gain = area * orientObj.kwhM2 * (parseFloat(w.g) || 0.5) * 0.70 * 0.75 * 0.85;
    totalArea += area; totalLoss += loss; totalSolar += gain;
    const orientOpts = Object.keys(SOLAR_WINTER_IRR).map(k => `<option value="${k}" ${w.orient === k ? 'selected' : ''}>${SOLAR_WINTER_IRR[k].label}</option>`).join('');
    return `<tr><td><input type="text" value="${w.name}" onchange="updateWindow(${idx}, 'name', this.value)"></td><td><select onchange="updateWindow(${idx}, 'orient', this.value)">${orientOpts}</select></td><td><input type="number" step="0.1" value="${w.w}" onchange="updateWindow(${idx}, 'w', this.value)"></td><td><input type="number" step="0.1" value="${w.h}" onchange="updateWindow(${idx}, 'h', this.value)"></td><td><input type="number" step="1" value="${w.count}" onchange="updateWindow(${idx}, 'count', this.value)"></td><td><strong>${area.toFixed(2)} m²</strong></td><td><input type="number" step="0.05" value="${w.uw}" onchange="updateWindow(${idx}, 'uw', this.value)"></td><td><input type="number" step="0.02" value="${w.g || 0.50}" onchange="updateWindow(${idx}, 'g', this.value)"></td><td><strong style="color:var(--primary)">${Math.round(loss)} W</strong></td><td><strong style="color:var(--success)">+${Math.round(gain)} kWh</strong></td><td><button class="btn-danger btn-sm" onclick="removeWindow(${idx})">✕</button></td></tr>`;
  }).join('');

  document.getElementById('categoryContent').innerHTML = `<div class="card"><div class="card-title"><span>🪟 Okna, steklene površine in solarni dobitki</span><button class="btn-primary btn-sm" onclick="addWindow()">+ Dodaj okna</button></div><div class="table-wrap"><table class="layers-table"><thead><tr><th>Opis oken</th><th style="width:155px;">Orientacija</th><th style="width:70px;">Širina</th><th style="width:70px;">Višina</th><th style="width:65px;">Kosov</th><th style="width:80px;">Površina</th><th style="width:80px;">Uw</th><th style="width:72px;">Faktor g</th><th style="width:85px;">Izguba</th><th style="width:95px;">Zimski dobitek</th><th style="width:42px;"></th></tr></thead><tbody>${rowsHtml}</tbody></table></div><div class="metrics-bar"><div class="metric-item"><span class="metric-label">Skupna površina oken</span><span class="metric-val">${totalArea.toFixed(2)} m²</span></div><div class="metric-item"><span class="metric-label">Transmisijska izguba oken</span><span class="metric-val" style="color:var(--primary)">${Math.round(totalLoss)} W</span></div><div class="metric-item"><span class="metric-label">Zimski solarni dobitki</span><span class="metric-val" style="color:var(--success)">+${Math.round(totalSolar)} kWh/leto</span></div></div></div>`;
}

function renderDoorsTab() {
  const deltaT = Math.max(0, state.boundary.ti - state.boundary.te);
  document.getElementById('categoryContent').innerHTML = `<div class="card"><div class="card-title"><span>🚪 Vrata in podstrešne stopnice</span><button class="btn-primary btn-sm" onclick="addDoor()">+ Dodaj vrata</button></div><table class="layers-table"><thead><tr><th>Opis vrat / odprtine</th><th style="width:110px;">Površina (m²)</th><th style="width:110px;">Ud (W/m²K)</th><th style="width:150px;">Faktor fx</th><th style="width:95px;">Izguba (W)</th><th style="width:50px;"></th></tr></thead><tbody>${state.doors.map((d, idx) => `<tr><td><input type="text" value="${d.name}" onchange="updateDoor(${idx}, 'name', this.value)"></td><td><input type="number" step="0.05" value="${d.area}" onchange="updateDoor(${idx}, 'area', this.value)"></td><td><input type="number" step="0.05" value="${d.ud}" onchange="updateDoor(${idx}, 'ud', this.value)"></td><td><select onchange="updateDoor(${idx}, 'fx', this.value)"><option value="1" ${d.fx == 1 ? 'selected' : ''}>Zunanja (1.0)</option><option value="0.8" ${d.fx == 0.8 ? 'selected' : ''}>Podstrešje (0.8)</option><option value="0.5" ${d.fx == 0.5 ? 'selected' : ''}>Klet/garaža (0.5)</option></select></td><td><strong style="color:var(--primary)">${Math.round((d.area || 0) * (d.ud || 0) * deltaT * (d.fx || 1))} W</strong></td><td><button class="btn-danger btn-sm" onclick="removeDoor(${idx})">✕</button></td></tr>`).join('')}</tbody></table></div>`;
}

// 1. TOPLOTNI MOSTOVI Z MOŽNOSTJO VKLOPA IN IZKLOPA
function renderBridgesTab() {
  if (state.bridges.enabled === undefined) state.bridges.enabled = true;
  const isEnabled = !!state.bridges.enabled;
  const deltaT = Math.max(0, state.boundary.ti - state.boundary.te);
  const psiOptions = PRESET_PSI_BRIDGES.map(p => `<option value="${p.psi}">${p.name} (Ψ = ${p.psi} W/mK)</option>`).join('');

  document.getElementById('categoryContent').innerHTML = `
    <div class="card">
      <div class="card-title">
        <span>📐 Linijski toplotni mostovi in Ψ knjižnica po standardih</span>
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <span class="badge ${isEnabled ? 'badge-ok' : 'badge-warn'}">${isEnabled ? 'Vključeno v izračun' : 'Izklopljeno (0 W)'}</span>
          <button class="btn-primary btn-sm" onclick="addBridge()">+ Dodaj linijski most</button>
        </div>
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-weight:700; font-size:0.86rem; cursor:pointer;">
          <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleBridgesEnabled(this.checked)">
          Vključi toplotne mostove v skupni izračun hiše
        </label>
      </div>
      <div style="${!isEnabled ? 'opacity:0.45; pointer-events:none;' : ''}">
        <div style="margin-bottom:14px; display:flex; align-items:center; gap:12px; background:var(--box); padding:10px; border-radius:8px; border:1px solid var(--border);">
          <label style="font-size:0.84rem; font-weight:600;"><input type="checkbox" ${state.bridges.useFlatRate ? 'checked' : ''} onchange="toggleBridgeMode(this.checked)"> Uporabi pavšalni pribitek ΔU_tb na celoten ovoj stavbe</label>
          ${state.bridges.useFlatRate ? `<input type="number" step="0.01" style="width:90px; padding:5px;" value="${state.bridges.flatDeltaU}" onchange="updateFlatBridge(this.value)"> W/m²K` : ''}
        </div>
        ${!state.bridges.useFlatRate ? `
        <div style="margin-bottom:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap; background:var(--primary-light); padding:10px; border-radius:8px;">
          <span style="font-size:0.78rem; font-weight:700; color:var(--primary-dark);">📚 Vstavi iz Ψ knjižnice standardov:</span>
          <select id="presetPsiSelect" style="max-width:320px; padding:5px;">${psiOptions}</select>
          <button class="btn-primary btn-sm" onclick="addPresetBridgeFromSelect()">+ Dodaj v izračun</button>
        </div>
        <table class="layers-table">
          <thead><tr><th>Opis toplotnega mostu</th><th style="width:110px;">Dolžina L (m)</th><th style="width:120px;">Ψ (W/mK)</th><th style="width:100px;">Izguba (W)</th><th style="width:50px;"></th></tr></thead>
          <tbody>
            ${state.bridges.items.map((b, idx) => `
              <tr>
                <td><input type="text" value="${b.name}" onchange="updateBridge(${idx}, 'name', this.value)"></td>
                <td><input type="number" step="1" value="${b.length}" onchange="updateBridge(${idx}, 'length', this.value)"></td>
                <td><input type="number" step="0.01" value="${b.psi}" onchange="updateBridge(${idx}, 'psi', this.value)"></td>
                <td><strong style="color:var(--primary)">${Math.round((b.length || 0) * (b.psi || 0) * deltaT * (b.fx || 1))} W</strong></td>
                <td><button class="btn-danger btn-sm" onclick="removeBridge(${idx})">✕</button></td>
              </tr>`).join('')}
          </tbody>
        </table>` : ''}
      </div>
    </div>`;
}

function toggleBridgesEnabled(checked) {
  state.bridges.enabled = !!checked;
  renderAll();
}

function addPresetBridgeFromSelect() {
  const sel = document.getElementById('presetPsiSelect');
  if (!sel) return;
  const opt = sel.options[sel.selectedIndex];
  const psiVal = parseFloat(opt.value) || 0.10;
  const nameText = opt.text.split(' (Ψ')[0];
  state.bridges.items.push({ id: 'b_' + Date.now(), name: nameText, length: 20, psi: psiVal, fx: 1.0 });
  renderAll();
}

// 2. PREZRAČEVANJE Z OBARVANIMI GUMBI IN IZBIRO NAPRAV (Zehnder, Paul, Helios...)
function renderVentilationTab(totals) {
  const v = state.ventilation;
  const vol = (parseFloat(v.volumeArea) || 0) * (parseFloat(v.ceilingHeight) || 2.5);
  const flowM3h = vol * (parseFloat(v.airChanges) || 0.4), hours = parseFloat(state.boundary.hours) || 1900;
  const natW = totals.ventNaturalQ, natKwh = (natW / 1000) * hours;
  const recEff = Math.max(0, parseFloat(v.heatRecoveryEff) || 0), recW = natW * (1 - recEff / 100), recKwh = (recW / 1000) * hours;
  const savedEur = (natKwh - recKwh) * calcFuelAnnualCost(state.fuels[1] || state.fuels[0], 1, 0).costPerEffectiveKwh;

  const selUnitId = v.selectedUnitId || 'zehnder_q350';
  const curUnit = HRV_DEVICES_DB.find(u => u.id === selUnitId) || HRV_DEVICES_DB[0];
  const unitOpts = HRV_DEVICES_DB.map(u => `<option value="${u.id}" ${u.id === curUnit.id ? 'selected' : ''}>${u.name} (η = ${u.eff} %, max ${u.flow} m³/h)</option>`).join('');
  const fanElKwh = recEff > 0 ? Math.round((flowM3h * curUnit.spi * 8760) / 1000) : 0;

  document.getElementById('categoryContent').innerHTML = `
    <div class="card">
      <div class="card-title">
        <span>💨 Prezračevalne izgube in izbira rekuperatorja (Zehnder, Paul, Helios ...)</span>
        <span class="badge badge-ok">Pretok zraka: ${Math.round(flowM3h)} m³/h</span>
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-weight:700; font-size:0.86rem;"><input type="checkbox" ${v.enabled ? 'checked' : ''} onchange="updateVent('enabled', this.checked)"> Vključi prezračevalne izgube v skupni izračun hiše</label>
      </div>

      <div style="margin-bottom:14px; background:var(--primary-light); border:1px solid #bae6fd; padding:12px; border-radius:8px;">
        <div style="font-size:0.8rem; font-weight:800; color:var(--primary-dark); margin-bottom:8px;">🏢 Izberi model naprave centralnega prezračevanja (PHI certificirani podatki):</div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <select style="flex:1; min-width:240px; padding:6px 8px; border-radius:6px; border:1px solid var(--border); background:var(--card); color:var(--text); font-weight:600;" onchange="selectVentUnit(this.value)">
            ${unitOpts}
          </select>
          <button class="btn-primary btn-sm" onclick="applyVentUnit('${curUnit.id}')">Prenesi izkoristek (${curUnit.eff} %)</button>
        </div>
        <div style="display:flex; gap:14px; flex-wrap:wrap; margin-top:8px; font-size:0.76rem; color:var(--text);">
          <span>🔹 <strong>Izmenjevalnik:</strong> ${curUnit.type}</span>
          <span>🔹 <strong>Izkoristek (η):</strong> <strong style="color:var(--success)">${curUnit.eff} %</strong></span>
          <span>🔹 <strong>Maks. pretok:</strong> ${curUnit.flow} m³/h (za ${curUnit.area})</span>
          <span>🔹 <strong>Poraba ventilatorjev (SPI):</strong> ${curUnit.spi} Wh/m³ (~${fanElKwh} kWh el./leto)</span>
        </div>
      </div>

      <div class="boundary-grid">
        <div class="field"><label>Neto tlorisna površina (m²)</label><input type="number" value="${v.volumeArea}" onchange="updateVent('volumeArea', this.value)"></div>
        <div class="field"><label>Povprečna višina stropov (m)</label><input type="number" step="0.05" value="${v.ceilingHeight}" onchange="updateVent('ceilingHeight', this.value)"></div>
        <div class="field"><label>Število izmenjav zraka n (1/h)</label><input type="number" step="0.05" value="${v.airChanges}" onchange="updateVent('airChanges', this.value)"></div>
        <div class="field"><label>Izkoristek rekuperacije (%)</label><input type="number" min="0" max="95" step="1" value="${v.heatRecoveryEff}" onchange="updateVent('heatRecoveryEff', this.value)"></div>
      </div>
      <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
        <button class="${recEff === 0 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateVent('heatRecoveryEff', 0)">Odpiranje oken (0 %)</button>
        <button class="${recEff === 85 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateVent('heatRecoveryEff', 85)">Centralna rekuperacija (85 %)</button>
        <button class="${recEff === 88 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateVent('heatRecoveryEff', 88)">Helios / Pichler (88 %)</button>
        <button class="${recEff === 90 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateVent('heatRecoveryEff', 90)">Zehnder Q350 / Entalpijska (90 %)</button>
        <button class="${recEff === 93 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateVent('heatRecoveryEff', 93)">Paul Novus 300 (93 %)</button>
      </div>
      <div class="metrics-bar" style="margin-top:14px;">
        <div class="metric-item"><span class="metric-label">Brez rekuperacije</span><span class="metric-val" style="color:var(--danger)">${Math.round(natW)} W (${Math.round(natKwh)} kWh)</span></div>
        <div class="metric-item"><span class="metric-label">Z rekuperacijo (${recEff} %)</span><span class="metric-val" style="color:var(--success)">${Math.round(recW)} W (${Math.round(recKwh)} kWh)</span></div>
        <div class="metric-item"><span class="metric-label">Prihranek moči in toplote</span><span class="metric-val" style="color:var(--primary)">-${Math.round(natW - recW)} W (-${Math.round(natKwh - recKwh)} kWh)</span></div>
        <div class="metric-item"><span class="metric-label">Letni prihranek</span><span class="metric-val" style="color:var(--success)">~${Math.round(savedEur)} €/leto</span></div>
      </div>
    </div>`;
}

function selectVentUnit(unitId) {
  state.ventilation.selectedUnitId = unitId;
  const u = HRV_DEVICES_DB.find(x => x.id === unitId);
  if (u) state.ventilation.heatRecoveryEff = u.eff;
  renderAll();
}

function applyVentUnit(unitId) {
  const u = HRV_DEVICES_DB.find(x => x.id === unitId);
  if (u) {
    state.ventilation.selectedUnitId = unitId;
    state.ventilation.heatRecoveryEff = u.eff;
    state.ventilation.enabled = true;
    renderAll();
  }
}

function renderDhwAndWellTab(totals) {
  const dw = state.dhwAndWell, info = totals.dhwWell;
  const elPrice = state.fuels[0] ? (parseFloat(state.fuels[0].price) || 0.17) : 0.17;
  document.getElementById('categoryContent').innerHTML = `
    <div class="card">
      <div class="card-title"><span>🚿 Priprava sanitarne tople vode (STV) in izbira vira</span><span class="badge ${dw.dhwEnabled ? 'badge-ok' : 'badge-warn'}">${dw.dhwEnabled ? 'Vključeno' : 'Izklopljeno'}</span></div>
      <div style="margin-bottom:12px;"><label style="font-weight:700; font-size:0.85rem;"><input type="checkbox" ${dw.dhwEnabled ? 'checked' : ''} onchange="updateDhw('dhwEnabled', this.checked)"> Vključi pripravo STV v letno porabo in stroške</label></div>
      <div class="boundary-grid" style="margin-bottom:12px;">
        <div class="field" style="grid-column: span 2;"><label>Način ogrevanja sanitarne vode</label>
          <select onchange="updateDhw('dhwSourceMode', this.value)">
            <option value="main" ${dw.dhwSourceMode === 'main' ? 'selected' : ''}>1. Glavni vir ogrevanja (TČ z nižjim COP za 55 °C ali kotel)</option>
            <option value="sanitary_hp" ${dw.dhwSourceMode === 'sanitary_hp' ? 'selected' : ''}>2. Ločena sanitarna TČ (bojler s toplotno črpalko)</option>
            <option value="el_boiler" ${dw.dhwSourceMode === 'el_boiler' ? 'selected' : ''}>3. Klasični električni bojler z grelcem (COP = 1.0)</option>
            <option value="combo" ${dw.dhwSourceMode === 'combo' ? 'selected' : ''}>4. Kombinirano (60 % pozimi glavni vir, 40 % poleti el. bojler)</option>
          </select>
        </div>
        <div class="field"><label>COP glavne TČ za bojler (55 °C)</label><input type="number" step="0.1" min="1.5" value="${dw.mainHpDhwCop}" onchange="updateDhw('mainHpDhwCop', this.value)"></div>
        <div class="field"><label>SCOP ločene sanitarne TČ</label><input type="number" step="0.1" min="1.5" value="${dw.sanitaryHpCop}" onchange="updateDhw('sanitaryHpCop', this.value)"></div>
      </div>
      <div class="boundary-grid">
        <div class="field"><label>Število oseb</label><input type="number" min="1" max="15" value="${dw.persons}" onchange="updateDhw('persons', this.value)"></div>
        <div class="field"><label>Poraba (L / osebo na dan)</label><input type="number" min="15" max="120" step="5" value="${dw.litersPerPerson}" onchange="updateDhw('litersPerPerson', this.value)"></div>
        <div class="field"><label>Temp. hladne vode (°C)</label><input type="number" step="1" value="${dw.tempCold}" onchange="updateDhw('tempCold', this.value)"></div>
        <div class="field"><label>Temp. v bojlerju (°C)</label><input type="number" step="1" value="${dw.tempHot}" onchange="updateDhw('tempHot', this.value)"></div>
        <div class="field"><label>Izgube bojlerja in cevi (%)</label><input type="number" min="0" max="50" step="5" value="${dw.tankLossPct}" onchange="updateDhw('tankLossPct', this.value)"></div>
      </div>
      <div class="metrics-bar">
        <div class="metric-item"><span class="metric-label">Dnevna količina tople vode</span><span class="metric-val">${dw.persons * dw.litersPerPerson} L/dan</span></div>
        <div class="metric-item"><span class="metric-label">Dnevna toplota za STV</span><span class="metric-val">${info.dailyDhwKwh.toFixed(1)} kWh/dan</span></div>
        <div class="metric-item"><span class="metric-label">Letna potreba po toploti za STV</span><span class="metric-val" style="color:var(--primary)">${Math.round(info.annualDhwKwh).toLocaleString('sl-SI')} kWh/leto</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span>💧 Vrtina TČ voda–voda: Potopna črpalka, pretok podtalnice in poletno hlajenje</span><span class="badge badge-ok">Pretok: ${info.requiredWaterFlowM3h.toFixed(2)} m³/h (${info.requiredWaterFlowLmin.toFixed(1)} L/min)</span></div>
      <div style="margin-bottom:10px;"><label style="font-weight:700; font-size:0.84rem;"><input type="checkbox" ${dw.wellPumpAutoSync ? 'checked' : ''} onchange="updateDhw('wellPumpAutoSync', this.checked)"> Samodejno prenesi sistemski SCOP (${info.systemScop.toFixed(2)}) v tabelo stroškov za TČ voda–voda</label></div>
      <div class="boundary-grid">
        <div class="field"><label>Grelna moč TČ voda–voda (kW)</label><input type="number" step="0.5" min="3" value="${dw.hpThermalPowerKw}" onchange="updateDhw('hpThermalPowerKw', this.value)"></div>
        <div class="field"><label>Tovarniški COP same TČ</label><input type="number" step="0.1" min="2" value="${dw.hpMachineCop}" onchange="updateDhw('hpMachineCop', this.value)"></div>
        <div class="field"><label>Moč potopne črpalke v vrtini (W)</label><input type="number" step="25" min="50" value="${dw.wellPumpWatts}" onchange="updateDhw('wellPumpWatts', this.value)"></div>
        <div class="field"><label>Ohlajanje podtalnice ΔT (K)</label><input type="number" step="0.5" min="2" max="6" value="${dw.wellWaterDeltaT}" onchange="updateDhw('wellWaterDeltaT', this.value)"></div>
        <div class="field"><label>Poletna notranja temp. (°C)</label><input type="number" step="0.5" value="${dw.summerIndoorTemp}" onchange="updateDhw('summerIndoorTemp', this.value)"></div>
        <div class="field"><label>Poletna notranja vlaga (%)</label><input type="number" step="5" value="${dw.summerIndoorRh}" onchange="updateDhw('summerIndoorRh', this.value)"></div>
      </div>
      <div class="metrics-bar">
        <div class="metric-item"><span class="metric-label">Potreben pretok podtalnice</span><span class="metric-val" style="color:var(--primary)">${info.requiredWaterFlowM3h.toFixed(2)} m³/h (${info.requiredWaterFlowLmin.toFixed(1)} L/min)</span></div>
        <div class="metric-item"><span class="metric-label">Poraba potopne črpalke (${Math.round(info.runHours)} h)</span><span class="metric-val" style="color:var(--warning)">+${Math.round(info.wellPumpElKwh)} kWh/leto (${Math.round(info.wellPumpElKwh * elPrice)} €)</span></div>
        <div class="metric-item"><span class="metric-label">Dejanski sistemski SCOP</span><span class="metric-val" style="color:var(--success)">${info.systemScop.toFixed(2)}</span></div>
        <div class="metric-item"><span class="metric-label">Rosišče na tleh poleti</span><span class="metric-val" style="color:var(--danger)">${info.floorSummerDewPoint.toFixed(1)} °C</span></div>
        <div class="metric-item"><span class="metric-label">Min. varna temp. za talno hlajenje</span><span class="metric-val" style="color:var(--success)">≥ ${info.minSafeCoolingWaterTemp.toFixed(1)} °C</span></div>
      </div>
    </div>`;
}

function renderHpAndFusesTab(totals) {
  const hp = state.hpSettings, deltaT = Math.max(1, state.boundary.ti - state.boundary.te);
  const fuseAmps = parseFloat(hp.fuseAmps) || 20, maxFuseKw = (3 * 230 * fuseAmps) / 1000;
  const totalHpPeakElKw = totals.effectiveHpElAtTeKw + (parseFloat(hp.backupHeaterKw) || 0);
  const totalHousePeakKw = totalHpPeakElKw + (parseFloat(hp.baseHousePeakKw) || 3.5);
  const fuseOk = totalHousePeakKw <= maxFuseKw;
  const thermalReserveKw = (parseFloat(hp.maxThermalKwAtPeak) || 8.5) - totals.totalKw;
  const cyclingOutdoorTemp = state.boundary.ti - ((parseFloat(hp.minModulationKw) || 2.2) / Math.max(0.1, totals.totalKw)) * deltaT;

  document.getElementById('categoryContent').innerHTML = `
    <div class="card">
      <div class="card-title"><span>⚙️ Nastavitve moči Toplotne črpalke in El. odjem pri ${state.boundary.te} °C</span><span class="badge ${hp.peakElMode === 'manual' ? 'badge-info' : 'badge-ok'}">${hp.peakElMode === 'manual' ? '✍️ Ročno nastavljen el. odjem' : '🔄 Avtomatski izračun'}</span></div>
      <div class="boundary-grid" style="margin-bottom:14px;">
        <div class="field"><label>Tip toplotne črpalke</label><select onchange="updateHpSetting('selectedHpFuelId', this.value)"><option value="tc_voda" ${hp.selectedHpFuelId === 'tc_voda' ? 'selected' : ''}>TČ voda–voda</option><option value="tc_zrak" ${hp.selectedHpFuelId === 'tc_zrak' ? 'selected' : ''}>TČ zrak–voda</option></select></div>
        <div class="field"><label>Način določanja el. odjema pri ${state.boundary.te} °C</label><select onchange="updateHpSetting('peakElMode', this.value)"><option value="manual" ${hp.peakElMode === 'manual' ? 'selected' : ''}>Ročni vnos moči (kW el.)</option><option value="auto" ${hp.peakElMode === 'auto' ? 'selected' : ''}>Avtomatsko iz izgub (${totals.autoHpElAtTeKw.toFixed(2)} kW)</option></select></div>
        <div class="field" style="background:var(--primary-light); padding:5px 7px; border-radius:6px;"><label style="color:var(--primary-dark); font-weight:800;">⚡ El. odjem TČ pri ${state.boundary.te} °C (kW el.)</label><input type="number" step="0.05" min="0.2" value="${hp.peakElMode === 'manual' ? hp.manualPeakElKw : totals.autoHpElAtTeKw.toFixed(2)}" onchange="setManualHpPeakEl(this.value)"></div>
        <div class="field"><label>Maks. el. moč kompresorja (kW el.)</label><input type="number" step="0.1" min="0.5" value="${hp.maxCompressorElKw}" onchange="updateHpSetting('maxCompressorElKw', this.value)"></div>
      </div>
      <div class="boundary-grid">
        <div class="field"><label>Nazivna grelna moč TČ (kW)</label><input type="number" step="0.5" value="${hp.nominalThermalKw}" onchange="updateHpSetting('nominalThermalKw', this.value)"></div>
        <div class="field"><label>Maks. grelna moč pri ${state.boundary.te} °C (kW)</label><input type="number" step="0.5" value="${hp.maxThermalKwAtPeak}" onchange="updateHpSetting('maxThermalKwAtPeak', this.value)"></div>
        <div class="field"><label>Min. modulacija TČ (kW)</label><input type="number" step="0.2" value="${hp.minModulationKw}" onchange="updateHpSetting('minModulationKw', this.value)"></div>
        <div class="field"><label>COP pri ${state.boundary.te} °C</label><input type="number" step="0.1" value="${hp.copAtDesignTe}" onchange="updateHpSetting('copAtDesignTe', this.value)"></div>
        <div class="field"><label>Pomožne črpalke (potopna + obtočna, W)</label><input type="number" step="10" value="${hp.auxPumpsWatts}" onchange="updateHpSetting('auxPumpsWatts', this.value)"></div>
        <div class="field"><label>Bivalentna točka (°C)</label><input type="number" step="1" value="${hp.bivalentTemp}" onchange="updateHpSetting('bivalentTemp', this.value)"></div>
        <div class="field"><label>Moč el. grelca pri ${state.boundary.te} °C (kW)</label><input type="number" step="0.5" min="0" value="${hp.backupHeaterKw}" onchange="updateHpSetting('backupHeaterKw', this.value)"></div>
      </div>
      <div class="metrics-bar" style="margin-top:14px;">
        <div class="metric-item"><span class="metric-label">Potrebna moč hiše</span><span class="metric-val">${totals.totalKw.toFixed(2)} kW toplote</span></div>
        <div class="metric-item"><span class="metric-label">Rezerva grelne moči TČ</span><span class="metric-val" style="color:${thermalReserveKw >= 0 ? 'var(--success)' : 'var(--danger)'}">${thermalReserveKw >= 0 ? '+' + thermalReserveKw.toFixed(2) + ' kW' : thermalReserveKw.toFixed(2) + ' kW'}</span></div>
        <div class="metric-item"><span class="metric-label">Meja taktiziranja</span><span class="metric-val" style="color:var(--primary)">nad +${cyclingOutdoorTemp.toFixed(1)} °C zunaj</span></div>
        <div class="metric-item"><span class="metric-label">Skupni el. odjem TČ + grelci</span><span class="metric-val" style="color:var(--primary)">${totalHpPeakElKw.toFixed(2)} kW el.</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span>⚡ Kontrola glavnih varovalk (3×${fuseAmps} A) in Časovni blok 1</span><span class="badge ${fuseOk ? 'badge-ok' : 'badge-err'}">${fuseOk ? '✓ Varovalke zadoščajo' : '⚠ Preobremenitev!'}</span></div>
      <div class="boundary-grid">
        <div class="field"><label>Glavne varovalke hiše</label><select onchange="updateHpSetting('fuseAmps', this.value)"><option value="16" ${hp.fuseAmps == 16 ? 'selected' : ''}>3×16 A (11.0 kW)</option><option value="20" ${hp.fuseAmps == 20 ? 'selected' : ''}>3×20 A (13.8 kW)</option><option value="25" ${hp.fuseAmps == 25 ? 'selected' : ''}>3×25 A (17.2 kW)</option><option value="35" ${hp.fuseAmps == 35 ? 'selected' : ''}>3×35 A (24.1 kW)</option></select></div>
        <div class="field"><label>Ostali sočasni porabniki v hiši (kW)</label><input type="number" step="0.5" value="${hp.baseHousePeakKw}" onchange="updateHpSetting('baseHousePeakKw', this.value)"></div>
      </div>
      <div class="metrics-bar">
        <div class="metric-item"><span class="metric-label">Maks. moč varovalk</span><span class="metric-val">${maxFuseKw.toFixed(1)} kW</span></div>
        <div class="metric-item"><span class="metric-label">Skupna konica (TČ + hiša)</span><span class="metric-val" style="color:${fuseOk ? 'var(--success)' : 'var(--danger)'}">${totalHousePeakKw.toFixed(2)} kW (${Math.round(totalHousePeakKw/maxFuseKw*100)} %)</span></div>
        <div class="metric-item"><span class="metric-label">Rezerva na varovalkah</span><span class="metric-val">${(maxFuseKw - totalHousePeakKw).toFixed(2)} kW</span></div>
        <div class="metric-item"><span class="metric-label">Priporočena moč (Blok 1)</span><span class="metric-val" style="color:var(--success)">${Math.max(4.2, (totalHpPeakElKw + 2.4)).toFixed(1)} kW</span></div>
      </div>
    </div>`;
}

// 3. SIMULACIJA SONČNE ELEKTRARNE Z AKTIVNO OBARVANO BATERIJO
function renderMeterAndSolarTab(totals) {
  const md = state.meterData, sg = state.solarAndGrid, sim = totals.solarBatSim;
  const modelHpElKwh = totals.modelHpElKwh, measuredHpEl = parseFloat(md.measuredHpElKwh) || 0;
  const diffHpEl = modelHpElKwh - measuredHpEl, diffPct = measuredHpEl > 0 ? ((diffHpEl / measuredHpEl) * 100) : 0;
  const curBat = parseFloat(sg.batteryCapKwh) || 0;

  const monthRows = sim.months.map((m, idx) => `
    <tr>
      <td><strong>${m.m}</strong></td>
      <td><input type="number" step="10" style="width:78px;" value="${Math.round(m.meterM)}" onchange="updateMonthlyMeter(${idx}, this.value)"> kWh</td>
      <td style="color:var(--muted)">${Math.round(m.hpModelM)} kWh</td>
      <td style="color:var(--success)"><strong>${Math.round(m.pvM)} kWh</strong></td>
      <td>${Math.round(m.directM)} kWh</td>
      <td style="color:var(--primary)"><strong>+${Math.round(m.batM)} kWh</strong></td>
      <td style="color:${m.gridWithBatM > 50 ? 'var(--danger)' : 'var(--text)'}"><strong>${Math.round(m.gridWithBatM)} kWh</strong></td>
      <td style="color:var(--muted)">${Math.round(m.exportWithBatM)} kWh</td>
      <td><span class="badge ${m.selfSuffPct >= 75 ? 'badge-ok' : (m.selfSuffPct >= 35 ? 'badge-info' : 'badge-warn')}">${m.selfSuffPct.toFixed(0)} % (brez bat.: ${m.selfSuffNoBatPct.toFixed(0)} %)</span></td>
    </tr>`).join('');

  document.getElementById('categoryContent').innerHTML = `
    <div class="card">
      <div class="card-title">
        <span>📟 Podatki iz števca elektrike (Shelly Pro 3EM / Moj Elektro) in kalibracija</span>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="btn-primary btn-sm" onclick="document.getElementById('csvMeterInput').click()">📥 Uvozi CSV iz števca</button>
          <input type="file" id="csvMeterInput" style="display:none" accept=".csv,.txt" onchange="importMeterCSV(event)">
          <button class="btn-success btn-sm" onclick="calibrateModelToMeter()">🎯 Kalibriraj ure ogrevanja na števec</button>
        </div>
      </div>
      <div class="boundary-grid">
        <div class="field"><label>Skupna letna poraba (kWh)</label><input type="number" step="50" value="${md.totalMeterKwh}" onchange="updateMeterField('totalMeterKwh', this.value)"></div>
        <div class="field"><label>Visoka tarifa VT (kWh)</label><input type="number" step="20" value="${md.vtKwh}" onchange="updateMeterField('vtKwh', this.value)"></div>
        <div class="field"><label>Mala tarifa MT (kWh)</label><input type="number" step="20" value="${md.mtKwh}" onchange="updateMeterField('mtKwh', this.value)"></div>
        <div class="field" style="background:var(--primary-light); padding:4px 6px; border-radius:6px;"><label style="color:var(--primary-dark); font-weight:800;">Izmerjena TČ (kWh el.)</label><input type="number" step="25" value="${md.measuredHpElKwh}" onchange="updateMeterField('measuredHpElKwh', this.value)"></div>
        <div class="field"><label>Klima / hlajenje (kWh)</label><input type="number" step="25" value="${md.measuredAcElKwh}" onchange="updateMeterField('measuredAcElKwh', this.value)"></div>
        <div class="field"><label>Gospodinjstvo (kWh)</label><input type="number" step="25" value="${md.measuredHouseholdKwh}" onchange="updateMeterField('measuredHouseholdKwh', this.value)"></div>
        <div class="field"><label>Letni strošek elektrike (€)</label><input type="number" step="10" value="${md.annualBillEur}" onchange="updateMeterField('annualBillEur', this.value)"></div>
      </div>
      <div class="metrics-bar" style="margin-top:11px;">
        <div class="metric-item"><span class="metric-label">Model TČ</span><span class="metric-val" style="color:var(--primary)">${Math.round(modelHpElKwh)} kWh el.</span></div>
        <div class="metric-item"><span class="metric-label">Števec TČ</span><span class="metric-val">${Math.round(measuredHpEl)} kWh el.</span></div>
        <div class="metric-item"><span class="metric-label">Odstopanje</span><span class="metric-val" style="color:${Math.abs(diffPct) <= 10 ? 'var(--success)' : 'var(--warning)'}">${diffHpEl > 0 ? '+' : ''}${Math.round(diffHpEl)} kWh (${diffPct.toFixed(1)} %)</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span>🔋 Simulacija Sončne elektrarne in Baterijskega hranilnika (brez net-meteringa)</span><span class="badge badge-ok">Samooskrba: ${sim.selfSuffWithBatAnnualPct.toFixed(1)} % (brez bat.: ${sim.selfSuffNoBatAnnualPct.toFixed(1)} %)</span></div>
      <div style="margin-bottom:11px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <span style="font-size:0.78rem; font-weight:700; color:var(--muted);">Hitro izberi baterijo:</span>
          <button class="${curBat === 0 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateSolarGrid('batteryCapKwh', 0)">0 kWh</button>
          <button class="${curBat === 5 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateSolarGrid('batteryCapKwh', 5)">5 kWh</button>
          <button class="${curBat === 10 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateSolarGrid('batteryCapKwh', 10)">10 kWh</button>
          <button class="${curBat === 15 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateSolarGrid('batteryCapKwh', 15)">15 kWh</button>
          <button class="${curBat === 20 ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="updateSolarGrid('batteryCapKwh', 20)">20 kWh</button>
        </div>
        <div style="font-size:0.78rem;">
          <strong>Vir porabe:</strong>
          <select style="padding:4px 8px; border-radius:6px; border:1px solid var(--border);" onchange="updateSolarGrid('simLoadSource', this.value)">
            <option value="meter" ${sg.simLoadSource === 'meter' ? 'selected' : ''}>Dejanska poraba s števca (${Math.round(sim.sumLoad)} kWh)</option>
            <option value="model" ${sg.simLoadSource === 'model' ? 'selected' : ''}>Dinamični model hiše</option>
          </select>
        </div>
      </div>
      <div class="boundary-grid" style="margin-bottom:12px;">
        <div class="field"><label>Moč SE (kWp)</label><input type="number" step="0.5" value="${sg.pvKwp}" onchange="updateSolarGrid('pvKwp', this.value)"></div>
        <div class="field"><label>Izplen SE (kWh/kWp)</label><input type="number" step="50" value="${sg.specificYield}" onchange="updateSolarGrid('specificYield', this.value)"></div>
        <div class="field" style="background:var(--success-bg); padding:4px 6px; border-radius:6px;"><label style="color:var(--success); font-weight:800;">🔋 Kapaciteta baterije (kWh)</label><input type="number" step="1" min="0" value="${sg.batteryCapKwh}" onchange="updateSolarGrid('batteryCapKwh', this.value)"></div>
        <div class="field"><label>DoD praznjenje (%)</label><input type="number" step="5" value="${sg.batteryDodPct}" onchange="updateSolarGrid('batteryDodPct', this.value)"></div>
        <div class="field"><label>Izkoristek baterije (%)</label><input type="number" step="2" value="${sg.batteryEffPct}" onchange="updateSolarGrid('batteryEffPct', this.value)"></div>
        <div class="field"><label>Direktna dnevna poraba (%)</label><input type="number" step="2" value="${sg.directSelfConsPct}" onchange="updateSolarGrid('directSelfConsPct', this.value)"></div>
        <div class="field"><label>Oddaja viškov</label><select onchange="updateSolarGrid('exportMode', this.value)"><option value="sell" ${sg.exportMode === 'sell' ? 'selected' : ''}>Odkup viškov</option><option value="zero" ${sg.exportMode === 'zero' ? 'selected' : ''}>Zero-export (0 €)</option></select></div>
        <div class="field"><label>Odkup viškov (€/kWh)</label><input type="number" step="0.005" value="${sg.exportPriceEur}" onchange="updateSolarGrid('exportPriceEur', this.value)"></div>
        <div class="field"><label>Cena iz omrežja (€/kWh)</label><input type="number" step="0.005" value="${sg.gridImportPriceEur}" onchange="updateSolarGrid('gridImportPriceEur', this.value)"></div>
        <div class="field"><label>Cena baterije (€)</label><input type="number" step="250" value="${sg.batteryInvestEur}" onchange="updateSolarGrid('batteryInvestEur', this.value)"></div>
      </div>
      <canvas id="solarBatChartCanvas" class="solar-canvas" style="margin-bottom:10px; cursor:default;"></canvas>
      <div class="table-wrap"><table class="layers-table"><thead><tr><th>Mesec</th><th>Poraba hiše</th><th>TČ (model)</th><th>Proizv. SE</th><th>Direktno</th><th>Iz baterije</th><th>Dokup omrežje</th><th>Višek</th><th>Samooskrba</th></tr></thead><tbody>${monthRows}</tbody></table></div>
      <div class="metrics-bar">
        <div class="metric-item"><span class="metric-label">Proizvodnja SE / Poraba</span><span class="metric-val">${Math.round(sim.sumPv)} / ${Math.round(sim.sumLoad)} kWh</span></div>
        <div class="metric-item"><span class="metric-label">Direktno + Iz baterije</span><span class="metric-val" style="color:var(--success)">${Math.round(sim.sumDirect)} + ${Math.round(sim.sumBatDischarged)} kWh</span></div>
        <div class="metric-item"><span class="metric-label">Preostali dokup iz omrežja</span><span class="metric-val" style="color:var(--danger)">${Math.round(sim.sumGridWithBat)} kWh/leto</span></div>
        <div class="metric-item"><span class="metric-label">Strošek s SE + Baterijo</span><span class="metric-val" style="color:var(--success)">${Math.round(sim.costPvWithBatEur)} €/leto</span></div>
        <div class="metric-item"><span class="metric-label">Dodatni prihranek baterije</span><span class="metric-val" style="color:var(--primary)">+${Math.round(sim.batteryExtraSavingsEur)} €/leto (${sim.batPaybackYears > 0 ? sim.batPaybackYears.toFixed(1) + ' let' : '-'})</span></div>
      </div>
    </div>`;
  drawSolarBatteryChart('solarBatChartCanvas', sim);
}

// 4. PRIMERJAVA ENERGENTOV Z NASTAVLJIVO OKVIRNO INVESTICIJO
function renderFuelsCompareTab(totals) {
  const compareItems = [
    { fIdx: 0, name: 'TČ voda–voda', defInvest: 14500, color: '#0284c7' },
    { fIdx: 1, name: 'TČ zrak–voda', defInvest: 11500, color: '#38bdf8' },
    { fIdx: 3, name: 'Lesni peleti', defInvest: 7800, color: '#f59e0b' },
    { fIdx: 4, name: 'Zemeljski plin', defInvest: 6500, color: '#ea580c' },
    { fIdx: 6, name: 'Elektrika / IR', defInvest: 3500, color: '#ef4444' }
  ];

  const rows = compareItems.map(item => {
    const fObj = state.fuels[item.fIdx] || state.fuels[0];
    if (fObj.invest === undefined) fObj.invest = item.defInvest;
    const investVal = parseFloat(fObj.invest) || 0;
    const annualCost = calcFuelAnnualCost(fObj, totals.netHeatingKwh, totals.annualDhwKwh).annualEur;

    return `
      <tr>
        <td><strong style="color:${item.color}">${item.name}</strong></td>
        <td style="width:140px;">
          <input type="number" step="250" min="0" style="width:95px;" value="${investVal}" onchange="updateFuelInvest(${item.fIdx}, this.value)"> €
        </td>
        <td style="color:var(--primary)"><strong>${Math.round(annualCost).toLocaleString('sl-SI')} € / leto</strong></td>
        <td>${Math.round(annualCost * 15).toLocaleString('sl-SI')} €</td>
        <td><strong>${Math.round(investVal + annualCost * 15).toLocaleString('sl-SI')} €</strong></td>
      </tr>`;
  }).join('');

  document.getElementById('categoryContent').innerHTML = `
    <div class="card">
      <div class="card-title"><span>📊 Dolgoročna primerjava stroškov ogrevanja (15-letna amortizacija)</span><span class="badge badge-info">Skupna toplota: ${Math.round(totals.netHeatingKwh + totals.annualDhwKwh)} kWh/leto</span></div>
      <div style="font-size:0.82rem; color:var(--muted); margin-bottom:12px;">Primerjava vključuje nastavljivo okvirno investicijo v vir ogrevanja in predviden letni strošek energije skozi obdobje 15 let.</div>
      <div class="table-wrap">
        <table class="layers-table">
          <thead>
            <tr>
              <th>Sistem ogrevanja</th>
              <th>Okvirna investicija (€)</th>
              <th>Letni strošek (€/leto)</th>
              <th>Strošek energije (15 let)</th>
              <th>Skupaj (Investicija + 15 let)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function updateFuelInvest(fIdx, val) {
  if (state.fuels && state.fuels[fIdx]) {
    state.fuels[fIdx].invest = Math.max(0, parseFloat(val) || 0);
    renderAll();
  }
}

function renderRoomsTab(totals) {
  const baseSpecW = totals.specificW, baseDeltaT = Math.max(1, state.boundary.ti - state.boundary.te);
  const floorDT = Math.max(2, parseFloat(state.hydraulics.floorDeltaT) || 5.0);
  let sumArea = 0, sumWatts = 0, sumPipes = 0, sumLoops = 0, sumFlowLmin = 0;

  const rowsHtml = state.rooms.map((r, idx) => {
    const area = parseFloat(r.area) || 0, roomTi = parseFloat(r.ti) || 21;
    const roomSpecW = baseSpecW * (Math.max(1, roomTi - state.boundary.te) / baseDeltaT) * (parseFloat(r.expFactor) || 1.0);
    const roomWatts = area * roomSpecW, spacingCm = parseFloat(r.spacing) || 15;
    const pipeLen = area > 0 ? Math.round((area / (spacingCm / 100)) + 10) : 0;
    const loops = pipeLen > 0 ? Math.max(1, Math.ceil(pipeLen / 95)) : 0;
    const flowRoomLmin = roomWatts / (69.78 * floorDT);
    sumArea += area; sumWatts += roomWatts; sumPipes += pipeLen; sumLoops += loops; sumFlowLmin += flowRoomLmin;

    const roomRh = state.boundary.phiI;
    const roomDew = tDewFromP((roomRh / 100) * psat(roomTi));
    const isRisky = (roomTi - roomDew) < 4.0;

    return `<tr>
      <td><input type="text" value="${r.name}" onchange="updateRoom(${idx}, 'name', this.value)"></td>
      <td><input type="number" step="1" value="${r.area}" onchange="updateRoom(${idx}, 'area', this.value)"></td>
      <td><input type="number" step="0.5" value="${r.ti}" onchange="updateRoom(${idx}, 'ti', this.value)"></td>
      <td><select onchange="updateRoom(${idx}, 'expFactor', this.value)"><option value="0.8" ${r.expFactor == 0.8 ? 'selected' : ''}>Notranji (0.8)</option><option value="1.0" ${r.expFactor == 1.0 ? 'selected' : ''}>Srednji (1.0)</option><option value="1.1" ${r.expFactor == 1.1 ? 'selected' : ''}>2 zunanji steni (1.1)</option><option value="1.15" ${r.expFactor == 1.15 ? 'selected' : ''}>Kopalnica / vogal (1.15)</option></select></td>
      <td><select onchange="updateRoom(${idx}, 'spacing', this.value)"><option value="10" ${r.spacing == 10 ? 'selected' : ''}>10 cm</option><option value="15" ${r.spacing == 15 ? 'selected' : ''}>15 cm</option><option value="20" ${r.spacing == 20 ? 'selected' : ''}>20 cm</option></select></td>
      <td><strong>${roomSpecW.toFixed(1)} W/m²</strong></td>
      <td><strong style="color:var(--primary)">${Math.round(roomWatts)} W</strong></td>
      <td><strong>${pipeLen} m</strong> (${loops}x)</td>
      <td><strong style="color:var(--success)">${flowRoomLmin.toFixed(2)} L/min</strong></td>
      <td>${isRisky ? `<span class="badge badge-err" title="Rosišče=${roomDew.toFixed(1)}°C">⚠ Plesen!</span>` : `<span class="badge badge-ok">✓ Varno</span>`}</td>
      <td><button class="btn-danger btn-sm" onclick="removeRoom(${idx})">✕</button></td>
    </tr>`;
  }).join('');

  document.getElementById('categoryContent').innerHTML = `
    <div class="card">
      <div class="card-title">
        <span>🛋️ Dimenzioniranje talnega gretja, pretoki (L/min) in varnost pred plesnijo po prostorih</span>
        <div style="display:flex; gap:8px; align-items:center;">
          <span style="font-size:0.78rem; color:var(--muted)">ΔT (K):</span>
          <input type="number" step="0.5" min="3" max="10" style="width:65px; padding:4px;" value="${floorDT}" onchange="updateFloorDT(this.value)">
          <button class="btn-primary btn-sm" onclick="addRoom()">+ Dodaj prostor</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="layers-table">
          <thead>
            <tr>
              <th>Prostor</th><th style="width:55px;">m²</th><th style="width:65px;">Ti (°C)</th>
              <th style="width:130px;">Izpostavljenost</th><th style="width:75px;">Razmak</th>
              <th style="width:75px;">Spec. moč</th><th style="width:75px;">Moč (W)</th>
              <th style="width:85px;">Cevi</th><th style="width:110px;">Pretok</th><th style="width:85px;">Tveganje</th><th style="width:38px;"></th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <div class="metrics-bar">
        <div class="metric-item"><span class="metric-label">Skupna površina</span><span class="metric-val">${sumArea.toFixed(1)} m²</span></div>
        <div class="metric-item"><span class="metric-label">Vsota moči</span><span class="metric-val" style="color:var(--primary)">${Math.round(sumWatts)} W</span></div>
        <div class="metric-item"><span class="metric-label">Dolžina cevi</span><span class="metric-val">${sumPipes} m (${sumLoops} zank)</span></div>
        <div class="metric-item"><span class="metric-label">Skupni pretok</span><span class="metric-val" style="color:var(--success)">${sumFlowLmin.toFixed(1)} L/min</span></div>
      </div>
    </div>`;
}

function renderRoiTab() {
  const deltaT = Math.max(1, state.boundary.ti - state.boundary.te), hours = parseFloat(state.boundary.hours) || 1900;
  const selFuel = state.fuels.find(f => f.id === state.roi.selectedFuelId) || state.fuels[0];
  const eurPerKwhThermal = calcFuelAnnualCost(selFuel, 1000, 0).costPerEffectiveKwh;
  let sumPowerSavedW = 0, sumKwhSaved = 0, sumEurSaved = 0, sumNetInvest = 0;

  const rowsHtml = state.roi.measures.map((m, idx) => {
    const area = parseFloat(m.area) || 0, deltaU = Math.max(0, (parseFloat(m.uBefore) || 0) - (parseFloat(m.uAfter) || 0));
    const savedW = area * deltaU * deltaT, savedKwh = (savedW / 1000) * hours, savedEur = savedKwh * eurPerKwhThermal;
    const netInv = Math.max(0, (parseFloat(m.invest) || 0) - (parseFloat(m.subsidy) || 0)), payback = savedEur > 0 ? (netInv / savedEur) : 0;
    sumPowerSavedW += savedW; sumKwhSaved += savedKwh; sumEurSaved += savedEur; sumNetInvest += netInv;
    return `<tr><td><input type="text" value="${m.name}" onchange="updateRoiMeasure(${idx}, 'name', this.value)"></td><td><input type="number" step="5" value="${m.area}" onchange="updateRoiMeasure(${idx}, 'area', this.value)"></td><td><input type="number" step="0.05" value="${m.uBefore}" onchange="updateRoiMeasure(${idx}, 'uBefore', this.value)"></td><td><input type="number" step="0.02" value="${m.uAfter}" onchange="updateRoiMeasure(${idx}, 'uAfter', this.value)"></td><td><input type="number" step="100" value="${m.invest}" onchange="updateRoiMeasure(${idx}, 'invest', this.value)"></td><td><input type="number" step="100" value="${m.subsidy}" onchange="updateRoiMeasure(${idx}, 'subsidy', this.value)"></td><td><strong>-${Math.round(savedW)} W</strong></td><td><strong style="color:var(--success)">${Math.round(savedKwh)} kWh</strong></td><td><strong style="color:var(--primary)">${Math.round(savedEur)} €/leto</strong></td><td><span class="badge ${payback <= 12 ? 'badge-ok' : 'badge-warn'}">${payback > 0 ? payback.toFixed(1) + ' let' : '-'}</span></td><td><button class="btn-danger btn-sm" onclick="removeRoiMeasure(${idx})">✕</button></td></tr>`;
  }).join('');

  const fuelOptions = state.fuels.map(f => `<option value="${f.id}" ${f.id === state.roi.selectedFuelId ? 'selected' : ''}>${f.name}</option>`).join('');
  document.getElementById('categoryContent').innerHTML = `<div class="card"><div class="card-title"><span>📈 Primerjalnik investicije Prej / Potem (ROI)</span><button class="btn-primary btn-sm" onclick="addRoiMeasure()">+ Dodaj ukrep</button></div><div style="margin-bottom:12px; display:flex; align-items:center; gap:10px; font-size:0.84rem;"><strong>Izberi energent:</strong><select style="padding:6px 10px; border-radius:6px; border:1px solid var(--border);" onchange="updateRoiFuel(this.value)">${fuelOptions}</select></div><div class="table-wrap"><table class="layers-table"><thead><tr><th>Ukrep</th><th style="width:70px;">m²</th><th style="width:80px;">U prej</th><th style="width:80px;">U potem</th><th style="width:95px;">Investicija (€)</th><th style="width:90px;">Subvencija (€)</th><th style="width:85px;">Zmanjš. moči</th><th style="width:95px;">Prihranek/leto</th><th style="width:95px;">Prihranek €</th><th style="width:85px;">Vračilna doba</th><th style="width:40px;"></th></tr></thead><tbody>${rowsHtml}</tbody></table></div><div class="metrics-bar"><div class="metric-item"><span class="metric-label">Čista investicija</span><span class="metric-val">${Math.round(sumNetInvest).toLocaleString('sl-SI')} €</span></div><div class="metric-item"><span class="metric-label">Zmanjšanje moči</span><span class="metric-val" style="color:var(--primary)">-${(sumPowerSavedW/1000).toFixed(2)} kW</span></div><div class="metric-item"><span class="metric-label">Letni prihranek</span><span class="metric-val" style="color:var(--success)">${Math.round(sumEurSaved).toLocaleString('sl-SI')} €/leto</span></div><div class="metric-item"><span class="metric-label">Skupna vračilna doba</span><span class="metric-val">${sumEurSaved > 0 ? (sumNetInvest / sumEurSaved).toFixed(1) : '0'} let</span></div></div></div>`;
}

function renderSidebar(totals) {
  document.getElementById('totalLossKw').textContent = `${totals.totalKw.toFixed(2)} kW`;
  document.getElementById('totalLossW').textContent = `${Math.round(totals.totalW)} W (${totals.specificW.toFixed(1)} W/m²)`;
  document.getElementById('annualKwh').textContent = `${Math.round(totals.annualKwh).toLocaleString('sl-SI')} kWh`;
  document.getElementById('specificKwh').textContent = `Ogrev.: ${Math.round(totals.netHeatingKwh)} + STV: ${Math.round(totals.annualDhwKwh)} kWh`;

  const s = totals.specificKwh;
  let clsKey = 'A1', badgeCls = 'badge-ok', stdTitle = '', stdDesc = '';
  if (s <= 10) { clsKey = 'A1'; stdTitle = '🏆 Pasivna hiša (Plus / PHPP)'; stdDesc = 'Vrhunska pasivna gradnja (≤ 10 kWh/m²a)'; }
  else if (s <= 15) { clsKey = 'A2'; stdTitle = '🏆 Pasivna hiša (PHPP ≤ 15 kWh/m²a)'; stdDesc = 'Ustreza kriteriju pasivne hiše'; }
  else if (s <= 25) { clsKey = 'B1'; stdTitle = '🌿 Skoraj ničenergijska hiša (sNEH / PURES-3)'; stdDesc = 'Sodobna nizkoenergijska gradnja'; }
  else if (s <= 35) { clsKey = 'B2'; stdTitle = '🏡 Nizkoenergijska hiša (varčna gradnja)'; stdDesc = 'Zelo dobra toplotna zaščita ovoja'; }
  else if (s <= 60) { clsKey = 'C'; badgeCls = 'badge-warn'; stdTitle = '🏠 Dobro izolirana prenovljena hiša'; stdDesc = 'Srednja poraba energije za ogrevanje'; }
  else if (s <= 105) { clsKey = 'D'; badgeCls = 'badge-warn'; stdTitle = '🧱 Standardna starejša gradnja'; stdDesc = 'Priporočena dodatna izolacija'; }
  else if (s <= 150) { clsKey = 'E'; badgeCls = 'badge-err'; stdTitle = '⚠️ Slabo izolirana stavba'; stdDesc = 'Visoke toplotne izgube'; }
  else { clsKey = 'F/G'; badgeCls = 'badge-err'; stdTitle = '🔥 Energetsko potratna stavba'; stdDesc = 'Nujna energetska sanacija'; }

  const eb = document.getElementById('energyClassBadge');
  eb.className = `badge ${badgeCls}`;
  eb.textContent = `Razred ${clsKey} (${s.toFixed(0)} kWh/m²a)`;
  document.getElementById('houseStandardTitle').textContent = stdTitle;

  const scaleClasses = [
    { k: 'A1', col: '#15803d' }, { k: 'A2', col: '#16a34a' }, { k: 'B1', col: '#22c55e' }, { k: 'B2', col: '#84cc16' },
    { k: 'C', col: '#eab308' }, { k: 'D', col: '#f59e0b' }, { k: 'E', col: '#ea580c' }, { k: 'F/G', col: '#dc2626' }
  ];
  document.getElementById('epcScaleBar').innerHTML = scaleClasses.map(sc => `<div class="epc-step ${sc.k === clsKey ? 'active' : ''}" style="background:${sc.col};">${sc.k}</div>`).join('');
  document.getElementById('houseStandardSub').innerHTML = `<span>${stdDesc}</span><span>${totals.envelopeMeetsPures ? `<strong style="color:var(--success)">✓ Ovoj ustreza PURES-3</strong>` : `<strong style="color:var(--warning)">⚠ Del ovoja nad mejo PURES-3</strong>`}${totals.envelopeMeetsPassive ? ` · <strong style="color:var(--primary-dark)">🏆 Pasivni ovoj</strong>` : ''}</span>`;

  const groups = [
    { name: '🧱 Zidovi', w: totals.wallsQ, color: '#0284c7' }, { name: '🏠 Streha in strop', w: totals.roofsQ, color: '#ea580c' },
    { name: '🪵 Tla', w: totals.floorsQ, color: '#10b981' }, { name: '🪟 Okna', w: totals.windowsQ, color: '#8b5cf6' },
    { name: '🚪 Vrata', w: totals.doorsQ, color: '#f59e0b' }, { name: '📐 Toplotni mostovi', w: totals.bridgesQ, color: '#ef4444' },
    { name: '💨 Prezračevanje', w: totals.ventQ, color: '#0d9488' }
  ];
  document.getElementById('groupBreakdown').innerHTML = groups.map(g => {
    const pct = totals.totalW > 0 ? (g.w / totals.totalW) * 100 : 0;
    return `<div class="group-row"><div class="group-row-top"><span>${g.name}</span><span>${Math.round(g.w)} W (${(g.w/1000).toFixed(2)} kW) · ${pct.toFixed(1)} %</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%; background:${g.color}"></div></div></div>`;
  }).join('');

  document.getElementById('costTable').innerHTML = `<thead><tr><th>Energent</th><th>Cena</th><th>SCOP / Izk.</th><th>Skupaj/leto</th></tr></thead><tbody>${state.fuels.map((f, fIdx) => {
    const c = calcFuelAnnualCost(f, totals.netHeatingKwh, totals.annualDhwKwh);
    return `<tr><td><strong>${f.name}</strong></td><td><input type="number" step="0.01" value="${f.price}" onchange="updateFuel(${fIdx}, 'price', this.value)"> <span style="font-size:0.66rem; color:var(--muted)">${f.unit}</span></td><td><input type="number" step="0.05" style="width:46px;" value="${f.eff}" onchange="updateFuel(${fIdx}, 'eff', this.value)"></td><td style="color:var(--primary)">${Math.round(c.annualEur).toLocaleString('sl-SI')} €</td></tr>`;
  }).join('')}</tbody>`;

  const modeLabels = { main: 'Glavni vir ogrevanja (TČ s COP za 55 °C)', sanitary_hp: `Ločena sanitarna TČ (SCOP ${state.dhwAndWell.sanitaryHpCop})`, el_boiler: 'Klasični električni bojler (COP 1.0)', combo: 'Kombinirano (pozimi glavni vir, poleti el. bojler)' };
  document.getElementById('dhwModeBadgeNote').innerHTML = `🚿 <strong>Režim STV:</strong> ${modeLabels[state.dhwAndWell.dhwSourceMode] || modeLabels.main}`;
  const dw = totals.dhwWell;
  document.getElementById('wellPumpNote').innerHTML = `💧 <strong>TČ voda–voda:</strong> Pretok vrtine <strong>${dw.requiredWaterFlowM3h.toFixed(2)} m³/h</strong> (${dw.requiredWaterFlowLmin.toFixed(1)} L/min) · El. odjem pri ${state.boundary.te}°C: <strong>${totals.effectiveHpElAtTeKw.toFixed(2)} kW</strong> · SCOP = <strong>${dw.systemScop.toFixed(2)}</strong>.`;
  const sim = totals.solarBatSim;
  document.getElementById('meterCompareMiniNote').innerHTML = `🔋 <strong>SE (${state.solarAndGrid.pvKwp} kWp) + Baterija (${state.solarAndGrid.batteryCapKwh} kWh):</strong> Samooskrba <strong>${sim.selfSuffWithBatAnnualPct.toFixed(1)} %</strong> · Dokup: <strong>${Math.round(sim.sumGridWithBat)} kWh/leto</strong>.`;
}

function renderAll() {
  document.body.classList.toggle('dark', !!state.darkMode);
  document.getElementById('darkBtn').textContent = state.darkMode ? '☀️ Svetli način' : '🌙 Temni način';
  document.getElementById('deltaTBadge').textContent = `ΔT = ${(state.boundary.ti - state.boundary.te).toFixed(1)} K`;
  document.getElementById('hoursInput').value = state.boundary.hours;
  const totals = calculateAllTotals();
  saveState();
  renderScenarioBar(totals);
  renderTabs(totals);
  renderSidebar(totals);

  if (state.activeTab === 'walls') renderLayeredGroup('walls', '🧱 Zidovi (zunanje in notranje stene)');
  else if (state.activeTab === 'roofs') renderLayeredGroup('roofs', '🏠 Streha in stropovi');
  else if (state.activeTab === 'floors') renderLayeredGroup('floors', '🪵 Tla in plošče');
  else if (state.activeTab === 'bom') renderBomTab();
  else if (state.activeTab === 'materials') renderMaterialsLibraryTab();
  else if (state.activeTab === 'windows') renderWindowsTab();
  else if (state.activeTab === 'doors') renderDoorsTab();
  else if (state.activeTab === 'bridges') renderBridgesTab();
  else if (state.activeTab === 'ventilation') renderVentilationTab(totals);
  else if (state.activeTab === 'dhw') renderDhwAndWellTab(totals);
  else if (state.activeTab === 'hp_power') renderHpAndFusesTab(totals);
  else if (state.activeTab === 'meter_solar') renderMeterAndSolarTab(totals);
  else if (state.activeTab === 'fuels_compare') renderFuelsCompareTab(totals);
  else if (state.activeTab === 'rooms') renderRoomsTab(totals);
  else if (state.activeTab === 'roi') renderRoiTab();
}

function toggleDarkMode() { state.darkMode = !state.darkMode; renderAll(); }
function switchTab(tabId) { state.activeTab = tabId; renderAll(); }
function updateBomWaste(val) { state.bomWastePct = Math.max(0, parseFloat(val) || 0); renderAll(); }
function updateRafterHelper(field, val) { state.rafterHelper[field] = Math.max(1, parseFloat(val) || 10); renderAll(); }
function saveRafterTargetLayer(groupKey, elIdx, lIdx) { state[groupKey][elIdx].rafterTargetLayer = parseInt(lIdx, 10) || 0; }
function applyRafterPctToLayer(groupKey, elIdx, pctVal) {
  const selEl = document.getElementById(`rafterTargetLayer_${groupKey}_${elIdx}`);
  const lIdx = selEl ? parseInt(selEl.value, 10) : 0;
  if (state[groupKey] && state[groupKey][elIdx] && state[groupKey][elIdx].layers[lIdx]) {
    state[groupKey][elIdx].rafterTargetLayer = lIdx;
    state[groupKey][elIdx].layers[lIdx].woodPct = parseFloat(pctVal) || 0;
    renderAll();
  }
}

function cloneElement(groupKey, elIdx) {
  const orig = state[groupKey][elIdx];
  const copy = JSON.parse(JSON.stringify(orig));
  copy.id = 'el_' + Date.now();
  copy.name = orig.name + ' (kopija)';
  state[groupKey].splice(elIdx + 1, 0, copy);
  renderAll();
}

function printFullReport() {
  const totals = calculateAllTotals();
  let html = `
    <div style="font-family:system-ui,sans-serif; padding:30px; max-width:900px; margin:0 auto; color:#0f172a;">
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0284c7; padding-bottom:15px; margin-bottom:25px;">
        <div>
          <h1 style="font-size:22px; color:#0f172a; margin:0;">TEHNIČNO POROČILO: TOPLOTNE IZGUBE IN ENERGETIKA</h1>
          <p style="font-size:13px; color:#64748b; margin:4px 0 0 0;">Kalkulator toplotnih izgub v10.2 · ISO 13788 · PURES-3</p>
        </div>
        <div style="text-align:right;">
          <button class="no-print" onclick="triggerPrintReport()" style="background:#0284c7; color:#fff; border:none; padding:8px 14px; border-radius:6px; font-weight:700; cursor:pointer;">🖨️ Natisni / Shrani v PDF</button>
          <button class="no-print" onclick="renderAll()" style="background:#e2e8f0; color:#0f172a; border:none; padding:8px 14px; border-radius:6px; font-weight:700; cursor:pointer; margin-left:6px;">✕ Zapri</button>
        </div>
      </div>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:8px; margin-bottom:20px; display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px;">
        <div><strong>Notranja temperatura (Ti):</strong> ${state.boundary.ti} °C</div>
        <div><strong>Zunanja projektna temperatura (Te):</strong> ${state.boundary.te} °C</div>
        <div><strong>Notranja zračna vlaga (φi):</strong> ${state.boundary.phiI} %</div>
        <div><strong>Ogrevana tlorisna površina:</strong> ${state.boundary.heatedArea} m²</div>
        <div><strong>Projektne toplotne izgube:</strong> <strong>${totals.totalKw.toFixed(2)} kW</strong></div>
        <div><strong>Letna potreba po energiji:</strong> <strong>${Math.round(totals.annualKwh).toLocaleString('sl-SI')} kWh</strong></div>
      </div>

      <h3 style="font-size:15px; border-bottom:1px solid #cbd5e1; padding-bottom:6px; margin-bottom:12px;">1. Pregled konstrukcijskih sklopov ovoja</h3>
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:25px;">
        <thead>
          <tr style="background:#f1f5f9; text-align:left;">
            <th style="padding:6px; border:1px solid #cbd5e1;">Sklop / Element</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Površina (m²)</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">U-vrednost (W/m²K)</th>
            <th style="padding:6px; border:1px solid #cbd5e1;">Toplotna izguba (W)</th>
          </tr>
        </thead>
        <tbody>`;

  ['walls', 'roofs', 'floors'].forEach(gKey => {
    (state[gKey] || []).forEach(el => {
      const r = calcAssembly(el);
      html += `<tr>
        <td style="padding:6px; border:1px solid #cbd5e1;">${el.name}</td>
        <td style="padding:6px; border:1px solid #cbd5e1;">${el.area} m²</td>
        <td style="padding:6px; border:1px solid #cbd5e1;"><strong>${r.uVal.toFixed(3)}</strong></td>
        <td style="padding:6px; border:1px solid #cbd5e1;"><strong>${Math.round(r.qLoss)} W</strong></td>
      </tr>`;
    });
  });

  html += `</tbody></table>
    </div>`;

  document.getElementById('categoryContent').innerHTML = html;
}

function addNewCustomMaterial() {
  const name = (document.getElementById('newMatName').value || '').trim();
  if (!name) { alert('Prosim, vpiši naziv materiala.'); return; }
  if (!state.customMaterials) state.customMaterials = [];
  state.customMaterials.unshift({
    id: 'usr_' + Date.now(),
    group: document.getElementById('newMatGroup').value || 'Moji materiali',
    name,
    defD: parseFloat(document.getElementById('newMatDefD').value) || 5.0,
    lambda: Math.max(0.005, parseFloat(document.getElementById('newMatLambda').value) || 0.040),
    mu: Math.max(1, parseFloat(document.getElementById('newMatMu').value) || 10),
    rho: Math.max(1, parseFloat(document.getElementById('newMatRho').value) || 500),
    c: Math.max(100, parseFloat(document.getElementById('newMatC').value) || 1000),
    color: document.getElementById('newMatColor').value || '#0284c7',
    ventilated: document.getElementById('newMatVent').value === 'yes'
  });
  renderAll();
}

function editExistingMaterial(matId, field, rawVal) {
  const val = (field === 'name' || field === 'color' || field === 'group') ? rawVal : (parseFloat(rawVal) || 0);
  const customIdx = (state.customMaterials || []).findIndex(m => m.id === matId);
  if (customIdx >= 0) state.customMaterials[customIdx][field] = val;
  else {
    if (!state.materialOverrides) state.materialOverrides = {};
    if (!state.materialOverrides[matId]) state.materialOverrides[matId] = {};
    state.materialOverrides[matId][field] = val;
  }
  if (['name', 'lambda', 'mu', 'rho', 'c'].includes(field)) {
    ['walls', 'roofs', 'floors'].forEach(gKey => {
      (state[gKey] || []).forEach(el => (el.layers || []).forEach(layer => { if (layer.matId === matId) layer[field] = val; }));
    });
  }
  renderAll();
}

function resetSingleMaterialOverride(matId) {
  if (state.materialOverrides && state.materialOverrides[matId]) {
    delete state.materialOverrides[matId];
    const orig = BASE_MATERIALS.find(m => m.id === matId);
    if (orig) {
      ['walls', 'roofs', 'floors'].forEach(gKey => {
        (state[gKey] || []).forEach(el => (el.layers || []).forEach(l => {
          if (l.matId === matId) { l.name = orig.name; l.lambda = orig.lambda; l.mu = orig.mu; l.rho = orig.rho; l.c = orig.c; }
        }));
      });
    }
    renderAll();
  }
}

function deleteCustomMaterial(matId) { state.customMaterials = (state.customMaterials || []).filter(m => m.id !== matId); renderAll(); }
function saveScenarioA() {
  const totals = calculateAllTotals();
  state.scenarioA = { totalW: totals.totalW, annualKwh: totals.annualKwh, eur: Math.round(calcFuelAnnualCost(state.fuels[0], totals.netHeatingKwh, totals.annualDhwKwh).annualEur) };
  renderAll();
}
function clearScenarioA() { state.scenarioA = null; renderAll(); }

function applyCityPreset() {
  const sel = document.getElementById('cityPresetSelect');
  if (!sel) return;
  const val = parseFloat(sel.value);
  if (!isNaN(val)) {
    state.boundary.te = val;
    const teInput = document.getElementById('teInput');
    if (teInput) teInput.value = val;
    renderAll();
  }
}

function applyClimatePreset() {
  const val = document.getElementById('climatePreset').value;
  if (val !== 'custom') { state.boundary.te = parseFloat(val); document.getElementById('teInput').value = state.boundary.te; renderAll(); }
}

function updateBoundary() {
  state.boundary.ti = parseFloat(document.getElementById('tiInput').value) || 21;
  state.boundary.te = parseFloat(document.getElementById('teInput').value) || -13;
  state.boundary.phiI = parseFloat(document.getElementById('phiIInput').value) || 50;
  state.boundary.phiE = parseFloat(document.getElementById('phiEInput').value) || 80;
  state.boundary.heatedArea = parseFloat(document.getElementById('heatedAreaInput').value) || 180;
  state.boundary.hours = parseFloat(document.getElementById('hoursInput').value) || 1900;
  renderAll();
}

function updateDhw(field, val) {
  state.dhwAndWell[field] = (field === 'dhwEnabled' || field === 'wellPumpAutoSync' || field === 'dhwSourceMode') ? val : (parseFloat(val) || 0);
  renderAll();
}
function updateHpSetting(field, val) {
  state.hpSettings[field] = (field === 'selectedHpFuelId' || field === 'peakElMode') ? val : (parseFloat(val) || 0);
  renderAll();
}
function setManualHpPeakEl(val) { state.hpSettings.peakElMode = 'manual'; state.hpSettings.manualPeakElKw = parseFloat(val) || 0; renderAll(); }
function updateMeterField(field, val) {
  state.meterData[field] = parseFloat(val) || 0;
  if (field === 'vtKwh' || field === 'mtKwh') state.meterData.totalMeterKwh = (parseFloat(state.meterData.vtKwh) || 0) + (parseFloat(state.meterData.mtKwh) || 0);
  renderAll();
}
function updateMonthlyMeter(idx, val) {
  state.meterData.monthlyTotalKwh[idx] = parseFloat(val) || 0;
  state.meterData.totalMeterKwh = Math.round(state.meterData.monthlyTotalKwh.reduce((a, b) => a + b, 0));
  renderAll();
}

function calibrateModelToMeter() {
  const totals = calculateAllTotals(), targetHpEl = parseFloat(state.meterData.measuredHpElKwh) || 0;
  if (targetHpEl <= 100) { alert('Vnesi izmerjeno letno porabo elektrike za TČ (v kWh).'); return; }
  const isWaterHp = state.hpSettings.selectedHpFuelId === 'tc_voda';
  const hpScop = isWaterHp ? totals.dhwWell.systemScop : (parseFloat(state.fuels[1].eff) || 3.5);
  const dhwCop = isWaterHp ? (parseFloat(state.dhwAndWell.mainHpDhwCop) || 3.1) : 2.6;
  const remainingHeatEl = Math.max(200, targetHpEl - (totals.annualDhwKwh / dhwCop));
  const neededGrossHeatingKwh = (remainingHeatEl * hpScop) + totals.solarGainKwh;
  state.boundary.hours = Math.min(4000, Math.max(400, Math.round(neededGrossHeatingKwh / Math.max(0.5, totals.totalKw))));
  document.getElementById('hoursInput').value = state.boundary.hours;
  renderAll();
}

function importMeterCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const lines = ev.target.result.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return;
    const monthlySums = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let matchedRows = 0;
    const numericLines = [];
    lines.forEach(line => {
      const parts = line.split(/[;,|\t]/);
      const nums = parts.map(p => parseFloat(p.replace(',', '.'))).filter(n => !isNaN(n));
      if (nums.length > 0) numericLines.push({ parts, nums });
    });
    if (numericLines.length === 12) {
      numericLines.forEach((item, i) => { monthlySums[i] = item.nums[item.nums.length - 1]; });
      matchedRows = 12;
    } else {
      lines.forEach(line => {
        const parts = line.split(/[;,|\t]/);
        if (parts.length < 2) return;
        let monthIdx = -1;
        for (let p of parts) {
          const dMatch = p.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || p.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
          if (dMatch) { const mNum = parseInt(dMatch[2], 10); if (mNum >= 1 && mNum <= 12) { monthIdx = mNum - 1; break; } }
        }
        if (monthIdx >= 0) {
          const val = parseFloat(parts[parts.length - 1].replace(',', '.'));
          if (!isNaN(val) && val >= 0) { monthlySums[monthIdx] += val; matchedRows++; }
        }
      });
    }
    if (matchedRows > 0) {
      let total = monthlySums.reduce((a, b) => a + b, 0);
      if (total > 80000) { for (let i = 0; i < 12; i++) monthlySums[i] /= 1000; total /= 1000; }
      state.meterData.monthlyTotalKwh = monthlySums.map(v => Math.round(v));
      state.meterData.totalMeterKwh = Math.round(total);
      renderAll();
      alert(`Uspešno uvoženih ${matchedRows} vrstic iz CSV! Skupna letna poraba: ${Math.round(total)} kWh.`);
    } else alert('V CSV datoteki ni bilo mogoče prepoznati mesečnih vrstic.');
  };
  reader.readAsText(file);
}

function updateSolarGrid(field, val) {
  state.solarAndGrid[field] = (field === 'exportMode' || field === 'simLoadSource') ? val : (parseFloat(val) || 0);
  renderAll();
}
function updateFloorDT(val) { state.hydraulics.floorDeltaT = parseFloat(val) || 5.0; renderAll(); }
function updateFuel(fIdx, field, val) {
  if (fIdx === 0 && field === 'eff') state.dhwAndWell.wellPumpAutoSync = false;
  state.fuels[fIdx][field] = parseFloat(val) || 0;
  renderAll();
}
function updateElField(group, elIdx, field, val) { state[group][elIdx][field] = field === 'name' ? val : (parseFloat(val) || 0); renderAll(); }

function selectMaterial(group, elIdx, lIdx, matId) {
  const mat = getAllMaterials().find(m => m.id === matId);
  const layer = state[group][elIdx].layers[lIdx];
  layer.matId = matId;
  if (mat) {
    layer.name = mat.name; layer.lambda = mat.lambda; layer.mu = mat.mu; layer.rho = mat.rho; layer.c = mat.c;
    if ((mat.defD && mat.defD < 0.8) || layer.d < 0.8) layer.d = mat.defD || 5.0;
  }
  renderAll();
}

function updateLayer(group, elIdx, lIdx, field, val) { state[group][elIdx].layers[lIdx][field] = parseFloat(val) || 0; renderAll(); }
function addLayer(group, elIdx) { state[group][elIdx].layers.push({ matId: 'eps_graf_70', name: 'Grafitni EPS 70/80', d: 10.0, lambda: 0.031, mu: 30, rho: 16, c: 1450, woodPct: 0 }); renderAll(); }
function removeLayer(group, elIdx, lIdx) { if (state[group][elIdx].layers.length > 1) { state[group][elIdx].layers.splice(lIdx, 1); renderAll(); } }
function moveLayer(group, elIdx, lIdx, dir) {
  const arr = state[group][elIdx].layers, newIdx = lIdx + dir;
  if (newIdx >= 0 && newIdx < arr.length) { const t = arr[lIdx]; arr[lIdx] = arr[newIdx]; arr[newIdx] = t; renderAll(); }
}
function addElement(group) {
  state[group].push({
    id: 'el_' + Date.now(), name: 'Nov konstrukcijski sklop', area: 50, fx: 1.0,
    rsi: group === 'roofs' ? 0.10 : (group === 'floors' ? 0.17 : 0.13),
    rse: group === 'floors' ? 0.00 : 0.04, targetU: 0.18,
    layers: [
      { matId: 'opeka_votla', name: 'Votla opeka', d: 29, lambda: 0.480, mu: 8, rho: 900, c: 1000, woodPct: 0 },
      { matId: 'eps_graf_70', name: 'Grafitni EPS', d: 16, lambda: 0.031, mu: 30, rho: 16, c: 1450, woodPct: 0 }
    ]
  });
  renderAll();
}
function removeElement(group, elIdx) { state[group].splice(elIdx, 1); renderAll(); }
function addWindow() { state.windows.push({ id: 'w_' + Date.now(), name: 'Novo okno', w: 1.2, h: 1.4, count: 1, uw: 0.85, g: 0.50, orient: 'J', fx: 1.0 }); renderAll(); }
function updateWindow(idx, field, val) { state.windows[idx][field] = (field === 'name' || field === 'orient') ? val : (parseFloat(val) || 0); renderAll(); }
function removeWindow(idx) { state.windows.splice(idx, 1); renderAll(); }
function addDoor() { state.doors.push({ id: 'd_' + Date.now(), name: 'Nova vrata', area: 2.0, ud: 1.1, fx: 1.0 }); renderAll(); }
function updateDoor(idx, field, val) { state.doors[idx][field] = field === 'name' ? val : (parseFloat(val) || 0); renderAll(); }
function removeDoor(idx) { state.doors.splice(idx, 1); renderAll(); }
function toggleBridgeMode(checked) { state.bridges.useFlatRate = checked; renderAll(); }
function updateFlatBridge(val) { state.bridges.flatDeltaU = parseFloat(val) || 0; renderAll(); }
function addBridge() { state.bridges.items.push({ id: 'b_' + Date.now(), name: 'Nov toplotni most', length: 15, psi: 0.10, fx: 1.0 }); renderAll(); }
function updateBridge(idx, field, val) { state.bridges.items[idx][field] = field === 'name' ? val : (parseFloat(val) || 0); renderAll(); }
function removeBridge(idx) { state.bridges.items.splice(idx, 1); renderAll(); }
function updateVent(field, val) { state.ventilation[field] = field === 'enabled' ? val : (parseFloat(val) || 0); renderAll(); }
function addRoom() { state.rooms.push({ id: 'rm_' + Date.now(), name: 'Nov prostor', area: 15, ti: 21.0, expFactor: 1.0, spacing: 15 }); renderAll(); }
function updateRoom(idx, field, val) { state.rooms[idx][field] = field === 'name' ? val : (parseFloat(val) || 0); renderAll(); }
function removeRoom(idx) { state.rooms.splice(idx, 1); renderAll(); }
function updateRoiFuel(fuelId) { state.roi.selectedFuelId = fuelId; renderAll(); }
function addRoiMeasure() { state.roi.measures.push({ id: 'm_' + Date.now(), name: 'Nov energetski ukrep', area: 100, uBefore: 1.0, uAfter: 0.20, invest: 5000, subsidy: 0 }); renderAll(); }
function updateRoiMeasure(idx, field, val) { state.roi.measures[idx][field] = field === 'name' ? val : (parseFloat(val) || 0); renderAll(); }
function removeRoiMeasure(idx) { state.roi.measures.splice(idx, 1); renderAll(); }

function resetDefault() {
  if (confirm('Želiš ponastaviti vse podatke na začetni primer hiše? Tvoji dodani in urejeni materiali v knjižnici se ohranijo.')) {
    const keepCustom = state.customMaterials || [], keepOverrides = state.materialOverrides || {};
    state = getInitialState(); state.customMaterials = keepCustom; state.materialOverrides = keepOverrides;
    renderAll();
  }
}

function triggerPrintReport() {
  if (window.AndroidBridge && window.AndroidBridge.printReport) {
    window.AndroidBridge.printReport();
  } else {
    window.print();
  }
}

function exportJSON() {
  state.version = APP_VERSION;
  const jsonStr = JSON.stringify(state, null, 2);
  if (window.AndroidBridge && window.AndroidBridge.exportJson) {
    window.AndroidBridge.exportJson(jsonStr);
    return;
  }
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'izracun-toplotnih-izgub-v10.2.json'; a.click();
}

function loadJsonData(loaded) {
  const def = getInitialState();
  state = {
    ...def, ...loaded, version: APP_VERSION,
    customMaterials: loaded.customMaterials || [], materialOverrides: loaded.materialOverrides || {},
    rafterHelper: { ...def.rafterHelper, ...(loaded.rafterHelper || {}) },
    dhwAndWell: { ...def.dhwAndWell, ...(loaded.dhwAndWell || {}) },
    hpSettings: { ...def.hpSettings, ...(loaded.hpSettings || {}) },
    meterData: { ...def.meterData, ...(loaded.meterData || {}) },
    solarAndGrid: { ...def.solarAndGrid, ...(loaded.solarAndGrid || {}) },
    hydraulics: { ...def.hydraulics, ...(loaded.hydraulics || {}) }
  };
  const ti = document.getElementById('tiInput'); if (ti) ti.value = state.boundary.ti;
  const te = document.getElementById('teInput'); if (te) te.value = state.boundary.te;
  const phiI = document.getElementById('phiIInput'); if (phiI) phiI.value = state.boundary.phiI;
  const phiE = document.getElementById('phiEInput'); if (phiE) phiE.value = state.boundary.phiE;
  const ha = document.getElementById('heatedAreaInput'); if (ha) ha.value = state.boundary.heatedArea;
  const hrs = document.getElementById('hoursInput'); if (hrs) hrs.value = state.boundary.hours;
  renderAll();
  saveState();
}

window.applyJsonString = function(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    loadJsonData(data);
    if (window.AndroidBridge && window.AndroidBridge.showToast) {
      window.AndroidBridge.showToast('Podatki so bili uspešno uvoženi!');
    }
    return true;
  } catch (e) {
    console.error(e);
    if (window.AndroidBridge && window.AndroidBridge.showToast) {
      window.AndroidBridge.showToast('Napaka pri branju JSON datoteke');
    } else {
      alert('Napaka pri branju JSON datoteke.');
    }
    return false;
  }
};

function loadSampleData() {
  fetch('sample.json')
    .then(r => r.json())
    .then(data => {
      loadJsonData(data);
      if (window.AndroidBridge && window.AndroidBridge.showToast) {
        window.AndroidBridge.showToast('Vzorčni podatki hiše (V04) so naloženi!');
      } else {
        alert('Vzorčni podatki hiše (V04) so naloženi!');
      }
    })
    .catch(e => {
      console.error(e);
      alert('Napaka pri odpiranju vzorca.');
    });
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const loaded = JSON.parse(ev.target.result);
      loadJsonData(loaded);
    } catch (err) { alert('Napaka pri branju JSON datoteke.'); }
  };
  reader.readAsText(file);
}

window.addEventListener('resize', () => renderAll());
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tiInput').value = state.boundary.ti;
  document.getElementById('teInput').value = state.boundary.te;
  document.getElementById('phiIInput').value = state.boundary.phiI;
  document.getElementById('phiEInput').value = state.boundary.phiE;
  document.getElementById('heatedAreaInput').value = state.boundary.heatedArea;
  document.getElementById('hoursInput').value = state.boundary.hours;
  renderAll();
});