/* ROI_TEMPLATE_UPGRADE_V6 */
const ROI_T={convGood:30,convPoor:15,costGood:300000,costPoor:700000,budgetGood:0,budgetPoor:500000};

function rtHigh(v,good,poor){if(!Number.isFinite(v))return'-';return v>=good?'양호':v<poor?'미비':'보통'}
function rtLow(v,good,poor){if(!Number.isFinite(v))return'-';return v<=good?'양호':v>poor?'미비':'보통'}
function rtGradeClass(g){return g==='양호'?'rt-good':g==='미비'?'rt-bad':g==='보통'?'rt-mid':'rt-empty'}
function rtPerfGrade(r){
  const a=rtHigh(r.leadToMeetingRate,ROI_T.convGood,ROI_T.convPoor),b=rtLow(r.costPerMeeting,ROI_T.costGood,ROI_T.costPoor);
  if(a==='-'&&b==='-')return'-';if(a==='미비'||b==='미비')return'미비';if(a==='양호'&&b==='양호')return'양호';return'보통';
}
function rtBudgetGrade(r){return rtLow(r.budgetVariance,ROI_T.budgetGood,ROI_T.budgetPoor)}
function rtSignedCost(v){if(!Number.isFinite(v))return'-';const n=Math.round(v);return n===0?'0원':`${n>0?'+':'-'}${Math.abs(n).toLocaleString('ko-KR')}원`}
function rtMetric(r,k){return k==='conversion'?r.leadToMeetingRate:k==='cost'?r.costPerMeeting:k==='contracts'?r.contracts:k==='budget'?r.budgetVariance:r.roi}
function rtMetricText(r,k){const v=rtMetric(r,k);return k==='conversion'||k==='roi'?formatPct(v):k==='cost'?(Number.isFinite(v)?formatCost(Math.round(v)):'-'):k==='contracts'?`${v||0}건`:rtSignedCost(v)}
function rtMetricLabel(k){return k==='conversion'?'Lead→상담·데모':k==='cost'?'상담·데모당 비용':k==='contracts'?'계약 성사':k==='budget'?'예산 차액':'ROI'}

if(!leadStatuses.includes('계약 성사')){
  const x=leadStatuses.indexOf('완료'); x>=0?leadStatuses.splice(x,0,'계약 성사'):leadStatuses.push('계약 성사');
}

getEventMetrics=function(eventId){
  const ls=leads.filter(l=>String(l.eventId)===String(eventId));
  return{
    total:ls.length,
    valid:ls.filter(l=>['Hot','Warm'].includes(l.grade)).length,
    hot:ls.filter(l=>l.grade==='Hot').length,
    completed:ls.filter(l=>l.followUpStatus==='완료').length,
    contracted:ls.filter(l=>l.followUpStatus==='계약 성사').length,
    active:ls.filter(l=>!['미접촉','계약 성사','완료','보류','종료'].includes(l.followUpStatus)).length
  };
};

roiMetrics=function(event,insight,metrics){
  insight=normalizeInsight(insight||{});metrics=metrics||getEventMetrics(event?.id||insight.eventId);
  const expectedCost=parseCost(event?.cost),cost=parseCost(insight.actualCost),leads=Number(metrics.total)||0;
  const meetings=Number(insight.meetingCount)||0,sql=Number(insight.sqlCount)||0;
  const contracts=Math.max(Number(insight.contractCount)||0,Number(metrics.contracted)||0);
  const revenue=parseCost(insight.conversionRevenue),netProfit=revenue-cost;
  return{
    expectedCost,cost,leads,meetings,sql,contracts,revenue,netProfit,
    leadToMeetingRate:leads>0?meetings/leads*100:null,
    meetingToSqlRate:meetings>0?sql/meetings*100:null,
    sqlToContractRate:sql>0?contracts/sql*100:null,
    conversionRate:leads>0?contracts/leads*100:null,
    costPerMeeting:meetings>0&&cost>0?cost/meetings:null,
    costPerSql:sql>0&&cost>0?cost/sql:null,
    budgetVariance:cost>0&&expectedCost>0?cost-expectedCost:null,
    budgetExecutionRate:cost>0&&expectedCost>0?cost/expectedCost*100:null,
    roi:cost>0?(revenue-cost)/cost*100:null,
    costPerLead:leads>0&&cost>0?cost/leads:null,
    cpa:contracts>0&&cost>0?cost/contracts:null
  };
};

