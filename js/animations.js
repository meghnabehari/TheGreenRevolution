
new fullpage('#fullpage', {
  autoScrolling:true,
  navigation: true,
  anchors: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'],
});



document.addEventListener('DOMContentLoaded', (event) => {
  const sectionTwoText = document.querySelector('#section-two-text');
  
  let typed;
  const startTyped = () => {
      typed = new Typed('#section-two-text', {
          strings: ["On November 4th, 2016, 196 parties entered the Paris Agreement", "The goal? Keep the global temperature change below 1.5 degrees C",
           "Since then, efforts to reduce carbon emissions have hardly worked"],
          typeSpeed: 60, 
          onComplete: function() {
            setTimeout(fadeInContent, 1000);
        }
      });
  };

  const fadeInContent = () => {
    document.querySelectorAll('.hidden-content').forEach(element => {
        element.classList.add('fade-in');
    });
};

  const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
          if (entry.isIntersecting && !typed) {
            setTimeout(startTyped, 500);
              observer.unobserve(sectionTwoText);
          }
      });
  }, { threshold: 0.9}); 

  observer.observe(sectionTwoText);
});


// var typed = new Typed('#section-two-text', {
//   strings: ["On November 4th, 2016, 196 parties entered the Paris Agreement", "The goal? Keep the global temperature change below 2 degrees C"],
//   typeSpeed: 60
// });


// COUNT UP CODE
// Usage: codyhouse.co/license
(function() {	
  var CountUp = function(opts) {
    this.options = extendProps(CountUp.defaults , opts);
    this.element = this.options.element;
    this.initialValue = parseFloat(this.options.initial);
    this.finalValue = parseFloat(this.element.textContent);
    this.deltaValue = parseFloat(this.options.delta);
    this.intervalId;
    this.animationTriggered = false;
    this.srClass = 'cd-sr-only';
    initCountUp(this);
  };

  this.updateFinalValue = function(newFinalValue) {
    this.finalValue = parseFloat(newFinalValue);
    this.initialValue = getCountupStart(this);
    this.restart();
  };

  CountUp.prototype.reset = function() {
    window.cancelAnimationFrame(this.intervalId);
    this.element.textContent = this.initialValue;
  };  

  CountUp.prototype.restart = function() { 
    countUpAnimate(this);
  };

  function initCountUp(countup) {
    countup.initialValue = getCountupStart(countup);

    initCountUpSr(countup);

    // listen for the element to enter the viewport -> start animation
    var observer = new IntersectionObserver(countupObserve.bind(countup), { threshold: [0, 0.1] });
    observer.observe(countup.element);

    countup.element.addEventListener('countUpReset', function(){countup.reset();});
    countup.element.addEventListener('countUpRestart', function(){countup.restart();});
  };

  function countUpShow(countup) { // reveal countup after it has been initialized
    countup.element.closest('.countup').classList.add('countup--is-visible');
  };

  function countupObserve(entries, observer) { // observe countup position -> start animation when inside viewport
    if(entries[0].intersectionRatio.toFixed(1) > 0 && !this.animationTriggered) {
      countUpAnimate(this);
    }
  };

  function countUpAnimate(countup) { // animate countup
    countup.element.textContent = countup.initialValue;
    countUpShow(countup);
    window.cancelAnimationFrame(countup.intervalId);
    var currentTime = null;

    function runCountUp(timestamp) {
      if (!currentTime) currentTime = timestamp;        
      var progress = timestamp - currentTime;
      if(progress > countup.options.duration) progress = countup.options.duration;
      var val = getValEaseOut(progress, countup.initialValue, countup.finalValue - countup.initialValue, countup.options.duration);
      countup.element.textContent = getCountUpValue(val, countup);
      if(progress < countup.options.duration) {
        countup.intervalId = window.requestAnimationFrame(runCountUp);
      } else {
        countUpComplete(countup);
      }
    };

    countup.intervalId = window.requestAnimationFrame(runCountUp);
  };

  function getCountUpValue(val, countup) {
    if(countup.options.decimal) {val = parseFloat(val.toFixed(countup.options.decimal));}
    else {val = parseInt(val);}
    if(countup.options.separator) val = val.toLocaleString('en');
    return val;
  }

  function countUpComplete(countup) { 
    countup.element.dispatchEvent(new CustomEvent('countUpComplete'));
    countup.animationTriggered = true;
  };

  function initCountUpSr(countup) { 
    countup.element.setAttribute('aria-hidden', 'true');
    var srValue = document.createElement('span');
    srValue.textContent = countup.finalValue;
    srValue.classList.add(countup.srClass);
    countup.element.parentNode.insertBefore(srValue, countup.element.nextSibling);
  };

  function getCountupStart(countup) {
    return countup.deltaValue > 0 ? countup.finalValue - countup.deltaValue : countup.initialValue;
  };

  function getValEaseOut(t, b, c, d) { 
    t /= d;
    return -c * t*(t-2) + b;
  };

  var extendProps = function () {
     var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;
  
    if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
      deep = arguments[0];
      i++;
    }
  
    var merge = function (obj) {
      for ( var prop in obj ) {
        if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
          // If deep merge and property is an object, merge properties
          if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
            extended[prop] = extend( true, extended[prop], obj[prop] );
          } else {
            extended[prop] = obj[prop];
          }
        }
      }
    };
  
    for ( ; i < length; i++ ) {
      var obj = arguments[i];
      merge(obj);
    }
  
    return extended;
  };

  CountUp.defaults = {
    element : '',
    separator : false,
    duration: 3000,
    decimal: false,
    initial: 0,
    delta: 0
  };

  window.CountUp = CountUp;

  var countUp = document.getElementsByClassName('js-countup');
 
  if( countUp.length > 0 ) {
    for( var i = 0; i < countUp.length; i++) {(function(i){
        var separator = (countUp[i].getAttribute('data-countup-sep')) ? countUp[i].getAttribute('data-countup-sep') : false,
        duration = (countUp[i].getAttribute('data-countup-duration')) ? countUp[i].getAttribute('data-countup-duration') : CountUp.defaults.duration,
        decimal = (countUp[i].getAttribute('data-countup-decimal')) ? countUp[i].getAttribute('data-countup-decimal') : false,
            initial = (countUp[i].getAttribute('data-countup-start')) ? countUp[i].getAttribute('data-countup-start') : 0,
        delta = (countUp[i].getAttribute('data-countup-delta')) ? countUp[i].getAttribute('data-countup-delta') : 0;
        new CountUp({element: countUp[i], separator : separator, duration: duration, decimal: decimal, initial: initial, delta: delta});
    })(i);}
  }
}());

