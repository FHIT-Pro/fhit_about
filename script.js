/* FHIT — página informativa. Sem rede, sem coleta: tudo roda no navegador. */
(function () {
  'use strict'

  const $ = (sel, root = document) => root.querySelector(sel)
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

  /* ---------- Tema ---------- */
  const root = document.documentElement
  function storedTheme() {
    try { return localStorage.getItem('fhit-site-theme') } catch (e) { return null }
  }
  function applyTheme(t) {
    root.setAttribute('data-theme', t)
    try { localStorage.setItem('fhit-site-theme', t) } catch (e) { /* armazenamento indisponível: segue sem lembrar */ }
    const meta = $('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', t === 'light' ? '#f5f5f0' : '#09090b')
    refreshDemo()
  }
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
  root.setAttribute('data-theme', storedTheme() || (prefersLight ? 'light' : 'dark'))
  $('#themeBtn').addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light')
  })

  /* ---------- Nav com borda ao rolar ---------- */
  const nav = $('#nav')
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  /* ---------- Palavra rotativa do hero ---------- */
  const words = [
    { t: 'equilíbrio', c: 'finance' },
    { t: 'finanças', c: 'finance' },
    { t: 'corpo', c: 'body' },
    { t: 'mente', c: 'mind' },
  ]
  let wi = 0
  const rotator = $('#rotator')
  setInterval(() => {
    wi = (wi + 1) % words.length
    rotator.innerHTML = ''
    const span = document.createElement('span')
    span.className = 'r-word'
    span.dataset.color = words[wi].c
    span.textContent = words[wi].t
    rotator.appendChild(span)
    rotator.appendChild(document.createTextNode(','))
  }, 2400)

  /* ---------- Contadores ---------- */
  function countUp(el) {
    const target = Number(el.dataset.count)
    const start = performance.now()
    const dur = 1400
    const step = (now) => {
      const k = Math.min(1, (now - start) / dur)
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)))
      if (k < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  /* ---------- Revelar ao rolar ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add('in')
      $$('[data-count]', e.target).forEach(countUp)
      io.unobserve(e.target)
    })
  }, { threshold: 0.15 })
  $$('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 80}ms`
    io.observe(el)
  })

  // Anéis do hero
  setTimeout(() => {
    const arcs = { '.arc-fin': 82, '.arc-body': 74, '.arc-mind': 68 }
    Object.entries(arcs).forEach(([sel, v]) => {
      $(sel).style.strokeDasharray = `${v * 3} 300`
    })
  }, 300)

  /* ---------- Regras de pontuação (espelham src/business do app) ---------- */
  const scoreEssencial = (p) => p <= 40 ? 15 : p <= 45 ? 13 : p <= 50 ? 11 : p <= 55 ? 8 : p <= 60 ? 5 : 0
  const scoreNaoEssencial = (p) => p <= 20 ? 15 : p <= 25 ? 13 : p <= 30 ? 11 : p <= 35 ? 7 : p <= 40 ? 4 : 0
  const scoreSave = (p) => p >= 30 ? 20 : p >= 21 ? 17 : p >= 16 ? 14 : p >= 11 ? 10 : p >= 6 ? 5 : 0
  const scoreDti = (p) => p <= 20 ? 15 : p <= 30 ? 13 : p <= 35 ? 11 : p <= 45 ? 7 : p <= 60 ? 4 : 0
  const scoreEmergency = (months, mult = 6) => {
    const p = (months / mult) * 100
    return p >= 100 ? 20 : p >= 80 ? 17 : p >= 60 ? 14 : p >= 40 ? 10 : p >= 20 ? 5 : 0
  }
  const scoreIif = (p) => p >= 100 ? 15 : p >= 80 ? 13 : p >= 60 ? 11 : p >= 40 ? 8 : p >= 20 ? 5 : 0

  function financialStatus(s) {
    if (s >= 91) return ['Excelente', '--green']
    if (s >= 81) return ['Saudável', '--green']
    if (s >= 66) return ['Estável', '--warning']
    if (s >= 51) return ['Vulnerável', '--warning']
    if (s >= 36) return ['Instável', '--danger']
    return ['Crítico', '--danger']
  }

  function hydrationScore(liters, weight) {
    const meta = weight * 0.035
    if (liters <= 0 || meta <= 0) return 0
    const p = (liters / meta) * 100
    return p >= 100 ? 100 : p >= 90 ? 90 : p >= 80 ? 80 : p >= 70 ? 70 : p >= 60 ? 60 : p >= 50 ? 50 : 30
  }
  const SLEEP_ANCHORS = [{ min: 300, pts: 44 }, { min: 360, pts: 52 }, { min: 450, pts: 66 }, { min: 480, pts: 70 }]
  function sleepTimeScore(minutes) {
    if (minutes <= 0) return 0
    const m = minutes > 480 ? 960 - minutes : minutes
    if (m <= 0) return 0
    if (m >= 480) return 70
    if (m <= 300) {
      const slope = (52 - 44) / (360 - 300)
      return Math.max(0, Math.round(44 - (300 - m) * slope))
    }
    for (let i = 1; i < SLEEP_ANCHORS.length; i++) {
      const lo = SLEEP_ANCHORS[i - 1]
      const hi = SLEEP_ANCHORS[i]
      if (m <= hi.min) return Math.round(lo.pts + (hi.pts - lo.pts) * ((m - lo.min) / (hi.min - lo.min)))
    }
    return 70
  }
  // Na simulação, a regularidade do sono é fixa: variação de até 30 min (18) e 7 dias seguidos (10).
  const sleepScore = (hours) => Math.min(100, sleepTimeScore(Math.round(hours * 60)) + 18 + 10)
  const workoutScore = (min) => min >= 300 ? 100 : min >= 240 ? 90 : min >= 180 ? 80 : min >= 150 ? 70 : min >= 90 ? 50 : 20

  const MIND = {
    connection: { label: 'Conexão humana', pts: (n) => Math.min(100, n * 20), meta: '5 vezes' },
    purpose: { label: 'Propósito', pts: (n) => Math.min(100, n * 20), meta: '5 dias' },
    recovery: { label: 'Recuperação mental', pts: (n) => [0, 33, 66, 100][Math.min(3, n)], meta: '3 vezes' },
    reflection: { label: 'Reflexão', pts: (n) => Math.min(100, n * 20), meta: '5 dias' },
  }
  function ipmBand(s) {
    if (s >= 80) return ['Excelente', '--green']
    if (s >= 60) return ['Boa', '--green']
    if (s >= 40) return ['Desenvolvimento', '--warning']
    return ['Atenção', '--danger']
  }
  const bandColor = (s) => s >= 70 ? '--green' : s >= 40 ? '--warning' : '--danger'

  /* ---------- Demo ---------- */
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  const mindState = { connection: 3, purpose: 4, recovery: 2, reflection: 2 }
  let currentTab = 'fin'
  let shownScore = 0

  const ACCENT = { fin: '--finance', body: '--body', mind: '--mind' }
  // A tela do celular simulado é sempre escura (tema padrão do app), então usa a paleta escura fixa.
  const PHONE = {
    '--finance': '#92fcbe', '--body': '#06b6d4', '--mind': '#eab308',
    '--green': '#56e238', '--warning': '#f59e0b', '--danger': '#ef4444',
  }
  const TITLE = { fin: 'Finanças', body: 'Corpo', mind: 'Mente' }

  function val(id) { return Number($('#' + id).value) }
  function setOut(id, text) { const o = $('#o-' + id); if (o) o.textContent = text }

  function paintRange(input) {
    const p = ((input.value - input.min) / (input.max - input.min)) * 100
    input.style.setProperty('--p', `${p}%`)
  }

  function animateScore(target) {
    const from = shownScore
    const start = performance.now()
    const dur = 500
    const el = $('#scoreVal')
    const step = (now) => {
      const k = Math.min(1, (now - start) / dur)
      el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)))
      if (k < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    shownScore = target
  }

  function render({ score, badge, caption, rows, tip }) {
    const screen = $('.screen')
    screen.style.setProperty('--accent', PHONE[ACCENT[currentTab]])
    $('#scr-title').textContent = TITLE[currentTab]
    $('#donutArc').style.strokeDasharray = `${score} 100`
    animateScore(score)
    const b = $('#badge')
    b.textContent = badge[0]
    b.style.setProperty('--badge', PHONE[badge[1]])
    $('#scoreCaption').textContent = caption
    $('#rows').innerHTML = rows.map((r) => {
      const color = PHONE[r.color]
      const pct = Math.max(0, Math.min(100, r.pct))
      return `<div class="row"><div class="row-top"><b>${r.label}</b><span style="color:${color}">${r.value}</span></div>` +
        `<div class="bar"><i style="width:${pct}%;background:${color}"></i></div></div>`
    }).join('')
    $('#tip').textContent = tip
  }

  function computeFin() {
    const income = val('income')
    const ess = val('ess'); const non = val('noness'); const debt = val('debt')
    const reserve = val('reserve'); const passive = val('passive')
    ;['income', 'ess', 'noness', 'debt', 'reserve', 'passive'].forEach((k) => setOut(k, brl.format(val(k))))

    const living = ess + non
    const pEss = income ? (ess / income) * 100 : 100
    const pNon = income ? (non / income) * 100 : 100
    const pDebt = income ? (debt / income) * 100 : 100
    const pSave = income ? Math.max(0, ((income - ess - non - debt) / income) * 100) : 0
    const months = living > 0 ? reserve / living : 0
    const pIif = living > 0 ? (passive / living) * 100 : 0

    const parts = [
      { label: 'Gastos essenciais', s: scoreEssencial(pEss), max: 15, value: `${Math.round(pEss)}% da renda`, tip: 'Seus gastos essenciais passam do ideal (até 40% da renda). Vale revisar moradia, contas e transporte.' },
      { label: 'Não essenciais', s: scoreNaoEssencial(pNon), max: 15, value: `${Math.round(pNon)}% da renda`, tip: 'Os gastos não essenciais estão altos. O ideal é até 20% da renda.' },
      { label: 'Quanto sobra', s: scoreSave(pSave), max: 20, value: `${Math.round(pSave)}% da renda`, tip: 'Sobra pouco no fim do mês. Tente guardar ao menos 10% da renda.' },
      { label: 'Dívidas', s: scoreDti(pDebt), max: 15, value: `${Math.round(pDebt)}% da renda`, tip: 'As parcelas de dívidas pesam no orçamento. O ideal é até 20% da renda.' },
      { label: 'Reserva de emergência', s: scoreEmergency(months), max: 20, value: `${months.toFixed(1).replace('.', ',')} meses`, tip: 'Sua reserva cobre menos de 6 meses de custo de vida. Ela é a sua proteção contra imprevistos.' },
      { label: 'Independência financeira', s: scoreIif(pIif), max: 15, value: `${Math.round(pIif)}% do custo`, tip: 'Sua renda passiva ainda cobre pouco do custo de vida. Investimentos que geram renda aceleram a independência.' },
    ]
    const score = parts.reduce((a, p) => a + p.s, 0)
    const weakest = parts.reduce((a, p) => (p.s / p.max < a.s / a.max ? p : a))
    return {
      score,
      badge: financialStatus(score),
      caption: 'Score financeiro do mês',
      rows: parts.map((p) => ({ label: p.label, value: p.value, pct: (p.s / p.max) * 100, color: bandColor((p.s / p.max) * 100) })),
      tip: weakest.s === weakest.max ? 'Todos os indicadores estão no ideal. Continue assim!' : `Dica FHIT: ${weakest.tip}`,
    }
  }

  function computeBody() {
    const weight = val('weight'); const water = val('water'); const sleep = val('sleep'); const workout = val('workout')
    const meta = weight * 0.035
    setOut('weight', `${weight} kg`)
    setOut('water', `${water.toFixed(2).replace('.', ',')} L`)
    const h = Math.floor(sleep); const m = Math.round((sleep - h) * 60)
    setOut('sleep', `${h}h${m ? String(m).padStart(2, '0') : ''}`)
    setOut('workout', `${workout} min`)

    const sh = hydrationScore(water, weight)
    const ss = sleepScore(sleep)
    const sw = workoutScore(workout)
    const score = Math.round((sh + ss + sw) / 3)
    const items = [
      { label: 'Hidratação', s: sh, value: `${water.toFixed(2).replace('.', ',')} de ${meta.toFixed(1).replace('.', ',')} L`, tip: `Sua meta de água é ${meta.toFixed(1).replace('.', ',')} L por dia. Deixe uma garrafa por perto.` },
      { label: 'Sono', s: ss, value: `${h}h${m ? String(m).padStart(2, '0') : ''}`, tip: 'Dormir perto de 8 horas por noite melhora a recuperação e o humor.' },
      { label: 'Atividade física', s: sw, value: `${workout} min/sem`, tip: 'A recomendação é de pelo menos 150 minutos de atividade por semana.' },
    ]
    const weakest = items.reduce((a, i) => (i.s < a.s ? i : a))
    return {
      score,
      badge: score >= 80 ? ['Excelente', '--green'] : score >= 70 ? ['Bom', '--green'] : score >= 40 ? ['Regular', '--warning'] : ['Atenção', '--danger'],
      caption: 'Média dos hábitos de hoje',
      rows: items.map((i) => ({ label: i.label, value: i.value, pct: i.s, color: bandColor(i.s) })),
      tip: weakest.s >= 90 ? 'Hábitos em dia. Seu corpo agradece!' : `Dica FHIT: ${weakest.tip}`,
    }
  }

  function computeMind() {
    const items = Object.entries(MIND).map(([k, cfg]) => ({ k, ...cfg, n: mindState[k], s: cfg.pts(mindState[k]) }))
    const score = Math.round(items.reduce((a, i) => a + i.s, 0) / items.length)
    const weakest = items.reduce((a, i) => (i.s < a.s ? i : a))
    return {
      score,
      badge: ipmBand(score),
      caption: 'Índice de Paz Mental da semana',
      rows: items.map((i) => ({ label: i.label, value: `${i.s} pts`, pct: i.s, color: bandColor(i.s) })),
      tip: weakest.s >= 80
        ? 'Todos os pilares acima de 80. Semana de mente em paz!'
        : `Pilar mais fraco: ${weakest.label}. A meta é ${weakest.meta} por semana.`,
    }
  }

  function refreshDemo() {
    if (!$('.screen')) return
    const data = currentTab === 'fin' ? computeFin() : currentTab === 'body' ? computeBody() : computeMind()
    render(data)
    $$('input[type="range"]').forEach(paintRange)
  }

  // Sliders
  $$('.controls input[type="range"]').forEach((input) => {
    input.addEventListener('input', () => { paintRange(input); refreshDemo() })
  })

  // Chips da Mente (0 a 7)
  $$('.ctl-chips').forEach((group) => {
    const key = group.dataset.key
    const box = $('.chips', group)
    for (let n = 0; n <= 7; n++) {
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = String(n)
      b.setAttribute('aria-label', `${MIND[key].label}: ${n}`)
      if (n === mindState[key]) b.classList.add('on')
      b.addEventListener('click', () => {
        mindState[key] = n
        $$('button', box).forEach((x) => x.classList.toggle('on', x === b))
        refreshDemo()
      })
      box.appendChild(b)
    }
  })

  // Abas
  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      currentTab = tab.dataset.tab
      $$('.tab').forEach((t) => {
        const on = t === tab
        t.classList.toggle('active', on)
        t.setAttribute('aria-selected', String(on))
      })
      $$('.panel').forEach((p) => { p.hidden = p.dataset.panel !== currentTab })
      $('.controls').style.setProperty('--accent', cssVar(ACCENT[currentTab]))
      refreshDemo()
    })
  })
  $('.controls').style.setProperty('--accent', cssVar(ACCENT.fin))
  computeBody() // preenche os rótulos da aba Corpo antes de ela ser aberta
  refreshDemo()

  /* ---------- Pote de cookies ---------- */
  const COOKIES = [
    '“Terminei a primeira corrida de 5 km, mesmo achando que não ia conseguir.”',
    '“Quitei o cartão de crédito depois de oito meses de disciplina.”',
    '“Passei na prova que eu tinha reprovado duas vezes.”',
    '“Fiquei 30 dias sem refrigerante.”',
    '“Pedi ajuda quando precisei, e isso mudou tudo.”',
    '“Juntei minha primeira reserva de emergência do zero.”',
  ]
  let lastCookie = 0
  $('#cookieBtn').addEventListener('click', () => {
    let next
    do { next = Math.floor(Math.random() * COOKIES.length) } while (next === lastCookie)
    lastCookie = next
    const box = $('#cookie')
    $('#cookieText').textContent = COOKIES[next]
    box.classList.remove('pop')
    void box.offsetWidth
    box.classList.add('pop')
  })

  $('#year').textContent = String(new Date().getFullYear())
})()
