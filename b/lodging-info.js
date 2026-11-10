// Shared hotel and room details, opened above the current funnel screen.
export function installLodgingInfo(img) {
  let dialog=null, trigger=null, photoIndex=0, kind='hotel';
  const contexts={hotel:'lodging-hotel',room:'lodging-room'};
  const photoKeys=['imgPhoto','imgPhoto1','imgPhoto2'];
  const amenities=[
    [['imgConditioner','Кондиционер'],['imgIron','Утюг'],['imgPhone','Телефон платно'],['imgSafe','Сейф'],['imgToiletry','Туалетные принадлежности']],
    [['imgTv','Телевизор'],['imgShower','Душ'],['imgToilet','Туалет'],['imgMiniBar','Мини-бар'],['imgBathroom','Ванная комната']],
  ];
  const photos=()=>photoKeys.map((_,i)=>img(contexts[kind],photoKeys[(photoIndex+i)%photoKeys.length],'lodging-info-photo',`${kind==='hotel'?'Отель':'Номер'} — фото ${(photoIndex+i)%photoKeys.length+1}`)).join('');
  function close() { if(dialog?.open)dialog.close(); }
  function open(type,button) {
    if(dialog)return;
    kind=type;trigger=button;photoIndex=0;
    const context=contexts[kind];
    dialog=document.createElement('dialog');dialog.className='lodging-info-modal';dialog.setAttribute('aria-labelledby','lodging-info-title');
    const hotel=kind==='hotel'?`<div class="lodging-info-heading"><h2 id="lodging-info-title">Ozkaymak Falez Hotel · 5 звёзд</h2></div>`:'';
    const room='<h2 id="lodging-info-title">Стандартный с видом на окрестности · 28м²</h2>';
    const hotelDetails=kind==='hotel'?`<div class="lodging-rating"><strong>7.7</strong><span>210 оценок · 116 отзывов</span></div><p>Городской бизнес-отель с хорошими номерами, из которых открывается красивый вид на море и город. Крутой спуск по проезжей дороге вниз, на городской пляж Коньяалты – один из самых экологически чистых пляжей на средиземноморском побережье. Возле отеля расположены живописный парк, дельфинарий, аквариум и торговый центр «Мигрос».</p><div class="lodging-hotel-badges"><span class="reviews-year" title="Отзывы за текущий год">Отзывы за этот год ${img(context,'imgQuestion','lodging-small-icon')}</span><span>${img(context,'imgTour','lodging-small-icon')}Собственный пляж</span><span>${img(context,'imgFlag','lodging-small-icon')}Пляж с «Голубым флагом»</span><span class="hotel-territory">Большая территория</span></div>`:'';
    const roomDetails=kind==='room'?`<p>Стандартный однокомнатный номер с балконом. В номере 1 двуспальная или 2 односпальные кровати и ванная комната.</p><div class="lodging-amenity-section"><h3>В номере:</h3><div class="lodging-amenity-columns">${amenities.map(column=>`<div>${column.map(([asset,label])=>`<div class="lodging-amenity">${img(context,asset,'lodging-amenity-icon')}<span>${label}</span></div>`).join('')}</div>`).join('')}</div></div><div class="lodging-amenity-section"><h3>Питание:</h3><div class="lodging-amenity">${img(context,'imgMeal','lodging-amenity-icon')}<span>Ультра всё включено</span></div></div>`:'';
    dialog.innerHTML=`<div class="lodging-info-content">${kind==='hotel'?hotel:room}<div class="lodging-gallery" role="region" aria-label="Фотографии ${kind==='hotel'?'отеля':'номера'}"><div class="lodging-photo-track">${photos()}</div><button type="button" class="lodging-gallery-arrow previous" aria-label="Предыдущая фотография">${img(context,'imgChevronCompact','lodging-gallery-chevron')}</button><button type="button" class="lodging-gallery-arrow next" aria-label="Следующая фотография">${img(context,'imgChevronNarrowDown','lodging-gallery-chevron')}</button></div>${kind==='hotel'?hotelDetails:roomDetails}</div><button type="button" class="lodging-info-close" aria-label="Закрыть информацию ${kind==='hotel'?'об отеле':'о номере'}">${img(context,'imgXMark','lodging-close-icon')}</button>`;
    dialog.addEventListener('click',event=>{
      if(event.target.closest('.lodging-info-close')){close();return;}
      const arrow=event.target.closest('.lodging-gallery-arrow');
      if(arrow){photoIndex=(photoIndex+(arrow.classList.contains('next')?1:photoKeys.length-1))%photoKeys.length;dialog.querySelector('.lodging-photo-track').innerHTML=photos();return;}
      if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}
    });
    dialog.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();photoIndex=(photoIndex+(event.key==='ArrowRight'?1:photoKeys.length-1))%photoKeys.length;dialog.querySelector('.lodging-photo-track').innerHTML=photos();
    });
    dialog.addEventListener('close',()=>{
      dialog.remove();dialog=null;document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));
      if(trigger?.isConnected)trigger.focus({preventScroll:true});trigger=null;
    },{once:true});
    document.body.append(dialog);document.body.classList.add('modal-open');dialog.showModal();dialog.querySelector('.lodging-info-close').focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{const button=event.target.closest('[data-lodging-info]');if(button){event.preventDefault();open(button.dataset.lodgingInfo,button);}});
}
