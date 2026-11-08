# FlashValidate image briefs

The prototype shows 12 still photos. Each one comes from a camera in the same 3D dockyard, so every photo shows the same trucks, trailers and buildings from a different angle. To keep that consistency, start every image from its guide render rather than from text alone.

## How to make each image

1. Open ChatGPT, or use the OpenAI Images API with an image-edit model such as `gpt-image-1`, landscape `1536x1024`, quality `high`.
2. Upload the guide render named below, e.g. `scenario-a.png` from this folder.
3. Paste the **full prompt**: the shared prompt followed by that image's specific lines.
4. Save the result as **`public/photos/<id>.jpg`** in this project, e.g. `public/photos/scenario-a.jpg`. JPG or PNG are both fine; keep the filename.
5. Check it against the guide. If a vehicle moved noticeably, was added or removed, or the lettering is garbled, regenerate. Small shifts are fine: the bounding boxes get fitted to each final photo.

Priority: the three **scenario** images matter most. Do those first. The dataset and training images can follow.

### API example (optional)

```python
from openai import OpenAI
client = OpenAI()
result = client.images.edit(
    model="gpt-image-1",
    image=open("image-briefs/scenario-a.png", "rb"),
    prompt=open("prompt.txt").read(),
    size="1536x1024",
    quality="high",
)
# result.data[0].b64_json → save as public/photos/scenario-a.jpg
```

## Shared prompt (prefix every image with this)

```
Use the attached image as an exact layout reference. Turn it into a photorealistic still from a fixed security camera at an industrial truck yard.

Keep the composition identical: same camera position, angle, lens and framing. Every vehicle, trailer, building, light pole, barrier and cone must stay in the same place, at the same size and orientation. Do not add or remove any vehicles. No people.

Make everything look real: weathered asphalt with tire marks and oil stains, painted lane lines, corrugated-steel warehouse, realistic semi tractors and 53-ft dry-van trailers with real panel seams, rivets, mud flaps and road grime. Replace the cone-shaped trees with a natural tree line. Keep the trailer and truck lettering legible and spelled exactly as shown (NORTHLINE, HARBORVIEW, MERIDIAN, T-07, B-12).

Look: real CCTV camera, slightly soft optics, natural colour, mild sensor noise. No on-screen text, timestamps, watermarks or borders. Landscape 1536 × 1024.
```


## Scenario images (required)

### `scenario-a`: Scenario A: Baseline (also the project hero image)

- Guide render: `image-briefs/scenario-a.png`
- Save as: `public/photos/scenario-a.jpg`
- Camera: CAM-03 · Yard pole, 10 m

```
Clear daylight. Red semi truck "T-07" with a white NORTHLINE trailer on the left, white HARBORVIEW trailer parked on the right, shipping containers and chain-link fence in the background.
Lighting: clear early-afternoon daylight, soft realistic shadows.
This is also the hero image on the project dashboard, so it should look like a crisp, well-exposed security camera frame.
```

### `scenario-b`: Scenario B: Night + Low Angle

- Guide render: `image-briefs/scenario-b.png`
- Save as: `public/photos/scenario-b.jpg`
- Camera: Low mount, 2.3 m

```
Night. The same red truck T-07 with white NORTHLINE trailer, headlights on, lit by orange sodium floodlights. Camera is low, about head height; concrete jersey barriers in the foreground hide the lower part of the truck. The truck must stay clearly visible to a human.
Lighting: night. Orange high-pressure-sodium floodlights from the poles, truck headlights on, deep blue-black sky, realistic glare and light falloff. The truck must still be clearly recognisable to a human viewer.
Important: the jersey barriers in the foreground hide the lower part of the truck, and the camera is close to the ground. Keep the truck's cab, grille and headlights clearly visible above the barriers.
```

### `scenario-c`: Scenario C: Snow + Occlusion

- Guide render: `image-briefs/scenario-c.png`
- Save as: `public/photos/scenario-c.jpg`
- Camera: Side mount, 3.4 m

```
Heavy snowfall, overcast, snow on the ground. White HARBORVIEW refrigerated trailer partly hidden behind a navy-blue MERIDIAN box truck in the foreground. Warehouse faint in the haze on the left.
Weather: heavy snowfall, overcast flat light, fresh snow covering the ground and vehicle roofs, reduced visibility with distant objects fading into haze.
Important: the blue MERIDIAN box truck must partly block the HARBORVIEW trailer, leaving only about half of the trailer visible, exactly as in the guide.
```


## Dataset thumbnails

### `dataset-cam01`: Dataset: CAM-01 Gate

- Guide render: `image-briefs/dataset-cam01.png`
- Save as: `public/photos/dataset-cam01.jpg`
- Camera: CAM-01 · Gatehouse, 7.4 m

```
Clear daylight, view from the gatehouse into the yard: the back of the white NORTHLINE trailer on the red truck, warehouse dock doors and docked trailers beyond.
Lighting: clear early-afternoon daylight, soft realistic shadows.
```

### `dataset-cam02`: Dataset: CAM-02 Office corner

- Guide render: `image-briefs/dataset-cam02.png`
- Save as: `public/photos/dataset-cam02.jpg`
- Camera: CAM-02 · Office corner, 9 m

