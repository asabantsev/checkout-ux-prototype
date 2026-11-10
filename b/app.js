import { installLodgingInfo } from './lodging-info.js?v=square-photos';
import { assets } from './asset-map.js?v=square-photos';
import { PAYMENT_INFO } from './payment-info.js';
import { FINANCE_DEFAULTS, FINANCE_METHODS, FINANCE_INFO, financeIcon, financeDetails } from './financing.js?v=complete';
import { STEPS, ROUTES, FLIGHTS, PRESETS, VEHICLES, WISHES, COUNTRIES, DEMO_PROMO, priceCheckSeconds, transferSelected, sameDocument, presetOwner, freshState, selectedFlight, cardTotal, totals, matchingFlights, bookingErrors } from './model.js?v=price-countdown';

const KEY = 'level-travel-checkout-b-v1';
let state = freshState();
try {
  if (new URLSearchParams(location.search).has('reset')) sessionStorage.removeItem(KEY);
  const saved = JSON.parse(sessionStorage.getItem(KEY));
  if (saved?.version === 1 && saved.buyer && saved.tourists?.length === 2 && saved.services && FLIGHTS.every(f => saved.flightExtras?.[f.id])) state = saved;
} catch { /* A clean session remains usable if browser storage is unavailable. */ }
state.services = { ...freshState().services, ...state.services };
state.filters = { ...freshState().filters, ...state.filters };
const ui = { step: 0, modal: null, sections: { ...state.summarySections }, banner: true, pointsDraft: String(state.pointsDraft ?? (state.points || '')), paymentMethod: state.paymentMethod || 'sbp', card: { number: '', expiry: '', code: '' }, invalid: new Set() };
ui.rewardsTab = state.rewardsTab === 'promo' ? 'promo' : 'points';
ui.promoDraft = state.promoDraft || '';
ui.rewardsErrors = { points: '', promo: '' };
ui.afterPaymentOpen = false;
ui.openFilters = state.openFilters || {};
ui.paymentTab = state.paymentTab==='installments'?'installments':'now';
state.finance = {...FINANCE_DEFAULTS,...state.finance};
let modalTrigger = null;
ui.countryMenu = null;
ui.jointCountOpen = false;
const JOINT_COUNTS = [2, 3, 4];
ui.transferExpanded = { toHotel: false, toAirport: false };
ui.errors = {};
const FIELD_ERRORS = {
  required: 'Обязательное поле',
  email: 'Похоже, почта написана неверно',
  phone: 'Похоже, телефон написан неверно',
  date: 'Похоже, дата написана неверно',
  duplicate: 'Этот документ уже указан у 1-го туриста',
};
let countryTypeahead = '';
let countryTypedAt = 0;
const app = document.querySelector('#app');
const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function img(context, name, cls = '', alt = '', extra = '') {
  const src = assets[context]?.[name];
  if (!src) throw new Error(`Missing Figma asset: ${context}/${name}`);
  return `<img src="${src}" class="${cls}" alt="${esc(alt)}" ${extra}>`;
}
const icon = (name, cls = '') => img('booking-summary', name, `icon ${cls}`);
const quotedTransfer = f => f.id===state.selected&&state.services.transfer ? totals(state).additions.filter(([label])=>label.startsWith('Индивидуальный трансфер')).reduce((sum,[,price])=>sum+price,0) : 7764;
const quote = f => cardTotal(f,state.flightExtras[f.id],f.id===state.selected?state.services:undefined);
const chevron = (open = false) => img('booking-summary', 'imgChevron', `chevron ${open ? 'up' : ''}`);
const pending = name => `data-pending="${esc(name)}"`;
const switchButton = (checked, action, label, props = '') => `<button type="button" class="switch ${checked ? 'is-on' : ''}" role="switch" aria-checked="${checked}" aria-label="${esc(label)}" data-action="${action}" data-focus="${action}-${esc(label)}" ${props}><span></span></button>`;
function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Storage is optional. */ } }
function checkedStep(step) {
  if (step > 1) {
    const errors = bookingErrors(state);
    if (Object.keys(errors).length) {
      ui.errors = errors; ui.invalid = new Set(Object.keys(errors));
      return 1;
    }
  }
  return step;
}
function routeFromUrl() {
  const params = new URLSearchParams(location.search);
  ui.success=false;
  if(params.get('step')==='success'&&state.paymentResult&&state.selected){ui.step=3;ui.success=true;return;}
  const route = ROUTES.indexOf(params.get('step'));
  ui.step = Math.min(Math.max(0, route), state.visited);
  if (ui.step > 0 && !state.selected) ui.step = 0;
  const target = checkedStep(ui.step);
  if (target !== ui.step) {
    ui.step = target;
    const url = new URL(location.href); url.search = '?step=' + ROUTES[target];
    history.replaceState({ step: target }, '', url);
  }
}
function navigate(step, replace = false) {
  ui.success=false;
  ui.modal = null;
  ui.countryMenu = null;
  ui.jointCountOpen = false;
  const requested = Math.max(0, Math.min(step, state.visited));
  ui.step = checkedStep(requested);
  const url = new URL(location.href);
  url.search = ui.step ? '?step=' + ROUTES[ui.step] : '';
  history[replace ? 'replaceState' : 'pushState']({ step: ui.step }, '', url);
  render();
  window.scrollTo(0, 0);
  if (ui.step !== requested) document.querySelector('input[aria-invalid="true"],.gender-field.invalid input')?.focus();
  else document.querySelector('main h1')?.focus({ preventScroll: true });
}
function steps(current = ui.step) {
  return `<nav class="steps" aria-label="Этапы бронирования">${STEPS.map((label, i) => `${i ? '<span class="step-divider" aria-hidden="true">/</span>' : ''}<button type="button" class="step ${i === current ? 'active' : i < current ? 'done' : ''}" data-action="step" data-step="${i}" ${i === current ? 'aria-current="step"' : ''} ${i > state.visited || i === current ? 'disabled' : ''}>${i < current ? img('steps-completed','imgCheckMark','done-mark') : ''}${label}</button>`).join('')}</nav>`;
}
function header() {
  if (ui.step === 0) return `<header class="site-header flight-header" data-node-id="15961:64215">
    <div class="header-search-group">${img('flight-header', 'imgLogoEngOneLineFull', 'logo', 'Level.Travel')}<div class="header-search"><div class="header-tabs"><span class="selected">Туры</span><span>Отели</span></div><div class="search-static">${img('flight-header', 'imgSearch', 'icon')}<span>Анталья, Турция&nbsp; 13 ноя – 20 ноя&nbsp; 2 человека</span></div></div></div>
    <div class="header-items">${[['imgMessenger','Напишите нам'],['imgService','Сервисы'],['imgHeart','Мой список'],['imgHelp','Помощь']].map(([asset,label]) => `<div class="header-item">${img('flight-header', asset, 'header-icon')}<span>${label}</span>${asset === 'imgHeart' ? '<small class="list-count">3</small>' : ''}</div>`).join('')}<div class="header-item"><div class="cashback-head">876 ${img('flight-header','imgCashback','cashback-icon')}</div><span>Кешбэк</span></div><div class="avatar">${img('flight-header','imgSeagull','avatar-bird')}</div></div>
  </header>`;
  return `<header class="site-header" data-node-id="16169:24129">${img('booking-header','imgLogoEngOneLineFull','logo','Level.Travel')}<div class="checkout-header-items">${[['imgMessenger','Помощь 24/7'],['imgSearch','Новый поиск'],['imgProfile','Профиль']].map(([asset,label]) => `<span>${img('booking-header',asset,'icon')}${label}</span>`).join('')}</div></header>`;
}
function checkRow(group, value, label, price, type = 'checkbox') {
  const current = state.filters[group];
  const checked = Array.isArray(current) ? current.includes(value) : type === 'radio' ? current === value : !!current;
  return `<label class="filter-choice"><input type="${type}" name="filter-${group}" data-filter="${group}" data-focus="filter-${group}-${value}" value="${value}" ${checked ? 'checked' : ''}><span>${label}</span><span class="filter-price">${money(price)}</span></label>`;
}
const FILTER_TITLES={outTime:'Время вылета туда',backTime:'Время вылета обратно',arrival:'Дата прибытия туда',airlineOut:'Авиакомпания туда',airlineBack:'Авиакомпания обратно',moscow:'Аэропорты Москвы',destination:'Аэропорт Антальи',cabin:'Класс перелета',maxFlight:'Максимальное время полета'};
const clockText = value => String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');
const plural = (n,one,few,many) => n%100>=11&&n%100<=14?many:n%10===1?one:n%10>=2&&n%10<=4?few:many;
const durationText = value => {const d=Math.floor(value/1440),h=Math.floor(value%1440/60),m=value%60;return `${d?d+' '+plural(d,'день','дня','дней')+' ':''}${h} ${plural(h,'час','часа','часов')} ${m} ${plural(m,'минута','минуты','минут')}`;};
function filterRange(key) {
  const bounds=key==='outTime'?[35,1210]:key==='backTime'?[265,1385]:[0,1730];
  const values=key==='maxFlight'?[bounds[0],state.filters[key]]:state.filters[key];
  const text=key==='maxFlight'?durationText(values[1]):values.map(clockText).join(' — ');
  return `<div class="range-caption"><span data-range-caption="${key}">${text}</span><span class="filter-price">${money(Math.min(...FLIGHTS.map(quote)))}</span></div><div class="filter-range" data-range-track="${key}" style="--start:${(values[0]-bounds[0])/(bounds[1]-bounds[0])*100}%;--end:${(values[1]-bounds[0])/(bounds[1]-bounds[0])*100}%">${(key==='maxFlight'?[1]:[0,1]).map(i=>`<input type="range" class="filter-range-input" data-range="${key}" data-end="${i}" data-focus="range-${key}-${i}" min="${bounds[0]}" max="${bounds[1]}" step="5" value="${values[i]}" aria-label="${FILTER_TITLES[key]}${key==='maxFlight'?'':i?' — до':' — от'}" aria-valuetext="${key==='maxFlight'?durationText(values[i]):clockText(values[i])}">`).join('')}</div>`;
}
function expandedFilters() {
  return Object.entries(FILTER_TITLES).map(([key,title])=>{
    const open=!!ui.openFilters[key];let content='';
    if(open){
      if(['outTime','backTime','maxFlight'].includes(key))content=filterRange(key);
      else if(key==='arrival')content=checkRow(key,'13','13 ноя, пт',273151)+checkRow(key,'14','14 ноя, сб',210017);
      else if(key==='moscow')content=checkRow(key,'DME','Домодедово, DME',273151)+checkRow(key,'VKO','Внуково, VKO',210017);
      else if(key==='destination')content=checkRow(key,'AYT','Анталья, AYT',273151);
      else if(key==='cabin')content=checkRow(key,'economy','Экономкласс',210462,'radio')+checkRow(key,'business','Бизнес-класс',532614,'radio');
      else content=[['S7','S7 Airlines','imgAirlineLogo',273151],['Pegasus Airlines','Pegasus Airlines','imgAirlineLogo1',229050],['Победа','Победа','imgAirlineLogo2',237050]].map(([value,label,asset,price])=>`<label class="filter-choice airline-filter"><input type="checkbox" data-filter="${key}" data-focus="filter-${key}-${value}" value="${value}" ${state.filters[key].includes(value)?'checked':''}>${img('filter-time',asset,'filter-airline-logo')}<span>${label}</span><span class="filter-price">${money(price)}</span></label>`).join('');
    }
    return `<section class="extra-filter"><button type="button" class="filter-heading" data-action="filter-toggle" data-filter-key="${key}" data-focus="filter-heading-${key}" aria-expanded="${open}" aria-controls="filter-content-${key}">${title}${img('filter-time',open?'imgChevron1':'imgChevron','small-chevron')}</button><div class="extra-filter-content" id="filter-content-${key}" ${open?'':'hidden'}>${content}</div></section>`;
  }).join('');
}
function filters() {
  const group = (title, content) => `<section class="filter-group"><h3>${title}</h3>${content}</section>`;
  return `<aside class="filters" aria-label="Фильтры перелётов" data-node-id="15961:64404">
    ${group('Скорость подтверждения', checkRow('confirmation','instant','Моментальное подтверждение',210462,'radio') + checkRow('confirmation','quick','Быстрое подтверждение',275614,'radio') + checkRow('confirmation','all','Все туры',210462,'radio'))}
    ${group('Туроператор',checkRow('operator','level','Level.Travel',210462))}
    ${group('Пересадки',checkRow('connections','direct','Прямой перелёт',210462)+checkRow('connections','one','1 пересадка',244614))}
    ${group('Длительность пересадок',[['short','до 3 часов',275614],['medium','от 3 до 6 часов',275614],['long','от 6 до 12 часов',244614],['longest','больше 12 часов',254618]].map(v=>checkRow('duration',...v)).join(''))}
    ${group('Тип рейса',checkRow('flightType','block','Блочный рейс',273151)+checkRow('flightType','regular','Регулярный рейс',210017))}
    ${ui.banner ? `<div class="flight-banner"><button type="button" class="banner-body" data-action="flight-info" data-focus="flight-info"><span>Что такое регулярные, чартертные и блочные рейсы?</span>${img('flight-filters','imgPlane','banner-plane')}</button><button type="button" class="banner-close" data-action="dismiss-banner" aria-label="Скрыть подсказку">${img('flight-filters','imgXMark')}</button></div><div class="filter-divider" aria-hidden="true"></div>` : ''}
    ${group('С багажом',checkRow('baggage','all','Все',210050,'radio')+checkRow('baggage','included','С багажом',229050,'radio')+checkRow('baggage','20kg','С багажом от 20 кг',237050,'radio'))}
    ${group('Трансфер',checkRow('transfer','all','Все',210050,'radio')+checkRow('transfer','included','Трансфер включен',229050,'radio')+checkRow('transfer','paid','Доступен платный трансфер',237050,'radio'))}
    ${expandedFilters()}
  </aside>`;
}
function lodging(compact = false) {
  return `<div class="lodging-details ${compact ? 'compact' : ''}"><button type="button" class="lodging-item" data-lodging-info="hotel" data-focus="hotel-${compact?'summary':'preview'}">${img('lodging','imgFrame','hotel-photo','Отель Ozkaymak Falez')}<div><span class="muted">Отель</span><strong>Ozkaymak Falez Hotel · 5 звёзд</strong></div></button><button type="button" class="lodging-item" data-lodging-info="room" data-focus="room-${compact?'summary':'preview'}">${img('lodging','imgFrame1','hotel-photo','Стандартный номер')}<div><span class="muted">Номер и питание</span><strong>Стандартный с видом на окрестности · Ультра всё включено</strong></div></button></div>`;
}
function airlineImage(airline, cls = 'airline-logo') {
  return airline === 'S7' ? img('flight-card','imgAirlineLogo',cls,'S7 Airlines') : airline === 'Победа' ? img('flight-second','imgAirlineLogo',cls,'Победа') : img('flight-card','imgAirlineLogo1',cls,'Pegasus Airlines');
}
function flightLeg(f, back, extras) {
  const airline = back ? f.back : f.outbound, number = back ? f.backNumber : f.outboundNumber;
  const hand = back ? f.handBack : f.handOut;
  const baggage = extras[back ? 'baggageBack' : 'baggageOut'];
  const date = back ? '20 ноя, пт' : '13 ноя, пт';
  const earlyDeparture=Number((back?f.backTime:f.outTime).split(':')[0])<6;
  return `<div class="flight-leg"><div class="airline-line">${airlineImage(airline)}<span>${airline === 'S7' ? 'S7 Airlines' : airline} · Регулярный рейс ${number}, эконом</span></div><div class="flight-path"><div class="flight-end"><span class="flight-date">${date}</span><strong class="flight-time">${back ? f.backTime : f.outTime}</strong><span class="airport">${back ? 'Турция, Анталья, AYT' : 'Москва, ' + f.outAirport}</span></div><div class="flight-end arrival"><span class="flight-date">${back && f.backNextDay ? '21 ноя, сб' : date}</span><strong class="flight-time">${back ? f.backArrival : f.outArrival}</strong><span class="airport">${back ? 'Москва, ' + f.backAirport : 'Турция, Анталья, AYT'}</span></div><div class="flight-route-line ${back && f.transfer ? 'connecting' : ''}">${img('flight-card','imgLine','route-line')}${back && f.transfer ? img(f.id==='s7-pegasus-longest'?'route-longest':f.id==='s7-pegasus-long'?'flight-long-path':'flight-card','imgLine1',f.id==='s7-pegasus-longest'?'connection-line longest':f.id==='s7-pegasus-long'?'connection-line long':'connection-line') : ''}${back && f.transfer ? `<span class="transfer-caption">Пересадка Стамбул ${f.transfer}</span>` : ''}</div><span class="flight-duration">${back ? f.backDuration : '5 ч 10 м'} в пути</span></div><div class="baggage-badges"><span>${img('flight-card','imgCabin','badge-icon')}Ручная кладь${hand ? ' ' + hand : ''}</span><span>${img('flight-card',baggage ? 'imgLuggage1' : 'imgLuggage','badge-icon')}${baggage ? 'Багаж 20 кг' : 'Багажа нет'}</span>${earlyDeparture?`<span class="early-departure">${img('early-departure','imgSunHaze','badge-icon')}Ранний вылет</span>`:''}</div></div>`;
}
function flightCard(f) {
  const e = state.flightExtras[f.id];
  return `<article class="flight-card" data-flight="${f.id}" data-node-id="${f.id === FLIGHTS[0].id ? '16024:2985' : f.id === FLIGHTS[1].id ? '15961:65732' : ''}">${f.badge ? `<span class="flight-badge">${f.badge}</span>` : ''}<div class="flight-card-main">${flightLeg(f,false,e)}${flightLeg(f,true,e)}<div class="flight-extras"><div class="extra-choice">${img('flight-card','imgIcon','extra-icon')}<span>Индивидуальный трансфер</span><span class="extra-price">+ ${money(quotedTransfer(f))}</span>${switchButton(e.privateTransfer,'flight-transfer','Индивидуальный трансфер '+f.id,`data-id="${f.id}"`)}</div><div class="extra-choice">${img('flight-card','imgLuggage1','extra-icon')}<span>Багаж</span><span class="extra-price">+ 9 180 ₽</span>${switchButton(e.baggageOut && e.baggageBack,'flight-baggage','Багаж '+f.id,`data-id="${f.id}"`)}</div></div></div><div class="flight-offer"><div class="offer-info"><strong class="offer-price">${money(quote(f))}</strong>${[['imgIcon1','Тур от Level.Travel'],['imgIcon2','7 ночей в отеле'],['imgTransfer',e.privateTransfer ? 'Индивидуальный трансфер' : 'Групповой трансфер'],['imgInsurance','Медицинская страховка'],['imgIcon3','Моментальное подтверждение'],['imgCashback','Кешбэк + 1 784']].map(([asset,text])=>`<div>${img('flight-card',asset==='imgTransfer'&&e.privateTransfer?'imgIcon':asset,'offer-icon')}<span>${text}</span></div>`).join('')}</div><div class="offer-buttons"><button type="button" class="button secondary small" data-action="details" data-id="${f.id}" data-focus="details-${f.id}">Детали тура</button><button type="button" class="button primary small" data-action="choose-flight" data-id="${f.id}">Начать бронирование</button></div></div></article>`;
}
function flightResults() {
  const flights=matchingFlights(state);
  return flights.length?flights.map(flightCard).join(''):`<section class="flights-empty" aria-live="polite"><div><h2>Ни один перелет не попал под фильтры</h2><p>Под ваши фильтры не подошло ни одного предложения.<br>Поищите на другие даты или просто сбросьте фильтр</p></div><button type="button" class="button primary" data-action="reset-filters">Сбросить все фильтры</button></section>`;
}
function flightsPage() {
  return `<div class="flights-layout">${filters()}<div class="flight-results"><section class="accommodation-preview" data-node-id="16024:2755"><div><h3>Проживание</h3>${lodging()}</div><div class="trip-preview"><h3>Тур</h3>${[['imgIcon','Анталья, Турция'],['imgCalendar','13 ноя, пт — 20 ноя, пт'],['imgTourist','2 взрослых']].map(([asset,text])=>`<div>${img('lodging',asset,'icon')}${text}</div>`).join('')}</div></section><div class="flights-list">${flightResults()}</div></div></div>`;
}
function field(path, label, { hint = '', required = true, inputMode = 'text', type = 'text', maxLength = 100, pattern = '', autocomplete = 'off' } = {}) {
  const value = path.split('.').reduce((obj,key)=>obj?.[key],state) || '';
  const invalid = ui.invalid.has(path);
  const error = invalid ? FIELD_ERRORS[ui.errors[path]] || '' : '';
  const key = path.replaceAll('.', '-');
  const describedBy = error ? 'error-' + key : hint ? 'hint-' + key : '';
  return `<div class="field-wrap ${error ? 'has-error' : ''}"><label class="field ${invalid ? 'invalid' : ''}"><input name="${path}" data-field="${path}" value="${esc(value)}" placeholder=" " type="${type}" inputmode="${inputMode}" ${required ? 'required' : ''} maxlength="${maxLength}" ${pattern ? `pattern="${pattern}"` : ''} autocomplete="${autocomplete}" aria-label="${label}" ${invalid ? 'aria-invalid="true"' : ''} ${describedBy ? `aria-describedby="${describedBy}"` : ''}><span class="field-label">${label}</span></label><span class="field-error" id="error-${key}" ${error ? '' : 'hidden'}>${error}</span>${hint ? `<span class="field-hint" id="hint-${key}" ${error ? 'hidden' : ''}>${hint}</span>` : ''}</div>`;
}
function refreshFieldFeedback(input) {
  const path = input.dataset.field;
  const code = bookingErrors(state)[path];
  if (code) ui.errors[path] = code;
  else { ui.invalid.delete(path); delete ui.errors[path]; }
  const invalid = ui.invalid.has(path), error = invalid ? FIELD_ERRORS[code] || '' : '';
  const wrap = input.closest('.field-wrap');
  wrap.classList.toggle('has-error', Boolean(error));
  input.closest('.field').classList.toggle('invalid', invalid);
  if (invalid) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  const errorNode = wrap.querySelector('.field-error'), hint = wrap.querySelector('.field-hint');
  errorNode.textContent = error; errorNode.hidden = !error;
  if (hint) hint.hidden = Boolean(error);
  const description = error ? errorNode.id : hint?.id;
  if (description) input.setAttribute('aria-describedby', description); else input.removeAttribute('aria-describedby');
}
function countrySelect(index) {
  const open=ui.countryMenu===index;
  const country=state.tourists[index].citizenship;
  return `<div class="country-selector"><button type="button" class="country-field ${open?'open':''}" role="combobox" aria-label="Гражданство ${index+1}-го туриста" aria-expanded="${open}" aria-controls="countries-${index}" aria-haspopup="listbox" data-action="country-toggle" data-tourist="${index}" data-focus="country-${index}"><span><small>Гражданство</small>${esc(country)}</span>${img(open?'citizenship':'tourist','imgChevron','chevron')}</button>${open?`<div class="country-menu" role="listbox" id="countries-${index}" aria-label="Страна гражданства">${COUNTRIES.map((label,i)=>`<button type="button" class="country-option ${country===label?'selected':''}" role="option" aria-selected="${country===label}" tabindex="-1" data-action="country-select" data-tourist="${index}" data-country="${i}">${label}</button>`).join('')}</div>`:''}</div>`;
}
function closeCountry(restoreFocus=false) {
  if(ui.countryMenu===null)return;
  const index=ui.countryMenu;ui.countryMenu=null;
  const button=app.querySelector(`[data-focus="country-${index}"]`);
  app.querySelector('.country-menu')?.remove();
  if(button){button.classList.remove('open');button.setAttribute('aria-expanded','false');button.querySelector('img').src=assets.tourist.imgChevron;}
  if(restoreFocus)button?.focus({preventScroll:true});
}
function focusCountry(index) {
  const option=app.querySelectorAll('.country-menu .country-option')[index];
  option?.focus({preventScroll:true});
  option?.scrollIntoView({block:'nearest',inline:'nearest'});
}
function touristPresets(index) {
  return PRESETS.map((p,i)=>{
    const owner=presetOwner(state,index,p),disabled=owner!==-1,selected=sameDocument(state.tourists[index],p)&&!disabled,tip=`preset-tip-${index}-${i}`;
    return `<span class="preset-wrap" ${disabled?`tabindex="0" aria-describedby="${tip}"`:''}><button type="button" class="preset ${selected?'selected':''}" data-action="preset" data-tourist="${index}" data-preset="${i}" data-focus="preset-${index}-${i}" ${disabled?`disabled aria-describedby="${tip}"`:''}><small>Загранпаспорт</small><strong>${p.label}</strong></button>${disabled?`<span class="preset-tooltip" id="${tip}" role="tooltip">Уже выбран как ${owner+1}-й турист</span>`:''}</span>`;
  }).join('');
}
function updateDocumentFeedback() {
  app.querySelectorAll('.tourist-presets').forEach(el=>el.innerHTML=touristPresets(Number(el.dataset.tourist)));
  app.querySelectorAll('[data-field$=".passport"][aria-invalid="true"]').forEach(refreshFieldFeedback);
}
function formHasData(section) {
  const values=section.split('.').reduce((obj,key)=>obj[key],state);
  const defaults=section==='buyer'?freshState().buyer:freshState().tourists[0];
  return Object.keys(values).some(key=>String(values[key]??'').trim()!==String(defaults[key]??'').trim());
}
function updateClearButtons() {
  app.querySelectorAll('[data-action="clear-form"]').forEach(button=>{button.hidden=!formHasData(button.dataset.section);});
}
function clearFormButton(section, label) {
  return `<button type="button" class="clear-form" ${formHasData(section)?'':'hidden'} data-action="clear-form" data-section="${section}" data-focus="clear-${section}" aria-label="Очистить форму ${label}">Очистить форму</button>`;
}
function touristForm(index) {
  const t = state.tourists[index], prefix = `tourists.${index}`;
  return `<section class="panel tourist-form" aria-labelledby="tourist-title-${index}"><div class="tourist-heading"><div class="form-heading-row"><h2 id="tourist-title-${index}">${index + 1}-й турист</h2>${clearFormButton(`tourists.${index}`,`${index + 1}-го туриста`)}</div><p class="muted">1 номер · Взрослый · Загранпаспорт</p>${index === 0 ? `<p class="passport-warning">${img('tourist','imgWarningTriangle','icon')}<span>Заполняйте данные туристов строго по паспорту. За исправление ошибки в готовых документах туроператор может запросить доплату</span></p>` : ''}</div><div class="tourist-presets" data-tourist="${index}">${touristPresets(index)}</div><div class="passport-fields"><h3>Данные загранпаспорта</h3><div class="form-row">${countrySelect(index)}<fieldset class="gender-field ${ui.invalid.has(prefix+'.gender') ? 'invalid' : ''}" aria-label="Пол ${index+1}-го туриста" ${ui.invalid.has(prefix+'.gender') ? 'aria-invalid="true"' : ''}>${[['male','Муж','imgTourist'],['female','Жен','imgTourist1']].map(([value,label,asset])=>`<label class="${t.gender === value ? 'checked' : ''}"><input type="radio" name="${prefix}.gender" data-field="${prefix}.gender" value="${value}" ${t.gender === value ? 'checked' : ''} required>${ui.invalid.has(prefix+'.gender') ? img('booking-errors',value==='male'?'imgTourist1':'imgTourist2','gender-icon') : img(t.gender===value ? value==='male'?'tourist-filled':'tourist-female':'tourist',asset,'gender-icon')}<span>${label}</span></label>`).join('')}</fieldset></div><div class="form-row">${field(prefix+'.lastName','Фамилия')}${field(prefix+'.firstName','Имя')}</div><div class="form-row thirds">${field(prefix+'.birth','Дата рождения',{inputMode:'numeric',maxLength:10,pattern:'[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}'})}${field(prefix+'.passport','Номер документа',{maxLength:20})}${field(prefix+'.expiry','Срок действия документа',{inputMode:'numeric',maxLength:10,pattern:'[0-9]{2}\\.[0-9]{2}\\.[0-9]{4}'})}</div></div></section>`;
}
function bookingPage() {
  return `<div class="checkout-layout"><form id="booking-form" class="main-column" novalidate><section class="panel buyer-form" data-node-id="16030:3197"><div class="buyer-heading"><div class="form-heading-row"><h2>Покупатель</h2>${clearFormButton('buyer','покупателя')}</div><p class="muted">Введите данные покупателя. Сюда придет вся информация о туре</p></div><div class="form-row">${field('buyer.firstName','Имя',{autocomplete:'given-name'})}${field('buyer.lastName','Фамилия',{autocomplete:'family-name'})}</div><div class="form-row">${field('buyer.email','Почта',{type:'email',hint:'Для входа и получения документов по туру',autocomplete:'email'})}${field('buyer.phone','Телефон',{type:'tel',hint:'Для быстрого входа и экстренной связи',autocomplete:'tel'})}</div></section>${touristForm(0)}${touristForm(1)}</form><aside id="order-sidebar" class="order-sidebar">${summary()}</aside></div>`;
}
function sectionOpen(key, defaultValue = false) { return ui.sections[ui.step+'-'+key] ?? defaultValue; }
function summarySection(key, label, content, defaultOpen = ui.step === 3) {
  const open = sectionOpen(key,defaultOpen || ui.step === 3);
  return `<section class="summary-section"><h3><button type="button" data-action="accordion" data-section="${key}" data-focus="accordion-${key}" aria-expanded="${open}" aria-controls="summary-${key}">${label}${chevron(open)}</button></h3><div id="summary-${key}" class="summary-section-content" ${open ? '' : 'hidden'}>${content}</div></section>`;
}
function summaryTour(f, modal = false) {
  const transfer = modal ? state.flightExtras[f.id].privateTransfer : transferSelected(state.services);
  const rows = [['imgTour','Тур от Level.Travel'],['imgPin','Анталья, Турция'],['imgCalendar','13 ноя, пт — 20 ноя, пт'],['imgInstant','Моментальное подтверждение'],['imgTourist','2 взрослых'],['imgInsurance','Страховка включена'],['imgTransfer',transfer ? 'Индивидуальный трансфер' : 'Групповой трансфер'],['imgHotel','7 ночей в отеле']];
  return `<div class="summary-tour">${rows.map(([asset,text])=>`<div>${asset==='imgTransfer'&&transfer?img('modal-transfer','imgPrivateTransfer','icon'):icon(asset)}<strong>${text}</strong></div>`).join('')}</div>`;
}
function summaryFlight(f, back) {
  const ctx = back ? 'summary-return' : 'summary-outbound';
  const hand = back ? f.handBack : f.handOut;
  const added = state.flightExtras[f.id][back ? 'baggageBack' : 'baggageOut'];
  return `<div class="summary-flight"><div class="summary-airline">${airlineImage(back ? f.back : f.outbound,'summary-airline-logo')}<div><strong>${back ? f.back : f.outbound === 'S7' ? 'S7 Airlines' : f.outbound}</strong><p class="muted">Регулярный рейс ${back ? f.backNumber : f.outboundNumber} · Эконом · ${back && f.transfer ? '1 пересадка' : 'Прямой'} · ${back ? f.backDuration : '5 ч 10 м'} в пути</p></div></div><div class="summary-flight-row">${img(ctx,'imgPlane','icon')}<div><strong>${back ? f.backTime : f.outTime}, ${back ? '20' : '13'} ноя, пт</strong><p class="muted">${back ? 'Анталья, Анталья, AYT' : 'Москва, '+f.outAirport}</p></div></div>${back && f.transfer ? `<div class="summary-flight-row">${img(ctx,'imgFrame','icon')}<div><strong>Пересадка, ${f.transfer}</strong><p class="muted">Стамбул, Сабиха Гёкчен, SAW</p></div></div>` : ''}<div class="summary-flight-row">${img(ctx,'imgPlane1','icon')}<div><strong>${back ? f.backArrival : f.outArrival}, ${back ? f.backNextDay ? '21 ноя, сб' : '20 ноя, пт' : '13 ноя, пт'}</strong><p class="muted">${back ? 'Москва, '+f.backAirport : 'Анталья, Анталья, AYT'}</p></div></div><div class="summary-flight-row">${img(ctx,'imgCabin','icon')}<div><strong>Ручная кладь${hand ? ' '+hand : ''}</strong><p class="muted">1 место${hand ? ' до '+hand+'/чел.' : '/чел.'}${!back && hand ? ' не более 55x40x23 см' : ''}</p></div></div><div class="summary-flight-row ${added ? '' : 'pale'}">${added?img(back?'modal-return':'modal-outbound','imgLuggage1','icon'):img(ctx,'imgLuggage','icon')}<strong>${added ? 'Багаж 20 кг' : 'Багажа нет'}</strong></div></div>`;
}
function touristsSummary() {
  return state.tourists.map(t=>`<div class="summary-person"><strong>${esc([t.firstName,t.lastName].filter(Boolean).join(' '))}</strong><p class="muted">${[t.gender ? t.gender === 'male' ? 'Муж.' : 'Жен.' : '',t.birth,t.passport,t.expiry].filter(Boolean).map(esc).join(' · ')}</p></div>`).join('');
}
function additionalSummary() {
  const s=state.services;
  return `${s.joint ? `<div><strong>Совместный заказ</strong><p class="muted">${s.jointType === 'first' ? 'Первый заказ · '+s.jointCount+' заказа' : 'Дополнительные заказы'+(s.jointOrder ? ' · '+esc(s.jointOrder) : '')}</p></div>` : ''}${s.wishes ? `<div><strong>Пожелания к заказу</strong><p class="muted">${s.selectedWishes.map(i=>esc(WISHES[i])).join('. ')}${s.comment ? '. '+esc(s.comment) : ''}</p></div>` : ''}`;
}
function priceBreakdown(t) {
  return `<div class="price-rows"><div><span class="muted">Цена тура</span><strong>${money(t.flight)}</strong></div><div><span class="muted">Доплаты и сборы</span><strong>0 ₽</strong></div>${t.additions.map(([label,price])=>`<div><span class="muted">${label}</span><strong>${money(price)}</strong></div>`).join('')}${t.points ? `<div><span class="muted">Баллы Level.Travel</span><strong>− ${money(t.points)}</strong></div>` : ''}${t.promoDiscount ? `<div><span class="muted">Промокод</span><strong>− ${money(t.promoDiscount)}</strong></div>` : ''}<div><span class="muted">Кешбэк</span><strong>+ ${new Intl.NumberFormat('ru-RU').format(t.cashback)}</strong></div></div>`;
}
function priceTimerText() {
  const seconds=priceCheckSeconds(state.priceCheckStartedAt);
  return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}
