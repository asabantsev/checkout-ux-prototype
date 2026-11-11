(() => {
  'use strict';
  const variant = document.body.dataset.variant === '2' ? 2 : 1;
  const assets = '../assets/';
  const params = new URLSearchParams(location.search);
  const MAX_DEPARTURE_SPAN=14;
  const dateSpan=(a,b)=>(Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000;
  const allowedBaseSpan=()=>MAX_DEPARTURE_SPAN-2*state.flex;
  const iso = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const dateOf = value => new Date(`${value}T12:00:00`);
  const offsetDate = (value, delta) => { const d=dateOf(value); d.setDate(d.getDate()+delta); return iso(d); };
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const hasDirectFlight=value=>[1,4,6].includes(dateOf(value).getDay());
  const isDateAvailable=value=>!state.direct||hasDirectFlight(value);
  function hasAvailableDeparture(){if(!state.start)return false;for(let value=offsetDate(state.start,-state.flex),end=offsetDate(state.end,state.flex);value<=end;value=offsetDate(value,1)){if(isDateAvailable(value))return true;}return false;}
  const todayParts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
  const today=`${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  const DEFAULT={start:offsetDate(today,7),end:offsetDate(today,14),min:7,max:10,flex:0,direct:false};
  const state={...DEFAULT};
  if(params.has('reset')){params.delete('reset');history.replaceState(null,'',location.pathname+(params.size?'?'+params:''));}
  let panel=null, dateAnchor=null, nightAnchor=null, focusDate=state.start, focusNight=state.min, tooltip=false;
  let visibleMonth=new Date(dateOf(state.start||DEFAULT.start).getFullYear(),dateOf(state.start||DEFAULT.start).getMonth(),1);
  let toastTimer;
  const months=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const short=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  const img=(name,cls='',alt='')=>`<img src="${assets}${name}" class="${cls}" alt="${alt}" draggable="false">`;
  const initial=name=>`initial-${name}`;
  const chevron=(muted=false)=>img(initial(muted?'imgChevron1.svg':'imgChevron.svg'),'field-icon');
  const dateText = () => {
    if(!state.start)return 'Дата';
    const a=dateOf(state.start),b=dateOf(state.end||state.start);
    const label=state.start===state.end?`${a.getDate()} ${short[a.getMonth()]}`:a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear()?`${a.getDate()}–${b.getDate()} ${short[b.getMonth()]}`:`${a.getDate()} ${short[a.getMonth()]} – ${b.getDate()} ${short[b.getMonth()]}`;
    return label+(state.flex?` ± ${state.flex} ${state.flex===1?'день':'дня'}`:'');
  };
  const nightsText = () => state.min===state.max?`${state.min} ${state.min===1||state.min===21?'ночь':(state.min%10>=2&&state.min%10<=4&&!(state.min>=12&&state.min<=14))?'ночи':'ночей'}`:`${state.min}–${state.max} ночей`;
  function save(){updateFields();}
  function fieldCopy(label,value){return `<span class="field-copy"><span class="field-label">${label}</span><span class="field-value">${value}</span></span>`;}
  function mount(){
    document.querySelector('#app').innerHTML=`<header class="hero"><div class="fixed-page"><div class="site-header"><div class="brand">${img(initial('imgLogoEngOneLineFull.svg'),'','Level.Travel')}</div><div class="header-items"><div class="header-item">${img(initial('imgMessenger.svg'))}<span>Напишите нам</span></div><div class="header-item">${img(initial('imgService.svg'))}<span>Сервисы</span></div><div class="header-item">${img(initial('imgHeart.svg'))}<span>Мой список</span><span class="list-count">3</span></div><div class="header-item">${img(initial('imgHelp.svg'))}<span>Помощь</span></div><div class="header-item"><span class="cashback-value">876${img(initial('imgCashback.svg'))}</span><span>Кешбэк</span></div><div class="avatar">${img(initial('imgSeagull.svg'))}</div></div></div><div class="hero-content"><div class="hero-top"><div class="slogan"><h1>Ищите легко.<br>Бронируйте выгодно!</h1><div class="informer"><p>3 минуты назад Дмитрий из Москвы купил(a) тур на апрель в Таиланд за 28 063 ₽/чел.</p><p>Найдено туров за сутки 18 946 944</p></div><div class="hot-icon">${img(initial('imgHotIcon.png'))}</div></div><div class="app-banner"><div class="app-banner-copy"><strong>Только<br>в приложении</strong><p><em>–10%</em> на первый заказ<br>по промокоду <em>NEW10</em>.<br>Скидка до 1000 ₽</p></div>${img(initial('imgQrCode.png'),'','QR-код приложения')}</div></div><div class="form"><div class="tabs"><div class="tab active">${img(initial('imgTourIcon.svg'))}Туры</div><div class="tab">${img(initial('imgHotelIcon.svg'))}Отели</div></div><div class="search-bar"><div class="search-field destination">${fieldCopy('Страна, курорт или отель','Турция')}${img(initial('imgXMark.svg'),'field-icon')}</div><span class="field-separator"></span><div class="search-field departure" id="departure-field"><button class="open-field" id="departure-button" type="button" aria-label="Вылет" aria-haspopup="dialog" aria-controls="departure-popover" aria-expanded="false"></button>${fieldCopy('Вылет',dateText())}<span class="empty-departure-icon" aria-hidden="true" hidden>${img('departure-empty-calendar.svg')}</span><button type="button" class="clear-departure" aria-label="Очистить даты вылета">${img(initial('imgXMark.svg'))}</button></div><span class="field-separator"></span><button class="search-field duration" id="duration-button" type="button" aria-label="Длительность" aria-haspopup="dialog" aria-controls="nights-popover" aria-expanded="false">${fieldCopy('Длительность',nightsText())}${chevron()}</button><span class="field-separator"></span><div class="search-field tourists">${fieldCopy('Кто поедет','2 взрослых')}${chevron(true)}</div><span class="field-separator"></span><div class="search-field origin">${fieldCopy('Город вылета','Новосибирск')}${img(initial('imgXMark.svg'),'field-icon')}</div><button type="button" class="find-button" id="find-button">Найти</button></div></div></div><div class="popover-layer"><section class="popover departure-popover" id="departure-popover" role="dialog" aria-label="Даты вылета" hidden></section><section class="popover nights-popover" id="nights-popover" role="dialog" aria-label="Длительность" hidden></section></div></div></header><main class="fixed-page"><h2 class="sr-only">Поиск тура</h2></main><div class="toast" role="status" hidden></div><span class="sr-only" role="status" id="selection-status"></span>`;
    document.querySelector('#departure-button').addEventListener('click',e=>togglePanel('departure',e.detail===0));
    document.querySelector('#duration-button').addEventListener('click',e=>togglePanel('nights',e.detail===0));
    document.querySelector('.clear-departure').addEventListener('click',()=>{state.start=null;state.end=null;dateAnchor=null;state.flex=0;save();if(panel==='departure')renderCalendar();});
    document.querySelector('#find-button').addEventListener('click',()=>{if(!state.start){togglePanel('departure',true);return;}if(!hasAvailableDeparture()){if(panel!=='departure')togglePanel('departure',true);showToast('На выбранные даты нет прямых перелётов. Выберите другую дату.');return;}closePanels();showToast(`Турция · Вылет ${dateText()} · ${nightsText()} · 2 взрослых`);document.dispatchEvent(new CustomEvent('prototype:search',{detail:JSON.parse(JSON.stringify(state))}));});
    document.addEventListener('pointerdown',e=>{if(!e.target.closest('.popover,.departure,.duration'))closePanels();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel){const origin=panel;closePanels();document.querySelector(origin==='departure'?'#departure-button':'#duration-button').focus();}});
    updateFields();
  }
  function showToast(text){const t=document.querySelector('.toast');clearTimeout(toastTimer);t.textContent=text;t.hidden=false;toastTimer=setTimeout(()=>t.hidden=true,4500);}
  function updateFields(){
    const d=document.querySelector('#departure-field .field-value'),n=document.querySelector('#duration-button .field-value');
    if(!d)return;d.textContent=dateText();d.classList.toggle('is-placeholder',!state.start);n.textContent=nightsText();d.title=dateText();n.title=nightsText();
    document.querySelector('.clear-departure').hidden=!state.start;
    document.querySelector('.empty-departure-icon').hidden=Boolean(state.start);
    document.querySelector('#departure-button').setAttribute('aria-label',`Вылет: ${dateText()}`);
    document.querySelector('#duration-button').setAttribute('aria-label',`Длительность: ${nightsText()}`);
    document.querySelector('#selection-status').textContent=`Вылет ${dateText()}, ${nightsText()}`;
  }
  function updateDurationChevron(){const button=document.querySelector('#duration-button');button.querySelector('img.field-icon').src=assets+(button.getAttribute('aria-expanded')==='true'?'duration-chevron-up.svg':initial('imgChevron.svg'));}
  function closePanels(){panel=null;dateAnchor=null;nightAnchor=null;tooltip=false;for(const id of ['departure-popover','nights-popover'])document.getElementById(id).hidden=true;document.querySelectorAll('.is-open').forEach(e=>e.classList.remove('is-open'));for(const id of ['departure-button','duration-button'])document.getElementById(id).setAttribute('aria-expanded','false');updateDurationChevron();}
  function togglePanel(which,keyboard=false){
    if(panel===which){closePanels();return;}closePanels();panel=which;
    const pop=document.getElementById(which==='departure'?'departure-popover':'nights-popover');pop.hidden=false;
    document.querySelector(which==='departure'?'#departure-field':'#duration-button').classList.add('is-open');
    document.querySelector(which==='departure'?'#departure-button':'#duration-button').setAttribute('aria-expanded','true');
    updateDurationChevron();
    if(which==='departure'){visibleMonth=state.start?new Date(dateOf(state.start).getFullYear(),dateOf(state.start).getMonth(),1):new Date(dateOf(today).getFullYear(),dateOf(today).getMonth(),1);focusDate=state.start||iso(visibleMonth);while(!isDateAvailable(focusDate))focusDate=offsetDate(focusDate,1);renderCalendar();if(keyboard)focusDateButton();}
    else{focusNight=state.min;renderNights();pop.style.left=(document.querySelector('#duration-button').getBoundingClientRect().left-pop.parentElement.getBoundingClientRect().left)+'px';if(keyboard)document.querySelector(variant===1?`[data-night="${focusNight}"]`:'#night-min').focus();}
  }
  function monthHtml(month,index){
    const y=month.getFullYear(),m=month.getMonth(),offset=(month.getDay()+6)%7,count=new Date(y,m+1,0).getDate(),weeks=Math.max(5,Math.ceil((offset+count)/7));
    const title=`${months[m]} ${y}`;
    let options='';for(let i=0;i<24;i++){const d=new Date(dateOf(today).getFullYear(),dateOf(today).getMonth()+i,1);options+=`<option value="${d.getFullYear()}-${d.getMonth()}" ${d.getMonth()===m&&d.getFullYear()===y?'selected':''}>${months[d.getMonth()]} ${d.getFullYear()}</option>`;}
    let cells='';for(let i=0;i<weeks*7;i++){const day=i-offset+1;if(day<1||day>count){cells+='<span class="date-cell blank" aria-hidden="true"></span>';continue;}const value=iso(new Date(y,m,day));const data=window.CALENDAR_PRICES[value];cells+=`<button type="button" class="date-cell" data-date="${value}" tabindex="${value===focusDate?0:-1}" aria-label="${day} ${months[m].toLowerCase()} ${y}${data?', '+data.price+' рублей':''}" aria-pressed="false"><span class="day-number">${day}</span><span class="day-price ${data?.low?'low':''}">${data?.price||''}</span></button>`;}
    const left=index===0?`<button class="month-nav" type="button" data-month-step="-1" aria-label="Предыдущий месяц"><span class="left-arrow">${img('departure-imgSolidArrowsTaillessLineArrowTaillessLineArrowLeft1ArrowKeyboardLeft.svg')}</span></button>`:'<span class="nav-spacer"></span>';
    const right=index===1?`<button class="month-nav" type="button" data-month-step="1" aria-label="Следующий месяц">${img('departure-imgChevron1.svg','right-arrow')}</button>`:'<span class="nav-spacer"></span>';
    return `<div class="calendar-month"> <div class="month-heading">${left}<label class="month-title"><span>${title}</span>${img('departure-imgChevron.svg')}<select class="month-select" data-month-index="${index}" aria-label="${index===0?'Первый':'Второй'} месяц">${options}</select></label>${right}</div><div class="weekdays" aria-hidden="true">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<span>${d}</span>`).join('')}</div><div class="date-grid">${cells}</div></div>`;
  }
  function renderCalendar(){
    const el=document.querySelector('#departure-popover');const next=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1);
    el.innerHTML=`<div class="calendar-layout">${monthHtml(visibleMonth,0)}${monthHtml(next,1)}</div><div class="calendar-footer"><div class="flex-tabs" role="group" aria-label="Гибкость дат">${['Точные даты','± 1 день','± 2 дня'].map((label,i)=>`<button type="button" class="flex-tab" data-flex="${i}" aria-pressed="${state.flex===i}">${label}</button>`).join('')}</div><div class="direct-controls"><button type="button" class="switch" role="switch" aria-label="Только прямой перелёт" aria-checked="${state.direct}"></button><span class="direct-label">Только прямой перелёт<button type="button" class="direct-info" aria-label="О прямом перелёте" aria-expanded="false">${img('departure-imgQuestion.svg')}</button></span></div></div><div class="info-tooltip" hidden>Показывать туры только с прямым перелётом.</div>`;
    paintDates();
    el.querySelectorAll('[data-date]').forEach(button=>{button.addEventListener('click',()=>chooseDate(button.dataset.date));button.addEventListener('pointerenter',()=>{if(dateAnchor&&!button.disabled)paintDates(dateAnchor,button.dataset.date);});button.addEventListener('keydown',dateKeyboard);});
    el.querySelector('.calendar-layout').addEventListener('pointerleave',()=>paintDates());
    el.querySelectorAll('[data-month-step]').forEach(b=>b.addEventListener('click',()=>{visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+Number(b.dataset.monthStep),1);renderCalendar();}));
    el.querySelectorAll('.month-select').forEach(s=>s.addEventListener('change',()=>{const[y,m]=s.value.split('-').map(Number);visibleMonth=new Date(y,m-Number(s.dataset.monthIndex),1);renderCalendar();}));
    el.querySelectorAll('[data-flex]').forEach(b=>b.addEventListener('click',()=>{const flex=Number(b.dataset.flex);if(state.start&&dateSpan(state.start,state.end)+2*flex>MAX_DEPARTURE_SPAN)return;state.flex=flex;save();paintDates();}));
    el.querySelector('.switch').addEventListener('click',e=>{state.direct=!state.direct;if(dateAnchor&&!isDateAvailable(dateAnchor))dateAnchor=null;e.currentTarget.setAttribute('aria-checked',String(state.direct));save();paintDates();});
    el.querySelector('.direct-info').addEventListener('click',e=>{tooltip=!tooltip;el.querySelector('.info-tooltip').hidden=!tooltip;e.currentTarget.setAttribute('aria-expanded',String(tooltip));});
  }
  function paintDates(a=state.start,b=state.end){
    if(focusDate)while(!isDateAvailable(focusDate))focusDate=offsetDate(focusDate,1);
    if(dateAnchor&&b){const delta=dateSpan(dateAnchor,b);b=offsetDate(dateAnchor,clamp(delta,-allowedBaseSpan(),allowedBaseSpan()));}
    if(a&&b&&a>b)[a,b]=[b,a];
    const from=a&&offsetDate(a,-state.flex),to=b&&offsetDate(b,state.flex);
    document.querySelectorAll('[data-date]').forEach(cell=>{const value=cell.dataset.date,available=isDateAvailable(value);cell.disabled=!available||(!!dateAnchor&&Math.abs(dateSpan(dateAnchor,value))>allowedBaseSpan());cell.tabIndex=value===focusDate?0:-1;cell.title=!available?'В этот день нет прямого перелёта':'';cell.querySelector('.day-price').hidden=!available;cell.classList.toggle('range-edge',available&&(value===a||value===b));cell.classList.toggle('range-inside',available&&!!from&&value>=from&&value<=to&&value!==a&&value!==b);cell.setAttribute('aria-pressed',String(available&&!!from&&value>=from&&value<=to));});
    document.querySelectorAll('[data-flex]').forEach(button=>{const flex=Number(button.dataset.flex);button.disabled=!!state.start&&dateSpan(state.start,state.end)+2*flex>MAX_DEPARTURE_SPAN;button.setAttribute('aria-pressed',String(flex===state.flex));button.title=button.disabled?'Диапазон с допуском не должен превышать 14 дней':'';});
  }
  function chooseDate(value){if(!isDateAvailable(value))return;if(dateAnchor&&Math.abs(dateSpan(dateAnchor,value))>allowedBaseSpan())return;if(!dateAnchor){dateAnchor=value;state.start=value;state.end=value;}else{[state.start,state.end]=[dateAnchor,value].sort();dateAnchor=null;}focusDate=value;save();paintDates();document.querySelectorAll('[data-date]').forEach(e=>e.tabIndex=e.dataset.date===focusDate?0:-1);}
  function focusDateButton(){document.querySelector(`[data-date="${focusDate}"]`)?.focus();}
  function dateKeyboard(e){const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];if(delta!==undefined){e.preventDefault();focusDate=offsetDate(e.currentTarget.dataset.date,delta);if(dateAnchor)focusDate=offsetDate(dateAnchor,clamp(dateSpan(dateAnchor,focusDate),-allowedBaseSpan(),allowedBaseSpan()));while(!isDateAvailable(focusDate)){const next=offsetDate(focusDate,delta>0?1:-1);if(dateAnchor&&Math.abs(dateSpan(dateAnchor,next))>allowedBaseSpan()){focusDate=e.currentTarget.dataset.date;break;}focusDate=next;}const d=dateOf(focusDate);if(d<visibleMonth||d>=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+2,1)){visibleMonth=new Date(d.getFullYear(),d.getMonth(),1);renderCalendar();}document.querySelectorAll('[data-date]').forEach(b=>b.tabIndex=b.dataset.date===focusDate?0:-1);focusDateButton();}}
  function paintNights(a=state.min,b=state.max){if(a>b)[a,b]=[b,a];document.querySelectorAll('[data-night]').forEach(button=>{const value=Number(button.dataset.night);button.classList.toggle('range-edge',value===a||value===b);button.classList.toggle('range-inside',value>a&&value<b);button.setAttribute('aria-pressed',String(value>=a&&value<=b));});}
  function renderNights(){
    const el=document.querySelector('#nights-popover');
    if(variant===1){el.innerHTML=`<div class="nights-grid" role="group" aria-label="Количество ночей">${Array.from({length:30},(_,i)=>`<button type="button" class="night-cell" data-night="${i+1}" aria-label="${i+1} ночей" tabindex="${i+1===focusNight?0:-1}">${i+1}</button>`).join('')}</div>`;paintNights();el.querySelectorAll('[data-night]').forEach(button=>{button.addEventListener('click',()=>{const value=Number(button.dataset.night);if(nightAnchor===null){nightAnchor=value;state.min=value;state.max=value;}else{[state.min,state.max]=[nightAnchor,value].sort((a,b)=>a-b);nightAnchor=null;}focusNight=value;el.querySelectorAll('[data-night]').forEach(b=>b.tabIndex=Number(b.dataset.night)===value?0:-1);save();paintNights();});button.addEventListener('pointerenter',()=>{if(nightAnchor!==null)paintNights(nightAnchor,Number(button.dataset.night));});button.addEventListener('keydown',e=>{const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-6,ArrowDown:6}[e.key];if(delta!==undefined){e.preventDefault();focusNight=clamp(Number(button.dataset.night)+delta,1,30);el.querySelectorAll('[data-night]').forEach(b=>b.tabIndex=Number(b.dataset.night)===focusNight?0:-1);el.querySelector(`[data-night="${focusNight}"]`).focus();}});});el.addEventListener('pointerleave',()=>paintNights(),{once:true});}
    else{el.innerHTML=`<div class="night-counter">${[['min','От'],['max','До']].map(([key,label])=>`<div class="counter-row"><label class="counter-label" for="night-${key}">${label}</label><div class="counter-controls"><button class="counter-button" type="button" data-counter="${key}" data-delta="-1" aria-label="Уменьшить ${key==='min'?'минимальную':'максимальную'} длительность">${img('nights-counter-imgMinusButton.svg')}</button><input class="counter-number" id="night-${key}" aria-label="${key==='min'?'Минимум':'Максимум'} ночей" inputmode="numeric" pattern="[0-9]*" maxlength="2" value="${state[key]}" autocomplete="off"><button class="counter-button" type="button" data-counter="${key}" data-delta="1" aria-label="Увеличить ${key==='min'?'минимальную':'максимальную'} длительность">${img('nights-counter-imgPlusButton.svg')}</button></div></div>`).join('')}</div>`;updateCounters();el.querySelectorAll('[data-counter]').forEach(button=>button.addEventListener('click',()=>{changeCounter(button.dataset.counter,state[button.dataset.counter]+Number(button.dataset.delta));updateCounters();}));el.querySelectorAll('input').forEach(input=>{const key=input.id==='night-min'?'min':'max';const commit=()=>{if(input.value.trim()!==''&&Number.isFinite(Number(input.value)))changeCounter(key,Number(input.value));updateCounters();};input.addEventListener('input',()=>input.value=input.value.replace(/\D/g,''));input.addEventListener('blur',commit);input.addEventListener('keydown',e=>{if(e.key==='Enter'){commit();input.select();}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();changeCounter(key,state[key]+(e.key==='ArrowUp'?1:-1));updateCounters();}});});}
  }
  function changeCounter(key,value){state[key]=clamp(Math.round(value),key==='min'?1:state.min,key==='min'?state.max:30);save();}
  function updateCounters(){for(const key of ['min','max']){const input=document.getElementById(`night-${key}`);input.value=state[key];const min=key==='min'?1:state.min,max=key==='min'?state.max:30;document.querySelector(`[data-counter="${key}"][data-delta="-1"]`).disabled=state[key]<=min;document.querySelector(`[data-counter="${key}"][data-delta="1"]`).disabled=state[key]>=max;}}
  mount();
})();
