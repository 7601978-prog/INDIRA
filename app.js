const STORAGE_KEY = "department_project_workspace_v1";

const demoUsers = [
  { id: "u1", name: "Асель Нурланова", role: "owner", email: "owner@team.test", password: "owner123", capacity: 40 },
  { id: "u2", name: "Ирина Волкова", role: "member", email: "irina@team.test", password: "team123", capacity: 36 },
  { id: "u3", name: "Данияр Садыков", role: "member", email: "daniyar@team.test", password: "team123", capacity: 40 },
  { id: "u4", name: "Мария Ким", role: "member", email: "maria@team.test", password: "team123", capacity: 32 },
  { id: "u5", name: "Олег Романов", role: "member", email: "oleg@team.test", password: "team123", capacity: 40 }
];

const seed = {
  users: demoUsers,
  routineTasks: [
    { id: "r1", title: "Еженедельный отчет по показателям", ownerId: "u2", status: "in_progress", priority: "medium", hours: 6, due: "2026-06-19", note: "Сбор факта, комментарии по отклонениям." },
    { id: "r2", title: "Обработка входящих запросов бизнеса", ownerId: "u3", status: "todo", priority: "high", hours: 10, due: "2026-06-18", note: "Пул заявок за текущую неделю." },
    { id: "r3", title: "Проверка договоров перед оплатой", ownerId: "u4", status: "done", priority: "medium", hours: 5, due: "2026-06-14", note: "Закрыто 12 документов." },
    { id: "r4", title: "Актуализация базы поставщиков", ownerId: "u5", status: "in_progress", priority: "low", hours: 7, due: "2026-06-21", note: "Обновление контактов и статусов." }
  ],
  projects: [
    { id: "p1", title: "Переход на новую CRM", type: "project", ownerId: "u1", status: "in_progress", priority: "high", hours: 18, due: "2026-07-25", note: "Карта процессов, миграция данных, обучение команды." },
    { id: "p2", title: "Автоматизация ежемесячной отчетности", type: "initiative", ownerId: "u3", status: "todo", priority: "high", hours: 14, due: "2026-08-10", note: "Проверить источники данных и собрать MVP." },
    { id: "p3", title: "Каталог типовых задач отдела", type: "initiative", ownerId: "u2", status: "review", priority: "medium", hours: 8, due: "2026-06-30", note: "Шаблоны, SLA, ответственные." },
    { id: "p4", title: "Пилот внутреннего портала знаний", type: "project", ownerId: "u5", status: "in_progress", priority: "medium", hours: 12, due: "2026-07-12", note: "Разделы, права доступа, наполнение." }
  ]
};

const statusLabels = {
  todo: "План",
  in_progress: "В работе",
  review: "На проверке",
  done: "Готово",
  paused: "Пауза"
};

const priorityLabels = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий"
};

const state = {
  data: loadData(),
  currentUserId: null,
  tab: "dashboard",
  filters: { ownerId: "all", status: "all", priority: "all", query: "" },
  toast: ""
};

const app = document.querySelector("#app");

