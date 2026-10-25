// Fizikalne funkcije za nasičen parni tlak in rosišče (ISO 13788)
function psat(T) {
  return T >= 0 ? 610.5 * Math.exp((17.269 * T) / (237.3 + T)) : 610.5 * Math.exp((21.875 * T) / (265.5 + T));
}

function tDewFromP(p) {
  const sp = Math.max(1, p), g = Math.log(sp / 610.5);
  return sp >= 610.5 ? (237.3 * g) / (17.269 - g) : (265.5 * g) / (21.875 - g);
}

// Izračun posameznega konstrukcijskega sklopa (U-vrednost, špirovci, fazni zamik, Glaser)
function calcAssembly(el) {
  const allMats = getAllMaterials();
  const ti = state.boundary.ti, te = state.boundary.te;
  const deltaT = Math.max(0, ti - te), teEff = ti - el.fx * (ti - te);
  const phiI = state.boundary.phiI, phiE = state.boundary.phiE;
  let sumR = 0, sumD = 0, sumSd = 0, sumPhaseShift = 0.6, sumXi = 0, sumHeatCapKj = 0, reachedVent = false;

  const computedLayers = el.layers.map(l => {
    const matRef = allMats.find(m => m.id === l.matId);
    const isVentAir = (l.matId === 'zrak_prezr') || (matRef && matRef.ventilated);
    if (isVentAir) reachedVent = true;

    const d_cm = parseFloat(l.d) || 0, d_m = Math.max(0.0001, d_cm / 100);
    const lamBase = Math.max(0.005, parseFloat(l.lambda) || 0.1);
    const mu = Math.max(1, parseFloat(l.mu) || 1);
    const rhoBase = parseFloat(l.rho) || (matRef ? matRef.rho : 500);
    const cBase = parseFloat(l.c) || (matRef ? matRef.c : 1000);

    const woodPct = Math.min(90, Math.max(0, parseFloat(l.woodPct) || 0));
    const fW = woodPct / 100;
    const lamEff = fW > 0 ? ((1 - fW) * lamBase + fW * 0.130) : lamBase;
    const rhoEff = fW > 0 ? ((1 - fW) * rhoBase + fW * 470) : rhoBase;
    const cEff = fW > 0 ? ((1 - fW) * cBase + fW * 1600) : cBase;

    const r = reachedVent ? 0 : (d_m / lamEff);
    const sd = reachedVent ? 0 : (mu * d_m);
    const layerPhi = reachedVent ? 0.15 : (0.02305 * d_m * Math.sqrt((rhoEff * cEff) / lamEff));

    sumR += r; sumD += d_cm; sumSd += sd; sumPhaseShift += layerPhi;
    sumXi += layerPhi * (Math.PI / 12);
    sumHeatCapKj += reachedVent ? 0 : ((d_m * rhoEff * cEff) / 1000);

    return { ...l, rho: rhoBase, c: cBase, woodPct, lamEff, r, sd, d_m, layerPhi, isVentAir, bypassedByVent: reachedVent };
  });

  const effectiveRse = reachedVent ? (el.rsi || 0.10) : (el.rse || 0.04);
  const rTot = (el.rsi || 0.13) + sumR + effectiveRse;
  const uVal = rTot > 0 ? (1 / rTot) : 0;
  const qLoss = uVal * (parseFloat(el.area) || 0) * deltaT * (parseFloat(el.fx) || 1);
  const decrementFactor = Math.max(0.005, Math.exp(-0.72 * sumXi));

  const pi = (phiI / 100) * psat(ti), pe = (phiE / 100) * psat(teEff);
  const nodes = [];
  let cumR = el.rsi || 0.13, cumSd = 0, cumD = 0;
  const Tsi = ti - (cumR / rTot) * (ti - teEff);
  nodes.push({ label: 'Notranja površina', x_cm: 0, T: Tsi, p: pi, psat: psat(Tsi), Tdew: tDewFromP(pi), condenses: pi >= psat(Tsi) });

  const condensationZones = [];
  computedLayers.forEach(l => {
    cumR += l.r; cumSd += l.sd; cumD += (parseFloat(l.d) || 0);
    const Tk = l.bypassedByVent ? teEff : (ti - (cumR / rTot) * (ti - teEff));
    const pk = l.bypassedByVent ? pe : (sumSd > 0 ? (pi - (cumSd / sumSd) * (pi - pe)) : pe);
    const psatK = psat(Tk), tDewK = tDewFromP(pk);
    const cond = !l.bypassedByVent && (pk >= psatK);
    if (cond) condensationZones.push(`Za slojem "${l.name}" (${Tk.toFixed(1)} °C ≤ rosišče ${tDewK.toFixed(1)} °C)`);
    nodes.push({ label: l.name, x_cm: cumD, T: Tk, p: pk, psat: psatK, Tdew: tDewK, condenses: cond, bypassedByVent: l.bypassedByVent });
  });

  const fRsi = (ti - teEff) > 0 ? ((Tsi - teEff) / (ti - teEff)) : 1;
  return { computedLayers, sumD, sumR, sumSd, rTot, uVal, qLoss, Tsi, fRsi, phaseShiftHours: sumPhaseShift, decrementFactor, sumHeatCapKj, nodes, condensationZones, hasVentilatedLayer: reachedVent };
}

