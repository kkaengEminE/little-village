'use strict';
let battle=null, encounterCooldown=0;
function startBattle(monster){
  if(battle||modal.open||monster.hp<=0||encounterCooldown>0)return;
  walkTarget=null;keys.clear();moving=false;attackT=0;dodgeT=0;
  battle={monster,hp:30,maxHp:30,turn:1,phase:'player',guard:false,message:'덤불 괴물이 나타났다! 어떻게 할까요?'};
  battleScreen();tone(320,.2);
}
function battleScreen(){
  const b=battle;if(!b)return;
  const active=b.phase==='player',result=['win','lose','fled'].includes(b.phase);
  modal.classList.add('battle-modal');$('#close').style.display='none';
  show(`<div class="battle-top"><span class="eyebrow">숲에서 마주친 작은 위기</span><span>${result?'전투 종료':b.turn+'번째 턴'}</span></div><h1>${b.phase==='win'?'용기를 냈어요!':b.phase==='lose'?'오늘은 여기까지…':b.phase==='fled'?'무사히 빠져나왔어요.':'덤불 괴물과 마주쳤다!'}</h1>
  <div class="battle-stage"><canvas id="battleCanvas" width="680" height="300" aria-label="장비를 착용한 주민과 덤불 괴물이 마주 보는 전투 화면"></canvas>
  <div class="battle-status foe"><b>덤불 괴물</b><span>${b.hp} / ${b.maxHp}</span><div class="meter"><i style="width:${b.hp/b.maxHp*100}%"></i></div></div>
  <div class="battle-status hero"><b>나의 작은 주민</b><span>${Math.ceil(s.hp)} / 100</span><div class="meter"><i style="width:${s.hp}%"></i></div><small>행동력 ${Math.floor(s.energy)} · 도시락 ${s.food}개</small></div></div>
  <div class="battle-log" role="status" aria-live="polite">${b.message}</div>
  ${result?`<div class="actions"><button class="primary" data-battle="leave">${b.phase==='lose'?'동굴에서 눈뜨기':'들판으로 돌아가기'}</button></div>`:`<div class="battle-intent">${b.turn%3===0?'⚠ 괴물이 몸을 크게 부풀렸어요. 이번에는 강한 돌진!':'괴물이 작은 몸통박치기를 준비해요.'} ${active?'내 차례 · 천천히 골라도 괜찮아요.':'몬스터의 차례…'}</div>
  <div class="battle-commands"><button data-battle="attack" ${active?'':'disabled'}><b>툭, 공격</b><small>피해 9 · 행동력 소모 없음</small></button><button data-battle="strong" ${active&&s.energy>=6?'':'disabled'}><b>힘껏 치기</b><small>피해 15 · 행동력 6</small></button><button data-battle="guard" ${active?'':'disabled'}><b>몸 웅크리기</b><small>받는 피해 감소</small></button><button data-battle="food" ${active&&s.food>0?'':'disabled'}><b>도시락 먹기</b><small>체력 +15 · 행동력 +35</small></button><button data-battle="run" ${active?'':'disabled'}><b>도망가기</b><small>확실하게 도망 · 보상 없음</small></button></div>`}`,'battle');
  const c=$('#battleCanvas').getContext('2d');
  c.clearRect(0,0,680,300);if(bg.complete&&bg.naturalWidth)c.drawImage(bg,0,0,680,300);
  c.fillStyle='#d9e0b977';c.fillRect(0,0,680,300);
  ellipse(c,470,160,93,23,'#78875a66',null);ellipse(c,190,270,110,28,'#b5bc8788',null);
  character(c,190,265,{scale:2.3,dir:'back',wear:s.wear});
  enemy(c,{x:470,y:155,hp:3,hit:0,state:b.turn%3===0&&!result?'windup':'idle'});
  if(result)text(c,b.phase==='win'?'✓':b.phase==='fled'?'…':'쉬어 가요',350,160,36,'#426045');
  if(active)content.querySelector?.('[data-battle="attack"]')?.focus();
}
function battleAction(action){
  const b=battle;if(!b)return;
  if(action==='leave'){if(['win','lose','fled'].includes(b.phase))leaveBattle();return;}
  if(b.phase!=='player')return;
  if(!['attack','strong','guard','food','run'].includes(action))return;
  if(action==='strong'&&s.energy<6||action==='food'&&s.food<1)return;
  if(action==='run'){b.phase='fled';b.message='서둘러 숲 바깥으로 빠져나왔어요. 잃어버린 물건은 없어요.';battleScreen();return;}
  if(action==='attack'||action==='strong'){
    const damage=action==='strong'?15:9;if(action==='strong')s.energy-=6;
    b.hp=Math.max(0,b.hp-damage);b.message=`${action==='strong'?'힘껏 내리쳤어요!':'툭, 공격했어요!'} 괴물에게 ${damage} 피해.`;tone(450);
  }else if(action==='guard'){b.guard=true;b.message='몸을 웅크려 다음 공격에 대비했어요.';}
  else{s.food--;s.hp=Math.min(100,s.hp+15);s.energy=Math.min(100,s.energy+35);b.message='도시락을 먹었어요. 체력 +15 · 행동력 +35.';}
  if(b.hp===0){b.phase='win';b.monster.hp=0;s.tokens++;s.coins+=20;if(s.quest==='hunt')s.progress++;b.message+=' 토벌 성공! 20코인과 토벌 증표 1개를 얻었어요.';save();battleScreen();tone(880,.2);return;}
  b.phase='enemy';battleScreen();save();setTimeout(()=>enemyTurn(b),700);
}
function enemyTurn(b){
  if(battle!==b||b.phase!=='enemy')return;
  const heavy=b.turn%3===0,damage=Math.ceil((heavy?22:10)*(b.guard?.3:1));
  s.hp=Math.max(0,s.hp-damage);b.message+=` ${heavy?'괴물의 강한 돌진!':'괴물의 몸통박치기!'} ${b.guard?'방어해서 ':''}체력 -${damage}.`;b.guard=false;tone(180,.1);
  if(s.hp<=0){b.phase='lose';b.message+=' 갑옷 씨가 동굴까지 데려다줘요. 코인과 장비는 잃지 않아요.';}
  else{b.turn++;b.phase='player';}save();battleScreen();
}
function leaveBattle(){
  if(!battle)return;const result=battle.phase;
  if(result==='lose'){s.hp=75;s.energy=Math.max(50,s.energy);s.x=500;s.y=790;}
  else if(result==='fled'){s.x=1500;s.y=820;}
  battle=null;encounterCooldown=4;$('#close').style.display='';modal.classList.remove('battle-modal');close();save();
}
