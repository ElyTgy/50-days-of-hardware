import type { SeedDay } from "../types";

/**
 * SEED DATA — the original 50 days from the v3 challenge document.
 *
 * Since the in-app day editor landed, the live schedule is stored in the
 * Supabase `days` table (see supabase/schema.sql, which seeds it from this
 * list). This file remains only as the in-memory fallback when Supabase is
 * unreachable/unconfigured, and as the source the SQL seed was generated
 * from. Do not edit content here — edit it in the app.
 *
 * Source: ~/Downloads/50-day-hardware-challenge-v3.md
 */
export const days: SeedDay[] = [
  // Block 0 — Capacitive touch kickstart
  {
    day: 1,
    blockId: 0,
    topic: "Touch pad relaxation oscillator",
    activity: `Stick a ~2×2 cm copper-foil pad to your desk, wire it as the C of a relaxation oscillator: CD40106 Schmitt inverter, 1 MΩ from output back to input, pad on the input. Scope the output. Touch the pad.`,
    question: `How much does the frequency drop when you touch the pad, and what baseline pad capacitance does your idle frequency imply (f ≈ 1/(0.8·R·C) for the 40106)?`,
    resources: `Explain in 60 seconds, out loud: where the extra ~1 pF physically comes from (fringing fields + your body as a ground return), and the difference between self- and mutual-capacitance sensing.`,
  },
  {
    day: 2,
    blockId: 0,
    topic: "Charge-transfer sensing",
    activity: `Implement charge-transfer sensing in firmware (STM32 or Arduino): drive pad pin high → share its charge into a 10 nF known cap → repeat until the known cap crosses a threshold → the cycle count is your measurement. Print counts over serial; log 30 s idle, 30 s touched.`,
    question: `What is your SNR — (touched−idle count delta) ÷ (idle noise, std dev)? Is it enough for a reliable threshold?`,
    resources: `Open one real touch-sensing app note (Microchip QTouch or a TI CapTIvate/MSP cap-sense note) and identify which measurement method it uses and why counting beats a single analog read.`,
  },
  {
    day: 3,
    blockId: 0,
    topic: "Foil matrix & ghost touches",
    activity: `Cut a 2×2 foil matrix. Drive rows with GPIOs, sense columns with Day 2's code. Add a 20-sample moving-average baseline and a fixed threshold. Localize a touch to a cell; record a demo.`,
    question: `Where do "ghost" touches appear when you press two diagonal cells — and why does mutual-capacitance scanning (drive rows, sense columns per intersection) fix what per-pad self-capacitance can't?`,
    resources: `Explain why a phone touchscreen glitches on a cheap charger (noise injected into the sense lines). **Commit all code/notes to the robot-sensor repo — this is prototype #0.**`,
  },

  // Block 1 — Passives & filters
  {
    day: 4,
    blockId: 1,
    topic: "Capacitor step response",
    activity: `On paper, sketch Vc(t) AND I(t) for a 5 V step through 10 kΩ into 1 µF. Then Falstad the exact circuit and compare. Then breadboard it: scope Vc, and current via a 100 Ω sense resistor.`,
    question: `Why is the current *maximum* at the exact instant the capacitor voltage is zero — and what would an instantaneous voltage change require? (I = C·dV/dt, interrogated.)`,
    resources: `Monty capacitors **Q21–37**, the conceptual half (what is capacitance, series/parallel, energy, DC vs AC behavior). Score yourself.`,
  },
  {
    day: 5,
    blockId: 1,
    topic: "Your capacitor is lying",
    activity: `Open Murata SimSurfing (or a TDK datasheet) for a 10 µF 0805 X5R; write down its capacitance at rated DC bias. Then LTspice: 10 µF + 5 nH + 10 mΩ in series, AC sweep 1 kHz–100 MHz, find the impedance minimum (SRF). If the NanoVNA has arrived, measure a real electrolytic and a real ceramic.`,
    question: `Above what frequency does *your* capacitor behave as an inductor, and how much of your 10 µF survives DC bias?`,
    resources: `Monty **Q21–37** remainder (ESR, ESL, dielectric types, when C0G vs X7R vs electrolytic).`,
  },
  {
    day: 6,
    blockId: 1,
    topic: "Inductor kickback",
    activity: `Breadboard an IRLZ44N low-side switching a 1 mH inductor (or relay coil) from 5 V, ~100 Hz PWM from the MCU. Scope the drain (10× probe). Then clip a 1N4148 flyback diode across the inductor and rescope.`,
    question: `How high did the spike go, what limited it, and where does the inductor's current flow after the switch opens once the diode is in place? (V = L·dI/dt, interrogated.)`,
    resources: `Monty inductors **Q38–54**, first half (what is inductance, energy storage, V–I relationship, why coils).`,
  },
  {
    day: 7,
    blockId: 1,
    topic: "Skin effect",
    activity: `Compute skin depth in copper, δ = √(ρ/(π·f·µ)), at 60 Hz, 1 MHz, 100 MHz, 2.4 GHz. Make the table. Then, for a 1 mm-diameter wire at 100 MHz, compute what fraction of the cross-section actually carries current. NanoVNA if available: sweep two of your inductors, record each SRF.`,
    question: `Why does high-frequency current crowd to the surface (eddy currents inside the conductor oppose flow at the center) — and what two real design choices does this explain (litz wire, RF surface quality)?`,
    resources: `Monty **Q56** verbatim, plus the rest of inductors **Q38–54** (Q, core loss, saturation).`,
  },
  {
    day: 8,
    blockId: 1,
    topic: "LPF or HPF in 30 seconds",
    activity: `On paper: for both RC orderings (series R then shunt C; series C then shunt R), replace the cap with an open circuit (DC) then a short (high f) and declare LPF or HPF. Then breadboard both with 10 kΩ/10 nF (fc ≈ 1.6 kHz); sweep 100 Hz–100 kHz with the function gen or MCU PWM; find each −3 dB point.`,
    question: `Does your measured corner match 1/(2πRC), and what does −3 dB mean in both power and voltage terms?`,
    resources: `**Fronczak I**, the two "draw Vo for a step input" RC circuits — do them cold, they're the same two networks in time domain.`,
  },
  {
    day: 9,
    blockId: 1,
    topic: "Band-pass & Bode by hand",
    activity: `Hand-sketch the Bode magnitude of an HPF (fc = 160 Hz) cascaded with an LPF (fc = 16 kHz) — remember dB add. Then build it: RC HPF → LM358 buffer → RC LPF; sweep; overlay measurements on your sketch. Now remove the buffer and re-measure.`,
    question: `What did removing the buffer do to your corner frequencies, and why (apply Day 8's open/short trick to the loading between stages)?`,
    resources: `Monty Filters section; then explain your Helix ECT front-end's band-pass in exactly these terms — that's the post.`,
  },
  {
    day: 10,
    blockId: 1,
    topic: "Puzzle day #1",
    puzzle: true,
    activity: `Paper only, commit answers before any sim. (1) CD40106 inverter, R output→input, C input→ground: what is it, what sets f? (2) Swap in a NOR gate, drive its second input from a slow logic signal: what does that input now do? (What have you built — and how does R set the timing of the gated oscillation?) (3) A scope on AC coupling shows a square wave's flat tops drooping: which Day 8 circuit is secretly responsible?

**Then:** build (2) with the CD40106/4001 and check yourself.`,
    resources: `You just solved the family your Substack interview question comes from (RC + logic gate = gateable oscillator/PWM). Re-do **Fronczak I** step circuits if (3) wobbled.`,
  },

  // Block 2 — Devices
  {
    day: 11,
    blockId: 2,
    topic: "Diode speed-review",
    activity: `Closed book, out loud: Monty diodes **Q72–79**. Score each ✓/✗. Then trace IV curves: 1 kΩ series, step the supply 0→5 V in 0.5 V steps, log (V_diode, I) for a 1N4148 and a 1N5819; plot both on one chart.`,
    question: `At 10 mA, what is the forward-drop difference between the two, and what junction difference causes it?`,
    resources: `Re-answer whichever of **Q72–79** you missed. Done — diodes stay short as agreed.`,
  },
  {
    day: 12,
    blockId: 2,
    topic: "BJT: measure β, then distrust it",
    activity: `Five 2N3904s, one at a time: base through 100 kΩ from 5 V, 1 kΩ collector load from 5 V; measure Ic, compute β = Ic/Ib. Write all five down.`,
    question: `How much does β vary across one bag — and given that, what property must your circuits never depend on? Then read one carrier-level explanation (All About Circuits BJT chapter, or AoE §2.1) and write the "thin base" story in five sentences of your own.`,
    resources: `Monty BJTs section, the how-does-it-work questions; "why is β unreliable?" should now take you one breath.`,
  },
  {
    day: 13,
    blockId: 2,
    topic: "Taming the BJT + the current mirror",
    activity: `Breadboard a common-emitter amp: 2N3904, Rc = 4.7 kΩ, Re = 470 Ω, bias divider 47 k/10 k from 9 V; AC-couple 100 mV @ 1 kHz in; measure gain. Then breadboard a 2-transistor current mirror with a 1 mA reference; measure the copied current into 2–3 different load resistors.`,
    question: `Does the amp's gain land near −Rc/Re = −10 — and why did β vanish from the result? Why does shorting the mirror's Q1 collector to its base force exactly the right Vbe to copy the current?`,
    resources: `**Fronczak II**, the basic current-mirror question (his note: "the answer is clearly 1 mA") — and his temperature question: Vbe drifts ≈ −2 mV/°C, so which way does the mirror's output drift?`,
  },
  {
    day: 14,
    blockId: 2,
    topic: "MOSFET: find your Vth",
    activity: `Trace Id–Vgs of a 2N7000: gate from a pot 0→5 V, drain through 100 Ω from 5 V; log points through turn-on; mark your device's Vth. Then LTspice an Id–Vds family of curves (Vgs = 2/2.5/3/3.5 V) and hand-label cutoff / triode / saturation regions on the plot.`,
    question: `The datasheet allows Vth = 0.8–3 V — why is the spread so huge, and what does that force on anyone designing with MOSFETs? And what is *physically* pinching off at the drain end in saturation? (One drawing.)`,
    resources: `Monty MOSFETs section device questions + the edaboard classic: "why is the saturation region flat?"`,
  },
  {
    day: 15,
    blockId: 2,
    topic: "The gate is not free",
    activity: `Switch a 47 Ω load with the IRLZ44N at 10 kHz. Drive the gate through 10 kΩ; scope Vgs and find the flat shelf mid-transition (Miller plateau). Swap to 100 Ω gate resistance; rescope both Vgs and Vds.`,
    question: `What is Vds doing during the plateau, and why does that plateau time convert directly into switching loss (sketch the V×I overlap)? If the gate draws no DC current, what exactly is the gate driver's current for?`,
    resources: `Monty MOSFETs switching questions (gate charge, why gate drivers exist, switching vs conduction loss).`,
  },
  {
    day: 16,
    blockId: 2,
    topic: "The three topologies",
    activity: `Build a source follower: 2N7000, 1 kΩ source resistor. Feed it a 1 kHz signal through a 10 kΩ series resistor (a deliberately weak source) and compare driving a 100 Ω load directly vs through the follower.`,
    question: `What did the follower fix (impedance transformation, not voltage gain) — and what is its gain *really*? Derive it (≈ gm·Rs/(1+gm·Rs)), then check against **Fronczak II**'s source-follower gain derivation.`,
    resources: `Monty's "when MOSFET vs BJT?" question; classify common-source / common-gate / source-follower by what each is *for* in one line each.`,
  },
  {
    day: 17,
    blockId: 2,
    topic: "CMOS from zero",
    activity: `Build an inverter: BS250 on top, 2N7000 on the bottom, gates tied as input, drains tied as output, 5 V rail. Step Vin 0→5 V in 0.25 V steps, log Vout — plot the transfer curve. Measure supply current at Vin = 0 V, 5 V, and right at the switching threshold. Then wire 3 CD40106 inverters in a ring; measure the oscillation frequency.`,
    question: `Why is the static current ~zero in both stable states (trace the nonexistent DC path), and where does the power go when switching (P = C·V²·f — estimate it for your ring oscillator)?`,
    resources: `Monty CMOS section — all of it; this was your "no clue what CMOS is" item, so the bar is explaining the inverter's structure and power story cold.`,
  },
  {
    day: 18,
    blockId: 2,
    topic: "Puzzle day #2: name that circuit",
    puzzle: true,
    activity: `Paper, commit before simulating. (1) Square wave source → series cap → node with a diode down to ground and a diode forward to an output cap: what is Vout and why does each diode-cap pair add one Vin? (2) NMOS, source grounded, 10 kΩ pull-up to 5 V on the drain, gate driven by 3.3 V logic, output at the drain: name it; what happened to the signal's polarity and drive strength? (3) **Fronczak II**: op-amp's + input fed by a current mirror's 1 mA through 4 kΩ from 5 V, output driving a MOSFET whose source resistor is 100 kΩ to ground — find Io. (4) Op-amp + PNP pass transistor + Zener on the + input + divider feedback: what three-block circuit is this?

**Then:** build (1) and measure it actually doubling under light load. Keep it for Day 29.`,
    resources: `Monty **Q104** — charge pump, level shifter, LDO now identifiable on sight; answer for Io in (3) is 10 µA — did you get it?`,
  },

  // Block 3 — Op-amps & PLLs
  {
    day: 19,
    blockId: 3,
    topic: "Derive, then build",
    activity: `15 minutes, paper: derive the inverting gain (−Rf/Rin) and non-inverting gain (1 + Rf/Rin) using only "V+ = V−" and "no input current" + KCL. Then breadboard both with a TL072, Rf = 100 k, Rin = 10 k; verify. Finally, swap the + and − inputs of the inverting amp.`,
    question: `What happened when you swapped the inputs, and *why* — which golden rule silently depends on negative feedback, and what enforces V+ = V− when feedback is present?`,
    resources: `**Fronczak I**, the closed-loop DC gain question (answer: 1 + R1/R2) — 90 seconds max; Monty Opamps basics.`,
  },
  {
    day: 20,
    blockId: 3,
    topic: "Measure the datasheet",
    activity: `Non-inverting ×100 with the LM358: raise input frequency until the output falls to ~70% — that f × 100 = your measured GBW; compare to the datasheet (~1 MHz). Then unity buffer, 5 Vpp 50 kHz square wave in: measure the output ramp slope = slew rate; compare (~0.5 V/µs). Repeat both with the TL072.`,
    question: `For your square wave, which limit distorted it first — bandwidth or slew — and how do you tell the two apart on a scope?`,
    resources: `The classic computation (vlsi4freshers-style): a 1 MHz-GBW op-amp at 20 dB gain has what −3 dB bandwidth? (100 kHz — say why.) Monty Opamps AC questions.`,
  },
  {
    day: 21,
    blockId: 3,
    topic: "One method, four circuits",
    activity: `30 minutes, paper: with virtual-short + KCL only, derive the difference amp, 2-input summing amp, integrator, and transimpedance amp. Then breadboard the integrator (TL072, 100 kΩ in, 1 µF feedback), square wave in: triangle out — let it run and watch it drift into a rail.`,
    question: `Which op-amp non-ideality railed your integrator (offset voltage vs bias current — how would you tell?), and what does the usual fix (a large reset resistor across the cap) cost you?`,
    resources: `Monty Opamps circuit questions; re-derive your Helix TIA's gain (Vo = −Iin·Rf) from the same method — that's the post.`,
  },
  {
    day: 22,
    blockId: 3,
    topic: "Make it sing, then make it decide",
    activity: `LM358 unity buffer driving 1 µF directly on the output — scope it (oscillating?). Insert 47 Ω between output and cap — fixed? Then rewire the LM358 as a Schmitt trigger: design the positive-feedback divider for 2 V / 3 V thresholds, build, measure the actual thresholds.`,
    question: `What phase shift did the load cap add inside the feedback loop, and what does phase margin protect against? Separately: why does a comparator need hysteresis on a slow noisy input (what did your thresholds buy)?`,
    resources: `Monty Opamps stability questions + "op-amp vs comparator — when is each wrong for the other's job?"`,
  },
  {
    day: 23,
    blockId: 3,
    topic: "Lock a PLL",
    activity: `Wire a CD4046 per the datasheet's typical application, VCO centered near 10 kHz. Feed a 10 kHz square from MCU PWM into the signal input; scope the VCO output — locked? Sweep the input frequency up and down until lock breaks; record the capture range and lock range. Then open your STM32 clock-tree config and write out the actual HSE → PLL(×N/÷M) → SYSCLK numbers.`,
    question: `Which of the three blocks — phase detector, loop filter, VCO — determines the capture range vs the lock range, and what is the loop filter's job in one sentence?`,
    resources: `Monty PLL section — all of it; plus: how many PLLs are in the signal path between your STM32 crystal and its UART bit clock?`,
  },
  {
    day: 24,
    blockId: 3,
    topic: "Puzzle day #3: the Fronczak gauntlet",
    puzzle: true,
    activity: `Paper, committed answers, then verify. (1) **Fronczak I**: high-gain comparator, − input grounded, sinusoid into + — draw the output exactly. (2) **Fronczak I**: a capacitor alternately switched between Vin and Vout at frequency fs — show it acts as a resistor and derive Req = 1/(C·fs). (3) Op-amp with capacitor feedback and resistor input, square wave in — draw the output and name the circuit. (4) If you skipped it Day 18: **Fronczak II**'s mirror + op-amp Io problem.

**Then:** build or Falstad (2) and watch the "resistor" value change as you change fs.`,
    resources: `These ARE Fronczak's real co-op interview questions — score yourself; a miss sends you back to Day 19/21's derivation habit.`,
  },

  // Block 4 — Power electronics
  {
    day: 25,
    blockId: 4,
    topic: "LDO or buck, rail by rail",
    activity: `Take a real board of yours (ground station or Helix). List every rail: Vin, Vout, Imax. For each, compute LDO dissipation P = (Vin−Vout)·I and LDO efficiency Vout/Vin. Write a one-line LDO-vs-buck verdict per rail.`,
    question: `Which of your rails is the clearest buck case, which is genuinely fine as an LDO — and in what two situations is an LDO *more* efficient than a buck (Vin ≈ Vout; µA loads where the buck's own quiescent/switching overhead dominates)?`,
    resources: `Monty General Power Supply + "buck vs LDO tradeoffs / when can an LDO be more efficient" — asked verbatim in his list.`,
  },
  {
    day: 26,
    blockId: 4,
    topic: "Build the LDO you named on Day 18",
    activity: `Breadboard it: LM358 error amp + PNP/PMOS pass element + 5.1 V Zener reference + feedback divider, 9 V in → 3.3 V out. Step the load 10 mA → 100 mA (swap resistors); record Vout each step (= load regulation). Reduce Vin until Vout sags (= dropout).`,
    question: `Which block sets output accuracy, which sets dropout, and why do some real LDOs specify a *minimum* output-cap ESR (what does that ESR add to the loop — connect to Day 22's phase margin)?`,
    resources: `Monty LDO section (dropout, efficiency analysis, load regulation).`,
  },
  {
    day: 27,
    blockId: 4,
    topic: "Buck converter on paper, then in SPICE",
    activity: `15 minutes, paper: derive D = Vout/Vin from volt-second balance (the inductor's average voltage over one cycle must be zero — or Day 6 told you what happens). Then LTspice an ideal buck: 12 V→5 V, 100 kHz, 33 µH, 100 µF, 1 A load. Plot inductor current; measure ripple ΔI and verify against V·t/L. Shrink L to 3.3 µH and re-run.`,
    question: `What changed in the inductor current waveform at small L (DCM — current hits zero), and why does the simple D = Vout/Vin formula stop holding there?`,
    resources: `Monty Buck Converters → Duty Cycle/Output Voltage + Circuit Analysis subsections.`,
  },
  {
    day: 28,
    blockId: 4,
    topic: "Interrogate a real buck",
    activity: `The cheap buck module, set 12 V→5 V. Measure Vin·Iin and Vout·Iout at three loads (e.g., 50/250/500 mA) → efficiency at each. Find the switch node (inductor's switching side) and scope it: capture the ringing after each edge; measure the ring frequency.`,
    question: `From f_ring = 1/(2π√LC), what parasitic L·C product is ringing (Day 5 + Day 7's parasitics, conspiring) — and why would a synchronous buck beat this module's Schottky at high load?`,
    resources: `Monty Buck → Efficiency/Ripple/Switching Frequency + Power Bridge subsections.`,
  },
  {
    day: 29,
    blockId: 4,
    topic: "Two ways to get MORE volts",
    activity: `LTspice a boost: 5 V→12 V, 100 kHz; verify Vout = Vin/(1−D). Push D to 0.95, then add realistic ESR/switch resistance and re-run. Then reload your Day 18 charge-pump doubler with 1 kΩ, then 100 Ω, and measure the sag.`,
    question: `Why doesn't D→1 give infinite voltage once losses exist, and why do charge pumps only suit light loads (what does each output droop reveal about output impedance)? When boost vs charge pump?`,
    resources: `Monty Boost Converters + Charge Pumps sections (incl. "how do you spec a capacitor for a charge pump").`,
  },
  {
    day: 30,
    blockId: 4,
    topic: "H-bridge",
    activity: `DRV8833 + small motor + MCU PWM. Implement all four states: forward, reverse, coast (both outputs Hi-Z/low), brake (both low-side on). Spin the shaft by hand in coast vs brake and feel the difference. Draw the 4-switch H-bridge from memory and mark which simultaneous pair = shoot-through.`,
    question: `Why is a high-side N-FET awkward — its gate must go *above* the supply when the source flies up to Vin — and how does a bootstrap cap manufacture that voltage? Why does braking work (where does the motor's energy go)?`,
    resources: `Monty Half/H-Bridge section: draw both bridges, braking, dead time, high-side NFET drive — all asked directly.`,
  },
  {
    day: 31,
    blockId: 4,
    topic: "Current sensing",
    activity: `Put the INA219 in series with the motor; log current at 10 Hz during start, steady run, and a brief stall. Plot it. Then build the DIY version: 0.1 Ω low-side shunt + LM358 diff amp (gain ~50); compare its reading to the INA219 at steady state.`,
    question: `Your low-side shunt lifted the motor's "ground" by I·R — when does that break things, and what does high-side sensing demand of the amplifier instead (surviving/rejecting a common-mode near Vbat — Day 21's difference amp, graduated)?`,
    resources: `Monty Buck → Voltage/Current Sensing subsection; when shunt vs hall-effect vs inductor-DCR sensing?`,
  },
  {
    day: 32,
    blockId: 4,
    topic: "Batteries & BMS",
    activity: `Charge a small 1S LiPo through the TP4056 with the INA219 logging V and I once per second into a CSV. Plot both. Mark: the constant-current phase, the CV rollover at ~4.2 V, the taper, the cutoff.`,
    question: `What is the charger protecting against in each phase — and what does a multi-cell series pack additionally need (balancing) given that the pack voltage can look fine while one cell is over/under (why)?`,
    resources: `Monty Batteries → LiPo/Monitoring/Charging/Safety questions — all of them (cell voltage ranges, internal resistance, what a BMS does, cell balancing). Rocket-relevant, interview-relevant, and a great post.`,
  },
  {
    day: 33,
    blockId: 4,
    topic: "Puzzle day #4: power gauntlet",
    puzzle: true,
    activity: `Paper. (1) Three schematics using the same three parts (switch, diode, inductor) rearranged — identify buck / boost / buck-boost purely from where the inductor sits, then verify each in Falstad. (2) Monty's design question, done for real: "2S LiPo in; rails: 5 V @ 1 A, 3.3 V @ 300 mA digital, 3.3 V @ 50 mA clean analog — design the power architecture," with topology per rail, estimated dissipation, and why the analog rail is an LDO hung off the 5 V buck. (3) Spot-the-bug: high-side N-FET with its gate driven 0/5 V while its source sits at the motor terminal — why does it never fully turn on?`,
    resources: `(2) is Monty's Power Architecture question nearly verbatim; (3) is Day 30 inverted. Spreadsheet-check your numbers.`,
  },

  // Block 5 — RF
  {
    day: 34,
    blockId: 5,
    topic: "Reflections",
    activity: `LTspice: ideal transmission line (Z0 = 50 Ω, 5 ns delay), 1 ns rise step in; terminate with 1 MΩ, then 1 Ω, then 50 Ω; plot the *input* node all three times — but write your predicted waveform for each case first.`,
    question: `Why does the open termination double the step and the short cancel it (what can't a mismatched load accept about the wave's built-in V/I ratio)? Bonus: fire a fast MCU edge down 5 m of coax, scope the bounce, and compute the cable length from the delay.`,
    resources: `mikinty transmission-line questions; state the λ/10 "when is it a transmission line" rule and *why* it's roughly there.`,
  },
  {
    day: 35,
    blockId: 5,
    topic: "Learn to speak S11",
    activity: `Build this table by hand: S11 = −3 / −6 / −10 / −20 dB → |Γ| → % power reflected → VSWR. Then \`pip install scikit-rf\` and plot S11 vs frequency (1 MHz–1 GHz) for (a) a series 100 Ω load and (b) 10 pF to ground.`,
    question: `What does "S11 = −10 dB" tell a colleague in one plain sentence — and what does S21 of a filter or LNA promise?`,
    resources: `Pull any LNA datasheet and narrate its S-parameter plots out loud; rebuild today's table from memory tomorrow morning.`,
  },
  {
    day: 36,
    blockId: 5,
    topic: "Why the Smith chart is round",
    activity: `Open an interactive Smith chart tool. Plot 50, 25, 100, 50+j50, and 50−j50 Ω; say which neighborhood each lives in (inductive top half, capacitive bottom, R along the axis). Rotate 50+j50 through 0.1λ of 50 Ω line — predict the landing spot before the tool draws it.`,
    question: `What quantity is the chart actually plotting (Γ on the complex plane), and why does |Γ| ≤ 1 force everything into a disc?`,
    resources: `Locate open / short / match / the pure-reactance rim cold; explain "moving along a line = rotating around the chart" in one sentence.`,
  },
  {
    day: 37,
    blockId: 5,
    topic: "The two-move match",
    activity: `On the chart, match Z = 20 − j35 Ω to 50 Ω at 433 MHz with an L-match: one shunt move onto the circle through the center, one series move home. Extract the L and C values. Verify the S11 dip in scikit-rf. Then repeat, solo, for Z = 80 + j20 Ω.`,
    question: `Why do exactly two elements suffice for (almost) any load, and what did your match's Q cost in bandwidth (sweep ±50 MHz and look)?`,
    resources: `Monty/mikinty impedance-matching questions; shunt-first vs series-first — how did you decide?`,
  },
  {
    day: 38,
    blockId: 5,
    topic: "Calibrate, then trust",
    activity: `SOL-calibrate the NanoVNA over 100–600 MHz with the reference plane at your cable's end. Re-measure the standards as a sanity check. Then measure a 30 cm coax stub (watch Day 36's rotation happen on the live Smith display) and re-measure Day 5's capacitor to find its SRF properly.`,
    question: `What specifically did calibration remove — measure the stub *uncalibrated* and compare — and what does "reference plane" mean in one sentence?`,
    resources: `Explain SOL to a teammate in 3 sentences; Monty/mikinty test-equipment questions about VNAs.`,
  },
  {
    day: 39,
    blockId: 5,
    topic: "Cut an antenna",
    activity: `Cut a wire to ~19 cm (deliberately long; λ/4 at 433 MHz ≈ 16.4 cm). Mount it on an SMA jack over a small ground plane (a tin lid works). Sweep S11 250–600 MHz; note the dip. Trim 5 mm at a time, photographing the dip walking upward, until it lands on 433 MHz.`,
    question: `Why does the quarter-wave length resonate (what do the standing waves make the feedpoint impedance look like), and what is the ground plane doing (image antenna)?`,
    resources: `mikinty antenna-basics questions; "why λ/4 and not λ/2 for a monopole over ground?"`,
  },
  {
    day: 40,
    blockId: 5,
    topic: "Your hand is a component",
    activity: `With yesterday's antenna mid-sweep: grab it — record how far the dip moves. Hold it near a metal box, then inside one — record again. If the "installed" match is off, add the Day 37 L-match on a scrap of copper and capture before/after S11.`,
    question: `What did your hand physically change without touching the conductor (near-field dielectric + loss — Day 1's fringing fields at 433 MHz), and why do real products tune antennas *inside* the final enclosure?`,
    resources: `Connect this to your ground-station work: what near-field objects live around your actual antennas?`,
  },
  {
    day: 41,
    blockId: 5,
    topic: "Capstone: does the link close?",
    puzzle: true,
    activity: `Spreadsheet, your real rocket telemetry numbers: TX power (dBm) + TX antenna gain − cable/connector losses + RX antenna gain − Friis free-space path loss at apogee distance, vs receiver sensitivity. Result: margin in dB.`,
    question: `Does the link close — and if the margin is thin, what is the single cheapest 3 dB to buy back (antenna? cable? bandwidth?)?`,
    resources: `mikinty RF-systems questions (Friis, noise figure, sensitivity). This doubles as real ground-station documentation. Peak post.`,
  },

  // Block 6 — Digital design
  {
    day: 42,
    blockId: 6,
    topic: "Blocking vs non-blocking",
    activity: `**HWI**'s exact question, on paper with a timing table: a=1, b=0, c=0 before a clock edge. Variant A: \`a<=b; b<=c; c<=a;\`. Variant B: \`a=b; b=c; c=a;\`. Final values of each? Then sim both in EDA Playground and confirm. Then write a combinational \`always\` with an \`if\` and no \`else\`, and state what hardware it infers; fix it.`,
    question: `What hardware does each assignment style build (simultaneous sampling vs values racing through in code order), and why does an incomplete branch mean "remember" — i.e., a latch?`,
    resources: `**HWI** "unintended latch" question + HDLBits *Always blocks* set (do 4–5).`,
  },
  {
    day: 43,
    blockId: 6,
    topic: "FSM under interview conditions",
    activity: `30 minutes, timed, closed book, EDA Playground: write a Moore FSM detecting "1011" with overlap, plus a self-checking testbench. Run it.`,
    question: `Where would a Mealy version's output differ (one cycle earlier — trace why on your state diagram), and when does each style win?`,
    resources: `HDLBits FSM problems (do 3); **HWI** sequence-detector questions — this exact task is on their real-questions list.`,
  },
  {
    day: 44,
    blockId: 6,
    topic: "Timing math, out loud",
    activity: `Interview format — whiteboard, talking aloud: (a) tCQ = 2 ns, tcomb = 5 ns, tsu = 1 ns → fmax? (b) add 0.5 ns clock skew, first helping then hurting — recompute setup AND hold margins. (c) two parallel paths, 5 ns and 1 ns of logic — which one threatens hold, and at what skew? Build to 5 problems with an answer key.`,
    question: `Why can slowing the clock fix any setup violation but never a hold violation (which terms have a clock period in them, and which don't)?`,
    resources: `**HWI** timing questions (incl. their reset-tree deassertion question — reason through it); mikinty STA section.`,
  },
  {
    day: 45,
    blockId: 6,
    topic: "Metastability & CDC",
    activity: `Write a 2-FF synchronizer and a toggle-handshake pulse crosser in Verilog; testbench with two unrelated clocks (7 ns and 11.3 ns periods); run long enough to see edges land close together.`,
    question: `Why does the 2-FF chain make failure exponentially unlikely rather than impossible — and draw the exact bad sample that breaks a 2-bit bus synchronized one flop per bit (bits resolving on different edges = a value that never existed).`,
    resources: `mikinty CDC questions; explain MTBF qualitatively; "how do you cross a multi-bit bus safely?" (gray code or handshake — foreshadows Day 47).`,
  },
  {
    day: 46,
    blockId: 6,
    topic: "Pipeline something",
    activity: `Write a combinational 16-bit multiply-accumulate (a·b + c); then a 3-stage pipelined version with registered stages. Sim both; capture waveforms showing identical results offset by 3 cycles of latency.`,
    question: `With Day 44's numbers, how much fmax did the pipeline buy and what did it cost (latency, area, and *balanced* stages — why does cutting anywhere-but-the-middle waste the gain)? Name the classic 5 processor stages and one hazard.`,
    resources: `**HWI** "what is pipelining / explain the 5 stages" — asked verbatim in their list.`,
  },
  {
    day: 47,
    blockId: 6,
    topic: "Boss puzzle: the FIFO",
    puzzle: true,
    activity: `Write a 16×8 synchronous FIFO + a testbench that repeatedly slams it full and empty, asserting the flags at the corners. Then paper: write the 3-bit gray-code sequence and show that any single-bit mis-sample of a gray-coded pointer is only ever off-by-one.`,
    question: `In an async FIFO, why must the *pointers* (not the data) cross domains, and why does gray coding turn a metastable mis-sample from catastrophic into conservative?`,
    resources: `**HWI** FIFO questions + their two quick puzzles: build an XOR from a 2:1 mux; count the 4-input LUTs for a given module. The async FIFO is the single most-cited hard interview question in this space — re-derive it cold before bed.`,
  },

  // Block 7 — Firmware
  {
    day: 48,
    blockId: 7,
    topic: "Catch a race with your own hands",
    activity: `STM32 — EXTI button interrupt increments a shared \`uint32_t\`; main loop reads it twice back-to-back and counts mismatches; drive the pin from a PWM output to press "the button" thousands of times a second. Catch the race. Fix it with a critical section (disable/enable IRQ around the read) and confirm zero mismatches.`,
    question: `What did \`volatile\` fix in this program, and what did it *not* fix (compiler assumptions vs atomicity — read-modify-write is three instructions and the ISR fits between any two)?`,
    resources: `mikinty embedded section: ISR rules, volatile, atomicity, interrupt latency & priorities (NVIC).`,
  },
  {
    day: 49,
    blockId: 7,
    topic: "DMA end to end",
    activity: `STM32 — ADC in continuous mode → DMA circular into a 512-sample buffer → compute a mean in the half-transfer and transfer-complete callbacks → stream results over UART. Toggle a GPIO around the processing and scope it to see CPU busy time; compare against a polled-ADC version of the same thing.`,
    question: `What problem do half-transfer interrupts exist to solve (you just used double buffering — say it in one sentence), and what new bug class did DMA introduce (who owns the buffer when)?`,
    resources: `Monty Embedded Systems DMA questions; "when would you NOT use DMA?"`,
  },
  {
    day: 50,
    blockId: 7,
    topic: "Ring buffer + the exit interview",
    activity: `Implement a single-producer/single-consumer ring buffer in C: power-of-2 size, head owned by the ISR, tail owned by main, no locks. Wire it to UART RX (ISR produces, main consumes and echoes). Blast data at it.

**Then:** 30-minute closed-book self-interview — two questions per block, drawn from Monty/Fronczak/HWI. Log every gap; that list seeds what's next.`,
    question: `Why is it safe with no locks (exactly one writer per index — where would that argument break with two producers?), and what does the power-of-2 size buy?`,
    resources: `This ring buffer is a top-3 embedded interview coding question — keep the code forever. Post the 50-day recap mega-thread and pin it.`,
  },
];

