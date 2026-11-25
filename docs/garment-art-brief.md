# Garment art brief (for ChatGPT or any illustrator)

Atelier draws every garment from code. You can replace any garment's drawing with a hand-made **SVG** file. The app still recolours it, applies the chosen material texture, clips artwork to it and exports it. Garments without a custom drawing keep the generated one.

This brief has three parts:

1. **A prompt to paste into ChatGPT**, one garment at a time.
2. **The exact file format** the app expects.
3. **How to add the files to the repo** (GitHub website only, no coding).

---

## 1. Prompt to paste into ChatGPT

Copy everything in the box, then replace the three `<…>` placeholders.

```text
You are drawing a garment template for a clothing design app. Output ONE complete SVG file as code (not an image), following these rules exactly.

GARMENT: <garment name, e.g. "Western boot, ankle height, pointed toe, stacked heel">
VIEW: <front | back | outer side (toe pointing RIGHT) | inner side (toe pointing LEFT)>
STYLE: clean fashion flat / technical drawing with soft realistic shading, like a premium product mock-up. Natural proportions. No background, no text, no logos.

FILE RULES
1. Root element: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">. Centre the garment, leaving about 8% empty margin on every side. Shoes may use viewBox="0 0 600 420".
2. <path id="outline" d="…"/>: ONE closed path that is the full silhouette of the garment, every part the fabric covers. No fill or stroke needed; the app paints it with the user's colour and material. If you really need several pieces, use <g id="outline"> containing only <path>/<ellipse>/<circle>/<rect>/<polygon> shapes.
3. <g id="accent">: OPTIONAL. Shapes painted with the user's "trim" colour: shoe soles and heels, cap bands, contrast cuffs/collars. Geometry only; their fill is replaced.
4. <g id="shading">: Soft folds, creases and highlights. Use ONLY black or white strokes/fills with low opacity (stroke-opacity/fill-opacity 0.08–0.35). Blurs are encouraged: define <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter> inside <defs> and use filter="url(#soft)". Light comes from the upper left.
5. <g id="details">: Seams, topstitching (stroke-dasharray), buttons, eyelets, zips, pocket edges. Again ONLY black/white with opacity, or neutral greys for hardware, so they work on any garment colour. Thin lines: 1–2.5 units.
6. <g id="outside">: OPTIONAL. Things that hang outside the silhouette and are NOT recoloured: laces, drawcords, straps, pull loops. Neutral colours.
7. Everything must line up with the outline. Shading and details are clipped to the outline automatically.
8. DO NOT use: <style>, style="…" attributes, <script>, <image>, <text>, external links or fonts, embedded bitmaps, or any solid colour except inside <g id="outside">. Use presentation attributes (fill, stroke, stroke-width, opacity…) instead of CSS.
9. Keep the file under ~150 KB. Use smooth Bézier curves (C/Q) rather than many tiny line segments.

Reply with only the SVG code in one code block.
```

**Tips**
- Ask for one view at a time. For tops, bottoms and hats, ask for `front`, then `back`. For shoes, ask for `outer side`. The inner side is mirrored automatically unless you add your own.
- If the drawing looks wrong, reply with what to fix ("toe is too long", "heel should be lower, ~5 cm") and ask for the full corrected SVG again.
- To preview, save the code as a `.svg` file and open it in a browser. It shows as a flat shape plus faint lines, because the colour is added by the app.

---

## 2. File format reference

| Part | Required | What it is | Colour |
|---|---|---|---|
| `viewBox` | yes | Drawing area; any size works, `0 0 600 600` recommended | n/a |
| `id="outline"` | **yes** | Closed silhouette (one path, or a group of shapes) | painted by the app |
| `id="accent"` | no | Soles, heels, bands, contrast trims | painted with the trim colour |
| `id="shading"` | no | Folds, creases, highlights (above artwork) | black/white, low opacity |
| `id="details"` | no | Seams, stitching, buttons, zips (above artwork) | black/white or neutral grey |
| `id="outside"` | no | Laces, cords, loops outside the silhouette | as drawn |
| `<defs>` | no | Filters/gradients used above (ids are made unique automatically) | n/a |

What the app adds on top: the garment colour, the material texture (denim, knit, leather…), soft edge shading, a key light and a ground shadow.

What it strips for safety: scripts, event handlers, `<style>`, `style=""`, images, links, and any reference to outside files.

