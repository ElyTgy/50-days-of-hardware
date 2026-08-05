import type { ShoppingItem } from "../types";

/** Initial shopping list seeded into an empty `shopping_items` table (or shown
 *  in-memory when Supabase isn't configured). Sourced from the parts breakdown
 *  of the 50-day challenge — Lee's Electronics where stocked, else DigiKey /
 *  AliExpress. Everything starts "not ordered" except the STM32 (already owned). */
export type SeedItem = Omit<ShoppingItem, "id" | "created_at">;

export const SHOPPING_SEED: SeedItem[] = [
  {
    part_name: "Copper foil tape",
    what_it_does:
      "Forms the capacitive touch pad electrode and improvised copper ground/match surfaces",
    days_required_for: "1, 3, 40",
    related_concepts:
      "Capacitive sensing; fringing fields; ghost touches; antenna detuning",
    link: "https://leeselectronic.com/en/product/41714-copper-tape-10mm.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "CD40106 (hex Schmitt inverter)",
    what_it_does:
      "Schmitt-trigger inverter used for relaxation oscillator and ring oscillator",
    days_required_for: "1, 10, 17",
    related_concepts:
      "Relaxation oscillator; hysteresis; ring oscillator; CMOS switching power",
    link: "https://leeselectronic.com/en/product/71863-ic-cmos-40106-hex-inverting-schmitt-triggernot.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "CD4001 (quad NOR gate)",
    what_it_does:
      "Logic gate that turns an RC oscillator into a gated / enable-able oscillator",
    days_required_for: "10",
    related_concepts: "Gated oscillator; RC timing; PWM",
    link: "https://leeselectronic.com/en/product/7188-7188iccmos4001quad2inputnorgate.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "CD4046 (CMOS PLL)",
    what_it_does:
      "Phase-locked loop IC (phase detector + VCO) to demonstrate lock and capture range",
    days_required_for: "23",
    related_concepts: "PLL; VCO; capture vs lock range; clock tree",
    link: "https://leeselectronic.com/en/product/7213-7213ICCMOS4046PLLWITHVCO.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "STM32 (or Arduino) MCU dev board",
    what_it_does:
      "Microcontroller for charge-transfer sensing firmware, PWM drive, ADC/DMA, UART and serial logging",
    days_required_for: "2, 3, 6, 8, 23, 34, 48, 49, 50",
    related_concepts:
      "Charge-transfer sensing; PWM; ISRs; volatile; atomicity; DMA; ring buffer",
    link: "",
    status: "owned",
    purchased: true,
  },
  {
    part_name: "2N3904 (NPN BJT)",
    what_it_does:
      "Small-signal NPN for beta measurement, common-emitter amp, and current mirror",
    days_required_for: "12, 13",
    related_concepts:
      "Beta spread; common-emitter amp; current mirror; Vbe drift",
    link: "https://leeselectronic.com/en/product/7178-7178TRANSISTOR2N3904NPN5PCS.html",
    status: "not ordered",
    purchased: false,
    min_quantity: 5,
  },
  {
    part_name: "2N7000 (N-channel MOSFET)",
    what_it_does:
      "Small-signal NMOS for Vth tracing, source follower, and CMOS inverter",
    days_required_for: "14, 16, 17, 18",
    related_concepts:
      "Vth; triode/saturation; pinch-off; source follower; open-drain",
    link: "https://leeselectronic.com/en/product/71801-71801PWRMOSFETNFET2N7000TO925PCS.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "CD4007 (CMOS transistor array)",
    what_it_does:
      "On-chip complementary NMOS/PMOS pair for the CMOS inverter (Day 17); Day 26 LDO pass element uses a PNP (2N3906) instead",
    days_required_for: "17, 26",
    related_concepts:
      "CMOS pair; transfer curve; static current; LDO pass element",
    link: "https://leeselectronic.com/en/product/7191-7191iccmos4007dualcomplementaryp.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "IRLZ44N (logic-level power MOSFET)",
    what_it_does:
      "Low-side power switch for inductor kickback and gate-charge / switching-loss study",
    days_required_for: "6, 15",
    related_concepts:
      "Inductive kickback; flyback; Miller plateau; gate charge; switching loss",
    link: "https://leeselectronic.com/en/product/71248-mosfet-irlz44npbf-55v-47a-n-channel-22mohm-to-220.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "1N4148 (signal diode)",
    what_it_does:
      "Flyback/clamp diode, IV-curve device, and charge-pump rectifier. The Day 18 doubler uses 2 at once and stays assembled through Day 29 — need at least 2 in hand simultaneously. Linked as a 4-pack in DO-35 (through-hole), not the single SMD SOD-123 unit.",
    days_required_for: "6, 11, 18, 29",
    related_concepts: "Flyback diode; forward drop; IV curve; charge pump",
    link: "https://leeselectronic.com/en/product/7113-diode-fast-switching-1n4148-4pcs.html",
    status: "not ordered",
    purchased: false,
    min_quantity: 2,
  },
  {
    part_name: "1N5819 (Schottky diode)",
    what_it_does:
      "Low-forward-drop diode compared against the 1N4148 on the IV curve",
    days_required_for: "11",
    related_concepts:
      "Schottky vs PN; forward drop; metal-semiconductor junction",
    link: "https://leeselectronic.com/en/product/71477-71477DIODESCHOTTKY1N581940V1A2PC.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "5.1 V Zener diode (1N4733A)",
    what_it_does: "Voltage reference for the discrete LDO error amp",
    days_required_for: "18, 26",
    related_concepts: "Voltage reference; reverse breakdown; LDO accuracy",
    link: "https://leeselectronic.com/en/product/765-765DIODE1N4733AZENERDIODE51V2PCS.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "Inductors (10 uH - 1 mH)",
    what_it_does:
      "Energy-storage element for kickback, SRF, skin-effect, and buck/boost work. Day 7 needs two in hand at once (sweeping SRF on both) — link is Lee's whole inductor category, not one product, so pick at least 2 specific values rather than ordering a single item.",
    days_required_for: "6, 7, 27",
    related_concepts: "V=L*dI/dt; SRF; skin effect; Q & saturation; buck ripple",
    link: "https://leeselectronic.com/en/category/3051-inductors",
    status: "not ordered",
    purchased: false,
    min_quantity: 2,
  },
  {
    part_name: "LM358 (op-amp)",
    what_it_does:
      "General-purpose op-amp for buffers, Schmitt trigger, LDO error amp, and diff-amp shunt sensing",
    days_required_for: "9, 20, 22, 26, 31",
    related_concepts:
      "GBW; slew rate; Schmitt trigger; phase margin; difference amp",
    link: "https://leeselectronic.com/en/product/7310-7310ICLM358NLOWPOWERDUALOPAMP.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "TL072 (FET-input op-amp)",
    what_it_does:
      "Higher-performance op-amp for inverting/non-inverting amps and integrator",
    days_required_for: "19, 20, 21, 24",
    related_concepts:
      "Virtual short; inverting/non-inverting gain; integrator; offset drift; switched-cap",
    link: "https://leeselectronic.com/en/product/7289-7289ICTL072OPERATIONAMP.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "Potentiometer (10k linear)",
    what_it_does: "Sweeps MOSFET gate voltage to trace Id-Vgs turn-on",
    days_required_for: "14",
    related_concepts: "Id-Vgs curve; threshold voltage; turn-on",
    link: "https://leeselectronic.com/en/product/71591-potentiometer-10kb.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "INA219 current-sense breakout",
    what_it_does:
      "Digital high-side/low-side current + voltage monitor for motor and battery logging",
    days_required_for: "31, 32",
    related_concepts:
      "High-side vs low-side sensing; shunt sensing; stall current; charge profiling",
    link: "https://www.digikey.com/en/products/detail/adafruit-industries-llc/904/5353628",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "0.1 ohm shunt resistor",
    what_it_does: "Low-side current-sense shunt for the DIY diff-amp ammeter",
    days_required_for: "31",
    related_concepts: "Low-side shunt; ground offset; common-mode rejection",
    link: "https://leeselectronic.com/en/product/90-90RESISTORS12W01OHMFUSIBLETVUSE.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "TP4056 charging module",
    what_it_does: "1S Li-ion/LiPo CC/CV charger to observe the charge phases",
    days_required_for: "32",
    related_concepts: "CC/CV charging; taper & cutoff; overcharge protection",
    link: "https://leeselectronic.com/en/product/15881-tp4056-charger-module-1a-5v-usb-input.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "1S LiPo battery (small)",
    what_it_does: "Cell under test for charging profile and BMS discussion",
    days_required_for: "32",
    related_concepts: "Cell voltage range; internal resistance; BMS; balancing",
    link: "https://leeselectronic.com/en/product/88340-battery-rechargeable-li-poly-37v-500mah.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "L298N dual H-bridge module (DRV8833 substitute)",
    what_it_does:
      "Dual full-bridge driver for forward / reverse / coast / brake; BJT-based (~2V drop) vs DRV8833's MOSFETs",
    days_required_for: "30",
    related_concepts:
      "H-bridge; shoot-through; dead time; coast vs brake; bootstrap",
    link: "https://leeselectronic.com/en/product/71208-h-bridge-l298n-dual-full-bridge-driver-motor.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "Small DC motor",
    what_it_does: "Load for the H-bridge and current-sensing exercises",
    days_required_for: "30, 31",
    related_concepts: "Back-EMF; braking energy; inductive load; stall current",
    link: "https://leeselectronic.com/en/product/4546-dc-motor-310-3-6v-03a-056a-3500rpm-6800rpm-l-10mm-shaft.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "Buck converter module (cheap)",
    what_it_does:
      "Real switching regulator to measure efficiency and switch-node ringing",
    days_required_for: "28",
    related_concepts:
      "Buck efficiency; switch-node ringing; synchronous rectification",
    link: "https://leeselectronic.com/en/product/714625.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "NanoVNA-H4 (+ SMA cables/adapters + SOL cal kit)",
    what_it_does:
      "Vector network analyzer to measure SRF, S11, Smith-chart impedance, and antenna resonance",
    days_required_for: "5, 7, 38, 39, 40",
    related_concepts:
      "S-parameters; VSWR; return loss; Smith chart; SOL calibration",
    link: "https://www.aliexpress.com/item/1005003551867442.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "RG58 coax ~5 m (+ SMA pigtails)",
    what_it_does:
      "Transmission line for reflection/TDR bounce and stub measurements",
    days_required_for: "34, 38",
    related_concepts:
      "Characteristic impedance; reflections; TDR; lambda/10 rule; stubs",
    link: "https://leeselectronic.com/en/product/213980-rf-extension-cable-rg58-u-sma-m-f-10-meter.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "SMA jack / connector",
    what_it_does: "Feedpoint mount for the quarter-wave monopole antenna",
    days_required_for: "39",
    related_concepts:
      "Feedpoint impedance; quarter-wave resonance; connector loss",
    link: "https://www.digikey.com/en/products/detail/linx-technologies-inc/CONSMA008/CONSMA008-ND/1577219",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "Ground plane (tin lid) + wire",
    what_it_does:
      "Radial/image ground plane and radiating element for the cut monopole",
    days_required_for: "39, 40",
    related_concepts:
      "Monopole; image antenna; standing waves; resonance trimming",
    link: "https://leeselectronic.com/en/product/225019-hook-up-wire-14awg-solid-white-per-foot.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "Passives assortment (resistors + capacitors)",
    what_it_does:
      "General RC network elements for filters, timing, biasing, gain-setting, and sense resistors (e.g. 10k, 100R, 1uF, 10nF, 4.7k, 470R, 47k, 100k)",
    days_required_for: "4, 8, 9, 13, 19, 20, 21, 22",
    related_concepts:
      "RC step response; LPF/HPF; -3 dB corner; Bode plot; band-pass; biasing",
    link: "https://leeselectronic.com/en/product/44240-resistor-kit-1-4w-1280pcs-64-values-1r-10m-ohm-1.html",
    status: "not ordered",
    purchased: false,
  },
  {
    part_name: "Multimeter (2nd unit)",
    what_it_does:
      "Day 28 measures current and voltage on a buck converter simultaneously — needs two multimeters in hand at the same time. Not otherwise on this list since one is assumed already owned as bench equipment; add a second if you only have one.",
    days_required_for: "28",
    related_concepts: "Voltage vs current measurement; buck converter efficiency",
    link: "",
    status: "not ordered",
    purchased: false,
    min_quantity: 1,
  },
];