function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(seed);
  try {
    return JSON.parse(stored);
  } catch {
    return structuredClone(seed);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function currentUser() {
  return state.data.users.find((user) => user.id === state.currentUserId);
}

function userName(id) {
  return state.data.users.find((user) => user.id === id)?.name || "Не назначен";
}

function render() {
  app.innerHTML = state.currentUserId ? workspaceTemplate() : loginTemplate();
  bindEvents();
}

function loginTemplate() {
  return `
    <section class="login-shell">
      <div class="login-panel">
        <div class="brand"><span class="brand-mark">П</span><span>Пульс отдела</span></div>
        <h1>Проекты и задачи команды</h1>
        <p class="lead">Единое место для рутины, проектов, новых инициатив, статусов и оценки загрузки.</p>
        <form class="form" data-action="login">
          <label class="field"><span>Email</span><input name="email" value="owner@team.test" autocomplete="username"></label>
          <label class="field"><span>Пароль</span><input name="password" type="password" value="owner123" autocomplete="current-password"></label>
          <button class="primary" type="submit">Войти</button>
        </form>
        <div class="demo-box">
          <header>Тестовые учетные записи</header>
          ${state.data.users.map((user) => `
            <div class="demo-user">
              <div><strong>${user.name}</strong><small>${user.email} / ${user.password}</small></div>
              <button class="secondary" data-login-as="${user.id}">${user.role === "owner" ? "Оунер" : "Участник"}</button>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="login-visual">
        <div class="preview">
          <div class="preview-grid">
            <div class="mini-board">
              <div class="mini-card"><b>Переход на новую CRM</b><div class="mini-bar"><span style="width:68%"></span></div></div>
              <div class="mini-card"><b>Обработка запросов бизнеса</b><div class="mini-bar"><span style="width:42%"></span></div></div>
              <div class="mini-card"><b>Автоматизация отчетности</b><div class="mini-bar"><span style="width:24%"></span></div></div>
            </div>
            <div class="mini-side">
              ${workload().slice(0, 4).map((row) => `
                <div class="mini-card"><b>${row.name}</b><small>${row.hours} ч из ${row.capacity} ч</small><div class="mini-bar"><span style="width:${Math.min(row.percent, 100)}%"></span></div></div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function workspaceTemplate() {
  const user = currentUser();
  return `
    <section class="workspace">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">П</span><span>Пульс отдела</span></div>
        <div class="user-chip"><strong>${user.name}</strong><small>${user.role === "owner" ? "Оунер" : "Член команды"}</small></div>
        <nav class="nav">
          ${navButton("dashboard", "⌂", "Обзор")}
          ${navButton("routine", "✓", "Рутина")}
          ${navButton("projects", "◇", "Проекты")}
          ${navButton("team", "◷", "Нагрузка")}
          ${navButton("export", "⇩", "Выгрузка")}
        </nav>
        <button class="ghost" data-action="logout">Выйти</button>
      </aside>
      <section class="content">
        ${viewTemplate()}
      </section>
      ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
    </section>
  `;
}

function navButton(tab, icon, label) {
  return `<button class="${state.tab === tab ? "active" : ""}" data-tab="${tab}"><span>${icon}</span>${label}</button>`;
}

function viewTemplate() {
  if (state.tab === "routine") return taskView("routineTasks", "Рутинные задачи", "Регулярная работа отдела и операционные поручения.");
  if (state.tab === "projects") return taskView("projects", "Проекты и инициативы", "Изменения, запуск новых процессов и крупные задачи с результатом.");
  if (state.tab === "team") return teamView();
  if (state.tab === "export") return exportView();
  return dashboardView();
}

function dashboardView() {
  const all = allItems();
  const active = all.filter((item) => item.status !== "done").length;
  const late = all.filter((item) => item.status !== "done" && item.due < today()).length;
  const hours = all.filter((item) => item.status !== "done").reduce((sum, item) => sum + Number(item.hours || 0), 0);
  return `
    <div class="topbar">
      <div><h1>Обзор отдела</h1><p>Состояние рутины, проектов и текущей загрузки команды.</p></div>
      <div class="toolbar">
        <button class="secondary" data-tab="routine">+ Рутина</button>
        <button class="primary" data-tab="projects">+ Проект</button>
      </div>
    </div>
    <section class="stats">
      ${stat("Всего задач", all.length)}
      ${stat("Активно", active)}
      ${stat("Просрочено", late)}
      ${stat("Часов в работе", hours)}
    </section>
    <section class="layout">
      <div class="panel">
        <header><h2>Ближайшие сроки</h2></header>
        <div class="panel-body list">${all.filter((item) => item.status !== "done").sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6).map(itemCard).join("") || empty("Нет активных задач.")}</div>
      </div>
      <div class="panel">
        <header><h2>Нагрузка</h2></header>
        <div class="panel-body list">${workload().map(memberLoad).join("")}</div>
      </div>
    </section>
  `;
}

function taskView(collection, title, subtitle) {
  const items = filteredItems(state.data[collection]);
  return `
    <div class="topbar">
      <div><h1>${title}</h1><p>${subtitle}</p></div>
      <div class="toolbar">
        <button class="secondary" data-action="reset-demo">Сбросить демо</button>
        <button class="primary" data-action="download" data-kind="${collection}">Выгрузить CSV</button>
      </div>
    </div>
    <section class="layout">
      <div class="panel">
        <header><h2>Список</h2><span class="pill blue">${items.length}</span></header>
        <div class="panel-body">
          ${filtersTemplate()}
          <div class="list">${items.map((item) => itemCard(item, collection)).join("") || empty("По выбранным фильтрам ничего нет.")}</div>
        </div>
      </div>
      <div class="panel">
        <header><h2>Новая запись</h2></header>
        <div class="panel-body">${formTemplate(collection)}</div>
      </div>
    </section>
  `;
}

function filtersTemplate() {
  return `
    <div class="filters">
      <label class="filter">Ответственный${select("ownerId", [{ value: "all", label: "Все" }, ...state.data.users.map((user) => ({ value: user.id, label: user.name }))], state.filters.ownerId, "data-filter")}</label>
      <label class="filter">Статус${select("status", [{ value: "all", label: "Все" }, ...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))], state.filters.status, "data-filter")}</label>
      <label class="filter">Приоритет${select("priority", [{ value: "all", label: "Все" }, ...Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))], state.filters.priority, "data-filter")}</label>
      <label class="filter">Поиск<input data-filter name="query" value="${escapeHtml(state.filters.query)}" placeholder="Название или заметка"></label>
    </div>
  `;
}

function formTemplate(collection) {
  const isProject = collection === "projects";
  return `
    <form class="form" data-action="add-item" data-collection="${collection}">
      <label class="field"><span>Название</span><input name="title" required placeholder="${isProject ? "Например, запуск портала" : "Например, сверка заявок"}"></label>
      ${isProject ? `<label class="field"><span>Тип</span>${select("type", [{ value: "project", label: "Проект" }, { value: "initiative", label: "Инициатива" }], "project")}</label>` : ""}
      <div class="form-row">
        <label class="field"><span>Ответственный</span>${select("ownerId", state.data.users.map((user) => ({ value: user.id, label: user.name })), currentUser().role === "owner" ? "u2" : currentUser().id)}</label>
        <label class="field"><span>Статус</span>${select("status", Object.entries(statusLabels).map(([value, label]) => ({ value, label })), "todo")}</label>
      </div>
      <div class="form-row">
        <label class="field"><span>Приоритет</span>${select("priority", Object.entries(priorityLabels).map(([value, label]) => ({ value, label })), "medium")}</label>
        <label class="field"><span>Часы в неделю</span><input name="hours" type="number" min="1" max="80" value="4" required></label>
      </div>
      <label class="field"><span>Срок</span><input name="due" type="date" value="${today()}" required></label>
      <label class="field"><span>Комментарий</span><textarea name="note" placeholder="Что важно знать"></textarea></label>
      <button class="primary" type="submit">Добавить</button>
    </form>
  `;
}

function teamView() {
  return `
    <div class="topbar">
      <div><h1>Нагрузка команды</h1><p>Расчет по активным рутинным задачам, проектам и инициативам.</p></div>
      <div class="toolbar"><button class="primary" data-action="download" data-kind="workload">Выгрузить CSV</button></div>
    </div>
    <section class="panel">
      <header><h2>Команда</h2></header>
      <div class="panel-body member-grid">${workload().map(memberLoad).join("")}</div>
    </section>
  `;
}

function exportView() {
  return `
    <div class="topbar">
      <div><h1>Выгрузка</h1><p>CSV-файлы открываются в Excel, Numbers и Google Sheets.</p></div>
      <div class="toolbar"><button class="secondary" data-action="reset-demo">Сбросить демо</button></div>
    </div>
    <section class="export-grid">
      ${exportCard("routineTasks", "Рутинные задачи", "Операционная работа, сроки, статусы и ответственные.")}
      ${exportCard("projects", "Проекты и инициативы", "Список изменений, проектов и новых инициатив отдела.")}
      ${exportCard("workload", "Нагрузка команды", "Сводка часов, загрузки и количества активных задач.")}
    </section>
    <section class="panel" style="margin-top:18px">
      <header><h2>Сводная таблица</h2></header>
      <div class="table-wrap">${summaryTable()}</div>
    </section>
  `;
}

function exportCard(kind, title, text) {
  return `<div class="export-card"><h2>${title}</h2><p class="lead">${text}</p><button class="primary" data-action="download" data-kind="${kind}">Скачать CSV</button></div>`;
}

function summaryTable() {
  const rows = allItems();
  return `
    <table>
      <thead><tr><th>Раздел</th><th>Название</th><th>Ответственный</th><th>Статус</th><th>Приоритет</th><th>Часы</th><th>Срок</th></tr></thead>
      <tbody>${rows.map((item) => `<tr><td>${item.collection === "routineTasks" ? "Рутина" : item.type === "initiative" ? "Инициатива" : "Проект"}</td><td>${item.title}</td><td>${userName(item.ownerId)}</td><td>${statusLabels[item.status]}</td><td>${priorityLabels[item.priority]}</td><td>${item.hours}</td><td>${item.due}</td></tr>`).join("")}</tbody>
    </table>
  `;
}

function itemCard(item, collection = item.collection) {
  const late = item.status !== "done" && item.due < today();
  return `
    <article class="item">
      <div class="item-head">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <div class="meta">
            <span class="pill ${statusColor(item.status)}">${statusLabels[item.status]}</span>
            <span class="pill ${priorityColor(item.priority)}">${priorityLabels[item.priority]}</span>
            ${late ? `<span class="pill red">Просрочено</span>` : ""}
          </div>
        </div>
        <div class="item-actions">
          <button class="icon-btn" title="Следующий статус" data-action="advance" data-collection="${collection}" data-id="${item.id}">↻</button>
          <button class="icon-btn" title="Удалить" data-action="delete" data-collection="${collection}" data-id="${item.id}">×</button>
        </div>
      </div>
      <p class="lead">${escapeHtml(item.note || "Без комментария")}</p>
      <div class="tags">
        <span class="pill">${userName(item.ownerId)}</span>
        <span class="pill">${item.hours} ч/нед</span>
        <span class="pill">Срок ${formatDate(item.due)}</span>
        ${item.type ? `<span class="pill blue">${item.type === "initiative" ? "Инициатива" : "Проект"}</span>` : ""}
      </div>
    </article>
  `;
}

function memberLoad(row) {
  const cls = row.percent > 100 ? "over" : row.percent >= 75 ? "busy" : "ok";
  return `
    <div class="member">
      <div class="member-top">
        <div style="display:flex;gap:12px;align-items:center">
          <div class="avatar">${initials(row.name)}</div>
          <div><strong>${row.name}</strong><br><small>${row.role === "owner" ? "Оунер" : "Член команды"}</small></div>
        </div>
        <span class="pill ${row.percent > 100 ? "red" : row.percent >= 75 ? "yellow" : "green"}">${row.percent}%</span>
      </div>
      <div class="loadbar"><span class="${cls}" style="width:${Math.min(row.percent, 100)}%"></span></div>
      <p class="lead" style="margin-top:12px">${row.hours} ч из ${row.capacity} ч, активных записей: ${row.activeCount}</p>
    </div>
  `;
}

function stat(label, value) {
  return `<div class="stat"><small>${label}</small><strong>${value}</strong></div>`;
}

function empty(text) {
  return `<div class="empty">${text}</div>`;
}

function select(name, options, selected, attrs = "") {
  return `<select name="${name}" ${attrs}>${options.map((option) => `<option value="${option.value}" ${option.value === selected ? "selected" : ""}>${option.label}</option>`).join("")}</select>`;
}

function bindEvents() {
  document.querySelectorAll("[data-login-as]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentUserId = button.dataset.loginAs;
      toast(`Вход: ${currentUser().name}`);
      render();
    });
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tab = button.dataset.tab;
      render();
    });
  });

  document.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("input", () => {
      state.filters[input.name] = input.value;
      render();
    });
  });

  document.querySelectorAll("[data-action='login']").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      const found = state.data.users.find((user) => user.email === values.email.trim() && user.password === values.password.trim());
      if (!found) return toast("Неверный email или пароль");
      state.currentUserId = found.id;
      toast(`Вход: ${found.name}`);
      render();
    });
  });

  document.querySelectorAll("[data-action='add-item']").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const collection = form.dataset.collection;
      const values = Object.fromEntries(new FormData(form));
      const item = {
        id: `${collection[0]}${Date.now()}`,
        title: values.title.trim(),
        ownerId: values.ownerId,
        status: values.status,
        priority: values.priority,
        hours: Number(values.hours),
        due: values.due,
        note: values.note.trim()
      };
      if (collection === "projects") item.type = values.type;
      state.data[collection].unshift(item);
      saveData();
      toast("Запись добавлена");
      render();
    });
  });

  document.querySelectorAll("[data-action='advance']").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.data[button.dataset.collection].find((entry) => entry.id === button.dataset.id);
      const statuses = Object.keys(statusLabels);
      item.status = statuses[(statuses.indexOf(item.status) + 1) % statuses.length];
      saveData();
      toast("Статус обновлен");
      render();
    });
  });

  document.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", () => {
      state.data[button.dataset.collection] = state.data[button.dataset.collection].filter((entry) => entry.id !== button.dataset.id);
      saveData();
      toast("Запись удалена");
      render();
    });
  });

  document.querySelectorAll("[data-action='download']").forEach((button) => {
    button.addEventListener("click", () => downloadCsv(button.dataset.kind));
  });

  document.querySelectorAll("[data-action='reset-demo']").forEach((button) => {
    button.addEventListener("click", () => {
      state.data = structuredClone(seed);
      saveData();
      toast("Демо-данные восстановлены");
      render();
    });
  });

  document.querySelectorAll("[data-action='logout']").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentUserId = null;
      render();
    });
  });
}

function filteredItems(items) {
  const query = state.filters.query.toLowerCase().trim();
  return items.filter((item) => {
    const queryMatch = !query || `${item.title} ${item.note}`.toLowerCase().includes(query);
    return (state.filters.ownerId === "all" || item.ownerId === state.filters.ownerId)
      && (state.filters.status === "all" || item.status === state.filters.status)
      && (state.filters.priority === "all" || item.priority === state.filters.priority)
      && queryMatch;
  });
}

function allItems() {
  return [
    ...state.data.routineTasks.map((item) => ({ ...item, collection: "routineTasks" })),
    ...state.data.projects.map((item) => ({ ...item, collection: "projects" }))
  ];
}

function workload() {
  const active = allItems().filter((item) => item.status !== "done");
  return state.data.users.map((user) => {
    const items = active.filter((item) => item.ownerId === user.id);
    const hours = items.reduce((sum, item) => sum + Number(item.hours || 0), 0);
    return {
      ...user,
      hours,
      activeCount: items.length,
      percent: Math.round((hours / user.capacity) * 100)
    };
  });
}

function downloadCsv(kind) {
  let filename = "";
  let rows = [];
  if (kind === "workload") {
    filename = "team-workload.csv";
    rows = workload().map((row) => ({
      "Сотрудник": row.name,
      "Роль": row.role === "owner" ? "Оунер" : "Член команды",
      "Часы": row.hours,
      "Емкость": row.capacity,
      "Загрузка": `${row.percent}%`,
      "Активных записей": row.activeCount
    }));
  } else {
    filename = kind === "routineTasks" ? "routine-tasks.csv" : "projects-initiatives.csv";
    rows = state.data[kind].map((item) => ({
      "Раздел": kind === "routineTasks" ? "Рутина" : item.type === "initiative" ? "Инициатива" : "Проект",
      "Название": item.title,
      "Ответственный": userName(item.ownerId),
      "Статус": statusLabels[item.status],
      "Приоритет": priorityLabels[item.priority],
      "Часы": item.hours,
      "Срок": item.due,
      "Комментарий": item.note
    }));
  }
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast("CSV подготовлен");
}

function toCsv(rows) {
  if (!rows.length) return "";
  const header = Object.keys(rows[0]);
  const lines = [header.join(";")];
  rows.forEach((row) => {
    lines.push(header.map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(";"));
  });
  return "\ufeff" + lines.join("\n");
}

function toast(message) {
  state.toast = message;
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    state.toast = "";
    render();
  }, 1800);
}

function statusColor(status) {
  if (status === "done") return "green";
  if (status === "review") return "yellow";
  if (status === "paused") return "red";
  return "blue";
}

function priorityColor(priority) {
  if (priority === "high") return "red";
  if (priority === "medium") return "yellow";
  return "green";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

render();
