/* ==========================================================================
   PYQUEST: SOLO CODE LEVELING (AAA+ EDITION)
   File 3/5: vfx_audio.js — 60FPS Canvas Particle/Slash Engine & Web Audio Synth
   ========================================================================== */

(function () {
  "use strict";

  if (window.PyQuestVFX && window.PyQuestAudio) return;

  /* ========================================================================
     1. 100% OFFLINE WEB AUDIO API SYNTHESIZER
     ======================================================================== */
  class OfflineAudioSynth {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.bgmInterval = null;
      this.bgmStep = 0;
    }

    initContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      if (this.muted) {
        this.stopBGM();
      } else {
        this.initContext();
        this.playClick();
      }
      return this.muted;
    }

    playTone(freq, type, duration, gainVal = 0.12, slideTo = null) {
      if (this.muted) return;
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    }

    playClick() {
      this.playTone(720, "triangle", 0.07, 0.08, 1080);
    }

    playSlash(mode = "light") {
      if (this.muted) return;
      if (mode === "ultimate") {
        this.playTone(180, "sawtooth", 0.42, 0.18, 920);
        setTimeout(() => this.playTone(640, "sine", 0.35, 0.15, 1480), 70);
        setTimeout(() => this.playTone(960, "triangle", 0.4, 0.14, 420), 140);
      } else if (mode === "heavy") {
        this.playTone(240, "sawtooth", 0.3, 0.15, 780);
        setTimeout(() => this.playTone(520, "triangle", 0.25, 0.12, 1120), 60);
      } else {
        this.playTone(340, "sawtooth", 0.22, 0.13, 880);
        setTimeout(() => this.playTone(680, "sine", 0.16, 0.1, 1200), 45);
      }
    }

    playDamageHit() {
      if (this.muted) return;
      this.playTone(150, "sawtooth", 0.32, 0.2, 42);
      setTimeout(() => this.playTone(95, "square", 0.28, 0.16, 35), 50);
    }

    playHeal() {
      if (this.muted) return;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((n, idx) => {
        setTimeout(() => this.playTone(n, "sine", 0.22, 0.1, n * 1.05), idx * 65);
      });
    }

    playBossSiren() {
      if (this.muted) return;
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.playTone(220, "sawtooth", 0.36, 0.16, 580);
          setTimeout(() => this.playTone(580, "sawtooth", 0.32, 0.14, 190), 180);
        }, i * 420);
      }
    }

    playArise() {
      if (this.muted) return;
      const chord = [146.83, 220, 293.66, 440, 587.33];
      chord.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, "triangle", 0.85, 0.11, freq * 1.5), i * 90);
      });
    }

    playVictory() {
      if (this.muted) return;
      const fanfare = [523.25, 659.25, 783.99, 1046.5];
      fanfare.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, "triangle", 0.32, 0.13), i * 110);
      });
    }

    playDefeat() {
      if (this.muted) return;
      const notes = [392, 349.23, 311.13, 261.63];
      notes.forEach((freq, i) => {
        setTimeout(() => this.playTone(freq, "sawtooth", 0.35, 0.12, freq * 0.85), i * 140);
      });
    }

    stopBGM() {
      if (this.bgmInterval) {
        clearInterval(this.bgmInterval);
        this.bgmInterval = null;
      }
    }
  }

  /* ========================================================================
     2. 60FPS CANVAS PARTICLE, SLASH & FLOATING COMBAT TEXT ENGINE
     ======================================================================== */
  class BattleVFXEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.slashes = [];
      this.floatingTexts = [];
      this.lightningBolts = [];
      this.ambientDust = [];
      this.running = false;
    }

    init() {
      this.canvas = document.getElementById("vfx-canvas");
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext("2d");
      this.resize();
      window.addEventListener("resize", () => this.resize());

      // Seed ambient Solo Leveling shadow/cyan embers
      this.ambientDust = [];
      for (let i = 0; i < 42; i++) {
        this.ambientDust.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: 1.2 + Math.random() * 2.5,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.45 - Math.random() * 0.85,
          color: i % 2 === 0 ? "#00f3ff" : "#9d4edd",
          alpha: 0.25 + Math.random() * 0.55,
        });
      }

      if (!this.running) {
        this.running = true;
        requestAnimationFrame(() => this.loop());
      }
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement
        ? this.canvas.parentElement.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };
      this.canvas.width = rect.width || window.innerWidth;
      this.canvas.height = rect.height || window.innerHeight;
    }

    triggerSlash(targetX, targetY, color = "#00f3ff", isUltimate = false) {
      if (!this.canvas) return;
      const count = isUltimate ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const angle = -0.65 + (i - 1) * 0.48 + (Math.random() - 0.5) * 0.2;
        this.slashes.push({
          x: targetX,
          y: targetY,
          angle,
          length: isUltimate ? 230 : 165,
          color: i === 1 && isUltimate ? "#ffd60a" : color,
          life: 1.0,
          decay: isUltimate ? 0.045 : 0.065,
          thickness: isUltimate ? 11 : 7,
        });
      }
      this.spawnExplosion(targetX, targetY, color, isUltimate ? 44 : 24);
    }

    triggerLightningBolt(x1, y1, x2, y2, color = "#00f3ff") {
      const points = [{ x: x1, y: y1 }];
      const steps = 8;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        points.push({
          x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 45,
          y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 45,
        });
      }
      points.push({ x: x2, y: y2 });
      this.lightningBolts.push({
        points,
        color,
        life: 1.0,
      });
    }

    spawnExplosion(x, y, color = "#00f3ff", count = 24) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8.5;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.2 + Math.random() * 4.2,
          color: i % 4 === 0 ? "#ffffff" : color,
          life: 1.0,
          decay: 0.024 + Math.random() * 0.025,
        });
      }
    }

    spawnFloatingText(text, x, y, color = "#00f3ff", scale = 1) {
      this.floatingTexts.push({
        text,
        x,
        y,
        vy: -1.8,
        color,
        scale,
        life: 1.0,
      });
    }

    loop() {
      if (!this.running) return;
      if (this.ctx && this.canvas) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        // 1. Render Ambient Shadow/Cyan Embers
        for (const d of this.ambientDust) {
          d.x += d.vx;
          d.y += d.vy;
          if (d.y < -10) {
            d.y = h + 10;
            d.x = Math.random() * w;
          }
          this.ctx.save();
          this.ctx.globalAlpha = d.alpha;
          this.ctx.fillStyle = d.color;
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = d.color;
          this.ctx.beginPath();
          this.ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }

        // 2. Render Lightning Bolts
        for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
          const bolt = this.lightningBolts[i];
          bolt.life -= 0.08;
          if (bolt.life <= 0) {
            this.lightningBolts.splice(i, 1);
            continue;
          }
          this.ctx.save();
          this.ctx.globalAlpha = bolt.life;
          this.ctx.strokeStyle = bolt.color;
          this.ctx.lineWidth = 3.5 * bolt.life;
          this.ctx.shadowBlur = 18;
          this.ctx.shadowColor = bolt.color;
          this.ctx.beginPath();
          bolt.points.forEach((pt, idx) => {
            if (idx === 0) this.ctx.moveTo(pt.x, pt.y);
            else this.ctx.lineTo(pt.x, pt.y);
          });
          this.ctx.stroke();
          this.ctx.restore();
        }

        // 3. Render Katana Slash Arcs
        for (let i = this.slashes.length - 1; i >= 0; i--) {
          const s = this.slashes[i];
          s.life -= s.decay;
          if (s.life <= 0) {
            this.slashes.splice(i, 1);
            continue;
          }
          this.ctx.save();
          this.ctx.translate(s.x, s.y);
          this.ctx.rotate(s.angle);
          this.ctx.globalAlpha = s.life;
          this.ctx.strokeStyle = s.color;
          this.ctx.lineWidth = s.thickness * s.life;
          this.ctx.shadowBlur = 24;
          this.ctx.shadowColor = s.color;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, s.length * 0.55, -0.85, 0.85);
          this.ctx.stroke();

          // White hot inner core
          this.ctx.strokeStyle = "#ffffff";
          this.ctx.lineWidth = Math.max(1.5, s.thickness * 0.4 * s.life);
          this.ctx.beginPath();
          this.ctx.arc(0, 0, s.length * 0.55, -0.7, 0.7);
          this.ctx.stroke();
          this.ctx.restore();
        }

        // 4. Render Burst Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.life -= p.decay;
          if (p.life <= 0) {
            this.particles.splice(i, 1);
            continue;
          }
          this.ctx.save();
          this.ctx.globalAlpha = p.life;
          this.ctx.fillStyle = p.color;
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = p.color;
          this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          this.ctx.restore();
        }

        // 5. Render Floating Kinetic Combat Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
          const ft = this.floatingTexts[i];
          ft.y += ft.vy;
          ft.life -= 0.022;
          if (ft.life <= 0) {
            this.floatingTexts.splice(i, 1);
            continue;
          }
          this.ctx.save();
          this.ctx.globalAlpha = Math.min(1, ft.life * 1.4);
          this.ctx.font = `900 ${Math.round(18 * ft.scale)}px "Segoe UI", Impact, sans-serif`;
          this.ctx.fillStyle = ft.color;
          this.ctx.shadowBlur = 14;
          this.ctx.shadowColor = "#000000";
          this.ctx.textAlign = "center";
          this.ctx.fillText(ft.text, ft.x, ft.y);
          this.ctx.restore();
        }
      }

      requestAnimationFrame(() => this.loop());
    }
  }

  window.PyQuestAudio = new OfflineAudioSynth();
  window.PyQuestVFX = new BattleVFXEngine();
})();
