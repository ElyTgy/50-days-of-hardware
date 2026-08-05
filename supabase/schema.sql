-- 50 Days of Hardware — Supabase setup.
-- Paste this WHOLE file into the SQL editor, then Run (make sure nothing is
-- highlighted, or it only runs the selection). Safe to run more than once.
--
-- Access model: anyone can READ; only the owner (you, signed in with Google)
-- can WRITE. Editing is enforced here in the database, not just the UI.
-- >>> Set your Google account email in is_owner() below. <<<

-- ── Tables ────────────────────────────────────────────────────────────────

-- The schedule itself. `position` orders the calendar (fractional values let
-- a day slot between two others without renumbering); NULL position = the
-- day is docked in the staging area. Day numbers/dates are computed from
-- order in the app, never stored.
create table if not exists days (
  id uuid primary key default gen_random_uuid(),
  position numeric unique,
  block_id int not null default 0,
  topic text not null default '',
  puzzle boolean not null default false,
  equipment text not null default '',
  prerequisites text not null default '',
  intro text not null default '',
  equations text not null default '',
  diagram text not null default '',
  assembled text not null default '',
  activity text not null default '',
  question text not null default '',
  resources text not null default '',
  created_at timestamptz not null default now()
);

-- One notes row per (day_id, section) — keyed by the day's id, not its
-- number, so notes follow the day when the calendar is reordered.
create table if not exists day_notes (
  day_id uuid not null,
  section text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (day_id, section)
);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  part_name text not null default '',
  what_it_does text not null default '',
  days_required_for text not null default '',
  related_concepts text not null default '',
  link text not null default '',
  status text not null default 'not ordered',
  purchased boolean not null default false,
  min_quantity integer not null default 1,
  created_at timestamptz not null default now()
);

-- Add columns to tables created before they existed (safe on re-run).
alter table shopping_items
  add column if not exists status text not null default 'not ordered';
alter table shopping_items
  add column if not exists min_quantity integer not null default 1;

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  url text not null default '',
  created_at timestamptz not null default now()
);

-- ── Seed the 50 original days (only when the table is empty) ──────────────
-- Generated from src/data/days.ts; positions 1–50 match the v3 document.