```
Clear daylight, high view from the corner of the warehouse office: the red truck T-07 with its white NORTHLINE trailer crossing the yard, jersey barriers, gatehouse and parked cars toward the gate.
Lighting: clear early-afternoon daylight, soft realistic shadows.
```

### `dataset-cam04`: Dataset: CAM-04 West lot

- Guide render: `image-briefs/dataset-cam04.png`
- Save as: `public/photos/dataset-cam04.jpg`
- Camera: CAM-04 · West lot pole, 9 m

```
Clear daylight, view over the west trailer parking: the navy MERIDIAN box truck and HARBORVIEW trailer, warehouse with dock doors and docked trailers behind.
Lighting: clear early-afternoon daylight, soft realistic shadows.
```


## Training examples

### `train-p1-1`: Training: Night / low angle 1

- Guide render: `image-briefs/train-p1-1.png`
- Save as: `public/photos/train-p1-1.jpg`
- Camera: Synthetic camera, 1.0 m

```
Night, orange sodium lighting, camera near the ground. Red truck T-07 front three-quarter view, headlights on, white trailer behind.
Lighting: night. Orange high-pressure-sodium floodlights from the poles, truck headlights on, deep blue-black sky, realistic glare and light falloff. The truck must still be clearly recognisable to a human viewer.
```

### `train-p1-2`: Training: Night / low angle 2

- Guide render: `image-briefs/train-p1-2.png`
- Save as: `public/photos/train-p1-2.jpg`
- Camera: Synthetic camera, 1.2 m

```
Night, camera near the ground to the right of the truck. Red truck T-07 front-right view with headlights on, white NORTHLINE trailer extending behind it.
Lighting: night. Orange high-pressure-sodium floodlights from the poles, truck headlights on, deep blue-black sky, realistic glare and light falloff. The truck must still be clearly recognisable to a human viewer.
```

### `train-p1-3`: Training: Night / low angle 3

- Guide render: `image-briefs/train-p1-3.png`
- Save as: `public/photos/train-p1-3.jpg`
- Camera: Synthetic camera, 1.4 m

```
Night, low side view: the full length of the red truck T-07 and white NORTHLINE trailer under orange floodlights.
Lighting: night. Orange high-pressure-sodium floodlights from the poles, truck headlights on, deep blue-black sky, realistic glare and light falloff. The truck must still be clearly recognisable to a human viewer.
```

### `train-p2-1`: Training: Snow / occlusion 1

- Guide render: `image-briefs/train-p2-1.png`
- Save as: `public/photos/train-p2-1.jpg`
- Camera: Synthetic camera, 2.8 m

```
Heavy snow. Navy MERIDIAN box truck in front partly hiding the white HARBORVIEW trailer behind it.
Weather: heavy snowfall, overcast flat light, fresh snow covering the ground and vehicle roofs, reduced visibility with distant objects fading into haze.
```

### `train-p2-2`: Training: Snow / occlusion 2

- Guide render: `image-briefs/train-p2-2.png`
- Save as: `public/photos/train-p2-2.jpg`
- Camera: Synthetic camera, 4.0 m

```
Heavy snow, view from the south-west: MERIDIAN box truck and HARBORVIEW trailer side by side, the trailer partly blocked.
Weather: heavy snowfall, overcast flat light, fresh snow covering the ground and vehicle roofs, reduced visibility with distant objects fading into haze.
```

### `train-p2-3`: Training: Snow / occlusion 3

- Guide render: `image-briefs/train-p2-3.png`
- Save as: `public/photos/train-p2-3.jpg`
- Camera: Synthetic camera, 1.6 m

```
Heavy snow, low camera from the north-west: the HARBORVIEW trailer with the MERIDIAN box truck partly in front of it.
Weather: heavy snowfall, overcast flat light, fresh snow covering the ground and vehicle roofs, reduced visibility with distant objects fading into haze.
```


## When you're done

Put the files in `public/photos/`, then fit the bounding boxes in `src/data/photos.ts` to the real positions of the trucks and trailers. If any images are missing, the app falls back to the 3D render for that view.

`render-labels.json` in this folder holds the bounding boxes projected from the 3D scene for every guide, which is a good starting point for fitting.

## Scenario D: Bird in Frame

This one works differently. **Edit your existing `public/photos/scenario-a.png`** rather than restyling a render, so D matches A exactly except for the bird. The guide render `image-briefs/scenario-d.png` shows where the gull goes and how big it should be.

- Upload **both** images: `public/photos/scenario-a.png` (the photo to edit) and `image-briefs/scenario-d.png` (placement reference).
- Save as: `public/photos/scenario-d.png`

```
Edit the first image. Add a single herring gull (white body and head, grey wings with black wingtips, yellow beak) flying across the foreground, close to the camera, in the same position and at the same size as the white bird in the second image: in front of the red truck's cab, covering roughly the front 40% of the cab (windshield, grille and hood partly hidden). Wings spread mid-flap, slight motion blur on the wing tips, natural daylight matching the scene. Change nothing else: same truck, trailers, lot, lighting and framing. No text, no watermark. Landscape 1536 × 1024.
```

Check that the truck is still clearly recognisable behind the gull. Only part of it should be hidden.

**Note:** OpenAI regenerated the whole scene when adding the gull, so the final `public/photos/scenario-d.png` is `scenario-a.png` with only the gull cut from that result and composited on top. The unedited OpenAI output is kept as `image-briefs/scenario-d-openai-original.png`.
