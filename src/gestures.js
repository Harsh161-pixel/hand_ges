const GESTURE_HOLD_FRAMES = 4;
const TRIGGER_COOLDOWN_MS = 900;

function fingerUp(lm, tip, pip) {
  return lm[tip].y < lm[pip].y;
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export class GestureController {
  constructor({ video, overlay, onStableGesture, onPointer }) {
    this.video = video;
    this.overlay = overlay;
    this.ctx = overlay.getContext("2d");
    this.onStableGesture = onStableGesture;
    this.onPointer = onPointer;

    this.last = "none";
    this.streak = 0;
    this.lastFire = 0;
  }

  classify(lm) {
    const indexUp = fingerUp(lm, 8, 6);
    const middleUp = fingerUp(lm, 12, 10);
    const ringUp = fingerUp(lm, 16, 14);
    const pinkyUp = fingerUp(lm, 20, 18);
    const thumbTip = lm[4];
    const thumbIp = lm[3];
    const thumbUp = thumbTip.y < thumbIp.y;

    const pinch = dist(lm[4], lm[8]) < 0.055;

    if (pinch) return "pinch";
    if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) return "thumbs_up";
    if (indexUp && middleUp && !ringUp && !pinkyUp) return "victory";
    if (indexUp && !middleUp && !ringUp && !pinkyUp) return "pointing";
    if (indexUp && middleUp && ringUp && pinkyUp) return "open_palm";
    if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) return "fist";
    return "unknown";
  }

  updateStability(gesture) {
    if (gesture === this.last) this.streak += 1;
    else {
      this.last = gesture;
      this.streak = 1;
    }

    const now = performance.now();
    if (this.streak >= GESTURE_HOLD_FRAMES && now - this.lastFire > TRIGGER_COOLDOWN_MS) {
      this.lastFire = now;
      this.onStableGesture?.(gesture);
    }
  }

  drawPointer(x, y, gesture) {
    const w = this.overlay.width;
    const h = this.overlay.height;
    this.ctx.clearRect(0, 0, w, h);

    const px = x * w;
    const py = y * h;

    this.ctx.strokeStyle = "#34d399";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(px, py, 12, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.fillStyle = "#f8fafc";
    this.ctx.font = "600 14px Space Grotesk";
    this.ctx.fillText(gesture, px + 16, py - 14);
  }

  async start() {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.55,
    });

    hands.onResults((results) => {
      if (!results.multiHandLandmarks?.length) return;

      const lm = results.multiHandLandmarks[0];
      const pointer = lm[8];
      const gesture = this.classify(lm);

      this.updateStability(gesture);
      this.drawPointer(1 - pointer.x, pointer.y, gesture);
      this.onPointer?.(1 - pointer.x, pointer.y, gesture);
    });

    const cam = new Camera(this.video, {
      onFrame: async () => {
        await hands.send({ image: this.video });
      },
      width: 640,
      height: 360,
    });

    await cam.start();
  }
}
