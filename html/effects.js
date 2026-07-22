const EFFECTS = [
  {id:'solid',         label:'Solid',            params:['color']},
  {id:'blink',         label:'Blink',            params:['speed','color','color2']},
  {id:'breathe',       label:'Breathe',          params:['speed','color']},
  {id:'wipe',          label:'Wipe',             params:['speed','color','color2']},
  {id:'colorloop',     label:'Color Loop',       params:['speed']},
  {id:'rainbow',       label:'Rainbow',          params:['speed']},
  {id:'rainbowCycle',  label:'Rainbow Cycle',    params:['speed']},
  {id:'chase',         label:'Chase / Comet',    params:['speed','intensity','color','color2']},
  {id:'theaterChase',  label:'Theater Chase',    params:['speed','color','color2']},
  {id:'scan',          label:'Scan (Cylon)',     params:['speed','intensity','color','color2']},
  {id:'runningLights', label:'Running Lights',   params:['speed','color','color2']},
  {id:'twinkle',       label:'Twinkle',          params:['speed','intensity','color','color2']},
  {id:'sparkle',       label:'Sparkle',          params:['speed','intensity','color','color2']},
  {id:'fire',          label:'Fire Flicker',     params:['speed','intensity','color','color2']},
  {id:'noise',         label:'Noise',            params:['speed','color','color2','color3']},
  {id:'meteor',        label:'Meteor',           params:['speed','intensity','color','color2']},
  {id:'sinelon',       label:'Sinelon',          params:['speed','intensity','color','color2']},
  {id:'police',        label:'Police',           params:['speed','intensity']},
  {id:'rain',          label:'Rain / Drip',      params:['speed','intensity','color','color2']},
  {id:'twoDots',       label:'Two Dots',         params:['speed','intensity','color','color2','color3']},
  {id:'triChase',      label:'Tri Chase',        params:['speed','color','color2','color3']},
  {id:'multiComet',    label:'Multi Comet',      params:['speed','intensity','color','color2']},
  {id:'loading',       label:'Loading',          params:['speed','intensity','color','color2']},
  {id:'stream',        label:'Stream',           params:['speed','intensity']},
];
const EFFECT_MAP = Object.fromEntries(EFFECTS.map(e => [e.id, e]));

// Best-effort WLED FX indices for effects that have been stable across firmware
// versions. null = no confident match; verify against GET /json/eff on your
// controller before relying on the numeric id. (Legacy fallback, kept for
// reading older exported/imported project files.)

const WLED_FX_ID = {
  solid:0, blink:1, breathe:2, wipe:3, colorloop:8, rainbow:9,
  rainbowCycle:null, scan:10, theaterChase:13, runningLights:15,
  twinkle:17, sparkle:20, chase:null, fire:null, noise:null
};

// Real WLED effect names, ids and descriptions, sourced from WLED's own
// documentation (github.com/Aircoookie/WLED/wiki/List-of-effects-and-palettes).
// This covers the classic/core effect set (ids 0-117), which has stayed
// stable across WLED versions for years. Newer 2D-only and audio-reactive
// effects (0.14+) added beyond id 117, or usermod effects, aren't included
// here — connect to a live controller (header) to pull those exactly.
// "sim" maps each real effect to the closest built-in preview renderer this
// app knows how to draw; the canvas approximates the look, but the id/name
// exported to your controller is the real one.