// Pametni izračun potrebne debeline izolacije za dosego želenega U (npr. PURES ali Passiv)
function calcRequiredInsulationThickness(el, targetU, lambda) {
  const currentRes = calcAssembly(el);
  const currentRseRsi = (el.rsi || 0.13) + (el.rse || 0.04);
  const sumOtherR = currentRes.rTot - currentRseRsi;
  const targetRTot = 1 / Math.max(0.01, targetU);
  const requiredAdditionalR = Math.max(0, targetRTot - sumOtherR);
  const requiredThicknessM = requiredAdditionalR * lambda;
  return Math.ceil(requiredThicknessM * 100); // Vrne v cm zaokroženo navzgor
}

// Izračun sanitarne tople vode (STV) in vrtine za TČ voda-voda
function calcDhwAndWell(heatingNetKwh) {
  const dw = state.dhwAndWell;
  const persons = Math.max(0, parseFloat(dw.persons) || 0);
  const liters = Math.max(0, parseFloat(dw.litersPerPerson) || 0);
  const dT = Math.max(5, (parseFloat(dw.tempHot) || 50) - (parseFloat(dw.tempCold) || 10));
  const lossFactor = 1 + (Math.max(0, parseFloat(dw.tankLossPct) || 0) / 100);
  const dailyDhwKwh = (persons * liters * 1.163 * dT / 1000) * lossFactor;
  const annualDhwKwh = dw.dhwEnabled ? (dailyDhwKwh * 365) : 0;
  const totalThermalKwh = heatingNetKwh + annualDhwKwh;

  const hpKw = Math.max(2, parseFloat(dw.hpThermalPowerKw) || 8);
  const machineCop = Math.max(1.5, parseFloat(dw.hpMachineCop) || 5.4);
  const pumpW = Math.max(0, parseFloat(dw.wellPumpWatts) || 350);
  const waterDeltaT = Math.max(1.5, parseFloat(dw.wellWaterDeltaT) || 3.5);

  const evaporatorKw = hpKw * (1 - 1 / machineCop);
  const requiredWaterFlowM3h = evaporatorKw / (1.163 * waterDeltaT);
  const requiredWaterFlowLmin = (requiredWaterFlowM3h * 1000) / 60;

  const runHours = totalThermalKwh / hpKw;
  const compressorElKwh = totalThermalKwh / machineCop;
  const wellPumpElKwh = (pumpW / 1000) * runHours;
  const totalHpWaterElKwh = compressorElKwh + wellPumpElKwh;
  const systemScop = totalHpWaterElKwh > 0 ? (totalThermalKwh / totalHpWaterElKwh) : machineCop;

  if (dw.wellPumpAutoSync && state.fuels[0] && state.fuels[0].id === 'tc_voda') {
    state.fuels[0].eff = parseFloat(systemScop.toFixed(2));
  }

  const tSum = parseFloat(dw.summerIndoorTemp) || 25, rhSum = parseFloat(dw.summerIndoorRh) || 60;
  const floorSummerDewPoint = tDewFromP((rhSum / 100) * psat(tSum));
  const minSafeCoolingWaterTemp = floorSummerDewPoint + 1.5;

  return { dailyDhwKwh, annualDhwKwh, totalThermalKwh, runHours, compressorElKwh, wellPumpElKwh, totalHpWaterElKwh, systemScop, evaporatorKw, requiredWaterFlowM3h, requiredWaterFlowLmin, floorSummerDewPoint, minSafeCoolingWaterTemp };
}

