# Garment art brief (for a drawing agent or illustrator)

Atelier draws every garment from code. Any garment's drawing can be replaced with a hand-made **SVG** file. The app still recolours it, applies the chosen material texture, clips artwork to it and exports it. Garments without a custom drawing keep the generated one.

**How to use this brief:** give the **whole document** to the drawing agent, ideally a Claude Code session with this repository checked out. Then add one line: "Follow section 1 of this brief." The agent works through every garment in the list at the end.

1. **The agent prompt**: role, house style, quality process and workflow.
2. **The exact file format** the app expects.
3. **How to add files** (the agent does this itself in Claude Code; in a chat, you upload them on GitHub).

---

## 1. Agent prompt

```text
ROLE
You are a senior apparel designer and technical illustrator who draws product "flats" for fashion brands' tech packs and e-commerce. Your drawings are known for exact proportions, clean construction and instantly recognisable silhouettes. Bring that standard to every single drawing in this job.

GOAL
Draw a replacement SVG template for EVERY garment in the "Garment keys" tables at the end of this document:
- Tops, Bottoms, Hats: two views each: "front" and "back".
- Shoes: one view: "front", meaning the OUTER side profile with the toe pointing RIGHT. (The app mirrors it for the inner side.)
That is about 360 drawings (157 types × 2 views + 47 shoes). All of them are in scope. Do not skip any, merge any, or stop early.

HOUSE STYLE (match the app)
The app is minimalist and utilitarian. The drawings must be too:
- Clean, flat, front-on "fashion flat" drawings: a crisp silhouette, essential construction lines, and quiet, subtle shading. Not illustrations, not 3D renders, not sketches.
- Do NOT over-detail. Draw only what identifies the garment and how it is built: main seams, plackets, pockets, cuffs, hems, closures, collars, soles. Leave out textures (the app adds fabric texture), wrinkles beyond a few soft folds, decorative flourishes, logos, text, people, hangers and backgrounds.
- Detail budget per drawing: roughly 4–15 detail paths and 2–6 soft shading strokes. If you are over budget, simplify.
- It must stay functional. Users place artwork on the garment, so keep the main print areas (chest, upper back, thigh, cap front, shoe quarter panel) clear of busy detail. The silhouette must read clearly as a 150 px thumbnail and look clean at 800 px.
- Keep one visual language across the whole set: the same line weights (outline-adjacent seams 1.5–2, stitching 1–1.4 with dash 4 3), the same shading approach and the same framing. Every drawing should feel like part of one catalogue.

CONSISTENT FRAMING
- Tops, Bottoms, Hats: viewBox "0 0 600 600". Garment centred horizontally (axis at x = 300). The garment's larger dimension fills about 84% of the canvas.
- Within a category, keep the scale consistent, e.g. every T-shirt-sized top has a similar body width. Coats are longer, crop tops are shorter, but the shoulders stay the same width.
- Shoes: viewBox "0 0 600 420", toe pointing RIGHT, the ground (bottom of the sole) at y = 380, the shoe about 480 units long. Shafts and heels rise from that ground line.

QUALITY PROCESS — for EVERY garment, no shortcuts
1. Reference: before drawing, recall the real-world garment as found in a top retailer's catalogue. Write 1–3 lines of notes: its defining silhouette, key proportions (e.g. "stiletto: heel height ≈ 25% of shoe length, very slim heel, long low vamp"), and what makes it different from its closest siblings in the list (e.g. trilby vs fedora brim width, chukka vs desert boot sole).
2. Draw it, following the file rules below.
3. Review it against the real garment and this checklist:
   - Would a shopper name this garment correctly from the silhouette alone?
   - Are the proportions true to life: lengths, widths, heel heights, brim widths, rise and inseam?
   - Is it symmetric where the real one is (front/back views)?
   - Is the outline one closed shape, with every detail sitting inside it and aligned to it?
   - Does it match the house style, detail budget and framing of the drawings you've already made?
   - Does the back view match the front: same silhouette width, plausible back construction (yokes, back pockets, hood seam, closures)?
4. If any check fails, fix it and review again. Only output a drawing you would put in a professional product catalogue.
5. Every garment gets its own drawing. Never copy an outline from another garment unless the real garments truly share that shape, and even then adjust the details that make it different.

WORKFLOW
A) If you can create files in this repository (e.g. Claude Code):
   - Write each drawing to assets/garments/<category>/<key>-<view>.svg (e.g. assets/garments/shoes/cowboyBoot-front.svg).
   - Register each file in assets/garments/manifest.json as you go (format in section 3).
   - After each genre, serve the repo (python3 -m http.server 8123) and visually check your work at http://localhost:8123/tests/look.html?set=<category> and ...&view=back. That page shows every garment in a category at large size. Fix anything that looks off, small, misaligned or inconsistent with its neighbours.
   - Commit after each category with a clear message. Work through all categories before finishing.
B) If you are in a chat with no file access:
   - Work in order, one genre per reply.
   - For each garment, first write a line with the file path (e.g. "assets/garments/shoes/cowboyBoot-front.svg"), then the SVG in its own code block.
   - End each reply with the manifest.json entries for that batch, and say which genre comes next. Continue when the user says "continue".
In both cases, keep a running checklist of finished keys. Never summarise remaining garments as "similar" or "same as above". Draw them.

FILE RULES (every drawing)
1. Root: <svg xmlns="http://www.w3.org/2000/svg" viewBox="…"> as specified above.
2. <path id="outline" d="…"/>: ONE closed path for the full silhouette (everything the material covers). No fill or stroke needed; the app paints it with the user's colour and material. If you truly need several pieces, use <g id="outline"> containing only path/ellipse/circle/rect/polygon shapes.
3. <g id="accent">: OPTIONAL. Shapes painted with the user's trim colour: shoe soles and heels, hat bands, contrast cuffs and collars. Geometry only.
4. <g id="shading">: a few soft folds and highlights, black or white only, at low opacity (0.08–0.3). Use a blur: <defs><filter id="soft"><feGaussianBlur stdDeviation="6"/></filter></defs> and filter="url(#soft)". Light comes from the upper left.
5. <g id="details">: seams, topstitching (stroke-dasharray="4 3"), buttons, eyelets, zips, pocket edges. Black or white at low-to-medium opacity, or neutral grey for hardware, so they work on any garment colour.
6. <g id="outside">: OPTIONAL. Things outside the silhouette that are not recoloured: laces, drawcords, straps, pull loops. Neutral colours.
7. Everything lines up with the outline; shading and details are clipped to it automatically.
8. Do NOT use <style>, style="…", <script>, <image>, <text>, external links or fonts, bitmaps, or solid colours outside <g id="outside">. Use presentation attributes (fill, stroke, stroke-width, opacity…).
9. Smooth Bézier curves (C/Q), no jagged polylines. Keep each file under about 150 KB.
```

**If the agent is a chat rather than Claude Code:** reply "continue" after each batch, save each code block as a `.svg` file using the path written above it, and follow section 3 to upload. In Claude Code, the agent does all of this itself; you only need to review and merge its work.

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

A fuller working example: `tests/fixtures/garment-art/shoes/cowboyBoot-front.svg`. Its proportions are only a placeholder, not a quality bar.

---

## 3. Adding drawings to the app

A Claude Code agent does these steps itself. By hand on the GitHub website:

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

## Suggested order

The agent draws everything. If you want the biggest improvements first, start here (the weakest generated drawings):

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