function timer() { return `<p class="price-timer">${icon('imgClock')}<span>Проверка цены через <span data-timer>${priceTimerText()}</span></span></p>`; }
function modalPriceBreakdown(f) {
  const extras=state.flightExtras[f.id],rows=[['Стоимость тура',f.price]];
  if(extras.baggageOut)rows.push(['Багаж на перелёт туда',4590]);
  if(extras.baggageBack)rows.push(['Багаж на перелёт обратно',4590]);
  if(extras.privateTransfer)rows.push(['Индивидуальный трансфер',quotedTransfer(f)]);
  return `<div class="price-rows">${rows.map(([label,price])=>`<div><span class="muted">${label}</span><strong>${money(price)}</strong></div>`).join('')}</div>`;
}
function summary({ modalFlight = null } = {}) {
  const f = modalFlight || selectedFlight(state), t = totals(state), isModal = !!modalFlight;
  let sections = summarySection('tour','Тур',summaryTour(f,isModal),true) + summarySection('accommodation','Проживание',lodging(true),isModal);
  if (!isModal) {
    if (ui.step === 1) sections += summarySection('flights','Перелёт',summaryFlight(f,false)+summaryFlight(f,true));
    else sections += summarySection('outbound','Перелёт туда',summaryFlight(f,false)) + summarySection('return','Перелёт обратно',summaryFlight(f,true)) + summarySection('tourists','Туристы',touristsSummary()) + summarySection('buyer','Покупатель',`<strong>${esc(state.buyer.firstName+' '+state.buyer.lastName)}</strong><p class="muted">${esc(state.buyer.email)} · ${esc(state.buyer.phone)}</p>`);
    if (ui.step === 3) sections += summarySection('additional','Дополнительно',additionalSummary());
  }
  const modalTotal = quote(f);
  sections += summarySection('price','Стоимость',isModal ? modalPriceBreakdown(f) : priceBreakdown(t),isModal);
  const total = isModal ? modalTotal : t.total;
  const action = isModal ? 'choose-flight' : ui.step === 1 ? 'booking-next' : 'services-next';
  const label = isModal ? 'Начать бронирование' : ui.step === 1 ? 'Дальше' : 'Перейти к оплате';
  return `<div class="summary-card">${sections}<div class="summary-total"><strong>Итого</strong><strong class="total-amount">${money(total)}</strong></div></div>${ui.step !== 3 || isModal ? `<button type="${ui.step === 1 && !isModal ? 'submit' : 'button'}" ${ui.step === 1 && !isModal ? 'form="booking-form"' : ''} class="button primary next-button" data-action="${action}" ${isModal ? `data-id="${f.id}"` : ''}>${label}</button>` : ''}${timer()}`;
}
function serviceIcon(name) {
  if (name === 'transfer') return `<span class="service-icon">${img('service-transfer','imgImage','service-raster')}</span>`;
  if (name === 'priority') return `<span class="service-icon priority-icon">${img('icon-priority','imgImage')}</span>`;
  if (name === 'flowers') return `<span class="service-icon">${img('icon-flowers','imgImage','service-raster')}</span>`;
  if (name === 'insurance') return `<span class="service-icon insurance-icon">${img('icon-insurance','imgImage')}</span>`;
  if (name === 'joint') return `<span class="service-icon joint-icon">${img('icon-joint','imgImage','joint-base')}${img('icon-joint','imgVector','joint-tint')}</span>`;
  return `<span class="service-icon wishes-icon">${img('icon-wishes','imgImage','heart-base')}${img('icon-wishes','imgVector','heart-vector')}${img('icon-wishes','imgVector','heart-vector')}${img('icon-wishes','imgVector1','heart-vector heart-highlight')}</span>`;
}
function serviceCard(key, title, description, price = '', extra = '', alwaysExtra = false) {
  const enabled=state.services[key];
  return `<section class="service-card" data-service="${key}">${serviceIcon(key)}<div class="service-copy"><h3>${title}</h3><p>${description}</p>${(enabled || alwaysExtra) && extra ? `<div class="service-extra">${extra}</div>` : ''}</div><div class="service-price-switch">${price ? `<strong>${price}</strong>` : ''}${switchButton(enabled,'service-toggle',title,`data-service="${key}"`)}</div></section>`;
}
function transferOptions(direction,label) {
  const expanded=ui.transferExpanded[direction] || state.services[direction] >= 3;
  const vehicles=expanded ? VEHICLES : VEHICLES.slice(0,3);
  return `<div class="vehicle-options" data-transfer-direction="${direction}"><strong>${label}</strong><div class="vehicle-list" id="vehicles-${direction}">${vehicles.map((v,i)=>`<label class="vehicle-choice"><input type="checkbox" data-vehicle="${direction}" data-focus="vehicle-${direction}-${i}" value="${i}" ${state.services[direction]===i ? 'checked' : ''}><span>${v.name}</span><span class="muted">+ ${money(v.price)}</span></label>`).join('')}</div>${expanded ? '' : `<button type="button" class="more-vehicles" data-action="expand-transfer" data-direction="${direction}" aria-controls="vehicles-${direction}" aria-expanded="false">Показать ещё 5 вариантов ${img('service-transfer','imgChevron1','tiny-chevron')}</button>`}</div>`;
}
function jointCountSelect() {
  const open=ui.jointCountOpen, count=state.services.jointCount;
  return `<div class="joint-count-selector"><button type="button" class="joint-count ${open?'open':''}" role="combobox" aria-label="Общее число заказов" aria-expanded="${open}" aria-controls="joint-count-options" aria-haspopup="listbox" data-action="joint-count-toggle" data-focus="joint-count"><span><small>Общее число заказов</small><span>${count} заказа</span></span>${img(open?'citizenship':'tourist','imgChevron','chevron')}</button>${open?`<div class="joint-count-menu" role="listbox" id="joint-count-options" aria-label="Количество заказов">${JOINT_COUNTS.map(n=>`<button type="button" class="joint-count-option ${count===n?'selected':''}" role="option" aria-selected="${count===n}" tabindex="-1" data-action="joint-count-select" data-count="${n}">${n} заказа</button>`).join('')}</div>`:''}</div>`;
}
function closeJointCount(restoreFocus=false) {
  if(!ui.jointCountOpen)return;
  ui.jointCountOpen=false;
  const button=app.querySelector('[data-focus="joint-count"]');
  app.querySelector('.joint-count-menu')?.remove();
  if(button){button.classList.remove('open');button.setAttribute('aria-expanded','false');button.querySelector('img').src=assets.tourist.imgChevron;}
  if(restoreFocus)button?.focus({preventScroll:true});
}
function focusJointCount(index) {
  app.querySelectorAll('.joint-count-option')[index]?.focus({preventScroll:true});
}
function servicesPage() {
  const s=state.services;
  const joint=`<div class="joint-choices" role="radiogroup" aria-label="Вариант совместного заказа">
    <label class="joint-first"><input type="radio" name="joint-type" value="first" data-joint-type data-focus="joint-first" ${s.jointType==='first'?'checked':''}><span>Первый заказ</span></label>
    ${s.jointType==='first' ? jointCountSelect() : ''}
    <label class="joint-other"><input type="radio" name="joint-type" value="additional" data-joint-type data-focus="joint-additional" ${s.jointType==='additional'?'checked':''}><span>Дополнительные заказы</span></label>
    ${s.jointType==='additional' ? `<div class="joint-order"><input class="joint-order-input" type="text" inputmode="numeric" data-joint-order data-focus="joint-order" value="${esc(s.jointOrder)}" placeholder="Номер первого заказа" autocomplete="off" aria-label="Номер первого заказа"></div>` : ''}
  </div>`;
  const wishes=`<p>Мы не можем гарантировать выполнение пожеланий, но обязательно передадим ваш комментарий туроператору при бронировании</p><div class="wish-options">${WISHES.map((w,i)=>`<label><input type="checkbox" data-wish="${i}" ${s.selectedWishes.includes(i)?'checked':''}>${w}</label>`).join('')}</div><textarea data-comment aria-label="Другие пожелания к заказу" placeholder="Есть какие-либо другие пожелания? Напишите здесь" maxlength="2000">${esc(s.comment)}</textarea>`;
  const insurance=`<button type="button" class="text-link" data-excluded="insurance-pdf">Полные условия</button><p>Приобретая полис по программе "Страховка от невыезда" вы подтверждаете ознакомление с <a href="#" class="text-link inline" data-excluded="legal-document">ключевым информационным документом и с условиями страхования</a>.</p>`;
  return `<div class="checkout-layout"><div class="main-column">
    ${serviceCard('transfer','Индивидуальный трансфер','Быстрее, комфортнее и безопаснее группового. Идеально для поездки с ребенком','от '+money(Math.min(...VEHICLES.map(v=>v.price))),transferOptions('toHotel','В отель')+transferOptions('toAirport','В аэропорт'))}
    ${serviceCard('priority','Приоритетное обслуживание','Ваши вопросы до и во время поездки получают приоритетный статус, а это означает ускоренную работу и минимальное время ответа 24/7. С этой опцией можно оперативно вносить изменения, добавлять услуги (продление проживания, замена билетов) и быстро получать поддержку в любых нестандартных ситуациях (в отеле, в случае опоздания на рейс и других). «Приоритетное обслуживание» даёт вам уверенность и спокойствие в поездке.','949 ₽')}
    ${serviceCard('insurance','Страховка от невыезда','Страховая компания компенсирует стоимость тура, если вы вынуждены вернуться, не сможете полететь из-за болезни у вас или ваших родственников (кроме короновирусной инфекции), чрезвычайного положения и других факторов. Максимальная страховая сумма по полису равна сумме тура, но не более 500 000 рублей на тур.','7 886 ₽',insurance,true)}
    ${serviceCard('flowers','Букет из 11 роз в аэропорту','Цветы с доставкой в аэропорт','10 084 ₽')}
    ${serviceCard('joint','Совместный заказ','Отель совместно с другим заказом.<br>Если у вас несколько заказов, мы постараемся сделать всё, чтобы вам было удобнее проводить время вместе','',joint)}
    ${serviceCard('wishes','Пожелания к заказу','Нужно добавить какую-либо информацию к заказу?','',wishes)}
  </div><aside id="order-sidebar" class="order-sidebar">${summary()}</aside></div>`;
}
function cardField(key,label,maxLength,inputMode='numeric') {
  return `<label class="field"><input type="text" data-card="${key}" value="${esc(ui.card[key])}" placeholder=" " inputmode="${inputMode}" maxlength="${maxLength}" autocomplete="off" aria-label="${label}"><span class="field-label">${label}</span></label>`;
}
function rewardInput(kind,label,value) {
  const error=ui.rewardsErrors[kind];
  return `<label class="field rewards-field ${error?'invalid':''}"><input data-${kind} data-focus="rewards-input-${kind}" value="${esc(value)}" type="text" inputmode="${kind==='points'?'numeric':'text'}" placeholder=" " aria-label="${label}" ${error?`aria-invalid="true" aria-describedby="reward-error-${kind}"`:''} maxlength="${kind==='points'?9:100}" autocomplete="off" spellcheck="false"><span class="field-label">${label}</span></label>`;
}
function rewardForm(kind,label,value,button) {
  const error=ui.rewardsErrors[kind];
  return `<form id="${kind}-form" class="rewards-form" novalidate><div class="rewards-row">${rewardInput(kind,label,value)}<button class="button primary" type="submit">${button}</button></div><span class="rewards-error" id="reward-error-${kind}" role="alert" ${error?'':'hidden'}>${error}</span></form>`;
}
function setRewardsError(kind,message) {
  ui.rewardsErrors[kind]=message;
  const form=app.querySelector(`#${kind}-form`);
  if(!form)return;
  const input=form.querySelector('input'), error=form.querySelector('.rewards-error');
  input.closest('.field').classList.toggle('invalid',!!message);
  if(message){input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby',error.id);}
  else {input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby');}
  if(error.textContent!==message)error.textContent=message;
  error.hidden=!message;
}
function pointsError() {
  if(!ui.pointsDraft)return FIELD_ERRORS.required;
  return Number(ui.pointsDraft)>383?'Не более 383 баллов':'';
}
function rewardsPanel(t) {
  if(t.points || t.promoDiscount){
    const promo=!!t.promoDiscount, amount=promo?t.promoDiscount:t.points;
    return `<section class="payment-panel points-used"><div class="points-check">${img('payment-points-used','imgCheckMark')}</div><h3>${promo?'Промокод активирован':'Баллы использованы'}</h3><p>Вы сэкономили ${money(amount)}<br>${money(t.subtotal)} → ${money(t.total)}</p><button type="button" class="button secondary" data-action="${promo?'remove-promo':'remove-points'}">Не использовать ${promo?'промокод':'баллы'}</button></section>`;
  }
  const promo=ui.rewardsTab==='promo';
  const content=promo ? `<p>После активации стоимость заказа будет уменьшена на номинальную стоимость промокода или сертификата. К одному заказу можно применить только один сертификат или промокод.</p>${rewardForm('promo','Промокод или сертификат',ui.promoDraft,'Активировать')}` : `<p>Укажите, сколько баллов хотите списать — стоимость заказа уменьшится на эту сумму. Баллы начисляются за каждое завершённое бронирование и активируются в первый день поездки.</p><p><strong>У вас 383 балла. 1 балл = 1 ₽</strong></p>${rewardForm('points','Сколько баллов потратить?',ui.pointsDraft,'Потратить')}`;
  return `<section class="payment-panel points-panel"><h3>Промокод, сертификат или баллы</h3><div class="tabs" role="tablist" aria-label="Скидка к заказу">${[['points','Баллы Level.Travel',promo?'imgCashback1':'imgCashback'],['promo','Промокод или сертификат',promo?'imgGift1':'imgGift']].map(([id,label,asset])=>`<button type="button" id="rewards-tab-${id}" class="tab ${ui.rewardsTab===id?'selected':''}" role="tab" aria-selected="${ui.rewardsTab===id}" aria-controls="rewards-panel" tabindex="${ui.rewardsTab===id?0:-1}" data-action="rewards-tab" data-rewards-tab="${id}" data-focus="rewards-${id}">${img('promo',asset,'tab-icon')}${label}</button>`).join('')}</div><div class="rewards-content" role="tabpanel" id="rewards-panel" aria-labelledby="rewards-tab-${ui.rewardsTab}">${content}</div></section>`;
}
function afterPaymentPanel() {
  const open=ui.afterPaymentOpen;
  const details=[
    ['imgImage1','after-check','После оплаты','После оплаты отправляем заказ туроператору, чтобы проверить наличие мест в отеле и билетов на рейс. Если всё в порядке, переводим ему деньги, а вам сообщаем о подтверждении и высылаем чек. Если мест нет, предложим альтернативу или сразу вернем всю сумму.'],
    ['imgImage2','after-documents','Документы','Все документы (ваучер на проживание, билеты и страховка) появятся в личном кабинете за пару дней до вылета — возможно, немного раньше. Мы также отправим их на вашу почту. Если что-то изменится, документы автоматически обновятся.'],
    ['imgImage3','after-support','Поддержка','Level.Travel на связи 24/7. Если возникнут вопросы или понадобится помощь — пишите нам в мессенджерах в любое время. Перед путешествием напомним о рейсе, а в конце отпуска подскажем, когда пора собираться домой.'],
  ];
  return `<section class="after-payment-panel"><button type="button" class="after-payment" data-action="after-payment" data-focus="after-payment" aria-expanded="${open}" aria-controls="after-payment-content"><span class="after-payment-icon">${img('after-payment','imgImage','after-payment-image')}</span><strong>Что будет после оплаты?</strong>${img('after-payment',open?'imgChevron1':'imgChevron','chevron')}</button><div id="after-payment-content" class="after-payment-content" ${open?'':'hidden'}>${details.map(([asset,cls,title,description])=>`<div class="after-payment-detail"><span class="after-detail-icon ${cls}">${img('after-payment',asset)}</span><div class="after-detail-copy"><h3>${title}</h3><p>${description}</p></div></div>`).join('')}</div></section>`;
}
function financingMethods() {
  return FINANCE_METHODS.map(([id,label])=>`<div class="payment-method finance-method"><div class="method-row"><button type="button" class="method-select" role="radio" aria-checked="${state.finance.method===id}" tabindex="${state.finance.method===id?0:-1}" data-action="finance-method" data-method="${id}" data-focus="finance-method-${id}"><span class="payment-logo">${financeIcon(id,img)}</span><strong>${label}</strong></button><button type="button" class="question-button" aria-label="О варианте: ${label}" data-action="finance-info" data-method="${id}" data-focus="finance-info-${id}">${img('financing-0','imgQuestion')}</button><span class="method-radio ${state.finance.method===id?'checked':''}" aria-hidden="true"></span></div>${state.finance.method===id?`<div class="finance-extra">${financeDetails(id,state.finance,totals(state).total,img,money)}</div>`:''}</div>`).join('');
}
function paymentPage() {
  const t=totals(state);
  const points=rewardsPanel(t);
  const methods = [
    ['sbp','СБП','payment-methods','imgSbp1','pay-logo'],['card','Картой','pay-card','imgPaymentType','pay-logo'],['ruble','Цифровым рублём','pay-ruble','imgDigitalRuble','pay-logo'],['tbank','T-Pay','pay-tbank','imgTBank','pay-logo wide'],['alfa','AlfaPay','pay-alfa','imgGroup','pay-logo alfa-main'],['yandex','Картой любого банка с Яндекс Пэй','pay-yandex','imgYandex','pay-logo wide'],['sber','SberPay','pay-sber','imgFrame','pay-logo wide'],
  ];
  const paymentMethods=methods.map(([id,label,context,asset,cls])=>`<div class="payment-method"><div class="method-row" data-action="payment-method" data-method="${id}"><button type="button" class="method-select" data-action="payment-method" data-method="${id}" data-focus="method-${id}" role="radio" aria-checked="${ui.paymentMethod===id}" tabindex="${ui.paymentMethod===id?0:-1}"><span class="payment-logo">${img(context,asset,cls)}${id==='alfa'?img('pay-alfa','imgGroup1','alfa-overlay'):''}</span><strong>${label}</strong></button><button type="button" class="question-button" aria-label="О способе оплаты ${label}" data-action="payment-info" data-method="${id}" data-focus="payment-info-${id}">${img('payment-methods','imgQuestion')}</button><span class="method-radio ${ui.paymentMethod===id?'checked':''}" aria-hidden="true"></span></div>${id==='card'&&ui.paymentMethod==='card'?`<div class="bank-card-form"><div class="bank-card-intro"><div><strong>Безопасная оплата</strong><p class="muted">Защищено AES-256 шифрованием, используемым банками и государствами</p></div>${img('payment-methods','imgGroup2','card-brands')}</div>${cardField('number','Номер карты',23)}<div class="card-input-row">${cardField('expiry','Срок до',5)}${cardField('code','CVC / CVV',3)}</div></div>`:''}</div>`).join('');
  return `<div class="checkout-layout payment-layout"><div class="main-column">${points}${afterPaymentPanel()}<section class="payment-panel payment-methods"><h3>Способ оплаты</h3><div class="tabs" role="tablist" aria-label="Вариант оплаты"><button type="button" class="tab ${ui.paymentTab==='now'?'selected':''}" role="tab" aria-selected="${ui.paymentTab==='now'}" data-action="payment-tab" data-tab="now" data-focus="payment-tab-now">${img(ui.paymentTab==='now'?'payment-methods':'financing-0',ui.paymentTab==='now'?'imgPaymentType1':'imgPaymentType2','tab-icon')}Оплата сейчас</button><button type="button" class="tab ${ui.paymentTab==='installments'?'selected':''}" role="tab" aria-selected="${ui.paymentTab==='installments'}" data-action="payment-tab" data-tab="installments" data-focus="payment-tab-installments">${img(ui.paymentTab==='installments'?'financing-0':'payment-methods',ui.paymentTab==='installments'?'imgPaymentType3':'imgPaymentType2','tab-icon')}Рассрочка или кредит</button></div><div class="method-list ${ui.paymentTab==='installments'?'finance-methods':''}" role="radiogroup" aria-label="Способ оплаты">${ui.paymentTab==='installments'?financingMethods():paymentMethods}</div></section><button type="button" class="button primary" data-action="pay">Оплатить ${money(t.total)}</button><p class="payment-agreement">Нажимая кнопку «Оплатить» я подтверждаю, что принимаю условия ${['договора оферты тура','договора оферты дополнительных услуг','пользовательского соглашения'].map(l=>`<a href="#" class="text-link inline" data-excluded="legal-document">${l}</a>`).reduce((text,part,i)=>text+(i?(i===2?' и ':', '):'')+part,'')}, ознакомлен с <a href="#" class="text-link inline" data-excluded="legal-document">правилами изменения и отмены бронирования</a>, понимаю условия чартерных перевозок и что время и/или аэропорт вылета могут быть изменены, осведомлён о правилах въезда и поведения в стране отдыха, проинформирован о документах и требованиях, предъявляемых к документам, необходимым для потребления услуг, в том числе, необходимых для въезда в страну временного пребывания, проинформирован о традициях и возможных опасностях и даю согласие на обработку моих персональных данных и их передачу</p></div><aside id="order-sidebar" class="order-sidebar">${summary()}</aside></div>`;
}
function modalLeg(f,back) {
  const ctx = back?'modal-return':'modal-outbound', e=state.flightExtras[f.id];
  const airline=back?f.back:f.outbound, hand=back?f.handBack:f.handOut;
  const startTime=back?f.backTime:f.outTime, finishTime=back?f.backArrival:f.outArrival;
  const date=back?'20 ноя, пт':'13 ноя, пт';
  const connection=back&&f.transfer;
  const routeSegment=(start,end,origin,originAirport,destination,destinationAirport,duration,segmentDate=date)=>`<div class="modal-route"><div class="route-track">${img(ctx,'imgFrame')}</div><div class="route-stops"><div><strong>${start}</strong><strong>${origin}</strong><span>${segmentDate}</span><span>${originAirport}</span></div><p class="muted">${duration} в полете</p><div><strong>${end}</strong><strong>${destination}</strong><span>${back&&f.backNextDay?'21 ноя, сб':segmentDate}</span><span>${destinationAirport}</span></div></div></div>`;
  return `<section class="panel modal-flight-leg"><div><h2>Перелёт ${back?'обратно':'туда'}</h2><p class="muted">${connection?'1 пересадка':'Прямой'} · ${back?f.backDuration:'5 ч 10 м'} в пути</p></div>${connection?routeSegment(startTime,'10:55','Анталья','Анталья, AYT','Стамбул','Сабиха Гёкчен, SAW','1 ч 20 м')+`<div class="modal-connection">${img(ctx,'imgFrame1','icon')}<strong>Пересадка, ${f.transfer}</strong></div>`+routeSegment('12:15',finishTime,'Стамбул','Сабиха Гёкчен, SAW','Москва',f.backAirport,'5 ч 10 м'):routeSegment(startTime,finishTime,back?'Анталья':'Москва',back?'Анталья, AYT':f.outAirport,back?'Москва':'Анталья',back?f.backAirport:'Анталья, AYT',back?f.backDuration:'5 ч 10 м')}
  <div class="modal-flight-features"><div>${airlineImage(airline,'icon')}<strong>${airline==='S7'?'S7 Airlines':airline}</strong></div><div>${img(ctx,'imgPlane','icon')}<strong>Регулярный рейс ${back?f.backNumber:f.outboundNumber}</strong></div><div>${img(ctx,back?'imgFrame2':'imgFrame1','icon')}<strong>Класс: Эконом</strong></div><div>${img(ctx,'imgCabin','icon')}<div><strong>Ручная кладь${hand?' '+hand:''}</strong><p class="muted">1 место${hand?' до '+hand+'/чел.':'/чел.'}${!back&&hand?' не более 55x40x23 см':''}</p></div></div><div class="${e[back?'baggageBack':'baggageOut']?'':'pale'}">${img(ctx,e[back?'baggageBack':'baggageOut']?'imgLuggage1':'imgLuggage','icon')}<strong>${e[back?'baggageBack':'baggageOut']?'Багаж 20 кг':'Багажа нет'}</strong></div></div><div class="modal-baggage">${img(ctx,'imgLuggage1','icon')}<strong>Добавить багаж</strong><strong class="push-right">+ 4 590 ₽</strong>${switchButton(e[back?'baggageBack':'baggageOut'],'modal-baggage','Багаж '+(back?'обратно':'туда'),`data-id="${f.id}" data-direction="${back?'baggageBack':'baggageOut'}"`)}</div></section>`;
}
function modal() {
  if (!ui.modal) return '';
  if(ui.modal==='flight-info')return `<dialog class="payment-info-modal" aria-labelledby="flight-info-title"><div class="modal-pane"><button type="button" class="modal-close" data-action="close-modal" aria-label="Закрыть информацию о рейсах">${img('sbp-tooltip','imgXMark')}</button><h2 id="flight-info-title">Что такое регулярные, чартертные и&nbsp;блочные&nbsp;рейсы?</h2><div><p>В регулярных рейсах фиксированное расписание. Аэропорт и время вылета меняется в&nbsp;5%&nbsp;случаев.</p><p>Чартерные и блочных рейсы — нерегулярные перелеты, организованные туроператором. Время вылета меняется в&nbsp;40%&nbsp;случаев. Также может измениться номер рейса и аэропорт вылета</p></div></div></dialog>`;
  const info=ui.modal?.startsWith('payment-info-')?PAYMENT_INFO[ui.modal.slice(13)]:ui.modal?.startsWith('finance-info-')?FINANCE_INFO[ui.modal.slice(13)]:null;
  if(info)return `<dialog class="payment-info-modal" aria-labelledby="payment-info-title"><div class="modal-pane"><button type="button" class="modal-close" data-action="close-modal" aria-label="Закрыть информацию о способе оплаты">${img('sbp-tooltip','imgXMark')}</button><h2 id="payment-info-title">${esc(info.title)}</h2><p>${esc(info.text)}</p></div></dialog>`;
  const f=FLIGHTS.find(f=>f.id===ui.modal), e=state.flightExtras[f.id];
  return `<dialog class="tour-modal" aria-labelledby="tour-modal-title"><div class="modal-pane"><button type="button" class="modal-close" data-action="close-modal" aria-label="Закрыть детали тура">${img('flight-filters','imgXMark')}</button>${steps(0)}<div class="page-heading"><h1 id="tour-modal-title">Детали тура</h1><p>№ 368175269</p></div><div class="modal-layout"><div class="main-column">${modalLeg(f,false)}${modalLeg(f,true)}<section class="panel modal-transfer"><h2>Трансфер</h2><div>${img('modal-transfer','imgTransfer','icon')}<div><strong>Групповой трансфер включен</strong><p class="muted">Аэропорт – отель – аэропорт. От аэропорта до отеля около 1 ч 23 мин</p></div></div><div class="private-transfer-choice">${img('modal-transfer','imgPrivateTransfer','icon')}<div><strong>Добавить индивидуальный трансфер</strong><p class="muted">Быстрее, комфортнее и безопаснее группового. Идеально для поездки с ребенком</p></div><strong>+ ${money(quotedTransfer(f))}</strong>${switchButton(e.privateTransfer,'flight-transfer','Индивидуальный трансфер в деталях',`data-id="${f.id}"`)}</div></section></div><aside class="order-sidebar">${summary({modalFlight:f})}</aside></div></div></dialog>`;
}
function successPage() {
  return `<main class="success-page"><nav class="steps" aria-label="Этапы бронирования">${STEPS.map((label,i)=>`${i?'<span class="step-divider" aria-hidden="true">/</span>':''}<button type="button" class="step done" data-action="step" data-step="${i}">${img('payment-success',i===3?'imgCheckMark1':'imgCheckMark','done-mark')}${label}</button>`).join('')}</nav><div class="success-copy"><div class="success-check">${img('payment-success','imgImage')}</div><h1 tabindex="-1">Заказ на сумму ${money(state.paymentResult.total)} оплачен!</h1><p>Мы начали бронировать ваш тур. Обычно информация о подтверждении поступает в течение 2 часов после оплаты. В редких случаях ожидание может занять до 72 часов . Сообщим о подтверждении бронирования по смс и e-mail . Готовые документы отправим на ваш e-mail. Также они будут доступны в личном кабинете</p></div><button type="button" class="button primary" data-excluded="order-page">Перейти к заказу</button></main>`;
}
function render() {
  if(ui.success){document.title='Заказ оплачен — Level.Travel';app.innerHTML=`<div class="fixed-page">${header()}${successPage()}</div>`;document.body.classList.remove('modal-open');return;}
  const modalScroll=document.querySelector('.tour-modal')?.scrollTop || 0;
  const focused=document.activeElement?.dataset.focus;
  const headings=[['Выберите перелёт','И начните бронирование тура онлайн'],['Бронирование','Заполните данные покупателя и туристов'],['Полезные услуги','Сделайте свой отдых более комфортным'],['Оплата','Осталось всё проверить и оплатить онлайн картой или в рассрочку']];
  document.title=STEPS[ui.step]+' — Level.Travel';
  const [title,subtitle]=headings[ui.step];
  app.innerHTML=`<div class="fixed-page">${header()}<main class="${ui.step===0?'flights-page':'checkout-page'}">${steps()}<div class="page-heading"><h1 tabindex="-1">${title}</h1><p>${subtitle}</p></div>${[flightsPage,bookingPage,servicesPage,paymentPage][ui.step]()}</main></div>${modal()}`;
  document.body.classList.toggle('modal-open',!!ui.modal);
  if(ui.modal) document.querySelector('dialog').showModal();
  if(focused) document.querySelector(`[data-focus="${CSS.escape(focused)}"]`)?.focus({preventScroll:true});
  const tourDialog=document.querySelector('.tour-modal');if(tourDialog)tourDialog.scrollTop=modalScroll;
}
function updateSidebar() { const aside=document.querySelector('#order-sidebar'); if(aside) aside.innerHTML=summary(); }
function setPath(path,value) { const keys=path.split('.');const last=keys.pop();const object=keys.reduce((o,k)=>o[k],state);object[last]=value; }
function chooseFlight(id) {
  const changed=state.selected!==id;
  state.selected=id;
  state.services.transfer=state.flightExtras[id].privateTransfer;
  if(changed&&state.services.transfer){state.services.toHotel=0;state.services.toAirport=0;}
  state.visited=Math.max(state.visited,1);save();navigate(1);
}
function closeModal(){ui.modal=null;render();if(modalTrigger)document.querySelector(`[data-focus="${CSS.escape(modalTrigger)}"]`)?.focus({preventScroll:true});}
function bookingValid() {
  ui.errors = bookingErrors(state);
  ui.invalid = new Set(Object.keys(ui.errors));
  if(ui.invalid.size){render();document.querySelector('input[aria-invalid="true"],.gender-field.invalid input')?.focus();return false;}
  return true;
}
app.addEventListener('click',event=>{
  if(event.target.closest('[data-excluded]')){event.preventDefault();return;}
  if(ui.countryMenu!==null&&!event.target.closest('.country-selector'))closeCountry();
  if(ui.jointCountOpen&&!event.target.closest('.joint-count-selector'))closeJointCount();
  if(event.target.matches('dialog')){const r=event.target.querySelector('.modal-pane').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeModal();return;}
  const control=event.target.closest('[data-action],[data-pending]');if(!control||control.disabled)return;
  if(control.dataset.pending){event.preventDefault();window.dispatchEvent(new CustomEvent('prototype:design-needed',{detail:control.dataset.pending}));return;}
  const action=control.dataset.action,id=control.dataset.id;
  if(action==='filter-toggle'){ui.openFilters[control.dataset.filterKey]=!ui.openFilters[control.dataset.filterKey];state.openFilters=ui.openFilters;save();render();return;}
  if(action==='reset-filters'){state.filters=freshState().filters;save();render();app.querySelector('main h1')?.focus({preventScroll:true});return;}
  if(action==='joint-count-toggle'){
    if(ui.jointCountOpen){closeJointCount(true);return;}
    ui.jointCountOpen=true;render();focusJointCount(JOINT_COUNTS.indexOf(state.services.jointCount));return;
  }
  if(action==='joint-count-select'){
    const count=Number(control.dataset.count);
    if(!JOINT_COUNTS.includes(count))return;
    state.services.jointCount=count;ui.jointCountOpen=false;save();render();app.querySelector('[data-focus="joint-count"]')?.focus({preventScroll:true});return;
  }
  if(action==='country-toggle'){
    const index=Number(control.dataset.tourist);
    if(ui.countryMenu===index){closeCountry(true);return;}
    ui.countryMenu=index;countryTypeahead='';countryTypedAt=0;render();focusCountry(Math.max(0,COUNTRIES.indexOf(state.tourists[index].citizenship)));return;
  }
  if(action==='country-select'){
    const index=Number(control.dataset.tourist);state.tourists[index].citizenship=COUNTRIES[Number(control.dataset.country)];ui.countryMenu=null;updateDocumentFeedback();save();render();app.querySelector(`[data-focus="country-${index}"]`)?.focus({preventScroll:true});return;
  }
  if(action==='step'){event.preventDefault();const next=Number(control.dataset.step);if(ui.step===1&&next>1&&!bookingValid())return;navigate(next);return;}
  if(action==='details'){modalTrigger=control.dataset.focus;ui.modal=id;render();return;}
  if(action==='flight-info'){modalTrigger=control.dataset.focus;ui.modal='flight-info';render();return;}
  if(action==='payment-info'){modalTrigger=control.dataset.focus;ui.modal='payment-info-'+control.dataset.method;render();return;}
  if(action==='finance-info'){
    if(!FINANCE_INFO[control.dataset.method]){window.dispatchEvent(new CustomEvent('prototype:design-needed',{detail:'Информация о рассрочке: '+control.dataset.method}));return;}
    modalTrigger=control.dataset.focus;ui.modal='finance-info-'+control.dataset.method;render();return;
  }
  if(action==='close-modal'){closeModal();return;}
  if(action==='choose-flight'){chooseFlight(id);return;}
  if(action==='dismiss-banner'){ui.banner=false;render();return;}
  if(action==='flight-transfer'){
    const e=state.flightExtras[id];e.privateTransfer=!e.privateTransfer;
    if(state.selected===id){state.services.transfer=e.privateTransfer;if(e.privateTransfer){state.services.toHotel??=0;state.services.toAirport??=0;}}
  } else if(action==='flight-baggage'){
    const e=state.flightExtras[id];const next=!(e.baggageOut&&e.baggageBack);e.baggageOut=next;e.baggageBack=next;
  } else if(action==='modal-baggage'){
    const e=state.flightExtras[id];e[control.dataset.direction]=!e[control.dataset.direction];
  } else if(action==='clear-form'){
    const section=control.dataset.section;
    if(section==='buyer')state.buyer=freshState().buyer;
    else state.tourists[Number(section.split('.')[1])]=freshState().tourists[0];
    for(const path of [...ui.invalid])if(path.startsWith(section+'.')){
      ui.invalid.delete(path);delete ui.errors[path];
    }
    ui.countryMenu=null;
    updateDocumentFeedback();
  } else if(action==='preset'){
    const t=Number(control.dataset.tourist),p=PRESETS[Number(control.dataset.preset)];if(presetOwner(state,t,p)!==-1)return;const {label,...values}=p;state.tourists[t]={...values};
    for(const path of [...ui.invalid])if(path.startsWith('tourists.'+t+'.')){ui.invalid.delete(path);delete ui.errors[path];}
    updateDocumentFeedback();
  } else if(action==='accordion'){
    const key=ui.step+'-'+control.dataset.section;ui.sections[key]=!sectionOpen(control.dataset.section,ui.step===3||control.dataset.section==='tour'||!!ui.modal);state.summarySections={...ui.sections};
  } else if(action==='service-toggle'){
    const key=control.dataset.service;state.services[key]=!state.services[key];
    if(key==='transfer')state.flightExtras[state.selected].privateTransfer=transferSelected(state.services);
  } else if(action==='expand-transfer'){
    ui.transferExpanded[control.dataset.direction]=true;
  } else if(action==='services-next'){
    state.visited=3;save();navigate(3);return;
  } else if(action==='remove-points'){
    state.points=0;ui.pointsDraft='';state.pointsDraft='';ui.rewardsErrors.points='';
  } else if(action==='after-payment'){
    ui.afterPaymentOpen=!ui.afterPaymentOpen;
  } else if(action==='remove-promo'){
    state.promoCode='';ui.rewardsErrors.promo='';
  } else if(action==='rewards-tab'){
    ui.rewardsTab=control.dataset.rewardsTab;state.rewardsTab=ui.rewardsTab;
  } else if(action==='payment-tab'){
    ui.paymentTab=control.dataset.tab;state.paymentTab=ui.paymentTab;
  } else if(action==='finance-method'){
    state.finance.method=control.dataset.method;
  } else if(action==='finance-term'){
    state.finance[control.dataset.termGroup]=Number(control.dataset.term);
  } else if(action==='payment-method'){
    ui.paymentMethod=control.dataset.method;state.paymentMethod=ui.paymentMethod;
  } else if(action==='pay'){
    state.paymentResult={total:totals(state).total,paidAt:Date.now()};ui.success=true;ui.modal=null;save();history.pushState({step:'success'},'','?step=success');render();window.scrollTo(0,0);app.querySelector('h1')?.focus({preventScroll:true});return;
  } else return;
  save();render();
  if(action==='preset'||action==='clear-form')app.querySelector(`[data-focus="${control.dataset.focus}"]`)?.focus({preventScroll:true});
  if(action==='expand-transfer')app.querySelector(`[data-focus="vehicle-${control.dataset.direction}-3"]`)?.focus({preventScroll:true});
});
app.addEventListener('input',event=>{
  const el=event.target;
  if(el.dataset.range){
    const key=el.dataset.range,i=Number(el.dataset.end),n=Number(el.value);
    if(key==='maxFlight')state.filters[key]=n;
    else {const range=state.filters[key];range[i]=i?Math.max(range[0],n):Math.min(range[1],n);el.value=range[i];}
    const values=key==='maxFlight'?[0,state.filters[key]]:state.filters[key];
    const caption=app.querySelector(`[data-range-caption="${key}"]`);caption.textContent=key==='maxFlight'?durationText(values[1]):values.map(clockText).join(' — ');
    el.setAttribute('aria-valuetext',key==='maxFlight'?durationText(values[1]):clockText(values[i]));
    const min=Number(el.min),max=Number(el.max),track=el.closest('.filter-range');track.style.setProperty('--start',((values[0]-min)/(max-min)*100)+'%');track.style.setProperty('--end',((values[1]-min)/(max-min)*100)+'%');
    save();app.querySelector('.flights-list').innerHTML=flightResults();return;
  }
  if(el.dataset.field&&el.type!=='radio'){
    setPath(el.dataset.field,el.value);updateClearButtons();if(ui.invalid.has(el.dataset.field))refreshFieldFeedback(el);save();
    if(el.dataset.field.endsWith('.passport'))updateDocumentFeedback();
    if(sectionOpen('buyer')||sectionOpen('tourists'))updateSidebar();
  }
  if(el.hasAttribute('data-comment')){state.services.comment=el.value;save();if(sectionOpen('additional'))updateSidebar();}
  if(el.hasAttribute('data-joint-order')){state.services.jointOrder=el.value;save();}
  if(el.hasAttribute('data-points')){
    if(!/^\d*$/.test(el.value)){el.value=ui.pointsDraft;return;}
    ui.pointsDraft=el.value;state.pointsDraft=el.value;save();
    if(ui.rewardsErrors.points)setRewardsError('points',pointsError());
  }
  if(el.hasAttribute('data-promo')){ui.promoDraft=el.value;state.promoDraft=el.value;save();if(ui.rewardsErrors.promo)setRewardsError('promo','');}
  if(el.dataset.card){ui.card[el.dataset.card]=el.value;}
});
app.addEventListener('change',event=>{
  const el=event.target;
  if(el.dataset.range){render();return;}
  if(el.dataset.filter){
    const group=el.dataset.filter;
    if(Array.isArray(state.filters[group]))state.filters[group]=el.checked?[...state.filters[group],el.value]:state.filters[group].filter(v=>v!==el.value);
    else state.filters[group]=el.type==='radio'?el.value:el.checked;
    save();render();
  }else if(el.dataset.field&&el.type==='radio'){
    setPath(el.dataset.field,el.value);ui.invalid.delete(el.dataset.field);delete ui.errors[el.dataset.field];save();render();
  }else if(el.dataset.vehicle){
    state.services[el.dataset.vehicle]=el.checked?Number(el.value):null;state.flightExtras[state.selected].privateTransfer=transferSelected(state.services);save();render();
  }else if(el.hasAttribute('data-joint-type')){
    state.services.jointType=el.value;ui.jointCountOpen=false;save();render();
  }else if(el.hasAttribute('data-wish')){
    const i=Number(el.dataset.wish);state.services.selectedWishes=el.checked?[...state.services.selectedWishes,i]:state.services.selectedWishes.filter(v=>v!==i);save();updateSidebar();
  }
});
app.addEventListener('submit',event=>{
  event.preventDefault();
  if(event.target.id==='booking-form'&&bookingValid()){state.visited=Math.max(2,state.visited);save();navigate(2);}
  if(event.target.id==='points-form'){
    const error=pointsError();
    if(error){setRewardsError('points',error);event.target.querySelector('input').focus();}
    else {state.points=Number(ui.pointsDraft);state.promoCode='';ui.rewardsErrors.points='';save();render();}
  }
  if(event.target.id==='promo-form'){
    const code=ui.promoDraft.trim().toUpperCase();
    if(!code){setRewardsError('promo','');return;}
    if(code===DEMO_PROMO.code){state.promoCode=DEMO_PROMO.code;state.points=0;ui.rewardsErrors.promo='';save();render();}
    else {setRewardsError('promo','Такого промокода или сертификата нет');event.target.querySelector('input').focus();}
  }
});
app.addEventListener('keydown',event=>{
  if(event.target.dataset.action==='payment-tab'&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
    event.preventDefault();const target=event.key==='Home'?'now':event.key==='End'?'installments':ui.paymentTab==='now'?'installments':'now';const button=app.querySelector(`[data-action="payment-tab"][data-tab="${target}"]`);button.focus();button.click();return;
  }
  if((ui.modal?.startsWith('payment-info-')||ui.modal?.startsWith('finance-info-')||ui.modal==='flight-info')&&event.key==='Tab'){
    event.preventDefault();app.querySelector('dialog .modal-close')?.focus();return;
  }
  if(event.target.hasAttribute('data-rewards-tab')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
    event.preventDefault();
    ui.rewardsTab=event.key==='Home'?'points':event.key==='End'?'promo':ui.rewardsTab==='promo'?'points':'promo';
    state.rewardsTab=ui.rewardsTab;save();render();app.querySelector(`[data-focus="rewards-${ui.rewardsTab}"]`)?.focus({preventScroll:true});return;
  }
  const jointCountControl=event.target.closest('.joint-count-selector');
  if(jointCountControl){
    if(event.key==='Escape'){event.preventDefault();closeJointCount(true);return;}
    if(event.key==='Tab'){closeJointCount(true);return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();
      if(!ui.jointCountOpen){ui.jointCountOpen=true;render();focusJointCount(event.key==='Home'?0:event.key==='End'?JOINT_COUNTS.length-1:JOINT_COUNTS.indexOf(state.services.jointCount));return;}
      const current=event.target.dataset.count===undefined?JOINT_COUNTS.indexOf(state.services.jointCount):JOINT_COUNTS.indexOf(Number(event.target.dataset.count));
      const next=event.key==='Home'?0:event.key==='End'?JOINT_COUNTS.length-1:(current+(event.key==='ArrowDown'?1:-1)+JOINT_COUNTS.length)%JOINT_COUNTS.length;
      focusJointCount(next);return;
    }
    if(ui.jointCountOpen&&['2','3','4'].includes(event.key)){event.preventDefault();focusJointCount(JOINT_COUNTS.indexOf(Number(event.key)));return;}
  }
  const countryControl=event.target.closest('.country-selector');
  if(countryControl){
    if(event.key==='Escape'){event.preventDefault();closeCountry(true);return;}
    if(event.key==='Tab'){closeCountry(true);return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();
      if(ui.countryMenu===null){ui.countryMenu=Number(countryControl.querySelector('.country-field').dataset.tourist);render();focusCountry(Math.max(0,COUNTRIES.indexOf(state.tourists[ui.countryMenu].citizenship)));return;}
      const current=event.target.dataset.country===undefined?COUNTRIES.indexOf(state.tourists[ui.countryMenu].citizenship):Number(event.target.dataset.country);
      const next=event.key==='Home'?0:event.key==='End'?COUNTRIES.length-1:(current+(event.key==='ArrowDown'?1:-1)+COUNTRIES.length)%COUNTRIES.length;
      focusCountry(next);return;
    }
    if(ui.countryMenu!==null&&event.key.length===1&&event.key!==' '){
      event.preventDefault();const now=Date.now();countryTypeahead=(now-countryTypedAt>800?'':countryTypeahead)+event.key.toLocaleLowerCase('ru');countryTypedAt=now;
      const match=COUNTRIES.findIndex(c=>c.toLocaleLowerCase('ru').startsWith(countryTypeahead));if(match>=0)focusCountry(match);return;
    }
  }
  if(event.target.matches('[data-action="finance-term"]')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
    event.preventDefault();const buttons=[...event.target.closest('[role="radiogroup"]').querySelectorAll('button')],index=buttons.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].focus();buttons[next].click();return;
  }
  if(!event.target.matches('.method-select'))return;
  const keys=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'];
  if(!keys.includes(event.key))return;
  event.preventDefault();
  const buttons=[...app.querySelectorAll('.method-select')];
  const index=buttons.indexOf(event.target);
  const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'||event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
  const nextMethod=buttons[next].dataset.method;
  if(ui.paymentTab==='installments')state.finance.method=nextMethod;
  else {ui.paymentMethod=nextMethod;state.paymentMethod=ui.paymentMethod;}
  save();render();app.querySelector(`[data-focus="${ui.paymentTab==='installments'?'finance-method-':'method-'}${nextMethod}"]`)?.focus({preventScroll:true});
});
app.addEventListener('cancel',event=>{if(event.target.matches('dialog')){event.preventDefault();closeModal();}},true);
document.addEventListener('pointerdown',event=>{if(ui.countryMenu!==null&&!event.target.closest('.country-selector'))closeCountry();if(ui.jointCountOpen&&!event.target.closest('.joint-count-selector'))closeJointCount();});
window.addEventListener('popstate',()=>{ui.modal=null;ui.countryMenu=null;ui.jointCountOpen=false;routeFromUrl();render();});
if(!Number.isFinite(state.priceCheckStartedAt)){state.priceCheckStartedAt=Date.now();save();}
setInterval(()=>{const text=priceTimerText();app.querySelectorAll('[data-timer]').forEach(el=>{if(el.textContent!==text)el.textContent=text;});},250);
routeFromUrl();
if(new URLSearchParams(location.search).has('reset'))navigate(0,true);else render();

installLodgingInfo(img);
