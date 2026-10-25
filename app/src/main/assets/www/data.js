const APP_VERSION = '10.2';

const STANDARD_LIMITS = {
  walls: { puresU: 0.18, passiveU: 0.15 },
  roofs: { puresU: 0.14, passiveU: 0.10 },
  floors: { puresU: 0.25, passiveU: 0.15 }
};

const M_GROUPS = [
  'Toplotne izolacije','Strešne kritine in zračni kanali','Zidaki in beton',
  'Ometi, malte in estrihi','Les, suhomontaža in obloge','Folije in hidroizolacije','Ostalo'
];

const RAW_MATS = [
  ['eps_graf_70',0,'Grafitni EPS 70/80 (fasadni stiropor)',16,0.031,30,16,1450,'#64748b'],
  ['eps_graf_100',0,'Grafitni EPS 100 (obremenjeni)',12,0.030,40,20,1450,'#475569'],
  ['eps_beli_70',0,'Beli fasadni EPS 70',16,0.039,25,15,1450,'#e2e8f0'],
  ['eps_80',0,'Talni EPS 80',8,0.037,35,18,1450,'#d1d5db'],
  ['eps_100',0,'Talni EPS 100 (pod estrihom)',10,0.036,40,20,1450,'#cbd5e1'],
  ['eps_150',0,'Talni EPS 150 (trdi)',10,0.034,50,25,1450,'#94a3b8'],
  ['eps_200',0,'Talni EPS 200 (visoko obremenjeni)',10,0.033,60,30,1450,'#64748b'],
  ['eps_t650',0,'Elastificiran EPS T650 (udarni zvok)',3,0.042,20,12,1450,'#bfdbfe'],
  ['xps_300',0,'XPS 300 / Stirodur (cokel, temelj)',10,0.035,150,33,1450,'#38bdf8'],
  ['xps_500',0,'XPS 400/500 (pod temeljno ploščo)',12,0.034,150,40,1450,'#0284c7'],
  ['mw_fasada',0,'Kamena volna - fasadna plošča/lamela',16,0.035,1,110,1030,'#facc15'],
  ['mw_streha',0,'Kamena volna - strešna (DP-5 / DP-8)',25,0.035,1,60,1030,'#fde047'],
  ['mw_tla',0,'Kamena volna - talna (Knauf TPS/TPT)',3,0.036,1,140,1030,'#eab308'],
  ['gw_035',0,'Steklena volna 035 (Unifit / NatuRoll)',16,0.035,1,24,1030,'#fde047'],
  ['gw_032',0,'Steklena volna 032 (visokoizolativna)',16,0.032,1,32,1030,'#fef08a'],
  ['pir_022',0,'PIR / PUR izolacijska plošča (alu/flis)',10,0.022,60,32,1400,'#fcd34d'],
  ['gutex',0,'Lesnovlaknena plošča (Gutex / Steico)',8,0.042,5,160,2100,'#d97706'],
  ['celuloza',0,'Vpihana celulozna izolacija',25,0.039,2,50,2020,'#a1a1aa'],
  ['penjeno_steklo',0,'Penjeno steklo (Glapor / Foamglas)',15,0.045,50000,130,840,'#475569'],
  ['perlit',0,'Perlit / ekspandirana glina (nasutje)',10,0.060,3,100,900,'#d6d3d1'],
  ['zrak_prezr',1,'🌬️ Prezračevan zračni kanal pod streho (kontraletve / zračni most)',5,1.000,1,1.2,1005,'#bae6fd',1],
  ['zrak_slabo_prezr',1,'Slabše prezračevan zračni sloj',3,0.350,1,1.2,1005,'#e0f2fe'],
  ['zrak_mir',1,'Mirujoč (neprezračevan) zračni sloj',2,0.180,1,1.2,1005,'#f0f9ff'],
  ['krit_gerard',1,'Strešnik Gerard Klasik (pločevina s kamnitim posipom)',0.2,50.000,100000,7800,480,'#991b1b'],
  ['krit_tondach',1,'Opečni strešnik Tondach (glinena kritina)',1.5,1.000,40,2000,800,'#dc2626'],
  ['krit_bramac',1,'Betonski strešnik Bramac / Creaton',1.8,1.500,60,2200,1000,'#57534e'],
  ['krit_trapez',1,'Trapezna pločevina / pločevinasta kritina',0.1,50.000,100000,7850,460,'#475569'],
  ['krit_trapez_filc',1,'Trapezna pločevina s filcem (antikondenzna)',0.3,0.500,50000,2500,800,'#334155'],
  ['krit_sendvic',1,'Sendvič strešni panel (trapez + PUR polnilo)',4.0,0.024,10000,45,1400,'#94a3b8'],
  ['krit_valovitka',1,'Vlaknocementna valovitka (Esal / Eternit)',0.6,0.350,50,1650,1000,'#78716c'],
  ['krit_tegola',1,'Bitumenska skodla (Tegola)',0.5,0.230,20000,1100,1000,'#292524'],
  ['opeka_votla',2,'Votla opeka / modularni blok (29/19 cm)',29,0.480,8,900,1000,'#ea580c'],
  ['opeka_termo',2,'Termo brušena opeka (Porotherm Profi)',30,0.190,8,680,1000,'#f97316'],
  ['opeka_termo_izo',2,'Termo opeka polnjena z volno (Porotherm IZO)',38,0.090,6,600,1000,'#fb923c'],
  ['opeka_polna',2,'Polna opeka (starejša gradnja)',25,0.760,10,1800,1000,'#b91c1c'],
  ['ytong',2,'Porobeton Ytong Termo (zun. zidaki)',30,0.110,6,400,1050,'#f1f5f9'],
  ['ytong_pregradni',2,'Porobeton Ytong (pregradne plošče 10/12/15 cm)',10,0.135,6,500,1050,'#e2e8f0'],
  ['siporex_stari',2,'Siporex / starejši plinobeton',25,0.160,6,550,1050,'#cbd5e1'],
  ['beton_votlak',2,'Betonski votlak (kletni zidak)',25,1.150,25,1400,1000,'#9ca3af'],
  ['ab_beton',2,'Armirani beton (plošča, zid, temelj)',15,2.100,100,2400,1000,'#6b7280'],
  ['pusti_beton',2,'Podložni / pusti beton',10,1.400,60,2100,1000,'#94a3b8'],
  ['tampon',2,'Gramozni tampon / nasip (0-32 mm)',25,1.800,3,1900,840,'#a8a29e'],
  ['zemljina',2,'Zemljina / ilovica pod temeljem',50,1.500,10,1800,1200,'#78350f'],
  ['omet_notranji',3,'Notranji apneno-cementni omet',1.5,0.800,15,1600,1000,'#e5e7eb'],
  ['omet_mavcni',3,'Notranji strojni mavčni omet',1.5,0.350,10,1000,1000,'#f3f4f6'],
  ['kit_kemaglet',3,'Izravnalna masa (Kemaglet FX / Jubolin)',0.3,0.550,12,1300,1000,'#f8fafc'],
  ['malta_zidar',3,'Klasična zidarska malta / grobi omet',2.0,0.850,15,1700,1000,'#d1d5db'],
  ['malta_termo',3,'Toplotnoizolacijska (termo) malta',2.0,0.190,10,700,1000,'#e2e8f0'],
  ['lepilo_ytong',3,'Tankoslojna lepilna malta (Ytong)',0.3,0.800,20,1500,1000,'#cbd5e1'],
  ['fasadno_lepilo',3,'Fasadno lepilo + mrežica (MultiWhite)',0.4,0.800,25,1500,1000,'#cbd5e1'],
  ['omet_fasadni',3,'Zaključni fasadni omet (silikon/akril)',0.2,0.700,40,1600,1000,'#fef3c7'],
  ['estrih_cem',3,'Cementni estrih (tlak)',6.0,1.400,30,2000,1000,'#9ca3af'],
  ['estrih_anh',3,'Anhidritni samorazlivni estrih',5.0,1.200,15,2100,1000,'#d4d4d8'],
  ['estrih_suhi',3,'Suhi montažni estrih (Knauf Brio / Fermacell)',2.3,0.380,16,1150,1100,'#e2e8f0'],
  ['knauf',4,'Mavčnokartonska plošča (Knauf GKB)',1.25,0.250,8,800,1050,'#f8fafc'],
  ['knauf_zelena',4,'Impregnirana plošča (Knauf GKBI zelena)',1.25,0.250,10,820,1050,'#bbf7d0'],
  ['fermacell',4,'Mavčnovlaknena plošča (Fermacell)',1.25,0.320,13,1150,1100,'#e2e8f0'],
  ['aquapanel',4,'Cementno vezana plošča (Aquapanel)',1.25,0.350,40,1150,1000,'#94a3b8'],
  ['osb',4,'OSB 3 plošča',1.8,0.130,150,620,1700,'#d97706'],
  ['deske_opaz',4,'Lesene deske / strešni opaž (colarice)',2.4,0.130,35,480,1600,'#f59e0b'],
  ['les_smreka',4,'Konstrukcijski les (smreka/jelka - špirovci)',14.0,0.130,40,470,1600,'#b45309'],
  ['parket',4,'Leseni parket (hrast)',1.4,0.180,50,700,1600,'#92400e'],
  ['laminat',4,'Laminat s penasto podlogo',1.0,0.150,100,800,1500,'#b45309'],
  ['keramika',4,'Keramične ploščice z lepilom',1.2,1.050,150,2000,920,'#cbd5e1'],
  ['vinil',4,'Vinilna obloga (LVT)',0.5,0.230,5000,1400,1200,'#78716c'],
  ['granit',4,'Granit / marmor / naravni kamen',2.0,2.800,1000,2700,800,'#64748b'],
  ['parna_zapora',5,'Parna zapora PE folija (d=0.02cm, Sd=20m)',0.02,0.330,100000,950,1800,'#2563eb'],
  ['parna_zapora_alu',5,'Alu parna zapora (d=0.02cm, Sd=100m)',0.02,0.330,500000,1100,1500,'#1d4ed8'],
  ['parna_ovira',5,'Parna ovira za mansardo (d=0.05cm, Sd=5m)',0.05,0.330,10000,900,1700,'#60a5fa'],
  ['parna_ovira_vario',5,'Pametna parna ovira (Vario, Sd=2.5m)',0.05,0.330,5000,900,1700,'#38bdf8'],
  ['sek_kritina',5,'Paroprepustna sekundarna kritina (d=0.05cm, Sd=0.02m)',0.05,0.330,40,600,1500,'#34d399'],
  ['bitumen',5,'Bitumenska hidroizolacija (Izotekt V4, 0.4cm)',0.4,0.230,50000,1100,1000,'#1e293b'],
  ['hi_tekoca',5,'Tekoča hidroizolacija (Hidrozol / Mapelastic, 0.3cm)',0.3,0.700,1500,1400,1000,'#0ea5e9'],
  ['epdm_membrana',5,'EPDM / TPO strešna membrana (d=0.15cm)',0.15,0.200,80000,1200,1100,'#334155'],
  ['cepasta_folija',5,'Čepasta (gumbasta) folija za temelje',0.8,0.350,50000,950,1800,'#0f172a'],
  ['custom',6,'Poljuben material (ročni vnos)',5.0,0.100,10,500,1000,'#a855f7']
];

