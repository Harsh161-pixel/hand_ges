import { Modeller } from "./modeller.js";
import { GestureController } from "./gestures.js";

const canvas = document.getElementById("stage");
const video = document.getElementById("cam");
const overlay = document.getElementById("overlay");

const modeText = document.getElementById("modeText");
const axisText = document.getElementById("axisText");
const gestureText = document.getElementById("gestureText");

const modeller = new Modeller(canvas);
modeller.bindPointerPicking();

let pointerNdc = { x: 0, y: 0 };

function setMode(mode) {
  modeller.setMode(mode);
  modeText.textContent = mode;
  document.querySelectorAll("button[data-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

function setAxis(axis) {
  modeller.setAxis(axis);
  axisText.textContent = axis;
  document.querySelectorAll("button[data-axis]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.axis === axis);
  });
}

setMode("translate");
setAxis("all");

window.addEventListener("resize", () => {
  modeller.resize();
  overlay.width = canvas.clientWidth;
  overlay.height = canvas.clientHeight;
});

overlay.width = canvas.clientWidth;
overlay.height = canvas.clientHeight;

for (const btn of document.querySelectorAll("button[data-add]")) {
  btn.addEventListener("click", () => modeller.addPrimitive(btn.dataset.add));
}

for (const btn of document.querySelectorAll("button[data-mode]")) {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
}

for (const btn of document.querySelectorAll("button[data-axis]")) {
  btn.addEventListener("click", () => setAxis(btn.dataset.axis));
}

document.getElementById("extrudeBtn").addEventListener("click", () => modeller.extrudeSelected());
document.getElementById("duplicateBtn").addEventListener("click", () => modeller.duplicateSelected());
document.getElementById("deleteBtn").addEventListener("click", () => modeller.removeSelected());

window.addEventListener("keydown", (e) => {
  if (e.key === "g") setMode("translate");
  if (e.key === "r") setMode("rotate");
  if (e.key === "s") setMode("scale");
  if (e.key.toLowerCase() === "x") setAxis("x");
  if (e.key.toLowerCase() === "y") setAxis("y");
  if (e.key.toLowerCase() === "z") setAxis("z");
  if (e.key === "a") setAxis("all");
  if (e.key === "e") modeller.extrudeSelected();
  if (e.key === "Delete") modeller.removeSelected();
});

const gestures = new GestureController({
  video,
  overlay,
  onPointer: (x, y, gesture) => {
    pointerNdc = { x: x * 2 - 1, y: -(y * 2 - 1) };
    gestureText.textContent = gesture;
  },
  onStableGesture: (gesture) => {
    if (gesture === "open_palm") setMode("translate");
    else if (gesture === "fist") setMode("rotate");
    else if (gesture === "victory") setMode("scale");
    else if (gesture === "thumbs_up") modeller.extrudeSelected();
    else if (gesture === "pointing") modeller.addPrimitive("box");
    else if (gesture === "pinch") {
      modeller.pickFromNdc(pointerNdc.x, pointerNdc.y);
      modeller.applyStepTransform();
    }
  },
});

gestures.start().catch((err) => {
  gestureText.textContent = "camera blocked";
  console.error(err);
});
