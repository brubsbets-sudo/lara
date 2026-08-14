/* ============================================================
   ÚLTIMA ROMÂNTICA — script.js
   ============================================================

   PROTEÇÃO POR SENHA (opcional, bem simples) — DESATIVADA por padrão.
   Se quiser uma barreira leve antes do site abrir, descomente o bloco
   abaixo. IMPORTANTE: isso NÃO é segurança de verdade — qualquer
   pessoa com um mínimo de conhecimento técnico consegue ver o código
   e burlar isso facilmente. Para proteção de verdade, configure senha
   direto no painel do Netlify/Vercel (Site Protection / Password
   Protection), que fica no nível do servidor.

   (function simplePasswordGate() {
     var senhaCorreta = "coloque-a-senha-aqui";
     var tentativa = window.prompt("Senha do programa:");
     if (tentativa !== senhaCorreta) {
       document.body.innerHTML = "";
       document.title = "página não encontrada";
     }
   })();
*/

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================
     OVERLAY DE ABERTURA — "sintonizando"
  ========================================================== */
  const tuningOverlay = document.getElementById('tuning-overlay');
  const staticCanvas = document.getElementById('static-canvas');
  const skipBtn = document.getElementById('skip-tuning');
  const siteContent = document.getElementById('site-content');
  const tuningFreq = document.getElementById('tuning-freq');

  const ctx = staticCanvas.getContext('2d');
  let staticAnimationId = null;

  function resizeCanvas() {
    staticCanvas.width = window.innerWidth;
    staticCanvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function drawStaticFrame() {
    const w = staticCanvas.width;
    const h = staticCanvas.height;
    const imageData = ctx.createImageData(w, h);
    const buffer = imageData.data;
    for (let i = 0; i < buffer.length; i += 4) {
      const shade = Math.random() * 255;
      buffer[i] = shade;
      buffer[i + 1] = shade;
      buffer[i + 2] = shade;
      buffer[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    staticAnimationId = requestAnimationFrame(drawStaticFrame);
  }
  drawStaticFrame();

  // Pequeno "sobe e desce" na frequência, tipo sintonizando de fato
  const frequencies = ['87.5 FM', '92.1 FM', '95.4 FM', '98.7 FM'];
  let freqIndex = 0;
  const freqInterval = setInterval(() => {
    freqIndex = (freqIndex + 1) % frequencies.length;
    tuningFreq.textContent = frequencies[freqIndex];
  }, 180);

  // Ruído sonoro curto, gerado via Web Audio API (sem depender de arquivo externo)
  function playStaticBurst() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const duration = 0.9;
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = buffer;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.22, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

      noiseSource.connect(gainNode).connect(audioCtx.destination);
      noiseSource.start();
      noiseSource.stop(audioCtx.currentTime + duration);
    } catch (err) {
      // Autoplay de áudio pode ser bloqueado pelo navegador sem interação do usuário — tudo bem, o efeito visual continua.
    }
  }
  playStaticBurst();

  function endTuning() {
    clearInterval(freqInterval);
    cancelAnimationFrame(staticAnimationId);
    tuningOverlay.classList.add('hidden');
    siteContent.removeAttribute('aria-hidden');
    siteContent.classList.add('revealed');
    startTypewriter();
  }

  const TUNING_DURATION_MS = 1600;
  const tuningTimer = setTimeout(endTuning, TUNING_DURATION_MS);

  skipBtn.addEventListener('click', () => {
    clearTimeout(tuningTimer);
    endTuning();
  });

  /* ==========================================================
     HERO — efeito typewriter no título
  ========================================================== */
  const typewriterEl = document.getElementById('typewriter');
  const FULL_TITLE = 'Última Romântica';
  let typewriterStarted = false;

  function startTypewriter() {
    if (typewriterStarted) return;
    typewriterStarted = true;
    let i = 0;
    const speed = 90;
    (function typeNext() {
      if (i <= FULL_TITLE.length) {
        typewriterEl.textContent = FULL_TITLE.slice(0, i);
        i++;
        setTimeout(typeNext, speed);
      }
    })();
  }

  /* ==========================================================
     WALKMAN — player de áudio
  ========================================================== */
  const audio = document.getElementById('audio-player');
  const btnPlay = document.getElementById('btn-play');
  const btnBack = document.getElementById('btn-back');
  const btnForward = document.getElementById('btn-forward');
  const reelLeft = document.getElementById('reel-left');
  const reelRight = document.getElementById('reel-right');
  const tapeCounter = document.getElementById('tape-counter');
  const seekBar = document.getElementById('seek-bar');
  const timeCurrent = document.getElementById('time-current');
  const timeDuration = document.getElementById('time-duration');
  const vuBars = document.querySelectorAll('.vu-bar');
  const volumeKnob = document.getElementById('volume-knob');
  const knobFace = volumeKnob.querySelector('.knob-face');

  const SEEK_STEP = 15; // segundos
  const REEL_DEG_PER_SEC = 90; // velocidade de giro das bobinas (graus/seg)

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function togglePlay() {
    if (audio.paused) {
      audio.play().catch(() => { /* precisa de interação do usuário em alguns navegadores */ });
    } else {
      audio.pause();
    }
  }

  btnPlay.addEventListener('click', togglePlay);
  btnBack.addEventListener('click', () => {
    audio.currentTime = Math.max(0, audio.currentTime - SEEK_STEP);
  });
  btnForward.addEventListener('click', () => {
    audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + SEEK_STEP);
  });

  audio.addEventListener('play', () => {
    btnPlay.classList.add('is-playing');
    startVuMeter();
    startReelSpin();
  });

  audio.addEventListener('pause', () => {
    btnPlay.classList.remove('is-playing');
    stopVuMeter();
    stopReelSpin();
  });

  function updateDuration() {
    seekBar.max = audio.duration || 0;
    timeDuration.textContent = formatTime(audio.duration);
  }

  // se os metadados já estiverem prontos (áudio carregou rápido, antes deste
  // script rodar), o evento "loadedmetadata" já disparou e nunca mais dispara —
  // por isso checamos o estado atual também, e não só o evento.
  if (audio.readyState >= 1) {
    updateDuration();
  }
  audio.addEventListener('loadedmetadata', updateDuration);

  audio.addEventListener('timeupdate', () => {
    seekBar.value = audio.currentTime;
    timeCurrent.textContent = formatTime(audio.currentTime);

    // contador de fita tipo odômetro, sobe conforme o áudio avança
    const counterValue = Math.floor(audio.currentTime * 10) % 10000;
    tapeCounter.textContent = counterValue.toString().padStart(4, '0');

    // se o áudio estiver pausado (ex: acabou de dar seek), garante que a
    // posição das bobinas reflita o novo currentTime mesmo sem o loop rodando
    if (audio.paused) applyReelRotation();
  });

  /*
    Bobinas giram em sincronia real com o currentTime do áudio, mas via
    requestAnimationFrame — o evento "timeupdate" só dispara poucas vezes
    por segundo e deixaria o giro visivelmente picotado.
  */
  let reelAnimationId = null;

  function applyReelRotation() {
    const rotation = audio.currentTime * REEL_DEG_PER_SEC;
    reelLeft.style.transform = `rotate(${rotation}deg)`;
    reelRight.style.transform = `rotate(${rotation}deg)`;
  }

  function reelLoop() {
    applyReelRotation();
    reelAnimationId = requestAnimationFrame(reelLoop);
  }

  function startReelSpin() {
    if (reelAnimationId) return;
    reelLoop();
  }

  function stopReelSpin() {
    if (reelAnimationId) {
      cancelAnimationFrame(reelAnimationId);
      reelAnimationId = null;
    }
    applyReelRotation();
  }

  seekBar.addEventListener('input', () => {
    audio.currentTime = Number(seekBar.value);
  });

  /* VU meter — animação simulada (não usa análise real do áudio) */
  let vuIntervalId = null;
  function startVuMeter() {
    stopVuMeter();
    vuIntervalId = setInterval(() => {
      vuBars.forEach((bar) => {
        const h = 15 + Math.random() * 85;
        bar.style.height = `${h}%`;
      });
    }, 110);
  }
  function stopVuMeter() {
    if (vuIntervalId) {
      clearInterval(vuIntervalId);
      vuIntervalId = null;
    }
    vuBars.forEach((bar) => { bar.style.height = '10%'; });
  }

  /* Rodinha de volume giratória */
  const KNOB_MIN_DEG = -135;
  const KNOB_MAX_DEG = 135;
  let knobDragging = false;

  function angleFromEvent(clientX, clientY) {
    const rect = volumeKnob.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // 0deg aponta pra cima
    if (deg > 180) deg -= 360;
    if (deg < -180) deg += 360;
    return deg;
  }

  function setVolumeFromAngle(deg) {
    const clamped = Math.max(KNOB_MIN_DEG, Math.min(KNOB_MAX_DEG, deg));
    const ratio = (clamped - KNOB_MIN_DEG) / (KNOB_MAX_DEG - KNOB_MIN_DEG);
    audio.volume = ratio;
    knobFace.style.transform = `rotate(${clamped}deg)`;
    volumeKnob.setAttribute('aria-valuenow', Math.round(ratio * 100));
  }

  function handleKnobPointer(e) {
    if (!knobDragging) return;
    const point = e.touches ? e.touches[0] : e;
    const deg = angleFromEvent(point.clientX, point.clientY);
    setVolumeFromAngle(deg);
  }

  volumeKnob.addEventListener('pointerdown', (e) => {
    knobDragging = true;
    volumeKnob.setPointerCapture(e.pointerId);
    handleKnobPointer(e);
  });
  volumeKnob.addEventListener('pointermove', handleKnobPointer);
  volumeKnob.addEventListener('pointerup', () => { knobDragging = false; });
  volumeKnob.addEventListener('pointercancel', () => { knobDragging = false; });

  // acessibilidade: setas do teclado ajustam o volume
  volumeKnob.addEventListener('keydown', (e) => {
    const current = parseFloat(volumeKnob.getAttribute('aria-valuenow')) || 0;
    let next = current;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = Math.min(100, current + 5);
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = Math.max(0, current - 5);
    if (next !== current) {
      const deg = KNOB_MIN_DEG + (next / 100) * (KNOB_MAX_DEG - KNOB_MIN_DEG);
      setVolumeFromAngle(deg);
    }
  });

  // volume inicial (70%), coerente com a rotação definida no CSS
  setVolumeFromAngle(KNOB_MIN_DEG + 0.7 * (KNOB_MAX_DEG - KNOB_MIN_DEG));

  /* ==========================================================
     LINER NOTES — acordeão
  ========================================================== */
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const panel = header.nextElementSibling;
      const isOpen = header.getAttribute('aria-expanded') === 'true';

      header.setAttribute('aria-expanded', String(!isOpen));
      if (isOpen) {
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });

});