const BASE_MATERIALS = RAW_MATS.map(r => ({
  id: r[0], group: M_GROUPS[r[1]], name: r[2], defD: r[3], lambda: r[4], mu: r[5], rho: r[6], c: r[7], color: r[8], ventilated: !!r[9]
}));

const SLOVENE_CITIES = [
  { name: 'Murska Sobota / Prekmurje', te: -13 },
  { name: 'Maribor / Podravska', te: -13 },
  { name: 'Ljubljana / Osrednja SLO', te: -13 },
  { name: 'Celje / Savinjska', te: -13 },
  { name: 'Kranj / Gorenjska', te: -15 },
  { name: 'Kranjska Gora / Alp. svet', te: -18 },
  { name: 'Novo mesto / Dolenjska', te: -14 },
  { name: 'Nova Gorica / Goriška', te: -9 },
  { name: 'Koper / Obala', te: -5 },
  { name: 'Postojna / Notranjska', te: -15 }
];

const PRESET_PSI_BRIDGES = [
  { name: 'Stik talne plošče in cokla (izolirano z XPS)', psi: 0.10 },
  { name: 'Stik talne plošče in cokla (neizolirano / slabo)', psi: 0.35 },
  { name: 'Okenska špaleta – RAL montaža s toplotnim okvirjem', psi: 0.04 },
  { name: 'Okenska špaleta – Klasična vgradnja ob oknu', psi: 0.12 },
  { name: 'Stik stene in ravne strehe / venca', psi: 0.12 },
  { name: 'Stik stene in poševne strehe (kapni venec)', psi: 0.08 },
  { name: 'Vogal zgradbe (zunanji vogal 90°)', psi: -0.05 },
  { name: 'Vmesna stropna plošča preboja skozi fasadni ovoj', psi: 0.06 }
];

