/* Read-only squad comparisons. The host owns all selection and disclosure state. */
(() => {
  'use strict';
  const PANELS = new Set(['priorities','squads','standings','overview','categories','momentum','ages']);
  const DAY = 86400000;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const finite = value => typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const number = value => finite(value).toLocaleString('en-GB', {maximumFractionDigits:1});
  const signed = value => (value > 0 ? '+' : value < 0 ? '−' : '') + number(Math.abs(value));
  const percent = (value,total) => total > 0 ? value / total * 100 : 0;
  const people = list => [...new Map((Array.isArray(list) ? list : []).filter(p => p && typeof p.id === 'string' && p.id).map(p => [p.id,p])).values()];
  const dayIndex = day => {
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
    const value = Date.parse(day + 'T00:00:00Z');
    return Number.isFinite(value) && new Date(value).toISOString().slice(0,10) === day ? value / DAY : null;
  };
  const shortDay = day => new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(day * DAY));
  const isoDay = day => new Date(day * DAY).toISOString().slice(0,10);
  const apparatusLabel = scope => scope === 'vault' ? 'Vault' : scope === 'combined' ? 'Floor & Vault' : 'Floor';
  const categoryFor = scope => scope === 'floor' ? 'overall' : scope;
  const readMark = (data,person,skill) => {
    const level = data.mark?.(person.id,skill.id);
    return level === 1 || level === 2 ? level : 0;
  };
  function stats(data,members,skills,category) {
    let retained = 0, perfect = 0, levels = 0;
    members.forEach(p => skills.forEach(skill => {
      const level = readMark(data,p,skill);
      retained += Number(level > 0); perfect += Number(level === 2); levels += level;
    }));
    const total = members.length * skills.length;
    const points = members.reduce((sum,p) => sum + finite(data.summary?.(p.id,category)?.points),0);
    return {members:members.length,total,retained,perfect,levels,points,
      progress:percent(levels,total * 2),retainedPercent:percent(retained,total),perfectPercent:percent(perfect,total),average:members.length ? points / members.length : 0};
  }
  function historyFor(data,members,days,now) {
    const build = window.SWLGymnastProgress?.buildSeries;
    return members.map(person => ({person,series:typeof build === 'function' ? build({progress:data.state?.weeklyProgress,gymnastId:person.id,days,now}) : {available:false,rows:[]}}));
  }
  function weekly(data,members,now) {
    const end = dayIndex(data.state?.weeklyProgress?.day), records = historyFor(data,members,56,now);
    const rows = Array.from({length:8},(_,i) => {
      if (end === null) return {value:null,recorded:0,partial:false};
      const last = end - (7-i)*7, first = last - 6;
      let value = 0, recorded = 0, complete = 0;
      records.forEach(({series}) => {
        if (!series.available) return;
        const start = dayIndex(series.firstDay), finish = dayIndex(series.lastDay);
        if (start === null || finish === null || start > last || finish < first) return;
        recorded++;
        if (start <= first && finish >= last) complete++;
        value += series.rows.filter(r => !r.baseline && dayIndex(r.day) >= first && dayIndex(r.day) <= last).reduce((sum,r) => sum + finite(r.delta),0);
      });
      return {first:isoDay(first),last:isoDay(last),label:shortDay(first)+'–'+shortDay(last),value:recorded ? value : null,recorded,complete,partial:recorded > 0 && complete < members.length};
    });
    return {rows,available:rows.some(r => r.value !== null),memberCount:members.length,recordedCount:records.filter(r => r.series.available).length,stale:records.some(r => r.series.stale),end};
  }
  function buildModel(config = {}) {
    const data = config.data || {}, scope = ['floor','vault','combined'].includes(config.apparatus) ? config.apparatus : 'floor';
    const members = [people(config.primaryPeople),people(config.comparisonPeople)];
    const skills = (Array.isArray(data.skills) ? data.skills : []).filter(s => s && typeof s.id === 'string' && (scope === 'combined' || (scope === 'vault' ? s.category === 'vault' : s.category !== 'vault')));
    const categories = (Array.isArray(data.categories) ? data.categories : []).filter(c => skills.some(s => s.category === c.id));
    const names = [String(config.primaryLabel || 'Selected gymnasts'),String(config.comparisonLabel || 'Comparison squad')];
    const now = config.now === undefined ? Date.now() : config.now;
    return {data,scope,members,skills,categories,names,now,stats:members.map(group => stats(data,group,skills,categoryFor(scope))),overlap:members[0].filter(p => members[1].some(q => q.id === p.id)).length};
  }
  function legend(model) {
    return `<div class="acmp-legend">${model.names.map((name,i) => `<span><i class="acmp-key acmp-series-${i}" aria-hidden="true"></i><span>${esc(name)}<small>${model.members[i].length} ${model.members[i].length === 1 ? 'gymnast' : 'gymnasts'}</small></span></span>`).join('')}</div>`;
  }
  function bar(value,maximum,index,isSigned = false) {
    const width = value === null ? 0 : Math.min(100,Math.max(0,Math.abs(finite(value)) / Math.max(1,maximum) * 100));
    return `<span class="acmp-track${isSigned ? ' acmp-signed' : ''}" aria-hidden="true"><i class="acmp-series-${index}${value < 0 ? ' is-negative' : ''}" style="width:${isSigned ? width/2 : width}%;${isSigned ? 'left:'+(value < 0 ? 50-width/2 : 50)+'%;' : ''}"></i></span>`;
  }
  function pair(model,title,values,{maximum = 100,suffix = '%',details = [],signedValues = false} = {}) {
    return `<div class="acmp-pair"><h4>${esc(title)}</h4>${values.map((value,i) => `<div class="acmp-pair-row"><span class="acmp-row-name"><i class="acmp-key acmp-series-${i}" aria-hidden="true"></i>${esc(model.names[i])}</span><strong>${value === null ? '—' : (signedValues ? signed(value) : number(value))}${value === null ? '' : `<small>${esc(suffix)}</small>`}</strong>${bar(value,maximum,i,signedValues)}${details[i] ? `<small class="acmp-detail">${esc(details[i])}</small>` : ''}</div>`).join('')}</div>`;
  }
  const note = text => `<p class="acmp-note">${esc(text)}</p>`;
  const empty = text => `<p class="acmp-empty">${esc(text)}</p>`;
  function summary(model,overview = false) {
    const rows = model.stats, values = key => rows.map(r => r.members ? r[key] : null);
    return `<div class="acmp-metrics">${pair(model,'All-skills progress',values('progress'))}${pair(model,'Average points',values('average'),{maximum:Math.max(1,...rows.map(r => r.average)),suffix:'pts'})}${pair(model,'Skills retained',values('retainedPercent'),{details:rows.map(r => `${r.retained} / ${r.total} skill marks`)})}${overview ? pair(model,'Perfect skills',values('perfectPercent'),{details:rows.map(r => `${r.perfect} / ${r.total} skill marks`)}) + pair(model,'Total league points',values('points'),{maximum:Math.max(1,...rows.map(r => r.points)),suffix:'pts'}) : ''}</div>${note('Progress gives every skill equal weight: Achieved is halfway and Perfect is full. Percentages and average points account for squad size.'+(overview ? ' Total points depend on the number of gymnasts.' : ''))}`;
  }
  function priorities(model,fn) {
    if (typeof fn !== 'function') return empty('Training priorities aren’t available for comparison yet.');
    const lists = model.members.map(group => fn(group,{scope:model.scope,includeComplete:true,limit:Infinity}) || []);
    const first = lists[0].filter(r => r.perfect < r.total).slice(0,10);
    // Keep one skill order for both squads. If the primary cohort has completed every skill,
    // use the comparison cohort’s next opportunities instead.
    const selected = first.length ? first : lists[1].filter(r => r.perfect < r.total).slice(0,10);
    if (!selected.length) return empty('Both selections have completed every available training priority.');
    return `<div class="acmp-priorities">${selected.map(row => {
      const skill = row.skill, compared = lists.map(list => list.find(r => r.skill.id === skill.id));
      const values = model.members.map((group,i) => group.length ? percent((compared[i]?.achieved || 0) + (compared[i]?.perfect || 0),group.length * 2) : null);
      const details = model.members.map((group,i) => {
        const r = compared[i];
        if (!group.length) return 'No gymnasts in this selection';
        return `${r?.achieved || 0} / ${group.length} achieved · ${r?.perfect || 0} / ${group.length} perfect · ${number(finite(r?.availablePoints))} next points available`;
      });
      return pair(model,skill.name || skill.id,values,{details});
    }).join('')}</div>${note('The same skills are compared in your selected group’s priority order. Next points are the combined gain from one next step per gymnast; larger squads may have more available points.')}`;
  }
  function categoryComparison(model) {
    return `<div class="acmp-metrics">${model.categories.map(category => {
      const skills = model.skills.filter(s => s.category === category.id);
      const rows = model.members.map(group => stats(model.data,group,skills,category.id));
      return pair(model,category.name || category.id,rows.map(r => r.members ? r.progress : null),{details:rows.map(r => `${r.retained} / ${r.total} retained · ${r.perfect} perfect`)});
    }).join('')}</div>${note('Each category uses the same 0–100% scale. Achieved counts halfway; Perfect counts fully.')}`;
  }
  function standings(model,config) {
    const weeklyMetric = config.rankMetric === 'weekly';
    if (weeklyMetric && model.scope === 'vault') return empty('Weekly Vault point history isn’t recorded yet.');
    const category = !config.rankCategory || config.rankCategory === 'overall' ? categoryFor(model.scope) : model.categories.some(c => c.id === config.rankCategory) ? config.rankCategory : categoryFor(model.scope);
    const series = model.members.map(group => historyFor(model.data,group,7,model.now));
    const lists = model.members.map((group,i) => group.map(person => {
      const record = series[i].find(r => r.person.id === person.id)?.series;
      return {person,value:weeklyMetric ? (record?.available ? record.net : null) : finite(model.data.summary?.(person.id,category)?.points),partial:weeklyMetric && record?.partial,days:record?.coverageDays};
    }).sort((a,b) => (a.value === null) - (b.value === null) || (b.value || 0) - (a.value || 0) || String(a.person.name || a.person.id).localeCompare(String(b.person.name || b.person.id),'en-GB')));
    const max = Math.max(1,...lists.flat().map(row => Math.abs(row.value || 0)));
    const title = weeklyMetric ? 'Recorded Floor gains · latest 7 saved days' : (model.categories.find(c => c.id === category)?.name || apparatusLabel(model.scope))+' points';
    return `${note(title)}<div class="acmp-ranking-columns">${lists.map((list,i) => `<section class="acmp-ranking"><h4><i class="acmp-key acmp-series-${i}" aria-hidden="true"></i>${esc(model.names[i])}</h4>${list.length ? `<ol>${list.map(row => `<li><span>${esc(row.person.name || row.person.id)}</span><strong>${row.value === null ? '—' : weeklyMetric ? signed(row.value) : number(row.value)}<small>${row.value === null ? 'no history' : 'pts'}</small></strong>${bar(row.value,max,i,weeklyMetric)}${row.partial ? `<small class="acmp-detail">${row.days} days recorded</small>` : ''}</li>`).join('')}</ol>` : empty('No gymnasts in this selection.')}</section>`).join('')}</div>${note('Both lists use the same scale. Matching scores are ordered alphabetically.'+(weeklyMetric ? ' Only saved Floor changes count; missing history is shown as —.' : ''))}`;
  }
  function momentum(model) {
    if (model.scope === 'vault') return empty('Vault point history isn’t recorded yet.');
    const groups = model.members.map(group => weekly(model.data,group,model.now));
    if (!groups.some(g => g.available)) return empty('No recorded Floor point history is available for either selection.');
    const max = Math.max(1,...groups.flatMap(group => group.rows.map(r => Math.abs(r.value || 0))));
    return `<div class="acmp-momentum">${groups[0].rows.map((row,i) => pair(model,row.label || `Window ${i+1}`,groups.map(g => g.rows[i].value),{maximum:max,suffix:'net pts',signedValues:true,details:groups.map(g => {
      const item = g.rows[i];
      return item.value === null ? 'No records for this window' : `${item.recorded} / ${g.memberCount} with records${item.partial ? ' · partial coverage' : ''}`;
    })})).join('')}</div>${note('Floor only · eight seven-day windows ending on the saved history date'+(groups[0].end !== null ? ' ('+shortDay(groups[0].end)+')' : '')+'. Signed totals share one scale: gains are right of zero; reductions are left. Partial coverage excludes unrecorded days or gymnasts; missing history is never treated as zero.')}${note('These are recorded gains and manual corrections for current squad members, not historical total scores. Renewals, automatic expiry and scoring-rule changes are excluded. Larger squads can gain more total points.')}`;
  }
  function ageComparison(model) {
    const categories = [...new Map((Array.isArray(model.data.ageCategories) ? model.data.ageCategories : []).filter(c => c && typeof c.id === 'string').map(c => [c.id,c])).values()];
    const known = new Set(categories.map(c => c.id));
    const age = person => {
      const result = model.data.ageCategory?.(person);
      const id = typeof result === 'string' ? result : result?.id;
      return known.has(id) ? id : 'unknown';
    };
    if (model.members.some(group => group.some(person => age(person) === 'unknown'))) categories.push({id:'unknown',name:'Age not recorded',range:''});
    const rows = categories.map(category => ({category,groups:model.members.map(group => group.filter(person => age(person) === category.id))})).filter(row => row.groups.some(group => group.length));
    if (!rows.length) return empty('No gymnasts or age groups are available in these selections.');
    return `<div class="acmp-metrics">${rows.map(({category,groups}) => pair(model,`${category.name}${category.range ? ' · '+category.range : ''}`,groups.map((group,i) => model.members[i].length ? percent(group.length,model.members[i].length) : null),{details:groups.map((group,i) => {
      const progress = stats(model.data,group,model.skills,categoryFor(model.scope)).progress;
      return `${group.length} / ${model.members[i].length} gymnasts${group.length ? ' · '+number(progress)+'% skill progress' : ' · no gymnasts in this age group'}`;
    })})).join('')}</div>${note('Bars show each age group’s share of its squad, using matching age groups and a shared 0–100% scale. Skill progress is shown alongside; this is a current snapshot, not an age target.')}`;
  }
  function render(config = {}) {
    const panel = config.panel;
    if (!PANELS.has(panel)) return '';
    const options = [...new Map((Array.isArray(config.options) ? config.options : []).filter(option => option && typeof option.id === 'string' && option.id).map(option => [option.id,option])).values()];
    const selected = typeof config.comparisonId === 'string' ? config.comparisonId : '';
    const active = Boolean(selected && options.some(option => option.id === selected));
    const control = `<label class="acmp-select" for="analytics-compare-${panel}"><span>Comparison squad</span><select id="analytics-compare-${panel}" data-panel-comparison="${panel}"><option value=""${active ? '' : ' selected'}>No comparison</option>${options.map(option => `<option value="${esc(option.id)}"${active && option.id === selected ? ' selected' : ''}>${esc(option.name || option.id)}</option>`).join('')}</select></label>`;
    let content = '';
    if (active) {
      const model = buildModel(config);
      const views = {priorities:() => priorities(model,config.priorities),squads:() => summary(model),overview:() => summary(model,true),categories:() => categoryComparison(model),standings:() => standings(model,config),momentum:() => momentum(model),ages:() => ageComparison(model)};
      content = `<div class="acmp-content">${legend(model)}${views[panel]()}${model.overlap ? note(`${model.overlap} ${model.overlap === 1 ? 'gymnast belongs' : 'gymnasts belong'} to both selections and contributes to each.`) : ''}</div>`;
    }
    return `<details class="analytics-compare${active ? ' has-comparison' : ''}" data-analytics-disclosure="compare-${panel}"${active ? ' open' : ''}><summary>Compare with another squad<span class="acmp-chevron" aria-hidden="true"></span></summary>${control}${content}</details>`;
  }
  window.SWLAnalyticsCompare = {render,buildModel,weekly};
})();
