/* BudgetBasics / NextGen BudgetBee
   Client-side learning demo. Planner entries and form content are never transmitted. */
(() => {
    'use strict';
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const money = value => 'Rs. ' + Number(value).toLocaleString('en-PK', { maximumFractionDigits: 2 });
    const finitePositive = value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
    const toast = message => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2600); };

    // Mobile navigation and page controls
    const menu = $('#mainNav'), menuToggle = $('#menuToggle');
    menuToggle.addEventListener('click', () => { const open = menu.classList.toggle('open'); menuToggle.setAttribute('aria-expanded', String(open)); menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); menuToggle.textContent = open ? '×' : '☰'; });
    $$('#mainNav a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.textContent = '☰'; }));
    const themeToggle = $('#themeToggle');
    const updateBeeArtwork = dark => {
        const logo = `assets/images/budgetbee-logo${dark ? '-dark' : ''}.svg`;
        const avatar = `assets/images/budgetbee-avatar${dark ? '-dark' : ''}.svg`;
        $$('[data-bee-logo]').forEach(image => image.src = logo);
        $$('[data-bee-avatar]').forEach(image => image.src = avatar);
    };
    const applyTheme = dark => { document.body.classList.toggle('dark', dark); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; updateBeeArtwork(dark); themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode'); themeToggle.textContent = dark ? '☼' : '◐'; };
    try { applyTheme((localStorage.getItem('theme') || localStorage.getItem('budgetbasics-theme')) !== 'light'); } catch { applyTheme(true); }
    themeToggle.addEventListener('click', () => { const dark = !document.body.classList.contains('dark'); applyTheme(dark); try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { } });
    const tick = () => { const now = new Date(); const dateTime = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now); $('#liveClock').textContent = dateTime; $('#footerClock').textContent = dateTime; };
    tick(); setInterval(tick, 1000);
    $('#footerYear').textContent = String(new Date().getFullYear());
    const backTop = $('#backTop'); window.addEventListener('scroll', () => backTop.classList.toggle('visible', window.scrollY > 500), { passive: true }); backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    const updateBackgroundState = () => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = window.scrollY / maxScroll;
        document.body.classList.toggle('scrolled', window.scrollY > 8);
        document.body.classList.remove('in-middle', 'in-bottom');
        if (window.scrollY > 40 && progress >= .82) document.body.classList.add('in-bottom');
        else if (window.scrollY > 40 && progress >= .24) document.body.classList.add('in-middle');
    };
    window.addEventListener('scroll', updateBackgroundState, { passive: true });
    window.addEventListener('resize', updateBackgroundState, { passive: true });
    updateBackgroundState();
    try { const key = 'budgetbasics-visits-' + new Date().toISOString().slice(0, 10); const count = Math.min(999999, Number(localStorage.getItem(key)) || 1283) + 1; localStorage.setItem(key, String(count)); $('#visitorCount').textContent = count.toLocaleString(); } catch { $('#visitorCount').textContent = '1,284'; }
    const loadingScreen = $('#loadingScreen');
    if (loadingScreen) setTimeout(() => loadingScreen.classList.add('done'), 950);
    // Pointer tilt uses transforms only and is disabled on touch and reduced-motion devices.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ambientScene = $('#ambientScene');
    const backgroundShapes = $$('#ambientScene [data-depth]');
    if (ambientScene && backgroundShapes.length && !reduceMotion) {
        const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const motionScale = finePointer ? 1 : .42;
        let targetX = 0, targetY = 0, targetScroll = window.scrollY;
        let currentX = 0, currentY = 0, currentScroll = window.scrollY, frame = 0;
        const requestAmbientFrame = () => { if (!frame) frame = requestAnimationFrame(updateAmbient); };
        const updateAmbient = () => {
            frame = 0;
            currentX += (targetX - currentX) * .085;
            currentY += (targetY - currentY) * .085;
            currentScroll += (targetScroll - currentScroll) * .09;
            backgroundShapes.forEach(shape => {
                const depth = Number(shape.dataset.depth) * motionScale;
                const x = currentX * depth * 62;
                const y = currentY * depth * 62 - currentScroll * depth * .42;
                const tiltX = -currentY * depth * 18;
                const tiltY = currentX * depth * 18 + currentScroll * depth * .012;
                shape.style.setProperty('--parallax-x', `${x.toFixed(2)}px`);
                shape.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
                shape.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
                shape.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
            });
            if (Math.abs(targetX - currentX) > .008 || Math.abs(targetY - currentY) > .008 || Math.abs(targetScroll - currentScroll) > .3) requestAmbientFrame();
        };
        if (finePointer) {
            window.addEventListener('pointermove', event => {
                targetX = (event.clientX / window.innerWidth - .5) * 2;
                targetY = (event.clientY / window.innerHeight - .5) * 2;
                requestAmbientFrame();
            }, { passive: true });
            document.documentElement.addEventListener('pointerleave', () => { targetX = 0; targetY = 0; requestAmbientFrame(); });
        }
        window.addEventListener('scroll', () => { targetScroll = window.scrollY; requestAmbientFrame(); }, { passive: true });
    }
    if (!reduceMotion && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('reveal-ready');
            revealObserver.unobserve(entry.target);
        }), { threshold: .08 });
        $$('.section').forEach(section => revealObserver.observe(section));
        const countObserver = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const number = entry.target, target = Number(number.textContent.replace(/[^0-9]/g, ''));
            const start = performance.now(), duration = 900;
            const animate = now => {
                const progress = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - progress, 3);
                number.textContent = 'Rs. ' + Math.round(target * eased).toLocaleString('en-PK');
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
            countObserver.unobserve(number);
        }), { threshold: .6 });
        $$('.snapshot-card strong').forEach(number => countObserver.observe(number));
    }
    if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        $$('.concept-card, .calculator-card, .visual-card, .contact-card, .snapshot-card, .goal-card, .item-card').forEach(card => {
            card.classList.add('tilt-card');
            card.addEventListener('pointermove', event => {
                const bounds = card.getBoundingClientRect();
                const x = (event.clientX - bounds.left) / bounds.width - .5;
                const y = (event.clientY - bounds.top) / bounds.height - .5;
                card.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
                card.style.setProperty('--tilt-y', `${(x * 4).toFixed(2)}deg`);
            });
            card.addEventListener('pointerleave', () => {
                card.style.setProperty('--tilt-x', '0deg');
                card.style.setProperty('--tilt-y', '0deg');
            });
        });
    }

    // Sample 50/30/20 calculator
    $('#budgetForm').addEventListener('submit', event => { event.preventDefault(); const input = $('#incomeInput').value.trim(), error = $('#budgetError'); if (!finitePositive(input) || Number(input) <= 0) { error.textContent = input === '' ? 'Enter a monthly income to calculate your sample split.' : 'Enter a number greater than zero.'; return; } error.textContent = ''; const income = Number(input); const values = [income * .5, income * .3, income * .2]; $$('.result-row b').forEach((row, index) => { row.textContent = money(values[index]); }); });
    $('#incomeInput').addEventListener('input', () => $('#budgetError').textContent = '');

    // Savings goal estimate
    $('#savingsForm').addEventListener('submit', event => {
        event.preventDefault(); const name = $('#goalName').value.trim(), targetText = $('#targetAmount').value.trim(), currentText = $('#currentAmount').value.trim(), contributionText = $('#contribution').value.trim(), error = $('#savingsError');
        if (!name || !targetText || !currentText || !contributionText) { error.textContent = 'Please complete all four fields to make a goal plan.'; return; }
        if (![targetText, currentText, contributionText].every(finitePositive) || Number(targetText) <= 0) { error.textContent = 'Use valid non-negative amounts and a target greater than zero.'; return; }
        const target = Number(targetText), current = Number(currentText), contribution = Number(contributionText); if (current < target && contribution <= 0) { error.textContent = 'Add a monthly contribution greater than zero to estimate a timeline.'; return; }
        error.textContent = ''; const remaining = Math.max(0, target - current), percent = Math.min(100, (current / target) * 100), months = remaining === 0 ? 0 : Math.ceil(remaining / contribution);
        $('#savingsResult').innerHTML = `<div class="goal-spark">✳</div><span class="card-label">YOUR GOAL PREVIEW</span><h3>${escapeHtml(name)}</h3><p>${remaining === 0 ? 'You reached your target. That is worth celebrating!' : `${money(remaining)} left to reach your goal.`}</p><div class="goal-progress"><span style="width:${percent}%"></span></div><div class="goal-foot"><span>${percent.toFixed(0)}% complete · ${money(current)} saved</span><b>${remaining === 0 ? 'Goal complete!' : `${months} month${months === 1 ? '' : 's'} estimated`}</b></div><div class="tip-box">💡 <span><b>Bee's tip</b><br>${remaining === 0 ? 'Consider choosing a new goal or enjoying what you achieved.' : 'Small, regular contributions can make a big goal feel more manageable.'}</span></div>`;
        const progressRing = document.createElement('div');
        progressRing.className = 'goal-ring';
        progressRing.style.setProperty('--goal-progress', `${percent * 3.6}deg`);
        progressRing.setAttribute('role', 'img');
        progressRing.setAttribute('aria-label', `${percent.toFixed(0)} percent of ${name} savings goal complete`);
        progressRing.innerHTML = `<span>${percent.toFixed(0)}<small>%</small></span>`;
        $('#savingsResult').querySelector('.goal-progress').before(progressRing);
    });

    // Needs and wants practice: each item has an educational context, not a universal answer.
    const items = [
        { name: 'Textbooks', emoji: '📚', type: 'Need', why: 'Course materials support your current studies.' },
        { name: 'Gaming subscription', emoji: '🎮', type: 'Want', why: 'Entertainment can be enjoyable, but it is usually optional.' },
        { name: 'Groceries', emoji: '🥬', type: 'Need', why: 'Food is an everyday essential.' },
        { name: 'New headphones', emoji: '🎧', type: 'Want', why: 'A replacement may be a need if your old pair is essential for study; an upgrade is often a want.' },
        { name: 'Bus fare to class', emoji: '🚌', type: 'Need', why: 'Transport to class can be an essential study cost.' },
        { name: 'Movie ticket', emoji: '🎟️', type: 'Want', why: 'A movie is a fun optional activity.' },
        { name: 'Rent', emoji: '🏠', type: 'Need', why: 'A safe place to live is a basic necessity.' },
        { name: 'Designer shoes', emoji: '👟', type: 'Want', why: 'A premium style choice is usually optional; practical footwear can be a need.' }
    ]; let gameIndex = 0, score = 0, answered = 0;
    const showItem = () => { const item = items[gameIndex], card = $('.item-card'); $('#itemName').textContent = item.name; $('#itemEmoji').textContent = item.emoji; $('#gameScore').textContent = `${score} / ${answered}`; $('#sortFeedback').textContent = 'Tap a choice to begin'; card.classList.remove('answer-correct', 'answer-incorrect'); $$('.sort-buttons button').forEach(button => button.disabled = false); };
    $$('.sort-buttons button').forEach(button => button.addEventListener('click', () => { if (answered > 0 && $('#sortFeedback').dataset.done === 'true') return; const item = items[gameIndex], correct = button.dataset.sort === item.type, card = $('.item-card'); if (correct) score++; answered++; $('#gameScore').textContent = `${score} / ${answered}`; $('#sortFeedback').textContent = `${correct ? 'That makes sense!' : `This example is usually a ${item.type.toLowerCase()}.`} ${item.why}`; card.classList.add(correct ? 'answer-correct' : 'answer-incorrect'); $('#sortFeedback').dataset.done = 'true'; $$('.sort-buttons button').forEach(b => b.disabled = true); setTimeout(() => { gameIndex = (gameIndex + 1) % items.length; delete $('#sortFeedback').dataset.done; showItem(); }, 2300); }));
    showItem();
    $$('[data-quiz]').forEach(button => button.addEventListener('click', () => { $('#quizFeedback').textContent = button.dataset.quiz === 'right' ? 'Correct! A textbook needed for class is an education essential.' : 'Not quite. A class textbook is usually the need in this example.'; $('#quizFeedback').style.color = button.dataset.quiz === 'right' ? 'var(--green)' : '#c47850'; }));

    // Expense planner deliberately keeps data in memory only.
    let expenses = [], editingId = null;
    try { const savedExpenses = JSON.parse(localStorage.getItem('budgetbasics-expenses') || '[]'); if (Array.isArray(savedExpenses)) expenses = savedExpenses.filter(item => item && typeof item.description === 'string' && Number.isFinite(item.amount) && item.amount > 0); } catch { expenses = []; }
    const saveExpenses = () => { try { localStorage.setItem('budgetbasics-expenses', JSON.stringify(expenses)); } catch { toast('Browser storage is unavailable; this list is temporary.'); } };
    const renderExpenses = () => {
        const filter = $('#categoryFilter').value, query = $('#expenseSearch').value.trim().toLowerCase(), visible = expenses.filter(expense => (filter === 'all' || expense.category === filter) && `${expense.category} ${expense.description} ${expense.date}`.toLowerCase().includes(query)), rows = $('#expenseRows'); rows.innerHTML = visible.length ? visible.map(expense => `<tr><td>${escapeHtml(expense.date || '—')}</td><td>${escapeHtml(expense.category)}</td><td>${escapeHtml(expense.description)}</td><td>${money(expense.amount)}</td><td><button class="row-action" data-edit="${expense.id}">Edit</button><button class="row-action delete-action" data-delete="${expense.id}">Delete</button></td></tr>`).join('') : `<tr class="empty-row"><td colspan="5">${expenses.length ? 'No matching expenses.' : 'Your practice list is empty. Add a sample expense above.'}</td></tr>`; const total = expenses.reduce((sum, expense) => sum + expense.amount, 0); $('#expenseTotal').textContent = money(total); $('#remainingBalance').textContent = money(50000 - total); saveExpenses();
        $$('[data-edit]', rows).forEach(button => button.addEventListener('click', () => { const expense = expenses.find(item => item.id === button.dataset.edit); if (!expense) return; editingId = expense.id; $('#expenseDate').value = expense.date; $('#expenseCategory').value = expense.category; $('#expenseDescription').value = expense.description; $('#expenseAmount').value = expense.amount; $('#expenseForm button[type="submit"]').textContent = 'Save changes'; $('#expenseDescription').focus(); }));
        $$('[data-delete]', rows).forEach(button => button.addEventListener('click', () => { expenses = expenses.filter(item => item.id !== button.dataset.delete); saveExpenses(); renderExpenses(); toast('Sample expense removed.'); }));
    };
    $('#expenseDate').value = new Date().toISOString().slice(0, 10);
    $('#expenseForm').addEventListener('submit', event => { event.preventDefault(); const date = $('#expenseDate').value, category = $('#expenseCategory').value, description = $('#expenseDescription').value.trim(), amountText = $('#expenseAmount').value.trim(), error = $('#expenseError'); if (!date || !description || !amountText) { error.textContent = 'Add a date, description, and amount.'; return; } if (!finitePositive(amountText) || Number(amountText) <= 0) { error.textContent = 'Enter an expense amount greater than zero.'; return; } const record = { id: editingId || (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`), date, category, description, amount: Number(amountText) }; if (editingId) { expenses = expenses.map(item => item.id === editingId ? record : item); editingId = null; $('#expenseForm button[type="submit"]').textContent = '+ Add expense'; toast('Sample expense updated.'); } else { expenses.push(record); } error.textContent = ''; $('#expenseDescription').value = ''; $('#expenseAmount').value = ''; renderExpenses(); });
    $('#categoryFilter').addEventListener('change', renderExpenses);
    $('#expenseSearch').addEventListener('input', renderExpenses);
    renderExpenses();

    // Gallery topic controls
    $$('[data-filter]').forEach(button => button.addEventListener('click', () => { $$('[data-filter]').forEach(item => item.classList.toggle('active', item === button)); $$('.visual-card').forEach(card => card.hidden = button.dataset.filter !== 'all' && card.dataset.topic !== button.dataset.filter); }));

    // Rule-based educational helper, with safe text rendering.
    const answers = [
        [/(what is )?(a )?need|needs? kya|zaroorat|zaroori cheez/i, 'A need (zaroorat) is something essential for wellbeing or responsibilities, such as food, a safe home, or required study materials. Context matters: your situation can change what is essential.'],
        [/(what is )?(a )?want|wants? kya|khwahish/i, 'A want (khwahish) is something you would like but can usually live without, such as a movie ticket or premium upgrade. It is okay to enjoy wants when they fit your plan.'],
        [/(overspend|spend too|impulse|impulsive|fazool kharch|zyada kharch)/i, 'Try pausing before a non-essential purchase, setting a comfortable spending plan, and checking a few small expenses. A 24-hour wait can help with impulse buys.'],
        [/(50\s*\/\s*30\s*\/\s*20|50\s+30\s+20|fifty.*thirty|rule kya)/i, 'It is a flexible budgeting guideline: about 50% for needs, 30% for wants, and 20% for savings. It is a starting point, not a rule; adjust it to fit your circumstances.'],
        [/(budget|budgeting|mahina.*plan|paise ka plan)/i, 'A budget is a simple plan for the money you receive and the expenses you expect. It can help you make room for needs, wants, and goals. Open the 50/30/20 calculator to try a sample plan.'],
        [/(goal|target|contribut|set.*saving|savings goal|saving goal)/i, 'Give your goal a name and target, subtract what you have already saved, then choose a monthly contribution that feels manageable. The Savings Goals tool estimates months by dividing what remains by that contribution.'],
        [/(save|saving|savings|bachane|bachao|paise.*bach|paisa.*save)/i, 'There is no single right amount to save. The 50/30/20 guideline suggests 20% when it fits, but start with an amount that works for your circumstances and goals. Try Savings Goals to estimate a monthly amount.'],
        [/(expense|kharcha|kharchay|spending)/i, 'An expense (kharcha) is money spent on something, such as transport, food, or course materials. Grouping expenses in the planner can help you understand your habits.'],
        [/(income|allowance|pocket money|aamdani)/i, 'Income (aamdani) is money you receive, such as an allowance, wages, or a scholarship. A budget gives that money a plan.'],
        [/(hello|^hi\b|salam|assalam)/i, 'Hi! I can explain budgeting, saving, needs and wants, expenses, and the 50/30/20 guideline. You can ask in English or Roman Urdu.']
    ];
    const fallback = 'I can help with budgeting, saving, needs and wants, expenses, income, and the 50/30/20 guideline. Try asking "budget kya hota hai?" or use one of the suggested questions.';
    const respond = text => { const match = answers.find(([pattern]) => pattern.test(text)); return match ? match[1] : fallback; };
    const voiceStatus = $('#voiceStatus'), chatPanel = $('#chatPanel'), launcher = $('#chatLauncher');
    document.body.append(chatPanel);
    let muted = false, recognition = null, voiceTurn = false, availableVoices = [], selectedVoiceGender = 'female', voiceAvailable = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    const setVoiceStatus = (message, state = '') => { voiceStatus.textContent = message; chatPanel.classList.toggle('listening', state === 'listening'); chatPanel.classList.toggle('speaking', state === 'speaking'); };
    const loadVoices = () => { availableVoices = window.speechSynthesis?.getVoices?.() || []; };
    const chooseVoice = gender => {
        const voices = availableVoices.filter(voice => /^en(-|_)/i.test(voice.lang));
        const femaleNames = /female|woman|zira|susan|samantha|karen|moira|fiona| victoria|ava|allison|aria|jenny|libby|sara/i;
        const maleNames = /male|man|david|mark|daniel|alex|george|guy|ryan|brian|arthur|fred/i;
        const pattern = gender === 'female' ? femaleNames : maleNames;
        return voices.find(voice => pattern.test(voice.name)) || voices.find(voice => voice.lang.toLowerCase().startsWith('en-us')) || voices[0];
    };
    loadVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    $('#voiceGender').addEventListener('change', event => { selectedVoiceGender = event.target.value; window.speechSynthesis?.cancel(); setVoiceStatus(`${selectedVoiceGender === 'female' ? 'Larki' : 'Larka'} voice selected. Ask BudgetBee anything`); });
    const speak = text => {
        if (muted || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
        const speakerName = selectedVoiceGender === 'female' ? 'Novai' : 'Leo';
        window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(`${speakerName} here. ${text}`); const voice = chooseVoice(selectedVoiceGender); utterance.lang = voice?.lang || 'en-US'; if (voice) utterance.voice = voice; utterance.rate = .96; utterance.pitch = selectedVoiceGender === 'female' ? 1.08 : .92;
        utterance.onstart = () => setVoiceStatus('🔊 BudgetBee is speaking...', 'speaking');
        utterance.onend = utterance.onerror = () => setVoiceStatus('Click the microphone to ask BudgetBee');
        window.speechSynthesis.speak(utterance);
    };
    const addMessage = (text, who, shouldSpeak = false) => {
        const node = document.createElement('div'); node.className = `message ${who}-message`;
        if (who === 'bot') { const avatar = document.createElement('img'); avatar.className = 'message-avatar'; avatar.dataset.beeAvatar = ''; avatar.src = `assets/images/budgetbee-avatar${document.body.classList.contains('dark') ? '-dark' : ''}.svg`; avatar.alt = ''; node.append(avatar); }
        const messageText = document.createElement('span'); messageText.className = 'message-text'; messageText.textContent = text; node.append(messageText);
        if (who === 'bot') { const button = document.createElement('button'); button.type = 'button'; button.className = 'speak-button'; button.setAttribute('aria-label', 'Read response aloud'); button.title = 'Read response aloud'; button.textContent = '🔊 Listen'; node.append(button); }
        const time = document.createElement('time'); time.textContent = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date()); node.append(time);
        $('#chatMessages').append(node); $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight; if (shouldSpeak) speak(text); return node;
    };
    const shortcuts = [
        [/(open )?(budget calculator|calculator|hisab kitab|50\s*\/\s*30\s*\/\s*20)/, '#rule', 'Opening the 50/30/20 budget calculator.'],
        [/(open )?(savings goals?|saving goals?|saving target|bachat goal)/, '#savings', 'Opening Savings Goals.'],
        [/(open )?(expense planner|expenses planner|kharcha planner)/, '#planner', 'Opening the Expense Planner.'],
        [/(show )?(money mistakes|mistakes)/, '#mistakes', 'Opening Money Mistakes.'],
        [/(open )?(needs and wants|needs & wants)/, '#needs', 'Opening Needs vs Wants.'],
        [/(go )?(home|to home)/, '#home', 'Going to the home section.']
    ];
    const runShortcut = text => {
        const normalized = text.toLowerCase().replace(/[?.!,]/g, '').trim();
        if (/^(stop speaking|stop talking)$/.test(normalized)) { window.speechSynthesis?.cancel(); setVoiceStatus('Speech stopped. Click the microphone to ask BudgetBee'); return true; }
        const found = shortcuts.find(([pattern]) => pattern.test(normalized)); if (!found) return false;
        addMessage(found[2], 'bot', true); document.querySelector(found[1])?.scrollIntoView({ behavior: 'smooth' }); return true;
    };
    const sendChat = (text, options = {}) => {
        const clean = text.trim(); if (!clean) return; voiceTurn = Boolean(options.voice); addMessage(clean, 'user'); if (!options.keepInput) $('#chatInput').value = '';
        if (runShortcut(clean)) { if (options.keepInput) $('#chatInput').value = ''; voiceTurn = false; setTimeout(() => setVoiceStatus('Click the microphone to ask BudgetBee'), 900); return; }
        setVoiceStatus('Thinking...'); const typing = document.createElement('div'); typing.className = 'message bot-message typing-message'; typing.textContent = 'Thinking...'; $('#chatMessages').append(typing); $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
        setTimeout(() => { typing.remove(); if (options.keepInput && $('#chatInput').value === clean) $('#chatInput').value = ''; const response = respond(clean); addMessage(response, 'bot', true); voiceTurn = false; if (!window.speechSynthesis?.speaking) setVoiceStatus('Click the microphone to ask BudgetBee'); }, 450);
    };
    $('#chatForm').addEventListener('submit', event => { event.preventDefault(); sendChat($('#chatInput').value); });
    $$('[data-prompt]').forEach(button => button.addEventListener('click', () => sendChat(button.dataset.prompt)));
    $('#chatMessages').addEventListener('click', event => { const button = event.target.closest('.speak-button'); if (button) speak(button.parentElement.querySelector('.message-text')?.textContent || ''); });
    const closeChat = (restoreFocus = false) => { chatPanel.classList.remove('open', 'minimized'); launcher.setAttribute('aria-expanded', 'false'); launcher.setAttribute('aria-label', 'Open BudgetBee'); if (restoreFocus) launcher.focus(); };
    const openChat = () => { chatPanel.classList.add('open'); chatPanel.classList.remove('minimized'); launcher.classList.add('tip-hidden'); launcher.setAttribute('aria-expanded', 'true'); launcher.setAttribute('aria-label', 'Close BudgetBee'); setTimeout(() => $('#chatInput').focus(), 180); };
    launcher.addEventListener('click', () => chatPanel.classList.contains('open') ? closeChat() : openChat());
    $$('a[href="#chatbot"]').forEach(link => link.addEventListener('click', event => {
        event.preventDefault();
        menu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        openChat();
    }));
    $('#chatClose').addEventListener('click', () => closeChat(true));
    $('#chatMinimize').addEventListener('click', () => closeChat());
    $('#clearChat').addEventListener('click', () => {
        $('#chatMessages').replaceChildren();
        addMessage("Hey! I'm BudgetBee. I can help you understand budgeting, saving, expenses and the 50/30/20 rule. What would you like to learn?", 'bot');
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && chatPanel.classList.contains('open')) closeChat(true); });
    document.addEventListener('pointerdown', event => {
        if (chatPanel.classList.contains('open') && !chatPanel.contains(event.target) && !launcher.contains(event.target) && !event.target.closest('a[href="#chatbot"]')) closeChat();
    });
    setTimeout(() => launcher.classList.add('tip-hidden'), 6500);
    $('#muteToggle').addEventListener('click', event => { muted = !muted; const button = event.currentTarget; button.setAttribute('aria-pressed', String(muted)); button.setAttribute('aria-label', muted ? 'Unmute speech' : 'Mute speech'); button.textContent = muted ? '🔇' : '🔊'; if (muted) { window.speechSynthesis?.cancel(); setVoiceStatus('Speech muted. Text chat is still available.'); } });
    $('#stopSpeaking').addEventListener('click', () => { window.speechSynthesis?.cancel(); setVoiceStatus('Speech stopped. Click the microphone to ask BudgetBee'); });
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Recognition) {
        $('#micButton').addEventListener('click', () => {
            if (recognition) { recognition.stop(); return; }
            recognition = new Recognition(); recognition.lang = 'en-US'; recognition.interimResults = false; recognition.maxAlternatives = 1;
            recognition.onstart = () => setVoiceStatus('🎤 Listening...', 'listening');
            recognition.onresult = event => { const transcript = event.results?.[0]?.[0]?.transcript?.trim(); if (!transcript) { setVoiceStatus("Sorry, I couldn't hear you. Please try again."); return; } $('#chatInput').value = transcript; setVoiceStatus('Thinking...'); sendChat(transcript, { voice: true, keepInput: true }); };
            recognition.onerror = event => { const permission = ['not-allowed', 'service-not-allowed'].includes(event.error); setVoiceStatus(permission ? 'Microphone permission is required for voice commands.' : "Sorry, I couldn't hear you. Please try again."); };
            recognition.onend = () => { recognition = null; chatPanel.classList.remove('listening'); };
            try { recognition.start(); } catch { recognition = null; setVoiceStatus("Sorry, I couldn't hear you. Please try again."); }
        });
    } else {
        $('#micButton').disabled = true; $('#micButton').setAttribute('aria-disabled', 'true');
        $('#micButton').addEventListener('click', () => setVoiceStatus('Voice commands are not supported in this browser. You can still use the text chatbot.'));
    }
    if (!('speechSynthesis' in window)) { $('#muteToggle').disabled = true; $('#stopSpeaking').disabled = true; }
    if (!voiceAvailable) setVoiceStatus('Voice commands are not supported in this browser. You can still use the text chatbot.');

    // Search an intentionally small, transparent client-side content index.
    const searchData = [
        ['Budgeting basics', 'A budget is a simple plan for your income, needs, wants, expenses, and savings.', '#basics', 'budget income expenses'],
        ['Needs vs wants', 'Needs are essentials; wants are optional choices. Context matters for each person.', '#needs', 'needs wants spending'],
        ['50/30/20 guideline', 'Explore a flexible starting point: 50% needs, 30% wants, 20% savings.', '#rule', '50 30 20 budget savings'],
        ['Savings goals', 'Estimate how monthly contributions can move a student savings goal forward.', '#savings', 'saving savings goals'],
        ['Expense planner', 'Practice grouping sample expenses by date and category. Entries stay in this tab.', '#planner', 'expenses planner food transport'],
        ['Money mistakes', 'Learn about impulse buying, small expenses, late payments, and planning.', '#mistakes', 'spending tips mistakes'],
        ['Visual learning gallery', 'Quick guides to saving, expense categories, needs, and the budget cycle.', '#gallery', 'infographics saving needs'],
        ['Ask BudgetBee', 'A rule-based helper for introductory budgeting and financial awareness.', '#chatbot', 'chatbot income needs saving']
    ];
    $('#searchForm').addEventListener('submit', event => { event.preventDefault(); const query = $('#searchInput').value.trim().toLowerCase(), result = $('#searchResults'); if (!query) { result.textContent = 'Enter a topic to search the learning guide.'; return; } const matches = searchData.filter(([title, description, , keywords]) => `${title} ${description} ${keywords}`.toLowerCase().includes(query)); result.innerHTML = matches.length ? `<p>${matches.length} result${matches.length === 1 ? '' : 's'} for “${escapeHtml(query)}”</p>` + matches.map(([title, description, href]) => `<div class="search-result"><a href="${href}"><b>${escapeHtml(title)}</b> →</a><br>${escapeHtml(description)}</div>`).join('') : `No learning topics found for “${escapeHtml(query)}”. Try budget, needs, wants, expenses, or saving.`; });

    // Browser-only validation and acknowledgement for demo forms.
    const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    $('#feedbackForm').addEventListener('submit', event => { event.preventDefault(); const name = $('#feedbackName').value.trim(), email = $('#feedbackEmail').value.trim(), rating = $('#feedbackRating').value, comment = $('#feedbackComment').value.trim(), out = $('#feedbackMessage'); if (!name || !email || !rating || !comment) { out.textContent = 'Please complete each field before submitting.'; out.style.color = '#c94949'; return; } if (!validEmail(email)) { out.textContent = 'Please enter a valid email address.'; out.style.color = '#c94949'; return; } if (comment.length < 10 || comment.length > 500) { out.textContent = 'Comments must be between 10 and 500 characters.'; out.style.color = '#c94949'; return; } out.textContent = 'Thank you! Your feedback has been received for this demo.'; out.style.color = 'var(--green)'; event.currentTarget.reset(); });
    $('#contactForm').addEventListener('submit', event => { event.preventDefault(); const name = $('#contactName').value.trim(), email = $('#contactEmail').value.trim(), message = $('#contactMessageInput').value.trim(), out = $('#contactMessage'); if (!name || !email || !message) { out.textContent = 'Please complete each field before submitting.'; out.style.color = '#c94949'; return; } if (!validEmail(email)) { out.textContent = 'Please enter a valid email address.'; out.style.color = '#c94949'; return; } if (message.length < 10) { out.textContent = 'Please write a message with at least 10 characters.'; out.style.color = '#c94949'; return; } out.textContent = 'Thanks for reaching out! This demo does not send or store messages.'; out.style.color = 'var(--green)'; event.currentTarget.reset(); });

    function escapeHtml(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
})();
