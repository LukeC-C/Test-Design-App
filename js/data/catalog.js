// Clothing taxonomy: Category → Genre → Type → Cut → Material.
// Each type names a garment template (`tpl`) plus base params (`p`).
// Each cut carries param overrides that are merged on top of the type's.
import { MATERIALS, MATERIAL_SETS } from './materials.js';

const c = (id, label, d, p = {}) => ({ id, label, d, p });
const t = (id, label, d, tpl, p, cuts, materials) => ({ id, label, d, tpl, p, cuts, materials });

// ─────────────────────────────────────────────────────────────────
// Cut sets
// ─────────────────────────────────────────────────────────────────
export const CUT_SETS = {
  tee: [
    c('classic', 'Classic Fit', 'True-to-size, straight through the body'),
    c('slim', 'Slim Fit', 'Closer to the body with narrower sleeves', { w: 86, sleeveW: 0.88 }),
    c('relaxed', 'Relaxed Fit', 'A little extra room everywhere', { w: 104 }),
    c('oversized', 'Oversized', 'Roomy body with a longer length', { w: 116, len: 430, drop: 0.8 }),
    c('boxy', 'Boxy', 'Wide and cropped short for a square shape', { w: 112, len: 360, drop: 0.6 }),
    c('dropShoulder', 'Drop Shoulder', 'Shoulder seam sits down on the arm', { w: 104, drop: 1 }),
    c('cropped', 'Cropped', 'Shortened hem that sits above the waist', { len: 310 }),
    c('longline', 'Longline', 'Extended length with a curved hem', { len: 470, hem: 'curved' }),
    c('muscle', 'Muscle Fit', 'Tapered waist with short cap sleeves', { w: 90, flare: 0.9, sleeve: 'cap' }),
    c('raglan', 'Raglan', 'Diagonal seam from collar to underarm', { raglan: true }),
    c('curvedHem', 'Curved Hem', 'Scooped shirt-tail hem', { hem: 'curved' }),
    c('fittedWaist', 'Fitted Waist', 'Shaped through the waist', { flare: 0.84, w: 92 }),
    c('heavyBoxy', 'Heavyweight Boxy', 'Dense, wide, mock-neck feel', { w: 114, len: 380, drop: 0.7, neck: 'mock' }),
  ],
  sweat: [
    c('classic', 'Classic Fit', 'Regular fit with rib cuffs and hem'),
    c('dropShoulder', 'Drop Shoulder', 'Shoulder seam sits down on the arm', { w: 106, drop: 1 }),
    c('oversized', 'Oversized', 'Extra room and length throughout', { w: 118, len: 430, drop: 0.9 }),
    c('boxy', 'Boxy', 'Wide and cropped for a square shape', { w: 114, len: 370, drop: 0.7 }),
    c('cropped', 'Cropped', 'Short body that sits above the waist', { len: 320 }),
    c('slim', 'Slim Fit', 'Close to the body', { w: 86, sleeveW: 0.88 }),
    c('raglan', 'Raglan', 'Diagonal sleeve seams for easy movement', { raglan: true }),
    c('relaxed', 'Relaxed Fit', 'A touch roomier than classic', { w: 104 }),
    c('longline', 'Longline', 'Extended body length', { len: 470 }),
    c('openHem', 'Open Hem', 'No rib band — straight raw hem', { hem: 'straight', cuffs: false }),
    c('cinched', 'Cinched Hem', 'Elastic drawcord hem', { hem: 'drawcord' }),
    c('sleeveless', 'Sleeveless', 'Cut-off arms for layering', { sleeve: 'none' }),
    c('shortSleeve', 'Short Sleeve', 'Short sleeves for warmer days', { sleeve: 'short', cuffs: false }),
    c('heavyweight', 'Heavyweight Boxy', 'Wide dropped body, double-layer hood feel', { w: 120, len: 400, drop: 1, sleeveW: 1.12 }),
  ],
  knit: [
    c('classic', 'Classic Fit', 'Regular fit with rib trims'),
    c('relaxed', 'Relaxed Fit', 'A little more room through body', { w: 104 }),
    c('oversized', 'Oversized', 'Slouchy volume with longer length', { w: 120, len: 430, drop: 1 }),
    c('dropShoulder', 'Drop Shoulder', 'Soft dropped shoulder line', { w: 106, drop: 1 }),
    c('cropped', 'Cropped', 'Short body above the waist', { len: 320 }),
    c('boxy', 'Boxy', 'Square and slightly cropped', { w: 114, len: 370, drop: 0.7 }),
    c('slim', 'Slim Fit', 'Close-fitting knit', { w: 86, sleeveW: 0.86 }),
    c('longline', 'Longline / Tunic', 'Extended length to the hip', { len: 480 }),
    c('raglan', 'Raglan', 'Fully-fashioned raglan sleeves', { raglan: true }),
    c('balloon', 'Balloon Sleeve', 'Voluminous sleeves gathered at the cuff', { sleeveW: 1.45 }),
    c('fitted', 'Fitted Waist', 'Shaped to the waist', { flare: 0.84, w: 92 }),
    c('chunky', 'Chunky Oversized', 'Big, cosy, cocoon-like', { w: 124, len: 440, drop: 1, sleeveW: 1.2 }),
  ],
  shirt: [
    c('classic', 'Classic Fit', 'Straight body, regular sleeves'),
    c('slim', 'Slim Fit', 'Tapered through body and sleeves', { w: 86, flare: 0.94, sleeveW: 0.88 }),
    c('tailored', 'Tailored Fit', 'Shaped with a defined waist', { w: 90, flare: 0.88 }),
    c('relaxed', 'Relaxed Fit', 'Easy fit with room to move', { w: 104 }),
    c('oversized', 'Oversized', 'Generous volume and longer hem', { w: 118, len: 440, drop: 0.9 }),
    c('boxy', 'Boxy', 'Wide and cropped', { w: 112, len: 370, drop: 0.6, hem: 'straight' }),
    c('cropped', 'Cropped', 'Short hem above the waist', { len: 320, hem: 'straight' }),
    c('dropShoulder', 'Drop Shoulder', 'Relaxed dropped shoulder', { w: 106, drop: 1 }),
    c('shortSleeve', 'Short Sleeve', 'Short sleeves, same body', { sleeve: 'short' }),
    c('sleeveless', 'Sleeveless', 'Arms cut away', { sleeve: 'none' }),
    c('longline', 'Longline', 'Extra-long tail', { len: 480 }),
    c('straightHem', 'Straight Hem', 'Flat hem made to be worn untucked', { hem: 'straight' }),
    c('threeQuarter', '¾ Sleeve', 'Sleeves end below the elbow', { sleeve: 'threeq' }),
  ],
  jacket: [
    c('classic', 'Classic Fit', 'Regular fit, hip length'),
    c('oversized', 'Oversized', 'Roomy, longer and dropped', { w: 122, len: 440, drop: 0.9 }),
    c('cropped', 'Cropped', 'Short body sitting at the waist', { len: 330 }),
    c('boxy', 'Boxy', 'Square silhouette', { w: 116, len: 380, drop: 0.6 }),
    c('slim', 'Slim Fit', 'Close-cut and streamlined', { w: 88, sleeveW: 0.9 }),
    c('relaxed', 'Relaxed Fit', 'Easy, roomy fit', { w: 106 }),
    c('longline', 'Longline', 'Extended past the hip', { len: 480 }),
    c('dropShoulder', 'Drop Shoulder', 'Soft dropped shoulder', { w: 108, drop: 1 }),
    c('raglan', 'Raglan', 'Raglan sleeves for mobility', { raglan: true }),
    c('cinched', 'Cinched Waist', 'Drawcord at the hem', { hem: 'drawcord' }),
    c('belted', 'Belted', 'Self-fabric belt at the waist', { belt: true }),
  ],
  coat: [
    c('classic', 'Classic', 'Knee-length, single-breasted'),
    c('doubleBreasted', 'Double-Breasted', 'Two columns of buttons, wide overlap', { open: 'double' }),
    c('belted', 'Belted', 'Tie belt cinches the waist', { belt: true }),
    c('oversized', 'Oversized', 'Volume through shoulders and body', { w: 124, drop: 1 }),
    c('cocoon', 'Cocoon', 'Rounded, egg-shaped silhouette', { w: 116, flare: 1.08, drop: 0.8 }),
    c('slim', 'Slim / Tailored', 'Streamlined close cut', { w: 90, flare: 1.02 }),
    c('maxi', 'Maxi Length', 'Falls past the calf', { len: 680 }),
    c('midi', 'Mid-Length', 'Hits just above the knee', { len: 540 }),
    c('car', 'Car Coat', 'Short, hip-length topper', { len: 450 }),
    c('dropShoulder', 'Drop Shoulder', 'Soft dropped shoulder', { w: 108, drop: 1 }),
    c('raglan', 'Raglan', 'Raglan sleeves, relaxed shoulder', { raglan: true }),
    c('aLine', 'A-Line / Swing', 'Flares out from the chest', { flare: 1.25 }),
  ],
  vest: [
    c('classic', 'Classic', 'Regular fit, hip length'),
    c('cropped', 'Cropped', 'Short, waist length', { len: 330 }),
    c('oversized', 'Oversized', 'Roomy and longer', { w: 116, len: 430 }),
    c('slim', 'Slim Fit', 'Close-cut', { w: 88 }),
    c('longline', 'Longline', 'Extended length', { len: 480 }),
    c('boxy', 'Boxy', 'Wide and square', { w: 112, len: 370 }),
  ],
  tank: [
    c('classic', 'Classic', 'Regular straps and body'),
    c('racerback', 'Racerback', 'Straps meet in a T at the back', { back: 'racer' }),
    c('cropped', 'Cropped', 'Short body above the navel', { len: 300 }),
    c('longline', 'Longline', 'Extended body length', { len: 460 }),
    c('relaxed', 'Relaxed', 'Loose, easy fit', { w: 106 }),
    c('slim', 'Slim / Fitted', 'Body-skimming', { w: 84, flare: 0.92 }),
    c('wideStrap', 'Wide Strap', 'Broad shoulder straps', { strapW: 40 }),
    c('thinStrap', 'Spaghetti Strap', 'Delicate thin straps', { straps: 'thin' }),
    c('scoop', 'Scoop Neck', 'Deep, rounded neckline', { neck: 'scoop' }),
    c('square', 'Square Neck', 'Straight-across neckline', { neck: 'square' }),
    c('highNeck', 'High Neck', 'Neckline sits close to the collarbone', { neck: 'mock' }),
    c('oversized', 'Oversized', 'Deep armholes, extra volume', { w: 114, armDeep: 40 }),
  ],
  active: [
    c('regular', 'Regular Fit', 'Standard athletic fit'),
    c('compression', 'Compression', 'Second-skin compressive fit', { w: 80, sleeveW: 0.82, flare: 0.94 }),
    c('fitted', 'Fitted', 'Close to the body without compression', { w: 88, sleeveW: 0.9 }),
    c('relaxed', 'Relaxed', 'Loose for unrestricted movement', { w: 106 }),
    c('cropped', 'Cropped', 'Shortened hem', { len: 310 }),
    c('longline', 'Longline', 'Extended length for coverage', { len: 470 }),
    c('raglan', 'Raglan', 'Raglan sleeves for range of motion', { raglan: true }),
    c('sleeveless', 'Sleeveless', 'Sleeves removed for airflow', { sleeve: 'none' }),
    c('racerback', 'Racerback', 'Open back for movement', { back: 'racer' }),
  ],
  bra: [
    c('classic', 'Classic', 'Scoop front, standard straps'),
    c('longline', 'Longline', 'Extended band below the bust', { len: 270 }),
    c('racerback', 'Racerback', 'Straps meet at the upper back', { back: 'racer' }),
    c('crossback', 'Cross-Back', 'Straps cross at the back', { back: 'cross' }),
    c('highNeck', 'High Neck', 'Higher coverage neckline', { neck: 'mock' }),
    c('square', 'Square Neck', 'Straight-across neckline', { neck: 'square' }),
    c('vNeck', 'V-Neck', 'Plunging V front', { neck: 'v' }),
  ],
  // Bottoms
  pants: [
    c('straight', 'Straight Leg', 'Same width from knee to hem'),
    c('slim', 'Slim', 'Narrow through thigh and leg', { thigh: 46, knee: 36, hem: 30 }),
    c('skinny', 'Skinny', 'Closely fitted throughout', { thigh: 42, knee: 30, hem: 24 }),
    c('relaxed', 'Relaxed', 'Roomy seat and thigh', { thigh: 60, knee: 50, hem: 46 }),
    c('wideLeg', 'Wide Leg', 'Wide from hip to hem', { thigh: 64, knee: 64, hem: 70, spread: 10 }),
    c('tapered', 'Tapered', 'Roomy top narrowing to the ankle', { thigh: 58, knee: 42, hem: 30 }),
    c('bootcut', 'Bootcut', 'Slim knee, slight flare at hem', { thigh: 48, knee: 38, hem: 50 }),
    c('flare', 'Flare', 'Fitted to knee, dramatic flare', { thigh: 46, knee: 36, hem: 66, spread: 6 }),
    c('baggy', 'Baggy', 'Very loose, stacks at the ankle', { thigh: 68, knee: 64, hem: 62, spread: 8, hipW: 108 }),
    c('barrel', 'Barrel Leg', 'Curved, bowed leg tapering at hem', { thigh: 60, knee: 70, hem: 40 }),
    c('cropped', 'Cropped', 'Ends above the ankle', { len: 500 }),
    c('highRise', 'High-Rise', 'Waist sits at the natural waist', { rise: 230 }),
    c('lowRise', 'Low-Rise', 'Waist sits on the hips', { rise: 165, waistW: 96 }),
    c('pleated', 'Pleated Front', 'Front pleats add volume', { pleats: 2, thigh: 58 }),
  ],
  jeans: [
    c('straight', 'Straight', 'Classic straight leg'),
    c('slim', 'Slim', 'Narrow thigh and leg', { thigh: 46, knee: 36, hem: 30 }),
    c('skinny', 'Skinny', 'Body-hugging throughout', { thigh: 42, knee: 30, hem: 24 }),
    c('relaxed', 'Relaxed', 'Roomy seat and thigh', { thigh: 60, knee: 50, hem: 46 }),
    c('baggy', 'Baggy', 'Very loose, stacks at the ankle', { thigh: 68, knee: 64, hem: 62, spread: 8, hipW: 108 }),
    c('bootcut', 'Bootcut', 'Slight flare to fit over boots', { thigh: 48, knee: 38, hem: 50 }),
    c('flare', 'Flare', 'Dramatic flare from knee', { thigh: 46, knee: 36, hem: 66, spread: 6 }),
    c('tapered', 'Tapered', 'Roomy top narrowing to ankle', { thigh: 58, knee: 42, hem: 30 }),
    c('wideLeg', 'Wide Leg', 'Wide from hip to hem', { thigh: 64, knee: 64, hem: 70, spread: 10 }),
    c('barrel', 'Barrel', 'Bowed, curved leg shape', { thigh: 60, knee: 70, hem: 40 }),
    c('mom', 'Mom Fit', 'High waist, tapered leg', { rise: 235, thigh: 56, knee: 44, hem: 34 }),
    c('dad', 'Dad Fit', 'Easy straight leg, mid rise', { thigh: 58, knee: 52, hem: 48 }),
    c('loose', 'Loose Straight', 'Relaxed straight from hip', { thigh: 62, knee: 58, hem: 56 }),
    c('lowRise', 'Low-Rise', 'Sits on the hips', { rise: 165, waistW: 96 }),
    c('cropped', 'Cropped / Ankle', 'Ends above the ankle', { len: 500 }),
  ],
  shorts: [
    c('mid', '7" Inseam', 'Hits mid-thigh'),
    c('short', '5" Inseam', 'Above mid-thigh', { len: 330 }),
    c('micro', '3" Inseam', 'Short and sporty', { len: 295 }),
    c('long', '9" Inseam', 'Just above the knee', { len: 410 }),
    c('bermuda', 'Bermuda (11")', 'Knee-length tailored short', { len: 450, hem: 50 }),
    c('relaxed', 'Relaxed', 'Loose, roomy leg', { thigh: 64, hem: 64 }),
    c('slim', 'Slim', 'Trim leg opening', { thigh: 50, hem: 48 }),
    c('baggy', 'Baggy', 'Wide, oversized leg', { thigh: 70, hem: 72, spread: 8, len: 430 }),
    c('pleated', 'Pleated', 'Front pleats for volume', { pleats: 2, thigh: 62, hem: 62 }),
    c('highWaisted', 'High-Waisted', 'Sits at the natural waist', { rise: 230 }),
  ],
  joggers: [
    c('classic', 'Classic Jogger', 'Tapered with rib cuffs'),
    c('tapered', 'Tapered', 'Narrowing sharply to the cuff', { thigh: 52, knee: 40, hem: 26 }),
    c('relaxed', 'Relaxed', 'Roomy throughout', { thigh: 62, knee: 54, hem: 34 }),
    c('slim', 'Slim', 'Trim through the leg', { thigh: 46, knee: 36, hem: 24 }),
    c('openHem', 'Open Hem', 'Straight leg, no cuff', { cuffs: false, hem: 46, knee: 48 }),
    c('wideLeg', 'Wide Leg', 'Wide open-hem sweatpant', { cuffs: false, thigh: 64, knee: 64, hem: 68, spread: 8 }),
    c('flared', 'Flared', 'Flared hem sweatpant', { cuffs: false, thigh: 48, knee: 38, hem: 64, spread: 6 }),
    c('stacked', 'Stacked', 'Extra length that stacks at the ankle', { stack: true, len: 600 }),
    c('cropped', 'Cropped', 'Ends above the ankle', { len: 500 }),
    c('baggy', 'Baggy', 'Oversized, loose fit', { thigh: 70, knee: 66, hem: 40, spread: 8, hipW: 110 }),
  ],
  skirt: [
    c('aLine', 'A-Line', 'Fitted waist, gently flared hem'),
    c('pencil', 'Pencil', 'Straight and narrow with back slit', { flare: 0.92, slit: true }),
    c('straight', 'Straight', 'Falls straight from the hip', { flare: 1.04 }),
    c('flared', 'Flared / Skater', 'Full, swishy hem', { flare: 1.7 }),
    c('pleated', 'Pleated', 'Knife pleats all around', { flare: 1.45, pleated: 10 }),
    c('tiered', 'Tiered', 'Stacked ruffled tiers', { flare: 1.5, tiers: 3 }),
    c('asymmetric', 'Asymmetric', 'Diagonal uneven hem', { flare: 1.3, asym: true }),
    c('wrap', 'Wrap Front', 'Overlapping panels with tie', { flare: 1.3, wrap: true }),
    c('slit', 'Side Slit', 'High slit at the side', { flare: 1.1, sideSlit: true }),
    c('bias', 'Bias Cut', 'Cut on the diagonal for fluid drape', { flare: 1.25, waistband: 'none' }),
    c('dropWaist', 'Drop Waist', 'Seam sits low on the hips', { flare: 1.5, dropWaist: true }),
    c('highWaisted', 'High-Waisted', 'Tall waistband at natural waist', { waistband: 'high' }),
    c('lowRise', 'Low-Rise', 'Sits low on the hips', { waistW: 96 }),
  ],
  leggings: [
    c('highRise', 'High-Rise', 'Tall supportive waistband'),
    c('midRise', 'Mid-Rise', 'Waistband sits below navel', { waistband: 'band' }),
    c('flared', 'Flared', 'Fitted to knee then flared', { knee: 30, hem: 56, spread: 6 }),
    c('sevenEighths', '7/8 Length', 'Ends just above the ankle', { len: 520 }),
    c('capri', 'Capri', 'Mid-calf length', { len: 450 }),
    c('biker', 'Bike Short', 'Thigh-length', { len: 330, hem: 34 }),
    c('crossover', 'Crossover Waist', 'V-shaped crossover waistband', { crossover: true }),
    c('stirrup', 'Stirrup', 'Strap under the foot', { stirrup: true }),
  ],
  // Hats
  cap: [
    c('structured', 'Structured', 'Firm front panels hold their shape'),
    c('unstructured', 'Unstructured', 'Soft crown that sits low', { structured: false, crownH: 96 }),
    c('curved', 'Curved Brim', 'Pre-curved bill', { brim: 'curved' }),
    c('flat', 'Flat Brim', 'Straight, flat bill', { brim: 'flat' }),
    c('low', 'Low Profile', 'Shallow crown', { crownH: 92 }),
    c('mid', 'Mid Profile', 'Medium crown height', { crownH: 112 }),
    c('high', 'High Profile', 'Tall, upright front', { crownH: 134 }),
    c('fivePanel', '5-Panel', 'Wide single front panel', { panels: 5 }),
    c('sixPanel', '6-Panel', 'Centre front seam', { panels: 6 }),
    c('shortBrim', 'Short Brim', 'Compact bill', { brimD: 26 }),
  ],
  beanie: [
    c('cuffed', 'Cuffed', 'Folded-up cuff'),
    c('doubleCuff', 'Double Cuff', 'Deep doubled cuff', { cuff: 62 }),
    c('uncuffed', 'Uncuffed', 'Plain hem, no fold', { cuff: 0 }),
    c('slouchy', 'Slouchy', 'Extra length that drapes back', { slouch: 1, crownH: 160 }),
    c('fisherman', 'Fisherman', 'Short, shallow crown above the ears', { crownH: 86, cuff: 40 }),
    c('tall', 'Tall', 'Extra height with a peak', { crownH: 170 }),
    c('pom', 'Pom-Pom', 'Topped with a pom-pom', { pom: true }),
    c('fitted', 'Fitted / Skull', 'Close-fitting, no cuff', { cuff: 0, crownH: 112, crownW: 126 }),
  ],
  brimHat: [
    c('medium', 'Medium Brim', 'Balanced 2–3" brim'),
    c('short', 'Short / Stingy Brim', 'Narrow brim', { brimW: 26 }),
    c('wide', 'Wide Brim', 'Broad, shady brim', { brimW: 80 }),
    c('extraWide', 'Extra-Wide Brim', 'Dramatic oversized brim', { brimW: 110 }),
    c('pinched', 'Pinched Crown', 'Front pinch with centre dent', { pinch: 'center' }),
    c('teardrop', 'Teardrop Crown', 'Teardrop-shaped indent', { pinch: 'teardrop' }),
    c('telescope', 'Telescope Crown', 'Flat top with circular indent', { pinch: 'telescope' }),
    c('rounded', 'Rounded Crown', 'Domed, open crown', { pinch: 'none' }),
    c('snapBrim', 'Snap Brim', 'Front of brim snapped down', { snap: 1 }),
    c('upturned', 'Upturned Brim', 'Brim curls up at sides', { upturn: 1 }),
    c('flatBrim', 'Flat Brim', 'Stiff, perfectly flat brim', { upturn: 0, snap: 0, flatBrim: true }),
  ],
  softHat: [
    c('classic', 'Classic', 'Standard shape'),
    c('deep', 'Deep Crown', 'Taller crown', { crownH: 130 }),
    c('shallow', 'Shallow Crown', 'Lower crown', { crownH: 78 }),
    c('wide', 'Wide Brim', 'Broader brim', { brimW: 60 }),
    c('short', 'Short Brim', 'Compact brim', { brimW: 20 }),
    c('reversible', 'Reversible', 'Two-sided construction'),
    c('chinStrap', 'With Chin Strap', 'Adjustable cord strap', { straps: true }),
  ],
  // Shoes
  sneaker: [
    c('classic', 'Classic', 'Everyday cupsole profile'),
    c('chunky', 'Chunky Sole', 'Thick, sculpted midsole', { sole: 44 }),
    c('slim', 'Slim Profile', 'Low-volume upper and thin sole', { sole: 16, slim: true }),
    c('platform', 'Platform', 'Stacked tall sole', { sole: 58 }),
    c('lowProfile', 'Low Profile', 'Sleek, close to the ground', { sole: 14, collar: -10 }),
    c('sockFit', 'Sock-Fit', 'Knit collar hugging the ankle', { sockCollar: true }),
    c('retro', 'Retro Runner', 'Wedged midsole and overlays', { sole: 30, retro: true }),
    c('minimal', 'Minimal', 'Clean upper, no overlays', { minimal: true }),
    c('vulcanized', 'Vulcanized', 'Flexible sole with foxing stripe', { sole: 22, foxing: true }),
    c('gum', 'Gum Sole', 'Classic tan gum rubber sole', { gum: true }),
  ],
  boot: [
    c('ankle', 'Ankle Height', 'Shaft ends at the ankle'),
    c('midCalf', 'Mid-Calf', 'Shaft rises to mid-calf', { collar: 210 }),
    c('kneeHigh', 'Knee-High', 'Tall shaft to the knee', { collar: 330 }),
    c('lug', 'Lug Sole', 'Deep-tread chunky sole', { lug: true, sole: 34 }),
    c('platform', 'Platform', 'Tall platform sole', { sole: 56, lug: true }),
    c('stackedHeel', 'Stacked Heel', 'Raised block heel', { heel: 46 }),
    c('squareToe', 'Square Toe', 'Squared-off toe box', { toe: 'square' }),
    c('pointedToe', 'Pointed Toe', 'Sleek pointed toe', { toe: 'pointed' }),
    c('roundToe', 'Round Toe', 'Soft round toe', { toe: 'round' }),
    c('sideZip', 'Side Zip', 'Zip closure on the inside', { zip: true }),
    c('slouch', 'Slouch', 'Relaxed, slouched shaft', { slouchy: true, collar: 200 }),
  ],
  formal: [
    c('roundToe', 'Round Toe', 'Classic rounded last'),
    c('almond', 'Almond Toe', 'Gently tapered last', { toe: 'almond' }),
    c('square', 'Square Toe', 'Squared toe box', { toe: 'square' }),
    c('pointed', 'Pointed Toe', 'Sharp, elongated toe', { toe: 'pointed' }),
    c('chisel', 'Chisel Toe', 'Flattened, angular toe', { toe: 'chisel' }),
    c('capToe', 'Cap Toe', 'Stitched toe cap', { toecap: true }),
    c('wingtip', 'Wingtip', 'W-shaped brogued toe', { wing: true }),
    c('lug', 'Lug Sole', 'Chunky commando sole', { lug: true, sole: 28 }),
    c('slim', 'Slim Sole', 'Close-cut thin sole', { sole: 10 }),
    c('platform', 'Platform', 'Raised platform sole', { sole: 40 }),
  ],
  sandal: [
    c('flat', 'Flat', 'Thin flat sole'),
    c('footbed', 'Contoured Footbed', 'Anatomical cushioned footbed', { sole: 26, footbed: true }),
    c('platform', 'Platform', 'Raised platform sole', { sole: 50 }),
    c('chunky', 'Chunky Sole', 'Thick, rugged sole', { sole: 36, lug: true }),
    c('wedge', 'Wedge', 'Wedge heel under the arch', { heel: 60, wedge: true }),
    c('strappy', 'Strappy', 'Multiple thin straps', { straps: 3 }),
    c('ankleStrap', 'Ankle Strap', 'Strap around the ankle', { strap: 'ankle' }),
    c('slingback', 'Slingback', 'Strap behind the heel', { strap: 'slingback' }),
  ],
  heel: [
    c('mid', 'Mid Heel (3")', 'Comfortable everyday height'),
    c('kitten', 'Kitten (2")', 'Low, slim heel', { heel: 50 }),
    c('high', 'High (4")', 'Classic tall heel', { heel: 112 }),
    c('sky', 'Sky-High (5")', 'Dramatic height', { heel: 138, platform: 18 }),
    c('pointed', 'Pointed Toe', 'Sleek pointed toe', { toe: 'pointed' }),
    c('almond', 'Almond Toe', 'Softly tapered toe', { toe: 'almond' }),
    c('square', 'Square Toe', 'Modern squared toe', { toe: 'square' }),
    c('peep', 'Peep Toe', 'Small toe opening', { peep: true }),
    c('platform', 'Platform', 'Platform under the forefoot', { platform: 22 }),
    c('ankleStrap', 'Ankle Strap', 'Strap around the ankle', { strap: 'ankle' }),
    c('slingback', 'Slingback', 'Open back with heel strap', { strap: 'slingback' }),
  ],
  flat: [
    c('round', 'Round Toe', 'Soft round toe'),
    c('pointed', 'Pointed Toe', 'Elongated pointed toe', { toe: 'pointed' }),
    c('square', 'Square Toe', 'Squared-off toe', { toe: 'square' }),
    c('almond', 'Almond Toe', 'Tapered almond shape', { toe: 'almond' }),
    c('platform', 'Platform', 'Lifted chunky sole', { sole: 36 }),
    c('slingback', 'Slingback', 'Open back with strap', { strap: 'slingback' }),
    c('strap', 'Instep Strap', 'Strap across the instep', { strap: 'maryjane' }),
  ],
};

