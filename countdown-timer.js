class WMCountdownTimer {
  static emitEvent(type, detail = {}, elem = document) {
    // Make sure there's an event type
    if (!type) return;

    // Create a new event
    let event = new CustomEvent(type, {
      bubbles: true,
      cancelable: true,
      detail: detail,
    });

    // Dispatch the event
    return elem.dispatchEvent(event);
  };
  constructor(el){

   el.setAttribute('data-loading-state', 'loading');
    
   this.el = el;
    
    this.countdownDate = new Date(el.countdownDate);

    console.log(this.countdownDate);

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
    WMCountdownTimer.emitEvent('wmCountdownTimer:loaded');
  }

  dividers(){
     if (this.el.countdownFormat === `ddhh`) {
      let minuteDivider = this.el.querySelector('.minute-divider');
      let hourDivider = this.el.querySelector('.hour-divider');
      minuteDivider.style.display = 'none';
      hourDivider.style.display = 'none';
    }

    else if (this.el.countdownFormat === `hhmmss`) {
      let dayDivider = this.el.querySelector('.day-divider');
      dayDivider.style.display = 'none';
    }
  }

  setWidth(){

    let countdownSectionCheck = this.el.querySelector(".countdown-section");
    let styleCheck = window.getComputedStyle(countdownSectionCheck).display;
    

    if (styleCheck === 'block') {
      const digitElements = this.el.querySelectorAll('[data-wm-plugin="countdown-timer"] .digits');
  
      let maxWidth = 0;
  
      digitElements.forEach(element => {
        const elementWidth = element.offsetWidth;
         if (elementWidth > maxWidth) {
          maxWidth = elementWidth;
         }
          });
    
  
      digitElements.forEach(element => {
        element.style.width = maxWidth + 'px';
      });
    }
    
  }

  updateCountdown(){
    
    const countdown = setInterval(() =>  {

    let currentTime;
    if (this.timezone === 'Local') {
        currentTime = new Date().getTime();
    } else {
        currentTime = new Date(new Date().toLocaleString('en-US', { timeZone: this.timezone })).getTime();
    }
    
    let distance = this.countdownDate.getTime() - currentTime;

    let countdownDays = this.el.querySelector(".wm-countdown .days .digits .day-digit");
    let countdownHours = this.el.querySelector(".wm-countdown .hours .digits .hour-digit");
    let countdownMinutes = this.el.querySelector(".wm-countdown .minutes .digits .minute-digit");
    let countdownSeconds = this.el.querySelector(".wm-countdown .seconds .digits .second-digit");

    if (this.el.countdownFormat === `ddhhmmss`) {
      
    let days = Math.floor(distance / (1000 * 60 * 60 * 24));
    let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);

    days = days < 10 ? '0' + days : days;
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    countdownDays.innerHTML = days;
    countdownHours.innerHTML = hours;
    countdownMinutes.innerHTML = minutes;
    countdownSeconds.innerHTML = seconds;
      
    }
      
    else if (this.el.countdownFormat === `hhmmss`) {
      
      let hours = Math.floor(distance / (1000 * 60 * 60));
      let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.floor((distance % (1000 * 60)) / 1000);

      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;
 
      countdownHours.innerHTML = hours;
      countdownMinutes.innerHTML = minutes;
      countdownSeconds.innerHTML = seconds;

      let dayTag = this.el.querySelector(".days .text");
      dayTag.style.display= 'none';
      countdownDays.parentElement.style.display = 'none';
      
    }

    else if (this.el.countdownFormat === `ddhh`) {
      
      let days = Math.floor(distance / (1000 * 60 * 60 * 24));
      let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      days = days < 10 ? '0' + days : days;
      hours = hours < 10 ? '0' + hours : hours;
      
      countdownDays.innerHTML = days;
      countdownHours.innerHTML = hours;

      let minuteTag = this.el.querySelector(".minutes .text");
      let secondTag = this.el.querySelector(".seconds .text");
      minuteTag.style.display = 'none';
      secondTag.style.display = 'none';
      countdownMinutes.parentElement.style.display = 'none';
      countdownSeconds.parentElement.style.display = 'none';
      
      }

    if (isNaN(distance) || distance < 0) {
      distance = 0;
    }

      if (distance <= 0) {
      countdownDays.innerHTML = '00';
      countdownHours.innerHTML = '00';
      countdownMinutes.innerHTML = '00';
      countdownSeconds.innerHTML = '00';
      clearInterval(countdown); // Stop the countdown if it's finished
      return;
    }
      
      this.el.setAttribute('data-loading-state', 'complete');
    }, 1000);
  }
  
  bindEvents() {
    this.addPluginLoadedListener();
  }
  
  addPluginLoadedListener() {
    const handleLoaded = () => {
      window.setTimeout(() => {
  
      }, 1000)
    }
    document.addEventListener('wmCountdownTimer:loaded', handleLoaded)
  }
}

