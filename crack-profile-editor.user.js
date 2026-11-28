// ==UserScript==
// @name         크랙 대화 프로필 편집기
// @namespace    https://crack.wrtn.ai/
// @version      1.3.0
// @description  대화 프로필을 2패널에서 추가, 수정, 삭제하고 현재 대화에 적용합니다. (version 관리방식: 크랙UI변경.기능추가및수정.핫픽스)
// @match        https://crack.wrtn.ai/*
// @updateURL    https://github.com/hamster4762/crack-extensions/raw/refs/heads/main/crack-profile-editor.user.js
// @downloadURL  https://github.com/hamster4762/crack-extensions/raw/refs/heads/main/crack-profile-editor.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  const API_GATEWAY = 'https://crack-api.wrtn.ai';
  const PROFILE_API_BASE = `${API_GATEWAY}/crack-api`;
  const CHAT_API_BASE = `${API_GATEWAY}/crack-gen`;
  const DIALOG_TITLE = '대화 프로필';
  const REQUEST_TIMEOUT_MS = 15_000;
  const DEFAULT_SORT_MODE = 'updated-desc';
  const MAX_CHAT_PROFILES = 100;
  const CHAT_PAGE_SIZE = 40; // 서버 허용 최대값
  const SYNC_CONCURRENCY = 16; // 폴더 갱신 시 동시 요청 수
  const TAG_MAX_LENGTH = 10;
  const DIALOG_MAX_WIDTH_REM = 68;
  const MOBILE_DIALOG_MARGIN_REM = 0.75;
  const STORAGE_KEY = 'cp-editor';
  const STORAGE_VERSION = 1;

  const SELECTORS = {
    nativeCard: 'div.flex.flex-col.p-4.gap-2.rounded-lg',
  };

  const ICONS = {
    folder: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    filter: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16l-6 7v6l-4 2v-8z"/></svg>',
    sort: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 6h12M4 12h8M4 18h4M18 10v10m-3-3 3 3 3-3"/></svg>',
    sidebar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>',
    sync: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.6-4.5L4 8m0-4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16m0 4v-4h-4"/></svg>',
    collapse: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7 15 5-5 5 5M7 9l5-5 5 5"/></svg>',
    expand: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m7 9 5 5 5-5M7 15l5 5 5-5"/></svg>',
    chevron: '<svg class="cp-folder-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    folderSmall: '<svg class="cp-folder-icon" width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  };

  // ── UI 스타일: 편집기와 해당 팝업에만 적용 ──
  const STYLE = `
    div[role="dialog"]:has(> #cp-editor) {
      --cp-bg: #ffffff;
      --cp-sidebar-bg: #f7f7f8;
      --cp-folder-icon: #c28a1e;
      --cp-hover: #ebebee;
      --cp-selected: #dde8fc;
      --cp-input-bg: #ffffff;
      --cp-border: #d9d9de;
      --cp-text: #1f2937;
      --cp-muted: #6b7280;
      --cp-neutral-button: #e5e7eb;
      --cp-neutral-button-hover: #d1d5db;
      --cp-accent: #2563eb;
      --cp-accent-hover: #1d4ed8;
      --cp-accent-ring: #2563eb55;
      --cp-danger: #dc2626;
      --cp-chip-bg-s: 70%;
      --cp-chip-bg-l: 91%;
      --cp-chip-text-l: 30%;
      animation: none !important;
      transition: none !important;
      /* 모바일과 데스크톱을 같은 좌표계로 배치한다.
         측정값은 키보드를 제외한 실제 표시 영역이며 사이트 레이어는 건드리지 않는다. */
      box-sizing: border-box;
      position: fixed !important;
      top: var(--cp-dialog-top, 0px) !important;
      left: var(--cp-dialog-left, 0px) !important;
      right: auto !important;
      bottom: auto !important;
      transform: none !important;
      translate: none !important;
      margin: 0 !important;
      width: var(--cp-dialog-width, 100vw) !important;
      height: var(--cp-dialog-height, 100dvh) !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      max-height: none !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden;
      background: var(--cp-bg) !important;
      color: var(--cp-text) !important;
    }

    body[data-theme="dark"] div[role="dialog"]:has(> #cp-editor) {
      --cp-bg: #242321;
      --cp-sidebar-bg: #1d1c1b;
      --cp-folder-icon: #d4a54a;
      --cp-hover: #2f2e2c;
      --cp-selected: #263a5c;
      --cp-input-bg: #141413;
      --cp-border: #3a3936;
      --cp-text: #f0efeb;
      --cp-muted: #9ca3af;
      --cp-neutral-button: #2e2d2b;
      --cp-neutral-button-hover: #42413d;
      --cp-accent: #3b82f6;
      --cp-accent-hover: #2563eb;
      --cp-accent-ring: #3b82f655;
      --cp-danger: #b91c1c;
      --cp-chip-bg-s: 30%;
      --cp-chip-bg-l: 24%;
      --cp-chip-text-l: 82%;
    }

    /* 프로필 팝업 헤더(제목의 부모, PC·모바일 구조가 달라 스크립트가 cp-header로 지정):
       제목·닫기 버튼 크기와 여백을 줄여 한 줄 높이로 만든다. */
    div[role="dialog"]:has(> #cp-editor) .cp-header {
      gap: 0.5rem !important;
      min-height: 0 !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0.25rem 0.375rem 0.25rem 0.875rem !important;
    }

    div[role="dialog"]:has(> #cp-editor) .cp-header > h2 {
      flex-shrink: 0;
      margin: 0 !important;
      font-size: 1rem !important;
      font-weight: 700 !important;
    }

    div[role="dialog"]:has(> #cp-editor) .cp-header > button[aria-label="닫기"] {
      flex: 0 0 2rem;
      width: 2rem !important;
      height: 2rem !important;
      min-width: 0 !important;
      padding: 0.375rem !important;
    }

    div[role="dialog"]:has(> #cp-editor) .cp-header > button[aria-label="닫기"] svg {
      width: 100%;
      height: 100%;
    }

    div[role="dialog"]:has(> #cp-editor) .cp-status {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      color: var(--cp-muted);
      font-size: 0.75rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    div[role="dialog"]:has(> #cp-editor) .cp-header-button,
    #cp-editor .cp-icon {
      display: grid;
      place-items: center;
      position: relative;
      flex: 0 0 2rem;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 0;
      border-radius: 0.375rem;
      background: transparent;
      color: var(--cp-muted);
      cursor: pointer;
    }

    div[role="dialog"]:has(> #cp-editor) .cp-header-button:hover:not(:disabled),
    #cp-editor .cp-icon:hover:not(:disabled) {
      background: var(--cp-hover);
      color: var(--cp-text);
    }

    div[role="dialog"]:has(> #cp-editor) .cp-header-button[aria-pressed="true"] {
      color: var(--cp-accent);
    }

    div[role="dialog"]:has(> #cp-editor) .cp-header-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    #cp-editor.is-sidebar-hidden .cp-sidebar { display: none; }

    #cp-editor {
      display: flex;
      flex: 1 1 0;
      width: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      border-top: 1px solid var(--cp-border);
      color: var(--cp-text);
    }

    #cp-editor * {
      box-sizing: border-box;
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }

    #cp-editor button { font: inherit; }

    /* ── 왼쪽 목록 ── */
    #cp-editor .cp-sidebar {
      display: flex;
      flex: 0 0 19rem;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      border-right: 1px solid var(--cp-border);
      background: var(--cp-sidebar-bg);
    }

    #cp-editor .cp-toolbar {
      display: flex;
      align-items: center;
      position: relative;
      flex-shrink: 0;
      gap: 0.125rem;
      padding: 0.375rem;
      border-bottom: 1px solid var(--cp-border);
    }

    /* 검색칸은 자리만 차지하고 입력창은 그 위에 겹쳐 둔다. 모바일에서 포커스 시 옆으로 넓어져도 다른 버튼이 밀리지 않는다. */
    #cp-editor .cp-search-slot {
      position: relative;
      flex: 1;
      min-width: 0;
      height: 2rem;
      margin-right: 0.25rem;
    }

    #cp-editor .cp-search {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 2;
      width: 100%;
      height: 100%;
      padding: 0 0.5rem;
      font-size: 0.8125rem;
    }

    #cp-editor .cp-icon[aria-pressed="true"],
    #cp-editor .cp-icon[aria-expanded="true"] {
      background: var(--cp-hover);
      color: var(--cp-accent);
    }

    #cp-editor .cp-filter-count {
      position: absolute;
      top: 0.0625rem;
      right: 0.0625rem;
      min-width: 0.875rem;
      padding: 0 0.1875rem;
      border-radius: 999px;
      background: var(--cp-accent);
      color: #fff;
      font-size: 0.5625rem;
      line-height: 0.875rem;
    }

    #cp-editor .cp-popover {
      position: absolute;
      top: calc(100% + 0.25rem);
      left: 0.375rem;
      z-index: 1;
      width: min(15rem, calc(var(--cp-dialog-width, 100vw) - 0.75rem));
      max-height: min(20rem, calc(var(--cp-dialog-height, 100dvh) * 0.6));
      overflow: auto;
      padding: 0.25rem;
      border: 1px solid var(--cp-border);
      border-radius: 0.5rem;
      background: var(--cp-bg);
      box-shadow: 0 0.25rem 0.75rem #0003;
      font-size: 0.8125rem;
    }

    #cp-editor .cp-popover > button,
    #cp-editor .cp-popover > label {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.375rem 0.5rem;
      border: 0;
      border-radius: 0.25rem;
      background: transparent;
      color: inherit;
      font-size: inherit;
      font-weight: 400;
      text-align: left;
      cursor: pointer;
    }

    #cp-editor .cp-popover > button:hover,
    #cp-editor .cp-popover > label:hover { background: var(--cp-hover); }
    #cp-editor .cp-sort-menu button[aria-pressed="true"] { color: var(--cp-accent); font-weight: 700; }
    #cp-editor .cp-filter-menu .cp-clear { color: var(--cp-accent); }
    #cp-editor .cp-filter-menu input { width: auto; margin: 0; padding: 0; accent-color: var(--cp-accent); }
    #cp-editor .cp-tag-count { margin-left: auto; color: var(--cp-muted); font-size: 0.75rem; }

    #cp-editor .cp-list {
      flex: 1;
      min-width: 0;
      min-height: 0;
      overflow: auto;
      overscroll-behavior: contain;
    }

    #cp-editor .cp-empty { margin: 0; padding: 0.75rem; color: var(--cp-muted); font-size: 0.8125rem; }

    /* 목록: 트리 형태. 폴더 아래 항목은 세로 안내선으로 묶고 행 높이로만 구분한다. */
    #cp-editor .cp-folder-head,
    #cp-editor .cp-item {
      display: flex;
      align-items: center;
      width: 100%;
      min-height: 1.875rem;
    }

    #cp-editor .cp-folder-head {
      gap: 0.375rem;
      padding: 0 0.625rem 0 0.5rem;
      border: 0;
      background: transparent;
      color: var(--cp-text);
      font-size: 0.8125rem;
      font-weight: 700;
      text-align: left;
      cursor: pointer;
    }

    #cp-editor .cp-folder-head:hover { background: var(--cp-hover); }
    #cp-editor .cp-folder-head svg { flex-shrink: 0; }
    #cp-editor .cp-folder-chevron { color: var(--cp-muted); }
    #cp-editor .cp-folder-head[aria-expanded="true"] .cp-folder-chevron { rotate: 90deg; }
    #cp-editor .cp-folder-icon { color: var(--cp-folder-icon); }
    #cp-editor .cp-folder-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #cp-editor .cp-folder-count { flex-shrink: 0; color: var(--cp-muted); font-size: 0.75rem; font-weight: 400; }
    #cp-editor .cp-folder-head[aria-expanded="false"] + .cp-folder-body { display: none; }
    #cp-editor .cp-folder-body { margin-left: 0.875rem; border-left: 1px solid var(--cp-border); }

    #cp-editor .cp-item:hover { background: var(--cp-hover); }
    #cp-editor .cp-item.is-selected { background: var(--cp-selected); }

    #cp-editor .cp-item-select {
      display: flex;
      flex: 1;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
      height: 100%;
      padding: 0.375rem 0 0.375rem 0.625rem;
      border: 0;
      background: transparent;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    /* 이름 열은 고정 폭으로 맞추고, 더 긴 이름은 말줄임한다. */
    #cp-editor .cp-item-name {
      flex: 0 0 5.5em;
      overflow: hidden;
      font-size: 0.8125rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #cp-editor .cp-current-badge {
      flex-shrink: 0;
      padding: 0 0.3125rem;
      border-radius: 0.25rem;
      background: var(--cp-accent);
      color: #fff;
      font-size: 0.6875rem;
      font-weight: 700;
      line-height: 1.125rem;
    }

    #cp-editor .cp-preview {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      color: var(--cp-muted);
      font-size: 0.75rem;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #cp-editor .cp-delete {
      flex: 0 0 1.5rem;
      height: 1.5rem;
      margin-right: 0.25rem;
      padding: 0;
      border: 0;
      border-radius: 0.25rem;
      background: transparent;
      color: var(--cp-muted);
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
    }

    #cp-editor .cp-delete:hover:not(:disabled) { background: var(--cp-danger); color: #fff; }

    #cp-editor .cp-add {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      gap: 0.375rem;
      margin: 0.375rem;
      padding: 0.5rem;
      border: 0;
      border-radius: 0.5rem;
      background: var(--cp-accent);
      color: #fff;
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
    }

    #cp-editor .cp-add:hover:not(:disabled) { background: var(--cp-accent-hover); }
    #cp-editor .cp-add-count { font-weight: 400; opacity: 0.85; font-variant-numeric: tabular-nums; }

    /* ── 오른쪽 편집 영역 ── */
    #cp-editor .cp-main {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      overflow: auto;
      overscroll-behavior: contain;
      background: var(--cp-bg);
    }

    #cp-editor label {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      gap: 0.375rem;
      min-width: 0;
      font-size: 0.8125rem;
      font-weight: 700;
    }

    #cp-editor input,
    #cp-editor textarea {
      width: 100%;
      padding: 0.5rem 0.625rem;
      border: 1px solid var(--cp-border);
      border-radius: 0.5rem;
      outline: none;
      background: var(--cp-input-bg);
      color: inherit;
      font: inherit;
      font-weight: 400;
    }

    #cp-editor input:focus,
    #cp-editor textarea:focus {
      border-color: var(--cp-accent);
      box-shadow: 0 0 0 0.125rem var(--cp-accent-ring);
    }

    #cp-editor textarea {
      flex: 1;
      min-height: 6em;
      resize: vertical;
      line-height: 1.55;
    }

    /* 사용 작품·태그: 한 줄 가로 스크롤, 스크롤바는 숨기고 PC는 드래그로 이동 */
    #cp-editor .cp-meta { display: flex; flex-direction: column; flex-shrink: 0; gap: 0.25rem; }
    #cp-editor .cp-meta-row { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
    #cp-editor .cp-meta-label { flex: 0 0 2rem; color: var(--cp-muted); font-size: 0.75rem; font-weight: 700; }

    #cp-editor .cp-strip {
      display: flex;
      flex: 1;
      gap: 0.25rem;
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;
      user-select: none;
      cursor: grab;
    }

    #cp-editor .cp-strip::-webkit-scrollbar { display: none; }
    #cp-editor .cp-strip-empty { color: var(--cp-muted); font-size: 0.75rem; white-space: nowrap; }

    #cp-editor .cp-chip {
      flex-shrink: 0;
      padding: 0 0.4375rem;
      border-radius: 999px;
      background: hsl(var(--cp-hue) var(--cp-chip-bg-s) var(--cp-chip-bg-l));
      color: hsl(var(--cp-hue) 60% var(--cp-chip-text-l));
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1.375rem;
      white-space: nowrap;
    }

    #cp-editor .cp-chip.is-story { background: var(--cp-hover); color: var(--cp-text); }
    #cp-editor .cp-chip.is-story span { margin-left: 0.25rem; color: var(--cp-muted); font-weight: 400; }

    #cp-editor .cp-information-label { flex: 1 0 auto; min-height: 8em; }
    #cp-editor .cp-information-heading { display: flex; align-items: center; justify-content: space-between; }
    #cp-editor .cp-information-count { color: var(--cp-muted); font-size: 0.75rem; font-weight: 400; font-variant-numeric: tabular-nums; }

    #cp-editor .cp-actions {
      display: flex;
      flex-shrink: 0;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    #cp-editor .cp-button {
      padding: 0.5rem 1rem;
      border: 0;
      border-radius: 0.5rem;
      background: var(--cp-neutral-button);
      color: var(--cp-text);
      font-weight: 700;
      cursor: pointer;
    }

    #cp-editor .cp-button:hover:not(:disabled) { background: var(--cp-neutral-button-hover); }
    #cp-editor .cp-button.is-primary { background: var(--cp-accent); color: #fff; }
    #cp-editor .cp-button.is-primary:hover:not(:disabled) { background: var(--cp-accent-hover); }

    #cp-editor button:disabled { opacity: 0.5; cursor: not-allowed; }
    #cp-editor[aria-busy="true"] button:disabled { cursor: wait; }

    @media (max-width: 47.5rem) {
      #cp-editor .cp-sidebar { flex-basis: 36%; }
      #cp-editor .cp-toolbar { gap: 0; padding: 0.25rem; }
      #cp-editor .cp-icon { flex-basis: 1.75rem; width: 1.75rem; }
      #cp-editor .cp-search { font-size: 1rem; }
      /* 포커스 시 오른쪽 버튼 4개(1.75rem씩)와 여백 위를 덮어 사이드바 폭까지만 넓힌다. */
      #cp-editor .cp-search:focus { width: calc(100% + 7.25rem); }
      #cp-editor .cp-item-select { gap: 0.375rem; padding-left: 0.375rem; }
      #cp-editor .cp-item-name { flex-basis: 4.5em; }
      #cp-editor .cp-folder-head { padding: 0 0.375rem 0 0.25rem; }
      #cp-editor .cp-folder-body { margin-left: 0.5rem; }
      #cp-editor .cp-delete { margin-right: 0.125rem; }
      #cp-editor .cp-add { margin: 0.25rem; padding: 0.4375rem; }
      #cp-editor .cp-add-label { display: none; }
      #cp-editor .cp-main { gap: 0.375rem; padding: 0.5rem; }
      #cp-editor label { gap: 0.25rem; }
      #cp-editor input, #cp-editor textarea { padding: 0.375rem; font-size: 1rem; }
      #cp-editor .cp-actions { gap: 0.25rem; }
      #cp-editor .cp-actions .cp-button { flex: 1 1 auto; min-width: 0; padding: 0.5rem 0.25rem; font-size: 0.8rem; }
    }
  `;

  // ── 사이트 팝업 식별 및 인증 세션 읽기 (저장하지 않음) ──
  function installStyle() {
    if (document.getElementById('cp-editor-style')) return;

    const style = document.createElement('style');
    style.id = 'cp-editor-style';
    style.textContent = STYLE;
    document.head.append(style);
  }

  function findProfileDialog() {
    return [...document.querySelectorAll('[role="dialog"]')].find((dialog) => {
      return dialog.querySelector('h2')?.textContent.trim() === DIALOG_TITLE;
    });
  }

  function getChatId() {
    return location.pathname.match(/\/episodes\/([a-f0-9]+)/i)?.[1] ?? null;
  }

  function getAccessToken() {
    return document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/)?.[1] ?? null;
  }

  function unwrapData(response) {
    return response?.data ?? response;
  }

  // ── API 통신: 브라우저 HTTP 캐시를 사용하거나 남기지 않음 ──
  async function apiRequest(baseUrl, method, path, body) {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error('로그인 세션을 찾지 못했습니다.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          platform: 'web',
          'wrtn-locale': 'ko-KR',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });

      const text = await response.text();
      let responseBody = null;

      if (text) {
        try {
          responseBody = JSON.parse(text);
        } catch (_) {
          responseBody = text;
        }
      }

      if (!response.ok) {
        const serverMessage = responseBody?.message ?? responseBody?.data?.message;
        throw new Error(serverMessage || `API 요청 실패 (${response.status})`);
      }

      return responseBody;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('API 응답 시간이 초과되었습니다.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function profileRequest(method, path, body) {
    return apiRequest(PROFILE_API_BASE, method, path, body);
  }

  function chatRequest(method, path, body) {
    return apiRequest(CHAT_API_BASE, method, path, body);
  }

  // ── 원본 데이터 조회 ──
  // 계정 ID는 페이지가 유지되는 동안만 메모리에 둔다.
  let accountIdRequest = null;

  function getAccountProfileId() {
    accountIdRequest ??= profileRequest('GET', '/profiles').then((response) => {
      const profile = unwrapData(response);
      const profileId = profile?._id ?? profile?.id;
      if (!profileId) {
        throw new Error('계정 프로필 ID를 가져오지 못했습니다.');
      }
      return profileId;
    }).catch((error) => {
      accountIdRequest = null;
      throw error;
    });
    return accountIdRequest;
  }

  async function loadChatProfiles(profileId) {
    const response = await profileRequest(
      'GET',
      `/profiles/${profileId}/chat-profiles`,
    );
    const data = unwrapData(response);
    const profiles = data?.chatProfiles ?? data;

    if (!Array.isArray(profiles)) {
      throw new Error('대화 프로필 목록 응답 형식이 올바르지 않습니다.');
    }

    return profiles.map((profile) => ({
      id: profile._id ?? profile.id,
      name: profile.name ?? '',
      information: profile.information ?? '',
      createdAt: profile.createdAt ?? null,
      updatedAt: profile.updatedAt ?? null,
      current: false,
    }));
  }

  // 프로필을 지정한 적 없는 대화는 응답에 chatProfile이 없다.
  async function loadChat(chatId) {
    const chat = unwrapData(await chatRequest('GET', `/v3/chats/${chatId}`));
    return {
      profileId: chat?.chatProfile?._id ?? null,
      story: { id: chat?.story?._id ?? null, name: chat?.story?.name ?? '' },
      createdAt: chat?.createdAt ?? null,
    };
  }

  // 갱신에 필요한 ID와 생성 시각만 남겨 대화 본문 등은 메모리에 쌓지 않는다.
  async function loadAllChats() {
    const chats = [];
    let cursor = null;

    do {
      const query = new URLSearchParams({ limit: String(CHAT_PAGE_SIZE) });
      if (cursor) query.set('cursor', cursor);
      const data = unwrapData(await chatRequest('GET', `/v3/chats?${query}`));
      if (!Array.isArray(data?.chats)) {
        throw new Error('대화 목록 응답 형식이 올바르지 않습니다.');
      }
      for (const chat of data.chats) chats.push({ id: chat._id, createdAt: chat.createdAt });
      cursor = data.nextCursor;
    } while (cursor);

    return chats;
  }

  async function loadProfileState() {
    const chatId = getChatId();
    if (!chatId) {
      throw new Error('대화 ID를 찾지 못했습니다.');
    }

    const profileId = await getAccountProfileId();
    const [profiles, currentChat] = await Promise.all([
      loadChatProfiles(profileId),
      loadChat(chatId),
    ]);

    profiles.forEach((profile) => {
      profile.current = profile.id === currentChat.profileId;
    });

    return { profileId, profiles, currentChat };
  }

  // ── 영구 저장: 폴더 보기·사이드바 숨김 설정과 계정별 작품·프로필 사용 카운트 ──
  // { version, showFolders, hideSidebar, accounts: { [계정ID]: { updatedAt, lastChatCreatedAt,
  //   stories: { [작품ID]: { name, profiles: { [프로필ID]: 대화 수 } } } } } }
  function createStore() {
    return { version: STORAGE_VERSION, showFolders: false, hideSidebar: false, accounts: {} };
  }

  function loadStore() {
    const store = GM_getValue(STORAGE_KEY, null);
    return store?.version === STORAGE_VERSION ? store : createStore();
  }

  // 다른 탭의 변경을 덮어쓰지 않도록 항상 최신 값을 읽은 뒤 수정한다.
  function updateStore(update) {
    const store = loadStore();
    update(store);
    GM_setValue(STORAGE_KEY, store);
  }

  function changeProfileCount(account, story, profileId, delta) {
    const entry = account.stories[story.id] ??= { name: story.name, profiles: {} };
    if (story.name) entry.name = story.name;

    const count = (entry.profiles[profileId] ?? 0) + delta;
    if (count > 0) {
      entry.profiles[profileId] = count;
    } else {
      delete entry.profiles[profileId];
    }

    if (!Object.keys(entry.profiles).length) delete account.stories[story.id];
  }

  // ── 폴더 갱신: 모든 대화의 프로필을 조회해 카운트를 다시 만든다. 팝업을 닫아도 계속 진행 ──
  const sync = { running: false, done: 0, total: 0 };
  // 팝업은 한 번에 하나만 열리므로 마지막으로 연 편집기만 진행 상황을 받는다.
  let syncListener = null;

  function notifySync(result) {
    syncListener?.(result);
  }

  async function syncFolders(accountId) {
    if (sync.running) return;

    Object.assign(sync, { running: true, done: 0, total: 0 });
    notifySync();
    let result;

    try {
      const startedAt = new Date().toISOString();
      const chats = await loadAllChats();
      // 목록에 포함된 가장 늦은 생성 시각 이후의 대화만 새 대화로 센다.
      const lastChatCreatedAt = chats.reduce((latest, chat) => {
        return Date.parse(chat.createdAt) > Date.parse(latest ?? '') ? chat.createdAt : latest;
      }, null) ?? startedAt;
      const account = { updatedAt: startedAt, lastChatCreatedAt, stories: {} };
      let next = 0;

      sync.total = chats.length;
      notifySync();

      async function work() {
        while (next < chats.length) {
          const chat = await loadChat(chats[next++].id);
          if (chat.profileId && chat.story.id) {
            changeProfileCount(account, chat.story, chat.profileId, 1);
          }
          sync.done += 1;
          notifySync();
        }
      }

      await Promise.all(Array.from({ length: SYNC_CONCURRENCY }, work));
      updateStore((store) => {
        store.accounts[accountId] = account;
      });
      result = { ok: true };
    } catch (error) {
      console.error('[대화 프로필 편집기] 폴더 갱신 실패', error);
      result = { error };
    } finally {
      sync.running = false;
      notifySync(result);
    }
  }

  // ── 새 대화 감지: 대화방에 들어갈 때 생성 시각이 기준보다 늦으면 카운트에 더한다 ──
  let checkedChatId = null;

  async function countNewChat() {
    const chatId = getChatId();
    if (!chatId || chatId === checkedChatId || sync.running) return;
    checkedChatId = chatId;
    if (!Object.keys(loadStore().accounts).length) return;

    try {
      const accountId = await getAccountProfileId();
      if (!loadStore().accounts[accountId]) return;

      const chat = await loadChat(chatId);
      if (!chat.profileId || !chat.story.id) return;

      updateStore((store) => {
        const account = store.accounts[accountId];
        if (!account || !(Date.parse(chat.createdAt) > Date.parse(account.lastChatCreatedAt))) return;
        account.lastChatCreatedAt = chat.createdAt;
        changeProfileCount(account, chat.story, chat.profileId, 1);
      });
    } catch (error) {
      console.error('[대화 프로필 편집기] 새 대화 확인 실패', error);
    }
  }

  // ── 태그: 정보의 값을 구분자로 나눠 2개 이상 프로필이 공유하는 짧은 단어만 사용 ──
  function extractTokens(information) {
    const tokens = new Set();

    for (const line of information.split('\n')) {
      const value = line.replace(/^[^:=]*[:=]/, '');
      for (const part of value.split(/[,+·/↔()[\]{}"'|;:=]/)) {
        const token = part.replace(/\s+/g, '').normalize('NFC').toLocaleLowerCase('ko');
        if (token && token.length <= TAG_MAX_LENGTH) tokens.add(token);
      }
    }

    return tokens;
  }

  function buildTagIndex(profiles) {
    const tokensByProfile = new Map();
    const counts = new Map();

    for (const profile of profiles) {
      const tokens = extractTokens(profile.information);
      tokensByProfile.set(profile, tokens);
      tokens.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
    }

    const tags = [...counts]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'));
    const rank = new Map(tags.map(([tag], index) => [tag, index]));

    return {
      tags,
      has(tag) {
        return rank.has(tag);
      },
      hasAll(profile, required) {
        const tokens = tokensByProfile.get(profile);
        return required.every((tag) => tokens?.has(tag));
      },
      tagsOf(profile) {
        return [...(tokensByProfile.get(profile) ?? [])]
          .filter((token) => rank.has(token))
          .sort((a, b) => rank.get(a) - rank.get(b));
      },
    };
  }

  // 같은 단어는 항상 같은 색이 되도록 단어에서 색상값을 만든다.
  function tagHue(tag) {
    let hue = 0;
    for (const character of tag) hue = (hue * 31 + character.codePointAt(0)) % 360;
    return hue;
  }

  function chipMarkup(tag) {
    return `<span class="cp-chip" style="--cp-hue:${tagHue(tag)}">${escapeHtml(tag)}</span>`;
  }

  // 스크롤바 없는 가로 줄: 터치는 기본 스크롤, 마우스는 드래그로 이동하고 놓으면 관성으로 이어서 미끄러진다.
  const DRAG_FRICTION = 0.95; // 프레임당 속도 유지 비율
  const DRAG_MIN_SPEED = 0.02; // 이 속도(px/ms) 아래로 떨어지면 멈춘다.

  function enableDragScroll(strip) {
    let glideFrame = 0;

    strip.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      cancelAnimationFrame(glideFrame);

      let lastX = event.clientX;
      let lastTime = event.timeStamp;
      let velocity = 0;

      const move = (moveEvent) => {
        const deltaX = moveEvent.clientX - lastX;
        const elapsed = Math.max(1, moveEvent.timeStamp - lastTime);
        strip.scrollLeft -= deltaX;
        velocity = deltaX / elapsed;
        lastX = moveEvent.clientX;
        lastTime = moveEvent.timeStamp;
      };

      const stop = (upEvent) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
        // 놓기 직전에 멈춰 있었다면 관성을 주지 않는다.
        if (upEvent.timeStamp - lastTime > 100) return;

        let previous = performance.now();
        const glide = (now) => {
          const elapsed = now - previous;
          previous = now;
          strip.scrollLeft -= velocity * elapsed;
          velocity *= DRAG_FRICTION ** (elapsed / 16);
          if (Math.abs(velocity) > DRAG_MIN_SPEED) glideFrame = requestAnimationFrame(glide);
        };
        glideFrame = requestAnimationFrame(glide);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stop);
    });
  }

  // ── 기존 목록은 숨기기만 하며 원본 데이터로 읽지 않음 ──
  function hideNativeProfileList(dialog) {
    const firstCard = dialog.querySelector(SELECTORS.nativeCard);
    const nativeBody = firstCard?.closest('div.px-5.py-1')
      ?? firstCard?.parentElement?.parentElement;

    if (!nativeBody || nativeBody.style.visibility === 'hidden') return;

    nativeBody.style.cssText = [
      'position:absolute!important',
      'inset:0!important',
      'width:0!important',
      'height:0!important',
      'overflow:hidden!important',
      'display:block!important',
      'visibility:hidden!important',
      'pointer-events:none!important',
    ].join(';');
  }

  function escapeHtml(value) {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return String(value).replace(/[&<>"']/g, (character) => {
      return replacements[character];
    });
  }

  // ── 검색 및 정렬: 날짜 누락 항목은 양방향 모두 마지막에 배치 ──
  const SORT_OPTIONS = [
    { value: 'created-asc', label: '생성일자 오름차순', field: 'createdAt', direction: 1 },
    { value: 'created-desc', label: '생성일자 내림차순', field: 'createdAt', direction: -1 },
    { value: 'updated-asc', label: '마지막수정일 오름차순', field: 'updatedAt', direction: 1 },
    { value: 'updated-desc', label: '마지막수정일 내림차순', field: 'updatedAt', direction: -1 },
    { value: 'name', label: '이름순 (가나다순)' },
  ];

  function getVisibleProfiles(profiles, query, sortMode) {
    const keyword = query.trim().normalize('NFC').toLocaleLowerCase('ko');
    const option = SORT_OPTIONS.find((item) => item.value === sortMode)
      ?? SORT_OPTIONS.find((item) => item.value === DEFAULT_SORT_MODE);
    const byName = (a, b) => a.name.localeCompare(b.name, 'ko');
    return profiles.filter((profile) => [profile.name, profile.information].some((text) => {
      return text.normalize('NFC').toLocaleLowerCase('ko').includes(keyword);
    })).sort((a, b) => {
      if (!option.field) return byName(a, b);
      const left = Date.parse(a[option.field]);
      const right = Date.parse(b[option.field]);
      if (!Number.isFinite(left) || !Number.isFinite(right)) {
        return Number(!Number.isFinite(left)) - Number(!Number.isFinite(right)) || byName(a, b);
      }
      return (left - right) * option.direction || byName(a, b);
    });
  }

  // 정렬·태그 필터·폴더 접힘은 새로고침 전까지 메모리에만 유지한다.
  const viewState = {
    sortMode: DEFAULT_SORT_MODE,
    selectedTags: new Set(),
    collapsedFolders: new Set(),
  };
  const UNSET_FOLDER_KEY = 'unset';

  // ── 편집기 마크업 ──
  function createEditorMarkup() {
    return `
      <aside class="cp-sidebar">
        <div class="cp-toolbar">
          <div class="cp-search-slot">
            <input class="cp-search" type="search" placeholder="이름·내용 검색" aria-label="프로필 이름과 내용 검색" autocomplete="off">
          </div>
          <button class="cp-icon cp-folder-toggle" type="button" title="폴더 보기" aria-label="폴더 보기" aria-pressed="false">${ICONS.folder}</button>
          <button class="cp-icon cp-collapse-all" type="button"></button>
          <button class="cp-icon cp-filter-toggle" type="button" title="태그 필터" aria-label="태그 필터" aria-expanded="false">${ICONS.filter}<span class="cp-filter-count" hidden></span></button>
          <button class="cp-icon cp-sort" type="button" aria-label="프로필 정렬" aria-expanded="false">${ICONS.sort}</button>
          <div class="cp-popover cp-filter-menu" role="group" aria-label="태그 필터" hidden></div>
          <div class="cp-popover cp-sort-menu" role="group" aria-label="정렬 기준" hidden>
            ${SORT_OPTIONS.map((option) => `
              <button type="button" data-sort="${option.value}">${option.label}</button>
            `).join('')}
          </div>
        </div>
        <div class="cp-list"></div>
        <button class="cp-add" type="button" title="프로필 추가">+ <span class="cp-add-label">프로필 추가</span><span class="cp-add-count"></span></button>
      </aside>
      <div class="cp-main">
        <label>
          이름
          <input class="cp-name" maxlength="12" placeholder="나의 이름">
        </label>
        <div class="cp-meta">
          <div class="cp-meta-row">
            <span class="cp-meta-label">작품</span>
            <div class="cp-strip cp-story-strip"></div>
          </div>
          <div class="cp-meta-row">
            <span class="cp-meta-label">태그</span>
            <div class="cp-strip cp-tag-strip"></div>
          </div>
        </div>
        <label class="cp-information-label">
          <span class="cp-information-heading">
            <span>정보</span>
            <span class="cp-information-count">0/500</span>
          </span>
          <textarea class="cp-information" maxlength="500" placeholder="나이, 성별, 외형 등"></textarea>
        </label>
        <div class="cp-actions">
          <button class="cp-button cp-use" type="button">이 프로필 사용</button>
          <button class="cp-button cp-save is-primary" type="button">적용</button>
        </div>
      </div>
    `;
  }

  // ── 팝업별 임시 상태: 닫으면 폐기하며 재개방 시 새로 조회 ──
  async function enhanceDialog(dialog) {
    if (dialog.querySelector('#cp-editor')) return;

    const root = document.createElement('section');
    root.id = 'cp-editor';
    root.innerHTML = createEditorMarkup();
    dialog.append(root);

    const title = dialog.querySelector('h2');
    const header = title?.parentElement;
    header?.classList.add('cp-header');
    const status = document.createElement('span');
    status.className = 'cp-status';
    status.textContent = '프로필 정보를 불러오는 중...';
    title?.after(status);

    function createHeaderButton(icon, label) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cp-header-button';
      button.title = label;
      button.setAttribute('aria-label', label);
      button.innerHTML = icon;
      return button;
    }

    const sidebarButton = createHeaderButton(ICONS.sidebar, '사이드바 닫기');
    const syncButton = createHeaderButton(ICONS.sync, '폴더 갱신');
    const closeButton = header?.querySelector('button[aria-label="닫기"]');
    if (closeButton) closeButton.before(sidebarButton, syncButton); else header?.append(sidebarButton, syncButton);

    const list = root.querySelector('.cp-list');
    const searchInput = root.querySelector('.cp-search');
    const folderToggle = root.querySelector('.cp-folder-toggle');
    const collapseAllButton = root.querySelector('.cp-collapse-all');
    const filterButton = root.querySelector('.cp-filter-toggle');
    const filterCount = root.querySelector('.cp-filter-count');
    const filterMenu = root.querySelector('.cp-filter-menu');
    const sortButton = root.querySelector('.cp-sort');
    const sortMenu = root.querySelector('.cp-sort-menu');
    const nameInput = root.querySelector('.cp-name');
    const storyStrip = root.querySelector('.cp-story-strip');
    const tagStrip = root.querySelector('.cp-tag-strip');
    const informationInput = root.querySelector('.cp-information');
    const addButton = root.querySelector('.cp-add');
    const addCount = root.querySelector('.cp-add-count');
    const useButton = root.querySelector('.cp-use');
    const informationCount = root.querySelector('.cp-information-count');
    const saveButton = root.querySelector('.cp-save');

    let accountProfileId = null;
    let profiles = [];
    let currentChat = null;
    let selected = null;
    let busy = true;
    const savedStore = loadStore();
    let showFolders = savedStore.showFolders;
    let hideSidebar = Boolean(savedStore.hideSidebar);
    let folderAccount = null;
    let folderKeys = [];
    let tagIndex = buildTagIndex([]);

    enableDragScroll(storyStrip);
    enableDragScroll(tagStrip);

    function setStatus(message) {
      status.textContent = message;
    }

    function setBusy(nextBusy) {
      busy = nextBusy;
      render({ syncForm: false });
    }

    function updateInformationCount() {
      informationCount.textContent = `${informationInput.value.length}/${informationInput.maxLength}`;
    }

    informationInput.addEventListener('input', updateInformationCount);

    function createItem(profile) {
      const item = document.createElement('div');
      item.className = `cp-item${profile === selected ? ' is-selected' : ''}`;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cp-item-select';
      button.innerHTML = `
        ${profile.current ? '<span class="cp-current-badge">현재</span>' : ''}
        <span class="cp-item-name">${escapeHtml(profile.name || '이름 없음')}</span>
        <span class="cp-preview">${escapeHtml(profile.information)}</span>
      `;
      button.disabled = busy;
      button.addEventListener('click', () => {
        selected = profile;
        render();
      });

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'cp-delete';
      deleteButton.textContent = '×';
      deleteButton.title = '프로필 삭제';
      deleteButton.setAttribute('aria-label', `${profile.name || '이름 없음'} 프로필 삭제`);
      deleteButton.disabled = busy || !profile.id || profile.current || !accountProfileId;
      deleteButton.addEventListener('click', () => deleteProfile(profile));

      item.append(button, deleteButton);
      return item;
    }

    function createFolder(folderKey, folderName, members) {
      const folder = document.createElement('div');
      const head = document.createElement('button');
      const body = document.createElement('div');

      head.type = 'button';
      head.className = 'cp-folder-head';
      head.setAttribute('aria-expanded', String(!viewState.collapsedFolders.has(folderKey)));
      head.innerHTML = `${ICONS.chevron}${ICONS.folderSmall}<span class="cp-folder-name">${escapeHtml(folderName)}</span><span class="cp-folder-count">${members.length}</span>`;
      head.addEventListener('click', () => {
        if (!viewState.collapsedFolders.delete(folderKey)) viewState.collapsedFolders.add(folderKey);
        head.setAttribute('aria-expanded', String(!viewState.collapsedFolders.has(folderKey)));
        updateCollapseAllButton();
      });

      body.className = 'cp-folder-body';
      members.forEach((profile) => body.append(createItem(profile)));
      folder.append(head, body);
      return folder;
    }

    // 펼친 폴더가 하나라도 있으면 전체 접기, 모두 접혀 있으면 전체 펼치기로 동작한다.
    function updateCollapseAllButton() {
      const allCollapsed = folderKeys.length > 0
        && folderKeys.every((key) => viewState.collapsedFolders.has(key));
      const label = allCollapsed ? '전체 펼치기' : '전체 접기';
      collapseAllButton.innerHTML = allCollapsed ? ICONS.expand : ICONS.collapse;
      collapseAllButton.title = label;
      collapseAllButton.setAttribute('aria-label', label);
      collapseAllButton.disabled = !folderKeys.length;
    }

    collapseAllButton.addEventListener('click', () => {
      const allCollapsed = folderKeys.every((key) => viewState.collapsedFolders.has(key));
      folderKeys.forEach((key) => {
        if (allCollapsed) viewState.collapsedFolders.delete(key); else viewState.collapsedFolders.add(key);
      });
      renderList();
    });

    // 저장소는 읽을 때마다 복사본이 만들어지므로 목록을 불러올 때와 폴더 갱신 직후에만 읽는다.
    function loadFolderAccount() {
      folderAccount = accountProfileId ? loadStore().accounts[accountProfileId] ?? null : null;
    }

    // 목록만 갱신하여 검색·정렬·필터 시 편집 중 입력을 보존한다.
    function renderList() {
      const selectedTags = [...viewState.selectedTags];
      const sorted = getVisibleProfiles(profiles, searchInput.value, viewState.sortMode);
      const visible = selectedTags.length
        ? sorted.filter((profile) => tagIndex.hasAll(profile, selectedTags))
        : sorted;
      const account = showFolders ? folderAccount : null;

      list.replaceChildren();

      folderKeys = [];

      if (account) {
        // 폴더 위치는 폴더 안에서 정렬상 가장 앞선 프로필의 위치를 따른다. 미설정도 하나의 폴더로 다룬다.
        const order = new Map(visible.map((profile, index) => [profile, index]));
        const folders = [];
        const placed = new Set();
        const stories = Object.entries(account.stories)
          .sort(([, a], [, b]) => a.name.localeCompare(b.name, 'ko'));

        for (const [storyId, story] of stories) {
          const members = visible.filter((profile) => story.profiles[profile.id]);
          if (!members.length) continue;
          members.forEach((profile) => placed.add(profile));
          folders.push({ key: storyId, name: story.name || '이름 없는 작품', members });
        }

        const unset = visible.filter((profile) => !placed.has(profile));
        if (unset.length) folders.push({ key: UNSET_FOLDER_KEY, name: '미설정', members: unset });

        folders
          .sort((a, b) => order.get(a.members[0]) - order.get(b.members[0]))
          .forEach((folder) => {
            folderKeys.push(folder.key);
            list.append(createFolder(folder.key, folder.name, folder.members));
          });
      } else {
        visible.forEach((profile) => list.append(createItem(profile)));
      }

      updateCollapseAllButton();

      if (!visible.length) {
        const empty = document.createElement('p');
        empty.className = 'cp-empty';
        empty.textContent = busy ? '불러오는 중...' : !accountProfileId
          ? '목록을 다시 열어 주세요.' : profiles.length ? '검색 결과가 없습니다.' : '프로필이 없습니다.';
        list.append(empty);
      }

      filterCount.hidden = !selectedTags.length;
      filterCount.textContent = String(selectedTags.length);
    }

    function setStripMessage(strip, message) {
      const empty = document.createElement('span');
      empty.className = 'cp-strip-empty';
      empty.textContent = message;
      strip.replaceChildren(empty);
    }

    // 선택한 프로필이 쓰이는 작품과 태그를 보여준다.
    function renderMeta() {
      const account = folderAccount;
      const usedStories = account && selected?.id
        ? Object.values(account.stories)
          .filter((story) => story.profiles[selected.id])
          .sort((a, b) => b.profiles[selected.id] - a.profiles[selected.id] || a.name.localeCompare(b.name, 'ko'))
        : [];
      const tags = tagIndex.tagsOf(selected);

      storyStrip.scrollLeft = 0;
      tagStrip.scrollLeft = 0;

      if (!account) {
        setStripMessage(storyStrip, '폴더 갱신 전');
      } else if (!usedStories.length) {
        setStripMessage(storyStrip, '없음');
      } else {
        storyStrip.innerHTML = usedStories.map((story) => {
          return `<span class="cp-chip is-story">${escapeHtml(story.name || '이름 없는 작품')}<span>${story.profiles[selected.id]}</span></span>`;
        }).join('');
      }

      if (tags.length) {
        tagStrip.innerHTML = tags.map(chipMarkup).join('');
      } else {
        setStripMessage(tagStrip, '없음');
      }
    }

    function renderFilterMenu() {
      const { tags } = tagIndex;
      filterMenu.replaceChildren();

      if (!tags.length) {
        const empty = document.createElement('p');
        empty.className = 'cp-empty';
        empty.textContent = '2개 이상 프로필이 공유하는 태그가 없습니다.';
        filterMenu.append(empty);
        return;
      }

      if (viewState.selectedTags.size) {
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'cp-clear';
        clearButton.textContent = '선택 해제';
        filterMenu.append(clearButton);
      }

      for (const [tag, count] of tags) {
        const option = document.createElement('label');
        option.innerHTML = `<input type="checkbox" value="${escapeHtml(tag)}"${viewState.selectedTags.has(tag) ? ' checked' : ''}>${chipMarkup(tag)}<span class="cp-tag-count">${count}</span>`;
        filterMenu.append(option);
      }
    }

    function render({ syncForm = true } = {}) {
      root.setAttribute('aria-busy', String(busy));
      renderList();
      if (syncForm) {
        nameInput.value = selected?.name ?? '';
        informationInput.value = selected?.information ?? '';
        updateInformationCount();
        renderMeta();
      }
      folderToggle.setAttribute('aria-pressed', String(showFolders));
      addCount.textContent = `${profiles.length}/${MAX_CHAT_PROFILES}`;
      syncButton.disabled = sync.running || !accountProfileId;
      nameInput.disabled = busy || !selected || !accountProfileId;
      informationInput.disabled = nameInput.disabled;
      addButton.disabled = busy || !accountProfileId;
      saveButton.disabled = busy || !selected || !accountProfileId;
      useButton.disabled = busy || !selected?.id || selected.current;
    }

    // ── 폴더 보기·갱신 ──
    function startSyncIfMissing() {
      if (showFolders && accountProfileId && !folderAccount) {
        syncFolders(accountProfileId);
      }
    }

    function onSync(result) {
      if (!root.isConnected) {
        if (syncListener === onSync) syncListener = null;
        return;
      }
      syncButton.disabled = sync.running || !accountProfileId;
      if (sync.running) {
        setStatus(sync.total
          ? `폴더 갱신 중 ${sync.done}/${sync.total}`
          : '폴더 갱신 중: 대화 목록 확인');
      } else if (result?.error) {
        setStatus(`폴더 갱신 실패: ${result.error.message}`);
      } else if (result?.ok) {
        setStatus('폴더 정보를 갱신했습니다.');
        loadFolderAccount();
        renderList();
        renderMeta();
      }
    }

    syncListener = onSync;
    if (sync.running) onSync();

    syncButton.addEventListener('click', () => {
      if (accountProfileId) syncFolders(accountProfileId);
    });

    // ── 사이드바 열기·닫기: 편집 영역을 넓히기 위한 설정으로 영구 저장 ──
    function applySidebarVisibility() {
      const label = hideSidebar ? '사이드바 열기' : '사이드바 닫기';
      root.classList.toggle('is-sidebar-hidden', hideSidebar);
      sidebarButton.setAttribute('aria-pressed', String(!hideSidebar));
      sidebarButton.title = label;
      sidebarButton.setAttribute('aria-label', label);
    }

    applySidebarVisibility();
    sidebarButton.addEventListener('click', () => {
      hideSidebar = !hideSidebar;
      updateStore((store) => {
        store.hideSidebar = hideSidebar;
      });
      applySidebarVisibility();
    });

    folderToggle.addEventListener('click', () => {
      showFolders = !showFolders;
      updateStore((store) => {
        store.showFolders = showFolders;
      });
      folderToggle.setAttribute('aria-pressed', String(showFolders));
      renderList();
      startSyncIfMissing();
    });

    // ── 검색·필터·정렬 ──
    searchInput.addEventListener('input', renderList);

    const popovers = [[filterButton, filterMenu], [sortButton, sortMenu]];

    function closePopovers() {
      popovers.forEach(([button, menu]) => {
        menu.hidden = true;
        button.setAttribute('aria-expanded', 'false');
      });
    }

    function togglePopover(button, menu) {
      const opening = menu.hidden;
      closePopovers();
      if (!opening) return;
      if (menu === filterMenu) renderFilterMenu();
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
    }

    function updateSortMenu() {
      const option = SORT_OPTIONS.find((item) => item.value === viewState.sortMode);
      sortButton.title = `정렬: ${option.label}`;
      sortMenu.querySelectorAll('[data-sort]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item.dataset.sort === viewState.sortMode));
      });
    }

    updateSortMenu();
    filterButton.addEventListener('click', () => togglePopover(filterButton, filterMenu));
    sortButton.addEventListener('click', () => togglePopover(sortButton, sortMenu));

    filterMenu.addEventListener('change', (event) => {
      const tag = event.target.value;
      if (event.target.checked) {
        viewState.selectedTags.add(tag);
      } else {
        viewState.selectedTags.delete(tag);
      }
      renderList();
    });

    filterMenu.addEventListener('click', (event) => {
      if (!event.target.closest('.cp-clear')) return;
      viewState.selectedTags.clear();
      renderFilterMenu();
      renderList();
    });

    sortMenu.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sort]');
      if (!button) return;
      viewState.sortMode = button.dataset.sort;
      updateSortMenu();
      closePopovers();
      sortButton.focus();
      renderList();
    });

    root.addEventListener('keydown', (event) => {
      const open = popovers.find(([, menu]) => !menu.hidden);
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        event.stopPropagation();
        closePopovers();
        open[0].focus();
      }
    });

    root.addEventListener('click', (event) => {
      if (!event.target.closest('.cp-toolbar')) closePopovers();
    });

    // API 응답으로 목록을 교체하고 선택 항목만 이어받는다.
    async function refresh({ preserveSelection = false } = {}) {
      const previousId = preserveSelection ? selected?.id : null;
      const previousName = preserveSelection ? selected?.name : null;
      const state = await loadProfileState();
      if (!root.isConnected || dialog.dataset.state === 'closed' || dialog.hidden) return;

      accountProfileId = state.profileId;
      profiles = state.profiles;
      currentChat = state.currentChat;
      tagIndex = buildTagIndex(profiles);
      // 내용 수정으로 더 이상 공유되지 않는 태그는 필터 선택에서 뺀다.
      viewState.selectedTags.forEach((tag) => {
        if (!tagIndex.has(tag)) viewState.selectedTags.delete(tag);
      });
      loadFolderAccount();
      selected = profiles.find((profile) => profile.id === previousId)
        ?? profiles.find((profile) => profile.name === previousName)
        ?? profiles.find((profile) => profile.current)
        ?? profiles[0]
        ?? null;

      render();
    }

    // ── 추가·사용·저장·삭제 동작 ──
    addButton.addEventListener('click', () => {
      selected = {
        id: null,
        name: '',
        information: '',
        current: false,
        isNew: true,
      };

      render();
      nameInput.focus();
      setStatus('새 프로필을 입력한 뒤 적용을 누르세요.');
    });

    useButton.addEventListener('click', async () => {
      if (!selected?.id) return;

      const chatId = getChatId();
      if (!chatId) {
        setStatus('대화 ID를 찾지 못했습니다.');
        return;
      }

      const nextProfileId = selected.id;
      const previousChat = currentChat;
      setBusy(true);
      setStatus('프로필을 변경하는 중...');

      try {
        await chatRequest(
          'PATCH',
          `/v3/chats/${chatId}`,
          { chatProfileId: nextProfileId },
        );
        updateStore((store) => {
          const account = store.accounts[accountProfileId];
          if (!account || !previousChat?.story.id) return;
          if (previousChat.profileId) {
            changeProfileCount(account, previousChat.story, previousChat.profileId, -1);
          }
          changeProfileCount(account, previousChat.story, nextProfileId, 1);
        });
        await refresh();
        setStatus('현재 프로필을 변경했습니다.');
      } catch (error) {
        console.error('[대화 프로필 편집기] 프로필 변경 실패', error);
        setStatus(`프로필 변경 실패: ${error.message}`);
      } finally {
        setBusy(false);
      }
    });

    saveButton.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      const information = informationInput.value;

      if (!name) {
        setStatus('이름을 입력해 주세요.');
        return;
      }

      if (!accountProfileId) {
        setStatus('계정 프로필 ID가 없습니다. 목록을 다시 열어 주세요.');
        return;
      }

      setBusy(true);
      setStatus('저장 중...');

      try {
        const payload = { name, information };

        if (selected?.isNew) {
          await profileRequest(
            'POST',
            `/profiles/${accountProfileId}/chat-profiles`,
            payload,
          );
        } else if (selected?.id) {
          await profileRequest(
            'PATCH',
            `/profiles/${accountProfileId}/chat-profiles/${selected.id}`,
            payload,
          );
        } else {
          throw new Error('수정할 프로필 ID를 찾지 못했습니다.');
        }

        selected = { ...selected, name, information };
        await refresh({ preserveSelection: true });
        setStatus('프로필 정보를 저장했습니다.');
      } catch (error) {
        console.error('[대화 프로필 편집기] 저장 실패', error);
        setStatus(`저장 실패: ${error.message}`);
      } finally {
        setBusy(false);
      }
    });

    async function deleteProfile(profile) {
      if (busy || !profile?.id || profile.current || !accountProfileId) return;
      if (!confirm(`'${profile.name}' 프로필을 삭제할까요?`)) return;

      setBusy(true);
      setStatus('삭제 중...');

      try {
        await profileRequest(
          'DELETE',
          `/profiles/${accountProfileId}/chat-profiles/${profile.id}`,
        );
        updateStore((store) => {
          const account = store.accounts[accountProfileId];
          if (!account) return;
          for (const [storyId, story] of Object.entries(account.stories)) {
            delete story.profiles[profile.id];
            if (!Object.keys(story.profiles).length) delete account.stories[storyId];
          }
        });
        await refresh();
        setStatus('프로필을 삭제했습니다.');
      } catch (error) {
        console.error('[대화 프로필 편집기] 삭제 실패', error);
        setStatus(`삭제 실패: ${error.message}`);
      } finally {
        setBusy(false);
      }
    }

    render();

    try {
      await refresh();
      setStatus('현재 적용 중인 프로필을 선택했습니다.');
      startSyncIfMissing();
    } catch (error) {
      console.error('[대화 프로필 편집기] 불러오기 실패', error);
      setStatus(`프로필 불러오기 실패: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  // ── 팝업 배치: PC는 가로 폭만 제한하고 세로는 기존 비율 유지, 모바일은 표시 영역에 작은 여백을 둔 팝업 ──
  function updateDialogInset(dialog) {
    const viewport = window.visualViewport;
    const viewTop = viewport?.offsetTop ?? 0;
    const viewHeight = viewport?.height ?? window.innerHeight;
    const viewLeft = viewport?.offsetLeft ?? 0;
    const viewWidth = viewport?.width ?? document.documentElement.clientWidth;
    const isMobile = window.matchMedia('(max-width: 47.5rem)').matches;
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    let geometry;

    if (isMobile) {
      const margin = MOBILE_DIALOG_MARGIN_REM * rootFontSize;
      geometry = {
        '--cp-dialog-top': viewTop + margin,
        '--cp-dialog-left': viewLeft + margin,
        '--cp-dialog-width': Math.max(0, viewWidth - margin * 2),
        '--cp-dialog-height': Math.max(0, viewHeight - margin * 2),
      };
    } else {
      const siteTop = dialog.closest('main')?.getBoundingClientRect().top ?? 0;
      const contentTop = Math.max(viewTop, Math.min(Math.max(0, siteTop), viewTop + viewHeight));
      const contentHeight = Math.max(0, viewTop + viewHeight - contentTop);
      const width = Math.min(viewWidth * 0.94, DIALOG_MAX_WIDTH_REM * rootFontSize);
      const blockMargin = contentHeight * 0.02;
      geometry = {
        '--cp-dialog-top': contentTop + blockMargin,
        '--cp-dialog-left': viewLeft + (viewWidth - width) / 2,
        '--cp-dialog-width': Math.max(0, width),
        '--cp-dialog-height': Math.max(0, contentHeight - blockMargin * 2),
      };
    }

    // px는 직접적인 수치 명시 대신 브라우저가 측정한 CSS 좌표의 단위다.
    for (const [property, value] of Object.entries(geometry)) {
      dialog.style.setProperty(property, value + 'px');
    }
  }

  // ── 팝업 생명주기: 숨김/닫힘 시 이전 편집기를 폐기 ──
  function initialize() {
    installStyle();
    function syncDialog() {
      countNewChat();
      const dialog = findProfileDialog();
      if (!dialog) return;
      if (dialog.dataset.state === 'closed' || dialog.hidden) {
        dialog.querySelector('#cp-editor')?.remove();
        dialog.querySelector('.cp-status')?.remove();
        dialog.querySelectorAll('.cp-header-button').forEach((button) => button.remove());
        dialog.querySelector('.cp-header')?.classList.remove('cp-header');
        return;
      }
      // 사이트가 기존 목록을 다시 그릴 수 있어 숨김은 매번 확인한다.
      // 위치 계산은 레이아웃을 강제하므로 처음 열 때와 화면 크기 변경 때만 한다.
      hideNativeProfileList(dialog);
      if (!dialog.querySelector('#cp-editor')) {
        updateDialogInset(dialog);
        enhanceDialog(dialog);
      }
    }
    const observer = new MutationObserver(syncDialog);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'hidden'],
    });
    // 입력 중에는 데이터나 폼을 다시 그리지 않고 위치·높이만 갱신한다.
    function syncViewport() {
      const dialog = findProfileDialog();
      if (dialog?.querySelector('#cp-editor')) updateDialogInset(dialog);
    }
    window.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('resize', syncViewport);
    window.visualViewport?.addEventListener('scroll', syncViewport);
    syncDialog();
  }

  initialize();
})();
