# 🔌 Homework 5: Configure MCP Servers (GitHub, Filesystem, Jira, Custom)

> **Student Name**: Volodymyr Kiryakov
> **AI Tools Used**: Claude Code
> **Date**: 19.07.2026

Настройка трёх внешних MCP-серверов (**GitHub**, **Filesystem**, **Jira/Atlassian**) и
разработка одного **кастомного** MCP-сервера на **FastMCP**, который отдаёт содержимое
`lorem-ipsum.md` как *ресурс* и как *инструмент* `read`.

Все конфигурации серверов собраны в одном файле [`mcp.json`](mcp.json). Инструкции по
установке, запуску, подключению и тестированию — в [`HOWTORUN.md`](HOWTORUN.md).

## Структура

```text
homework-5/
├── README.md                 # этот файл
├── HOWTORUN.md               # установка / запуск / подключение / тест
├── mcp.json                  # 4 сервера: github, filesystem, atlassian, custom-lorem
├── custom-mcp-server/
│   ├── server.py             # FastMCP-сервер: ресурс + инструмент read
│   ├── lorem-ipsum.md        # исходный текст (153 слова)
│   ├── pyproject.toml        # зависимости (fastmcp) для uv
│   ├── requirements.txt      # зависимости (fastmcp) для pip
│   └── test_server.py        # тесты (in-memory FastMCP Client)
└── docs/
    ├── evidence/             # реальный текстовый вывод вызовов MCP
    └── screenshots/          # PNG-скриншоты (+ чеклист, что снять)
```

## Серверы

### 1. GitHub MCP ⭐
Сервер `@modelcontextprotocol/server-github` (stdio через `npx`) — это подключённая и
продемонстрированная реализация. Даёт Claude доступ к GitHub API: коммиты, PR, issues,
поиск. В демонстрации запрошены последние 5 коммитов репозитория
`vkiryakov/gen-ai-software-engineering`. Официальная Go-реализация
(`github/github-mcp-server` / hosted remote) — как альтернатива описана в HOWTORUN §3.1.
→ [`docs/evidence/github-mcp-result.md`](docs/evidence/github-mcp-result.md)

### 2. Filesystem MCP ⭐
Официальный сервер `@modelcontextprotocol/server-filesystem` (stdio через `npx`) с
разрешённым каталогом `homework-5/`. Предоставляет 14 инструментов (чтение файлов, список
каталогов, поиск и т.д.). В демонстрации выполнен `list_directory`.
→ [`docs/evidence/filesystem-mcp-result.md`](docs/evidence/filesystem-mcp-result.md)

### 3. Jira / Atlassian MCP ⭐⭐
Официальный **Atlassian Remote MCP Server** (SSE, OAuth) — `https://mcp.atlassian.com/v1/sse`.
Позволяет Claude запрашивать проект в Jira. Целевой запрос: *«последние 5 багов проекта»*
(JQL `issuetype = Bug ORDER BY created DESC`, `maxResults = 5`). Авторизация OAuth и живой
запрос выполняются в интерактивном IDE.
→ шаблон ответа: [`docs/evidence/jira-mcp-result.md`](docs/evidence/jira-mcp-result.md)

### 4. Custom FastMCP Server ⭐⭐⭐
Собственный сервер [`custom-mcp-server/server.py`](custom-mcp-server/server.py) на FastMCP:

- **Resource** `lorem://ipsum` — принимает необязательный параметр `word_count`
  (по умолчанию `30`) и возвращает ровно столько слов из `lorem-ipsum.md`.
- **Tool** `read(word_count=30)` — действие, которое Claude вызывает, чтобы получить то же
  содержимое.

Из-за параметра `{?word_count}` ресурс регистрируется как *resource template* (в списке
клиента он попадает в `resource_templates`, а не в статические `resources`) — это штатная
идиома FastMCP; чтение `lorem://ipsum` без параметра отдаёт дефолтные 30 слов.

→ [`docs/evidence/custom-mcp-read-tool-result.md`](docs/evidence/custom-mcp-read-tool-result.md)

## Resources vs Tools (MCP)

- **Resources (ресурсы)** — это **URI, из которых Claude *читает*** данные (файлы, ответы
  API, записи БД). Они пассивные, как чтение файла или GET-запрос: клиент запрашивает URI
  (например, `lorem://ipsum`) и получает его содержимое. В этом проекте ресурс отдаёт
  первые `word_count` слов из `lorem-ipsum.md`.
- **Tools (инструменты)** — это **действия, которые Claude *вызывает***, чтобы что-то
  выполнить (прочитать файл, запустить команду, создать issue). Они активные, как вызов
  функции с аргументами. В этом проекте инструмент `read` принимает `word_count` и
  возвращает то же содержимое, что и ресурс.

Кратко: **ресурс = «прочитать по URI», инструмент = «выполнить действие».**

## Быстрый старт

```bash
# кастомный сервер: установка зависимостей и тест
cd custom-mcp-server
uv run --python 3.12 test_server.py     # 10 passed, 0 failed

# запуск кастомного сервера (stdio)
uv run --python 3.12 server.py
```

Подключение всех четырёх серверов и полный набор команд — в [`HOWTORUN.md`](HOWTORUN.md).

## Доказательства и скриншоты

Реальный текстовый вывод каждого вызова — в [`docs/evidence/`](docs/evidence/).
Чеклист из 4 PNG-скриншотов, которые нужно снять в IDE — в
[`docs/screenshots/README.md`](docs/screenshots/README.md).
