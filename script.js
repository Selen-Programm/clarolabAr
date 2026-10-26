    const exhibits = [
      { group: 0, category: 'DESARROLLO', title: 'Ideas que se vuelven software', copy: 'Clarolab crea y mejora productos digitales junto a los equipos que los usan.' },
      { group: 1, category: 'TESTING', title: 'Probar para avanzar', copy: 'Personas y herramientas encuentran errores antes de que lleguen a quienes usan el producto.' },
      { group: 2, category: 'SEGURIDAD', title: 'Cuidar lo que construimos', copy: 'El equipo busca riesgos y ayuda a proteger cada producto desde el código.' },
      { group: 3, category: 'LAB CREATION', title: 'Curiosidad en acción', copy: 'En su laboratorio exploran tecnología y convierten lo aprendido en nuevas soluciones.' },
      { group: 4, category: 'CUSTOMER JOURNEY', title: 'Un equipo que acompaña', copy: 'Clarolab conoce cada producto y crece codo a codo con sus aliados.' }
    ];

    const mindSource = './images/clarolab-museo.mind';
    const activeMarkerCount = 28;
    const activeMarkerName = 'la puerta, la mascota o los paisajes';

    AFRAME.registerComponent('helix-spine', {
      init() {
        const points = [];
        const steps = 240;
        const turns = 2.7;
        const radius = 1.42;
        const height = 5.4;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const angle = t * turns * Math.PI * 2;
          points.push(new THREE.Vector3(Math.cos(angle) * radius, (t - .5) * height, Math.sin(angle) * radius));
        }
        const path = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(path, 360, .012, 7, false);
        const material = new THREE.MeshBasicMaterial({ color: '#00e6a0', transparent: true, opacity: .74 });
        this.el.setObject3D('helix', new THREE.Mesh(geometry, material));
        const data = [...this.el.parentElement.querySelectorAll('.artifact')];
        data.forEach((card, i) => {
          const t = i / (data.length - 1);
          const angle = t * turns * Math.PI * 2 + .5;
          const x = Math.cos(angle) * (radius + .12);
          const y = (t - .5) * height;
          const z = Math.sin(angle) * (radius + .12);
          const faceCenterY = (-angle - Math.PI / 2) * 180 / Math.PI;
          card.setAttribute('position', `${x} ${y} ${z}`);
          card.setAttribute('rotation', `0 ${faceCenterY} 0`);
          card.setAttribute('scale', '.001 .001 .001');
          card.setAttribute('animation__arrive', `property: scale; from: .001 .001 .001; to: 1 1 1; dur: 650; delay: ${180 + i * 130}; easing: easeOutBack`);
        });
        if (!this.el.parentElement.querySelector('.mascot-marker')) {
          [0.13, 0.38, 0.63, 0.88].forEach((t, i) => {
            const angle = t * turns * Math.PI * 2 + .5;
            const x = Math.cos(angle) * (radius + .38);
            const y = (t - .5) * height;
            const z = Math.sin(angle) * (radius + .38);
            const mascot = document.createElement('a-plane');
            mascot.classList.add('mascot-marker');
            mascot.setAttribute('width', '.28');
            mascot.setAttribute('height', '.28');
            mascot.setAttribute('position', `${x} ${y} ${z}`);
            mascot.setAttribute('rotation', `0 ${(-angle - Math.PI / 2) * 180 / Math.PI} 0`);
            mascot.setAttribute('material', `src: ./images/img-utiles/${[2, 5, 8, 11][i]}.png; shader: flat; transparent: true; side: double`);
            mascot.setAttribute('animation__arrive', `property: scale; from: .001 .001 .001; to: 1 1 1; dur: 520; delay: ${500 + i * 180}; easing: easeOutBack`);
            mascot.setAttribute('animation__float', `property: position; to: ${x} ${y + .09} ${z}; dir: alternate; dur: 1900; easing: easeInOutSine; loop: true`);
            this.el.parentElement.appendChild(mascot);
          });
        }
      }
    });

    const scene = document.querySelector('a-scene');
    const rig = document.getElementById('museumRig');
    // Each targn  et has a copy of the spiral, so all copies must follow the same chapter and gesture.
    const museumRigs = [rig];
    const camera = document.getElementById('museumCamera');
    const trackingTarget = document.getElementById('trackingTarget');
    const sceneWrap = document.getElementById('sceneWrap');
    const scannerSection = document.getElementById('recorrido');
    const qrCode = document.getElementById('qrCode');
    const qrHint = document.getElementById('qrHint');
    const arStatus = document.getElementById('arStatus');
    let selected = 0;
    let baseRotation = 0;
    let arActive = false;
    let arStarting = false;
    let arStarted = false;
    let closeRequested = false;
    let activeTargetIndex = 0;
    const trackingAnchors = [];
    let mascotFrame = 6;
    let previewTimer = 0;
    const guideMascot = document.getElementById('guideMascot');

    function selectExhibit(index) {
      selected = (index + exhibits.length) % exhibits.length;
      const exhibit = exhibits[selected];
      document.getElementById('detail-period').textContent = `${String(selected + 1).padStart(2, '0')} / ${exhibit.category}`;
      document.getElementById('detail-year').textContent = 'UN RECORRIDO · CINCO PARADAS';
      document.getElementById('detail-title').textContent = exhibit.title;
      document.getElementById('detail-copy').textContent = exhibit.copy;
      document.getElementById('arChapter').textContent = `${String(selected + 1).padStart(2, '0')} / ${String(exhibits.length).padStart(2, '0')}`;
      const panel = document.querySelector('.detail-card');
      panel.classList.remove('is-changing');
      void panel.offsetWidth;
      panel.classList.add('is-changing');
      document.querySelectorAll('.scene-index span').forEach((item, i) => item.classList.toggle('active', i === exhibit.group));
      museumRigs.forEach((museumRig) => {
        museumRig.querySelectorAll('.artifact').forEach((card, i) => {
          card.setAttribute('animation__focus', `property: scale; to: ${i === exhibit.group ? '1.12 1.12 1.12' : '1 1 1'}; dur: 420; easing: easeOutBack`);
        });
      });
      const theta = (selected / (exhibits.length - 1)) * 2.7 * Math.PI * 2 + .5;
      baseRotation = (-90 - theta * 180 / Math.PI + 360) % 360;
      museumRigs.forEach((museumRig) => {
        const card = museumRig.querySelectorAll('.artifact')[selected];
        const scale = museumRig.object3D.scale.y || 1;
        const cardY = Number(card.getAttribute('position')?.y) || 0;
        museumRig.setAttribute('animation__travel', `property: position; to: 0 ${-cardY * scale} 0; dur: 520; easing: easeInOutCubic`);
        museumRig.setAttribute('animation__turn', `property: rotation; to: 0 ${baseRotation} 0; dur: 520; easing: easeInOutCubic`);
        card.setAttribute('rotation', `0 ${-baseRotation} 0`);
      });
      setMascotFrame(selected);
    }

    function setMascotFrame(index) {
      if (!guideMascot) return;
      mascotFrame = ((index % 12) + 12) % 12 + 1;
      guideMascot.classList.add('is-switching');
      window.setTimeout(() => {
        guideMascot.src = `./images/img-utiles/${mascotFrame}.png`;
        guideMascot.classList.remove('is-switching');
        guideMascot.classList.remove('is-wave');
        void guideMascot.offsetWidth;
        guideMascot.classList.add('is-wave');
      }, 130);
    }

    function prepareDoorAnchors() {
      const baseRig = document.getElementById('museumRig');
      if (!trackingAnchors.length) {
        trackingAnchors.push(trackingTarget);
        for (let i = 1; i < activeMarkerCount; i++) {
          const anchor = document.createElement('a-entity');
          anchor.classList.add('door-target-anchor');
          const rigCopy = baseRig.cloneNode(true);
          [rigCopy, ...rigCopy.querySelectorAll('[id]')].forEach((node) => node.removeAttribute('id'));
          anchor.appendChild(rigCopy);
          museumRigs.push(rigCopy);
          scene.appendChild(anchor);
          trackingAnchors.push(anchor);
        }
        trackingAnchors.forEach((anchor, index) => {
          anchor.addEventListener('targetFound', () => onTargetFound(index));
          anchor.addEventListener('targetLost', () => onTargetLost(index));
        });
      }
      trackingAnchors.forEach((anchor, index) => {
        anchor.setAttribute('mindar-image-target', `targetIndex: ${index}`);
      });
    }

    function clearDoorAnchors() {
      trackingAnchors.slice(1).forEach((anchor) => anchor.remove());
      trackingAnchors.length = 0;
      museumRigs.length = 1;
      trackingTarget.removeAttribute('mindar-image-target');
    }

    function currentAccessUrl() {
      const url = new URL(location.href);
      url.hash = 'recorrido';
      return url.toString();
    }

    function refreshQr() {
      qrCode.replaceChildren();
      const isSecure = location.protocol === 'https:';
      if (!isSecure) {
        qrCode.innerHTML = '<span class="qr-placeholder">HTTPS</span>';
        qrHint.textContent = 'Publicá en HTTPS para generar un QR de acceso que funcione en el teléfono.';
        return;
      }
      if (typeof QRCode === 'undefined') {
        qrCode.innerHTML = '<span class="qr-placeholder">SIN QR</span>';
        qrHint.textContent = 'No se pudo cargar el generador QR.';
        return;
      }
      new QRCode(qrCode, { text: currentAccessUrl(), width: 128, height: 128, colorDark: '#06110d', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
      qrHint.textContent = 'Escaneá para abrir el recorrido completo.';
    }

    async function openAR() {
      if (arActive || arStarting) return;
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        sceneWrap.classList.add('active');
        scannerSection.classList.add('ar-mode');
        document.body.classList.add('ar-session');
        arStatus.textContent = 'El navegador bloquea la cámara en este origen. Abrí la página publicada en HTTPS o desde localhost.';
        return;
      }
      if (!scene.hasLoaded) await new Promise((resolve) => scene.addEventListener('loaded', resolve, { once: true }));
      const source = mindSource;
      sceneWrap.classList.add('active');
      scannerSection.classList.add('ar-mode');
      document.body.classList.add('ar-session');
      arStarting = true;
      closeRequested = false;
      camera.setAttribute('position', '0 0 0');
      rig.setAttribute('scale', '.36 .36 .36');
      window.dispatchEvent(new Event('resize'));
      arStatus.textContent = 'Preparando el recorrido…';
      document.getElementById('startAR').disabled = true;
      try {
        scene.setAttribute('mindar-image', {
          imageTargetSrc: source,
          autoStart: false,
          filterMinCF: 0.00005,
          filterBeta: 0.01,
          warmupTolerance: 5,
          missTolerance: 10,
          maxTrack: 1
        });
        prepareDoorAnchors();
        museumRigs.forEach((museumRig) => museumRig.setAttribute('scale', '.36 .36 .36'));
        selectExhibit(selected);
        scene.addEventListener('arReady', () => {
          arStatus.textContent = 'Cámara lista · acercate a cualquier imagen para ver el recorrido';
        }, { once: true });
        scene.addEventListener('arError', (event) => {
          const reason = event.detail?.error?.message || event.detail?.error || '';
          arStatus.textContent = reason ? `MindAR: ${reason}` : 'No se pudo iniciar la cámara. Revisá permisos y conexión.';
        }, { once: true });
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const arSystem = scene.systems['mindar-image-system'];
        if (!arSystem) throw new Error('No se pudo inicializar MindAR. Revisá la conexión a internet.');
        await arSystem.start();
        arStarted = true;
        arActive = true;
        document.getElementById('closeAR').focus({ preventScroll: true });
        arStatus.textContent = `Cámara activa · acercate a cualquier imagen de ${activeMarkerName}.`;
      } catch (error) {
        console.error('No se pudo iniciar MindAR:', error);
        const message = String(error?.message || error || '');
        if (/permission|denied|notallowed/i.test(message)) {
          arStatus.textContent = 'Permiso de cámara bloqueado. Permitilo en el navegador y volvé a intentar.';
        } else if (/fetch|load|404|network/i.test(message)) {
          arStatus.textContent = 'No se pudo cargar el .mind o MindAR. Revisá conexión, ruta y que la página esté en HTTPS o localhost.';
        } else if (/secure|https|camera/i.test(message)) {
          arStatus.textContent = 'El navegador no habilitó la cámara. Usá HTTPS o localhost y permití el acceso.';
        } else {
          arStatus.textContent = message || 'No se pudo iniciar MindAR. Revisá los permisos de cámara.';
        }
      } finally {
        arStarting = false;
        const userClosedWhileStarting = closeRequested;
        if (userClosedWhileStarting && arStarted) await closeAR();
        if (!arActive) {
          clearDoorAnchors();
          scene.removeAttribute('mindar-image');
          document.getElementById('startAR').disabled = false;
          sceneWrap.classList.toggle('active', !userClosedWhileStarting);
          camera.setAttribute('position', '0 0 6.6');
          museumRigs.forEach((museumRig) => museumRig.setAttribute('scale', '1 1 1'));
          window.dispatchEvent(new Event('resize'));
          closeRequested = false;
        }
      }
    }

    function onTargetFound(index) {
      activeTargetIndex = index;
      arStatus.textContent = 'Recorrido activo · deslizá hacia arriba o abajo para avanzar';
    }

    function onTargetLost(index) {
      if (index === activeTargetIndex) arStatus.textContent = 'La experiencia sigue disponible al acercarte a otra imagen';
    }

    async function closeAR() {
      if (arStarting) {
        closeRequested = true;
        arStatus.textContent = 'Cerrando cámara…';
        return;
      }
      const arSystem = scene.systems['mindar-image-system'];
      if (arStarted && arSystem) {
        try { await arSystem.stop(); } catch (error) { console.warn('MindAR ya estaba detenido:', error); }
      }
      arStarted = false;
      arActive = false;
      clearDoorAnchors();
      scene.removeAttribute('mindar-image');
      sceneWrap.classList.remove('active');
      scannerSection.classList.remove('ar-mode');
      document.body.classList.remove('ar-session');
      camera.setAttribute('position', '0 0 6.6');
      museumRigs.forEach((museumRig) => {
        museumRig.setAttribute('scale', '1 1 1');
        museumRig.setAttribute('position', '0 0 0');
        museumRig.setAttribute('rotation', '0 0 0');
      });
      window.dispatchEvent(new Event('resize'));
      closeRequested = false;
      document.getElementById('startAR').disabled = false;
      arStatus.textContent = 'Preparando cámara…';
    }

    document.querySelectorAll('.welcome-cta').forEach((link) => link.addEventListener('click', () => {
      window.setTimeout(() => document.getElementById('startAR').focus({ preventScroll: true }), 350);
    }));
    document.getElementById('startAR').addEventListener('click', openAR);
    document.getElementById('closeAR').addEventListener('click', closeAR);
    document.getElementById('previousExhibit').addEventListener('click', () => selectExhibit(selected - 1));
    document.getElementById('nextExhibit').addEventListener('click', () => selectExhibit(selected + 1));
    previewTimer = window.setInterval(() => {
      if (!arActive && !document.hidden) selectExhibit(selected + 1);
    }, 4800);
    refreshQr();

    function attachPreviewControls() {
      // The hero is an automatic, non-interactive preview. AR navigation stays
      // available through its dedicated chapter buttons.
      document.querySelectorAll('.artifact a-plane').forEach((plane) => plane.classList.remove('clickable'));
    }
    if (scene.hasLoaded) attachPreviewControls();
    else scene.addEventListener('loaded', attachPreviewControls, { once: true });