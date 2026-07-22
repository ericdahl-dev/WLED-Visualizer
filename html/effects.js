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
  {id:'android',       label:'Android',          params:['speed','intensity','color','color2']},
  {id:'chaseRandom',   label:'Chase Random',     params:['speed','intensity']},
  {id:'chaseRainbow',  label:'Chase Rainbow',    params:['speed','intensity']},
  {id:'chaseFlash',    label:'Chase Flash',      params:['speed','color']},
  {id:'rainbowRunner', label:'Rainbow Runner',   params:['speed','intensity']},
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
// Covers the classic set (ids 0-117) plus the post-classic effects present
// in current WLED (ids 118+, including 2D and audio-reactive ones, marked in
// their descriptions). Usermod effects still come only from a live device.
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
  {id:11,name:'Scan Dual',sim:'scan',desc:'Two dots sweep back and forth, mirrored around the centre.'},
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
  {id:27,name:'Android',sim:'android',desc:'A block of light moves along, changing size.'},
  {id:28,name:'Chase',sim:'chase',desc:'A block of color chases along the strip.'},
  {id:29,name:'Chase Random',sim:'chaseRandom',desc:'Chase using random colors.'},
  {id:30,name:'Chase Rainbow',sim:'chaseRainbow',desc:'Chase cycling through a rainbow.'},
  {id:31,name:'Chase Flash',sim:'chaseFlash',desc:'Chase with a white flash.'},
  {id:32,name:'Chase Flash Rnd',sim:'chaseFlash',desc:'Chase Flash with random colors.'},
  {id:33,name:'Rainbow Runner',sim:'rainbowRunner',desc:'A rainbow dot runs along the strip.'},
  {id:34,name:'Colorful',sim:'colorloop',desc:'Shifting mix of colors.'},
  {id:35,name:'Traffic Light',sim:'blink',desc:'Simulates a traffic light sequence.'},
  {id:36,name:'Sweep Random',sim:'wipe',desc:'Sweep effect with random colors.'},
  {id:37,name:'Chase 2',sim:'chase',desc:'Chase with adjustable band width.'},
  {id:38,name:'Aurora',sim:'noise',desc:'Slow-shifting aurora-like color bands.'},
  {id:39,name:'Stream',sim:'stream',desc:'Flowing stream of color along the strip.'},
  {id:40,name:'Scanner',sim:'scan',desc:'Cylon-style scanning eye.'},
  {id:41,name:'Lighthouse',sim:'scan',desc:'Slow sweeping beam.'},
  {id:42,name:'Fireworks',sim:'sparkle',desc:'Random bursts that fade out.'},
  {id:43,name:'Rain',sim:'rain',desc:'Droplets of light run down the strip.'},
  {id:44,name:'Tetrix',sim:'wipe',desc:'Colored blocks fly in and stack up along the strip like falling Tetris pieces.'},
  {id:45,name:'Fire Flicker',sim:'fire',desc:'Simulates flickering flame colors.'},
  {id:46,name:'Gradient',sim:'wipe',desc:'Moving gradient band between colors.'},
  {id:47,name:'Loading',sim:'loading',desc:'A bright peak travels the strip and wraps, fading behind it.'},
  {id:48,name:'Rolling Balls',sim:'sinelon',desc:'Balls roll and bounce along the strip, with optional collisions and trails.'},
  {id:49,name:'Fairy',sim:'twinkle',desc:'Warm base with random colored flashers, like a string of fairy lights.'},
  {id:50,name:'Two Dots',sim:'twoDots',desc:'Two colored dots move along the strip.'},
  {id:51,name:'Fairytwinkle',sim:'twinkle',desc:'Each LED twinkles independently between color 1 and 2, fairy-light style.'},
  {id:52,name:'Running Dual',sim:'runningLights',desc:'Two running-light waves move in opposite directions, overlapping.'},
  {id:53,name:'Image',sim:'solid',desc:'Displays an image from the device filesystem; nothing to simulate offline.'},
  {id:54,name:'Chase 3',sim:'triChase',desc:'Chase using three colors in marching bands.'},
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
  {id:68,name:'Bpm',sim:'rainbowCycle',desc:'Pulses palette colors along the strip at a beats-per-minute rate.'},
  {id:69,name:'Fill Noise',sim:'noise',desc:'Perlin-noise-filled color field.'},
  {id:70,name:'Noise 1',sim:'noise',desc:'Noise variant 1.'},
  {id:71,name:'Noise 2',sim:'noise',desc:'Noise variant 2.'},
  {id:72,name:'Noise 3',sim:'noise',desc:'Noise variant 3.'},
  {id:73,name:'Noise 4',sim:'noise',desc:'Noise variant 4.'},
  {id:74,name:'Colortwinkles',sim:'twinkle',desc:'Twinkling LEDs cycling colors.'},
  {id:75,name:'Lake',sim:'noise',desc:'Calm, water-like shifting color.'},
  {id:76,name:'Meteor',sim:'meteor',desc:'A meteor with a fading tail.'},
  {id:77,name:'Copy Segment',sim:'solid',desc:'Copies another segment\'s content by ID, optionally shifted or brightened; nothing to simulate standalone.'},
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
  {id:106,name:'Twinkleup',sim:'twinkle',desc:'Fast random twinkles, intensity-controlled.'},
  {id:107,name:'Noise Pal',sim:'noise',desc:'Slow noise blended between two palettes.'},
  {id:108,name:'Sine',sim:'runningLights',desc:'Sine-wave brightness pattern.'},
  {id:109,name:'Phased Noise',sim:'noise',desc:'Phased wave with added noise.'},
  {id:110,name:'Flow',sim:'runningLights',desc:'Smooth flowing color gradient.'},
  {id:111,name:'Chunchun',sim:'multiComet',desc:'Birds-on-a-wire style chase.'},
  {id:112,name:'Dancing Shadows',sim:'scan',desc:'Moving spotlight "shadow" dancers.'},
  {id:113,name:'Washing Machine',sim:'runningLights',desc:'Oscillating, wrapping color motion.'},
  {id:114,name:'Rotozoomer',sim:'noise',desc:'2D: a rotating, zooming palette texture spins across the matrix.'},
  {id:115,name:'Blends',sim:'colorloop',desc:'Smooth blends between palette colors.'},
  {id:116,name:'TV Simulator',sim:'noise',desc:'Simulates flickering TV-screen light.'},
  {id:117,name:'Dynamic Smooth',sim:'twinkle',desc:'Smoothed version of Dynamic.'},
  // ── Post-classic effects (ids 118+), extracted from WLED main's FX.h /
  // FX.cpp metadata and mapped to preview renderers against each mode
  // function. "2D:" and "Audio-reactive:" prefixes mark effects this 1D,
  // silent canvas can only approximate texturally — connect a device and use
  // Live Mirror for the real thing.
  {id:118,name:'Spaceships',sim:'multiComet',desc:'2D: Eight palette-colored points wander on sine paths while the whole frame drifts in a direction that randomly changes every few seconds, leaving fading blurred trails.'},
  {id:119,name:'Crazy Bees',sim:'multiComet',desc:'2D: Up to five \'bee\' dots fly in straight Bresenham lines toward random flower targets (drawn as small crosses), picking a new target and hue on arrival, over a fading blurred canvas.'},
  {id:120,name:'Ghost Rider',sim:'meteor',desc:'2D: A white head moves at a slowly rotating angle and wraps at edges while spawning a spray of short-lived palette particles that scatter and fade behind it.'},
  {id:121,name:'Blobs',sim:'sinelon',desc:'2D: Soft filled circles bounce off the edges while slowly growing, shrinking, and cycling palette colors, with adjustable blur and fading trails.'},
  {id:122,name:'Scrolling Text',sim:'theaterChase',desc:'2D: Renders the segment name (or clock/date via #TIME-style tokens, defaulting to date and time) as bitmap-font text scrolling across the matrix.'},
  {id:123,name:'Drift Rose',sim:'sinelon',desc:'2D: 36 dots oscillate in and out along evenly spaced spokes around the center at different beat rates, tracing a fading, blurred rose pattern.'},
  {id:124,name:'Distortion Waves',sim:'noise',desc:'2D: Full-frame plasma of three overlapping cosine distortion fields (one per RGB channel) whose centers orbit on sine paths, producing shifting interference colors.'},
  {id:125,name:'Soap',sim:'noise',desc:'2D: A smoothed Perlin-noise palette field whose rows and columns are repeatedly displaced and interpolated by the noise itself, giving a smeared soap-film swirl.'},
  {id:126,name:'Octopus',sim:'runningLights',desc:'2D: Radial sine waves computed from each pixel\'s precomputed angle and distance rotate around the center, forming spiraling tentacle-like arms in palette colors.'},
  {id:127,name:'Waving Cell',sim:'noise',desc:'2D: Overlapping sine and cosine functions of x, y, and time produce slowly waving cellular interference bands colored from the palette, with optional blur and flow.'},
  {id:128,name:'Pixels',sim:'twinkle',desc:'Audio-reactive: Random pixels light up in palette colors with brightness set by smoothed volume while the whole strip continuously fades out.'},
  {id:129,name:'Pixelwave',sim:'stream',desc:'Audio-reactive: A pixel whose brightness follows raw volume is injected at the strip\'s center and everything shifts outward toward both ends.'},
  {id:130,name:'Juggles',sim:'sinelon',desc:'Audio-reactive: Several dots sweep back and forth on sine paths at slightly different rates, their brightness scaled by smoothed volume, over a fast fade.'},
  {id:131,name:'Matripix',sim:'stream',desc:'Audio-reactive: A palette-colored pixel with brightness from raw volume is added at one end and the whole strip shifts along, forming a scrolling volume history.'},
  {id:132,name:'Gravimeter',sim:'wipe',desc:'Audio-reactive: A Perlin-colored bar grows from one end with volume, topped by a gravity-driven peak dot that rises fast and falls back slowly.'},
  {id:133,name:'Plasmoid',sim:'runningLights',desc:'Audio-reactive: Two drifting phase waves create a plasma-like brightness pattern along the strip, with volume gating which pixels are bright enough to show.'},
  {id:134,name:'Puddles',sim:'sparkle',desc:'Audio-reactive: Short palette-colored \'puddle\' flashes appear at random positions with size proportional to raw volume, then fade away.'},
  {id:135,name:'Midnoise',sim:'wipe',desc:'Audio-reactive: A bar of drifting Perlin-noise palette colors expands symmetrically outward from the strip\'s center with length set by volume, over a continuous fade.'},
  {id:136,name:'Noisemeter',sim:'wipe',desc:'Audio-reactive: A VU-style bar of drifting Perlin-noise palette colors extends from the start of the strip with length proportional to raw volume, then fades.'},
  {id:137,name:'Freqwave',sim:'stream',desc:'Audio-reactive: The center pixel is colored by the dominant FFT frequency (hue) and volume (brightness), and pixels shift outward toward both ends.'},
  {id:138,name:'Freqmatrix',sim:'stream',desc:'Audio-reactive: Pixel 0 is colored by the dominant FFT frequency with brightness from volume, and the strip shifts one pixel along each tick like a frequency history.'},
  {id:139,name:'GEQ',sim:'noise',desc:'2D: Audio-reactive: A graphic-equalizer of vertical palette-colored bars, one per FFT frequency band, with slowly decaying peak markers on top.'},
  {id:140,name:'Waterfall',sim:'stream',desc:'Audio-reactive: The last pixel gets a color from the dominant FFT frequency (or a green-white flash on volume peaks) and the strip shifts along, scrolling the spectrum history.'},
  {id:141,name:'Freqpixels',sim:'twinkle',desc:'Audio-reactive: Random pixels flash in a color derived from the log of the dominant FFT frequency with brightness from magnitude, while the strip fades out.'},
  {id:143,name:'Noisefire',sim:'fire',desc:'Audio-reactive: A Perlin-noise flame pattern using a fixed red-orange-yellow fire palette, darker toward the strip end, with overall brightness gated by volume.'},
  {id:144,name:'Puddlepeak',sim:'sparkle',desc:'Audio-reactive: Palette-colored flashes appear at random positions only when a beat/volume peak is detected in the selected frequency bin, sized by volume, then fade.'},
  {id:145,name:'Noisemove',sim:'sinelon',desc:'Audio-reactive: Up to 16 dots, one per FFT band with brightness from that band\'s level, glide along the strip on smooth Perlin-noise paths over a fading background.'},
  {id:146,name:'Noise2D',sim:'noise',desc:'2D: The whole matrix is filled with a time-animated Perlin-noise field mapped through the palette, giving slowly swirling organic color clouds.'},
  {id:147,name:'Perlin Move',sim:'multiComet',desc:'A few palette-colored pixels wander along the strip at positions driven by Perlin noise, leaving fading trails.'},
  {id:148,name:'Ripple Peak',sim:'rain',desc:'Audio-reactive: detected volume peaks spawn ripples at random positions that expand outward in both directions and fade, colored by the dominant FFT frequency.'},
  {id:149,name:'Firenoise',sim:'fire',desc:'2D: fills the matrix with scrolling Perlin noise mapped through a fire-style red/orange/yellow palette for a flame-like texture.'},
  {id:150,name:'Squared Swirl',sim:'multiComet',desc:'2D: three palette-colored dots glide around the matrix on out-of-sync sine paths, leaving blurred fading trails.'},
  {id:151,name:'PacMan',sim:'multiComet',desc:'A PacMan dot travels the strip eating white dots with ghosts trailing behind, and eating a power dot reverses everyone so PacMan chases blue ghosts back to the start.'},
  {id:152,name:'DNA',sim:'runningLights',desc:'2D: two phase-offset sine waves scroll across the matrix like a double helix, palette-colored with pulsing brightness and blur.'},
  {id:153,name:'Matrix',sim:'rain',desc:'2D: green digital-rain code drops spawn at random columns and fall down the matrix leaving dimmer fading trails.'},
  {id:154,name:'Metaballs',sim:'noise',desc:'2D: three moving points (two Perlin-driven, one Lissajous) form blobby organic shapes where their inverse-distance fields merge, colored from the palette.'},
  {id:155,name:'Freqmap',sim:'sparkle',desc:'Audio-reactive: lights a single pixel whose position and color map the dominant FFT frequency, brightness from magnitude, over a fading background.'},
  {id:156,name:'Gravcenter',sim:'loading',desc:'Audio-reactive: a volume meter grows outward from the strip center with a gravity-falling peak dot, colored by Perlin noise over the palette.'},
  {id:157,name:'Gravcentric',sim:'loading',desc:'Audio-reactive: a mirrored volume bar expands from the strip center with gray gravity-falling peak dots, its palette color driven by the volume level.'},
  {id:158,name:'Gravfreq',sim:'loading',desc:'Audio-reactive: a mirrored center-out volume bar whose color comes from the dominant FFT frequency, with gray gravity-falling peak dots.'},
  {id:159,name:'DJ Light',sim:'stream',desc:'Audio-reactive: injects a color mixed from bass, mid, and treble FFT bins at the strip center and continuously shifts pixels outward toward both ends.'},
  {id:160,name:'Funky Plank',sim:'stream',desc:'2D: Audio-reactive: draws FFT spectrum bands as colored bars on the bottom row and scrolls them upward across the matrix.'},
  {id:161,name:'Shimmer',sim:'scan',desc:'A soft-edged glowing blob of palette color sweeps across the strip, then pauses for an adjustable (optionally random) interval before the next pass.'},
  {id:162,name:'Pulser',sim:'sinelon',desc:'2D: a single palette-colored dot traces a compound sine path across the matrix, leaving a blurred fading trail.'},
  {id:163,name:'Blurz',sim:'sparkle',desc:'Audio-reactive: lights random pixels with colors from successive FFT bins, then blurs and fades them into soft glowing blobs.'},
  {id:164,name:'Drift',sim:'rainbowCycle',desc:'2D: draws a rotating spiral of palette colors around the matrix center with heavy fade, optional twin arm, and blur.'},
  {id:165,name:'Waverly',sim:'noise',desc:'2D: Audio-reactive: Perlin-noise wave columns rise from opposite edges in mirrored palette colors, their height scaled by smoothed volume.'},
  {id:166,name:'Sun Radiation',sim:'fire',desc:'2D: renders a glowing sun-like sphere using a Perlin bump map shaded with heat colors that boils and shifts over time.'},
  {id:167,name:'Colored Bursts',sim:'multiComet',desc:'2D: gradient lines sweep between oscillating edge points in cycling palette hues, fading out with optional blur and white end dots.'},
  {id:168,name:'Julia',sim:'noise',desc:'2D: renders an animated Julia-set fractal whose parameters slowly drift, colored from the palette.'},
  {id:172,name:'Game Of Life',sim:'twinkle',desc:'2D: runs Conway\'s Game of Life with palette-colored newborn cells and fading dead cells, reseeding a new colony when the pattern stalls or repeats.'},
  {id:173,name:'Tartan',sim:'runningLights',desc:'2D: overlapping horizontal and vertical sine-gradient stripes form a slowly drifting plaid pattern in palette colors with adjustable sharpness.'},
  {id:174,name:'Polar Lights',sim:'noise',desc:'2D: aurora-like bands of drifting Perlin noise sweep across the matrix, brightest near the middle rows, rendered through an aurora palette.'},
  {id:175,name:'Swirl',sim:'sinelon',desc:'2D: Audio-reactive: mirrored pairs of dots swirl on sine paths with brightness driven by mic volume, smeared into swirls by blur.'},
  {id:176,name:'Lissajous',sim:'runningLights',desc:'2D: plots a 256-point palette-colored Lissajous curve that rotates and morphs, with adjustable fade and blur.'},
  {id:177,name:'Frizzles',sim:'multiComet',desc:'2D: eight palette-colored dots dart around on crossing sine paths at different frequencies, leaving fading blurred trails.'},
  {id:178,name:'Plasma Ball',sim:'noise',desc:'2D: Perlin-noise-warped diagonal and edge lines flash across the matrix in a single palette color that slowly cycles, with fading trails and optional blur, resembling arcs inside a plasma globe.'},
  {id:179,name:'Flow Stripe',sim:'stream',desc:'Layered sine functions centered on a point along the strip produce smooth waves of palette color that flow and shift hue continuously over the whole strip.'},
  {id:180,name:'Hiphotic',sim:'noise',desc:'2D: Fills the matrix with a moving plasma interference pattern built from nested sine and cosine functions of x, y, and time, colored from the palette.'},
  {id:181,name:'Sindots',sim:'sinelon',desc:'2D: Thirteen palette-colored dots travel along Lissajous-style sine paths across the matrix, leaving fading, optionally blurred trails.'},
  {id:182,name:'DNA Spiral',sim:'runningLights',desc:'2D: Two intertwined sine-wave strands scroll along the matrix, connected by palette gradient rungs with white and gray dots at the strand crossings, like a rotating double helix.'},
  {id:183,name:'Black Hole',sim:'sinelon',desc:'2D: Eight outer and four inner dots orbit on sine paths around a central white pixel, leaving fading trails that swirl toward the middle.'},
  {id:184,name:'Wavesins',sim:'runningLights',desc:'Sine-based brightness waves ripple along the strip while a beatsin oscillator sweeps each pixel\'s palette index through a configurable color range with phase shifting.'},
  {id:185,name:'Rocktaves',sim:'sinelon',desc:'Audio-reactive: a single dot bounces along the strip via beatsin at a rate set by the detected octave, colored by the detected musical note and brightened by volume; nearly dark without audio.'},
  {id:186,name:'Akemi',sim:'colorloop',desc:'2D: Audio-reactive: draws a pixel-art anime character whose face color cycles through the color wheel, adds mirrored GEQ spectrum bars on both sides, and makes the figure dance when bass is high; a static color-cycling image without audio.'},
  {id:187,name:'PS Volcano',sim:'fire',desc:'2D: A particle source at the bottom sprays palette-colored particles upward like an eruption, with options for the nozzle to move and bounce side to side and for particles to collide.'},
  {id:188,name:'PS Fire',sim:'fire',desc:'2D: Realistic particle-based fire with heat-driven flames and Perlin-noise wind, using multiple flame sources across the segment width.'},
  {id:189,name:'PS Fireworks',sim:'sparkle',desc:'2D: Rockets launch upward and explode into expanding bursts of colored particles, sometimes in defined patterns, with gravity and blur options.'},
  {id:190,name:'PS Vortex',sim:'multiComet',desc:'2D: A rotating multi-arm emitter at the center sprays particles that spiral outward with trails, with controls for arm count, rotation speed and direction flips.'},
  {id:191,name:'PS Fuzzy Noise',sim:'noise',desc:'2D: Particles roll downhill on invisible Perlin-noise terrain, following the slope gradient to form a drifting, fuzzy noise-like shimmer.'},
  {id:192,name:'PS Ballpit',sim:'rain',desc:'2D: Palette-colored particles continuously fall and can bounce off walls and floor with collisions, producing rain, snow, or confetti-like looks.'},
  {id:193,name:'PS Box',sim:'rain',desc:'2D: Particles are trapped in a box while gravity changes direction randomly or sloshes side to side, tumbling the contents like a shaken container or washing machine.'},
  {id:194,name:'PS Attractor',sim:'multiComet',desc:'2D: A gravitational attractor sits at the matrix center while a bouncing emitter seeds particles that orbit it under an inverse-square force, with optional collisions and age-based color.'},
  {id:195,name:'PS Impact',sim:'meteor',desc:'2D: Meteor particles smash down under gravity and explode into debris particles when they hit the ground.'},
  {id:196,name:'PS Waterfall',sim:'rain',desc:'2D: Spray sources at the top emit palette-colored particles that fall like water, with adjustable position, spread, and wall/ground collision options.'},
  {id:197,name:'PS Spray',sim:'multiComet',desc:'2D: Audio-reactive: a single nozzle sprays particles at an adjustable angle and direction with optional gravity; when audio is present, volume drives emission rate, particle speed, lifetime, and hue.'},
  {id:200,name:'PS Ghost Rider',sim:'meteor',desc:'2D: A comet-like head wanders around the matrix on a curving path, spraying a spiral trail of color-cycling particles behind it as it turns.'},
  {id:201,name:'PS Blobs',sim:'multiComet',desc:'2D: Audio-reactive: a few large soft particles bounce around the matrix while growing, shrinking, and wobbling in size and shape; with audio, volume sets blob size in pulsate mode.'},
  {id:203,name:'PS Pinball',sim:'sinelon',desc:'Particle-physics balls shot up from one end bounce along the strip under adjustable gravity with collisions, size, and motion blur, replicating bouncing balls, rolling balls, and juggle.'},
  {id:217,name:'PS Galaxy',sim:'multiComet',desc:'2D: Particles emitted near the center spiral inward around it like a galaxy, colored by distance and turning white toward the core, with an alternate starfield mode where they fly outward.'},
  {id:218,name:'Color Clouds',sim:'noise',desc:'Slow-moving Perlin-noise clouds of palette color drift along the strip, separated by dark gaps, with independently drifting hue and an optional cozy mode that softens palette wraparound.'},
  {id:219,name:'Slow Transition',sim:'solid',desc:'Displays the selected palette as a static gradient and, when the color or palette changes, cross-fades to the new one over a set number of minutes, optionally sweeping one palette entry at a time.'},
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
  // FX.cpp mode_android: one block, growing in place then shrinking while its
  // start advances. Approximated with a triangle-wave size and drifting start.
  android: ({c1, c2, t, speedFactor, frac, intensityFrac, helpers}) => {
    const maxSize = 0.08 + intensityFrac * 0.4;
    const phase = (t * speedFactor * 0.25) % 2;
    const size = Math.max(0.03, maxSize * (phase < 1 ? phase : 2 - phase));
    const start = (t * speedFactor * 0.15) % 1;
    let d = frac - start;
    if (d < 0) d += 1;
    return d < size ? c1 : c2;
  },
  // FX.cpp chase(): marching bands over a background; Chase Random re-rolls
  // the background hue each lap.
  chaseRandom: ({i, n, t, speedFactor, frac, intensityFrac, helpers}) => {
    const lap = Math.floor(t * speedFactor * 0.5);
    const bg = helpers.hsl2rgb(helpers.hash01(lap * 7.77) * 360, 0.85, 0.5);
    const size = 0.02 + intensityFrac * 0.15;
    const a = (t * speedFactor * 0.5) % 1;
    let d = frac - a;
    if (d < 0) d += 1;
    if (d < size) return [255, 255, 255];
    if (d < size * 2) return [0, 0, 0];
    return bg;
  },
  // Chase Rainbow: same bands, background hue cycling continuously.
  chaseRainbow: ({t, speedFactor, frac, intensityFrac, helpers}) => {
    const bg = helpers.hsl2rgb((t * speedFactor * 40) % 360, 0.85, 0.5);
    const size = 0.02 + intensityFrac * 0.15;
    const a = (t * speedFactor * 0.5) % 1;
    let d = frac - a;
    if (d < 0) d += 1;
    if (d < size) return [255, 255, 255];
    if (d < size * 2) return [0, 0, 0];
    return bg;
  },
  // FX.cpp mode_chase_flash: background, plus a two-LED white flash blinking
  // a few times at one position before it advances.
  chaseFlash: ({c1, n, t, speedFactor, frac, helpers}) => {
    const step = Math.floor(t * speedFactor * 6);
    const pos = (helpers.hash01(Math.floor(step / 8) * 3.33) + Math.floor(step / 8) * 0.13) % 1;
    const flashing = (step % 2 === 0) && (step % 8) < 6;
    let d = Math.abs(frac - pos);
    d = Math.min(d, 1 - d);
    if (flashing && d < 1.5 / Math.max(2, n)) return [255, 255, 255];
    return c1;
  },
  // FX.cpp mode_chase_rainbow_white ("Rainbow Runner"): the background is a
  // rainbow along the strip; the chase bands run over it.
  rainbowRunner: ({t, speedFactor, frac, intensityFrac, helpers}) => {
    const size = 0.02 + intensityFrac * 0.15;
    const a = (t * speedFactor * 0.5) % 1;
    let d = frac - a;
    if (d < 0) d += 1;
    if (d < size) return [255, 255, 255];
    return helpers.hsl2rgb((frac * 360 + t * speedFactor * 30) % 360, 0.85, 0.5);
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

// WLED's segment mirror: the effect renders on half the (grouped) length and
// reflects about the centre — FX_fcn.cpp halves vLength with (v+1)/2 and
// writes each pixel to both x and len-1-x. Same mapping here, per group.
function mirroredGroup(groupIndex, totalGroups) {
  const count = Math.ceil(totalGroups / 2);
  const index = groupIndex < count ? groupIndex : totalGroups - 1 - groupIndex;
  return { index, count };
}

/* Effect references. One codec owns the 'wled_N' / 'live_N' string
   convention; everything else holds {kind, id|key}. The live→wled id mapping
   is the WLED JSON API contract: the /json/eff array index IS the effect id
   (gaps stay aligned via RSVD entries) — verified on hardware, not assumed. */

function parseEffectValue(val) {
  if (typeof val === 'string') {
    if (val.startsWith('wled_')) return { kind: 'wled', id: parseInt(val.slice(5)) };
    if (val.startsWith('live_')) return { kind: 'live', id: parseInt(val.slice(5)) };
  }
  return { kind: 'sim', key: String(val) };
}

function formatEffectValue(ref) {
  if (ref.kind === 'wled') return 'wled_' + ref.id;
  if (ref.kind === 'live') return 'live_' + ref.id;
  return ref.key;
}

// ctx carries what only the app knows: the connected device's effect names
// and its name→sim guesser. Both optional — offline resolution needs neither.
function resolveEffectRef(ref, ctx) {
  const value = formatEffectValue(ref);
  if (ref.kind === 'wled') {
    const fx = WLED_EFFECTS_BY_ID[ref.id];
    return {
      value,
      label: fx ? fx.name : value,
      simKey: fx ? fx.sim : 'chase',
      wledId: ref.id,
    };
  }
  if (ref.kind === 'live') {
    const label = (ctx && ctx.liveNames && ctx.liveNames[ref.id] !== undefined) ? ctx.liveNames[ref.id] : value;
    return {
      value,
      label,
      simKey: (ctx && ctx.guessSim) ? ctx.guessSim(label) : 'chase',
      wledId: ref.id,
    };
  }
  return { value, label: value, simKey: ref.key, wledId: null };
}

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
    mirroredGroup,
    parseEffectValue,
    formatEffectValue,
    resolveEffectRef,
    createEffectContext,
  };
}
