const $ = selector => document.querySelector(selector);
const preference = matchMedia('(prefers-reduced-motion: reduce)');
let paused = preference.matches;
const serviceField = $('select');
serviceField.add(new Option('Select a service',''));
services.forEach(service => serviceField.add(new Option(service.title,service.title)));
const rows = [...document.querySelectorAll('.service')];
const markers = rows.map((row,index) => {
  const marker = document.createElement('div');
  marker.id = 'slide-' + (index + 1);
  row.before(marker);
  row.querySelector('.serviceLink').onclick = () => {
    serviceField.value = services[index].title;
  };
  const controls = document.createElement('div');
  controls.className = 'slideControls';
  row.querySelector('.brief').append(controls);
  return marker;
});

function filter(group) {
  const visible = [];
  rows.forEach((row,index) => {
    row.hidden = group !== 'All services' && row.dataset.group !== group;
    markers[index].hidden = row.hidden;
    if (!row.hidden) visible.push(index);
  });
  visible.forEach((index,position) => {
    const row = rows[index];
    row.classList.toggle('reverse',position % 2 === 1);
    const controls = row.querySelector('.slideControls');
    const counter = document.createElement('span');
    counter.textContent = String(position + 1).padStart(2,'0') + ' / ' + String(visible.length).padStart(2,'0');
    controls.replaceChildren(counter);
    for (const [offset,label,symbol] of [[-1,'Previous service','←'],[1,'Next service','→']]) {
      const target = visible[position + offset];
      const button = document.createElement('button');
      button.textContent = symbol;
      button.setAttribute('aria-label',label);
      button.disabled = target === undefined;
      button.onclick = () => {
        const heading = rows[target].querySelector('h3');
        heading.tabIndex = -1;
        heading.focus({preventScroll:true});
        markers[target].scrollIntoView({behavior:paused?'instant':'smooth',block:'start'});
      };
      controls.append(button);
    }
  });
  document.querySelectorAll('.filters button').forEach(button => {
    button.setAttribute('aria-pressed',String(button.textContent === group));
  });
  requestPaint();
}
['All services','Operations','Growth','Creative','Technology'].forEach(group => {
  const button = document.createElement('button');
  button.textContent = group;
  button.onclick = () => filter(group);
  $('.filters').append(button);
});
let pendingPaint = 0;
const entrance = $('.entrance');
const stage = $('.entranceStage');
const curtain = $('.curtain');
const hero = $('.hero');
const header = $('header');
const typeScene = $('.introType');
const processWord = $('.processWord');
const zoomLetter = $('.zoomLetter');
const sentences = [];
document.querySelectorAll('.brief p,.brief li,#about p,#contact p,.heroCopy p').forEach(element => {
  const original = [...element.childNodes];
  element.replaceChildren();
  let sentence;
  function append(node) {
    if (!sentence) {
      sentence = document.createElement('span');
      sentence.className = 'sentence';
      element.append(sentence);
      sentences.push(sentence);
    }
    sentence.append(node);
  }
  original.forEach(node => {
    if (node.nodeType !== Node.TEXT_NODE) { append(node); return; }
    for (const part of node.textContent.match(/[^.!?]+[.!?]*\s*/g) || []) {
      append(document.createTextNode(part));
      if (/[.!?]\s*$/.test(part)) sentence = null;
    }
  });
});
function paintEntrance() {
  const distance = Math.max(1,entrance.offsetHeight-stage.offsetHeight);
  const progress = paused ? 1 : Math.min(1,Math.max(0,-entrance.getBoundingClientRect().top/distance));
  curtain.hidden = progress >= 1;
  if (!curtain.hidden) {
    const width = typeScene.offsetWidth;
    const height = typeScene.offsetHeight;
    const wordFocus = ease(progress/.42);
    const letterFocus = ease((progress-.36)/.38);
    const wordScale = curtain.clientWidth*.74/processWord.offsetWidth;
    const fullScale = Math.max(curtain.clientHeight/zoomLetter.offsetHeight,
      curtain.clientWidth/zoomLetter.offsetWidth)*1.8;
    const scale = Math.pow(wordScale,wordFocus) *
      Math.pow(fullScale/wordScale,ease((progress-.42)/.52));
    const wordX = processWord.offsetLeft + processWord.offsetWidth/2;
    const letterX = processWord.offsetLeft + zoomLetter.offsetLeft + zoomLetter.offsetWidth/2;
    const x = width/2 + wordFocus*(wordX-width/2) + letterFocus*(letterX-wordX);
    const wordY = processWord.offsetTop + processWord.offsetHeight*.52;
    const y = height/2 + wordFocus*(wordY-height/2);
    curtain.style.setProperty('--zoom',scale);
    curtain.style.setProperty('--panX',(width/2-x*scale)+'px');
    curtain.style.setProperty('--panY',(height/2-y*scale)+'px');
  }
  zoomLetter.style.opacity = String(1-ease((progress-.42)/.58));
  curtain.style.setProperty('--cover',String(1-ease((progress-.65)/.35)));
  curtain.style.setProperty('--cue',String(1-ease(progress/.3)));
  header.inert = hero.inert = !curtain.hidden;
}
$('#skipIntro').onclick = () => {
  window.scrollTo({top:window.scrollY+entrance.getBoundingClientRect().bottom-stage.offsetHeight,behavior:'instant'});
  paintEntrance();
  header.querySelector('a').focus({preventScroll:true});
};
function ease(value) {
  const t = Math.max(0,Math.min(value,1));
  return t*t*(3-2*t);
}
function paint() {
  pendingPaint = 0;
  paintEntrance();
  if (paused) return;
  const height = document.documentElement.clientHeight;
  const lines = sentences.map(line => ({line,bounds:line.getBoundingClientRect()}));
  lines.forEach(({line,bounds}) => {
    if (bounds.bottom < 0 || bounds.top > height) return;
    const alpha = ease((height-bounds.top)/Math.min(160,height*.22)) * ease(bounds.bottom/75);
    line.style.setProperty('--line',alpha.toFixed(3));
  });
  const positions = rows.filter(row => !row.hidden).map(row => ({
    row, bounds:row.getBoundingClientRect()
  }));
  const travel = Math.min(230,height*.32);
  positions.forEach(({row,bounds}) => {
    const entering = ease((height-bounds.top)/travel);
    const leaving = ease(bounds.bottom/travel);
    row.style.setProperty('--presence', (entering*leaving).toFixed(4));
    row.style.setProperty('--lift', ((leaving-entering)*22).toFixed(2)+'px');
  });
}
function requestPaint() {
  if (!pendingPaint) pendingPaint = requestAnimationFrame(paint);
}
window.addEventListener('scroll',requestPaint,{passive:true});
filter('All services');
new ResizeObserver(requestPaint).observe($('#serviceList'));
window.addEventListener('resize',requestPaint);
function motionState() {
  document.documentElement.classList.toggle('paused',paused);
  requestPaint();
}
preference.addEventListener('change',() => {paused = preference.matches; motionState()});
motionState();
$('form').onsubmit = async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const fields = Object.fromEntries(new FormData(form));
  if (!window.LORENTRIX_ENQUIRY_URL) {
    const subject = 'Lorentrix enquiry — ' + fields.service;
    const body = ['Name: ' + fields.name,'Work email: ' + fields.email,'Company: ' + fields.company,'Service: ' + fields.service,'','Project requirements:',fields.requirements].join('\n');
    window.location.href = 'mailto:lorentrix.web@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    $('#status').textContent = 'Send the draft from your email app. You can also email lorentrix.web@gmail.com directly.';
    return;
  }
  const submit = form.querySelector('[type=submit]');
  submit.disabled = true;
  try {
    const response = await fetch(window.LORENTRIX_ENQUIRY_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fields)});
    if(!response.ok) throw new Error();
    $('#status').textContent = 'Your enquiry has been sent.';
    form.reset();
  } catch { $('#status').textContent = 'Your enquiry could not be sent. Please try again.'; }
  finally { submit.disabled = false; }
};
if(window.LORENTRIX_ENQUIRY_URL) {
  $('form button').textContent = 'Send enquiry ↗';
  $('#status').textContent = 'Send your project details to Lorentrix.';
}