function rtInstall(){
  if(document.getElementById('rtStyle'))return;
  const s=document.createElement('style');s.id='rtStyle';s.textContent=`
    .rt-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:11px}
    .rt-card{padding:11px 12px;border:1px solid var(--line);border-radius:13px;background:rgba(255,255,255,.76)}
    .rt-card span{display:block;color:var(--muted);font-size:9px;font-weight:800}.rt-card strong{display:block;margin-top:4px;font-size:13px;white-space:nowrap}
    .rt-profile{margin:0 0 14px;padding:15px;border:1px solid rgba(37,99,235,.13);border-radius:18px;background:linear-gradient(135deg,rgba(37,99,235,.045),rgba(124,58,237,.025))}
    .rt-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}.rt-head h3{margin:0;font-size:13px}.rt-head p{margin:4px 0 0;color:var(--muted);font-size:9px}
    .rt-chip{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:9px;font-weight:900;white-space:nowrap}
    .rt-good{color:#047857!important;background:#ecfdf5!important}.rt-mid{color:#b45309!important;background:#fff7ed!important}.rt-bad{color:#b91c1c!important;background:#fef2f2!important}.rt-empty{color:#64748b!important;background:#f1f5f9!important}
    .rt-funnel{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;gap:6px;align-items:center;margin-bottom:10px}
    .rt-step{padding:9px 7px;border:1px solid var(--line);border-radius:12px;background:#fff;text-align:center}.rt-step span{display:block;color:var(--muted);font-size:8px}.rt-step strong{display:block;margin-top:3px;font-size:16px}.rt-arrow{color:#94a3b8;font-weight:900}
    .rt-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.rt-metric{padding:9px;border:1px solid var(--line);border-radius:11px;background:#fff}.rt-metric span{display:block;color:var(--muted);font-size:8px}.rt-metric strong{display:block;margin-top:4px;font-size:12px;white-space:nowrap}.rt-metric small{display:inline-flex;margin-top:5px;padding:3px 6px;border-radius:999px;font-size:8px;font-weight:900}
    .rt-note{margin-top:9px;color:#64748b;font-size:8px;line-height:1.5}.rt-pipeline{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:-2px 0 14px}.rt-grade-line{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 9px}
    @media(max-width:760px){.rt-grid,.rt-pipeline,.rt-metrics{grid-template-columns:1fr 1fr}.rt-funnel{grid-template-columns:1fr}.rt-arrow{transform:rotate(90deg);text-align:center}}
  `;document.head.appendChild(s);

  const bg=document.querySelector('#dashboardView .budget-grid');if(bg&&!document.getElementById('rtBudget'))bg.insertAdjacentHTML('afterend','<div id="rtBudget" class="rt-grid"></div>');
  const rk=document.querySelector('.roi-panel .roi-kpi-grid');if(rk&&!document.getElementById('rtRoiEff'))rk.insertAdjacentHTML('afterend','<div id="rtRoiEff" class="rt-grid"></div>');
  const ra=document.querySelector('.roi-head-actions');if(ra&&!document.getElementById('rtSort')){
    ra.insertAdjacentHTML('afterbegin','<select id="rtSort" class="roi-year-select"><option value="roi">ROI 순</option><option value="conversion">Lead→상담·데모</option><option value="cost">상담·데모당 비용</option><option value="contracts">계약 성사</option><option value="budget">예산 정확도</option></select>');
    document.getElementById('rtSort').addEventListener('change',()=>renderROI());
  }
  const sum=document.getElementById('insightAutoSummary');if(sum&&!document.getElementById('rtInsight'))sum.insertAdjacentHTML('beforebegin','<div id="rtInsight" class="rt-profile" style="display:none"></div>');
  const ua=document.querySelector('#followupView .upload-actions');if(ua&&!document.getElementById('rtPipeline'))ua.insertAdjacentHTML('afterend','<div id="rtPipeline" class="rt-pipeline"></div>');
  const mi=document.getElementById('meetingCount'),ml=mi?.closest('.field')?.querySelector('label');if(ml)ml.textContent='상담·데모 건수';
  const p=document.querySelector('.roi-input-block>p');if(p)p.textContent='총 Lead는 F/U Pipeline에서 자동 집계합니다. 상담·데모 → SQL → 계약 흐름과 비용 효율을 함께 분석합니다.';
  const ds=document.getElementById('directLeadStatus');if(ds&&![...ds.options].some(o=>o.value==='계약 성사')){const o=new Option('계약 성사','계약 성사'),c=[...ds.options].find(o=>o.value==='완료');ds.insertBefore(o,c||null)}
}