// Helpers for base parameter sets
const TOP = (p) => ({ ...p });

// ─────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────
export const CATALOG = [
  {
    id: 'tops', label: 'Tops', d: 'Tees, sweaters, shirts and outerwear',
    preview: { tpl: 'top', p: { sleeve: 'short', neck: 'crew', hem: 'straight', cuffs: false, pocket: 'none', drawcord: false, vNotch: false } },
    genres: [
      {
        id: 'sweaters', label: 'Sweaters & Sweatshirts', d: 'Hoodies, crewnecks and knitwear',
        types: [
          t('hoodie', 'Hoodie', 'Pullover with hood and kangaroo pocket', 'top', TOP({ neck: 'hood', pocket: 'kangaroo', drawcord: true }), 'sweat', 'sweat'),
          t('zipHoodie', 'Zip-Up Hoodie', 'Full-zip with hood', 'top', TOP({ neck: 'hood', open: 'zip', pocket: 'split', drawcord: true }), 'sweat', 'sweat'),
          t('crewneck', 'Crewneck Sweatshirt', 'Classic round-neck sweatshirt', 'top', TOP({ neck: 'crew', vNotch: true }), 'sweat', 'sweat'),
          t('quarterZip', 'Quarter-Zip', 'Pullover with short zip collar', 'top', TOP({ neck: 'mock', open: 'quarterzip' }), 'sweat', 'sweat'),
          t('halfZip', 'Half-Zip Fleece', 'Stand collar with half-length zip', 'top', TOP({ neck: 'mock', open: 'halfzip', pocket: 'chest' }), 'sweat', 'sweat'),
          t('pullover', 'Pullover Sweater', 'Classic knit pullover', 'top', TOP({ neck: 'crew' }), 'knit', 'knit'),
          t('cardigan', 'Cardigan', 'Button-front open knit', 'top', TOP({ neck: 'v', open: 'buttons', pocket: 'patch2' }), 'knit', 'knit'),
          t('turtleneck', 'Turtleneck', 'Tall folded neck', 'top', TOP({ neck: 'turtle' }), 'knit', 'knit'),
          t('mockNeck', 'Mock Neck Sweater', 'Short stand-up neck', 'top', TOP({ neck: 'mock' }), 'knit', 'knit'),
          t('vNeckSweater', 'V-Neck Sweater', 'V-shaped neckline', 'top', TOP({ neck: 'v' }), 'knit', 'knit'),
          t('sweaterVest', 'Sweater Vest', 'Sleeveless knit layer', 'top', TOP({ neck: 'v', sleeve: 'none', armRib: true }), 'vest', 'knit'),
          t('polo', 'Knit Polo', 'Knit polo with collar', 'top', TOP({ neck: 'polo', hem: 'rib' }), 'knit', 'knit'),
          t('shawlCardigan', 'Shawl Cardigan', 'Rolled shawl collar cardigan', 'top', TOP({ neck: 'shawl', open: 'buttons', pocket: 'patch2' }), 'knit', 'knit'),
        ],
      },
      {
        id: 'tees', label: 'T-Shirts & Tees', d: 'Short & long sleeve essentials',
        types: [
          t('tshirt', 'T-Shirt', 'Short sleeve crew neck tee', 'top', TOP({ sleeve: 'short', hem: 'straight', cuffs: false }), 'tee', 'jersey'),
          t('longSleeve', 'Long Sleeve Tee', 'Crew neck with long sleeves', 'top', TOP({ hem: 'straight' }), 'tee', 'jersey'),
          t('pocketTee', 'Pocket Tee', 'Tee with chest pocket', 'top', TOP({ sleeve: 'short', hem: 'straight', cuffs: false, pocket: 'chest' }), 'tee', 'jersey'),
          t('vNeckTee', 'V-Neck Tee', 'Short sleeve V-neck', 'top', TOP({ sleeve: 'short', hem: 'straight', cuffs: false, neck: 'v' }), 'tee', 'jersey'),
          t('ringer', 'Ringer Tee', 'Contrast neck and sleeve bands', 'top', TOP({ sleeve: 'short', hem: 'straight', ringer: true, cuffs: true }), 'tee', 'jersey'),
          t('henley', 'Henley', 'Collarless with button placket', 'top', TOP({ neck: 'henley', hem: 'straight' }), 'tee', 'jersey'),
          t('baseball', 'Baseball Raglan', '¾ contrast raglan sleeves', 'top', TOP({ raglan: true, sleeve: 'threeq', varsity: true, hem: 'curved', cuffs: false }), 'tee', 'jersey'),
          t('graphic', 'Graphic Tee', 'Blank canvas made for prints', 'top', TOP({ sleeve: 'short', hem: 'straight', cuffs: false, w: 104 }), 'tee', 'jersey'),
          t('babyTee', 'Baby Tee', 'Small, fitted and cropped', 'top', TOP({ sleeve: 'cap', hem: 'straight', w: 80, len: 300, flare: 0.94 }), 'tee', 'jersey'),
          t('mockTee', 'Mock Neck Tee', 'Short sleeve with mock neck', 'top', TOP({ sleeve: 'short', neck: 'mock', hem: 'straight', cuffs: false }), 'tee', 'jersey'),
          t('scoopTee', 'Scoop Neck Tee', 'Wide scooped neckline', 'top', TOP({ sleeve: 'short', neck: 'scoop', hem: 'straight', cuffs: false }), 'tee', 'jersey'),
          t('thermal', 'Thermal Long Sleeve', 'Waffle-knit base layer', 'top', TOP({ hem: 'straight', neck: 'henley' }), 'tee', 'jersey'),
        ],
      },
      {
        id: 'shirts', label: 'Shirts & Blouses', d: 'Button-ups, polos and blouses',
        types: [
          t('buttonUp', 'Button-Up Shirt', 'Collared button-front shirt', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'curved', cuffs: true, cuffStyle: 'shirt', pocket: 'chest' }), 'shirt', 'shirt'),
          t('oxford', 'Oxford Shirt', 'Button-down collar classic', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'curved', cuffStyle: 'shirt', pocket: 'chest', bdCollar: true }), 'shirt', 'shirt'),
          t('dress', 'Dress Shirt', 'Crisp formal shirt', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'curved', cuffStyle: 'shirt' }), 'shirt', 'shirt'),
          t('flannel', 'Flannel Shirt', 'Two flap chest pockets', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'curved', cuffStyle: 'shirt', pocket: 'flapChest' }), 'shirt', 'shirt'),
          t('camp', 'Camp Collar Shirt', 'Open notch collar, short sleeve', 'top', TOP({ neck: 'camp', open: 'buttons', hem: 'straight', sleeve: 'short', w: 104 }), 'shirt', 'shirt'),
          t('overshirt', 'Overshirt', 'Heavy shirt-jacket hybrid', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'straight', cuffStyle: 'shirt', pocket: 'flapChest', w: 106 }), 'shirt', 'shirt'),
          t('poloShirt', 'Polo Shirt', 'Ribbed collar, button placket', 'top', TOP({ neck: 'polo', sleeve: 'short', hem: 'straight', cuffs: true }), 'shirt', 'polo'),
          t('rugby', 'Rugby Shirt', 'Long sleeve heavy polo', 'top', TOP({ neck: 'polo', hem: 'straight', cuffs: true, rugby: true }), 'shirt', 'polo'),
          t('western', 'Western Shirt', 'Pointed yoke and snap front', 'top', TOP({ neck: 'collar', open: 'snap', hem: 'curved', cuffStyle: 'shirt', yoke: true, pocket: 'flapChest' }), 'shirt', 'shirt'),
          t('work', 'Work Shirt', 'Utility pockets and pen slot', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'straight', cuffStyle: 'shirt', pocket: 'flapChest', epaulets: true }), 'shirt', 'shirt'),
          t('blouse', 'Blouse', 'Soft, feminine button-front', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'curved', sleeveW: 1.25, flare: 0.94 }), 'shirt', 'shirt'),
          t('peasant', 'Peasant Blouse', 'Gathered neck, flowing sleeves', 'top', TOP({ neck: 'boat', sleeveW: 1.4, hem: 'straight', gathered: true }), 'shirt', 'shirt'),
          t('tunic', 'Tunic', 'Long, loose pullover shirt', 'top', TOP({ neck: 'henley', hem: 'curved', len: 480, w: 104 }), 'shirt', 'shirt'),
        ],
      },
      {
        id: 'outerwear', label: 'Jackets & Coats', d: 'Bombers, denim, puffers and coats',
        types: [
          t('bomber', 'Bomber Jacket', 'Rib collar, cuffs and hem', 'top', TOP({ neck: 'mock', open: 'zip', hem: 'rib', ribAccent: true, pocket: 'welt', sleeveW: 1.12, sleeveTab: true }), 'jacket', 'outer'),
          t('denimJacket', 'Denim Jacket', 'Trucker style with chest flaps', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'band', cuffStyle: 'shirt', pocket: 'flapChest', yoke: true, len: 370, contrast: true }), 'jacket', 'outer'),
          t('varsity', 'Varsity Jacket', 'Contrast sleeves, snap front', 'top', TOP({ neck: 'mock', open: 'snap', hem: 'rib', ribAccent: true, varsity: true, pocket: 'welt', stripedRib: true }), 'jacket', 'outer'),
          t('coach', 'Coach Jacket', 'Snap front, turn-down collar', 'top', TOP({ neck: 'collar', open: 'snap', hem: 'drawcord', pocket: 'welt', w: 106 }), 'jacket', 'outer'),
          t('windbreaker', 'Windbreaker', 'Light half-zip shell', 'top', TOP({ neck: 'mock', open: 'halfzip', hem: 'drawcord', pocket: 'kangaroo', panels: true }), 'jacket', 'outer'),
          t('puffer', 'Puffer Jacket', 'Quilted insulated channels', 'top', TOP({ neck: 'mock', open: 'zip', hem: 'band', quilt: 46, w: 112, sleeveW: 1.2 }), 'jacket', 'outer'),
          t('parka', 'Parka', 'Hooded, long and insulated', 'top', TOP({ neck: 'hood', open: 'zip', len: 520, pocket: 'flap2', placket: true, furHood: true }), 'coat', 'outer'),
          t('leather', 'Leather Jacket', 'Biker style, asymmetric zip', 'top', TOP({ neck: 'lapel', open: 'asymzip', hem: 'band', len: 360, pocket: 'zip2', belt: true, biker: true }), 'jacket', 'outer'),
          t('harrington', 'Harrington Jacket', 'Short jacket with umbrella yoke', 'top', TOP({ neck: 'mock', open: 'zip', hem: 'rib', pocket: 'flap2', len: 370 }), 'jacket', 'outer'),
          t('shacket', 'Shacket', 'Oversized shirt jacket', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'straight', cuffStyle: 'shirt', pocket: 'flapChest', w: 112, drop: 0.6 }), 'jacket', 'outer'),
          t('chore', 'Chore Coat', 'Three patch pockets, workwear', 'top', TOP({ neck: 'collar', open: 'buttons', hem: 'straight', cuffStyle: 'shirt', pocket: 'patch3', len: 430 }), 'jacket', 'outer'),
          t('anorak', 'Anorak', 'Pullover hooded shell', 'top', TOP({ neck: 'hood', open: 'halfzip', pocket: 'kangaroo', hem: 'drawcord' }), 'jacket', 'outer'),
          t('fleece', 'Fleece Jacket', 'Full-zip pile fleece', 'top', TOP({ neck: 'mock', open: 'zip', pocket: 'zipLow', hem: 'band' }), 'jacket', 'outer'),
          t('rain', 'Rain Jacket', 'Hooded waterproof shell', 'top', TOP({ neck: 'hood', open: 'zip', hem: 'drawcord', pocket: 'flap2', placket: true, len: 440 }), 'jacket', 'outer'),
          t('gilet', 'Gilet / Vest', 'Sleeveless insulated layer', 'top', TOP({ neck: 'mock', open: 'zip', sleeve: 'none', hem: 'band', quilt: 46, pocket: 'zipLow' }), 'vest', 'outer'),
          t('blazer', 'Blazer', 'Tailored notch-lapel jacket', 'top', TOP({ neck: 'lapel', open: 'buttons2', hem: 'straight', pocket: 'flap2', breast: true, len: 440, cuffs: false }), 'jacket', 'tailored'),
          t('trench', 'Trench Coat', 'Double-breasted, belted classic', 'top', TOP({ neck: 'lapel', open: 'double', belt: true, len: 600, pocket: 'welt', epaulets: true, cuffs: false, flare: 1.08 }), 'coat', 'outer'),
          t('overcoat', 'Overcoat', 'Long tailored wool coat', 'top', TOP({ neck: 'lapel', open: 'buttons2', len: 600, pocket: 'flap2', cuffs: false, flare: 1.06 }), 'coat', 'tailored'),
          t('peacoat', 'Peacoat', 'Short double-breasted wool coat', 'top', TOP({ neck: 'lapel', open: 'double', len: 450, pocket: 'welt', cuffs: false, wideLapel: true }), 'coat', 'tailored'),
        ],
      },
      {
        id: 'tanks', label: 'Tanks & Camis', d: 'Sleeveless and strappy tops',
        types: [
          t('tank', 'Tank Top', 'Sleeveless with scoop neck', 'top', TOP({ sleeve: 'none', neck: 'scoop', straps: 'wide', hem: 'straight', cuffs: false }), 'tank', 'tank'),
          t('muscleTank', 'Muscle Tank', 'Deep armholes, wide body', 'top', TOP({ sleeve: 'none', neck: 'crew', straps: 'wide', strapW: 46, armDeep: 46, hem: 'straight', cuffs: false }), 'tank', 'tank'),
          t('cami', 'Camisole', 'Thin straps, straight neckline', 'top', TOP({ sleeve: 'none', straps: 'thin', neck: 'v', hem: 'straight', cuffs: false, flare: 1.04 }), 'tank', 'tank'),
          t('tube', 'Tube Top', 'Strapless band top', 'top', TOP({ sleeve: 'none', straps: 'none', neck: 'strapless', hem: 'straight', len: 300, cuffs: false, w: 84 }), 'tank', 'tank'),
          t('halter', 'Halter Top', 'Ties behind the neck', 'top', TOP({ sleeve: 'none', straps: 'halter', neck: 'halter', hem: 'straight', len: 320, cuffs: false, w: 86 }), 'tank', 'tank'),
          t('cropTop', 'Crop Top', 'Short fitted top', 'top', TOP({ sleeve: 'short', neck: 'scoop', hem: 'straight', len: 290, cuffs: false, w: 84 }), 'tee', 'tank'),
          t('corset', 'Corset Top', 'Structured boned bodice', 'top', TOP({ sleeve: 'none', straps: 'thin', neck: 'sweetheart', hem: 'point', len: 330, w: 82, flare: 0.86, boning: true, cuffs: false }), 'tank', 'tank'),
          t('bodysuit', 'Bodysuit', 'Fitted one-piece base', 'top', TOP({ sleeve: 'long', neck: 'scoop', hem: 'brief', w: 82, flare: 0.92, len: 470 }), 'active', 'tank'),
          t('ribTank', 'Ribbed Tank', 'Fitted rib-knit tank', 'top', TOP({ sleeve: 'none', neck: 'scoop', straps: 'wide', hem: 'straight', w: 84, flare: 0.94, cuffs: false }), 'tank', 'tank'),
        ],
      },
      {
        id: 'activeTops', label: 'Activewear', d: 'Training, running and sport',
        types: [
          t('perfTee', 'Performance Tee', 'Lightweight training tee', 'top', TOP({ sleeve: 'short', hem: 'straight', raglan: true, cuffs: false, panels: true }), 'active', 'active'),
          t('trainingTank', 'Training Tank', 'Breathable workout tank', 'top', TOP({ sleeve: 'none', straps: 'wide', neck: 'scoop', hem: 'straight', armDeep: 36, cuffs: false }), 'active', 'active'),
          t('compression', 'Compression Top', 'Long sleeve base layer', 'top', TOP({ neck: 'mock', w: 80, sleeveW: 0.82, hem: 'straight', panels: true }), 'active', 'active'),
          t('sportsBra', 'Sports Bra', 'Supportive training bra', 'top', TOP({ sleeve: 'none', straps: 'wide', neck: 'scoop', hem: 'rib', len: 250, w: 84, strapW: 20, armDeep: -22, cuffs: false }), 'bra', 'active'),
          t('runJacket', 'Running Jacket', 'Light zip running shell', 'top', TOP({ neck: 'mock', open: 'zip', hem: 'straight', w: 90, panels: true, pocket: 'zipLow' }), 'active', 'active'),
          t('rashGuard', 'Rash Guard', 'Fitted UV swim top', 'top', TOP({ neck: 'mock', w: 82, sleeveW: 0.84, hem: 'straight', panels: true }), 'active', 'active'),
          t('jersey', 'Sports Jersey', 'Team jersey with V-neck', 'top', TOP({ sleeve: 'short', neck: 'v', hem: 'straight', w: 108, raglan: true, varsity: true, cuffs: false }), 'active', 'active'),
          t('trackJacket', 'Track Jacket', 'Zip jacket with side stripes', 'top', TOP({ neck: 'mock', open: 'zip', hem: 'rib', stripes: true, pocket: 'zipLow' }), 'active', 'active'),
          t('halfZipRun', 'Half-Zip Pullover', 'Thermal half-zip midlayer', 'top', TOP({ neck: 'mock', open: 'quarterzip', hem: 'straight', w: 90, thumbholes: true }), 'active', 'active'),
        ],
      },
    ],
  },
  {
    id: 'bottoms', label: 'Bottoms', d: 'Pants, jeans, shorts and skirts',
    preview: { tpl: 'bottom', p: {} },
    genres: [
      {
        id: 'trousers', label: 'Pants & Trousers', d: 'Chinos, cargos and tailored',
        types: [
          t('chinos', 'Chinos', 'Slant pockets, clean front', 'bottom', { pockets: 'slant' }, 'pants', 'trouser'),
          t('trousers', 'Dress Trousers', 'Tailored with pressed crease', 'bottom', { pockets: 'slant', crease: true, back: 'welt' }, 'pants', 'trouser'),
          t('cargo', 'Cargo Pants', 'Bellowed thigh pockets', 'bottom', { pockets: 'slant', cargo: true, thigh: 58, knee: 50, hem: 44 }, 'pants', 'trouser'),
          t('pleated', 'Pleated Trousers', 'Double pleats, full leg', 'bottom', { pockets: 'slant', pleats: 2, thigh: 60, crease: true, back: 'welt' }, 'pants', 'trouser'),
          t('carpenter', 'Carpenter Pants', 'Hammer loop and tool pocket', 'bottom', { pockets: 'jean', carpenter: true, thigh: 60, knee: 54, hem: 50 }, 'pants', 'trouser'),
          t('workPants', 'Work Pants', 'Double-knee utility pant', 'bottom', { pockets: 'slant', kneePanel: true, thigh: 58, knee: 52, hem: 48 }, 'pants', 'trouser'),
          t('wideTrousers', 'Wide-Leg Trousers', 'Flowing wide leg', 'bottom', { pockets: 'slant', thigh: 66, knee: 66, hem: 74, spread: 10, crease: true }, 'pants', 'trouser'),
          t('palazzo', 'Palazzo Pants', 'Very wide, fluid leg', 'bottom', { pockets: 'none', fly: false, waistband: 'elastic', thigh: 72, knee: 80, hem: 92, spread: 16, loops: false }, 'pants', 'trouser'),
          t('parachute', 'Parachute Pants', 'Toggle hems, nylon volume', 'bottom', { pockets: 'slant', cargo: true, waistband: 'drawcord', toggleHem: true, thigh: 64, knee: 60, hem: 48, loops: false }, 'pants', 'trouser'),
          t('cords', 'Corduroy Pants', 'Five-pocket wale pant', 'bottom', { pockets: 'jean', thigh: 54 }, 'pants', 'trouser'),
          t('linenPants', 'Drawstring Linen Pants', 'Relaxed elastic waist', 'bottom', { pockets: 'slant', waistband: 'drawcord', fly: false, loops: false, thigh: 60 }, 'pants', 'trouser'),
          t('overalls', 'Overalls', 'Bib front with straps', 'bottom', { pockets: 'jean', overalls: true, thigh: 58, knee: 52, hem: 48, loops: false, contrastStitch: true }, 'pants', 'denim'),
        ],
      },
      {
        id: 'denim', label: 'Jeans & Denim', d: 'Five-pocket jeans in every fit',
        types: [
          t('fivePocket', '5-Pocket Jeans', 'The classic jean', 'bottom', { pockets: 'jean', yoke: true, contrastStitch: true }, 'jeans', 'denim'),
          t('selvedge', 'Selvedge Jeans', 'Cuffed hem shows selvedge line', 'bottom', { pockets: 'jean', yoke: true, contrastStitch: true, rollHem: true }, 'jeans', 'denim'),
          t('carpenterJeans', 'Carpenter Jeans', 'Hammer loop & utility pocket', 'bottom', { pockets: 'jean', yoke: true, contrastStitch: true, carpenter: true, thigh: 60, knee: 54, hem: 50 }, 'jeans', 'denim'),
          t('painter', 'Painter Jeans', 'Double-knee panels', 'bottom', { pockets: 'jean', yoke: true, contrastStitch: true, kneePanel: true, thigh: 60, knee: 54, hem: 50 }, 'jeans', 'denim'),
          t('cargoJeans', 'Cargo Jeans', 'Denim with cargo pockets', 'bottom', { pockets: 'jean', yoke: true, contrastStitch: true, cargo: true, thigh: 60, knee: 54, hem: 48 }, 'jeans', 'denim'),
          t('ripped', 'Distressed Jeans', 'Ripped knees and fraying', 'bottom', { pockets: 'jean', yoke: true, contrastStitch: true, rips: true }, 'jeans', 'denim'),
          t('elasticJeans', 'Pull-On Jeans', 'Elastic waist denim', 'bottom', { pockets: 'jean', waistband: 'elastic', fly: false, yoke: true, contrastStitch: true, loops: false }, 'jeans', 'denim'),
        ],
      },
      {
        id: 'shorts', label: 'Shorts', d: 'From chino to athletic',
        types: [
          t('chinoShorts', 'Chino Shorts', 'Tailored cotton short', 'bottom', { kind: 'shorts', pockets: 'slant', len: 370, thigh: 58, hem: 56 }, 'shorts', 'shorts'),
          t('cargoShorts', 'Cargo Shorts', 'Utility thigh pockets', 'bottom', { kind: 'shorts', pockets: 'slant', cargo: true, len: 400, thigh: 62, hem: 62 }, 'shorts', 'shorts'),
          t('jorts', 'Denim Shorts', 'Five-pocket denim short', 'bottom', { kind: 'shorts', pockets: 'jean', yoke: true, contrastStitch: true, len: 370, thigh: 60, hem: 60 }, 'shorts', 'denim'),
          t('athletic', 'Athletic Shorts', 'Lightweight elastic-waist short', 'bottom', { kind: 'shorts', pockets: 'none', fly: false, loops: false, waistband: 'elastic', len: 340, thigh: 62, hem: 64, split: true }, 'shorts', 'activeBottom'),
          t('board', 'Board Shorts', 'Quick-dry swim shorts', 'bottom', { kind: 'shorts', pockets: 'none', fly: false, loops: false, waistband: 'board', len: 400, thigh: 62, hem: 62 }, 'shorts', 'shorts'),
          t('sweatShorts', 'Sweat Shorts', 'Fleece drawcord short', 'bottom', { kind: 'shorts', pockets: 'slant', fly: false, loops: false, waistband: 'drawcord', len: 360, thigh: 62, hem: 60 }, 'shorts', 'sweatBottom'),
          t('running', 'Running Shorts', 'Split hem, built-in liner', 'bottom', { kind: 'shorts', pockets: 'none', fly: false, loops: false, waistband: 'elastic', len: 300, thigh: 60, hem: 64, split: true }, 'shorts', 'activeBottom'),
          t('bike', 'Bike Shorts', 'Fitted compression short', 'bottom', { kind: 'shorts', pockets: 'none', fly: false, loops: false, waistband: 'high', len: 360, thigh: 46, hem: 40 }, 'shorts', 'activeBottom'),
          t('pleatedShorts', 'Pleated Shorts', 'Tailored with front pleats', 'bottom', { kind: 'shorts', pockets: 'slant', pleats: 2, len: 400, thigh: 62, hem: 62, back: 'welt' }, 'shorts', 'shorts'),
          t('skort', 'Skort', 'Skirt front, shorts inside', 'bottom', { kind: 'skirt', len: 300, flare: 1.35, pleated: 6, waistband: 'band' }, 'shorts', 'skirt'),
        ],
      },
      {
        id: 'sweatpants', label: 'Joggers & Sweatpants', d: 'Comfort-first bottoms',
        types: [
          t('joggers', 'Joggers', 'Tapered with rib cuffs', 'bottom', { pockets: 'slant', fly: false, loops: false, waistband: 'drawcord', cuffs: true, thigh: 56, knee: 44, hem: 28 }, 'joggers', 'sweatBottom'),
          t('sweatpants', 'Sweatpants', 'Classic fleece sweatpant', 'bottom', { pockets: 'slant', fly: false, loops: false, waistband: 'drawcord', cuffs: true, thigh: 58, knee: 48, hem: 32 }, 'joggers', 'sweatBottom'),
          t('trackPants', 'Track Pants', 'Side stripes and zip ankles', 'bottom', { pockets: 'slant', fly: false, loops: false, waistband: 'elastic', stripe: true, thigh: 54, knee: 44, hem: 34 }, 'joggers', 'sweatBottom'),
          t('lounge', 'Lounge Pants', 'Soft, relaxed sleep pant', 'bottom', { pockets: 'none', fly: false, loops: false, waistband: 'elastic', cuffs: false, thigh: 60, knee: 54, hem: 50 }, 'joggers', 'sweatBottom'),
          t('cargoJogger', 'Cargo Joggers', 'Joggers with cargo pockets', 'bottom', { pockets: 'slant', cargo: true, fly: false, loops: false, waistband: 'drawcord', cuffs: true, thigh: 58, knee: 46, hem: 28 }, 'joggers', 'sweatBottom'),
          t('techPant', 'Tech Pants', 'Bonded seams, zip pockets', 'bottom', { pockets: 'zip', fly: false, loops: false, waistband: 'drawcord', cuffs: true, thigh: 50, knee: 38, hem: 26, panels: true }, 'joggers', 'sweatBottom'),
        ],
      },
      {
        id: 'skirts', label: 'Skirts', d: 'Mini, midi and maxi',
        types: [
          t('mini', 'Mini Skirt', 'Ends mid-thigh', 'bottom', { kind: 'skirt', len: 300, flare: 1.2 }, 'skirt', 'skirt'),
          t('knee', 'Knee-Length Skirt', 'Hits at the knee', 'bottom', { kind: 'skirt', len: 420, flare: 1.25 }, 'skirt', 'skirt'),
          t('midi', 'Midi Skirt', 'Falls mid-calf', 'bottom', { kind: 'skirt', len: 520, flare: 1.3 }, 'skirt', 'skirt'),
          t('maxi', 'Maxi Skirt', 'Ankle length', 'bottom', { kind: 'skirt', len: 620, flare: 1.35 }, 'skirt', 'skirt'),
          t('micro', 'Micro Mini', 'Very short hem', 'bottom', { kind: 'skirt', len: 250, flare: 1.15 }, 'skirt', 'skirt'),
          t('tennis', 'Tennis Skirt', 'Pleated sporty mini', 'bottom', { kind: 'skirt', len: 290, flare: 1.5, pleated: 12 }, 'skirt', 'skirt'),
          t('denimSkirt', 'Denim Skirt', 'Five-pocket denim', 'bottom', { kind: 'skirt', len: 360, flare: 1.1, pockets: 'jean', contrastStitch: true, fly: true, yoke: true, loops: true }, 'skirt', 'denim'),
          t('cargoSkirt', 'Cargo Skirt', 'Utility pockets, midi length', 'bottom', { kind: 'skirt', len: 500, flare: 1.1, cargo: true, pockets: 'slant', loops: true }, 'skirt', 'skirt'),
          t('slip', 'Slip Skirt', 'Bias-cut satin midi', 'bottom', { kind: 'skirt', len: 520, flare: 1.2, waistband: 'elastic' }, 'skirt', 'skirt'),
          t('kilt', 'Kilt', 'Wrap with buckle straps', 'bottom', { kind: 'skirt', len: 400, flare: 1.3, pleated: 8, wrap: true }, 'skirt', 'skirt'),
        ],
      },
      {
        id: 'activeBottoms', label: 'Activewear', d: 'Leggings and training',
        types: [
          t('leggings', 'Leggings', 'Full-length stretch tights', 'bottom', { kind: 'leggings', waistband: 'high', fly: false, pockets: 'none', loops: false, thigh: 44, knee: 32, hem: 24 }, 'leggings', 'activeBottom'),
          t('yoga', 'Yoga Pants', 'Soft flared practice pant', 'bottom', { kind: 'leggings', waistband: 'high', fly: false, pockets: 'none', loops: false, thigh: 46, knee: 34, hem: 50, spread: 4 }, 'leggings', 'activeBottom'),
          t('runTights', 'Running Tights', 'Reflective panels, zip pocket', 'bottom', { kind: 'leggings', waistband: 'band', fly: false, pockets: 'none', loops: false, thigh: 42, knee: 30, hem: 22, panels: true }, 'leggings', 'activeBottom'),
          t('compressionTights', 'Compression Tights', 'Graduated compression', 'bottom', { kind: 'leggings', waistband: 'band', fly: false, pockets: 'none', loops: false, thigh: 40, knee: 28, hem: 20, panels: true }, 'leggings', 'activeBottom'),
          t('trainingShorts', 'Training Shorts', 'Lined gym short', 'bottom', { kind: 'shorts', pockets: 'none', fly: false, loops: false, waistband: 'elastic', len: 330, thigh: 62, hem: 64 }, 'shorts', 'activeBottom'),
        ],
      },
    ],
  },
  {
    id: 'hats', label: 'Hats', d: 'Caps, beanies and brimmed hats',
    preview: { tpl: 'hat', p: { kind: 'cap' } },
    genres: [
      {
        id: 'caps', label: 'Caps', d: 'Billed and peaked styles',
        types: [
          t('baseball', 'Baseball Cap', 'Six-panel curved bill', 'hat', { kind: 'cap' }, 'cap', 'cap'),
          t('dad', 'Dad Cap', 'Unstructured, low-profile', 'hat', { kind: 'cap', structured: false, crownH: 96, back: 'strap' }, 'cap', 'cap'),
          t('snapback', 'Snapback', 'Flat brim, snap closure', 'hat', { kind: 'cap', brim: 'flat', crownH: 126, back: 'snap' }, 'cap', 'cap'),
          t('trucker', 'Trucker Hat', 'Foam front, mesh back', 'hat', { kind: 'cap', crownH: 134, back: 'snap', mesh: true }, 'cap', 'cap'),
          t('fitted', 'Fitted Cap', 'Closed back, sized fit', 'hat', { kind: 'cap', brim: 'flat', crownH: 128, back: 'fitted' }, 'cap', 'cap'),
          t('fivePanel', '5-Panel Camp Cap', 'Flat crown, short brim', 'hat', { kind: 'cap', panels: 5, crownH: 104, brimD: 30, back: 'strap', brim: 'flat' }, 'cap', 'cap'),
          t('military', 'Military / Cadet Cap', 'Flat top, short bill', 'hat', { kind: 'military' }, 'cap', 'cap'),
          t('flatCap', 'Flat Cap', 'Ivy-style sloped crown', 'hat', { kind: 'flatcap' }, 'softHat', 'brimHat'),
          t('newsboy', 'Newsboy Cap', 'Eight-panel with button', 'hat', { kind: 'newsboy' }, 'softHat', 'brimHat'),
          t('visor', 'Visor', 'Brim and band, open top', 'hat', { kind: 'visor' }, 'cap', 'cap'),
        ],
      },
      {
        id: 'knitHats', label: 'Beanies & Knit Hats', d: 'Cosy knitted headwear',
        types: [
          t('beanie', 'Beanie', 'Classic cuffed knit', 'hat', { kind: 'beanie', cuff: 46 }, 'beanie', 'knitHat'),
          t('watchCap', 'Watch Cap', 'Tall, rolled, seamen style', 'hat', { kind: 'beanie', cuff: 52, crownH: 140 }, 'beanie', 'knitHat'),
          t('pomBeanie', 'Pom-Pom Beanie', 'Topped with a pom', 'hat', { kind: 'beanie', cuff: 46, pom: true }, 'beanie', 'knitHat'),
          t('slouchBeanie', 'Slouch Beanie', 'Relaxed, draped crown', 'hat', { kind: 'beanie', cuff: 0, slouch: 1, crownH: 160 }, 'beanie', 'knitHat'),
          t('balaclava', 'Balaclava', 'Full head and neck cover', 'hat', { kind: 'balaclava' }, 'beanie', 'knitHat'),
          t('earflap', 'Earflap Hat', 'Flaps and braided ties', 'hat', { kind: 'beanie', cuff: 0, flaps: true, pom: true }, 'beanie', 'knitHat'),
          t('headband', 'Knit Headband', 'Ear-warming band', 'hat', { kind: 'headband' }, 'beanie', 'knitHat'),
        ],
      },
      {
        id: 'brimmed', label: 'Brimmed Hats', d: 'Fedoras, buckets and sun hats',
        types: [
          t('bucket', 'Bucket Hat', 'Downward sloping brim', 'hat', { kind: 'bucket' }, 'softHat', 'brimHat'),
          t('boonie', 'Boonie Hat', 'Wide brim, chin strap', 'hat', { kind: 'bucket', brimW: 50, straps: true, loops: true }, 'softHat', 'brimHat'),
          t('fedora', 'Fedora', 'Pinched crown, medium brim', 'hat', { kind: 'fedora', pinch: 'center' }, 'brimHat', 'brimHat'),
          t('trilby', 'Trilby', 'Short brim, angled back', 'hat', { kind: 'fedora', pinch: 'center', brimW: 26, snap: 1 }, 'brimHat', 'brimHat'),
          t('panama', 'Panama Hat', 'Light woven summer hat', 'hat', { kind: 'fedora', pinch: 'teardrop', brimW: 56 }, 'brimHat', 'brimHat'),
          t('porkpie', 'Porkpie', 'Flat telescope crown', 'hat', { kind: 'fedora', pinch: 'telescope', brimW: 30, crownH: 84 }, 'brimHat', 'brimHat'),
          t('cowboy', 'Cowboy Hat', 'Tall crown, upturned brim', 'hat', { kind: 'fedora', pinch: 'cattleman', brimW: 84, upturn: 1, crownH: 128 }, 'brimHat', 'brimHat'),
          t('boater', 'Boater', 'Flat top and brim, ribbon band', 'hat', { kind: 'boater' }, 'brimHat', 'brimHat'),
          t('sunHat', 'Wide Sun Hat', 'Floppy oversized brim', 'hat', { kind: 'fedora', pinch: 'none', brimW: 120, floppy: true, crownH: 96 }, 'brimHat', 'brimHat'),
          t('cloche', 'Cloche', 'Bell-shaped, close-fitting', 'hat', { kind: 'cloche' }, 'softHat', 'brimHat'),
        ],
      },
      {
        id: 'specialty', label: 'Specialty', d: 'Berets, bandanas and more',
        types: [
          t('beret', 'Beret', 'Soft round flat crown', 'hat', { kind: 'beret' }, 'softHat', 'knitHat'),
          t('bandana', 'Bandana', 'Folded square kerchief', 'hat', { kind: 'bandana' }, 'softHat', 'shirt'),
          t('trapper', 'Trapper Hat', 'Fur-lined with ear flaps', 'hat', { kind: 'trapper' }, 'softHat', 'brimHat'),
          t('sunVisor', 'Sport Visor', 'Curved shade, elastic back', 'hat', { kind: 'visor', brimD: 50 }, 'cap', 'cap'),
          t('durag', 'Durag', 'Silky tie-back head wrap', 'hat', { kind: 'durag' }, 'softHat', 'tank'),
        ],
      },
    ],
  },
  {
    id: 'shoes', label: 'Shoes', d: 'Sneakers, boots and dress shoes',
    preview: { tpl: 'shoe', p: { kind: 'sneaker' } },
    genres: [
      {
        id: 'sneakers', label: 'Sneakers', d: 'Everyday and sport',
        types: [
          t('lowTop', 'Low-Top Sneaker', 'Classic court silhouette', 'shoe', { kind: 'sneaker' }, 'sneaker', 'sneaker'),
          t('midTop', 'Mid-Top Sneaker', 'Collar at the ankle', 'shoe', { kind: 'sneaker', collar: 46 }, 'sneaker', 'sneaker'),
          t('highTop', 'High-Top Sneaker', 'Above-ankle support', 'shoe', { kind: 'sneaker', collar: 96 }, 'sneaker', 'sneaker'),
          t('runner', 'Running Shoe', 'Cushioned performance runner', 'shoe', { kind: 'sneaker', sole: 32, retro: true, runner: true }, 'sneaker', 'sneaker'),
          t('basketball', 'Basketball Shoe', 'High-top with ankle support', 'shoe', { kind: 'sneaker', collar: 86, sole: 34 }, 'sneaker', 'sneaker'),
          t('skate', 'Skate Shoe', 'Padded collar, grippy vulc sole', 'shoe', { kind: 'sneaker', foxing: true, padded: true }, 'sneaker', 'sneaker'),
          t('slipOn', 'Slip-On Sneaker', 'Laceless with elastic gores', 'shoe', { kind: 'sneaker', laces: false, elastic: true, foxing: true }, 'sneaker', 'sneaker'),
          t('court', 'Court Sneaker', 'Minimal tennis-inspired', 'shoe', { kind: 'sneaker', minimal: true }, 'sneaker', 'sneaker'),
          t('trail', 'Trail Runner', 'Lugged outsole, toe guard', 'shoe', { kind: 'sneaker', sole: 34, lug: true, toecap: true, runner: true }, 'sneaker', 'sneaker'),
          t('training', 'Cross-Trainer', 'Stable training shoe', 'shoe', { kind: 'sneaker', sole: 26, runner: true }, 'sneaker', 'sneaker'),
        ],
      },
      {
        id: 'boots', label: 'Boots', d: 'Chelsea, combat, work and more',
        types: [
          t('chelsea', 'Chelsea Boot', 'Elastic side gores', 'shoe', { kind: 'boot', collar: 120, laces: false, elastic: true, pullTab: true, heel: 22 }, 'boot', 'boot'),
          t('combat', 'Combat Boot', 'Tall lace-up with lug sole', 'shoe', { kind: 'boot', collar: 150, laces: true, lug: true, sole: 30 }, 'boot', 'boot'),
          t('workBoot', 'Work Boot', 'Moc toe, padded collar', 'shoe', { kind: 'boot', collar: 120, laces: true, hooks: true, apron: true, sole: 28, welt: true }, 'boot', 'boot'),
          t('hiking', 'Hiking Boot', 'Rugged and supportive', 'shoe', { kind: 'boot', collar: 100, laces: true, hooks: true, lug: true, sole: 32, toecap: true, padded: true }, 'boot', 'boot'),
          t('chukka', 'Chukka Boot', 'Two-eyelet ankle boot', 'shoe', { kind: 'boot', collar: 90, laces: true, lacesN: 3, sole: 14 }, 'boot', 'boot'),
          t('desert', 'Desert Boot', 'Crepe sole chukka', 'shoe', { kind: 'boot', collar: 90, laces: true, lacesN: 3, sole: 20, crepe: true }, 'boot', 'boot'),
          t('cowboyBoot', 'Western Boot', 'Scalloped shaft, stacked heel', 'shoe', { kind: 'boot', collar: 220, laces: false, scallop: true, heel: 44, toe: 'pointed', pullTab: true }, 'boot', 'boot'),
          t('moto', 'Moto Boot', 'Buckled straps, chunky sole', 'shoe', { kind: 'boot', collar: 180, laces: false, buckles: true, sole: 30, lug: true }, 'boot', 'boot'),
          t('rainBoot', 'Rain Boot', 'Moulded waterproof wellington', 'shoe', { kind: 'boot', collar: 260, laces: false, sole: 22, lug: true, rain: true }, 'boot', 'boot'),
          t('snowBoot', 'Snow Boot', 'Insulated, fur-trimmed', 'shoe', { kind: 'boot', collar: 160, laces: true, sole: 36, lug: true, furCuff: true }, 'boot', 'boot'),
          t('ankleBoot', 'Heeled Ankle Boot', 'Sleek heeled bootie', 'shoe', { kind: 'boot', collar: 110, laces: false, heel: 70, zip: true, toe: 'almond' }, 'boot', 'boot'),
        ],
      },
      {
        id: 'formalShoes', label: 'Dress Shoes', d: 'Oxfords, loafers and more',
        types: [
          t('oxfordShoe', 'Oxford', 'Closed lacing, sleek', 'shoe', { kind: 'oxford', laces: true }, 'formal', 'formal'),
          t('derby', 'Derby', 'Open lacing, versatile', 'shoe', { kind: 'oxford', laces: true, derby: true }, 'formal', 'formal'),
          t('brogue', 'Brogue', 'Perforated decorative detail', 'shoe', { kind: 'oxford', laces: true, wing: true, broguing: true }, 'formal', 'formal'),
          t('loafer', 'Loafer', 'Slip-on with apron toe', 'shoe', { kind: 'loafer', apron: true }, 'formal', 'formal'),
          t('pennyLoafer', 'Penny Loafer', 'Saddle strap with slot', 'shoe', { kind: 'loafer', apron: true, penny: true }, 'formal', 'formal'),
          t('horsebit', 'Bit Loafer', 'Metal bit across vamp', 'shoe', { kind: 'loafer', apron: true, bit: true }, 'formal', 'formal'),
          t('monk', 'Monk Strap', 'Buckled strap closure', 'shoe', { kind: 'oxford', laces: false, monk: true }, 'formal', 'formal'),
          t('boat', 'Boat Shoe', 'Leather laces around collar', 'shoe', { kind: 'loafer', apron: true, boat: true, sole: 16 }, 'formal', 'formal'),
          t('driver', 'Driving Moccasin', 'Soft, studded rubber sole', 'shoe', { kind: 'loafer', apron: true, sole: 8 }, 'formal', 'formal'),
        ],
      },
      {
        id: 'sandals', label: 'Sandals & Slides', d: 'Open, breezy footwear',
        types: [
          t('slide', 'Slide', 'Single wide strap', 'shoe', { kind: 'slide', sole: 26 }, 'sandal', 'sandal'),
          t('flipFlop', 'Flip-Flop', 'Thong between the toes', 'shoe', { kind: 'flipflop', sole: 16 }, 'sandal', 'sandal'),
          t('sportSandal', 'Sport Sandal', 'Adjustable webbing straps', 'shoe', { kind: 'sandal', sole: 28, strap: 'ankle', straps: 2, lug: true }, 'sandal', 'sandal'),
          t('gladiator', 'Gladiator Sandal', 'Strappy to the ankle', 'shoe', { kind: 'sandal', sole: 12, straps: 4, strap: 'ankle', gladiator: true }, 'sandal', 'sandal'),
          t('clog', 'Clog', 'Chunky closed toe, open back', 'shoe', { kind: 'clog', sole: 34 }, 'sandal', 'sandal'),
          t('mule', 'Mule', 'Backless closed-toe slip-on', 'shoe', { kind: 'mule', sole: 14 }, 'sandal', 'sandal'),
          t('espadrille', 'Espadrille', 'Canvas upper, jute sole', 'shoe', { kind: 'espadrille', sole: 22 }, 'sandal', 'sandal'),
          t('fisherman', 'Fisherman Sandal', 'Woven closed toe', 'shoe', { kind: 'sandal', sole: 14, straps: 5, closedToe: true, strap: 'ankle' }, 'sandal', 'sandal'),
        ],
      },
      {
        id: 'heels', label: 'Heels & Flats', d: 'Pumps, flats and Mary Janes',
        types: [
          t('pump', 'Pump', 'Classic closed heel', 'shoe', { kind: 'pump', heel: 84, toe: 'pointed' }, 'heel', 'heel'),
          t('stiletto', 'Stiletto', 'Thin, tall spike heel', 'shoe', { kind: 'pump', heel: 112, toe: 'pointed', stiletto: true }, 'heel', 'heel'),
          t('blockHeel', 'Block Heel', 'Stable chunky heel', 'shoe', { kind: 'pump', heel: 80, block: true, toe: 'square' }, 'heel', 'heel'),
          t('kittenHeel', 'Kitten Heel', 'Short slender heel', 'shoe', { kind: 'pump', heel: 48, toe: 'pointed' }, 'heel', 'heel'),
          t('wedgeHeel', 'Wedge', 'Solid wedge sole', 'shoe', { kind: 'pump', heel: 84, wedge: true, toe: 'round' }, 'heel', 'heel'),
          t('heeledSandal', 'Heeled Sandal', 'Strappy open heel', 'shoe', { kind: 'pump', heel: 90, open: true, strap: 'ankle', block: true }, 'heel', 'heel'),
          t('balletFlat', 'Ballet Flat', 'Low-cut flat with bow', 'shoe', { kind: 'flat', bow: true }, 'flat', 'heel'),
          t('maryJane', 'Mary Jane', 'Strap across the instep', 'shoe', { kind: 'flat', strap: 'maryjane', toe: 'round', sole: 18 }, 'flat', 'heel'),
          t('loaferFlat', 'Pointed Flat', 'Sleek pointed flat', 'shoe', { kind: 'flat', toe: 'pointed' }, 'flat', 'heel'),
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────
export const STEPS = ['category', 'genre', 'type', 'cut', 'material'];

export function getCategory(id) { return CATALOG.find((x) => x.id === id); }
export function getGenre(cat, id) { return getCategory(cat)?.genres.find((g) => g.id === id); }
export function getType(cat, genre, id) { return getGenre(cat, genre)?.types.find((x) => x.id === id); }
export function getCuts(type) { return CUT_SETS[type.cuts] || []; }
export function getCut(type, id) { return getCuts(type).find((x) => x.id === id); }
export function getMaterials(type) {
  return (MATERIAL_SETS[type.materials] || []).map((id) => ({ id, ...MATERIALS[id] }));
}

/** Resolve a selection path into a full garment spec. */
export function resolveSpec(sel) {
  const cat = getCategory(sel.category);
  const genre = cat && getGenre(sel.category, sel.genre);
  const type = genre && getType(sel.category, sel.genre, sel.type);
  const cut = type && getCut(type, sel.cut);
  const mat = sel.material && MATERIALS[sel.material];
  if (!type) return null;
  const params = { ...(type.p || {}), ...((cut && cut.p) || {}), artKey: `${cat.id}/${type.id}`, artCut: cut?.id || null };
  return { cat, genre, type, cut, material: mat, materialId: sel.material, tpl: type.tpl, params };
}

/** e.g. "Knitted Drop Shoulder Hoodie" */
export function productName(sel) {
  const s = resolveSpec(sel);
  if (!s) return '';
  const parts = [];
  if (s.material) parts.push(s.material.label);
  if (s.cut && !/^(classic|regular)/i.test(s.cut.label)) parts.push(s.cut.label.replace(/ Fit$/, ''));
  parts.push(s.type.label);
  return parts.join(' ');
}

export function catalogStats() {
  let genres = 0, types = 0, combos = 0;
  for (const cat of CATALOG) for (const g of cat.genres) {
    genres++;
    for (const ty of g.types) { types++; combos += getCuts(ty).length * getMaterials(ty).length; }
  }
  return { categories: CATALOG.length, genres, types, combos };
}