const WLED_EFFECTS_REAL = [
  {id:0,name:'Solid',sim:'solid',desc:'A single, unchanging color.'},
  {id:1,name:'Blink',sim:'blink',desc:'Simple blink between color 1 and 2.'},
  {id:2,name:'Breathe',sim:'breathe',desc:'Smooth fade in and out.'},
  {id:3,name:'Wipe',sim:'wipe',desc:'Turns LEDs on/off one at a time, in sequence.'},
  {id:4,name:'Wipe Random',sim:'wipe',desc:'Like Wipe, but uses random colors.'},
  {id:5,name:'Random Colors',sim:'twinkle',desc:'Fades to a new random color periodically.'},
  {id:6,name:'Sweep',sim:'wipe',desc:'Like Wipe, but reverses direction each cycle.'},
  {id:7,name:'Dynamic',sim:'twinkle',desc:'Assigns a random color to every LED.'},
  {id:8,name:'Colorloop',sim:'colorloop',desc:'Cycles the whole strip through the color wheel.'},
  {id:9,name:'Rainbow',sim:'rainbow',desc:'Cycles the whole strip through a rainbow.'},
  {id:10,name:'Scan',sim:'scan',desc:'A single dot sweeps back and forth.'},
  {id:11,name:'Dual Scan',sim:'scan',desc:'Two dots sweep back and forth.'},
  {id:12,name:'Fade',sim:'breathe',desc:'Fades between color 1 and 2.'},
  {id:13,name:'Theater',sim:'theaterChase',desc:'Theater marquee style chase.'},
  {id:14,name:'Theater Rainbow',sim:'theaterChase',desc:'Theater chase cycling through a rainbow.'},
  {id:15,name:'Running',sim:'runningLights',desc:'Running lights, like a marquee wave.'},
  {id:16,name:'Saw',sim:'runningLights',desc:'Sawtooth brightness wave along the strip.'},
  {id:17,name:'Twinkle',sim:'twinkle',desc:'Random LEDs light up and fade.'},
  {id:18,name:'Dissolve',sim:'twinkle',desc:'Randomly dissolves between colors.'},
  {id:19,name:'Dissolve Rnd',sim:'twinkle',desc:'Dissolve using random colors.'},
  {id:20,name:'Sparkle',sim:'sparkle',desc:'Single random sparkle on the base color.'},
  {id:21,name:'Sparkle Dark',sim:'sparkle',desc:'Sparkle, base color starts off.'},
  {id:22,name:'Sparkle+',sim:'sparkle',desc:'More/brighter sparkles.'},
  {id:23,name:'Strobe',sim:'blink',desc:'Fast strobe between color 1 and 2.'},
  {id:24,name:'Strobe Rainbow',sim:'blink',desc:'Strobe cycling through a rainbow.'},
  {id:25,name:'Strobe Mega',sim:'blink',desc:'Bigger, brighter strobe flashes.'},
  {id:26,name:'Blink Rainbow',sim:'blink',desc:'Blink cycling through a rainbow.'},
  {id:27,name:'Android',sim:'chase',desc:'A block of light moves along, changing size.'},
  {id:28,name:'Chase',sim:'chase',desc:'A block of color chases along the strip.'},
  {id:29,name:'Chase Random',sim:'chase',desc:'Chase using random colors.'},
  {id:30,name:'Chase Rainbow',sim:'chase',desc:'Chase cycling through a rainbow.'},
  {id:31,name:'Chase Flash',sim:'chase',desc:'Chase with a white flash.'},
  {id:32,name:'Chase Flash Rnd',sim:'chase',desc:'Chase Flash with random colors.'},
  {id:33,name:'Rainbow Runner',sim:'chase',desc:'A rainbow dot runs along the strip.'},
  {id:34,name:'Colorful',sim:'colorloop',desc:'Shifting mix of colors.'},
  {id:35,name:'Traffic Light',sim:'blink',desc:'Simulates a traffic light sequence.'},
  {id:36,name:'Sweep Random',sim:'wipe',desc:'Sweep effect with random colors.'},
  {id:37,name:'Running 2',sim:'runningLights',desc:'Alternate running-lights pattern.'},
  {id:38,name:'Aurora',sim:'noise',desc:'Slow-shifting aurora-like color bands.'},
  {id:39,name:'Stream',sim:'stream',desc:'Flowing stream of color along the strip.'},
  {id:40,name:'Scanner',sim:'scan',desc:'Cylon-style scanning eye.'},
  {id:41,name:'Lighthouse',sim:'scan',desc:'Slow sweeping beam.'},
  {id:42,name:'Fireworks',sim:'sparkle',desc:'Random bursts that fade out.'},
  {id:43,name:'Rain',sim:'rain',desc:'Droplets of light run down the strip.'},
  {id:44,name:'Merry Christmas',sim:'runningLights',desc:'Red & green alternating chase.'},
  {id:45,name:'Fire Flicker',sim:'fire',desc:'Simulates flickering flame colors.'},
  {id:46,name:'Gradient',sim:'wipe',desc:'Moving gradient band between colors.'},
  {id:47,name:'Loading',sim:'loading',desc:'A bright peak travels the strip and wraps, fading behind it.'},
  {id:48,name:'Police',sim:'police',desc:'Red/blue police-light alternation.'},
  {id:49,name:'Police All',sim:'police',desc:'Police lights across the whole strip.'},
  {id:50,name:'Two Dots',sim:'twoDots',desc:'Two colored dots move along the strip.'},
  {id:51,name:'Two Areas',sim:'wipe',desc:'Two colored regions move and swap.'},
  {id:52,name:'Circus',sim:'theaterChase',desc:'Circus-tent style alternating chase.'},
  {id:53,name:'Halloween',sim:'runningLights',desc:'Purple & orange running pattern.'},
  {id:54,name:'Tri Chase',sim:'triChase',desc:'Chase using three colors.'},
  {id:55,name:'Tri Wipe',sim:'wipe',desc:'Wipe using three colors in sequence.'},
  {id:56,name:'Tri Fade',sim:'breathe',desc:'Fades through three colors.'},
  {id:57,name:'Lightning',sim:'sparkle',desc:'Simulated lightning flashes.'},
  {id:58,name:'ICU',sim:'scan',desc:'Two "eyes" scan and occasionally meet.'},
  {id:59,name:'Multi Comet',sim:'multiComet',desc:'Several comets chase with fading tails.'},
  {id:60,name:'Scanner Dual',sim:'scan',desc:'Two scanning eyes, mirrored.'},
  {id:61,name:'Stream 2',sim:'stream',desc:'Alternate flowing stream pattern.'},
  {id:62,name:'Oscillate',sim:'scan',desc:'Blocks oscillate back and forth.'},
  {id:63,name:'Pride 2015',sim:'rainbowCycle',desc:'Shifting rainbow, classic FastLED demo reel.'},
  {id:64,name:'Juggle',sim:'twinkle',desc:'Several bouncing, blending dots.'},
  {id:65,name:'Palette',sim:'noise',desc:'Displays the selected palette directly.'},
  {id:66,name:'Fire 2012',sim:'fire',desc:'Classic FastLED fire simulation.'},
  {id:67,name:'Colorwaves',sim:'rainbowCycle',desc:'Smooth shifting color waves.'},
  {id:68,name:'BPM',sim:'breathe',desc:'Pulses in time with a set beats-per-minute.'},
  {id:69,name:'Fill Noise',sim:'noise',desc:'Perlin-noise-filled color field.'},
  {id:70,name:'Noise 1',sim:'noise',desc:'Noise variant 1.'},
  {id:71,name:'Noise 2',sim:'noise',desc:'Noise variant 2.'},
  {id:72,name:'Noise 3',sim:'noise',desc:'Noise variant 3.'},
  {id:73,name:'Noise 4',sim:'noise',desc:'Noise variant 4.'},
  {id:74,name:'Colortwinkles',sim:'twinkle',desc:'Twinkling LEDs cycling colors.'},
  {id:75,name:'Lake',sim:'noise',desc:'Calm, water-like shifting color.'},
  {id:76,name:'Meteor',sim:'meteor',desc:'A meteor with a fading tail.'},
  {id:77,name:'Meteor Smooth',sim:'meteor',desc:'Smoother meteor with softer tail.'},
  {id:78,name:'Railway',sim:'blink',desc:'Alternating railway-crossing style blink.'},
  {id:79,name:'Ripple',sim:'sparkle',desc:'Ripples that expand and fade.'},
  {id:80,name:'Twinklefox',sim:'twinkle',desc:'Soft, foggy twinkling.'},
  {id:81,name:'Twinklecat',sim:'twinkle',desc:'Brighter, faster twinkle variant.'},
  {id:82,name:'Halloween Eyes',sim:'scan',desc:'Pairs of eyes appear and blink.'},
  {id:83,name:'Solid Pattern',sim:'theaterChase',desc:'Repeating solid-color pattern blocks.'},
  {id:84,name:'Solid Pattern Tri',sim:'theaterChase',desc:'Pattern blocks using three colors.'},
  {id:85,name:'Spots',sim:'theaterChase',desc:'Evenly spaced colored spots.'},
  {id:86,name:'Spots Fade',sim:'theaterChase',desc:'Spots that fade in and out.'},
  {id:87,name:'Glitter',sim:'sparkle',desc:'Rainbow background with white glitter.'},
  {id:88,name:'Candle',sim:'fire',desc:'Gentle candle-flame flicker.'},
  {id:89,name:'Fireworks Starburst',sim:'sparkle',desc:'Multi-color firework bursts.'},
  {id:90,name:'Fireworks 1D',sim:'sparkle',desc:'Fireworks adapted for a single strip.'},
  {id:91,name:'Bouncing Balls',sim:'scan',desc:'Simulated bouncing balls with gravity.'},
  {id:92,name:'Sinelon',sim:'sinelon',desc:'A dot moves back and forth, sine-timed.'},
  {id:93,name:'Sinelon Dual',sim:'sinelon',desc:'Two sinelon dots, mirrored.'},
  {id:94,name:'Sinelon Rainbow',sim:'sinelon',desc:'Sinelon cycling through a rainbow.'},
  {id:95,name:'Popcorn',sim:'sparkle',desc:'Random "pops" appear along the strip.'},
  {id:96,name:'Drip',sim:'rain',desc:'Simulated dripping liquid with bounce.'},
  {id:97,name:'Plasma',sim:'noise',desc:'Classic plasma color-field animation.'},
  {id:98,name:'Percent',sim:'wipe',desc:'Fills a percentage of the strip.'},
  {id:99,name:'Ripple Rainbow',sim:'sparkle',desc:'Ripple effect cycling through a rainbow.'},
  {id:100,name:'Heartbeat',sim:'breathe',desc:'Double-pulse heartbeat rhythm.'},
  {id:101,name:'Pacifica',sim:'noise',desc:'Layered blue-green ocean waves.'},
  {id:102,name:'Candle Multi',sim:'fire',desc:'Independent candle flicker per LED.'},
  {id:103,name:'Solid Glitter',sim:'sparkle',desc:'Solid color with white glitter overlay.'},
  {id:104,name:'Sunrise',sim:'breathe',desc:'Gradual sunrise-style brightening.'},
  {id:105,name:'Phased',sim:'runningLights',desc:'Phase-shifted moving wave.'},
  {id:106,name:'TwinkleUp',sim:'twinkle',desc:'Twinkles fade up then down.'},
  {id:107,name:'Noise Pal',sim:'noise',desc:'Slow noise blended between two palettes.'},
  {id:108,name:'Sine',sim:'runningLights',desc:'Sine-wave brightness pattern.'},
  {id:109,name:'Phased Noise',sim:'noise',desc:'Phased wave with added noise.'},
  {id:110,name:'Flow',sim:'runningLights',desc:'Smooth flowing color gradient.'},
  {id:111,name:'Chunchun',sim:'multiComet',desc:'Birds-on-a-wire style chase.'},
  {id:112,name:'Dancing Shadows',sim:'scan',desc:'Moving spotlight "shadow" dancers.'},
  {id:113,name:'Washing Machine',sim:'runningLights',desc:'Oscillating, wrapping color motion.'},
  {id:114,name:'Candy Cane',sim:'runningLights',desc:'Red & white candy-cane stripe motion.'},
  {id:115,name:'Blends',sim:'colorloop',desc:'Smooth blends between palette colors.'},
  {id:116,name:'TV Simulator',sim:'noise',desc:'Simulates flickering TV-screen light.'},
  {id:117,name:'Dynamic Smooth',sim:'twinkle',desc:'Smoothed version of Dynamic.'}
];
const WLED_EFFECTS_BY_ID = Object.fromEntries(WLED_EFFECTS_REAL.map(e => [e.id, e]));

