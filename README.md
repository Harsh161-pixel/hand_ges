# HandForge Lite (Web Deploy)

This is a Blender-free, browser-based 3D low-poly modelling tool with webcam hand-gesture control.

## Features
- Add primitives: cube, cylinder, plane
- Select objects (mouse click or pinch pointer)
- Move / Rotate / Scale
- Axis lock: All / X / Y / Z
- Duplicate / Delete
- Block extrude (fast low-poly workflow)
- Gesture shortcuts in browser (MediaPipe)

## Gesture Map
- Open palm -> Move mode
- Fist -> Rotate mode
- Victory -> Scale mode
- Thumbs up -> Extrude selected
- Pointing -> Add cube
- Pinch -> Select at pointer + apply one transform step

## Keyboard
- `G` move, `R` rotate, `S` scale
- `A` all axis, `X`, `Y`, `Z` axis lock
- `E` extrude, `Delete` remove selected

## Run locally
From this `web` folder run any static server, for example:

```powershell
python -m http.server 8080
```

Then open: `http://localhost:8080`

## Deploy live URL
You can deploy this folder as static hosting on:
- Vercel
- Netlify
- GitHub Pages

No backend is required.
