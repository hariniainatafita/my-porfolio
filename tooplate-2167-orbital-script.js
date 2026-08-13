

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ring = document.getElementById('ring');
  var panels = ring.querySelectorAll('.panel');
  var count = panels.length;

  var spacingLevels = [0.74, 0.92, 1.08];   
  var spacingIndex = 1;

  function baseRadius() {
    var raw = getComputedStyle(document.documentElement).getPropertyValue('--ring-radius');
    return parseFloat(raw) || 360;
  }
  function effectiveRadius() {
    return baseRadius() * spacingLevels[spacingIndex];
  }

  function positionPanels() {
    var r = effectiveRadius();
    panels.forEach(function (panel, i) {
      var angle = (360 / count) * i;
      var tilt = Math.sin((i / count) * Math.PI * 2) * 8;
      panel.style.setProperty('--ry', angle + 'deg');
      panel.style.setProperty('--tz', r + 'px');
      panel.style.setProperty('--rz', tilt.toFixed(2) + 'deg');
      panel.style.setProperty('--i', i);
    });
  }
  positionPanels();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(positionPanels, 200);
  });


  var spacingSteps = document.querySelectorAll('.spacing-step');
  function setSpacing(idx) {
    spacingIndex = idx;
    var r = effectiveRadius();
    ring.querySelectorAll('.panel').forEach(function (p) {
      p.style.setProperty('--tz', r + 'px');
    });
    spacingSteps.forEach(function (b) {
      b.classList.toggle('is-active', parseInt(b.getAttribute('data-space'), 10) === idx);
    });
  }
  spacingSteps.forEach(function (b) {
    b.addEventListener('click', function () {
      setSpacing(parseInt(b.getAttribute('data-space'), 10));
    });
  });


  var stage = document.querySelector('.stage');
  var parallax = document.querySelector('.parallax');

  var rotation = 0;
  var velocity = 0;
  var baseDrift = reduceMotion ? 0 : 0.12;  
  var friction = 0.94;                       
  var MAX_VELOCITY = 7;
  var DRAG_SENS = 0.32;                       
  var WHEEL_SENS = 0.05;                      

  var dragging = false;
  var lastX = 0;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

 
  var targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  var rangeY = 28;  
  var rangeX = 30;  
  var biasX = 10;    
  if (!reduceMotion) {
    window.addEventListener('mousemove', function (e) {
      var mx = (e.clientX / window.innerWidth) - 0.5;
      var my = (e.clientY / window.innerHeight) - 0.5;
      targetY = mx * rangeY;
      targetX = (-my * rangeX) + biasX;
    });
  }

  if (stage) {
    stage.addEventListener('pointerdown', function (e) {
      dragging = true;
      lastX = e.clientX;
      velocity = 0;
      stage.classList.add('dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX;
      lastX = e.clientX;
      var step = dx * DRAG_SENS;
      rotation += step;
      velocity = clamp(step, -MAX_VELOCITY, MAX_VELOCITY);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('dragging');
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        velocity = clamp(velocity + e.deltaX * WHEEL_SENS, -MAX_VELOCITY, MAX_VELOCITY);
      }
    }, { passive: false });
  }

  
  function frame() {
    if (!dragging) {
      rotation += baseDrift + velocity;
      velocity *= friction;
      if (Math.abs(velocity) < 0.0015) velocity = 0;
    }
    ring.style.transform = 'rotateY(' + rotation.toFixed(3) + 'deg)';

    if (!reduceMotion && parallax) {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      parallax.style.transform = 'rotateX(' + currentX.toFixed(2) + 'deg) rotateY(' + currentY.toFixed(2) + 'deg)';
    }
    requestAnimationFrame(frame);
  }
  frame();


  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }
  setTimeout(function () {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }, 3000);


  var toggle = document.querySelector('.menu-toggle');
  var mobileMenu = document.querySelector('.mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
  
  var switchBtn = document.getElementById('visualsSwitch');
  if (switchBtn) {
    switchBtn.addEventListener('click', function () {
      var on = switchBtn.getAttribute('aria-checked') !== 'true';
      switchBtn.setAttribute('aria-checked', on ? 'true' : 'false');
      document.body.classList.toggle('visuals-on', on);
    });
  }

 
  var zoomSwitch = document.getElementById('zoomSwitch');
  var ringTilt = document.querySelector('.ring-tilt');
  if (zoomSwitch && ringTilt) {
    zoomSwitch.addEventListener('click', function () {
      var on = zoomSwitch.getAttribute('aria-checked') !== 'true';
      zoomSwitch.setAttribute('aria-checked', on ? 'true' : 'false');
      ringTilt.style.setProperty('--zoom', on ? '1.24' : '1');
    });
  }
})();