function createEffectContext(run, i, n, t, helpers) {
  const speedFactor = 0.15 + (run.speed / 255) * 3.2;
  const intensityFrac = run.intensity / 255;
  const frac = n > 1 ? i / (n - 1) : 0;
  const paletteStops = helpers.getPaletteStops(run);
  const c1 = paletteStops
    ? helpers.sampleGradientStops(paletteStops, (((frac + t * speedFactor * 0.04) % 1) + 1) % 1)
    : helpers.hexToRgb(run.color1);
  const c2 = helpers.hexToRgb(run.color2);
  const c3 = helpers.hexToRgb(run.color3);

  return {
    run,
    i,
    n,
    t,
    speedFactor,
    intensityFrac,
    frac,
    paletteStops,
    c1,
    c2,
    c3,
    helpers
  };
}

const EFFECT_RENDERERS = {
  solid: ({c1}) => c1,
  blink: ({c1, c2, t, speedFactor}) => {
    const on = Math.floor(t * speedFactor * 2) % 2 === 0;
    return on ? c1 : c2;
  },
  breathe: ({c1, t, speedFactor}) => {
    const b = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * speedFactor * 2));
    return [c1[0] * b, c1[1] * b, c1[2] * b];
  },
  wipe: ({c1, c2, t, speedFactor, frac}) => {
    const cyc = (t * speedFactor * 0.6) % 2;
    const filled = cyc < 1 ? cyc : 2 - cyc;
    return frac < filled ? c1 : c2;
  },
  colorloop: ({t, speedFactor, helpers}) => {
    const hue = (t * speedFactor * 40) % 360;
    return helpers.hsl2rgb(hue, 0.85, 0.5);
  },
  rainbow: ({t, speedFactor, helpers}) => {
    const hue = (t * speedFactor * 45) % 360;
    return helpers.hsl2rgb(hue, 0.9, 0.5);
  },
  rainbowCycle: ({frac, t, speedFactor, helpers}) => {
    const hue = (frac * 360 + t * speedFactor * 60) % 360;
    return helpers.hsl2rgb(hue, 0.9, 0.5);
  },
  chase: ({c1, c2, t, speedFactor, frac, intensityFrac, helpers}) => {
    const width = 0.06 + intensityFrac * 0.25;
    let pos = (t * speedFactor * 0.5) % 1;
    let d = Math.abs(frac - pos);
    d = Math.min(d, 1 - d);
    const b = helpers.clamp(1 - d / width, 0, 1);
    return helpers.lerpRgb(c2, c1, b);
  },
  theaterChase: ({c1, c2, i, t, speedFactor}) => {
    const off = Math.floor(t * speedFactor * 6);
    const on = ((i + off) % 3) === 0;
    return on ? c1 : c2;
  },
  scan: ({c1, c2, t, speedFactor, frac, intensityFrac, helpers}) => {
    const width = 0.05 + intensityFrac * 0.2;
    const tri = Math.abs(((t * speedFactor * 0.5) % 2) - 1);
    let d = Math.abs(frac - tri);
    const b = helpers.clamp(1 - d / width, 0, 1);
    return helpers.lerpRgb(c2, c1, b);
  },
  runningLights: ({c1, c2, i, t, speedFactor, helpers}) => {
    const b = 0.5 + 0.5 * Math.sin(i * 0.35 - t * speedFactor * 4);
    return helpers.lerpRgb(c2, c1, helpers.clamp(b, 0, 1));
  },
  twinkle: ({c1, c2, i, t, speedFactor, intensityFrac, helpers}) => {
    const bucket = Math.floor(t * speedFactor * 3);
    const r = helpers.hash01(i * 7.13 + bucket * 3.71);
    const threshold = 1 - (0.15 + intensityFrac * 0.5);
    if (r > threshold) {
      const b = helpers.clamp((r - threshold) / (1 - threshold), 0, 1);
      return helpers.lerpRgb(c2, c1, b);
    }
    return c2;
  },
  sparkle: ({c1, c2, i, t, speedFactor, intensityFrac, helpers}) => {
    const bucket = Math.floor(t * speedFactor * 10);
    const r = helpers.hash01(i * 3.1 + bucket * 1.7);
    const threshold = 0.85 - intensityFrac * 0.3;
    return r > threshold ? c2 : c1;
  },
  fire: ({c1, c2, i, t, speedFactor, intensityFrac, helpers}) => {
    const bucket = Math.floor(t * speedFactor * 8);
    const r = helpers.hash01(i * 0.53 + bucket * 2.13);
    const flicker = 0.35 + 0.65 * r * (0.6 + 0.4 * intensityFrac);
    return helpers.lerpRgb(c1, c2, helpers.clamp(flicker, 0, 1));
  },
  // A bright head dragging a fading tail. The fade is what separates a meteor
  // from a plain moving dot, so it decays with distance behind the head.
  meteor: ({c1, c2, t, speedFactor, frac, intensityFrac, helpers}) => {
    const tail = 0.08 + intensityFrac * 0.35;
    const head = (t * speedFactor * 0.4) % 1;
    let behind = head - frac;
    if (behind < 0) behind += 1;               // wrap: tail trails off the end
    const b = helpers.clamp(1 - behind / tail, 0, 1);
    return helpers.lerpRgb(c2, c1, b * b);     // squared -> fades fast, like WLED
  },
  // A dot swinging on a sine, leaving a short trail. Unlike chase it eases at
  // the ends and comes back rather than wrapping around.
  sinelon: ({c1, c2, t, speedFactor, frac, intensityFrac, helpers}) => {
    const trail = 0.05 + intensityFrac * 0.2;
    const pos = 0.5 + 0.5 * Math.sin(t * speedFactor * 0.6);
    const d = Math.abs(frac - pos);
    const b = helpers.clamp(1 - d / trail, 0, 1);
    return helpers.lerpRgb(c2, c1, b * b);
  },
  // Two rotating beams, red one half and blue the other. Deliberately ignores
  // the run's colors: a police light that isn't red and blue isn't the effect.
  police: ({t, speedFactor, frac, intensityFrac, helpers}) => {
    const width = 0.06 + intensityFrac * 0.18;
    const spin = (t * speedFactor * 0.35) % 1;
    const beam = (centre) => {
      let d = Math.abs(frac - centre);
      d = Math.min(d, 1 - d);                  // beams wrap around the strip
      return helpers.clamp(1 - d / width, 0, 1);
    };
    const red = beam(spin);
    const blue = beam((spin + 0.5) % 1);
    return [255 * red, 0, 255 * blue];
  },
  // Drops running down the strip, each with a short tail. Kept sparse on
  // purpose — a dense version just reads as a wipe.
  rain: ({c1, c2, n, t, speedFactor, frac, intensityFrac, helpers}) => {
    const drops = Math.max(1, Math.round(1 + intensityFrac * 4));
    const tail = 0.04 + intensityFrac * 0.06;
    let best = 0;
    for (let d = 0; d < drops; d++) {
      // Stagger each drop's phase and speed so they don't fall in lockstep.
      const phase = helpers.hash01(d * 12.9898);
      const speed = 0.25 + helpers.hash01(d * 4.1414) * 0.5;
      const head = ((t * speedFactor * speed) + phase) % 1;
      let behind = head - frac;
      if (behind < 0) behind += 1;
      best = Math.max(best, helpers.clamp(1 - behind / tail, 0, 1));
    }
    return helpers.lerpRgb(c2, c1, best * best);
  },
  // Two dots chasing round the strip, half a lap apart, each in its own color.
  twoDots: ({c1, c2, c3, t, speedFactor, frac, intensityFrac, helpers}) => {
    const width = 0.04 + intensityFrac * 0.1;
    const lead = (t * speedFactor * 0.4) % 1;
    const near = (centre) => {
      let d = Math.abs(frac - centre);
      d = Math.min(d, 1 - d);
      return helpers.clamp(1 - d / width, 0, 1);
    };
    const a = near(lead);
    const b = near((lead + 0.5) % 1);
    if (a >= b) return helpers.lerpRgb(c2, c1, a);
    return helpers.lerpRgb(c2, c3, b);
  },
  // Three colors marching in bands, cycling as they go.
  triChase: ({c1, c2, c3, i, t, speedFactor}) => {
    const off = Math.floor(t * speedFactor * 4);
    const band = ((i + off) % 3 + 3) % 3;
    return band === 0 ? c1 : band === 1 ? c2 : c3;
  },
  // Several comets at once, evenly spaced but at different speeds so they
  // drift apart and overlap rather than moving as one rigid comb.
  multiComet: ({c1, c2, t, speedFactor, frac, intensityFrac, helpers}) => {
    const comets = 3;
    const tail = 0.05 + intensityFrac * 0.12;
    let best = 0;
    for (let k = 0; k < comets; k++) {
      // Same speed, evenly spaced: differing speeds let them bunch into one
      // blob, which stops reading as "multi" at all.
      const head = ((t * speedFactor * 0.35) + k / comets) % 1;
      let behind = head - frac;
      if (behind < 0) behind += 1;
      best = Math.max(best, helpers.clamp(1 - behind / tail, 0, 1));
    }
    return helpers.lerpRgb(c2, c1, best * best);
  },
  // WLED's Loading is gradient_base(true): a bright peak travelling along the
  // strip and wrapping, fading linearly behind it. Despite the name it isn't a
  // progress bar — matched against FX.cpp rather than the label.
  loading: ({c1, c2, t, speedFactor, frac, intensityFrac, helpers}) => {
    const spread = 0.15 + intensityFrac * 0.5;
    const peak = (t * speedFactor * 0.3) % 1;
    let behind = peak - frac;
    if (behind < 0) behind += 1;
    const b = helpers.clamp(1 - behind / spread, 0, 1);
    return helpers.lerpRgb(c2, c1, b);
  },
  // WLED's Stream is mode_running_random: the whole strip carries zones of
  // random hue that scroll along it. Intensity sets zone size.
  stream: ({i, t, speedFactor, intensityFrac, helpers}) => {
    const zoneSize = Math.max(1, Math.round(1 + (1 - intensityFrac) * 8));
    const shift = Math.floor(t * speedFactor * 4);
    const zone = Math.floor((i + shift) / zoneSize);
    return helpers.hsl2rgb(helpers.hash01(zone * 2.7183) * 360, 0.9, 0.5);
  },
  noise: ({c1, c2, c3, i, t, speedFactor, paletteStops, helpers}) => {
    const val = 0.5 + 0.5 * (
      Math.sin(i * 0.3 + t * speedFactor) * 0.5 +
      Math.sin(i * 0.13 - t * speedFactor * 0.7) * 0.5
    );
    if (paletteStops && paletteStops.length >= 2) return helpers.sampleGradientStops(paletteStops, val);
    if (val < 0.5) return helpers.lerpRgb(c1, c2, val * 2);
    return helpers.lerpRgb(c2, c3, (val - 0.5) * 2);
  }
};

function computeEffectColor(run, i, n, t, helpers) {
  const key = run.simKey || run.effect;
  const renderer = EFFECT_RENDERERS[key] || EFFECT_RENDERERS.chase;
  const context = createEffectContext(run, i, n, t, helpers);
  return renderer(context);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EFFECTS,
    EFFECT_MAP,
    EFFECT_RENDERERS,
    WLED_EFFECTS_REAL,
    WLED_EFFECTS_BY_ID,
    computeEffectColor,
    createEffectContext,
  };
}
