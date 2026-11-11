export const STEPS = ['Выбор перелёта', 'Бронирование', 'Полезные услуги', 'Оплата'];
export const ROUTES = ['flights', 'booking', 'services', 'payment'];
export const COUNTRIES = ['Россия', 'Украина', 'Беларусь', 'Казахстан'];
export const WISHES = ['Номер с красивым видом', 'Тихий номер', 'Свадебное путешествие', 'Большую кровать в номере', 'Номер с балконом', 'День рождения', 'Детскую кроватку в номер', 'Отдельные кровати в номере'];
export const VEHICLES = [
  { name: 'Mercedes Vip Vito 1-5 Persons', price: 3882 },
  { name: 'Mercedes Mini Sprinter', price: 4852 },
  { name: 'Mercedes Vip Vito 1-7 Persons', price: 4852 },
  { name: 'Sedan Nissan Sunny or Similar 2024', price: 1797 },
  { name: 'SUV KIA Sportage or Similar 2020', price: 1924 },
  { name: 'Minivan Mitsubishi Xpander or Similar 2020', price: 1924 },
  { name: 'Sedan Hyundai Elantra or Similar 2018', price: 2009 },
  { name: 'Minibus Toyota Hiace or Similar 2021', price: 2566 },
];
export const CHEAPEST_VEHICLE_INDEX = VEHICLES.reduce((best, vehicle, index) => vehicle.price < VEHICLES[best].price ? index : best, 0);
export const DEFAULT_TRANSFER_COST = VEHICLES[CHEAPEST_VEHICLE_INDEX].price * 2;
export const FLIGHTS = [
  { id: 's7-pegasus', price: 189721, badge: 'Самый дешевый', outbound: 'S7', outboundNumber: 'S7 3739', outTime: '11:10', outArrival: '16:20', outAirport: 'Домодедово, DME', back: 'Pegasus Airlines', backNumber: 'PC 2003', backTime: '09:35', backArrival: '16:20', backAirport: 'Внуково, VKO', backDuration: '6 ч 45 м', transfer: '1 ч 20 мин', handOut: '10 кг', handBack: '3 кг', backNextDay: false },
  { id: 'pobeda', price: 190280, badge: 'Самый дешевый прямой', outbound: 'Победа', outboundNumber: 'DP 839', outTime: '07:00', outArrival: '12:10', outAirport: 'Внуково, VKO', back: 'Победа', backNumber: 'DP 840', backTime: '12:50', backArrival: '17:40', backAirport: 'Внуково, VKO', backDuration: '4 ч 50 м', transfer: '', handOut: '', handBack: '', backNextDay: false },
  { id: 's7-pegasus-long', price: 189721, badge: '', outbound: 'S7', outboundNumber: 'S7 3739', outTime: '11:10', outArrival: '16:20', outAirport: 'Домодедово, DME', back: 'Pegasus Airlines', backNumber: 'PC 2021', backTime: '06:45', backArrival: '16:20', backAirport: 'Внуково, VKO', backDuration: '9 ч 35 м', transfer: '4 ч 10 мин', handOut: '10 кг', handBack: '3 кг', backNextDay: false },
  { id: 's7-pegasus-longest', price: 189721, badge: '', outbound: 'S7', outboundNumber: 'S7 3739', outTime: '11:10', outArrival: '16:20', outAirport: 'Домодедово, DME', back: 'Pegasus Airlines', backNumber: 'PC 2023', backTime: '05:35', backArrival: '16:20', backAirport: 'Внуково, VKO', backDuration: '10 ч 45 м', transfer: '5 ч 20 мин', handOut: '10 кг', handBack: '3 кг', backNextDay: false },
  { id: 's7-pegasus-direct', price: 190917, badge: '', outbound: 'S7', outboundNumber: 'S7 3739', outTime: '11:10', outArrival: '16:20', outAirport: 'Домодедово, DME', back: 'Pegasus Airlines', backNumber: 'PC 1576', backTime: '22:30', backArrival: '03:05', backAirport: 'Внуково, VKO', backDuration: '4 ч 35 м', transfer: '', handOut: '10 кг', handBack: '3 кг', backNextDay: true },
];
export const PRESETS = [
  { label: 'Konstantin Z.', firstName: 'Konstantin', lastName: 'Zamoskvoretskii', gender: 'male', birth: '26.10.1991', passport: '52 0056743', expiry: '27.05.2032', citizenship: 'Россия' },
  { label: 'Ekaterina K.', firstName: 'Ekaterina', lastName: 'Krasnoselskaia', gender: 'female', birth: '01.03.1999', passport: '52 3463128', expiry: '09.03.2032', citizenship: 'Россия' },
  { label: 'Natalia Z.', firstName: 'Natalia', lastName: 'Zamoskvoretskaia', gender: 'female', birth: '14.06.1993', passport: '00 0000003', expiry: '14.06.2033', citizenship: 'Россия' },
  { label: 'Egor Z.', firstName: 'Egor', lastName: 'Zamoskvoretskii', gender: 'male', birth: '12.08.1994', passport: '00 0000004', expiry: '12.08.2033', citizenship: 'Россия' },
];
export const DEMO_PROMO = { code: 'LT-0000-0000-0000', amount: 3500 };
export function freshState() {
  const tourist = () => ({ firstName: '', lastName: '', gender: '', birth: '', passport: '', expiry: '', citizenship: 'Россия' });
  return {
    version: 1, selected: null,
    flightExtras: Object.fromEntries(FLIGHTS.map(f => [f.id, { baggageOut: false, baggageBack: false, privateTransfer: false }])),
    buyer: { firstName: '', lastName: '', email: '', phone: '' }, tourists: [tourist(), tourist()],
    services: { transfer: false, toHotel: null, toAirport: null, priority: false, insurance: false, flowers: false, joint: false, wishes: false, jointType: 'first', jointCount: 2, jointOrder: '', selectedWishes: [], comment: '' },
    paymentTab: 'now', paymentMethod: 'sbp',
    points: 0, pointsDraft: '', promoCode: '', promoDraft: '', rewardsTab: 'points',
    filters: { confirmation: 'all', operator: false, connections: [], duration: [], flightType: [], baggage: 'all', transfer: 'all', outTime: [35,1210], backTime: [265,1385], arrival: [], airlineOut: [], airlineBack: [], moscow: [], destination: [], cabin: 'economy', maxFlight: 1730 },
    visited: 0,
  };
}
export function isCalendarDate(value) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return false;
  const [, day, month, year] = match.map(Number);
  if (year < 1900 || month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export function sameDocument(a,b) {
  const number = value => String(value||'').replace(/[\s-]/g,'').toUpperCase();
  return !!number(a?.passport)&&number(a.passport)===number(b?.passport)&&String(a.citizenship||'').trim().toLowerCase()===String(b?.citizenship||'').trim().toLowerCase();
}
export function presetOwner(state,index,preset) { return state.tourists.findIndex((t,i)=>i!==index&&sameDocument(t,preset)); }
export function bookingErrors(state) {
  const errors = {};
  const required = (path, value) => {
    if (!String(value ?? '').trim()) { errors[path] = 'required'; return false; }
    return true;
  };
  for (const key of ['firstName', 'lastName', 'email', 'phone']) required('buyer.' + key, state.buyer[key]);
  if (!errors['buyer.email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.buyer.email.trim())) errors['buyer.email'] = 'email';
  if (!errors['buyer.phone']) {
    const phone = state.buyer.phone.trim(), digits = phone.replace(/\D/g, '');
    if (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 10 || digits.length > 15) errors['buyer.phone'] = 'phone';
  }
  state.tourists.forEach((tourist, index) => {
    const prefix = `tourists.${index}.`;
    if (!['male', 'female'].includes(tourist.gender)) errors[prefix + 'gender'] = 'required';
    for (const key of ['lastName', 'firstName', 'birth', 'passport', 'expiry']) {
      if (required(prefix + key, tourist[key]) && ['birth', 'expiry'].includes(key) && !isCalendarDate(tourist[key].trim())) errors[prefix + key] = 'date';
    }
  });
  if(sameDocument(state.tourists[0],state.tourists[1]))errors['tourists.1.passport']='duplicate';
  return errors;
}
export function selectedFlight(state) { return FLIGHTS.find(f => f.id === state.selected) || FLIGHTS[0]; }
export function baggageCost(extras) { return 4590 * (Number(extras.baggageOut) + Number(extras.baggageBack)); }
export function transferSelected(services) {
  return !!services?.transfer && [services.toHotel, services.toAirport].some(index => Number.isInteger(index) && !!VEHICLES[index]);
}
export function transferCost(services) {
  if (!transferSelected(services)) return 0;
  return [services.toHotel, services.toAirport].reduce((sum,index) => sum + (index === null ? 0 : VEHICLES[index].price), 0);
}
export function cardTotal(flight, extras, services) {
  const transfer = extras.privateTransfer ? services ? transferCost(services) : DEFAULT_TRANSFER_COST : 0;
  return flight.price + baggageCost(extras) + transfer;
}
export function totals(state) {
  const flight = selectedFlight(state), extras = state.flightExtras[flight.id], s = state.services;
  const additions = [];
  if (extras.baggageOut) additions.push(['Багаж на перелёт туда', 4590]);
  if (extras.baggageBack) additions.push(['Багаж на перелёт обратно', 4590]);
  if (transferSelected(s)) {
    if (s.toHotel !== null) additions.push(['Индивидуальный трансфер в отель — ' + VEHICLES[s.toHotel].name, VEHICLES[s.toHotel].price]);
    if (s.toAirport !== null) additions.push(['Индивидуальный трансфер в аэропорт — ' + VEHICLES[s.toAirport].name, VEHICLES[s.toAirport].price]);
  }
  if (s.priority) additions.push(['Приоритетное обслуживание', 949]);
  if (s.insurance) additions.push(['Страховка от невыезда', 7886]);
  if (s.flowers) additions.push(['Букет из 11 роз в аэропорту', 10084]);
  const subtotal = flight.price + additions.reduce((sum, [, price]) => sum + price, 0);
  const promoDiscount = state.promoCode === DEMO_PROMO.code ? Math.min(DEMO_PROMO.amount, subtotal) : 0;
  const points = promoDiscount ? 0 : Math.max(0, Math.min(383, Math.floor(Number(state.points) || 0), subtotal));
  return { flight: flight.price, additions, subtotal, points, promoDiscount, total: subtotal - points - promoDiscount, cashback: Math.floor(subtotal / 100) };
}
export function matchingFlights(state) {
  const q = state.filters;
  const minutes = time => time.split(':').reduce((h,m)=>Number(h)*60+Number(m));
  return FLIGHTS.filter(f => {
    if(q.outTime&&(minutes(f.outTime)<q.outTime[0]||minutes(f.outTime)>q.outTime[1]))return false;
    if(q.backTime&&(minutes(f.backTime)<q.backTime[0]||minutes(f.backTime)>q.backTime[1]))return false;
    if(q.arrival?.length&&!q.arrival.includes('13'))return false;
    if(q.airlineOut?.length&&!q.airlineOut.includes(f.outbound))return false;
    if(q.airlineBack?.length&&!q.airlineBack.includes(f.back))return false;
    if(q.moscow?.length&&![f.outAirport,f.backAirport].every(airport=>q.moscow.includes(airport.slice(-3))))return false;
    if(q.destination?.length&&!q.destination.includes('AYT'))return false;
    if(q.cabin==='business')return false;
    const backParts=f.backDuration.match(/(?:(\d+) ч)?\s*(?:(\d+) м)?/);
    if(q.maxFlight!==undefined&&Math.max(310,Number(backParts[1]||0)*60+Number(backParts[2]||0))>q.maxFlight)return false;
    if (q.confirmation === 'quick') return false;
    if (q.connections.length && !q.connections.includes(f.transfer ? 'one' : 'direct')) return false;
    if (q.duration.length && f.transfer) {
      const hours = Number(f.transfer.split(' ')[0]);
      if (!q.duration.includes(hours < 3 ? 'short' : hours < 6 ? 'medium' : hours < 12 ? 'long' : 'longest')) return false;
    }
    if (q.duration.length && !f.transfer) return false;
    if (q.flightType.length && !q.flightType.includes('regular')) return false;
    const e = state.flightExtras[f.id];
    if (q.baggage !== 'all' && !(e.baggageOut && e.baggageBack)) return false;
    return true;
  });
}

// A repeating five-minute countdown, independent of page renders.
export function priceCheckSeconds(startedAt, now = Date.now()) {
  const elapsed = Math.max(0, now - startedAt);
  return 300 - Math.floor((elapsed % 300000) / 1000);
}