insert into days (position, block_id, topic, puzzle, intro, activity, question, resources)
select v.position, v.block_id, v.topic, v.puzzle, v.intro, v.activity, v.question, v.resources
from (values
  (1, 0, $seed$Touch pad relaxation oscillator$seed$, false, $seed$$seed$, $seed$Stick a ~2×2 cm copper-foil pad to your desk, wire it as the C of a relaxation oscillator: CD40106 Schmitt inverter, 1 MΩ from output back to input, pad on the input. Scope the output. Touch the pad.$seed$, $seed$How much does the frequency drop when you touch the pad, and what baseline pad capacitance does your idle frequency imply (f ≈ 1/(0.8·R·C) for the 40106)?$seed$, $seed$Explain in 60 seconds, out loud: where the extra ~1 pF physically comes from (fringing fields + your body as a ground return), and the difference between self- and mutual-capacitance sensing.$seed$),
  (2, 0, $seed$Charge-transfer sensing$seed$, false, $seed$$seed$, $seed$Implement charge-transfer sensing in firmware (STM32 or Arduino): drive pad pin high → share its charge into a 10 nF known cap → repeat until the known cap crosses a threshold → the cycle count is your measurement. Print counts over serial; log 30 s idle, 30 s touched.$seed$, $seed$What is your SNR — (touched−idle count delta) ÷ (idle noise, std dev)? Is it enough for a reliable threshold?$seed$, $seed$Open one real touch-sensing app note (Microchip QTouch or a TI CapTIvate/MSP cap-sense note) and identify which measurement method it uses and why counting beats a single analog read.$seed$),
  (3, 0, $seed$Foil matrix & ghost touches$seed$, false, $seed$$seed$, $seed$Cut a 2×2 foil matrix. Drive rows with GPIOs, sense columns with Day 2's code. Add a 20-sample moving-average baseline and a fixed threshold. Localize a touch to a cell; record a demo.$seed$, $seed$Where do "ghost" touches appear when you press two diagonal cells — and why does mutual-capacitance scanning (drive rows, sense columns per intersection) fix what per-pad self-capacitance can't?$seed$, $seed$Explain why a phone touchscreen glitches on a cheap charger (noise injected into the sense lines). **Commit all code/notes to the robot-sensor repo — this is prototype #0.**$seed$),
  (4, 1, $seed$Capacitor step response$seed$, false, $seed$$seed$, $seed$On paper, sketch Vc(t) AND I(t) for a 5 V step through 10 kΩ into 1 µF. Then Falstad the exact circuit and compare. Then breadboard it: scope Vc, and current via a 100 Ω sense resistor.$seed$, $seed$Why is the current *maximum* at the exact instant the capacitor voltage is zero — and what would an instantaneous voltage change require? (I = C·dV/dt, interrogated.)$seed$, $seed$Monty capacitors **Q21–37**, the conceptual half (what is capacitance, series/parallel, energy, DC vs AC behavior). Score yourself.$seed$),
  (5, 1, $seed$Your capacitor is lying$seed$, false, $seed$$seed$, $seed$Open Murata SimSurfing (or a TDK datasheet) for a 10 µF 0805 X5R; write down its capacitance at rated DC bias. Then LTspice: 10 µF + 5 nH + 10 mΩ in series, AC sweep 1 kHz–100 MHz, find the impedance minimum (SRF). If the NanoVNA has arrived, measure a real electrolytic and a real ceramic.$seed$, $seed$Above what frequency does *your* capacitor behave as an inductor, and how much of your 10 µF survives DC bias?$seed$, $seed$Monty **Q21–37** remainder (ESR, ESL, dielectric types, when C0G vs X7R vs electrolytic).$seed$),
  (6, 1, $seed$Inductor kickback$seed$, false, $seed$$seed$, $seed$Breadboard an IRLZ44N low-side switching a 1 mH inductor (or relay coil) from 5 V, ~100 Hz PWM from the MCU. Scope the drain (10× probe). Then clip a 1N4148 flyback diode across the inductor and rescope.$seed$, $seed$How high did the spike go, what limited it, and where does the inductor's current flow after the switch opens once the diode is in place? (V = L·dI/dt, interrogated.)$seed$, $seed$Monty inductors **Q38–54**, first half (what is inductance, energy storage, V–I relationship, why coils).$seed$),
  (7, 1, $seed$Skin effect$seed$, false, $seed$$seed$, $seed$Compute skin depth in copper, δ = √(ρ/(π·f·µ)), at 60 Hz, 1 MHz, 100 MHz, 2.4 GHz. Make the table. Then, for a 1 mm-diameter wire at 100 MHz, compute what fraction of the cross-section actually carries current. NanoVNA if available: sweep two of your inductors, record each SRF.$seed$, $seed$Why does high-frequency current crowd to the surface (eddy currents inside the conductor oppose flow at the center) — and what two real design choices does this explain (litz wire, RF surface quality)?$seed$, $seed$Monty **Q56** verbatim, plus the rest of inductors **Q38–54** (Q, core loss, saturation).$seed$),
  (8, 1, $seed$LPF or HPF in 30 seconds$seed$, false, $seed$$seed$, $seed$On paper: for both RC orderings (series R then shunt C; series C then shunt R), replace the cap with an open circuit (DC) then a short (high f) and declare LPF or HPF. Then breadboard both with 10 kΩ/10 nF (fc ≈ 1.6 kHz); sweep 100 Hz–100 kHz with the function gen or MCU PWM; find each −3 dB point.$seed$, $seed$Does your measured corner match 1/(2πRC), and what does −3 dB mean in both power and voltage terms?$seed$, $seed$**Fronczak I**, the two "draw Vo for a step input" RC circuits — do them cold, they're the same two networks in time domain.$seed$),
  (9, 1, $seed$Band-pass & Bode by hand$seed$, false, $seed$$seed$, $seed$Hand-sketch the Bode magnitude of an HPF (fc = 160 Hz) cascaded with an LPF (fc = 16 kHz) — remember dB add. Then build it: RC HPF → LM358 buffer → RC LPF; sweep; overlay measurements on your sketch. Now remove the buffer and re-measure.$seed$, $seed$What did removing the buffer do to your corner frequencies, and why (apply Day 8's open/short trick to the loading between stages)?$seed$, $seed$Monty Filters section; then explain your Helix ECT front-end's band-pass in exactly these terms — that's the post.$seed$),
  (10, 1, $seed$Puzzle day #1$seed$, true, $seed$$seed$, $seed$Paper only, commit answers before any sim. (1) CD40106 inverter, R output→input, C input→ground: what is it, what sets f? (2) Swap in a NOR gate, drive its second input from a slow logic signal: what does that input now do? (What have you built — and how does R set the timing of the gated oscillation?) (3) A scope on AC coupling shows a square wave's flat tops drooping: which Day 8 circuit is secretly responsible?

**Then:** build (2) with the CD40106/4001 and check yourself.$seed$, $seed$$seed$, $seed$You just solved the family your Substack interview question comes from (RC + logic gate = gateable oscillator/PWM). Re-do **Fronczak I** step circuits if (3) wobbled.$seed$),
  (11, 2, $seed$Diode speed-review$seed$, false, $seed$$seed$, $seed$Closed book, out loud: Monty diodes **Q72–79**. Score each ✓/✗. Then trace IV curves: 1 kΩ series, step the supply 0→5 V in 0.5 V steps, log (V_diode, I) for a 1N4148 and a 1N5819; plot both on one chart.$seed$, $seed$At 10 mA, what is the forward-drop difference between the two, and what junction difference causes it?$seed$, $seed$Re-answer whichever of **Q72–79** you missed. Done — diodes stay short as agreed.$seed$),
  (12, 2, $seed$BJT: measure β, then distrust it$seed$, false, $seed$$seed$, $seed$Five 2N3904s, one at a time: base through 100 kΩ from 5 V, 1 kΩ collector load from 5 V; measure Ic, compute β = Ic/Ib. Write all five down.$seed$, $seed$How much does β vary across one bag — and given that, what property must your circuits never depend on? Then read one carrier-level explanation (All About Circuits BJT chapter, or AoE §2.1) and write the "thin base" story in five sentences of your own.$seed$, $seed$Monty BJTs section, the how-does-it-work questions; "why is β unreliable?" should now take you one breath.$seed$),
  (13, 2, $seed$Taming the BJT + the current mirror$seed$, false, $seed$$seed$, $seed$Breadboard a common-emitter amp: 2N3904, Rc = 4.7 kΩ, Re = 470 Ω, bias divider 47 k/10 k from 9 V; AC-couple 100 mV @ 1 kHz in; measure gain. Then breadboard a 2-transistor current mirror with a 1 mA reference; measure the copied current into 2–3 different load resistors.$seed$, $seed$Does the amp's gain land near −Rc/Re = −10 — and why did β vanish from the result? Why does shorting the mirror's Q1 collector to its base force exactly the right Vbe to copy the current?$seed$, $seed$**Fronczak II**, the basic current-mirror question (his note: "the answer is clearly 1 mA") — and his temperature question: Vbe drifts ≈ −2 mV/°C, so which way does the mirror's output drift?$seed$),
  (14, 2, $seed$MOSFET: find your Vth$seed$, false, $seed$$seed$, $seed$Trace Id–Vgs of a 2N7000: gate from a pot 0→5 V, drain through 100 Ω from 5 V; log points through turn-on; mark your device's Vth. Then LTspice an Id–Vds family of curves (Vgs = 2/2.5/3/3.5 V) and hand-label cutoff / triode / saturation regions on the plot.$seed$, $seed$The datasheet allows Vth = 0.8–3 V — why is the spread so huge, and what does that force on anyone designing with MOSFETs? And what is *physically* pinching off at the drain end in saturation? (One drawing.)$seed$, $seed$Monty MOSFETs section device questions + the edaboard classic: "why is the saturation region flat?"$seed$),
  (15, 2, $seed$The gate is not free$seed$, false, $seed$$seed$, $seed$Switch a 47 Ω load with the IRLZ44N at 10 kHz. Drive the gate through 10 kΩ; scope Vgs and find the flat shelf mid-transition (Miller plateau). Swap to 100 Ω gate resistance; rescope both Vgs and Vds.$seed$, $seed$What is Vds doing during the plateau, and why does that plateau time convert directly into switching loss (sketch the V×I overlap)? If the gate draws no DC current, what exactly is the gate driver's current for?$seed$, $seed$Monty MOSFETs switching questions (gate charge, why gate drivers exist, switching vs conduction loss).$seed$),
  (16, 2, $seed$The three topologies$seed$, false, $seed$$seed$, $seed$Build a source follower: 2N7000, 1 kΩ source resistor. Feed it a 1 kHz signal through a 10 kΩ series resistor (a deliberately weak source) and compare driving a 100 Ω load directly vs through the follower.$seed$, $seed$What did the follower fix (impedance transformation, not voltage gain) — and what is its gain *really*? Derive it (≈ gm·Rs/(1+gm·Rs)), then check against **Fronczak II**'s source-follower gain derivation.$seed$, $seed$Monty's "when MOSFET vs BJT?" question; classify common-source / common-gate / source-follower by what each is *for* in one line each.$seed$),
  (17, 2, $seed$CMOS from zero$seed$, false, $seed$$seed$, $seed$Build an inverter: BS250 on top, 2N7000 on the bottom, gates tied as input, drains tied as output, 5 V rail. Step Vin 0→5 V in 0.25 V steps, log Vout — plot the transfer curve. Measure supply current at Vin = 0 V, 5 V, and right at the switching threshold. Then wire 3 CD40106 inverters in a ring; measure the oscillation frequency.$seed$, $seed$Why is the static current ~zero in both stable states (trace the nonexistent DC path), and where does the power go when switching (P = C·V²·f — estimate it for your ring oscillator)?$seed$, $seed$Monty CMOS section — all of it; this was your "no clue what CMOS is" item, so the bar is explaining the inverter's structure and power story cold.$seed$),
  (18, 2, $seed$Puzzle day #2: name that circuit$seed$, true, $seed$$seed$, $seed$Paper, commit before simulating. (1) Square wave source → series cap → node with a diode down to ground and a diode forward to an output cap: what is Vout and why does each diode-cap pair add one Vin? (2) NMOS, source grounded, 10 kΩ pull-up to 5 V on the drain, gate driven by 3.3 V logic, output at the drain: name it; what happened to the signal's polarity and drive strength? (3) **Fronczak II**: op-amp's + input fed by a current mirror's 1 mA through 4 kΩ from 5 V, output driving a MOSFET whose source resistor is 100 kΩ to ground — find Io. (4) Op-amp + PNP pass transistor + Zener on the + input + divider feedback: what three-block circuit is this?

**Then:** build (1) and measure it actually doubling under light load. Keep it for Day 29.$seed$, $seed$$seed$, $seed$Monty **Q104** — charge pump, level shifter, LDO now identifiable on sight; answer for Io in (3) is 10 µA — did you get it?$seed$),
  (19, 3, $seed$Derive, then build$seed$, false, $seed$$seed$, $seed$15 minutes, paper: derive the inverting gain (−Rf/Rin) and non-inverting gain (1 + Rf/Rin) using only "V+ = V−" and "no input current" + KCL. Then breadboard both with a TL072, Rf = 100 k, Rin = 10 k; verify. Finally, swap the + and − inputs of the inverting amp.$seed$, $seed$What happened when you swapped the inputs, and *why* — which golden rule silently depends on negative feedback, and what enforces V+ = V− when feedback is present?$seed$, $seed$**Fronczak I**, the closed-loop DC gain question (answer: 1 + R1/R2) — 90 seconds max; Monty Opamps basics.$seed$),
  (20, 3, $seed$Measure the datasheet$seed$, false, $seed$$seed$, $seed$Non-inverting ×100 with the LM358: raise input frequency until the output falls to ~70% — that f × 100 = your measured GBW; compare to the datasheet (~1 MHz). Then unity buffer, 5 Vpp 50 kHz square wave in: measure the output ramp slope = slew rate; compare (~0.5 V/µs). Repeat both with the TL072.$seed$, $seed$For your square wave, which limit distorted it first — bandwidth or slew — and how do you tell the two apart on a scope?$seed$, $seed$The classic computation (vlsi4freshers-style): a 1 MHz-GBW op-amp at 20 dB gain has what −3 dB bandwidth? (100 kHz — say why.) Monty Opamps AC questions.$seed$),
  (21, 3, $seed$One method, four circuits$seed$, false, $seed$$seed$, $seed$30 minutes, paper: with virtual-short + KCL only, derive the difference amp, 2-input summing amp, integrator, and transimpedance amp. Then breadboard the integrator (TL072, 100 kΩ in, 1 µF feedback), square wave in: triangle out — let it run and watch it drift into a rail.$seed$, $seed$Which op-amp non-ideality railed your integrator (offset voltage vs bias current — how would you tell?), and what does the usual fix (a large reset resistor across the cap) cost you?$seed$, $seed$Monty Opamps circuit questions; re-derive your Helix TIA's gain (Vo = −Iin·Rf) from the same method — that's the post.$seed$),
  (22, 3, $seed$Make it sing, then make it decide$seed$, false, $seed$$seed$, $seed$LM358 unity buffer driving 1 µF directly on the output — scope it (oscillating?). Insert 47 Ω between output and cap — fixed? Then rewire the LM358 as a Schmitt trigger: design the positive-feedback divider for 2 V / 3 V thresholds, build, measure the actual thresholds.$seed$, $seed$What phase shift did the load cap add inside the feedback loop, and what does phase margin protect against? Separately: why does a comparator need hysteresis on a slow noisy input (what did your thresholds buy)?$seed$, $seed$Monty Opamps stability questions + "op-amp vs comparator — when is each wrong for the other's job?"$seed$),
  (23, 3, $seed$Lock a PLL$seed$, false, $seed$$seed$, $seed$Wire a CD4046 per the datasheet's typical application, VCO centered near 10 kHz. Feed a 10 kHz square from MCU PWM into the signal input; scope the VCO output — locked? Sweep the input frequency up and down until lock breaks; record the capture range and lock range. Then open your STM32 clock-tree config and write out the actual HSE → PLL(×N/÷M) → SYSCLK numbers.$seed$, $seed$Which of the three blocks — phase detector, loop filter, VCO — determines the capture range vs the lock range, and what is the loop filter's job in one sentence?$seed$, $seed$Monty PLL section — all of it; plus: how many PLLs are in the signal path between your STM32 crystal and its UART bit clock?$seed$),
  (24, 3, $seed$Puzzle day #3: the Fronczak gauntlet$seed$, true, $seed$$seed$, $seed$Paper, committed answers, then verify. (1) **Fronczak I**: high-gain comparator, − input grounded, sinusoid into + — draw the output exactly. (2) **Fronczak I**: a capacitor alternately switched between Vin and Vout at frequency fs — show it acts as a resistor and derive Req = 1/(C·fs). (3) Op-amp with capacitor feedback and resistor input, square wave in — draw the output and name the circuit. (4) If you skipped it Day 18: **Fronczak II**'s mirror + op-amp Io problem.

**Then:** build or Falstad (2) and watch the "resistor" value change as you change fs.$seed$, $seed$$seed$, $seed$These ARE Fronczak's real co-op interview questions — score yourself; a miss sends you back to Day 19/21's derivation habit.$seed$),
  (25, 4, $seed$LDO or buck, rail by rail$seed$, false, $seed$$seed$, $seed$Take a real board of yours (ground station or Helix). List every rail: Vin, Vout, Imax. For each, compute LDO dissipation P = (Vin−Vout)·I and LDO efficiency Vout/Vin. Write a one-line LDO-vs-buck verdict per rail.$seed$, $seed$Which of your rails is the clearest buck case, which is genuinely fine as an LDO — and in what two situations is an LDO *more* efficient than a buck (Vin ≈ Vout; µA loads where the buck's own quiescent/switching overhead dominates)?$seed$, $seed$Monty General Power Supply + "buck vs LDO tradeoffs / when can an LDO be more efficient" — asked verbatim in his list.$seed$),
  (26, 4, $seed$Build the LDO you named on Day 18$seed$, false, $seed$$seed$, $seed$Breadboard it: LM358 error amp + PNP/PMOS pass element + 5.1 V Zener reference + feedback divider, 9 V in → 3.3 V out. Step the load 10 mA → 100 mA (swap resistors); record Vout each step (= load regulation). Reduce Vin until Vout sags (= dropout).$seed$, $seed$Which block sets output accuracy, which sets dropout, and why do some real LDOs specify a *minimum* output-cap ESR (what does that ESR add to the loop — connect to Day 22's phase margin)?$seed$, $seed$Monty LDO section (dropout, efficiency analysis, load regulation).$seed$),
  (27, 4, $seed$Buck converter on paper, then in SPICE$seed$, false, $seed$$seed$, $seed$15 minutes, paper: derive D = Vout/Vin from volt-second balance (the inductor's average voltage over one cycle must be zero — or Day 6 told you what happens). Then LTspice an ideal buck: 12 V→5 V, 100 kHz, 33 µH, 100 µF, 1 A load. Plot inductor current; measure ripple ΔI and verify against V·t/L. Shrink L to 3.3 µH and re-run.$seed$, $seed$What changed in the inductor current waveform at small L (DCM — current hits zero), and why does the simple D = Vout/Vin formula stop holding there?$seed$, $seed$Monty Buck Converters → Duty Cycle/Output Voltage + Circuit Analysis subsections.$seed$),
  (28, 4, $seed$Interrogate a real buck$seed$, false, $seed$$seed$, $seed$The cheap buck module, set 12 V→5 V. Measure Vin·Iin and Vout·Iout at three loads (e.g., 50/250/500 mA) → efficiency at each. Find the switch node (inductor's switching side) and scope it: capture the ringing after each edge; measure the ring frequency.$seed$, $seed$From f_ring = 1/(2π√LC), what parasitic L·C product is ringing (Day 5 + Day 7's parasitics, conspiring) — and why would a synchronous buck beat this module's Schottky at high load?$seed$, $seed$Monty Buck → Efficiency/Ripple/Switching Frequency + Power Bridge subsections.$seed$),
  (29, 4, $seed$Two ways to get MORE volts$seed$, false, $seed$$seed$, $seed$LTspice a boost: 5 V→12 V, 100 kHz; verify Vout = Vin/(1−D). Push D to 0.95, then add realistic ESR/switch resistance and re-run. Then reload your Day 18 charge-pump doubler with 1 kΩ, then 100 Ω, and measure the sag.$seed$, $seed$Why doesn't D→1 give infinite voltage once losses exist, and why do charge pumps only suit light loads (what does each output droop reveal about output impedance)? When boost vs charge pump?$seed$, $seed$Monty Boost Converters + Charge Pumps sections (incl. "how do you spec a capacitor for a charge pump").$seed$),
  (30, 4, $seed$H-bridge$seed$, false, $seed$$seed$, $seed$DRV8833 + small motor + MCU PWM. Implement all four states: forward, reverse, coast (both outputs Hi-Z/low), brake (both low-side on). Spin the shaft by hand in coast vs brake and feel the difference. Draw the 4-switch H-bridge from memory and mark which simultaneous pair = shoot-through.$seed$, $seed$Why is a high-side N-FET awkward — its gate must go *above* the supply when the source flies up to Vin — and how does a bootstrap cap manufacture that voltage? Why does braking work (where does the motor's energy go)?$seed$, $seed$Monty Half/H-Bridge section: draw both bridges, braking, dead time, high-side NFET drive — all asked directly.$seed$),
  (31, 4, $seed$Current sensing$seed$, false, $seed$$seed$, $seed$Put the INA219 in series with the motor; log current at 10 Hz during start, steady run, and a brief stall. Plot it. Then build the DIY version: 0.1 Ω low-side shunt + LM358 diff amp (gain ~50); compare its reading to the INA219 at steady state.$seed$, $seed$Your low-side shunt lifted the motor's "ground" by I·R — when does that break things, and what does high-side sensing demand of the amplifier instead (surviving/rejecting a common-mode near Vbat — Day 21's difference amp, graduated)?$seed$, $seed$Monty Buck → Voltage/Current Sensing subsection; when shunt vs hall-effect vs inductor-DCR sensing?$seed$),
  (32, 4, $seed$Batteries & BMS$seed$, false, $seed$$seed$, $seed$Charge a small 1S LiPo through the TP4056 with the INA219 logging V and I once per second into a CSV. Plot both. Mark: the constant-current phase, the CV rollover at ~4.2 V, the taper, the cutoff.$seed$, $seed$What is the charger protecting against in each phase — and what does a multi-cell series pack additionally need (balancing) given that the pack voltage can look fine while one cell is over/under (why)?$seed$, $seed$Monty Batteries → LiPo/Monitoring/Charging/Safety questions — all of them (cell voltage ranges, internal resistance, what a BMS does, cell balancing). Rocket-relevant, interview-relevant, and a great post.$seed$),
  (33, 4, $seed$Puzzle day #4: power gauntlet$seed$, true, $seed$$seed$, $seed$Paper. (1) Three schematics using the same three parts (switch, diode, inductor) rearranged — identify buck / boost / buck-boost purely from where the inductor sits, then verify each in Falstad. (2) Monty's design question, done for real: "2S LiPo in; rails: 5 V @ 1 A, 3.3 V @ 300 mA digital, 3.3 V @ 50 mA clean analog — design the power architecture," with topology per rail, estimated dissipation, and why the analog rail is an LDO hung off the 5 V buck. (3) Spot-the-bug: high-side N-FET with its gate driven 0/5 V while its source sits at the motor terminal — why does it never fully turn on?$seed$, $seed$$seed$, $seed$(2) is Monty's Power Architecture question nearly verbatim; (3) is Day 30 inverted. Spreadsheet-check your numbers.$seed$),
  (34, 5, $seed$Reflections$seed$, false, $seed$$seed$, $seed$LTspice: ideal transmission line (Z0 = 50 Ω, 5 ns delay), 1 ns rise step in; terminate with 1 MΩ, then 1 Ω, then 50 Ω; plot the *input* node all three times — but write your predicted waveform for each case first.$seed$, $seed$Why does the open termination double the step and the short cancel it (what can't a mismatched load accept about the wave's built-in V/I ratio)? Bonus: fire a fast MCU edge down 5 m of coax, scope the bounce, and compute the cable length from the delay.$seed$, $seed$mikinty transmission-line questions; state the λ/10 "when is it a transmission line" rule and *why* it's roughly there.$seed$),
  (35, 5, $seed$Learn to speak S11$seed$, false, $seed$$seed$, $seed$Build this table by hand: S11 = −3 / −6 / −10 / −20 dB → |Γ| → % power reflected → VSWR. Then `pip install scikit-rf` and plot S11 vs frequency (1 MHz–1 GHz) for (a) a series 100 Ω load and (b) 10 pF to ground.$seed$, $seed$What does "S11 = −10 dB" tell a colleague in one plain sentence — and what does S21 of a filter or LNA promise?$seed$, $seed$Pull any LNA datasheet and narrate its S-parameter plots out loud; rebuild today's table from memory tomorrow morning.$seed$),
  (36, 5, $seed$Why the Smith chart is round$seed$, false, $seed$$seed$, $seed$Open an interactive Smith chart tool. Plot 50, 25, 100, 50+j50, and 50−j50 Ω; say which neighborhood each lives in (inductive top half, capacitive bottom, R along the axis). Rotate 50+j50 through 0.1λ of 50 Ω line — predict the landing spot before the tool draws it.$seed$, $seed$What quantity is the chart actually plotting (Γ on the complex plane), and why does |Γ| ≤ 1 force everything into a disc?$seed$, $seed$Locate open / short / match / the pure-reactance rim cold; explain "moving along a line = rotating around the chart" in one sentence.$seed$),
  (37, 5, $seed$The two-move match$seed$, false, $seed$$seed$, $seed$On the chart, match Z = 20 − j35 Ω to 50 Ω at 433 MHz with an L-match: one shunt move onto the circle through the center, one series move home. Extract the L and C values. Verify the S11 dip in scikit-rf. Then repeat, solo, for Z = 80 + j20 Ω.$seed$, $seed$Why do exactly two elements suffice for (almost) any load, and what did your match's Q cost in bandwidth (sweep ±50 MHz and look)?$seed$, $seed$Monty/mikinty impedance-matching questions; shunt-first vs series-first — how did you decide?$seed$),
  (38, 5, $seed$Calibrate, then trust$seed$, false, $seed$$seed$, $seed$SOL-calibrate the NanoVNA over 100–600 MHz with the reference plane at your cable's end. Re-measure the standards as a sanity check. Then measure a 30 cm coax stub (watch Day 36's rotation happen on the live Smith display) and re-measure Day 5's capacitor to find its SRF properly.$seed$, $seed$What specifically did calibration remove — measure the stub *uncalibrated* and compare — and what does "reference plane" mean in one sentence?$seed$, $seed$Explain SOL to a teammate in 3 sentences; Monty/mikinty test-equipment questions about VNAs.$seed$),
  (39, 5, $seed$Cut an antenna$seed$, false, $seed$$seed$, $seed$Cut a wire to ~19 cm (deliberately long; λ/4 at 433 MHz ≈ 16.4 cm). Mount it on an SMA jack over a small ground plane (a tin lid works). Sweep S11 250–600 MHz; note the dip. Trim 5 mm at a time, photographing the dip walking upward, until it lands on 433 MHz.$seed$, $seed$Why does the quarter-wave length resonate (what do the standing waves make the feedpoint impedance look like), and what is the ground plane doing (image antenna)?$seed$, $seed$mikinty antenna-basics questions; "why λ/4 and not λ/2 for a monopole over ground?"$seed$),
  (40, 5, $seed$Your hand is a component$seed$, false, $seed$$seed$, $seed$With yesterday's antenna mid-sweep: grab it — record how far the dip moves. Hold it near a metal box, then inside one — record again. If the "installed" match is off, add the Day 37 L-match on a scrap of copper and capture before/after S11.$seed$, $seed$What did your hand physically change without touching the conductor (near-field dielectric + loss — Day 1's fringing fields at 433 MHz), and why do real products tune antennas *inside* the final enclosure?$seed$, $seed$Connect this to your ground-station work: what near-field objects live around your actual antennas?$seed$),
  (41, 5, $seed$Capstone: does the link close?$seed$, true, $seed$$seed$, $seed$Spreadsheet, your real rocket telemetry numbers: TX power (dBm) + TX antenna gain − cable/connector losses + RX antenna gain − Friis free-space path loss at apogee distance, vs receiver sensitivity. Result: margin in dB.$seed$, $seed$Does the link close — and if the margin is thin, what is the single cheapest 3 dB to buy back (antenna? cable? bandwidth?)?$seed$, $seed$mikinty RF-systems questions (Friis, noise figure, sensitivity). This doubles as real ground-station documentation. Peak post.$seed$),
  (42, 6, $seed$Blocking vs non-blocking$seed$, false, $seed$$seed$, $seed$**HWI**'s exact question, on paper with a timing table: a=1, b=0, c=0 before a clock edge. Variant A: `a<=b; b<=c; c<=a;`. Variant B: `a=b; b=c; c=a;`. Final values of each? Then sim both in EDA Playground and confirm. Then write a combinational `always` with an `if` and no `else`, and state what hardware it infers; fix it.$seed$, $seed$What hardware does each assignment style build (simultaneous sampling vs values racing through in code order), and why does an incomplete branch mean "remember" — i.e., a latch?$seed$, $seed$**HWI** "unintended latch" question + HDLBits *Always blocks* set (do 4–5).$seed$),
  (43, 6, $seed$FSM under interview conditions$seed$, false, $seed$$seed$, $seed$30 minutes, timed, closed book, EDA Playground: write a Moore FSM detecting "1011" with overlap, plus a self-checking testbench. Run it.$seed$, $seed$Where would a Mealy version's output differ (one cycle earlier — trace why on your state diagram), and when does each style win?$seed$, $seed$HDLBits FSM problems (do 3); **HWI** sequence-detector questions — this exact task is on their real-questions list.$seed$),
  (44, 6, $seed$Timing math, out loud$seed$, false, $seed$$seed$, $seed$Interview format — whiteboard, talking aloud: (a) tCQ = 2 ns, tcomb = 5 ns, tsu = 1 ns → fmax? (b) add 0.5 ns clock skew, first helping then hurting — recompute setup AND hold margins. (c) two parallel paths, 5 ns and 1 ns of logic — which one threatens hold, and at what skew? Build to 5 problems with an answer key.$seed$, $seed$Why can slowing the clock fix any setup violation but never a hold violation (which terms have a clock period in them, and which don't)?$seed$, $seed$**HWI** timing questions (incl. their reset-tree deassertion question — reason through it); mikinty STA section.$seed$),
  (45, 6, $seed$Metastability & CDC$seed$, false, $seed$$seed$, $seed$Write a 2-FF synchronizer and a toggle-handshake pulse crosser in Verilog; testbench with two unrelated clocks (7 ns and 11.3 ns periods); run long enough to see edges land close together.$seed$, $seed$Why does the 2-FF chain make failure exponentially unlikely rather than impossible — and draw the exact bad sample that breaks a 2-bit bus synchronized one flop per bit (bits resolving on different edges = a value that never existed).$seed$, $seed$mikinty CDC questions; explain MTBF qualitatively; "how do you cross a multi-bit bus safely?" (gray code or handshake — foreshadows Day 47).$seed$),
  (46, 6, $seed$Pipeline something$seed$, false, $seed$$seed$, $seed$Write a combinational 16-bit multiply-accumulate (a·b + c); then a 3-stage pipelined version with registered stages. Sim both; capture waveforms showing identical results offset by 3 cycles of latency.$seed$, $seed$With Day 44's numbers, how much fmax did the pipeline buy and what did it cost (latency, area, and *balanced* stages — why does cutting anywhere-but-the-middle waste the gain)? Name the classic 5 processor stages and one hazard.$seed$, $seed$**HWI** "what is pipelining / explain the 5 stages" — asked verbatim in their list.$seed$),
  (47, 6, $seed$Boss puzzle: the FIFO$seed$, true, $seed$$seed$, $seed$Write a 16×8 synchronous FIFO + a testbench that repeatedly slams it full and empty, asserting the flags at the corners. Then paper: write the 3-bit gray-code sequence and show that any single-bit mis-sample of a gray-coded pointer is only ever off-by-one.$seed$, $seed$In an async FIFO, why must the *pointers* (not the data) cross domains, and why does gray coding turn a metastable mis-sample from catastrophic into conservative?$seed$, $seed$**HWI** FIFO questions + their two quick puzzles: build an XOR from a 2:1 mux; count the 4-input LUTs for a given module. The async FIFO is the single most-cited hard interview question in this space — re-derive it cold before bed.$seed$),
  (48, 7, $seed$Catch a race with your own hands$seed$, false, $seed$$seed$, $seed$STM32 — EXTI button interrupt increments a shared `uint32_t`; main loop reads it twice back-to-back and counts mismatches; drive the pin from a PWM output to press "the button" thousands of times a second. Catch the race. Fix it with a critical section (disable/enable IRQ around the read) and confirm zero mismatches.$seed$, $seed$What did `volatile` fix in this program, and what did it *not* fix (compiler assumptions vs atomicity — read-modify-write is three instructions and the ISR fits between any two)?$seed$, $seed$mikinty embedded section: ISR rules, volatile, atomicity, interrupt latency & priorities (NVIC).$seed$),
  (49, 7, $seed$DMA end to end$seed$, false, $seed$$seed$, $seed$STM32 — ADC in continuous mode → DMA circular into a 512-sample buffer → compute a mean in the half-transfer and transfer-complete callbacks → stream results over UART. Toggle a GPIO around the processing and scope it to see CPU busy time; compare against a polled-ADC version of the same thing.$seed$, $seed$What problem do half-transfer interrupts exist to solve (you just used double buffering — say it in one sentence), and what new bug class did DMA introduce (who owns the buffer when)?$seed$, $seed$Monty Embedded Systems DMA questions; "when would you NOT use DMA?"$seed$),
  (50, 7, $seed$Ring buffer + the exit interview$seed$, false, $seed$$seed$, $seed$Implement a single-producer/single-consumer ring buffer in C: power-of-2 size, head owned by the ISR, tail owned by main, no locks. Wire it to UART RX (ISR produces, main consumes and echoes). Blast data at it.

**Then:** 30-minute closed-book self-interview — two questions per block, drawn from Monty/Fronczak/HWI. Log every gap; that list seeds what's next.$seed$, $seed$Why is it safe with no locks (exactly one writer per index — where would that argument break with two producers?), and what does the power-of-2 size buy?$seed$, $seed$This ring buffer is a top-3 embedded interview coding question — keep the code forever. Post the 50-day recap mega-thread and pin it.$seed$)
) as v(position, block_id, topic, puzzle, intro, activity, question, resources)
where not exists (select 1 from days);

-- ── Bonus block seed: the Mixed-Signal Bridge (staged) ────────────────────
-- Three extra days added 2026-07-21, inserted into the STAGING dock
-- (position = null) so they can be dragged onto the calendar in the app.
-- Guarded per-day by topic, so re-runs never duplicate them.

insert into days (position, block_id, topic, puzzle, created_at, equipment, prerequisites, intro, equations, diagram, assembled, activity, question, resources)
select null, 6, $bridge$Decoupling: the capacitor is not the point$bridge$, false, now() + interval '0 seconds', $bridge$- MCU dev board (STM32/Arduino) with several free GPIO pins
- Oscilloscope (AC-coupled input)
- 100 nF ceramic capacitors (at least 2)
- ~10 cm of hookup wire
- LTspice$bridge$, $bridge$- Day 5 (capacitor parasitics, ESR/ESL, self-resonant frequency)
- Day 7 (frequency-dependent circuit behavior)
- Day 28 (switch-node ringing — you've already seen fast edges misbehave)$bridge$, $bridge$**What's actually happening:** every time a digital gate switches, it has to charge or discharge a small load capacitance almost instantly. That means a burst of current — sometimes an amp or more — has to appear at the chip's power pin in a couple of nanoseconds. The board's main power supply (a wall adapter, a regulator, a big bulk capacitor an inch away) cannot respond that fast — not because it's a bad supply, but because any real wire or trace between it and the chip has inductance, and inductance opposes fast changes in current (that's the definition of $V = L \frac{di}{dt}$). If the current cannot come from far away in time, it has to be supplied locally — that's the entire reason decoupling capacitors exist. They're not filtering noise in the traditional sense; they're a local, fast-acting charge reservoir sitting as close as physically possible to the pin that's about to demand a sudden gulp of current.

**The part almost everyone gets wrong at first:** it's easy to think "bigger capacitor = better decoupling." It's actually the opposite past a point — what matters most is the **loop inductance** of the capacitor's connection, not its capacitance value. A capacitor connected through even a few centimeters of wire has enough series inductance to make it nearly useless at the switching speeds a modern MCU produces. This is why datasheets insist on placing 100 nF caps directly at the power pin, and why "why is there a 100 nF cap right next to a 470 µF cap an inch away" is one of the most common power-integrity interview questions there is.

The second half of this day is about **where the current actually goes on its way back.** Every circuit is a loop — current has to return to its source. On a board with a ground plane, high-frequency return current does not take the path of least resistance (which might wander anywhere); it takes the path of least **inductance**, which is almost always the area directly underneath the signal trace. This is the physical basis of "keep a solid, unbroken ground plane" — it's not a superstition, it's a direct consequence of Faraday's law wanting to minimize enclosed loop area.

**Why this matters / where it's used:** every real PCB with a microcontroller, FPGA, or fast digital logic depends on getting this right — get it wrong and you get glitches, resets, EMI failures, and ADC noise you can't explain (this connects directly to the ADC day). It is also one of the most reliably asked "explain this from first principles" interview questions in any hardware role, because it separates people who've memorized "put a cap near the pin" from people who understand why.$bridge$, $bridge$Impedance of an inductor (why "a wire" isn't just a wire at high frequency):

$$Z_L = j\omega L = j 2\pi f L$$

Voltage droop from a fast current step through a real (non-ideal) capacitor connection:

$$V_{droop} = L \frac{di}{dt}$$

A capacitor's self-resonant frequency — above this, it behaves like an inductor, not a capacitor:

$$f_{SRF} = \frac{1}{2\pi\sqrt{LC}}$$$bridge$, $bridge$No single canonical diagram beats building the mental picture yourself, but this article has a clear circuit model of the loop (bypass cap, parasitic inductance, IC) worth sketching by hand before you start: [Altium — Decoupling Capacitor and Bypass Placement Guidelines](https://resources.altium.com/p/bypass-and-decoupling-capacitor-placement-guidelines) (see the "circuit model" figure showing the loop between the bypass cap and the package's parasitic inductance).$bridge$, $bridge$An MCU deliberately abusing its own power rail as a controlled experiment, scoped three different ways, plus an LTspice model that isolates the loop-inductance variable so you can see the mechanism in isolation from the real (messier) hardware.$bridge$, $bridge$You're going to create the exact failure this day is about, then fix it, then break it again on purpose — so you see all three states with your own eyes.

1. Write firmware that toggles 8 GPIO pins simultaneously as fast as the MCU allows (a tight loop is fine). This is your "aggressor" — a burst of current demand with no decoupling help.
2. AC-couple your scope to the MCU's VDD pin and capture the ripple/droop with **no local capacitor** — only the board's distant bulk cap. Note the peak-to-peak disturbance.
3. Add a 100 nF ceramic cap with the **shortest possible leads** directly at the VDD/GND pins. Recapture. You should see a visibly smaller disturbance.
4. Now take that same 100 nF cap and reconnect it through **~10 cm of hookup wire** instead of short leads. Recapture — the disturbance should partially or fully return, with the same capacitor value.
5. In LTspice, build a 1 A, 2 ns current step drawn from a 3.3 V source through 100 nF, once with 3 nH of series inductance and once with 30 nH. Plot the rail dip in both cases and compare against what you measured on the bench.$bridge$, $bridge$- Why did the identical 100 nF capacitor stop working once it was 10 cm away instead of right at the pin? Frame your answer entirely in terms of $V = L\frac{di}{dt}$ — what changed, and what didn't?
- Where does return current for a fast edge actually flow on a board with a solid ground plane — directly underneath the trace, or by the shortest-resistance path to the ground pin? Why are those two answers different at high frequency?$bridge$, $bridge$**Check your understanding**

- Why put a 100 nF cap at every pin when a 470 µF bulk capacitor already sits an inch away on the same rail? (Answer using loop inductance and self-resonant frequency, not "just because.")
- What happens electrically when a fast digital signal's return current is forced to cross a slit or split in the ground plane beneath it?
- Why pair a 100 nF cap with a 10 µF cap on the same rail, and what problem can two capacitors of different self-resonant frequencies create between them (hint: anti-resonance)?

**Further reading**

- [Altium — Decoupling Capacitor and Bypass Placement Guidelines](https://resources.altium.com/p/bypass-and-decoupling-capacitor-placement-guidelines) — the clearest short explanation of the loop-inductance model and why direct-to-plane connections beat traces
- [NWES Blog — Remove Ground Bounce with Proper Bypass Capacitor Placement](https://www.nwengineeringllc.com/article/remove-ground-bounce-with-proper-bypass-capacitor-placement.php) — distinguishes decoupling caps (PDN ripple) from bypass caps (ground bounce), which most explanations blur together
- [AllPCB — The Ultimate Guide to Power Plane Decoupling](https://www.allpcb.com/allelectrohub/the-ultimate-guide-to-power-plane-decoupling-capacitors-placement-and-strategies) — good on multi-value capacitor banks and why "two caps of half the value" beats "one cap of double the value"$bridge$
where not exists (select 1 from days where topic = $bridge$Decoupling: the capacitor is not the point$bridge$);

insert into days (position, block_id, topic, puzzle, created_at, equipment, prerequisites, intro, equations, diagram, assembled, activity, question, resources)
select null, 6, $bridge$Mixed-signal SI: rise time, return paths, and one solid plane$bridge$, false, now() + interval '1 seconds', $bridge$- Paper and pencil
- LTspice

No physical hardware for this day — it's a design-reasoning day, meant to be done right after the decoupling day while the loop-inductance intuition is still fresh.$bridge$, $bridge$- Day 34 (transmission-line reflections, the λ/10 rule)
- The decoupling day (loop inductance, return-current paths)$bridge$, $bridge$**What's actually going on:** everything you learned in the RF block about transmission lines and reflections is exactly the same physics that governs a digital trace on a PCB — the only difference is that instead of a sine wave at a fixed RF frequency, you have a digital **edge**, which is really a sum of many frequencies (a fast edge has significant energy content well above the clock frequency itself; a good rule of thumb is that the effective bandwidth of a digital edge is roughly $BW \approx \frac{0.35}{t_r}$). This is why a "slow" 100 MHz digital system can still have serious transmission-line problems: it's not the clock frequency that matters, it's the edge speed.

The practical question every layout designer has to answer is: **at what point does a trace stop being "just a wire"** and start being a transmission line that needs real termination and impedance control? The answer is the same "critical length" concept from Day 34, just reframed for digital rise times instead of RF wavelengths.

The second core idea of this day is **return-current routing**, which you already derived the mechanism for on the decoupling day: current takes the path of least inductance, which is the area directly beneath the signal trace, provided there's an unbroken reference plane there. Mixed-signal boards (a board with both an ADC and a switching regulator and a digital MCU on it) live or die on this idea. The classic — and classically bad — instinct is to physically cut the ground plane in two, one side "analog ground," one side "digital ground," to keep them from talking to each other. This nearly always backfires: any signal whose return current needs to cross that gap is forced to detour around it, creating a large loop — which is to say, you've just built an accidental antenna into your own board. The better and now-standard approach is **one solid plane, partitioned by careful component placement** instead of a physical cut.

**Where this matters:** this is the actual foundation of high-speed and mixed-signal PCB layout — the entire discipline is "control rise-time-driven trace behavior, and control where return current flows." Everything else (stack-up choices, via placement, crosstalk mitigation) is an application of these two ideas.$bridge$, $bridge$Signal propagation speed in FR-4 (a common approximation):

$$v \approx 15\ \text{cm/ns}$$

Critical length — the trace length beyond which transmission-line behavior (not simple lumped-element behavior) matters:

$$\ell_{critical} \approx \frac{t_r \times v}{6}$$

Effective bandwidth of a digital edge, given its 10–90% rise time $t_r$:

$$BW \approx \frac{0.35}{t_r}$$

Aperture jitter's fundamental limit on achievable SNR for any ADC sampling a signal at frequency $f_{in}$ with clock jitter $t_j$ (this bridges directly into the ADC day):

$$SNR_{jitter} \le -20\log_{10}\left(2\pi f_{in} t_j\right)$$$bridge$, $bridge$[Dr. Eric Bogatin — "The Critical Length of a Transmission Line"](https://www.polarinstruments.com/support/cits/Critical_length.pdf) — a short, clean derivation of the exact rule you'll use in step 1, from one of the most cited names in practical signal integrity.

[ProtoExpress — How to Handle Current Return Path for Better Signal Integrity](https://www.protoexpress.com/blog/current-return-path-signal-integrity/) — includes a labeled diagram of return current flowing through a via and back along the underside of a trace, which is the exact picture you're meant to sketch in step 3.$bridge$, $bridge$A source-terminated transmission line in LTspice (so you can see a reflection get killed rather than just being told it will be), plus a hand-drawn 2-layer mixed-signal floorplan where you physically trace out return-current paths for two different signal types.$bridge$, $bridge$1. Using the critical-length equation, compute the critical length for rise times of 10 ns, 2 ns, and 0.5 ns. Compare each result against the λ/10 rule you used in Day 34 for RF — you should find they're expressing the same underlying idea in two different domains.
2. In LTspice, rebuild Day 34's mismatched transmission line (long line, 1 MΩ load — a strong reflection). Now add a 33 Ω resistor in series **at the source end only** (the load stays mismatched). Plot the output before and after adding the source resistor.
3. Sketch a simple 2-layer board layout containing an ADC, an MCU, and a switching regulator, with one continuous ground plane underneath everything. Mark rough component placement. Then, in a different color, draw the actual return-current path for (a) the MCU's digital bus traffic and (b) the ADC's analog input signal. Note whether these two paths overlap anywhere.
4. Redraw the same board with the ground plane **cut** between the "analog" and "digital" sections, and re-trace the same two return paths. Compare the loop areas between your two sketches.$bridge$, $bridge$- Why does adding a resistor at the **source** end kill the reflection, even though the far end of the line is still just as mismatched as before? (Hint: think about what happens to the reflected wave when it travels back and arrives at the source.)
- Why is "cut the ground plane between analog and digital" usually a worse idea than "keep one solid plane, and partition by placement instead"? Use your two sketches from steps 3–4 to make the argument concrete.$bridge$, $bridge$**Check your understanding**

- Where should AGND and DGND actually tie together on a board with an ADC — and why at that specific point?
- Why does the "3W rule" (space between two traces should be at least 3× the trace width) reduce crosstalk, and which of two adjacent traces is the "victim" if one of them is a clock line?
- For a 1 MHz input signal sampled with 100 ps of clock jitter, what's the aperture-jitter SNR ceiling — and what does that number tell you about how many effective bits any ADC could give you on this signal, regardless of its advertised resolution?

**Further reading**

- [Altium (Phil's Lab) — High-Speed PCB Design Tips and Guidelines](https://resources.altium.com/p/high-speed-pcb-design-tips) — good concrete numeric examples of edge bandwidth and critical length
- [AtlasPCB — Signal Integrity in PCB Design](https://atlaspcb.com/blog/signal-integrity-pcb-design-guide/) — walks the same critical-length math with worked numeric examples
- [Sierra Circuits — Design for Better Signal Integrity, an interview with Rick Hartley](https://www.protoexpress.com/blog/rick-hartley-pcb-design-recommendations-to-minimize-emi/) — Rick Hartley is the person most cited on this topic; a fast way to absorb his framing of "every trace is a waveguide"
- Samtec's freely available [Signal Integrity Handbook](https://suddendocs.samtec.com/notesandwhitepapers/samtec-signal-integrity-handbook.pdf) is the closest thing to a full textbook on this if you want to go deep later$bridge$
where not exists (select 1 from days where topic = $bridge$Mixed-signal SI: rise time, return paths, and one solid plane$bridge$);

insert into days (position, block_id, topic, puzzle, created_at, equipment, prerequisites, intro, equations, diagram, assembled, activity, question, resources)
select null, 6, $bridge$ADC: aliasing you can see$bridge$, false, now() + interval '2 seconds', $bridge$- STM32 (or similar MCU) with an onboard ADC and UART
- Signal source: ideally a function generator, or MCU PWM run through Day 8's RC low-pass filter as a substitute
- Laptop with Python (matplotlib) for plotting streamed samples$bridge$, $bridge$- Day 8 (RC low-pass filter — reused here as your signal source if you don't have a function generator)
- The mixed-signal SI day (aperture jitter — gives you the context for why this day's noise-floor question matters)

This day directly sets up the DMA day (DMA-streamed ADC sampling), which is much more about *why the numbers mean what they mean* if you've done this day first.$bridge$, $bridge$**What is an ADC, actually?** An analog-to-digital converter takes a continuously-varying voltage and produces a sequence of discrete numbers, each representing the voltage at one specific instant in time. Two separate, independent limitations are baked into that sentence, and almost all ADC interview questions are really asking about one or the other:

1. **Sampling in time** — you only get to know the signal's value at specific instants, not continuously. This raises the question: how often do you need to sample to actually capture what the signal is doing? The answer is the Nyquist theorem: you must sample at least twice as fast as the highest frequency component present in the signal, or that frequency will be misrepresented as a different, lower frequency in your digital output — a phenomenon called **aliasing**. This isn't a measurement error you can fix after the fact; the information is genuinely destroyed at the moment of sampling. This is why every real ADC system needs an **anti-aliasing filter** — an analog low-pass filter placed before the ADC that guarantees nothing above half the sample rate ever reaches the sampler in the first place.

2. **Quantization in amplitude** — even at a single instant, the ADC can only report one of a finite number of discrete voltage levels (determined by its bit resolution), not the true continuous value. This introduces quantization error, and combined with real-world noise, it means an ADC's *effective* number of bits is often lower than its advertised resolution.

**Why this matters, and where it shows up:** literally any system that measures a real-world signal digitally — sensors, audio, communications, your own multimeter — runs into both of these limits. In interviews, the two most common traps are (a) asking you to identify what frequency an under-sampled signal will alias to, and (b) asking you to compute one LSB in real-world units for a given resolution and reference voltage. Both are direct, mechanical applications of the ideas above — which is exactly why this day is built around watching both effects happen live on your own hardware rather than just reading the definitions.$bridge$, $bridge$The aliased (observed) frequency when sampling below Nyquist, where $n$ is the nearest integer:

$$f_{observed} = |f_{in} - n \cdot f_s|$$

One LSB (the smallest voltage step an ADC can resolve), for an $N$-bit ADC with reference voltage $V_{ref}$:

$$V_{LSB} = \frac{V_{ref}}{2^N}$$

Effective number of bits, given the standard deviation $\sigma$ of your noise floor measured in LSBs (a commonly used approximate form):

$$ENOB \approx N - \log_2(\sigma)$$$bridge$, $bridge$[Analog Devices Wiki — Chapter 20: Analog to Digital Conversion](https://wiki.analog.com/university/courses/electronics/text/chapter-20) — a free, textbook-quality chapter with clear figures on sampling, quantization error, and SAR ADC architecture; this is the single best "read this before you start" resource for the whole day.$bridge$, $bridge$A live sampling rig that streams your MCU's ADC readings over UART to your laptop for plotting in real time — first used to watch aliasing happen on command, then repurposed to measure your ADC's actual noise floor.$bridge$, $bridge$1. Configure your MCU's ADC to sample at exactly 10 kSa/s, streaming raw values over UART to a simple Python script that plots them as they arrive.
2. Feed in a roughly 1 kHz sine wave (filtered PWM through Day 8's RC filter works fine, or a function generator if you have one) and capture a clean, correctly-reconstructed waveform.
3. Now feed in 9 kHz, then 11 kHz, then 19 kHz — **before you look at each plot, write down what frequency you expect to see**, based on the aliasing equation. Then capture and compare against your prediction.
4. Ground the ADC input directly (0 V, no signal), capture 10,000 samples, and plot a histogram of the raw values. This is your ADC's actual noise floor, independent of anything you're trying to measure.$bridge$, $bridge$- Why does a 9 kHz input come out looking like a 1 kHz signal at a 10 kHz sample rate? Derive this yourself from the folding/aliasing equation rather than just quoting it — walk through why $n=1$ gives you exactly 1 kHz.
- What must an anti-aliasing filter guarantee about every frequency component above $f_s/2$ for this failure mode to be prevented entirely?
- For a 12-bit ADC with a 3.3 V reference: what is one LSB in millivolts? Using the standard deviation (in LSBs) from your grounded-input histogram, how many effective bits is your ADC actually delivering, versus its advertised 12?$bridge$, $bridge$**Check your understanding**

- In one line each: how do SAR, sigma-delta, and flash ADC architectures trade off speed, resolution, and latency against each other?
- A sensor picks up 60 Hz mains interference and is sampled at 50 Sa/s. At what frequency does that interference actually appear in your digital output — and why can no digital filter applied afterward remove it? (The answer connects directly back to "the information is destroyed at the sampler.")

**Further reading**

- [Analog Devices — Sigma-Delta ADCs Tutorial](https://www.analog.com/en/resources/technical-articles/sigmadelta-adcs-tutorial.html) — the clearest available explanation of oversampling and noise shaping, for when you want to go beyond the one-line SAR-vs-sigma-delta comparison
- [TI Precision Labs — SAR & Delta-Sigma ADCs: Understanding Basic Operation](https://www.ti.com/content/dam/videos/external-videos/en-us/7/3816841626001/6228191712001.mp4/subassets/adcs-sar-delta-sigma-basic-operation-presentation.pdf) — TI's own training deck comparing the two architectures side by side
- [ODG — SAR vs Delta-Sigma ADC: What's the Real Difference](https://www.origin-ic.com/blog/sar-vs-delta-sigma-analog-signal-to-digital-conversion/48376) — a shorter, more practical comparison if the ADI tutorial is more depth than you need right now$bridge$
where not exists (select 1 from days where topic = $bridge$ADC: aliasing you can see$bridge$);

-- ── Migrate old day_notes (keyed by day number) to day_id ─────────────────
-- Older installs created day_notes with a (day int, section) key. Re-key by
-- the seeded day ids — seed positions equal the old day numbers, so the join
-- is exact. The legacy `day` column is kept (nullable) for safety.
do $mig$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'day_notes' and column_name = 'day')
     and not exists (select 1 from information_schema.columns
             where table_name = 'day_notes' and column_name = 'day_id') then
    alter table day_notes add column day_id uuid;
    update day_notes n set day_id = d.id from days d where d.position = n.day;
    delete from day_notes where day_id is null;
    alter table day_notes drop constraint day_notes_pkey;
    alter table day_notes alter column day drop not null;
    alter table day_notes alter column day_id set not null;
    alter table day_notes add primary key (day_id, section);
  end if;
end $mig$;

-- ── Consolidate day_notes into one freeform note per day ───────────────────
-- The app used to keep separate notes per section (equipment, intro, etc);
-- now each day has a single "Writing" note. Merge any existing per-section
-- notes into one 'notes' row per day, each labelled with its old section
-- heading, then drop the old rows. Safe to re-run — once merged, only
-- 'notes' rows remain and this becomes a no-op.
do $consolidate$
begin
  if exists (select 1 from day_notes where section <> 'notes' and content <> '') then
    insert into day_notes (day_id, section, content, updated_at)
    select
      day_id,
      'notes',
      string_agg(
        '## ' || initcap(replace(section, '_', ' ')) || E'\n\n' || content,
        E'\n\n' order by section
      ),
      now()
    from day_notes
    where section <> 'notes' and content <> ''
    group by day_id
    on conflict (day_id, section) do update
      set content = trim(both E'\n' from day_notes.content || E'\n\n' || excluded.content),
          updated_at = now();
  end if;
  delete from day_notes where section <> 'notes';
end $consolidate$;

-- ── Owner check ────────────────────────────────────────────────────────────
-- The one email allowed to edit. CHANGE THIS to your Google account email.
create or replace function public.is_owner() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'yeganehtagh13@gmail.com'
$$;

-- ── Row-level security: anyone reads, only the owner writes ────────────────

alter table days enable row level security;
alter table day_notes enable row level security;
alter table shopping_items enable row level security;
alter table resources enable row level security;

-- Drop older policies (both the previous open ones and these, so re-runs work).
drop policy if exists "anon all" on day_notes;
drop policy if exists "anon all" on shopping_items;
drop policy if exists "anon all" on resources;

do $$
declare t text;
begin
  foreach t in array array['days', 'day_notes', 'shopping_items', 'resources'] loop
    execute format('drop policy if exists "read" on %I', t);
    execute format('drop policy if exists "owner insert" on %I', t);
    execute format('drop policy if exists "owner update" on %I', t);
    execute format('drop policy if exists "owner delete" on %I', t);
    execute format('create policy "read" on %I for select using (true)', t);
    execute format('create policy "owner insert" on %I for insert with check (public.is_owner())', t);
    execute format('create policy "owner update" on %I for update using (public.is_owner()) with check (public.is_owner())', t);
    execute format('create policy "owner delete" on %I for delete using (public.is_owner())', t);
  end loop;
end $$;

-- ── Storage: public read, owner-only upload ────────────────────────────────

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "anon upload images" on storage.objects;
drop policy if exists "anon read images" on storage.objects;
drop policy if exists "read images" on storage.objects;
drop policy if exists "owner upload images" on storage.objects;

create policy "read images" on storage.objects
  for select using (bucket_id = 'images');
create policy "owner upload images" on storage.objects
  for insert with check (bucket_id = 'images' and public.is_owner());
