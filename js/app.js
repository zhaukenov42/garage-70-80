// GARAGE 70/80 — логика фильтрации, рендеринга сетки и детальной карточки

(function () {
  const countrySelect = document.getElementById('country-select');
  const classSelect = document.getElementById('class-select');
  const modelSelect = document.getElementById('model-select');
  const counterEl = document.getElementById('results-counter');
  const gridEl = document.getElementById('car-grid');
  const emptyStateEl = document.getElementById('empty-state');
  const detailSection = document.getElementById('detail');
  const detailCloseBtn = document.getElementById('detail-close');

  const state = {
    country: 'all',
    classId: 'all',
    modelId: null,
  };

  function classesAvailable(countryId) {
    const pool = countryId === 'all' ? CARS : CARS.filter((c) => c.country === countryId);
    const ids = [...new Set(pool.map((c) => c.classId))];
    return ids
      .map((id) => CLASSES[id])
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  function modelsAvailable(countryId, classId) {
    return CARS.filter(
      (c) => (countryId === 'all' || c.country === countryId) && (classId === 'all' || c.classId === classId)
    ).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }

  function populateCountrySelect() {
    const opts = ['<option value="all">Все страны</option>'];
    Object.values(COUNTRIES).forEach((c) => {
      opts.push(`<option value="${c.id}">${c.flag} ${c.name}</option>`);
    });
    countrySelect.innerHTML = opts.join('');
    countrySelect.value = state.country;
  }

  function populateClassSelect() {
    const opts = ['<option value="all">Все классы</option>'];
    classesAvailable(state.country).forEach((cl) => {
      opts.push(`<option value="${cl.id}">${cl.name}</option>`);
    });
    classSelect.innerHTML = opts.join('');
    classSelect.value = state.classId;
  }

  function populateModelSelect() {
    const models = modelsAvailable(state.country, state.classId);
    const opts = ['<option value="">— выберите модель —</option>'];
    models.forEach((m) => {
      opts.push(`<option value="${m.id}">${m.name} (${m.year})</option>`);
    });
    modelSelect.innerHTML = opts.join('');
    modelSelect.value = state.modelId || '';
  }

  function syncSelectsToState() {
    countrySelect.value = state.country;
    populateClassSelect();
    populateModelSelect();
  }

  function badgeHTML(kind, id) {
    if (kind === 'country') {
      const c = COUNTRIES[id];
      return `<span class="badge badge-country" style="--badge-color:${c.color}">${c.flag} ${c.name}</span>`;
    }
    const cl = CLASSES[id];
    return `<span class="badge badge-class">${cl.name}</span>`;
  }

  function renderGrid() {
    const models = modelsAvailable(state.country, state.classId);
    counterEl.textContent = `Найдено моделей: ${models.length}`;

    if (models.length === 0) {
      gridEl.innerHTML = '';
      emptyStateEl.hidden = false;
      return;
    }
    emptyStateEl.hidden = true;

    gridEl.innerHTML = models
      .map((car) => {
        const shapeKey = CLASSES[car.classId].shape;
        return `
        <article class="car-card" data-id="${car.id}" tabindex="0" role="button" aria-label="Открыть карточку ${car.name}">
          <div class="car-card-illustration">${carSilhouetteSVG(shapeKey, car.bodyColor)}</div>
          <div class="car-card-badges">
            ${badgeHTML('country', car.country)}
            ${badgeHTML('class', car.classId)}
          </div>
          <h3 class="car-card-name">${car.name}</h3>
          <div class="car-card-meta">
            <span>${car.year}</span>
            <span>${car.power} л.с.</span>
          </div>
        </article>`;
      })
      .join('');
  }

  function angleForSpeed(speed) {
    const clamped = Math.max(0, Math.min(MAX_SPEED, speed));
    return -120 + (clamped / MAX_SPEED) * 240;
  }

  function renderSpeedometer(topSpeed) {
    const ticks = [];
    const step = 30;
    for (let v = 0; v <= MAX_SPEED; v += step) {
      const angle = angleForSpeed(v);
      const rad = (angle * Math.PI) / 180;
      const outerR = 88;
      const innerR = v % 60 === 0 ? 74 : 80;
      const x1 = 100 + outerR * Math.sin(rad);
      const y1 = 100 - outerR * Math.cos(rad);
      const x2 = 100 + innerR * Math.sin(rad);
      const y2 = 100 - innerR * Math.cos(rad);
      ticks.push(
        `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(
          1
        )}" stroke="#5a6270" stroke-width="${v % 60 === 0 ? 2.5 : 1.5}"></line>`
      );
      if (v % 60 === 0) {
        const lx = 100 + 62 * Math.sin(rad);
        const ly = 100 - 62 * Math.cos(rad);
        ticks.push(
          `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" class="gauge-tick-label" text-anchor="middle" dominant-baseline="middle">${v}</text>`
        );
      }
    }

    return `
      <svg viewBox="0 0 200 200" class="speedometer" role="img" aria-label="Спидометр: максимальная скорость ${topSpeed} км/ч">
        <circle cx="100" cy="100" r="94" class="speedo-face"></circle>
        <path d="M 33.3 175.5 A 88 88 0 1 1 166.7 175.5" class="speedo-arc"></path>
        ${ticks.join('')}
        <g class="speedo-needle" data-target-angle="${angleForSpeed(topSpeed)}" style="transform: rotate(-120deg)">
          <line x1="100" y1="100" x2="100" y2="28" class="needle-line"></line>
          <circle cx="100" cy="100" r="7" class="needle-hub"></circle>
        </g>
        <text x="100" y="135" text-anchor="middle" class="speedo-value">${topSpeed}</text>
        <text x="100" y="150" text-anchor="middle" class="speedo-unit">км/ч</text>
      </svg>
    `;
  }

  function specRow(label, value) {
    return `<tr><th>${label}</th><td>${value}</td></tr>`;
  }

  function renderDetail(car) {
    const shapeKey = CLASSES[car.classId].shape;
    const powerPct = Math.round((car.power / MAX_POWER) * 100);

    detailSection.innerHTML = `
      <button type="button" id="detail-close" class="detail-close" aria-label="Закрыть карточку модели">×</button>
      <div class="detail-grid">
        <div class="detail-illustration">${carSilhouetteSVG(shapeKey, car.bodyColor)}</div>
        <div class="detail-body">
          <div class="detail-badges">
            ${badgeHTML('country', car.country)}
            ${badgeHTML('class', car.classId)}
            <span class="badge badge-years">${car.yearRange}</span>
          </div>
          <h2 class="detail-name">${car.name}</h2>
          <p class="detail-description">${car.description}</p>
        </div>
      </div>

      <div class="gauges-row">
        <div class="gauge-block gauge-speedo-block">
          ${renderSpeedometer(car.topSpeed)}
        </div>
        <div class="gauge-block gauge-power-block">
          <div class="power-label">Мощность двигателя</div>
          <div class="power-bar-track">
            <div class="power-bar-fill" data-target-width="${powerPct}" style="width:0%"></div>
          </div>
          <div class="power-value">${car.power} л.с.</div>
        </div>
      </div>

      <table class="spec-table">
        <tbody>
          ${specRow('Двигатель', car.engine)}
          ${specRow('Мощность', `${car.power} л.с.`)}
          ${specRow('Крутящий момент', `${car.torque} Нм`)}
          ${specRow('Разгон 0–100 км/ч', `${car.accel} с`)}
          ${specRow('Максимальная скорость', `${car.topSpeed} км/ч`)}
          ${specRow('Снаряжённая масса', `${car.weight} кг`)}
          ${specRow('Привод', car.drive)}
          ${specRow('Годы выпуска', car.yearRange)}
          ${specRow('Класс', CLASSES[car.classId].name)}
          ${specRow('Цена на момент выпуска', car.price)}
        </tbody>
      </table>
    `;

    detailSection.hidden = false;

    document.getElementById('detail-close').addEventListener('click', closeDetail);

    requestAnimationFrame(() => {
      const needle = detailSection.querySelector('.speedo-needle');
      const bar = detailSection.querySelector('.power-bar-fill');
      requestAnimationFrame(() => {
        if (needle) needle.style.transform = `rotate(${needle.dataset.targetAngle}deg)`;
        if (bar) bar.style.width = `${bar.dataset.targetWidth}%`;
      });
    });

    detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeDetail() {
    state.modelId = null;
    modelSelect.value = '';
    detailSection.hidden = true;
    detailSection.innerHTML = '';
  }

  function selectModel(id, opts) {
    const car = CARS.find((c) => c.id === id);
    if (!car) return;
    state.modelId = id;
    state.country = car.country;
    state.classId = car.classId;
    syncSelectsToState();
    renderGrid();
    renderDetail(car);
    if (opts && opts.highlight) {
      highlightCard(id);
    }
  }

  function highlightCard(id) {
    gridEl.querySelectorAll('.car-card').forEach((el) => el.classList.remove('is-active'));
    const el = gridEl.querySelector(`.car-card[data-id="${id}"]`);
    if (el) el.classList.add('is-active');
  }

  countrySelect.addEventListener('change', () => {
    state.country = countrySelect.value;
    state.classId = 'all';
    state.modelId = null;
    populateClassSelect();
    populateModelSelect();
    renderGrid();
    detailSection.hidden = true;
    detailSection.innerHTML = '';
  });

  classSelect.addEventListener('change', () => {
    state.classId = classSelect.value;
    state.modelId = null;
    populateModelSelect();
    renderGrid();
    detailSection.hidden = true;
    detailSection.innerHTML = '';
  });

  modelSelect.addEventListener('change', () => {
    if (!modelSelect.value) {
      closeDetail();
      return;
    }
    selectModel(modelSelect.value, { highlight: true });
  });

  gridEl.addEventListener('click', (e) => {
    const card = e.target.closest('.car-card');
    if (!card) return;
    selectModel(card.dataset.id, { highlight: true });
  });

  gridEl.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.car-card');
    if (!card) return;
    e.preventDefault();
    selectModel(card.dataset.id, { highlight: true });
  });

  // init
  populateCountrySelect();
  populateClassSelect();
  populateModelSelect();
  renderGrid();
})();