const SOLAR_WINTER_IRR = {
  J: { label: 'Jug (J)', kwhM2: 340 },
  JV_JZ: { label: 'Jugovzhod / Jugozahod', kwhM2: 270 },
  V_Z: { label: 'Vzhod / Zahod (V/Z)', kwhM2: 195 },
  S: { label: 'Sever (S)', kwhM2: 90 },
  STREHA: { label: 'Strešno okno (naklon)', kwhM2: 290 }
};

const MONTHS_DATA = [
  { m:'Jan', days:31, pvShare:0.035, heatShare:0.200, acShare:0.00, activeCycleFactor:0.65 },
  { m:'Feb', days:28, pvShare:0.055, heatShare:0.165, acShare:0.00, activeCycleFactor:0.72 },
  { m:'Mar', days:31, pvShare:0.090, heatShare:0.130, acShare:0.00, activeCycleFactor:0.82 },
  { m:'Apr', days:30, pvShare:0.115, heatShare:0.070, acShare:0.00, activeCycleFactor:0.88 },
  { m:'Maj', days:31, pvShare:0.130, heatShare:0.015, acShare:0.05, activeCycleFactor:0.90 },
  { m:'Jun', days:30, pvShare:0.135, heatShare:0.000, acShare:0.25, activeCycleFactor:0.92 },
  { m:'Jul', days:31, pvShare:0.140, heatShare:0.000, acShare:0.40, activeCycleFactor:0.94 },
  { m:'Avg', days:31, pvShare:0.125, heatShare:0.000, acShare:0.30, activeCycleFactor:0.92 },
  { m:'Sep', days:30, pvShare:0.085, heatShare:0.015, acShare:0.00, activeCycleFactor:0.86 },
  { m:'Okt', days:31, pvShare:0.050, heatShare:0.075, acShare:0.00, activeCycleFactor:0.76 },
  { m:'Nov', days:30, pvShare:0.022, heatShare:0.140, acShare:0.00, activeCycleFactor:0.60 },
  { m:'Dec', days:31, pvShare:0.018, heatShare:0.190, acShare:0.00, activeCycleFactor:0.55 }
];

