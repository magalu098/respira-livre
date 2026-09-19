/* =========================================================
   TEMA CLARO / ESCURO
========================================================= */

function $(id) {
    return document.getElementById(id);
}

let installPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    const button = $("installBtn");
    if (button) button.hidden = false;
});

window.addEventListener("appinstalled", () => {
    installPrompt = null;
    const button = $("installBtn");
    if (button) button.hidden = true;
    showToast("Respira Livre instalado no dispositivo.");
});

function installApp() {
    if (!installPrompt) {
        showToast("No celular, use o menu do navegador e escolha 'Adicionar à tela inicial'.");
        return;
    }

    installPrompt.prompt();
    installPrompt.userChoice.finally(() => {
        installPrompt = null;
        const button = $("installBtn");
        if (button) button.hidden = true;
    });
}

function setCookie(name, value, days = 365) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }

    return "";
}

function aplicarTema() {
    const consentimento = getCookie("respira_cookie_consent");
    const temaCookie = getCookie("respira_tema");
    const temaStorage = localStorage.getItem("tema");
    const tema = (consentimento === "accepted" && temaCookie) ? temaCookie : (temaStorage || "light");
    const dark = tema === "dark";

    document.body.classList.toggle("dark", dark);

    const botao = $("themeBtn");

    if (botao) {
        botao.textContent = dark ? "Modo claro" : "Modo escuro";
    }

    if (consentimento === "accepted" && temaCookie !== tema) {
        setCookie("respira_tema", tema, 365);
    }
}

function setConsentDecision(decision) {
    setCookie("respira_cookie_consent", decision, 365);
    const banner = $("cookieBanner");
    if (banner) {
        banner.classList.add("hidden");
    }

    if (decision === "accepted") {
        const tema = localStorage.getItem("tema") || "light";
        const nome = localStorage.getItem("profileName") || "Sua jornada";
        setCookie("respira_tema", tema, 365);
        setCookie("respira_nome", nome, 365);
    }
}

function mostrarBannerCookies() {
    const consentimento = getCookie("respira_cookie_consent");
    const banner = $("cookieBanner");
    if (banner && !consentimento) {
        banner.classList.remove("hidden");
    }
}

function showNotification(title, body) {
    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission === "granted") {
        new Notification(title, {
            body,
            icon: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=120&q=80"
        });
    }
}

function requestNotificationPermission() {
    if (!("Notification" in window)) {
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission === "denied") {
        return false;
    }

    return Notification.requestPermission().then((permission) => permission === "granted");
}

function openPanicLink(url) {
    window.open(url, "_blank", "noopener,noreferrer");
}

function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
}

function startBreathingExercise() {
    const box = $("breathingBox");
    const circle = $("breathCircle");
    const timer = $("breathTimer");
    const message = $("breathMessage");

    if (!box || !circle || !timer || !message) {
        return;
    }

    box.classList.remove("hidden");

    const phases = [
        { label: "Inspire", duration: 4, tip: "Inspire fundo e relaxe." },
        { label: "Segure", duration: 3, tip: "Segure a respiração com calma." },
        { label: "Expire", duration: 6, tip: "Expire lentamente e solte a tensão." }
    ];

    const totalDuration = 60;
    let elapsed = 0;
    let phaseIndex = 0;
    let phaseElapsed = 0;

    const getCurrentPhase = () => {
        let accumulated = 0;
        for (let i = 0; i < phases.length; i++) {
            const phase = phases[i];
            if (elapsed < accumulated + phase.duration) {
                return { phase, index: i, remaining: accumulated + phase.duration - elapsed };
            }
            accumulated += phase.duration;
        }
        return { phase: phases[0], index: 0, remaining: phases[0].duration };
    };

    const updateBreathingState = () => {
        const current = getCurrentPhase();
        const phase = current.phase;
        circle.textContent = phase.label;
        timer.textContent = `${Math.max(0, totalDuration - elapsed)}s`;
        message.textContent = phase.tip;
        phaseIndex = current.index;
        phaseElapsed = Math.max(0, phase.duration - current.remaining);
    };

    const finishExercise = () => {
        clearInterval(window.breathingTimer);
        timer.textContent = "0s";
        message.textContent = "Exercício concluído";
        circle.textContent = "Feito";
        showNotification("Respira Livre", "Seu exercício de respiração foi concluído.");
    };

    if (window.breathingTimer) {
        clearInterval(window.breathingTimer);
    }

    updateBreathingState();

    window.breathingTimer = setInterval(() => {
        if (elapsed >= totalDuration) {
            finishExercise();
            return;
        }

        elapsed += 1;
        updateBreathingState();

        if (elapsed >= totalDuration) {
            finishExercise();
        }
    }, 1000);

    showNotification("Respira Livre", "Seu exercício de respiração começou.");
}