function rtProfileHTML(e,i,m){
  const r=roiMetrics(e,i,m),pg=rtPerfGrade(r),cg=rtHigh(r.leadToMeetingRate,ROI_T.convGood,ROI_T.convPoor),eg=rtLow(r.costPerMeeting,ROI_T.costGood,ROI_T.costPoor),bg=rtBudgetGrade(r);
  return`<div class="rt-head"><div><h3>Performance Grade</h3><p>현장 정성평가와 별도로 전환·비용 효율을 정량 평가합니다.</p></div><span class="rt-chip ${rtGradeClass(pg)}">${pg==='-'?'데이터 부족':pg}</span></div>
  <div class="rt-funnel"><div class="rt-step"><span>Lead</span><strong>${r.leads}</strong></div><div class="rt-arrow">→</div><div class="rt-step"><span>상담·데모</span><strong>${r.meetings}</strong></div><div class="rt-arrow">→</div><div class="rt-step"><span>SQL</span><strong>${r.sql}</strong></div><div class="rt-arrow">→</div><div class="rt-step"><span>계약</span><strong>${r.contracts}</strong></div></div>
  <div class="rt-metrics"><div class="rt-metric"><span>Lead→상담·데모</span><strong>${formatPct(r.leadToMeetingRate)}</strong><small class="${rtGradeClass(cg)}">${cg}</small></div><div class="rt-metric"><span>상담·데모당 비용</span><strong>${Number.isFinite(r.costPerMeeting)?formatCost(Math.round(r.costPerMeeting)):'-'}</strong><small class="${rtGradeClass(eg)}">${eg}</small></div><div class="rt-metric"><span>예산 차액</span><strong>${rtSignedCost(r.budgetVariance)}</strong><small class="${rtGradeClass(bg)}">${bg}</small></div></div>
  <div class="rt-note">판정 기준 · 전환율 양호 ≥30% / 미비 &lt;15% · 상담·데모당 비용 양호 ≤30만원 / 미비 &gt;70만원 · 예산 초과액 0원 이하 양호 / 50만원 초과 미비</div>`;
}

const rtBaseBudget=renderBudget;
renderBudget=function(){
  rtBaseBudget();
  const rows=insights.filter(i=>parseCost(i.actualCost)>0).map(i=>{const e=events.find(x=>String(x.id)===String(i.eventId));return e&&parseCost(e.cost)>0?{e,i,expected:parseCost(e.cost),actual:parseCost(i.actualCost)}:null}).filter(Boolean);
  const ex=rows.reduce((s,x)=>s+x.expected,0),ac=rows.reduce((s,x)=>s+x.actual,0),v=rows.length?ac-ex:null,rate=ex>0?ac/ex*100:null,within=rows.filter(x=>x.actual<=x.expected).length;
  const b=document.getElementById('rtBudget');if(b)b.innerHTML=`<div class="rt-card"><span>비교 가능 행사</span><strong>${rows.length}개</strong></div><div class="rt-card"><span>예산 차액</span><strong class="${Number.isFinite(v)&&v<=0?'roi-positive':Number.isFinite(v)?'roi-negative':''}">${rtSignedCost(v)}</strong></div><div class="rt-card"><span>예산 집행률</span><strong>${formatPct(rate)}</strong></div><div class="rt-card"><span>예산 내 집행</span><strong>${rows.length?`${within}/${rows.length}개`:'-'}</strong></div>`;
};

