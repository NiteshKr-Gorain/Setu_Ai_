import React, { useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * 60 FPS HTML5 Canvas Video Avatar Engine - Distinguished Punjabi Sardar Elder
 * Features:
 * - Authentic Punjabi Pugg (Crisp layered Dastar / Pagri with sharp front Nok / Ladd folds)
 * - Stylized Punjabi Kundi Mustache with upturned tips and neatly set short silver beard
 * - Traditional Punjabi Kurta with tailored Sadri (Nehru vest) and gold buttons
 * - Warm, proud, expressive eyes with subtle laugh lines and elder wisdom
 * - Restrained, natural 60 FPS Web Audio API lip-sync without exaggerated bouncing
 * - Calm breathing motion and smooth eye-level gaze tracking
 */
export default function AvatarCanvas({
  persona,
  state = 'idle', // 'idle' | 'listening' | 'thinking' | 'speaking'
  audioLevel = 0,
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  currentViseme = null,
  themeColor = '#ea580c'
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const blinkStateRef = useRef({ nextBlinkTime: Date.now() + 3000, isBlinking: false, blinkProgress: 0 });
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Interactive mouse tracking for calm gaze
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      mousePosRef.current.targetX = Math.max(-1, Math.min(1, relX));
      mousePosRef.current.targetY = Math.max(-1, Math.min(1, relY));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let startTime = Date.now();

    // High DPI scaling (350px width x 500px height) capped at 2 for performance
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = 350;
    const height = 500;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      // Smooth, Calm Gaze Movement
      const mouse = mousePosRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      const gazeX = mouse.x * 1.8;
      const gazeY = mouse.y * 1.2;

      // Soft Natural Blinking
      const blink = blinkStateRef.current;
      if (now > blink.nextBlinkTime && !blink.isBlinking) {
        blink.isBlinking = true;
        blink.blinkProgress = 0;
      }
      if (blink.isBlinking) {
        blink.blinkProgress += 0.20;
        if (blink.blinkProgress >= 1) {
          blink.isBlinking = false;
          blink.blinkProgress = 0;
          blink.nextBlinkTime = now + 3000 + Math.random() * 3000;
        }
      }
      const eyeOpenAmount = blink.isBlinking
        ? Math.abs(Math.sin(blink.blinkProgress * Math.PI - Math.PI / 2))
        : 1.0;

      // Completely anchored, stable portrait without any bouncing/shaking during speech
      const headOffset = 0;

      // -------------------------------------------------------------
      // 1. NEUTRAL WARM STUDIO BACKGROUND & CALM AMBIENCE
      // -------------------------------------------------------------
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2 - 20, 20, width / 2, height / 2, 240);
      bgGrad.addColorStop(0, '#1c1410');
      bgGrad.addColorStop(0.55, '#120d0a');
      bgGrad.addColorStop(1, '#080504');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Warm Golden Backlight Glow
      const haloGrad = ctx.createRadialGradient(width / 2, 190, 30, width / 2, 190, 170);
      haloGrad.addColorStop(0, 'rgba(234, 88, 12, 0.16)');
      haloGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.04)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = 230 + headOffset;
      const characterScale = 1.22;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(characterScale, characterScale);

      // -------------------------------------------------------------
      // 2. TRADITIONAL PUNJABI ATTIRE (KURTA & TAILORED SADRI VEST)
      // -------------------------------------------------------------
      // Tailored Royal Dark Sadri / Waistcoat
      const sadriGrad = ctx.createLinearGradient(0, 95, 0, 230);
      sadriGrad.addColorStop(0, '#1e293b'); // Deep Royal Navy / Charcoal
      sadriGrad.addColorStop(0.6, '#0f172a');
      sadriGrad.addColorStop(1, '#020617');
      ctx.fillStyle = sadriGrad;

      ctx.beginPath();
      ctx.ellipse(0, 185, 138, 92, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sadri Vest Lapels & Front Opening
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-75, 230);
      ctx.lineTo(-22, 110);
      ctx.lineTo(0, 135);
      ctx.lineTo(22, 110);
      ctx.lineTo(75, 230);
      ctx.stroke();

      // Inner Crisp Punjabi Kurta (Ivory / Saffron Tint)
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.moveTo(-22, 110);
      ctx.lineTo(0, 135);
      ctx.lineTo(22, 110);
      ctx.lineTo(18, 80);
      ctx.lineTo(-18, 80);
      ctx.closePath();
      ctx.fill();

      // Kurta Mandarin Collar Band
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-18, 80);
      ctx.quadraticCurveTo(0, 92, 18, 80);
      ctx.stroke();

      // Sadri Brass / Gold Buttons
      for (let b = 0; b < 3; b++) {
        const btnY = 145 + b * 22;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, btnY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // Saffron Silk Pocket Square (Jeb Da Rumaal)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-42, 155);
      ctx.lineTo(-28, 155);
      ctx.lineTo(-35, 146);
      ctx.closePath();
      ctx.fill();

      // -------------------------------------------------------------
      // 3. NECK & JAW SHADOW
      // -------------------------------------------------------------
      const neckGrad = ctx.createLinearGradient(-20, 45, 20, 95);
      neckGrad.addColorStop(0, '#e2ab88');
      neckGrad.addColorStop(1, '#c88f6b');
      ctx.fillStyle = neckGrad;

      ctx.beginPath();
      ctx.moveTo(-20, 50);
      ctx.lineTo(-24, 95);
      ctx.lineTo(24, 95);
      ctx.lineTo(20, 50);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(120, 53, 15, 0.22)';
      ctx.beginPath();
      ctx.moveTo(-20, 52);
      ctx.quadraticCurveTo(0, 72, 20, 52);
      ctx.lineTo(0, 85);
      ctx.closePath();
      ctx.fill();

      // -------------------------------------------------------------
      // 4. PUNJABI ELDER SARDAR HEAD & WARM SKIN TONE
      // -------------------------------------------------------------
      const faceGrad = ctx.createRadialGradient(gazeX, gazeY - 10, 15, 0, 0, 75);
      faceGrad.addColorStop(0, '#fcd4b8');
      faceGrad.addColorStop(0.65, '#efa57c');
      faceGrad.addColorStop(1, '#d6855b');
      ctx.fillStyle = faceGrad;

      ctx.beginPath();
      ctx.moveTo(-50, -20);
      ctx.bezierCurveTo(-52, 28, -36, 68, 0, 78);
      ctx.bezierCurveTo(36, 68, 52, 28, 50, -20);
      ctx.bezierCurveTo(48, -55, -48, -55, -50, -20);
      ctx.closePath();
      ctx.fill();

      // Warm Cheeks & Elder Glow
      ctx.fillStyle = 'rgba(234, 88, 12, 0.12)';
      ctx.beginPath();
      ctx.ellipse(-28, 16, 13, 7, 0.1, 0, Math.PI * 2);
      ctx.ellipse(28, 16, 13, 7, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Forehead Wisdom Lines
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.30)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-20, -32);
      ctx.quadraticCurveTo(0, -36, 20, -32);
      ctx.moveTo(-15, -40);
      ctx.quadraticCurveTo(0, -43, 15, -40);
      ctx.stroke();

      // -------------------------------------------------------------
      // 5. EARS
      // -------------------------------------------------------------
      ctx.fillStyle = '#efa57c';
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
      ctx.lineWidth = 1.3;

      ctx.beginPath();
      ctx.ellipse(-50, 4, 8, 16, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(50, 4, 8, 16, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // -------------------------------------------------------------
      // 6. PROUD, WARM EXPRESSIVE EYES & SHARP SARDAR BROWS
      // -------------------------------------------------------------
      const drawPunjabiEye = (dir) => {
        const eyeX = dir * 21;
        const eyeY = -6;
        ctx.save();
        ctx.translate(eyeX, eyeY);

        ctx.fillStyle = 'rgba(120, 53, 15, 0.14)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 6 * eyeOpenAmount, 0, 0, Math.PI * 2);
        ctx.fill();

        if (eyeOpenAmount > 0.2) {
          const curGazeX = Math.max(-3, Math.min(3, gazeX * 0.7));
          const curGazeY = Math.max(-2, Math.min(2, gazeY * 0.7));

          // Warm Deep Hazel-Amber Iris
          const irisGrad = ctx.createRadialGradient(curGazeX, curGazeY, 1, curGazeX, curGazeY, 5);
          irisGrad.addColorStop(0, '#d97706');
          irisGrad.addColorStop(0.6, '#92400e');
          irisGrad.addColorStop(1, '#451a03');
          ctx.fillStyle = irisGrad;

          ctx.beginPath();
          ctx.arc(curGazeX, curGazeY, 4.8 * eyeOpenAmount, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f0a06';
          ctx.beginPath();
          ctx.arc(curGazeX, curGazeY, 2.2 * eyeOpenAmount, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(curGazeX - 1.5, curGazeY - 1.5, 1.2 * eyeOpenAmount, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.strokeStyle = '#1e1410';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(-13, 0);
        ctx.quadraticCurveTo(0, -6 * eyeOpenAmount, 13, 0);
        ctx.stroke();

        // Warm Laugh Crinkles
        ctx.strokeStyle = 'rgba(120, 53, 15, 0.35)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(dir * 12, -1);
        ctx.lineTo(dir * 17, -3);
        ctx.moveTo(dir * 12, 2);
        ctx.lineTo(dir * 16, 4);
        ctx.stroke();

        ctx.restore();
      };

      drawPunjabiEye(-1);
      drawPunjabiEye(1);

      // Sharp, Masculine Eyebrows (Salt & Pepper / Silver-Dark)
      const drawPunjabiEyebrow = (side) => {
        const browX = side * 22;
        const browY = -18 + (isThinking ? -2.5 : 0);
        ctx.save();
        ctx.translate(browX, browY);

        ctx.fillStyle = '#27272a';
        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 1.1;

        ctx.beginPath();
        if (side === -1) {
          ctx.moveTo(12, 2);
          ctx.lineTo(-6, -4);
          ctx.lineTo(-18, 0);
          ctx.lineTo(-14, 4);
          ctx.lineTo(8, 4);
        } else {
          ctx.moveTo(-12, 2);
          ctx.lineTo(6, -4);
          ctx.lineTo(18, 0);
          ctx.lineTo(14, 4);
          ctx.lineTo(-8, 4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      };

      drawPunjabiEyebrow(-1);
      drawPunjabiEyebrow(1);

      // -------------------------------------------------------------
      // 7. NOSE
      // -------------------------------------------------------------
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(-2, 14);
      ctx.lineTo(4, 16);
      ctx.stroke();

      ctx.fillStyle = 'rgba(180, 83, 9, 0.15)';
      ctx.beginPath();
      ctx.ellipse(1, 16, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // -------------------------------------------------------------
      // 8. NEATLY GROOMED PUNJABI SHORT BEARD (THAATHI / SET BEARD)
      // -------------------------------------------------------------
      const beardGrad = ctx.createLinearGradient(0, 25, 0, 85);
      beardGrad.addColorStop(0, '#ffffff');
      beardGrad.addColorStop(0.65, '#f1f5f9');
      beardGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = beardGrad;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.3;

      // Crisp Shaped Beard hugging the jawline
      ctx.beginPath();
      ctx.moveTo(-46, 10);
      ctx.quadraticCurveTo(-48, 46, -22, 72);
      ctx.quadraticCurveTo(0, 78, 22, 72);
      ctx.quadraticCurveTo(48, 46, 46, 10);
      ctx.quadraticCurveTo(34, 28, 0, 34);
      ctx.quadraticCurveTo(-34, 28, -46, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fine Beard Hair Strands
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-18, 44);
      ctx.quadraticCurveTo(-10, 64, 0, 74);
      ctx.moveTo(18, 44);
      ctx.quadraticCurveTo(10, 64, 0, 74);
      ctx.moveTo(0, 38);
      ctx.lineTo(0, 72);
      ctx.stroke();

      // -------------------------------------------------------------
      // 9. PROUD PUNJABI KUNDI MUSTACHE (UPTURNED SHARP TIPS)
      // -------------------------------------------------------------
      const mustacheGrad = ctx.createLinearGradient(0, 16, 0, 34);
      mustacheGrad.addColorStop(0, '#ffffff');
      mustacheGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = mustacheGrad;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;

      // Left Mustache with Proud Upturned Tip
      ctx.beginPath();
      ctx.moveTo(-1, 20);
      ctx.quadraticCurveTo(-18, 18, -32, 26);
      ctx.quadraticCurveTo(-42, 18, -44, 12); // Upturned sharp tip
      ctx.quadraticCurveTo(-38, 26, -24, 28);
      ctx.quadraticCurveTo(-12, 28, -1, 25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Mustache with Proud Upturned Tip
      ctx.beginPath();
      ctx.moveTo(1, 20);
      ctx.quadraticCurveTo(18, 18, 32, 26);
      ctx.quadraticCurveTo(42, 18, 44, 12); // Upturned sharp tip
      ctx.quadraticCurveTo(38, 26, 24, 28);
      ctx.quadraticCurveTo(12, 28, 1, 25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // -------------------------------------------------------------
      // 10. RESTRAINED, NATURAL 60FPS LIP-SYNC (CALM SPEECH)
      // -------------------------------------------------------------
      const mouthY = 32;
      const audioScale = Math.min(1.0, Math.max(0, audioLevel));
      const isMouthOpen = isSpeaking && audioScale > 0.04;

      ctx.save();
      ctx.translate(0, mouthY);

      if (isMouthOpen) {
        const openW = 10 + audioScale * 3.5;
        const openH = 2.5 + audioScale * 5.0;

        ctx.fillStyle = '#3f121d';
        ctx.beginPath();
        ctx.ellipse(0, 0, openW, openH, 0, 0, Math.PI * 2);
        ctx.fill();

        if (openH > 3) {
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.rect(-openW * 0.7, -openH, openW * 1.4, openH * 0.45);
          ctx.fill();
        }

        if (openH > 4.5) {
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(0, openH * 0.35, openW * 0.55, 0, Math.PI);
          ctx.fill();
        }

        ctx.strokeStyle = '#27201c';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, openW, openH, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-8, -1);
        ctx.quadraticCurveTo(0, 3.5, 8, -1);
        ctx.stroke();

        ctx.fillStyle = 'rgba(120, 53, 15, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 5.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 11. AUTHENTIC CRISP PUNJABI PUGG (DASTAR WITH SHARP LADD FOLDS)
      // -------------------------------------------------------------
      // Base Pugg Silhouette (Rich Saffron / Kesari Royal Silk)
      const puggGrad = ctx.createLinearGradient(0, -100, 0, -25);
      puggGrad.addColorStop(0, '#f97316'); // Bright Kesari Saffron
      puggGrad.addColorStop(0.5, '#ea580c');
      puggGrad.addColorStop(1, '#c2410c');
      ctx.fillStyle = puggGrad;
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 2.0;

      // Authentic Punjabi Pugg Contour with High Crown & Ear Wrap
      ctx.beginPath();
      ctx.moveTo(-56, -18);
      // Left side curve to high crown peak
      ctx.bezierCurveTo(-64, -65, -35, -96, -6, -100);
      // Right side high slope to ear
      ctx.bezierCurveTo(25, -96, 62, -65, 56, -18);
      // Forehead sharp V-Nok line
      ctx.bezierCurveTo(36, -42, 12, -48, 0, -42);
      ctx.bezierCurveTo(-12, -48, -36, -42, -56, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crisp Diagonal Ladd Pleats (Layered Punjabi Wrap)
      const drawLadd = (x1, y1, cx, cy, x2, y2, color, goldShine = false) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = goldShine ? 2.6 : 2.0;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();

        if (goldShine) {
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(x1, y1 - 1.2);
          ctx.quadraticCurveTo(cx, cy - 1.2, x2, y2 - 1.2);
          ctx.stroke();
        }
      };

      // Right-side Multi-Ladd (Crisp 5-Fold Punjabi Dastar Layers)
      drawLadd(-52, -28, -6, -55, 48, -70, '#fb923c', true);
      drawLadd(-46, -42, -2, -66, 42, -80, '#f97316');
      drawLadd(-40, -56, 2, -76, 36, -88, '#fb923c', true);
      drawLadd(-34, -68, 6, -84, 28, -94, '#f97316');
      drawLadd(-24, -80, 8, -90, 18, -98, '#fb923c', true);

      // Left-side Wrap & Central Poni Cross-Over
      drawLadd(52, -28, 6, -55, -48, -70, '#c2410c');
      drawLadd(46, -42, 2, -66, -42, -80, '#ea580c', true);

      // Central Sharp V-Nok (The iconic Punjabi Pugg Center Point)
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-40, -26);
      ctx.quadraticCurveTo(0, -42, 40, -26);
      ctx.stroke();

      // Regal Khanda / Gold Brooch Center Emblem
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, -52, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Emblem Center Detail
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.arc(0, -52, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, audioLevel, isSpeaking, isListening, isThinking, currentViseme, themeColor]);

  return (
    <div className="relative w-auto h-full max-h-[44dvh] sm:max-h-[49dvh] md:max-h-[53dvh] lg:max-h-[57dvh] aspect-[350/500] shrink-1 rounded-3xl overflow-hidden shadow-2xl border border-amber-500/25 bg-stone-950 flex items-center justify-center group select-none transition-all duration-300">
      {/* 60 FPS HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain select-none"
      />

      {/* Floating State Badge Overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md border border-amber-500/20 text-xs font-semibold shadow-md z-10">
        {isSpeaking ? (
          <>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span className="text-orange-400 font-mono-code">Speaking</span>
          </>
        ) : isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-mono-code">Listening</span>
          </>
        ) : isThinking ? (
          <>
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
            <span className="text-amber-300 font-mono-code">Thinking</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-stone-500" />
            <span className="text-stone-300 font-mono-code">Ready</span>
          </>
        )}
      </div>

      {/* Punjabi Sardar Avatar Badge */}
      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-md border border-amber-500/15 text-[10px] font-bold text-amber-200 uppercase font-mono-code z-10">
        {persona?.name || 'Sardar Genji'}
      </div>
    </div>
  );
}
