export const FINANCE_DEFAULTS={method:'paylate',stage:6,quarter:4,split:4,vanta:12};
export const FINANCE_INFO={
  credit:{title:'Кредит от Т-банка',text:'Первая сумма спишется через месяц, далее — равными частями в соответствии с графиком. В платежи включается фиксированный размер переплаты. Срок кредита от 3 до 36 месяцев, срок и ставка кредита определяется после заполнения короткой онлайн-заявки. Ее рассмотрят банки, подключенные к системе Т-Рассрочки: Т-Банк, МТС Банк, ОТП Банк, Ренессанс Банк, Совкомбанк, Kviku. Решение поступит в течение 2 минут. Как только заявку одобрят, сразу начнем оформлять бронирование. Вам для этого ничего не нужно делать. Договор заключается непосредственно с банком, который выдает кредит. Все документы автоматически загрузятся в личный кабинет по мере готовности — не позднее, чем за пару дней до вылета.'},
  vanta:{title:'Рассрочка от Ванта',text:'Разделите оплату на 12, 15 или 24 месяца. Просто отправьте онлайн-заявку, и через 2 минуты придет решение от банков-партнеров (ОТП Банк, Совком, БРС, Кредит Европа Банк, МТС, Локо). После одобрения бронирование подтвердится автоматически. Размер переплаты фиксирован, а итоговая сумма пересчитывается при досрочном погашении.'},
  later:{title:'Забронируй сейчас, оплати потом',text:'Забронируйте тур одной кнопкой, не вводя данные карты. Оплатить путешествие можно будет в течение суток в Личном кабинете — банковской картой или при помощи рассрочки. Если не оплатите тур за 24 часа, он просто автоматически отменится.'},
  quarter:{title:'Первый платёж — 25% от суммы заказа',text:'Вы сами выбираете срок — 4, 7 или 13 месяцев. Размер переплаты фиксированный. Оформление полностью онлайн, решение занимает 1–2 минуты. После одобрения бронирование подтверждается автоматически — ничего дополнительно делать не нужно. Если решите погасить досрочно, итоговая сумма пересчитается.'},
  split:{title:'Оплатить частями в Яндекс Сплит',text:'Оплатите тур через Яндекс Сплит — без ввода данных карты. Стоимость тура фиксируется сразу, бронирование начинается после оплаты. Документы появятся в личном кабинете после подтверждения тура. Если бронирование не подтвердится, деньги вернутся на ваш счет.'},
  paylate:{title:'Рассрочка до 30 дней',text:'В течение льготного периода сумма вашего заказа не изменится. Если не успеете внести платеж в этот срок, стоимость пересчитается по тарифам Paylate. Узнать о тарифах можно по ссылке Посмотреть подробные условия. Чтобы подать заявку, оформите заказ и заполните анкету онлайн — это займет 3-5 минут. Как только заявку на рассрочку одобрят, бронирование произойдёт автоматически — вам не нужно ехать в наш офис или дополнительно связываться с менеджером.'},
  stage:{title:'Поэтапная оплата',text:'Первая сумма спишется через месяц, далее — равными частями в соответствии с графиком. В платежи включается фиксированный размер переплаты. При оформлении заказа заполните короткую онлайн-заявку. Ее рассмотрят банки, подключенные к системе Т-Рассрочки: Т-Банк, МТС Банк, ОТП Банк, Ренессанс Банк, Совкомбанк, Kviku. Решение поступит в течение 2 минут. Как только заявку одобрят, сразу начнем оформлять бронирование. Вам для этого ничего не нужно делать. Договор заключается непосредственно с банком, который выдает кредит. Все документы автоматически загрузятся в личный кабинет по мере готовности — не позднее, чем за пару дней до вылета.'},
};
export const FINANCE_METHODS=[
  ['paylate','Рассрочка до 30 дней','finance-paylate','imgPaylate'],
  ['stage','Поэтапная оплата','finance-tbank','imgTBank'],
  ['quarter','Первый платёж — всего 25% от суммы заказа, остальное списывается равными частями каждый месяц','finance-quarter','imgPaymentType'],
  ['split','Оплатить частями в Яндекс Сплит','finance-split','img'],
  ['later','Забронируй сейчас, оплати потом','finance-later','imgPaymentType'],
  ['vanta','Рассрочка от Ванта','finance-vanta','imgLogo'],
  ['credit','Кредит от Т-банка','finance-tbank','imgTBank'],
];
export function financingQuote(total,method,term){
  if(method==='stage'){
    const n=[6,10,12].includes(term)?term:6,base=[12138,19438,23207][[6,10,12].indexOf(n)];
    const monthly=Math.round((total+Math.round(total*base/101292))/n);
    return {months:n,today:0,monthly,overpayment:monthly*n-total,payments:n};
  }
  if(method==='quarter'){
    const n=[4,7,13].includes(term)?term:4,today=Math.round(total/4),fee=Math.round(total*410/136264),monthly=Math.ceil((total-today)/(n-1))+fee;
    return {months:n,today,monthly,fee,payments:n-1,overpayment:today+monthly*(n-1)-total};
  }
  const n=method==='split'?([2,4,6].includes(term)?term:4):([12,15,24].includes(term)?term:12);
  return {months:n,today:0,monthly:Math.floor(total/n),last:total-Math.floor(total/n)*(n-1),payments:n,overpayment:0};
}
export function financeIcon(id,img){
  const method=FINANCE_METHODS.find(m=>m[0]===id);
  if(id==='split')return `<span class="finance-split-icon">${img('finance-split','img','finance-split-word')}${img('finance-split','imgGroup1077239328','finance-split-melon')}</span>`;
  return img(method[2],method[3],'finance-icon');
}
const monthWord=n=>[2,3,4].includes(n%10)&&!(n%100>=11&&n%100<=14)?'месяца':'месяцев';
const terms=(group,values,current,label)=>`<div class="finance-terms" role="radiogroup" aria-label="${label}">${values.map(n=>`<button type="button" role="radio" aria-checked="${n===current}" class="finance-term ${n===current?'selected':''}" data-action="finance-term" data-term-group="${group}" data-term="${n}" data-focus="finance-${group}-${n}">${n} ${group==='vanta'?'мес':monthWord(n)}</button>`).join('')}</div>`;
export function financeDetails(method,settings,total,img,money){
  if(method==='paylate')return `<div class="paylate-widget"><div class="paylate-facts"><div><strong>0₽</strong><span>Нужно оплатить сегодня</span></div><div><strong>0%</strong><span>Без переплаты при оплате в срок до 30 дней</span></div><div><strong>365</strong><span>Дней на погашение задолженности</span></div></div><p class="muted">После оформления заказа заполните электронную анкету. Её рассматривают онлайн в течение 3-5 минут. Как только заявку на рассрочку одобрят, бронирование произойдёт автоматически — вам не нужно ехать в наш офис или дополнительно связываться с менеджером.</p><button type="button" data-excluded="legal-document">Посмотреть подробные условия</button><div class="paylate-provider"><span class="muted">Рассрочка предоставляется ООО «МКК «Кредит Лайн»</span>${img('financing-0','imgProperty1Full','paylate-full-logo')}</div></div>`;
  if(method==='stage')return `<div class="stage-plans" role="radiogroup" aria-label="Срок поэтапной оплаты">${[6,10,12].map(n=>{const q=financingQuote(total,method,n);return `<button type="button" role="radio" aria-checked="${settings.stage===n}" class="stage-plan ${settings.stage===n?'selected':''}" data-action="finance-term" data-term-group="stage" data-term="${n}" data-focus="finance-stage-${n}"><strong>${money(q.monthly)} × ${n}</strong><span class="muted">Переплата<br>${money(q.overpayment)}</span><span class="muted">${n} месяцев</span></button>`;}).join('')}</div>`;
  if(method==='quarter'){
    const q=financingQuote(total,method,settings.quarter);
    return `${terms('quarter',[4,7,13],settings.quarter,'Срок оплаты частями')}<div class="quarter-payments"><div><span class="muted">Сегодня</span><strong>${money(q.today)}</strong></div><div><div class="quarter-caption"><span class="muted">Далее ${q.payments} ${q.payments===3?'платежа':'платежей'}</span><span class="pale">Переплата ${money(q.fee)} / месяц</span></div><strong>по ${money(q.monthly)} / месяц</strong></div></div>`;
  }
  if(method==='split'){
    const q=financingQuote(total,method,settings.split);
    return `<div class="split-widget" role="group" aria-label="Яндекс Сплит: 0 рублей сейчас, без переплат">${img('financing-3','imgImage2','split-widget-image')}<button type="button" class="split-widget-question" aria-label="О Яндекс Сплит" data-action="finance-info" data-method="split"></button><div class="split-terms">${terms('split',[2,4,6],settings.split,'Срок Яндекс Сплит')}</div><span class="split-badge">${img('financing-3','imgImage2')}</span><div class="split-dates">Сегодня<br>0₽</div><div class="split-future">ещё ${q.payments} ${q.payments===2||q.payments===4?'платежа':'платежей'} каждое 10 число<br>по ${money(q.monthly)}${q.last!==q.monthly?'<br><small>последний — '+money(q.last)+'</small>':''}</div></div>`;
  }
  if(method==='vanta')return `<div class="vanta-widget"><div class="vanta-top">${img('financing-5','imgGroup24','vanta-full-logo')}${terms('vanta',[12,15,24],settings.vanta,'Срок рассрочки Ванта')}</div><div class="vanta-payments"><p>Платите комфортно:</p><div class="vanta-columns"><div><span class="muted">Сегодня</span><span>0 ₽</span></div><div class="vanta-long"><div><span class="vanta-accent">Без переплаты</span><span>при одобрении ОТП Банком и закрытии за 4 месяца</span></div><div><span class="vanta-accent">${settings.vanta} ${monthWord(settings.vanta)}</span><span>на погашение задолженности, если нужно больше времени или одобрил другой банк</span></div><button type="button" class="muted" data-excluded="legal-document">Посмотреть подробные условия</button></div></div></div></div>`;
  return '';
}