function rtRenderRoiExtra(rows){
  const t=rows.reduce((a,x)=>{a.cost+=x.r.cost;a.leads+=x.r.leads;a.meetings+=x.r.meetings;a.contracts+=x.r.contracts;return a},{cost:0,leads:0,meetings:0,contracts:0});
  const b=document.getElementById('rtRoiEff');if(b)b.innerHTML=`<div class="rt-card"><span>총 Lead</span><strong>${t.leads}개</strong></div><div class="rt-card"><span>Lead→상담·데모</span><strong>${formatPct(t.leads?t.meetings/t.leads*100:null)}</strong></div><div class="rt-card"><span>상담·데모당 비용</span><strong>${t.meetings&&t.cost?formatCost(Math.round(t.cost/t.meetings)):'-'}</strong></div><div class="rt-card"><span>계약 성사</span><strong>${t.contracts}건</strong></div>`;
}

const rtBaseROI=renderROI;
renderROI=function(){
  rtBaseROI();
  const yr=document.getElementById('roiYearFilter')?.value||'',metric=document.getElementById('rtSort')?.value||'roi';
  const rows=events.filter(e=>!yr||eventYear(e)===yr).map(e=>{const i=insights.find(x=>String(x.eventId)===String(e.id))||normalizeInsight({});return{e,i,r:roiMetrics(e,i,getEventMetrics(e.id))}}).filter(x=>x.r.cost>0||x.r.revenue>0||x.r.contracts>0||x.r.meetings>0||x.r.leads>0);
  rtRenderRoiExtra(rows);
  if(metric==='roi')return;
  const sorted=rows.slice().sort((a,b)=>{const av=rtMetric(a.r,metric),bv=rtMetric(b.r,metric);if(!Number.isFinite(av)&&!Number.isFinite(bv))return 0;if(!Number.isFinite(av))return 1;if(!Number.isFinite(bv))return-1;return metric==='cost'||metric==='budget'?av-bv:bv-av});
  const max=Math.max(1,...sorted.map(x=>Math.abs(Number(rtMetric(x.r,metric))||0))),w=document.getElementById('roiRanking');if(!w)return;
  if(!sorted.length){w.innerHTML='<div class="empty">해당 연도의 성과 데이터가 아직 없습니다.</div>';return}
  w.innerHTML=sorted.map((x,n)=>{const v=rtMetric(x.r,metric),width=Number.isFinite(v)?Math.min(100,Math.max(4,Math.abs(v)/max*100)):0;return`<div class="roi-rank-row" onclick="openPerformance('${x.e.id}')"><div class="roi-rank-name"><strong>${n+1}. ${escapeHTML(displayEventName(x.e))}</strong><small>${escapeHTML(eventYear(x.e))} · ${escapeHTML(x.e.region||'-')} · Performance ${rtPerfGrade(x.r)}</small></div><div class="roi-rank-value"><small style="display:block;color:var(--muted);font-size:8px">${rtMetricLabel(metric)}</small>${rtMetricText(x.r,metric)}</div><div class="roi-track"><div class="roi-fill" style="width:${width}%"></div></div><div class="roi-rank-cost"><small style="color:var(--muted)">매출 / 비용</small><strong style="display:block;font-size:10px">${formatCost(x.r.revenue)} / ${formatCost(x.r.cost)}</strong></div></div>`}).join('');
};

renderROIInsightPreview=function(){
  const id=document.getElementById('insightEventSelect')?.value||'',e=events.find(x=>String(x.id)===String(id)),w=document.getElementById('roiInsightPreview');if(!w)return;if(!e){w.innerHTML='';return}
  const i=normalizeInsight({actualCost:actualCost.value,meetingCount:meetingCount.value,sqlCount:sqlCount.value,contractCount:contractCount.value,conversionRevenue:conversionRevenue.value}),r=roiMetrics(e,i,getEventMetrics(id)),pg=rtPerfGrade(r);
  w.innerHTML=`<div class="roi-mini"><span>성과등급</span><strong class="${rtGradeClass(pg)}" style="display:inline-flex;padding:3px 7px;border-radius:999px">${pg==='-'?'미평가':pg}</strong></div><div class="roi-mini"><span>Lead→상담·데모</span><strong>${formatPct(r.leadToMeetingRate)}</strong></div><div class="roi-mini"><span>상담·데모당 비용</span><strong>${Number.isFinite(r.costPerMeeting)?formatCost(Math.round(r.costPerMeeting)):'-'}</strong></div><div class="roi-mini"><span>예산 차액</span><strong>${rtSignedCost(r.budgetVariance)}</strong></div><div class="roi-mini"><span>ROI</span><strong class="${roiClass(r.roi)}">${formatPct(r.roi)}</strong></div><div class="roi-mini"><span>Lead당 비용</span><strong>${r.costPerLead?formatCost(Math.round(r.costPerLead)):'-'}</strong></div><div class="roi-mini"><span>계약당 비용(CPA)</span><strong>${r.cpa?formatCost(Math.round(r.cpa)):'-'}</strong></div><div class="roi-mini"><span>Lead→계약</span><strong>${formatPct(r.conversionRate)}</strong></div>`;
};