(function () {
  //If Plugin Exists
  //const pluginEls = document.querySelectorAll('[data-wm-plugin="countdown-timer"]');
 // if (!pluginEls.length) return;

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
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    dayTag:`Days`, 
    hourTag:`Hours`, 
    minuteTag:`Minutes`, 
    secondTag:`Seconds`, 
    countdownFormat:`ddhhmmss`,
    timezone: `Local`,
    digitSize: `h4`,
    textSize: `h4`,
  };
  const mergedSettings = deepMerge({}, defaultSettings, userSettings);

  function buildHTML(el, data) {

    el.countdownDate = mergedSettings.date;

    el.countdownFormat = mergedSettings.countdownFormat;

    el.timezone = mergedSettings.timezone;
 
    el.innerHTML = `
      <div class="wm-countdown" data-wm-plugin="countdown-timer">
        <div class="days countdown-section"> <div class="digits"><${(mergedSettings.digitSize)} class="day-digit digit">` + 00 + `</${(mergedSettings.digitSize)}></div> <div class="text"><${(mergedSettings.textSize)}>${(mergedSettings.dayTag)}</${(mergedSettings.textSize)}></div></div>

        <div class="divider day-divider"></div>
         
        <div class="hours countdown-section"> <div class="digits"><${(mergedSettings.digitSize)} class="hour-digit digit">` + 00 + `</${(mergedSettings.digitSize)}></div> <div class="text"><${(mergedSettings.textSize)}>${(mergedSettings.hourTag)}</${(mergedSettings.textSize)}></div></div>

        <div class="divider hour-divider"></div>
      
        <div class="minutes countdown-section"> <div class="digits"><${(mergedSettings.digitSize)} class="minute-digit digit">` + 00 + `</${(mergedSettings.digitSize)}></div> <div class="text"><${(mergedSettings.textSize)}>${(mergedSettings.minuteTag)}</${(mergedSettings.textSize)}></div></div>

        <div class="divider minute-divider"></div>
      
        <div class="seconds countdown-section"> <div class="digits"><${(mergedSettings.digitSize)} class="second-digit digit">` + 00 + `</${(mergedSettings.digitSize)}></div> <div class="text"><${(mergedSettings.textSize)}>${(mergedSettings.secondTag)}</${(mergedSettings.textSize)}></div></div>
      
      </div>
         `;
    
    //init Timer
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

  let countdownFromCode = document.querySelectorAll('[data-wm-plugin="countdown-timer"]');
  let countdownFromLink = document.querySelectorAll('a[href*="#wm-countdown"], a[href*="#wm-countdown"]'),
  origin = window.location.origin;
   
  
  for (let el of countdownFromCode) {
      buildHTML(el);
    
  }
  for (let el of countdownFromLink) {
    replaceAnchor(el);
    el.classList.add('link');
}
})();