// Simulacija sončne elektrarne (SE) in baterijskega hranilnika po 12 mesecih
function calcSolarAndBatterySim(annualHeatElKwh, annualDhwElKwh) {
  const sg = state.solarAndGrid, md = state.meterData;
  const annualPvKwh = Math.max(0, parseFloat(sg.pvKwp) || 0) * Math.max(400, parseFloat(sg.specificYield) || 1100);
  const usableBatKwh = Math.max(0, parseFloat(sg.batteryCapKwh) || 0) * (Math.min(100, Math.max(10, parseFloat(sg.batteryDodPct) || 90)) / 100);
  const batEff = Math.min(99, Math.max(50, parseFloat(sg.batteryEffPct) || 90)) / 100;
  const directRatioBase = Math.min(90, Math.max(10, parseFloat(sg.directSelfConsPct) || 38)) / 100;
  const acAnnual = parseFloat(md.measuredAcElKwh) || 1031, houseAnnual = parseFloat(md.measuredHouseholdKwh) || 1864;

  let sumLoad = 0, sumPv = 0, sumDirect = 0, sumBatDischarged = 0, sumGridWithBat = 0, sumGridNoBat = 0, sumExportWithBat = 0, sumExportNoBat = 0;

  const months = MONTHS_DATA.map((m, idx) => {
    const pvM = annualPvKwh * m.pvShare;
    const hpModelM = (annualHeatElKwh * m.heatShare) + (annualDhwElKwh / 12);
    const modelTotalM = hpModelM + (acAnnual * m.acShare) + (houseAnnual / 12);
    const meterM = (md.monthlyTotalKwh && md.monthlyTotalKwh[idx] !== undefined) ? (parseFloat(md.monthlyTotalKwh[idx]) || 0) : modelTotalM;
    const loadM = sg.simLoadSource === 'model' ? modelTotalM : meterM;

    const pvDay = pvM / m.days, loadDay = loadM / m.days;
    const directDay = Math.min(pvDay * 0.86, loadDay * Math.min(0.85, directRatioBase * (m.acShare > 0 ? 1.15 : 1.0)));
    const surplusPvDay = Math.max(0, pvDay - directDay), remLoadDay = Math.max(0, loadDay - directDay);
    const chargedIntoBatDay = Math.min(surplusPvDay * 0.90, (usableBatKwh * m.activeCycleFactor) / batEff);
    const dischargedFromBatDay = Math.min(remLoadDay, chargedIntoBatDay * batEff);

    const directM = directDay * m.days, batM = dischargedFromBatDay * m.days, selfTotalM = directM + batM;
    const gridWithBatM = Math.max(0, loadM - selfTotalM), gridNoBatM = Math.max(0, loadM - directM);
    const exportWithBatM = Math.max(0, pvM - directM - ((dischargedFromBatDay / batEff) * m.days)), exportNoBatM = Math.max(0, pvM - directM);

    sumLoad += loadM; sumPv += pvM; sumDirect += directM; sumBatDischarged += batM;
    sumGridWithBat += gridWithBatM; sumGridNoBat += gridNoBatM; sumExportWithBat += exportWithBatM; sumExportNoBat += exportNoBatM;

    return {
      m: m.m, meterM, hpModelM, loadM, pvM, directM, batM, gridWithBatM, exportWithBatM,
      selfSuffPct: loadM > 0 ? Math.min(100, (selfTotalM / loadM) * 100) : 0,
      selfSuffNoBatPct: loadM > 0 ? Math.min(100, (directM / loadM) * 100) : 0
    };
  });

  const selfSuffNoBatAnnualPct = sumLoad > 0 ? (sumDirect / sumLoad) * 100 : 0;
  const selfSuffWithBatAnnualPct = sumLoad > 0 ? ((sumDirect + sumBatDischarged) / sumLoad) * 100 : 0;
  const eqFullCycles = usableBatKwh > 0 ? (sumBatDischarged / usableBatKwh) : 0;
  const pGrid = Math.max(0.01, parseFloat(sg.gridImportPriceEur) || 0.178);
  const pExp = sg.exportMode === 'zero' ? 0 : Math.max(0, parseFloat(sg.exportPriceEur) || 0.055);

  const costNoPvEur = sumLoad * pGrid;
  const costPvOnlyEur = Math.max(0, (sumGridNoBat * pGrid) - (sumExportNoBat * pExp));
  const costPvWithBatEur = Math.max(0, (sumGridWithBat * pGrid) - (sumExportWithBat * pExp));
  const batteryExtraSavingsEur = Math.max(0, costPvOnlyEur - costPvWithBatEur);
  const totalPvAndBatSavingsEur = Math.max(0, costNoPvEur - costPvWithBatEur);
  const batPaybackYears = batteryExtraSavingsEur > 0 ? ((parseFloat(sg.batteryInvestEur) || 0) / batteryExtraSavingsEur) : 0;

  return { months, usableBatKwh, sumLoad, sumPv, sumDirect, sumBatDischarged, sumGridWithBat, sumGridNoBat, sumExportWithBat, sumExportNoBat, selfSuffNoBatAnnualPct, selfSuffWithBatAnnualPct, eqFullCycles, costNoPvEur, costPvOnlyEur, costPvWithBatEur, batteryExtraSavingsEur, totalPvAndBatSavingsEur, batPaybackYears };
}