function rtInsightExtra(){
  const id=document.getElementById('insightEventSelect')?.value||'',box=document.getElementById('rtInsight');if(!box)return;
  const e=events.find(x=>String(x.id)===String(id));if(!e){box.style.display='none';box.innerHTML='';return}
  const i=insights.find(x=>String(x.eventId)===String(id))||normalizeInsight({}),m=getEventMetrics(id),r=roiMetrics(e,i,m);box.style.display='block';box.innerHTML=rtProfileHTML(e,i,m);
  const sum=document.getElementById('insightAutoSummary'),h=sum?.querySelector('h3');if(!sum||!h)return;
  const old=sum.querySelector('.rt-grade-line');if(old)old.remove();
  h.insertAdjacentHTML('afterend',`<div class="rt-grade-line"><span class="rt-chip rt-empty">Field Score ${insightScoreGrade(insightScore(i))}${insightScore(i)!==null?` · ${insightScore(i).toFixed(1)}/5`:''}</span><span class="rt-chip ${rtGradeClass(rtPerfGrade(r))}">Performance ${rtPerfGrade(r)==='-'?'미평가':rtPerfGrade(r)}</span></div>`);
}

const rtBaseInsight=renderInsightSelection;
renderInsightSelection=function(){rtBaseInsight();rtInsightExtra()};

function rtPipeline(){
  const b=document.getElementById('rtPipeline');if(!b)return;const id=document.getElementById('leadEventFilter')?.value||'';
  let title='전체 행사',L=leads.length,M=0,S=0,C=0,R=0;
  if(id){const e=events.find(x=>String(x.id)===String(id));if(e){title=displayEventName(e);const i=insights.find(x=>String(x.eventId)===String(id))||normalizeInsight({}),r=roiMetrics(e,i,getEventMetrics(id));L=r.leads;M=r.meetings;S=r.sql;C=r.contracts;R=r.revenue}}
  else events.forEach(e=>{const i=insights.find(x=>String(x.eventId)===String(e.id))||normalizeInsight({}),r=roiMetrics(e,i,getEventMetrics(e.id));M+=r.meetings;S+=r.sql;C+=r.contracts;R+=r.revenue});
  b.innerHTML=`<div class="rt-card"><span>${escapeHTML(title)} · Lead</span><strong>${L}개</strong></div><div class="rt-card"><span>상담·데모</span><strong>${M}건</strong></div><div class="rt-card"><span>SQL</span><strong>${S}건</strong></div><div class="rt-card"><span>계약 성사</span><strong>${C}건</strong></div><div class="rt-card"><span>전환 매출</span><strong>${R?formatCost(R):'미정'}</strong></div>`;
}
const rtBaseLeads=renderLeads;renderLeads=function(){rtBaseLeads();rtPipeline()};
const rtBaseDash=renderDashboard;renderDashboard=function(){rtBaseDash();populateROIYears();renderROI()};

rtInstall();
['actualCost','meetingCount','sqlCount','contractCount','conversionRevenue'].forEach(id=>{const e=document.getElementById(id);if(e){e.addEventListener('input',()=>renderROIInsightPreview());e.addEventListener('change',()=>renderROIInsightPreview())}});
document.getElementById('insightEventSelect')?.addEventListener('change',()=>rtInsightExtra());
try{renderAll()}catch(e){console.warn('[ROI V6] initial refresh skipped',e)}