function getInitialState() {
  return {
    version: APP_VERSION,
    darkMode: false,
    activeTab: 'walls',
    scenarioA: null,
    bomWastePct: 5,
    customMaterials: [],
    materialOverrides: {},
    rafterHelper: { widthCm: 10, spacingCm: 80 },
    boundary: { ti: 21, te: -13, phiI: 50, phiE: 80, heatedArea: 180, hours: 1900 },
    dhwAndWell: {
      dhwEnabled: true, dhwSourceMode: 'main', mainHpDhwCop: 3.1, sanitaryHpCop: 2.8,
      persons: 4, litersPerPerson: 45, tempCold: 10, tempHot: 50, tankLossPct: 15,
      wellPumpAutoSync: true, hpThermalPowerKw: 8.0, hpMachineCop: 5.4, wellPumpWatts: 350,
      wellWaterDeltaT: 3.5, summerIndoorTemp: 25.0, summerIndoorRh: 60
    },
    hpSettings: {
      selectedHpFuelId: 'tc_voda', nominalThermalKw: 8.0, minModulationKw: 2.2, maxThermalKwAtPeak: 8.5,
      peakElMode: 'manual', manualPeakElKw: 1.95, maxCompressorElKw: 2.60, copAtDesignTe: 4.30,
      auxPumpsWatts: 390, bivalentTemp: -7.0, backupHeaterKw: 0.0, fuseAmps: 20, baseHousePeakKw: 3.5
    },
    meterData: {
      enabled: true, totalMeterKwh: 4880, vtKwh: 2247, mtKwh: 2633, measuredHpElKwh: 1985,
      measuredAcElKwh: 1031, measuredHouseholdKwh: 1864, annualBillEur: 871,
      monthlyTotalKwh: [680, 560, 460, 340, 270, 290, 350, 340, 280, 350, 440, 520]
    },
    solarAndGrid: {
      pvKwp: 13.0, specificYield: 1100, simLoadSource: 'meter', batteryCapKwh: 15.0,
      batteryDodPct: 90, batteryEffPct: 90, directSelfConsPct: 38, exportMode: 'sell',
      exportPriceEur: 0.055, gridImportPriceEur: 0.178, batteryInvestEur: 3500
    },
    hydraulics: { floorDeltaT: 5.0 },
    fuels: [
      { id: 'tc_voda', name: 'TČ voda–voda (s potopno črp.)', unit: '€/kWh', price: 0.170, eff: 4.54, energyPerUnit: 1.0 },
      { id: 'tc_zrak', name: 'TČ zrak–voda', unit: '€/kWh', price: 0.170, eff: 3.50, energyPerUnit: 1.0 },
      { id: 'drva', name: 'Drva (bukev, uplinjevalni)', unit: '€/prm', price: 95.0, eff: 0.85, energyPerUnit: 2100 },
      { id: 'peleti', name: 'Lesni peleti (A1)', unit: '€/tono', price: 360.0, eff: 0.90, energyPerUnit: 4800 },
      { id: 'plin', name: 'Zemeljski plin', unit: '€/kWh', price: 0.095, eff: 0.96, energyPerUnit: 1.0 },
      { id: 'olje', name: 'Kurilno olje (ELKO)', unit: '€/liter', price: 1.180, eff: 0.92, energyPerUnit: 10.0 },
      { id: 'el_dir', name: 'Direktna elektrika / IR', unit: '€/kWh', price: 0.170, eff: 1.00, energyPerUnit: 1.0 }
    ],
    walls: [
      {
        id: 'w1', name: 'Zunanji zid - fasada (opeka + 16 cm grafitni EPS)', area: 240, fx: 1.0, rsi: 0.13, rse: 0.04, targetU: 0.18,
        layers: [
          { matId: 'omet_notranji', name: 'Notranji apneno-cementni omet', d: 1.5, lambda: 0.800, mu: 15, rho: 1600, c: 1000, woodPct: 0 },
          { matId: 'opeka_votla', name: 'Votla opeka / modularni blok', d: 29.0, lambda: 0.480, mu: 8, rho: 900, c: 1000, woodPct: 0 },
          { matId: 'eps_graf_70', name: 'Grafitni EPS 70/80', d: 16.0, lambda: 0.031, mu: 30, rho: 16, c: 1450, woodPct: 0 },
          { matId: 'fasadno_lepilo', name: 'Fasadno lepilo + mrežica', d: 0.4, lambda: 0.800, mu: 25, rho: 1500, c: 1000, woodPct: 0 },
          { matId: 'omet_fasadni', name: 'Zaključni fasadni omet', d: 0.2, lambda: 0.700, mu: 40, rho: 1600, c: 1000, woodPct: 0 }
        ]
      },
      {
        id: 'w2', name: 'Cokel / podzidek', area: 25, fx: 1.0, rsi: 0.13, rse: 0.04, targetU: 0.25,
        layers: [
          { matId: 'ab_beton', name: 'Armirani beton', d: 25.0, lambda: 2.100, mu: 100, rho: 2400, c: 1000, woodPct: 0 },
          { matId: 'xps_300', name: 'XPS 300 / Stirodur', d: 10.0, lambda: 0.035, mu: 150, rho: 33, c: 1450, woodPct: 0 },
          { matId: 'fasadno_lepilo', name: 'Fasadno lepilo + zaključni sloj', d: 0.5, lambda: 0.800, mu: 25, rho: 1500, c: 1000, woodPct: 0 }
        ]
      }
    ],
    roofs: [
      {
        id: 'r1', name: 'Poševna streha / mansarda (špirovci + zračni most + Gerard Klasik)', area: 115, fx: 1.0, rsi: 0.10, rse: 0.04, targetU: 0.14,
        layers: [
          { matId: 'knauf', name: 'Mavčnokartonska plošča (Knauf GKB)', d: 1.25, lambda: 0.250, mu: 8, rho: 800, c: 1050, woodPct: 0 },
          { matId: 'parna_zapora', name: 'Parna zapora PE folija (Sd=20m)', d: 0.02, lambda: 0.330, mu: 100000, rho: 950, c: 1800, woodPct: 0 },
          { matId: 'gw_035', name: 'Steklena volna 035 (pod špirovci - križno)', d: 14.0, lambda: 0.035, mu: 1, rho: 24, c: 1030, woodPct: 0 },
          { matId: 'gw_035', name: 'Steklena volna 035 (med špirovci - 12.5% lesa)', d: 16.0, lambda: 0.035, mu: 1, rho: 24, c: 1030, woodPct: 12.5 },
          { matId: 'deske_opaz', name: 'Lesene deske / strešni opaž (colarice)', d: 2.4, lambda: 0.130, mu: 35, rho: 480, c: 1600, woodPct: 0 },
          { matId: 'sek_kritina', name: 'Paroprepustna sekundarna kritina', d: 0.05, lambda: 0.330, mu: 40, rho: 600, c: 1500, woodPct: 0 },
          { matId: 'zrak_prezr', name: '🌬️ Prezračevan zračni kanal pod streho', d: 5.0, lambda: 1.000, mu: 1, rho: 1.2, c: 1005, woodPct: 0 },
          { matId: 'krit_gerard', name: 'Strešnik Gerard Klasik (pločevina s posipom)', d: 0.2, lambda: 50.000, mu: 100000, rho: 7800, c: 480, woodPct: 0 }
        ]
      }
    ],
    floors: [
      {
        id: 'f1', name: 'Tla na terenu', area: 95, fx: 0.5, rsi: 0.17, rse: 0.00, targetU: 0.25,
        layers: [
          { matId: 'parket', name: 'Leseni parket / keramika', d: 1.5, lambda: 0.180, mu: 50, rho: 700, c: 1600, woodPct: 0 },
          { matId: 'estrih_cem', name: 'Cementni estrih', d: 6.0, lambda: 1.400, mu: 30, rho: 2000, c: 1000, woodPct: 0 },
          { matId: 'eps_100', name: 'Talni EPS 100', d: 10.0, lambda: 0.036, mu: 40, rho: 20, c: 1450, woodPct: 0 },
          { matId: 'bitumen', name: 'Bitumenska hidroizolacija V4', d: 0.4, lambda: 0.230, mu: 50000, rho: 1100, c: 1000, woodPct: 0 },
          { matId: 'ab_beton', name: 'Temeljna AB plošča', d: 15.0, lambda: 2.100, mu: 100, rho: 2400, c: 1000, woodPct: 0 }
        ]
      }
    ],
    windows: [
      { id: 'win1', name: 'Troslojna PVC okna (Južna stran)', w: 1.4, h: 1.4, count: 5, uw: 0.85, g: 0.52, orient: 'J', fx: 1.0 },
      { id: 'win2', name: 'Panoramska drsna stena (Jugozahod)', w: 2.6, h: 2.2, count: 1, uw: 0.80, g: 0.50, orient: 'JV_JZ', fx: 1.0 },
      { id: 'win3', name: 'Okna vzhod / zahod', w: 1.2, h: 1.4, count: 4, uw: 0.85, g: 0.52, orient: 'V_Z', fx: 1.0 },
      { id: 'win4', name: 'Manjša okna sever (kopalnica, hodnik)', w: 0.8, h: 1.0, count: 3, uw: 0.90, g: 0.50, orient: 'S', fx: 1.0 }
    ],
    doors: [
      { id: 'd1', name: 'Glavna vhodna vrata (izolirana)', area: 2.2, ud: 1.10, fx: 1.0 },
      { id: 'd2', name: 'Podstrešne stopnice Minka Polar Extreme (114x70)', area: 0.80, ud: 0.59, fx: 0.8 }
    ],
    bridges: {
      useFlatRate: false, flatDeltaU: 0.05,
      items: [
        { id: 'tb1', name: 'Stik zunanji zid – temelj / cokel', length: 42, psi: 0.15, fx: 1.0 },
        { id: 'tb2', name: 'Špalete in preklade okoli oken', length: 58, psi: 0.08, fx: 1.0 },
        { id: 'tb3', name: 'Stik streha – zunanji zid (venec)', length: 42, psi: 0.12, fx: 1.0 }
      ]
    },
    ventilation: { enabled: true, volumeArea: 180, ceilingHeight: 2.55, airChanges: 0.40, heatRecoveryEff: 85 },
    rooms: [
      { id: 'rm1', name: 'Dnevna soba + kuhinja in jedilnica', area: 45, ti: 21.5, expFactor: 1.1, spacing: 15 },
      { id: 'rm2', name: 'Kopalnica zgoraj (walk-in)', area: 9, ti: 24.0, expFactor: 1.15, spacing: 10 },
      { id: 'rm3', name: 'Spalnica', area: 16, ti: 20.0, expFactor: 1.0, spacing: 15 },
      { id: 'rm4', name: 'Otroška soba 1', area: 14, ti: 21.5, expFactor: 1.1, spacing: 15 },
      { id: 'rm5', name: 'Otroška soba 2', area: 14, ti: 21.5, expFactor: 1.1, spacing: 15 },
      { id: 'rm6', name: 'Hodnik in stopnišče', area: 18, ti: 20.0, expFactor: 0.8, spacing: 20 }
    ],
    roi: {
      selectedFuelId: 'tc_zrak',
      measures: [
        { id: 'm1', name: 'Fasada 16 cm grafitni EPS 0.031 (300 m²)', area: 300, uBefore: 1.15, uAfter: 0.17, invest: 15500, subsidy: 3000 },
        { id: 'm2', name: 'Izolacija poševne strehe / mansarde (30 cm volna)', area: 115, uBefore: 0.65, uAfter: 0.13, invest: 4200, subsidy: 1100 },
        { id: 'm3', name: 'Menjava starih oken za troslojna PVC (Uw=0.85)', area: 25, uBefore: 2.40, uAfter: 0.85, invest: 8500, subsidy: 0 }
      ]
    }
  };
}

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem('heatLossState_v10_2') || localStorage.getItem('heatLossState_v10_1') || localStorage.getItem('heatLossState_v10_0') || localStorage.getItem('heatLossState_v9_0');
    if (saved) {
      const p = JSON.parse(saved), d = getInitialState();
      return {
        ...d, ...p, version: APP_VERSION,
        customMaterials: p.customMaterials || [], materialOverrides: p.materialOverrides || {},
        rafterHelper: { ...d.rafterHelper, ...(p.rafterHelper || {}) },
        dhwAndWell: { ...d.dhwAndWell, ...(p.dhwAndWell || {}) },
        hpSettings: { ...d.hpSettings, ...(p.hpSettings || {}) },
        meterData: { ...d.meterData, ...(p.meterData || {}) },
        solarAndGrid: { ...d.solarAndGrid, ...(p.solarAndGrid || {}) },
        hydraulics: { ...d.hydraulics, ...(p.hydraulics || {}) }
      };
    }
  } catch (e) {}
  return getInitialState();
}

function saveState() {
  try {
    state.version = APP_VERSION;
    localStorage.setItem('heatLossState_v10_2', JSON.stringify(state));
  } catch (e) {}
}

function getAllMaterials() {
  const ov = state.materialOverrides || {};
  const base = BASE_MATERIALS.map(m => ov[m.id] ? { ...m, ...ov[m.id], isModifiedBase: true } : m);
  return [...(state.customMaterials || []), ...base];
}