// Krovni izračun vseh toplotnih izgub in bilance hiše
function calculateAllTotals() {
  const deltaT = Math.max(0, state.boundary.ti - state.boundary.te);
  const wallsQ = state.walls.reduce((acc, el) => acc + calcAssembly(el).qLoss, 0);
  const roofsQ = state.roofs.reduce((acc, el) => acc + calcAssembly(el).qLoss, 0);
  const floorsQ = state.floors.reduce((acc, el) => acc + calcAssembly(el).qLoss, 0);

  const envelopeMeetsPures =
    state.walls.every(el => calcAssembly(el).uVal <= (el.name.toLowerCase().includes('cokel') ? 0.25 : STANDARD_LIMITS.walls.puresU)) &&
    state.roofs.every(el => calcAssembly(el).uVal <= STANDARD_LIMITS.roofs.puresU) &&
    state.floors.every(el => calcAssembly(el).uVal <= STANDARD_LIMITS.floors.puresU);

  const envelopeMeetsPassive =
    state.walls.every(el => calcAssembly(el).uVal <= (el.name.toLowerCase().includes('cokel') ? 0.20 : STANDARD_LIMITS.walls.passiveU)) &&
    state.roofs.every(el => calcAssembly(el).uVal <= STANDARD_LIMITS.roofs.passiveU) &&
    state.floors.every(el => calcAssembly(el).uVal <= STANDARD_LIMITS.floors.passiveU);

  let windowsQ = 0, solarGainKwh = 0;
  state.windows.forEach(w => {
    const area = (parseFloat(w.w) || 0) * (parseFloat(w.h) || 0) * (parseFloat(w.count) || 0);
    windowsQ += area * (parseFloat(w.uw) || 0) * deltaT * (parseFloat(w.fx) || 1);
    const orientObj = SOLAR_WINTER_IRR[w.orient] || SOLAR_WINTER_IRR.J;
    solarGainKwh += area * orientObj.kwhM2 * (parseFloat(w.g) || 0.50) * 0.70 * 0.75 * 0.85;
  });

  const doorsQ = state.doors.reduce((acc, d) => acc + (parseFloat(d.area) || 0) * (parseFloat(d.ud) || 0) * deltaT * (parseFloat(d.fx) || 1), 0);
  const totalEnvArea =
    state.walls.reduce((a, x) => a + (parseFloat(x.area) || 0), 0) +
    state.roofs.reduce((a, x) => a + (parseFloat(x.area) || 0), 0) +
    state.floors.reduce((a, x) => a + (parseFloat(x.area) || 0), 0) +
    state.windows.reduce((a, w) => a + (w.w * w.h * w.count || 0), 0) +
    state.doors.reduce((a, d) => a + (parseFloat(d.area) || 0), 0);

  if (state.bridges && state.bridges.enabled === undefined) {
    state.bridges.enabled = true;
  }
  const bridgesRawQ = state.bridges.useFlatRate
    ? totalEnvArea * (parseFloat(state.bridges.flatDeltaU) || 0) * deltaT
    : state.bridges.items.reduce((acc, b) => acc + (parseFloat(b.length) || 0) * (parseFloat(b.psi) || 0) * deltaT * (parseFloat(b.fx) || 1), 0);
  const bridgesQ = (state.bridges && state.bridges.enabled === false) ? 0 : bridgesRawQ;

  const vol = (parseFloat(state.ventilation.volumeArea) || 0) * (parseFloat(state.ventilation.ceilingHeight) || 2.5);
  const ventNaturalQ = 0.34 * vol * (parseFloat(state.ventilation.airChanges) || 0) * deltaT;
  const ventQ = state.ventilation.enabled ? ventNaturalQ * (1 - Math.min(95, Math.max(0, parseFloat(state.ventilation.heatRecoveryEff) || 0)) / 100) : 0;

  const totalW = wallsQ + roofsQ + floorsQ + windowsQ + doorsQ + bridgesQ + ventQ;
  const grossHeatingKwh = (totalW / 1000) * (parseFloat(state.boundary.hours) || 1900);
  const netHeatingKwh = Math.max(500, grossHeatingKwh - solarGainKwh);
  const heatedArea = Math.max(1, parseFloat(state.boundary.heatedArea) || 180);

  const dhwWell = calcDhwAndWell(netHeatingKwh);
  const hp = state.hpSettings;
  const isWaterHp = hp.selectedHpFuelId === 'tc_voda';
  const hpScop = isWaterHp ? dhwWell.systemScop : (parseFloat(state.fuels[1].eff) || 3.5);
  const dhwCop = isWaterHp ? (parseFloat(state.dhwAndWell.mainHpDhwCop) || 3.1) : 2.6;

  const annualHeatElKwh = netHeatingKwh / hpScop, annualDhwElKwh = dhwWell.annualDhwKwh / dhwCop;
  const modelHpElKwh = annualHeatElKwh + annualDhwElKwh;
  const autoHpElAtTeKw = (totalW / 1000) / Math.max(1.2, parseFloat(hp.copAtDesignTe) || 4.3) + ((parseFloat(hp.auxPumpsWatts) || 0) / 1000);
  const effectiveHpElAtTeKw = hp.peakElMode === 'manual' ? (parseFloat(hp.manualPeakElKw) || 0) : autoHpElAtTeKw;
  const solarBatSim = calcSolarAndBatterySim(annualHeatElKwh, annualDhwElKwh);

  return {
    wallsQ, roofsQ, floorsQ, windowsQ, doorsQ, bridgesQ, bridgesRawQ, ventQ, ventNaturalQ, totalW, totalKw: totalW / 1000,
    grossHeatingKwh, solarGainKwh, netHeatingKwh, annualDhwKwh: dhwWell.annualDhwKwh, annualKwh: dhwWell.totalThermalKwh,
    specificKwh: netHeatingKwh / heatedArea, specificW: totalW / heatedArea, totalEnvArea, dhwWell,
    annualHeatElKwh, annualDhwElKwh, modelHpElKwh, autoHpElAtTeKw, effectiveHpElAtTeKw, solarBatSim,
    envelopeMeetsPures, envelopeMeetsPassive
  };
}

