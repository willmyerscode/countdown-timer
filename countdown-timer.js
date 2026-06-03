class WMCountdownTimer {
    static emitEvent(type, detail = {}, elem = document) {
      if (!type) return;
      let event = new CustomEvent(type, {
        bubbles: true,
        cancelable: true,
        detail: detail,
      });
      return elem.dispatchEvent(event);
  };

    constructor(el){
      el.setAttribute('data-loading-state', 'loading');
      this.el = el;
      this.displayStyle = el.displayStyle || 'default';
      this.isFlip = this.displayStyle === 'flip';

      this.countdownDate = new Date(el.countdownDate);
     
      const dateAttr = el.getAttribute('data-date');
      if (dateAttr) {
        const parsedDate = new Date(dateAttr);
        if (!isNaN(parsedDate) && parsedDate !== 'Invalid Date') {
          this.countdownDate = parsedDate;
        } else {
          const errorEl = document.createElement('p');
          errorEl.classList.add('show-in-editor')
          errorEl.innerHTML = `Invalid Date format used. Be sure to use the format <em>YYYY-MM-DD</em>T<em>HH:MM:SS</em>`;
          el.append(errorEl)
        }
      }
          
      this.timezone = el.timezone;
      this.individualTimezone = el.getAttribute('data-timezone');
      if (this.individualTimezone) {
        this.timezone = this.individualTimezone;
      }
      
      this.init();
    }
  
    init () {
      this.setWidth();
      this.updateCountdown();
      this.dividers();
      this.bindEvents();
      this.resizeEvent();
      WMCountdownTimer.emitEvent('wmCountdownTimer:loaded');
    }

    createFlipCard(initialValue = '0') {
      const flip = document.createElement('span');
      flip.className = 'wm-flip';
      flip.dataset.value = initialValue;
      flip.innerHTML = `
        <span class="wm-flip-card">
          <span class="wm-flip-panel wm-flip-panel-top">
            <span class="wm-flip-panel-text"><span class="wm-flip-digit">${initialValue}</span></span>
          </span>
          <span class="wm-flip-panel wm-flip-panel-bottom">
            <span class="wm-flip-panel-text"><span class="wm-flip-digit">${initialValue}</span></span>
          </span>
          <span class="wm-flip-panel wm-flip-panel-flip">
            <span class="wm-flip-face wm-flip-face-front">
              <span class="wm-flip-panel-text"><span class="wm-flip-digit">${initialValue}</span></span>
            </span>
            <span class="wm-flip-face wm-flip-face-back">
              <span class="wm-flip-panel-text"><span class="wm-flip-digit">${initialValue}</span></span>
            </span>
          </span>
        </span>
      `;
      return flip;
    }

    setFlipValue(flipEl, newValue) {
      const current = flipEl.dataset.value;
      if (current === newValue) return;

      const topPanel = flipEl.querySelector('.wm-flip-panel-top .wm-flip-digit');
      const bottomPanel = flipEl.querySelector('.wm-flip-panel-bottom .wm-flip-digit');
      const flipFront = flipEl.querySelector('.wm-flip-face-front .wm-flip-digit');
      const flipBack = flipEl.querySelector('.wm-flip-face-back .wm-flip-digit');
      const flipPanelEl = flipEl.querySelector('.wm-flip-panel-flip');

      flipFront.textContent = current;
      flipBack.textContent = newValue;
      bottomPanel.textContent = current;
      topPanel.textContent = newValue;

      const finishFlip = () => {
        if (!flipEl.classList.contains('flipping')) return;
        if (flipEl._onFlipEnd) {
          flipEl.removeEventListener('animationend', flipEl._onFlipEnd);
          flipEl._onFlipEnd = null;
        }
        clearTimeout(flipEl._flipTimeout);

        flipEl.dataset.value = newValue;
        bottomPanel.textContent = newValue;
        topPanel.textContent = newValue;
        flipPanelEl.style.animation = 'none';
        flipPanelEl.style.transform = 'rotateX(-180deg) translateZ(0)';

        requestAnimationFrame(() => {
          flipEl.classList.remove('flipping');
          flipPanelEl.style.animation = '';
          flipPanelEl.style.transform = '';
          flipFront.textContent = newValue;
          flipBack.textContent = newValue;
        });
      };

      if (flipEl._onFlipEnd) {
        flipEl.removeEventListener('animationend', flipEl._onFlipEnd);
      }
      clearTimeout(flipEl._flipTimeout);

      flipEl._onFlipEnd = (e) => {
        if (e.target !== flipPanelEl) return;
        finishFlip();
      };

      flipEl.classList.remove('flipping');
      void flipEl.offsetWidth;
      flipEl.addEventListener('animationend', flipEl._onFlipEnd);
      flipEl.classList.add('flipping');

      const duration = parseFloat(getComputedStyle(flipEl).getPropertyValue('--cd-flip-duration')) || 0.5;
      flipEl._flipTimeout = setTimeout(finishFlip, duration * 1000 + 50);
    }

    updateDigitUnit(container, value) {
      if (!container) return;
      const padded = String(value).padStart(2, '0').slice(-2);
      const flips = container.querySelectorAll('.wm-flip');
      if (flips.length < 2) return;
      this.setFlipValue(flips[0], padded[0]);
      this.setFlipValue(flips[1], padded[1]);
    }

    setDigitContent(element, value) {
      if (!element) return;
      if (this.isFlip) {
        this.updateDigitUnit(element, value);
      } else if (element) {
        element.innerHTML = value;
      }
    }

    getDigitElement(unit) {
      const digitClasses = {
        days: 'day-digit',
        hours: 'hour-digit',
        minutes: 'minute-digit',
        seconds: 'second-digit',
      };
      if (this.isFlip) {
        return this.el.querySelector(`.wm-countdown .${unit} .digits`);
      }
      const digitClass = digitClasses[unit];
      return this.el.querySelector(`.wm-countdown .${unit} .digits .${digitClass}`);
    }

    hideCountdownUnit(unit) {
      const section = this.el.querySelector(`.wm-countdown .${unit}.countdown-section`);
      if (section) section.style.display = 'none';
    }
  
    dividers(){
      if (this.el.countdownFormat === `ddhh`) {
        let minuteDivider = this.el.querySelector('.minute-divider');
        let hourDivider = this.el.querySelector('.hour-divider');
        if (minuteDivider) minuteDivider.style.display = 'none';
        if (hourDivider) hourDivider.style.display = 'none';
      }
  
      else if (this.el.countdownFormat === `hhmmss`) {
        let dayDivider = this.el.querySelector('.day-divider');
        if (dayDivider) dayDivider.style.display = 'none';
      }
    }
  
    setWidth(){
      let countdownSectionCheck = this.el.querySelector(".countdown-section");
      if (!countdownSectionCheck) return;
      let styleCheck = window.getComputedStyle(countdownSectionCheck).display;
      
      if (styleCheck === 'block') {
        const selector = this.isFlip ? '.flip-digits' : '.digits';
        const digitElements = this.el.querySelectorAll(`.wm-countdown ${selector}`);
        
        let maxWidth = 0;
    
        digitElements.forEach(element => {
          element.style.minWidth = '';
          const elementWidth = element.offsetWidth;
           if (elementWidth > maxWidth) {
            maxWidth = elementWidth;
           }
        });
      
        digitElements.forEach(element => {
          element.style.minWidth = maxWidth + 'px';
        });
      }
    }
  
    getCurrentTime() {
      if (this.timezone === 'Local') {
        return Date.now();
      }
      return new Date(new Date().toLocaleString('en-US', { timeZone: this.timezone })).getTime();
    }

    stopCountdown() {
      if (this._countdownInterval) {
        clearInterval(this._countdownInterval);
        this._countdownInterval = null;
      }
      if (this._countdownTimeout) {
        clearTimeout(this._countdownTimeout);
        this._countdownTimeout = null;
      }
    }

    tick() {
      let distance = this.countdownDate.getTime() - this.getCurrentTime();

      const countdownDays = this.getDigitElement('days');
      const countdownHours = this.getDigitElement('hours');
      const countdownMinutes = this.getDigitElement('minutes');
      const countdownSeconds = this.getDigitElement('seconds');

      if (this.el.countdownFormat === `ddhhmmss`) {
        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        days = days < 10 ? '0' + days : days;
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        this.setDigitContent(countdownDays, days);
        this.setDigitContent(countdownHours, hours);
        this.setDigitContent(countdownMinutes, minutes);
        this.setDigitContent(countdownSeconds, seconds);
      } else if (this.el.countdownFormat === `hhmmss`) {
        let hours = Math.floor(distance / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        this.setDigitContent(countdownHours, hours);
        this.setDigitContent(countdownMinutes, minutes);
        this.setDigitContent(countdownSeconds, seconds);

        this.hideCountdownUnit('days');
      } else if (this.el.countdownFormat === `ddhh`) {
        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        days = days < 10 ? '0' + days : days;
        hours = hours < 10 ? '0' + hours : hours;

        this.setDigitContent(countdownDays, days);
        this.setDigitContent(countdownHours, hours);

        this.hideCountdownUnit('minutes');
        this.hideCountdownUnit('seconds');
      }

      if (isNaN(distance) || distance < 0) {
        distance = 0;
      }

      if (distance <= 0) {
        this.setDigitContent(countdownDays, '00');
        this.setDigitContent(countdownHours, '00');
        this.setDigitContent(countdownMinutes, '00');
        this.setDigitContent(countdownSeconds, '00');
        this.stopCountdown();
        this.el.setAttribute('data-loading-state', 'complete');
        return false;
      }

      this.el.setAttribute('data-loading-state', 'complete');
      return true;
    }

    scheduleNextTick() {
      if (this._countdownTimeout) clearTimeout(this._countdownTimeout);
      const delay = Math.max(50, 1000 - (this.getCurrentTime() % 1000));
      this._countdownTimeout = setTimeout(() => {
        if (!this.tick()) return;
        this.scheduleNextTick();
      }, delay);
    }

    updateCountdown() {
      this.stopCountdown();
      if (!this.tick()) return;
      this.scheduleNextTick();
    }

    bindVisibilityChange() {
      if (this._onVisibilityChange) return;

      this._onVisibilityChange = () => {
        if (document.hidden) {
          this.stopCountdown();
          return;
        }
        if (!this.tick()) return;
        this.scheduleNextTick();
      };

      document.addEventListener('visibilitychange', this._onVisibilityChange);

      this._onPageShow = () => {
        if (document.hidden) return;
        if (!this.tick()) return;
        this.scheduleNextTick();
      };

      window.addEventListener('pageshow', this._onPageShow);
    }

    bindEvents() {
      this.bindVisibilityChange();
      this.addPluginLoadedListener();
    }
    addPluginLoadedListener() {
      const handleLoaded = () => {
        window.setTimeout(() => {
    
        }, 1000)
      }
      document.addEventListener('wmCountdownTimer:loaded', handleLoaded)
    }
    resizeEvent(){
      const throttleSetWidth = this.throttle(this.setWidth.bind(this), 250);
      window.addEventListener('resize', throttleSetWidth);
    }
    throttle(func, limit) {
      let lastFunc;
      let lastRan;
      return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
          func.apply(context, args);
          lastRan = Date.now();
        } else {
          clearTimeout(lastFunc);
          lastFunc = setTimeout(function() {
            if ((Date.now() - lastRan) >= limit) {
              func.apply(context, args);
              lastRan = Date.now();
            }
          }, limit - (Date.now() - lastRan));
        }
      };
    }
  }
  
  (function () {
  if (window.__wmCountdownTimerInit) return;
  window.__wmCountdownTimerInit = true;

  function deepMerge (...objs) {
    function getType (obj) {
      return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
    }
    function mergeObj (clone, obj) {
      for (let [key, value] of Object.entries(obj)) {
        let type = getType(value);
        if (clone[key] !== undefined && getType(clone[key]) === type && ['array', 'object'].includes(type)) {
          clone[key] = deepMerge(clone[key], value);
        } else {
          clone[key] = structuredClone(value);
        }
      }
    }
    let clone = structuredClone(objs.shift());
    for (let obj of objs) {
      let type = getType(obj);
      if (getType(clone) !== type) {
        clone = structuredClone(obj);
        continue;
      }
      if (type === 'array') {
        clone = [...clone, ...structuredClone(obj)];
      } else if (type === 'object') {
        mergeObj(clone, obj);
      } else {
        clone = obj;
      }
    }
  
    return clone;
  
  }
  const userSettings = window.wmCountdownTimerSettings ? window.wmCountdownTimerSettings : {};
  const defaultSettings = {
    date: new Date(Date.now()),
    dayTag: 'Days', 
    hourTag: 'Hours', 
    minuteTag: 'Minutes', 
    secondTag: 'Seconds', 
    countdownFormat: 'ddhhmmss',
    timezone: 'Local',
    digitStyle: 'h4',
    textStyle: 'h4',
    displayStyle: 'default',
  };
  const mergedSettings = deepMerge({}, defaultSettings, userSettings);

  function normalizeDisplayStyle(value) {
    return String(value).replace(/['"]/g, '').trim().toLowerCase();
  }

  function resolveDisplayStyleFromCss(el) {
    if (!el) return 'default';

    if (el.dataset.cdDisplayStyle) {
      return normalizeDisplayStyle(el.dataset.cdDisplayStyle);
    }

    let node = el;
    while (node) {
      const inline = node.style.getPropertyValue('--cd-display-style').trim();
      if (normalizeDisplayStyle(inline) === 'flip') return 'flip';

      if (node.isConnected || node === el) {
        const computed = getComputedStyle(node).getPropertyValue('--cd-display-style').trim();
        if (normalizeDisplayStyle(computed) === 'flip') return 'flip';
      }

      node = node.parentElement;
    }

    return 'default';
  }

  function resolveDisplayStyle(el) {
    if (userSettings.displayStyle !== undefined) {
      return normalizeDisplayStyle(userSettings.displayStyle);
    }
    return resolveDisplayStyleFromCss(el);
  }

  function createFlipCard(initialValue = '0') {
    return `
      <span class="wm-flip" data-value="${initialValue}">
        <span class="wm-flip-card">
          <span class="wm-flip-panel wm-flip-panel-top">
            <span class="wm-flip-panel-text"><span class="wm-flip-digit">${initialValue}</span></span>
          </span>
          <span class="wm-flip-panel wm-flip-panel-bottom">
            <span class="wm-flip-panel-text"><span class="wm-flip-digit">${initialValue}</span></span>
          </span>
          <span class="wm-flip-panel wm-flip-panel-flip">
            <span class="wm-flip-face wm-flip-face-front">
              <span class="wm-flip-panel-text"><span class="wm-flip-digit">${initialValue}</span></span>
            </span>
            <span class="wm-flip-face wm-flip-face-back">
              <span class="wm-flip-panel-text"><span class="wm-flip-digit">${initialValue}</span></span>
            </span>
          </span>
        </span>
      </span>`;
  }

  function buildFlipDigits() {
    return createFlipCard('0') + createFlipCard('0');
  }

  function buildDigitsHtml(unitClass, settings) {
    if (settings.displayStyle === 'flip') {
      return `<div class="digits flip-digits ${unitClass}">${buildFlipDigits()}</div>`;
    }
    return `<div class="digits"><${settings.digitStyle} class="${unitClass} digit">00</${settings.digitStyle}></div>`;
  }
  
  function buildHTML(el, data) {
    el.wmCountdownTimer?.stopCountdown();

    const settings = deepMerge({}, mergedSettings, {
      displayStyle: resolveDisplayStyle(el),
    });

    el.countdownDate = settings.date;
    el.countdownFormat = settings.countdownFormat;
    el.timezone = settings.timezone;
    el.displayStyle = settings.displayStyle;
    el.dataset.displayStyle = settings.displayStyle;

    const isFlip = settings.displayStyle === 'flip';
    const flipClass = isFlip ? ' display-flip' : '';
    el.classList.toggle('display-flip', isFlip);

    el.innerHTML = `
      <div class="wm-countdown${flipClass}" data-cd-style="${settings.displayStyle}">
        <div class="days countdown-section tick-group">
          ${buildDigitsHtml('day-digit', settings)}
          <div class="text"><${settings.textStyle}>${settings.dayTag}</${settings.textStyle}></div>
        </div>

        <div class="divider day-divider"><span class="colon">:</span></div>
         
        <div class="hours countdown-section tick-group">
          ${buildDigitsHtml('hour-digit', settings)}
          <div class="text"><${settings.textStyle}>${settings.hourTag}</${settings.textStyle}></div>
        </div>

        <div class="divider hour-divider"><span class="colon">:</span></div>
      
        <div class="minutes countdown-section tick-group">
          ${buildDigitsHtml('minute-digit', settings)}
          <div class="text"><${settings.textStyle}>${settings.minuteTag}</${settings.textStyle}></div>
        </div>

        <div class="divider minute-divider"><span class="colon">:</span></div>
      
        <div class="seconds countdown-section tick-group">
          ${buildDigitsHtml('second-digit', settings)}
          <div class="text"><${settings.textStyle}>${settings.secondTag}</${settings.textStyle}></div>
        </div>
      
      </div>
         `;
    
    el.wmCountdownTimer = new WMCountdownTimer(el);
  }
  
  function replaceAnchor(instance) {
    const href = instance.getAttribute('href');
    const divElement = document.createElement('div');
    divElement.setAttribute('data-wm-plugin', 'countdown-timer');
    divElement.classList.add('link');
    divElement.setAttribute('data-href', href);
    instance.parentNode.replaceChild(divElement, instance);
    buildHTML(divElement);
  }
  
  function isInAnnouncementBar(el) {
    return !!(
      el.closest('.sqs-announcement-bar-dropzone') ||
      el.closest('#announcement-bar-text-inner-id') ||
      el.closest('.announcement-bar') ||
      el.classList.contains('announcement-countdown')
    );
  }

  function initCountdownTimers() {
    const countdownFromCode = document.querySelectorAll('[data-wm-plugin="countdown-timer"]:not([data-cd-built])');

    for (let el of countdownFromCode) {
      if (isInAnnouncementBar(el)) continue;
      if (el.parentElement && el.parentElement.closest('[data-wm-plugin="countdown-timer"]')) continue;
      buildHTML(el);
      el.setAttribute('data-cd-built', '');
    }

    const countdownFromLink = document.querySelectorAll('a[href*="#wm-countdown"], a[href*="#wm-countdown"]');
    for (let el of countdownFromLink) {
      replaceAnchor(el);
      el.classList.add('link');
    }
  }

  /** Announcement Bar **/
  const SHORTCODE_PATTERN = /\[countdown-timer\]/gi;

  const isEditMode = () =>
    document.body.classList.contains('sqs-edit-mode-active') ||
    document.body.classList.contains('sqs-edit-mode');

  function getSitePreviewFrame() {
    return document.querySelector(
      'iframe#sqs-site-frame, iframe.sqs-site-frame, iframe[name="sqs-site-frame"], iframe[src*="squarespace"]'
    );
  }

  function shouldInitAnnouncementBar() {
    if (!isEditMode()) return true;
    // Custom code runs in the editor chrome and the site preview iframe.
    if (window.self !== window.top) return true;
    // Top window: skip when a preview iframe exists (iframe will init the bar).
    return !getSitePreviewFrame();
  }

  function isAnnouncementVisible(el) {
    if (!el?.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getAnnouncementRoots() {
    const roots = new Set();
    document.querySelectorAll('.sqs-announcement-bar-dropzone, .announcement-bar').forEach((el) => roots.add(el));
    if (!roots.size) {
      document.querySelectorAll('#announcement-bar-text-inner-id').forEach((inner) => {
        const root = inner.closest('.sqs-announcement-bar-dropzone, .announcement-bar') || inner.parentElement;
        if (root) roots.add(root);
      });
    }
    return [...roots];
  }

  function stripCountdownShortcodes(container) {
    if (!container) return;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      if (SHORTCODE_PATTERN.test(node.textContent)) {
        node.textContent = node.textContent.replace(SHORTCODE_PATTERN, '');
      }
    });
    SHORTCODE_PATTERN.lastIndex = 0;
  }

  function removeExtraAnnouncementTimers(scope) {
    const timers = [...scope.querySelectorAll('[data-wm-plugin="countdown-timer"]')];
    timers.slice(1).forEach((timer) => timer.remove());
    return timers[0] || null;
  }

  function initAnnouncementRoot(root) {
    if (!root) return;

    const abInner = root.querySelector('#announcement-bar-text-inner-id') || root;
    const hadShortcode = SHORTCODE_PATTERN.test(root.textContent || '');
    const hadTimer = !!root.querySelector('[data-wm-plugin="countdown-timer"]');
    if (!hadShortcode && !hadTimer) return;

    stripCountdownShortcodes(abInner);

    let timer = removeExtraAnnouncementTimers(root);

    if (!timer && hadShortcode) {
      timer = document.createElement('div');
      timer.setAttribute('data-wm-plugin', 'countdown-timer');
      timer.className = 'announcement-countdown';
      abInner.appendChild(timer);
    }

    if (!timer) return;

    if (!abInner.contains(timer)) {
      abInner.appendChild(timer);
    }

    if (!timer.hasAttribute('data-cd-built')) {
      buildHTML(timer);
      timer.setAttribute('data-cd-built', '');
    }
  }

  function dedupeEditorAnnouncementTimers() {
    if (!isEditMode()) return;

    const timers = [
      ...document.querySelectorAll(
        '.sqs-announcement-bar-dropzone [data-wm-plugin="countdown-timer"], .announcement-bar [data-wm-plugin="countdown-timer"]'
      ),
    ];
    if (timers.length < 2) return;

    const keep =
      timers.find((timer) => isAnnouncementVisible(timer.closest('.sqs-announcement-bar-dropzone, .announcement-bar'))) ||
      timers[0];

    timers.forEach((timer) => {
      if (timer !== keep) timer.remove();
    });
  }

  let announcementInitRunning = false;
  function initAnnouncementBar() {
    if (!shouldInitAnnouncementBar()) return;
    if (announcementInitRunning) return;
    announcementInitRunning = true;

    try {
      let roots = getAnnouncementRoots().filter(isAnnouncementVisible);
      if (!roots.length) {
        roots = getAnnouncementRoots();
      }
      if (isEditMode() && roots.length > 1) {
        roots = [roots[0]];
      }
      roots.forEach(initAnnouncementRoot);
      dedupeEditorAnnouncementTimers();
    } finally {
      announcementInitRunning = false;
    }
  }

  function runInit() {
    initAnnouncementBar();
    initCountdownTimers();
  }

  function scheduleInit() {
    const run = () => requestAnimationFrame(runInit);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }

  const aBDropzone = document.querySelector('.sqs-announcement-bar-dropzone');
  const announcementObserver = new MutationObserver((mutations) => {
    const hasNewNodes = mutations.some((mutation) => mutation.addedNodes.length > 0);
    if (!hasNewNodes) return;
    initAnnouncementBar();
    announcementObserver.disconnect();
  });

  if (aBDropzone) {
    announcementObserver.observe(aBDropzone, {
      subtree: false,
      childList: true,
    });
    initAnnouncementBar();
  }

  scheduleInit();
  })();