function parseMoney(value) {
    if (!value) return 0;
    const numeric = String(value).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
    const amount = Number(numeric || 0);
    return Number.isFinite(amount) ? amount : 0;
}

function getChartPoints() {
    const dias = Number(($("dias")?.textContent || "0").replace(/\D/g, '')) || 0;
    const moneyText = $("dinheiro")?.textContent || "R$ 0,00";
    const currentMoney = parseMoney(moneyText);
    const base = Math.max(currentMoney || dias * 12, 12);
    const points = [0, 1, 3, 7, 14, 30, 60, 90];

    return points.map((day, index) => {
        const progress = Math.min(day / 90, 1);
        const value = Math.max(0, base * progress * (index === 0 ? 0.08 : 1));
        return {
            day,
            value,
            label: day === 0 ? "0" : (day >= 30 ? `${day}` : `${day}`)
        };
    }).slice(0, 7);
}

function renderProgressChart() {
    const canvas = $("progressChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 18, right: 16, bottom: 24, left: 18 };
    const data = getChartPoints();
    const maxValue = Math.max(...data.map((point) => point.value), 1);

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + ((height - padding.top - padding.bottom) / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }

    const points = data.map((point, index) => {
        const x = padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
        const y = height - padding.bottom - (point.value / maxValue) * (height - padding.top - padding.bottom);
        return { x, y, ...point };
    });

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height);
    gradient.addColorStop(0, "rgba(127, 215, 181, 0.52)");
    gradient.addColorStop(1, "rgba(127, 215, 181, 0.06)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point, index) => {
        if (index > 0) {
            const prev = points[index - 1];
            const midX = (prev.x + point.x) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, midX, (prev.y + point.y) / 2);
        }
    });
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.strokeStyle = "#7fd7b5";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(127, 215, 181, 0.42)";
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#eafaf3";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#7fd7b5";
        ctx.fill();
    });

    ctx.fillStyle = "rgba(237, 245, 241, 0.78)";
    ctx.font = "11px 'DM Sans', sans-serif";
    points.forEach((point) => {
        ctx.fillText(point.label, point.x - 6, height - 8);
    });

    const total = parseMoney($("dinheiro")?.textContent || "R$ 0,00");
    const displayText = total > 0 ? `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "R$ 0,00";
    $("chartTotal") && ($("chartTotal").textContent = displayText);
}

function getMonthMatrix(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = [];

    for (let i = 0; i < startWeekDay; i++) {
        calendarDays.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(new Date(year, month, day));
    }

    while (calendarDays.length % 7 !== 0) {
        calendarDays.push(null);
    }

    return calendarDays;
}

function renderCalendar(monthDate = new Date()) {
    const title = $("calendarTitle");
    const grid = $("calendarGrid");
    if (!title || !grid) return;

    const monthName = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    title.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const currentMonth = monthDate.getMonth();
    const currentYear = monthDate.getFullYear();
    const today = new Date();
    const monthDays = getMonthMatrix(monthDate);

    const savedStart = localStorage.getItem("journeyStartDate");
    const journeyStart = savedStart ? new Date(savedStart) : null;

    grid.innerHTML = "";

    monthDays.forEach((day) => {
        const cell = document.createElement("div");
        if (!day) {
            cell.className = "day empty";
            grid.appendChild(cell);
            return;
        }

        cell.className = "day";
        cell.textContent = day.getDate();

        const isToday = day.toDateString() === today.toDateString();
        const isInMonth = day.getMonth() === currentMonth && day.getFullYear() === currentYear;
        const isMilestone = journeyStart && day >= journeyStart && day <= today && isInMonth;

        if (isToday) cell.classList.add("today");
        if (isMilestone) cell.classList.add("free");

        grid.appendChild(cell);
    });
}

function updateJourney() {
    const startValue = localStorage.getItem("journeyStartDate");
    if (!startValue) return;

    const start = new Date(startValue);
    const now = new Date();
    const elapsedMs = Math.max(0, now - start);
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const format = (value) => String(value).padStart(2, "0");

    const cigarettesPerDay = Number(localStorage.getItem("cigarettesPerDay") || 0);
    const packPrice = Number(localStorage.getItem("packPrice") || 0);
    const cigarettesPerPack = Number(localStorage.getItem("cigarettesPerPack") || 20);
    const avoided = Math.floor((totalSeconds / 86400) * cigarettesPerDay);
    const savedMoney = (avoided / cigarettesPerPack) * packPrice;

    if ($("contadorTempo")) {
        $("contadorTempo").textContent = `${format(days)}d ${format(hours)}h ${format(minutes)}m ${format(seconds)}s`;
    }
    if ($("dias")) $("dias").textContent = String(days);
    if ($("cigarros")) $("cigarros").textContent = String(avoided);
    if ($("dinheiro")) {
        $("dinheiro").textContent = savedMoney.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    const bestStreak = Math.max(Number(localStorage.getItem("bestStreak") || 0), days);
    localStorage.setItem("currentStreak", String(days));
    localStorage.setItem("bestStreak", String(bestStreak));
    if ($("currentStreak")) $("currentStreak").textContent = String(days);
    if ($("bestStreak")) $("bestStreak").textContent = String(bestStreak);

    const goalDays = days < 1 ? 1 : days < 3 ? 3 : days < 7 ? 7 : days < 30 ? 30 : 90;
    const previousGoal = goalDays === 1 ? 0 : goalDays === 3 ? 1 : goalDays === 7 ? 3 : goalDays === 30 ? 7 : 30;
    const progress = Math.min(100, ((days - previousGoal) / Math.max(1, goalDays - previousGoal)) * 100);
    if ($("goalText")) $("goalText").textContent = `${days} / ${goalDays} dias`;
    if ($("progressBar")) $("progressBar").style.width = `${Math.max(0, progress)}%`;
    if ($("proximaConquista")) {
        const labels = { 1: "Primeiro passo", 3: "Força de vontade", 7: "Uma semana", 30: "Um mês livre", 90: "Grande conquista" };
        $("proximaConquista").textContent = labels[goalDays];
    }

    renderProgressChart();
}

function startJourney() {
    const cigarettesPerDay = Number($("cigarrosDia")?.value || 0);
    const packPrice = Number($("precoMaco")?.value || 0);
    const cigarettesPerPack = Number($("cigarrosMaco")?.value || 20);

    if (!cigarettesPerDay || cigarettesPerDay < 1 || cigarettesPerPack < 1) {
        showToast("Preencha os cigarros por dia e por maço para começar.");
        return;
    }

    localStorage.setItem("cigarettesPerDay", String(cigarettesPerDay));
    localStorage.setItem("packPrice", String(packPrice));
    localStorage.setItem("cigarettesPerPack", String(cigarettesPerPack));
    localStorage.setItem("journeyStartDate", new Date().toISOString());

    $("setupCard")?.classList.add("hidden");
    $("activeCard")?.classList.remove("hidden");
    updateJourney();
    renderCalendar(new Date());

    clearInterval(window.journeyTimer);
    window.journeyTimer = setInterval(updateJourney, 1000);
}

function renderRelapseHistory() {
    const list = $("historyList");
    const summary = $("historySummary");
    const history = JSON.parse(localStorage.getItem("relapses") || "[]");
    if (!list) return;

    if (summary) {
        summary.textContent = history.length ? `${history.length} registro${history.length === 1 ? "" : "s"}` : "Nenhum registro";
    }

    if (!history.length) {
        list.innerHTML = `<div class="empty-history"><div class="empty-icon">+</div><strong>Seu histórico aparecerá aqui</strong><span>Registrar não é falhar. É aprender.</span></div>`;
        return;
    }

    const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));

    list.innerHTML = history.map((item) => `
        <article class="history-item">
            <div>
                <strong>${escapeHtml(item.trigger)}</strong>
                <span>${escapeHtml(item.date)} · ${escapeHtml(item.count)} cigarro${item.count === 1 ? "" : "s"}</span>
                ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
            </div>
        </article>
    `).join("");
}

function saveRelapse() {
    const count = Math.max(1, Number($("relapseCount")?.value || 1));
    const trigger = $("relapseTrigger")?.value || "Outro";
    const note = $("relapseNote")?.value?.trim() || "";
    const history = JSON.parse(localStorage.getItem("relapses") || "[]");

    history.unshift({
        count,
        trigger,
        note,
        date: new Date().toLocaleString("pt-BR")
    });
    localStorage.setItem("relapses", JSON.stringify(history.slice(0, 30)));

    const newStart = new Date();
    localStorage.setItem("journeyStartDate", newStart.toISOString());
    localStorage.setItem("currentStreak", "0");
    $("relapseModal")?.classList.add("hidden");
    if ($("relapseNote")) $("relapseNote").value = "";
    renderRelapseHistory();
    updateJourney();
    renderCalendar(new Date());
    showToast("Recaída registrada. Vamos recomeçar com calma.");
}

function openReminderModal() {
    const modal = $("reminderModal");
    if (!modal) return;
    const savedTime = localStorage.getItem("reminderTime");
    if (savedTime && $("reminderTime")) $("reminderTime").value = savedTime;
    modal.classList.remove("hidden");
}

function saveReminder() {
    const time = $("reminderTime")?.value;
    if (!time) {
        showToast("Escolha um horário para salvar o lembrete.");
        return;
    }

    localStorage.setItem("reminderTime", time);
    $("reminderModal")?.classList.add("hidden");
    showToast(`Lembrete configurado para ${time}.`);
}

function checkReminder() {
    const reminderTime = localStorage.getItem("reminderTime");
    if (!reminderTime) return;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const todayKey = `${now.toDateString()}-${reminderTime}`;
    if (currentTime === reminderTime && localStorage.getItem("lastReminder") !== todayKey) {
        localStorage.setItem("lastReminder", todayKey);
        showNotification("Respira Livre", "Hora do seu lembrete de foco.");
        showToast("Seu lembrete de foco chegou.");
    }
}

function buildJourneySummary() {
    const profileName = localStorage.getItem("profileName") || $("profileName")?.value || "Sua jornada";
    const dias = $("dias")?.textContent || "0";
    const cigarros = $("cigarros")?.textContent || "0";
    const dinheiro = $("dinheiro")?.textContent || "R$ 0,00";
    const tempo = $("contadorTempo")?.textContent || "00d 00h 00m 00s";
    const proximo = $("proximaConquista")?.textContent || "Primeiro passo";
    const levelName = $("levelName")?.textContent || "Começo";
    const history = JSON.parse(localStorage.getItem("relapses") || "[]");

    return {
        profileName,
        dias,
        cigarros,
        dinheiro,
        tempo,
        proximo,
        levelName,
        history,
        generatedAt: new Date().toLocaleString("pt-BR")
    };
}

function exportJourneyPdf() {
    const summary = buildJourneySummary();

    if (!window.jspdf) {
        window.print();
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 18;

    pdf.setFillColor(232, 242, 236);
    pdf.rect(10, 10, pageWidth - 20, 18, "F");
    pdf.setTextColor(18, 52, 41);
    pdf.setFontSize(18);
    pdf.text("Respira Livre", 14, 20);

    pdf.setFontSize(11);
    pdf.setTextColor(75, 85, 80);
    pdf.text("Resumo da jornada", 14, 32);

    y = 42;
    const lines = [
        `Nome: ${summary.profileName}`,
        `Tempo sem fumar: ${summary.tempo}`,
        `Dias: ${summary.dias}`,
        `Cigarros evitados: ${summary.cigarros}`,
        `Dinheiro economizado: ${summary.dinheiro}`,
        `Próximo marco: ${summary.proximo}`,
        `Nível atual: ${summary.levelName}`,
        `Gerado em: ${summary.generatedAt}`
    ];

    pdf.setTextColor(21, 35, 31);
    pdf.setFontSize(12);
    lines.forEach((line) => {
        if (y > 260) {
            pdf.addPage();
            y = 18;
        }
        pdf.text(line, 14, y);
        y += 9;
    });

    if (summary.history.length > 0) {
        pdf.addPage();
        y = 18;
        pdf.setTextColor(18, 52, 41);
        pdf.setFontSize(16);
        pdf.text("Histórico de recaídas", 14, y);
        y += 12;

        pdf.setFontSize(11);
        pdf.setTextColor(38, 38, 38);
        summary.history.forEach((item, index) => {
            if (y > 260) {
                pdf.addPage();
                y = 18;
            }
            const texto = `• ${item.date || "Data não informada"} — ${item.trigger || "Gatilho"} — ${item.count || 0} cigarros`;
            pdf.text(texto, 14, y);
            y += 8;
            if (item.note) {
                const noteLines = pdf.splitTextToSize(`  ${item.note}`, 180);
                noteLines.forEach((line) => {
                    if (y > 260) {
                        pdf.addPage();
                        y = 18;
                    }
                    pdf.text(line, 14, y);
                    y += 7;
                });
            }
            if (index >= 9) return;
        });
    }

    pdf.save("respira-livre-resumo.pdf");
}

if ($("themeBtn")) {
    $("themeBtn").addEventListener("click", () => {
        const estaEscuro = document.body.classList.contains("dark");
        const novoTema = estaEscuro ? "light" : "dark";

        localStorage.setItem("tema", novoTema);
        if (getCookie("respira_cookie_consent") === "accepted") {
            setCookie("respira_tema", novoTema, 365);
        }
        aplicarTema();
    });
}

function renderProfile() {
    const greeting = $("profileGreeting");
    const avatar = $("profileAvatar");
    const profileName = localStorage.getItem("profileName") || "Sua jornada";

    if (greeting) {
        greeting.textContent = `${profileName}, sua jornada do seu jeito.`;
    }

    if (avatar) {
        const savedImage = localStorage.getItem("profilePhoto");
        if (savedImage) {
            avatar.innerHTML = `<img src="${savedImage}" alt="Foto do usuário">`;
        } else {
            avatar.textContent = "+";
        }
    }

    const input = $("profileName");
    if (input) {
        input.value = profileName;
    }
}

if ($("saveProfile")) {
    $("saveProfile").addEventListener("click", () => {
        const nome = $("profileName")?.value?.trim() || "Sua jornada";
        localStorage.setItem("profileName", nome);
        if (getCookie("respira_cookie_consent") === "accepted") {
            setCookie("respira_nome", nome, 365);
        }

        const modal = $("profileModal");
        if (modal) {
            modal.classList.add("hidden");
        }

        renderProfile();
    });
}

if ($("openProfileSettings")) {
    $("openProfileSettings").addEventListener("click", () => {
        const modal = $("profileModal");
        if (modal) {
            modal.classList.remove("hidden");
        }
    });
}

if ($("closeProfileModal")) {
    $("closeProfileModal").addEventListener("click", () => {
        const modal = $("profileModal");
        if (modal) {
            modal.classList.add("hidden");
        }
    });
}

if ($("profilePhoto")) {
    $("profilePhoto").addEventListener("change", (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || "");
            localStorage.setItem("profilePhoto", result);
            renderProfile();
        };
        reader.readAsDataURL(file);
    });
}

if ($("profileName")) {
    const nomeCookie = getCookie("respira_nome");
    const nomeStorage = localStorage.getItem("profileName");
    const nome = (getCookie("respira_cookie_consent") === "accepted" && nomeCookie) ? nomeCookie : (nomeStorage || "");
    if (nome) {
        localStorage.setItem("profileName", nome);
        renderProfile();
    }
}

if ($("acceptCookies")) {
    $("acceptCookies").addEventListener("click", () => setConsentDecision("accepted"));
}

if ($("rejectCookies")) {
    $("rejectCookies").addEventListener("click", () => setConsentDecision("rejected"));
}

if ($("breathingBtn")) {
    $("breathingBtn").addEventListener("click", async () => {
        if ("Notification" in window && Notification.permission === "default") {
            await requestNotificationPermission();
        }
        startBreathingExercise();
    });
}

if ($("panicSpotify")) {
    $("panicSpotify").addEventListener("click", () => openPanicLink("https://open.spotify.com/"));
}

if ($("panicYoutube")) {
    $("panicYoutube").addEventListener("click", () => openPanicLink("https://www.youtube.com/"));
}

if ($("exportBtn")) {
    $("exportBtn").addEventListener("click", exportJourneyPdf);
}

if ($("startBtn")) {
    $("startBtn").addEventListener("click", startJourney);
}

if ($("installBtn")) {
    $("installBtn").addEventListener("click", installApp);
}

if ($("relapseBtn")) {
    $("relapseBtn").addEventListener("click", () => $("relapseModal")?.classList.remove("hidden"));
}

if ($("closeModal")) {
    $("closeModal").addEventListener("click", () => $("relapseModal")?.classList.add("hidden"));
}

if ($("saveRelapse")) {
    $("saveRelapse").addEventListener("click", saveRelapse);
}

if ($("reminderBtn")) {
    $("reminderBtn").addEventListener("click", openReminderModal);
}

if ($("closeReminder")) {
    $("closeReminder").addEventListener("click", () => $("reminderModal")?.classList.add("hidden"));
}

if ($("saveReminder")) {
    $("saveReminder").addEventListener("click", saveReminder);
}

window.addEventListener("DOMContentLoaded", () => {
    aplicarTema();
    mostrarBannerCookies();
    renderProgressChart();
    renderCalendar(new Date());
    renderRelapseHistory();

    const savedStart = localStorage.getItem("journeyStartDate");
    if (savedStart) {
        $("setupCard")?.classList.add("hidden");
        $("activeCard")?.classList.remove("hidden");
        updateJourney();
        clearInterval(window.journeyTimer);
        window.journeyTimer = setInterval(updateJourney, 1000);
    }

    if ($("prevMonth")) {
        $("prevMonth").addEventListener("click", () => {
            const current = new Date($("calendarTitle").dataset.month || Date.now());
            current.setMonth(current.getMonth() - 1);
            $("calendarTitle").dataset.month = current.toISOString();
            renderCalendar(current);
        });
    }

    if ($("nextMonth")) {
        $("nextMonth").addEventListener("click", () => {
            const current = new Date($("calendarTitle").dataset.month || Date.now());
            current.setMonth(current.getMonth() + 1);
            $("calendarTitle").dataset.month = current.toISOString();
            renderCalendar(current);
        });
    }

    if ($("currentStreak")) {
        const currentStreak = Number(localStorage.getItem("currentStreak") || 0);
        $("currentStreak").textContent = currentStreak;
    }

    if ($("bestStreak")) {
        const bestStreak = Number(localStorage.getItem("bestStreak") || 0);
        $("bestStreak").textContent = bestStreak;
    }

    window.addEventListener("resize", renderProgressChart);
    window.setInterval(checkReminder, 30000);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
            showNotification("Respira Livre", "Sua rotina de foco continua ativa.");
        }
    });
});