### Minimal example

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420">
  <defs><filter id="soft"><feGaussianBlur stdDeviation="6"/></filter></defs>
  <path id="outline" d="M150 40 L292 44 C296 110 292 160 300 190 C330 230 400 250 470 270 C520 284 552 296 556 318 C558 332 540 340 520 340 L232 340 L226 382 L164 382 L156 340 C146 300 146 200 150 40 Z"/>
  <g id="accent"><path d="M156 340 L232 340 L226 382 L164 382 Z"/></g>
  <g id="shading" filter="url(#soft)" fill="none" stroke="#000" stroke-opacity="0.22" stroke-width="14">
    <path d="M168 60 C164 160 166 250 176 320"/>
  </g>
  <g id="details" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="2">
    <path d="M150 56 Q221 116 292 58"/>
  </g>
</svg>
```

A fuller working example: `tests/fixtures/garment-art/shoes/cowboyBoot-front.svg`.

---

## 3. Adding drawings to the app (GitHub website)

1. **Name the file** `<key>-<view>.svg`, using the key from the table at the end of this brief. Examples: `cowboyBoot-front.svg`, `hoodie-back.svg`.
   - For a drawing that applies to only one cut, use `<key>--<cut>-<view>.svg`, e.g. `cowboyBoot--kneeHigh-front.svg`.
2. **Upload it** on github.com: open the repo, go to `assets/garments/`, and choose **Add file → Upload files**. Put it in the category folder (`tops/`, `bottoms/`, `hats/` or `shoes/`) by typing the folder name before the file name. Commit.
3. **Register it** in `assets/garments/manifest.json` (open it, click the ✏️ pencil, edit, commit):

```json
{
  "version": 1,
  "garments": {
    "shoes/cowboyBoot": {
      "front": "shoes/cowboyBoot-front.svg",
      "cuts": {
        "kneeHigh": { "front": "shoes/cowboyBoot--kneeHigh-front.svg" }
      }
    },
    "tops/hoodie": { "front": "tops/hoodie-front.svg", "back": "tops/hoodie-back.svg" }
  }
}
```

The key (`"shoes/cowboyBoot"`) is the category plus the garment key. `cuts` is optional. Mind the commas between entries; GitHub warns you if the JSON is invalid.

4. Wait a minute for GitHub Pages to update, then reopen the app. If a file has a problem, the app keeps using the generated drawing and logs the reason in the browser console. Nothing breaks.

**Notes**
- Artwork already placed on saved designs keeps its position. If a new drawing has a very different shape, nudge the artwork in the designer.
- For shoes, the outer side is drawn with the toe pointing **right**. If there's no `back` file, the inner side is a mirror image.
- For tops, bottoms and hats without a `back` file, the back view keeps the generated drawing.

---

## Suggested order (weakest generated drawings first)

1. Shoes: Western Boot (`shoes/cowboyBoot`), Heeled Sandal (`shoes/heeledSandal`), Stiletto, Pump, Block Heel, Kitten Heel, Wedge (`shoes/stiletto`, `shoes/pump`, `shoes/blockHeel`, `shoes/kittenHeel`, `shoes/wedgeHeel`), Heeled Ankle Boot (`shoes/ankleBoot`), Chelsea Boot (`shoes/chelsea`)
2. Hats: Cowboy Hat, Beret, Trapper Hat, Bandana, Durag
3. Anything else you want to look its best

---

## Garment keys

### Tops

| Garment | Key (folder/file prefix) | Cut keys (optional, for cut-specific drawings) |
|---|---|---|
| Hoodie | `tops/hoodie` | classic, dropShoulder, oversized, boxy, cropped, slim, raglan, relaxed, longline, openHem, cinched, sleeveless, shortSleeve, heavyweight |
| Zip-Up Hoodie | `tops/zipHoodie` | classic, dropShoulder, oversized, boxy, cropped, slim, raglan, relaxed, longline, openHem, cinched, sleeveless, shortSleeve, heavyweight |
| Crewneck Sweatshirt | `tops/crewneck` | classic, dropShoulder, oversized, boxy, cropped, slim, raglan, relaxed, longline, openHem, cinched, sleeveless, shortSleeve, heavyweight |
| Quarter-Zip | `tops/quarterZip` | classic, dropShoulder, oversized, boxy, cropped, slim, raglan, relaxed, longline, openHem, cinched, sleeveless, shortSleeve, heavyweight |
| Half-Zip Fleece | `tops/halfZip` | classic, dropShoulder, oversized, boxy, cropped, slim, raglan, relaxed, longline, openHem, cinched, sleeveless, shortSleeve, heavyweight |
| Pullover Sweater | `tops/pullover` | classic, relaxed, oversized, dropShoulder, cropped, boxy, slim, longline, raglan, balloon, fitted, chunky |
| Cardigan | `tops/cardigan` | classic, relaxed, oversized, dropShoulder, cropped, boxy, slim, longline, raglan, balloon, fitted, chunky |
| Turtleneck | `tops/turtleneck` | classic, relaxed, oversized, dropShoulder, cropped, boxy, slim, longline, raglan, balloon, fitted, chunky |
| Mock Neck Sweater | `tops/mockNeck` | classic, relaxed, oversized, dropShoulder, cropped, boxy, slim, longline, raglan, balloon, fitted, chunky |
| V-Neck Sweater | `tops/vNeckSweater` | classic, relaxed, oversized, dropShoulder, cropped, boxy, slim, longline, raglan, balloon, fitted, chunky |
| Sweater Vest | `tops/sweaterVest` | classic, cropped, oversized, slim, longline, boxy |
| Knit Polo | `tops/polo` | classic, relaxed, oversized, dropShoulder, cropped, boxy, slim, longline, raglan, balloon, fitted, chunky |
| Shawl Cardigan | `tops/shawlCardigan` | classic, relaxed, oversized, dropShoulder, cropped, boxy, slim, longline, raglan, balloon, fitted, chunky |
| T-Shirt | `tops/tshirt` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Long Sleeve Tee | `tops/longSleeve` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Pocket Tee | `tops/pocketTee` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| V-Neck Tee | `tops/vNeckTee` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Ringer Tee | `tops/ringer` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Henley | `tops/henley` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Baseball Raglan | `tops/baseball` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Graphic Tee | `tops/graphic` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Baby Tee | `tops/babyTee` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Mock Neck Tee | `tops/mockTee` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Scoop Neck Tee | `tops/scoopTee` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Thermal Long Sleeve | `tops/thermal` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Button-Up Shirt | `tops/buttonUp` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Oxford Shirt | `tops/oxford` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Dress Shirt | `tops/dress` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Flannel Shirt | `tops/flannel` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Camp Collar Shirt | `tops/camp` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Overshirt | `tops/overshirt` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Polo Shirt | `tops/poloShirt` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Rugby Shirt | `tops/rugby` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Western Shirt | `tops/western` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Work Shirt | `tops/work` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Blouse | `tops/blouse` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Peasant Blouse | `tops/peasant` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Tunic | `tops/tunic` | classic, slim, tailored, relaxed, oversized, boxy, cropped, dropShoulder, shortSleeve, sleeveless, longline, straightHem, threeQuarter |
| Bomber Jacket | `tops/bomber` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Denim Jacket | `tops/denimJacket` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Varsity Jacket | `tops/varsity` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Coach Jacket | `tops/coach` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Windbreaker | `tops/windbreaker` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Puffer Jacket | `tops/puffer` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Parka | `tops/parka` | classic, doubleBreasted, belted, oversized, cocoon, slim, maxi, midi, car, dropShoulder, raglan, aLine |
| Leather Jacket | `tops/leather` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Harrington Jacket | `tops/harrington` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Shacket | `tops/shacket` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Chore Coat | `tops/chore` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Anorak | `tops/anorak` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Fleece Jacket | `tops/fleece` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Rain Jacket | `tops/rain` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Gilet / Vest | `tops/gilet` | classic, cropped, oversized, slim, longline, boxy |
| Blazer | `tops/blazer` | classic, oversized, cropped, boxy, slim, relaxed, longline, dropShoulder, raglan, cinched, belted |
| Trench Coat | `tops/trench` | classic, doubleBreasted, belted, oversized, cocoon, slim, maxi, midi, car, dropShoulder, raglan, aLine |
| Overcoat | `tops/overcoat` | classic, doubleBreasted, belted, oversized, cocoon, slim, maxi, midi, car, dropShoulder, raglan, aLine |
| Peacoat | `tops/peacoat` | classic, doubleBreasted, belted, oversized, cocoon, slim, maxi, midi, car, dropShoulder, raglan, aLine |
| Tank Top | `tops/tank` | classic, racerback, cropped, longline, relaxed, slim, wideStrap, thinStrap, scoop, square, highNeck, oversized |
| Muscle Tank | `tops/muscleTank` | classic, racerback, cropped, longline, relaxed, slim, wideStrap, thinStrap, scoop, square, highNeck, oversized |
| Camisole | `tops/cami` | classic, racerback, cropped, longline, relaxed, slim, wideStrap, thinStrap, scoop, square, highNeck, oversized |
| Tube Top | `tops/tube` | classic, racerback, cropped, longline, relaxed, slim, wideStrap, thinStrap, scoop, square, highNeck, oversized |
| Halter Top | `tops/halter` | classic, racerback, cropped, longline, relaxed, slim, wideStrap, thinStrap, scoop, square, highNeck, oversized |
| Crop Top | `tops/cropTop` | classic, slim, relaxed, oversized, boxy, dropShoulder, cropped, longline, muscle, raglan, curvedHem, fittedWaist, heavyBoxy |
| Corset Top | `tops/corset` | classic, racerback, cropped, longline, relaxed, slim, wideStrap, thinStrap, scoop, square, highNeck, oversized |
| Bodysuit | `tops/bodysuit` | regular, compression, fitted, relaxed, cropped, longline, raglan, sleeveless, racerback |
| Ribbed Tank | `tops/ribTank` | classic, racerback, cropped, longline, relaxed, slim, wideStrap, thinStrap, scoop, square, highNeck, oversized |
| Performance Tee | `tops/perfTee` | regular, compression, fitted, relaxed, cropped, longline, raglan, sleeveless, racerback |
| Training Tank | `tops/trainingTank` | regular, compression, fitted, relaxed, cropped, longline, raglan, sleeveless, racerback |
| Compression Top | `tops/compression` | regular, compression, fitted, relaxed, cropped, longline, raglan, sleeveless, racerback |
| Sports Bra | `tops/sportsBra` | classic, longline, racerback, crossback, highNeck, square, vNeck |
| Running Jacket | `tops/runJacket` | regular, compression, fitted, relaxed, cropped, longline, raglan, sleeveless, racerback |
| Rash Guard | `tops/rashGuard` | regular, compression, fitted, relaxed, cropped, longline, raglan, sleeveless, racerback |
| Sports Jersey | `tops/jersey` | regular, compression, fitted, relaxed, cropped, longline, raglan, sleeveless, racerback |
| Track Jacket | `tops/trackJacket` | regular, compression, fitted, relaxed, cropped, longline, raglan, sleeveless, racerback |
| Half-Zip Pullover | `tops/halfZipRun` | regular, compression, fitted, relaxed, cropped, longline, raglan, sleeveless, racerback |

### Bottoms

| Garment | Key (folder/file prefix) | Cut keys (optional, for cut-specific drawings) |
|---|---|---|
| Chinos | `bottoms/chinos` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Dress Trousers | `bottoms/trousers` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Cargo Pants | `bottoms/cargo` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Pleated Trousers | `bottoms/pleated` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Carpenter Pants | `bottoms/carpenter` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Work Pants | `bottoms/workPants` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Wide-Leg Trousers | `bottoms/wideTrousers` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Palazzo Pants | `bottoms/palazzo` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Parachute Pants | `bottoms/parachute` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Corduroy Pants | `bottoms/cords` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Drawstring Linen Pants | `bottoms/linenPants` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| Overalls | `bottoms/overalls` | straight, slim, skinny, relaxed, wideLeg, tapered, bootcut, flare, baggy, barrel, cropped, highRise, lowRise, pleated |
| 5-Pocket Jeans | `bottoms/fivePocket` | straight, slim, skinny, relaxed, baggy, bootcut, flare, tapered, wideLeg, barrel, mom, dad, loose, lowRise, cropped |
| Selvedge Jeans | `bottoms/selvedge` | straight, slim, skinny, relaxed, baggy, bootcut, flare, tapered, wideLeg, barrel, mom, dad, loose, lowRise, cropped |
| Carpenter Jeans | `bottoms/carpenterJeans` | straight, slim, skinny, relaxed, baggy, bootcut, flare, tapered, wideLeg, barrel, mom, dad, loose, lowRise, cropped |
| Painter Jeans | `bottoms/painter` | straight, slim, skinny, relaxed, baggy, bootcut, flare, tapered, wideLeg, barrel, mom, dad, loose, lowRise, cropped |
| Cargo Jeans | `bottoms/cargoJeans` | straight, slim, skinny, relaxed, baggy, bootcut, flare, tapered, wideLeg, barrel, mom, dad, loose, lowRise, cropped |
| Distressed Jeans | `bottoms/ripped` | straight, slim, skinny, relaxed, baggy, bootcut, flare, tapered, wideLeg, barrel, mom, dad, loose, lowRise, cropped |
| Pull-On Jeans | `bottoms/elasticJeans` | straight, slim, skinny, relaxed, baggy, bootcut, flare, tapered, wideLeg, barrel, mom, dad, loose, lowRise, cropped |
| Chino Shorts | `bottoms/chinoShorts` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Cargo Shorts | `bottoms/cargoShorts` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Denim Shorts | `bottoms/jorts` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Athletic Shorts | `bottoms/athletic` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Board Shorts | `bottoms/board` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Sweat Shorts | `bottoms/sweatShorts` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Running Shorts | `bottoms/running` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Bike Shorts | `bottoms/bike` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Pleated Shorts | `bottoms/pleatedShorts` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Skort | `bottoms/skort` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |
| Joggers | `bottoms/joggers` | classic, tapered, relaxed, slim, openHem, wideLeg, flared, stacked, cropped, baggy |
| Sweatpants | `bottoms/sweatpants` | classic, tapered, relaxed, slim, openHem, wideLeg, flared, stacked, cropped, baggy |
| Track Pants | `bottoms/trackPants` | classic, tapered, relaxed, slim, openHem, wideLeg, flared, stacked, cropped, baggy |
| Lounge Pants | `bottoms/lounge` | classic, tapered, relaxed, slim, openHem, wideLeg, flared, stacked, cropped, baggy |
| Cargo Joggers | `bottoms/cargoJogger` | classic, tapered, relaxed, slim, openHem, wideLeg, flared, stacked, cropped, baggy |
| Tech Pants | `bottoms/techPant` | classic, tapered, relaxed, slim, openHem, wideLeg, flared, stacked, cropped, baggy |
| Mini Skirt | `bottoms/mini` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Knee-Length Skirt | `bottoms/knee` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Midi Skirt | `bottoms/midi` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Maxi Skirt | `bottoms/maxi` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Micro Mini | `bottoms/micro` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Tennis Skirt | `bottoms/tennis` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Denim Skirt | `bottoms/denimSkirt` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Cargo Skirt | `bottoms/cargoSkirt` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Slip Skirt | `bottoms/slip` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Kilt | `bottoms/kilt` | aLine, pencil, straight, flared, pleated, tiered, asymmetric, wrap, slit, bias, dropWaist, highWaisted, lowRise |
| Leggings | `bottoms/leggings` | highRise, midRise, flared, sevenEighths, capri, biker, crossover, stirrup |
| Yoga Pants | `bottoms/yoga` | highRise, midRise, flared, sevenEighths, capri, biker, crossover, stirrup |
| Running Tights | `bottoms/runTights` | highRise, midRise, flared, sevenEighths, capri, biker, crossover, stirrup |
| Compression Tights | `bottoms/compressionTights` | highRise, midRise, flared, sevenEighths, capri, biker, crossover, stirrup |
| Training Shorts | `bottoms/trainingShorts` | mid, short, micro, long, bermuda, relaxed, slim, baggy, pleated, highWaisted |

### Hats

| Garment | Key (folder/file prefix) | Cut keys (optional, for cut-specific drawings) |
|---|---|---|
| Baseball Cap | `hats/baseball` | structured, unstructured, curved, flat, low, mid, high, fivePanel, sixPanel, shortBrim |
| Dad Cap | `hats/dad` | structured, unstructured, curved, flat, low, mid, high, fivePanel, sixPanel, shortBrim |
| Snapback | `hats/snapback` | structured, unstructured, curved, flat, low, mid, high, fivePanel, sixPanel, shortBrim |
| Trucker Hat | `hats/trucker` | structured, unstructured, curved, flat, low, mid, high, fivePanel, sixPanel, shortBrim |
| Fitted Cap | `hats/fitted` | structured, unstructured, curved, flat, low, mid, high, fivePanel, sixPanel, shortBrim |
| 5-Panel Camp Cap | `hats/fivePanel` | structured, unstructured, curved, flat, low, mid, high, fivePanel, sixPanel, shortBrim |
| Military / Cadet Cap | `hats/military` | structured, unstructured, curved, flat, low, mid, high, fivePanel, sixPanel, shortBrim |
| Flat Cap | `hats/flatCap` | classic, deep, shallow, wide, short, reversible, chinStrap |
| Newsboy Cap | `hats/newsboy` | classic, deep, shallow, wide, short, reversible, chinStrap |
| Visor | `hats/visor` | structured, unstructured, curved, flat, low, mid, high, fivePanel, sixPanel, shortBrim |
| Beanie | `hats/beanie` | cuffed, doubleCuff, uncuffed, slouchy, fisherman, tall, pom, fitted |
| Watch Cap | `hats/watchCap` | cuffed, doubleCuff, uncuffed, slouchy, fisherman, tall, pom, fitted |
| Pom-Pom Beanie | `hats/pomBeanie` | cuffed, doubleCuff, uncuffed, slouchy, fisherman, tall, pom, fitted |
| Slouch Beanie | `hats/slouchBeanie` | cuffed, doubleCuff, uncuffed, slouchy, fisherman, tall, pom, fitted |
| Balaclava | `hats/balaclava` | cuffed, doubleCuff, uncuffed, slouchy, fisherman, tall, pom, fitted |
| Earflap Hat | `hats/earflap` | cuffed, doubleCuff, uncuffed, slouchy, fisherman, tall, pom, fitted |
| Knit Headband | `hats/headband` | cuffed, doubleCuff, uncuffed, slouchy, fisherman, tall, pom, fitted |
| Bucket Hat | `hats/bucket` | classic, deep, shallow, wide, short, reversible, chinStrap |
| Boonie Hat | `hats/boonie` | classic, deep, shallow, wide, short, reversible, chinStrap |
| Fedora | `hats/fedora` | medium, short, wide, extraWide, pinched, teardrop, telescope, rounded, snapBrim, upturned, flatBrim |
| Trilby | `hats/trilby` | medium, short, wide, extraWide, pinched, teardrop, telescope, rounded, snapBrim, upturned, flatBrim |
| Panama Hat | `hats/panama` | medium, short, wide, extraWide, pinched, teardrop, telescope, rounded, snapBrim, upturned, flatBrim |
| Porkpie | `hats/porkpie` | medium, short, wide, extraWide, pinched, teardrop, telescope, rounded, snapBrim, upturned, flatBrim |
| Cowboy Hat | `hats/cowboy` | medium, short, wide, extraWide, pinched, teardrop, telescope, rounded, snapBrim, upturned, flatBrim |
| Boater | `hats/boater` | medium, short, wide, extraWide, pinched, teardrop, telescope, rounded, snapBrim, upturned, flatBrim |
| Wide Sun Hat | `hats/sunHat` | medium, short, wide, extraWide, pinched, teardrop, telescope, rounded, snapBrim, upturned, flatBrim |
| Cloche | `hats/cloche` | classic, deep, shallow, wide, short, reversible, chinStrap |
| Beret | `hats/beret` | classic, deep, shallow, wide, short, reversible, chinStrap |
| Bandana | `hats/bandana` | classic, deep, shallow, wide, short, reversible, chinStrap |
| Trapper Hat | `hats/trapper` | classic, deep, shallow, wide, short, reversible, chinStrap |
| Sport Visor | `hats/sunVisor` | structured, unstructured, curved, flat, low, mid, high, fivePanel, sixPanel, shortBrim |
| Durag | `hats/durag` | classic, deep, shallow, wide, short, reversible, chinStrap |

### Shoes

| Garment | Key (folder/file prefix) | Cut keys (optional, for cut-specific drawings) |
|---|---|---|
| Low-Top Sneaker | `shoes/lowTop` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| Mid-Top Sneaker | `shoes/midTop` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| High-Top Sneaker | `shoes/highTop` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| Running Shoe | `shoes/runner` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| Basketball Shoe | `shoes/basketball` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| Skate Shoe | `shoes/skate` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| Slip-On Sneaker | `shoes/slipOn` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| Court Sneaker | `shoes/court` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| Trail Runner | `shoes/trail` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| Cross-Trainer | `shoes/training` | classic, chunky, slim, platform, lowProfile, sockFit, retro, minimal, vulcanized, gum |
| Chelsea Boot | `shoes/chelsea` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Combat Boot | `shoes/combat` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Work Boot | `shoes/workBoot` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Hiking Boot | `shoes/hiking` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Chukka Boot | `shoes/chukka` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Desert Boot | `shoes/desert` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Western Boot | `shoes/cowboyBoot` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Moto Boot | `shoes/moto` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Rain Boot | `shoes/rainBoot` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Snow Boot | `shoes/snowBoot` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Heeled Ankle Boot | `shoes/ankleBoot` | ankle, midCalf, kneeHigh, lug, platform, stackedHeel, squareToe, pointedToe, roundToe, sideZip, slouch |
| Oxford | `shoes/oxfordShoe` | roundToe, almond, square, pointed, chisel, capToe, wingtip, lug, slim, platform |
| Derby | `shoes/derby` | roundToe, almond, square, pointed, chisel, capToe, wingtip, lug, slim, platform |
| Brogue | `shoes/brogue` | roundToe, almond, square, pointed, chisel, capToe, wingtip, lug, slim, platform |
| Loafer | `shoes/loafer` | roundToe, almond, square, pointed, chisel, capToe, wingtip, lug, slim, platform |
| Penny Loafer | `shoes/pennyLoafer` | roundToe, almond, square, pointed, chisel, capToe, wingtip, lug, slim, platform |
| Bit Loafer | `shoes/horsebit` | roundToe, almond, square, pointed, chisel, capToe, wingtip, lug, slim, platform |
| Monk Strap | `shoes/monk` | roundToe, almond, square, pointed, chisel, capToe, wingtip, lug, slim, platform |
| Boat Shoe | `shoes/boat` | roundToe, almond, square, pointed, chisel, capToe, wingtip, lug, slim, platform |
| Driving Moccasin | `shoes/driver` | roundToe, almond, square, pointed, chisel, capToe, wingtip, lug, slim, platform |
| Slide | `shoes/slide` | flat, footbed, platform, chunky, wedge, strappy, ankleStrap, slingback |
| Flip-Flop | `shoes/flipFlop` | flat, footbed, platform, chunky, wedge, strappy, ankleStrap, slingback |
| Sport Sandal | `shoes/sportSandal` | flat, footbed, platform, chunky, wedge, strappy, ankleStrap, slingback |
| Gladiator Sandal | `shoes/gladiator` | flat, footbed, platform, chunky, wedge, strappy, ankleStrap, slingback |
| Clog | `shoes/clog` | flat, footbed, platform, chunky, wedge, strappy, ankleStrap, slingback |
| Mule | `shoes/mule` | flat, footbed, platform, chunky, wedge, strappy, ankleStrap, slingback |
| Espadrille | `shoes/espadrille` | flat, footbed, platform, chunky, wedge, strappy, ankleStrap, slingback |
| Fisherman Sandal | `shoes/fisherman` | flat, footbed, platform, chunky, wedge, strappy, ankleStrap, slingback |
| Pump | `shoes/pump` | mid, kitten, high, sky, pointed, almond, square, peep, platform, ankleStrap, slingback |
| Stiletto | `shoes/stiletto` | mid, kitten, high, sky, pointed, almond, square, peep, platform, ankleStrap, slingback |
| Block Heel | `shoes/blockHeel` | mid, kitten, high, sky, pointed, almond, square, peep, platform, ankleStrap, slingback |
| Kitten Heel | `shoes/kittenHeel` | mid, kitten, high, sky, pointed, almond, square, peep, platform, ankleStrap, slingback |
| Wedge | `shoes/wedgeHeel` | mid, kitten, high, sky, pointed, almond, square, peep, platform, ankleStrap, slingback |
| Heeled Sandal | `shoes/heeledSandal` | mid, kitten, high, sky, pointed, almond, square, peep, platform, ankleStrap, slingback |
| Ballet Flat | `shoes/balletFlat` | round, pointed, square, almond, platform, slingback, strap |
| Mary Jane | `shoes/maryJane` | round, pointed, square, almond, platform, slingback, strap |
| Pointed Flat | `shoes/loaferFlat` | round, pointed, square, almond, platform, slingback, strap |