// Izračun letnega stroška za posamezni energent (ogrevanje + STV)
function calcFuelAnnualCost(fuel, heatingKwh, dhwKwh = 0) {
  const eff = Math.max(0.1, parseFloat(fuel.eff) || 1), ePerUnit = Math.max(0.1, parseFloat(fuel.energyPerUnit) || 1);
  const price = Math.max(0, parseFloat(fuel.price) || 0);
  const elPrice = state.fuels[0] ? (parseFloat(state.fuels[0].price) || 0.17) : 0.17;
  const heatingEur = (heatingKwh / (eff * ePerUnit)) * price;

  let dhwEur = 0;
  const mode = state.dhwAndWell.dhwSourceMode || 'main';
  const mainHpDhwCop = Math.max(1.2, parseFloat(state.dhwAndWell.mainHpDhwCop) || 3.1);
  const sanitaryHpCop = Math.max(1.2, parseFloat(state.dhwAndWell.sanitaryHpCop) || 2.8);

  if (dhwKwh > 0) {
    if (mode === 'main') {
      dhwEur = (fuel.id === 'tc_voda' || fuel.id === 'tc_zrak')
        ? (dhwKwh / (fuel.id === 'tc_voda' ? mainHpDhwCop : Math.max(1.8, mainHpDhwCop - 0.5))) * price
        : (dhwKwh / (eff * ePerUnit)) * price;
    } else if (mode === 'sanitary_hp') dhwEur = (dhwKwh / sanitaryHpCop) * elPrice;
    else if (mode === 'el_boiler') dhwEur = dhwKwh * elPrice;
    else if (mode === 'combo') {
      const wCost = (fuel.id === 'tc_voda' || fuel.id === 'tc_zrak') ? ((dhwKwh * 0.6) / mainHpDhwCop) * price : ((dhwKwh * 0.6) / (eff * ePerUnit)) * price;
      dhwEur = wCost + (dhwKwh * 0.4 * elPrice);
    }
  }
  return { heatingEur, dhwEur, annualEur: heatingEur + dhwEur, costPerEffectiveKwh: price / (eff * ePerUnit) };
}