(() => {
  const root = document.querySelector('.experience');
  const scenes = Array.from(document.querySelectorAll('.scene'));
  if (!root || !scenes.length) return;

  const chapterStarts = [0, 2, 4, 9, 13, 18, 21];
  const chapterRanges = [[0, 1], [2, 3], [4, 8], [9, 12], [13, 17], [18, 20], [21, 21]];
  const chapterButtons = Array.from(document.querySelectorAll('.chapter-nav button'));
  const sceneCounter = document.querySelector('.scene-counter strong');
  const progress = document.querySelector('.progress-track i');
  const mobileControls = document.querySelector('.mobile-scene-controls');
  const mobileButtons = mobileControls ? Array.from(mobileControls.querySelectorAll('button')) : [];
  const mobileCounter = mobileControls?.querySelector('span');
  let currentScene = 0;
  let ticking = false;

  const scrollToScene = (index) => {
    const safeIndex = Math.max(0, Math.min(scenes.length - 1, index));
    scenes[safeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updateUi = () => {
    scenes.forEach((scene, index) => scene.classList.toggle('is-visible', index === currentScene));
    chapterButtons.forEach((button, index) => {
      const range = chapterRanges[index];
      button.classList.toggle('is-active', Boolean(range && currentScene >= range[0] && currentScene <= range[1]));
    });
    if (sceneCounter) sceneCounter.textContent = String(currentScene + 1).padStart(2, '0');
    if (progress) progress.style.height = `${((currentScene + 1) / scenes.length) * 100}%`;
    if (mobileCounter) mobileCounter.textContent = `${String(currentScene + 1).padStart(2, '0')} / ${scenes.length}`;
    if (mobileButtons[0]) mobileButtons[0].disabled = currentScene === 0;
    if (mobileButtons[1]) mobileButtons[1].disabled = currentScene === scenes.length - 1;
  };

  const findCurrentScene = () => {
    ticking = false;
    const center = window.innerHeight / 2;
    let nearest = 0;
    let distance = Infinity;
    scenes.forEach((scene, index) => {
      const rect = scene.getBoundingClientRect();
      const nextDistance = Math.abs(rect.top + rect.height / 2 - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });
    if (nearest !== currentScene) {
      currentScene = nearest;
      updateUi();
    }
  };

  const scheduleSceneUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(findCurrentScene);
  };

  chapterButtons.forEach((button, index) => button.addEventListener('click', () => scrollToScene(chapterStarts[index] ?? 0)));
  mobileButtons[0]?.addEventListener('click', () => scrollToScene(currentScene - 1));
  mobileButtons[1]?.addEventListener('click', () => scrollToScene(currentScene + 1));
  document.querySelector('.scroll-cue')?.addEventListener('click', () => scrollToScene(1));

  root.addEventListener('scroll', scheduleSceneUpdate, { passive: true });
  window.addEventListener('scroll', scheduleSceneUpdate, { passive: true });
  window.addEventListener('resize', scheduleSceneUpdate);
  window.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowDown' || event.key === 'PageDown' ? 1 : -1;
    scrollToScene(currentScene + direction);
  });

  root.addEventListener('pointermove', (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    root.style.setProperty('--pointer-x', String(x));
    root.style.setProperty('--pointer-y', String(y));
  }, { passive: true });

  const stageLabels = ['Весь маршрут', 'Переправа на Яву', 'Север Бали', 'Убуд', 'Нуса-Пенида'];
  const routeFrame = document.querySelector('.route-photo-stage');
  const stageControl = document.querySelector('.map-stage-control');
  const stageNumber = stageControl?.querySelector('span');
  const stageLabel = stageControl?.querySelector('strong');
  const stageButtons = stageControl ? Array.from(stageControl.querySelectorAll('button')) : [];
  let routeStage = 0;

  const setRouteStage = (next) => {
    routeStage = (next + stageLabels.length) % stageLabels.length;
    if (routeFrame) {
      for (let i = 0; i < stageLabels.length; i += 1) routeFrame.classList.remove(`route-photo-stage-${i}`);
      routeFrame.classList.add(`route-photo-stage-${routeStage}`);
    }
    if (stageNumber) stageNumber.textContent = String(routeStage + 1).padStart(2, '0');
    if (stageLabel) stageLabel.textContent = stageLabels[routeStage];
  };

  stageButtons[0]?.addEventListener('click', () => setRouteStage(routeStage - 1));
  stageButtons[1]?.addEventListener('click', () => setRouteStage(routeStage + 1));
  window.setInterval(() => setRouteStage(routeStage + 1), 3300);

  document.querySelectorAll('canvas.atmosphere').forEach((canvas) => {
    const context = canvas.getContext('2d');
    if (!context) return;
    const particles = Array.from({ length: 42 }, (_, index) => ({
      x: (index * 83) % 997,
      y: (index * 137) % 811,
      radius: 0.7 + (index % 4) * 0.45,
      speed: 0.08 + (index % 6) * 0.018,
      phase: index * 0.61,
    }));
    let width = 0;
    let height = 0;
    let frame = 0;
    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const time = performance.now() / 1000;
      particles.forEach((particle) => {
        const x = particle.x / 997 * width;
        const y = (particle.y / 811 * height - time * particle.speed * 40 + height) % height;
        const opacity = 0.12 + Math.sin(time + particle.phase) * 0.08;
        context.beginPath();
        context.fillStyle = `rgba(226, 244, 238, ${opacity})`;
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('pagehide', () => cancelAnimationFrame(frame), { once: true });
  });

  updateUi();
  setRouteStage(0);
})();
