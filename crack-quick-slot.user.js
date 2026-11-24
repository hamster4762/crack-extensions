// ==UserScript==
// @name         크랙 퀵슬롯바
// @namespace    crack-quick-slot
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0Ij48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI3IiBmaWxsPSIjMjQyMzIxIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNCA0KSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjciIGhlaWdodD0iNyIgcng9IjEuNSIvPjxyZWN0IHg9IjE0IiB5PSIzIiB3aWR0aD0iNyIgaGVpZ2h0PSI3IiByeD0iMS41Ii8+PHJlY3QgeD0iMyIgeT0iMTQiIHdpZHRoPSI3IiBoZWlnaHQ9IjciIHJ4PSIxLjUiLz48cGF0aCBkPSJNMTcuNSAxNHY3TTE0IDE3LjVoNyIvPjwvZz48L3N2Zz4=
// @version      1.0.0.0
// @description  채팅방 오른쪽 메뉴와 입력창 버튼을 퀵슬롯바에 모아 바로 사용합니다. (version 관리방식: 데이터스키마변경.크랙UI변경.기능추가및수정.버그수정)
// @match        https://crack.wrtn.ai/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

/*
 * Tampermonkey 저장소 (기본값은 저장하지 않으며, 저장할 값이 없으면 두 키를 모두 삭제)
 * ├─ meta
 * │  └─ version → 'v1'
 * └─ v1
 *    ├─ float                                        // 플로팅일 때만 존재
 *    │  ├─ x: number | null                          // 끌어 옮기기 전에는 null
 *    │  ├─ y: number | null
 *    │  └─ width?: number                            // 최대 너비(px). 내용에 맞춤이면 저장하지 않음
 *    └─ off: string[]                                  // 퀵슬롯바에서 뺀 메뉴·입력창 버튼 이름만 저장
 */

(function () {
    'use strict';

    const SCHEMA = 'v1';

    // ───────────────────────── 저장소 ─────────────────────────
    // 스키마가 바뀌면 여기서 이전 버전을 최신 구조로 옮긴다. 다른 로직은 최신 구조만 다룬다.
    function migrate() {
        const version = GM_getValue('meta')?.version ?? SCHEMA;
        if (version !== SCHEMA) throw new Error(`[크랙 퀵슬롯바] 지원하지 않는 설정 데이터 버전입니다: ${version}`);
    }

    const load = () => GM_getValue(SCHEMA, {});

    function save(mutate) {
        const data = load();
        mutate(data);
        if (!data.off?.length) delete data.off;
        if (Object.keys(data).length) {
            GM_setValue('meta', { version: SCHEMA });
            GM_setValue(SCHEMA, data);
        } else {
            GM_deleteValue(SCHEMA);
            GM_deleteValue('meta');
        }
        render();
    }

    function setOff(label, off) {
        save(data => {
            const set = new Set(data.off);
            if (off) set.add(label); else set.delete(label);
            data.off = [...set];
        });
    }

    // ───────────────────────── 크랙 화면 ─────────────────────────
    const PANEL = '.py-4.overflow-y-auto.scrollbar:has(> .px-2 > .box-content)';
    const HEADING = '.p-2.text-text_tertiary';
    const CONTROL = 'button:not([role="switch"]), a[href], [role="button"], [role="menuitem"]';
    // 크랙 기본 메뉴에서 가져올 구역과 표시 순서. ''는 제목 없는 맨 위 구역(이미지 보관함)이다.
    // 구역 안의 항목과 다른 확장의 항목은 이름을 지정하지 않는다.
    const SECTIONS = ['채팅방 설정', '', '스토리 고급 설정', '전체 설정'];
    // 메뉴에 없는 동안에도 자리를 지키는 고정 슬롯. 크랙 메뉴에 원래 아이콘이 없어 아이콘도 따로 지정한다.
    const GALLERY = '이미지 보관함';
    // 입력창 왼쪽 아래 버튼 그룹. 줄 맨 앞에 버튼 없는 요소가 끼어들 수 있어 버튼을 직접 가진 첫 자식을 찾는다.
    const GROUP = 'div.rounded-lg.border:has(.ProseMirror) > div > div.justify-between > div:nth-child(1 of :has(> button))';

    const text = el => el.textContent.replace(/\s+/g, ' ').trim();

    // 크랙이 그린 요소에는 React 내부 키가 있다. 없으면 다른 확장이 넣은 요소다.
    const isNative = el => Object.keys(el.wrappedJSObject ?? el).some(k => k.startsWith('__reactFiber$'));

    function controlsIn(el) {
        return [el, ...el.querySelectorAll(CONTROL)]
            .filter(c => c.matches(CONTROL) && (c === el || !el.contains(c.parentElement.closest(CONTROL))));
    }

    // 이름: 글자가 있는 첫 문구. 배지·아이콘·끝의 개수 표시 '(26/319)'는 제외한다.
    function readItem(control, row) {
        const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
        let emoji = '', label = '';
        for (let node; (node = walker.nextNode());) {
            const value = node.nodeValue.trim();
            if (!value || node.parentElement.closest('[role="switch"], svg, style')) continue;
            if (/\p{L}/u.test(value)) {
                label = [...node.parentNode.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.nodeValue).join('')
                    .replace(/\s+/g, ' ').replace(/\s*\([\d\s,/]*\)\s*$/, '').trim();
                break;
            }
            emoji ||= value;
        }
        // 보이는 이름이 없으면 메뉴가 아니라 미리보기 썸네일 같은 부속 버튼이다.
        if (!label) return null;
        const graphic = [...control.querySelectorAll('svg, img')].find(el => !el.closest('[role="switch"]'));
        const toggle = control.querySelector('[role="switch"]')
            || (controlsIn(row).length === 1 ? row.querySelector('[role="switch"]') : null);
        return { label, control, graphic, emoji, toggle, on: toggle ? toggle.getAttribute('aria-checked') === 'true' : null };
    }

    function collect() {
        const found = new Map();
        let section = '';
        const add = row => controlsIn(row).forEach(control => {
            const item = readItem(control, row);
            if (!item || found.has(item.label)) return;
            const index = SECTIONS.indexOf(section);
            found.set(item.label, { ...item, order: index < 0 ? SECTIONS.length : index });
        });
        for (const block of panel.children) {
            if (!isNative(block)) { add(block); continue; }
            for (const row of block.children) {
                if (!isNative(row)) add(row);
                else if (row.matches(HEADING)) section = text(row);
                else if (row.matches('.box-content') && SECTIONS.includes(section)) add(row);
            }
        }
        if (!found.has(GALLERY)) {
            found.set(GALLERY, { label: GALLERY, control: null, emoji: '', toggle: null, on: null, order: SECTIONS.indexOf('') });
        }
        return [...found.values()].sort((a, b) => a.order - b.order);
    }

    // 크랙 입력창 버튼. 다른 확장의 버튼은 이름이 없거나 상태에 따라 바뀔 수 있어 다루지 않는다.
    const toolName = label => label.replace(/ *(열기|닫기)$/, '');

    function collectTools() {
        return [...group.children].filter(el => el.matches('button[aria-label]') && isNative(el)).map(control => ({
            label: toolName(control.getAttribute('aria-label')), control, toggle: null, on: null,
            graphic: control.querySelector('svg, img'), emoji: text(control), order: SECTIONS.length + 1,
        }));
    }

    let group = null, panel = null, items = [], tools = [], settled = false, settleTimer = 0;
    let queued = false, panelDirty = false, toolsDirty = false;

    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; sync(); });
    }

    const panelObserver = new MutationObserver(() => { panelDirty = true; schedule(); });

    const toolsObserver = new MutationObserver(() => { toolsDirty = true; schedule(); });

    const barMounted = () => !!group?.isConnected && bar.parentNode === group;

    function sync() {
        const remount = !barMounted();
        if (remount) mountBar();
        const toolsChanged = toolsDirty;
        if (toolsDirty) {
            toolsDirty = false;
            tools = group ? collectTools() : [];
            watchSize();
        }
        if (!panel?.isConnected) {
            const next = document.querySelector(PANEL);
            if (next !== panel) watchPanel(next);
        } else if (panelDirty) {
            panelDirty = false;
            items = collect();
        } else if (!remount && !toolsChanged) return;
        render();
    }

    // 방을 옮기면 패널이 새로 만들어진다. 늦게 등록되는 메뉴는 변경 감지로 반영하고, 잠시 뒤 한 번만 다시 대조한다.
    function watchPanel(next) {
        panelObserver.disconnect();
        clearTimeout(settleTimer);
        panel = next;
        settled = panelDirty = false;
        items = panel ? collect() : [];
        if (!panel) return;
        panelObserver.observe(panel, {
            childList: true, subtree: true, characterData: true,
            attributes: true, attributeFilter: ['aria-checked'],
        });
        settleTimer = setTimeout(() => {
            settled = true;
            items = collect();
            render();
        }, 3000);
    }

    // ───────────────────────── UI 공통 ─────────────────────────
    const svg = body => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    const ICON = {
        quick: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M17.5 14v7M14 17.5h7"/>'),
        gear: svg('<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
        close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
        back: svg('<path d="M15 5l-7 7 7 7"/>'),
        image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15.5l-5-5L5.5 20"/>'),
        alert: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>'),
    };

    function h(tag, { icon, ...props } = {}, ...children) {
        const el = document.createElement(tag);
        for (const [key, value] of Object.entries(props)) {
            if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
            else el.setAttribute(key, value);
        }
        if (icon) el.innerHTML = icon;
        el.append(...children);
        return el;
    }

    const iconButton = (icon, label, onclick, cls = '') =>
        h('button', { type: 'button', class: `icon ${cls}`, title: label, 'aria-label': label, icon, onclick });

    const switchButton = (label, on, onclick) =>
        h('button', { type: 'button', role: 'switch', class: 'switch', 'aria-checked': String(on), 'aria-label': label, onclick });

    // 메뉴의 아이콘을 복사한다. 아이콘이 없는 메뉴는 이름의 첫 글자를 쓴다.
    function itemIcon(item) {
        const box = h('span', { class: 'glyph', 'aria-hidden': 'true' });
        if (!item.graphic) {
            if (!item.emoji && item.label === GALLERY) box.innerHTML = ICON.image;
            else box.textContent = item.emoji || [...item.label][0];
            return box;
        }
        const copy = item.graphic.cloneNode(true);
        copy.removeAttribute('class');
        if (copy.localName === 'svg') {
            const computed = getComputedStyle(item.graphic);
            for (const prop of ['fill', 'stroke']) copy.style[prop] = computed[prop] === 'none' ? 'none' : 'currentColor';
        }
        box.append(copy);
        return box;
    }

    // 화면에 보이는 내용이 바뀌었는지 비교하는 값
    const signature = list => list.map(i => [i.label, !!i.control, i.order, i.on, i.emoji, i.graphic?.outerHTML]);

    const allItems = () => [...items, ...tools];
    const find = label => allItems().find(item => item.label === label);
    const run = label => find(label)?.control?.click();
    const hint = item => item.control ? item.label : `${item.label} (현재 메뉴에 없음)`;

    const BASE_CSS = `
        :host { color: var(--text_primary, #888); }
        * { box-sizing: border-box; }
        button { font: inherit; color: inherit; margin: 0; padding: 0; border: 0; background: none; cursor: pointer; }
        button:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
        .glyph { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 18px; height: 18px; font-size: 14px; line-height: 1; }
        .glyph > svg, .glyph > img { width: 18px; height: 18px; }
    `;

    // 버튼 그룹은 React가 관리하므로 옮기지 않고 CSS로만 위치를 바꾼다.
    const style = document.createElement('style');
    style.textContent = `
        div.rounded-lg.border:has([data-cqs="input"]) { position: relative !important; padding-top: 34px !important; }
        [data-cqs] {
            display: flex !important; align-items: center !important; gap: 2px !important;
        }
        [data-cqs-scroll] {
            overflow: auto hidden !important; overscroll-behavior-x: contain;
            scrollbar-width: none !important; touch-action: pan-x;
        }
        [data-cqs-scroll]::-webkit-scrollbar { display: none !important; }
        [data-cqs] > * { flex-shrink: 0 !important; }
        /* 크랙 버튼은 테두리 없이 퀵슬롯과 같은 크기로, 다른 확장 버튼은 모양을 유지한 채 크기만 맞춘다 */
        [data-cqs] > button.rounded-full.border {
            width: 26px !important; min-width: 26px !important; height: 26px !important; padding: 0 !important;
            border-color: transparent !important; background: none !important; color: var(--text_secondary) !important;
        }
        [data-cqs] > button.rounded-full.border:hover { background: var(--outline_tertiary) !important; color: var(--text_primary) !important; }
        [data-cqs] > :not(#crack-quick-slot, button.rounded-full.border) { zoom: .86; }
        [data-cqs="input"] { position: absolute !important; inset: 2px 0 auto 0; height: 38px; padding: 0 8px; }
        [data-cqs="float"] {
            position: fixed !important; left: var(--cqs-x, 8px); top: var(--cqs-y, 8px); z-index: 50;
            width: max-content; max-width: min(100vw, var(--cqs-w, 100vw)); height: 36px; background: none;
            padding: 0;
        }
        /* 왼쪽 그룹이 떠나도 오른쪽 그룹은 오른쪽에 남긴다 */
        div.justify-between:has(> [data-cqs]) > div:last-child { margin-left: auto; }
    `;

    // 숨긴 크랙 버튼. 다시 그려져도 유지되도록 요소가 아니라 이름으로 지정한다.
    const toolStyle = document.createElement('style');

    // ───────────────────────── 퀵슬롯바 ─────────────────────────
    const bar = document.createElement('div');
    bar.id = 'crack-quick-slot';
    const barRoot = bar.attachShadow({ mode: 'open' });
    const slots = h('div', { class: 'slots' });
    const settingsButton = iconButton(ICON.quick, '퀵슬롯바 설정', onSettingsClick, 'main');
    barRoot.append(h('style', {}, `${BASE_CSS}
        :host, .slots { display: flex; align-items: center; gap: 2px; }
        .slots:empty { display: none; }
        .icon {
            display: inline-flex; align-items: center; justify-content: center; flex: none;
            width: 26px; height: 26px; border-radius: 6px; color: var(--text_secondary, #888);
        }
        .icon:hover { background: var(--outline_tertiary, rgba(128, 128, 128, .2)); color: var(--text_primary, #888); }
        .icon.off { opacity: .4; }
        .icon:disabled { cursor: default; background: none; color: var(--text_secondary, #888); }
        .icon.main { color: var(--text_primary, #888); }
        .icon.main.float { touch-action: none; cursor: grab; }
        .line { flex: none; width: 1px; height: 16px; margin: 0 4px; background: var(--text_disabled, rgba(128, 128, 128, .4)); }
    `), settingsButton, slots, h('span', { class: 'line' }));

    // scrollWidth는 버튼 밖으로 삐져나온 장식까지 포함하므로, 버튼의 위치로 너비를 구한다.
    function contentWidth() {
        const left = group.getBoundingClientRect().left - group.scrollLeft;
        const right = Math.max(...[...group.children].map(child => child.getBoundingClientRect().right));
        return right - left + parseFloat(getComputedStyle(group).paddingRight);
    }

    const sizeObserver = new ResizeObserver(() => {
        if (group) group.toggleAttribute('data-cqs-scroll', contentWidth() > group.clientWidth + 1);
    });

    function watchSize() {
        sizeObserver.disconnect();
        if (group) [group, ...group.children].forEach(el => sizeObserver.observe(el));
    }

    function mountBar() {
        group?.removeAttribute('data-cqs');
        group?.removeAttribute('data-cqs-scroll');
        // 메시지 수정창도 같은 모양일 수 있다. 채팅 입력창은 문서에서 가장 마지막에 있다.
        group = [...document.querySelectorAll(GROUP)].at(-1) ?? null;
        toolsObserver.disconnect();
        toolsDirty = true;
        if (group) {
            group.prepend(bar);
            toolsObserver.observe(group, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label'] });
        } else {
            bar.remove();
            closePop();
        }
    }

    let barKey = '';
    function render() {
        const data = load(), off = new Set(data.off);
        // 메뉴가 다시 그려져도 보이는 내용이 같으면 버튼을 유지한다. 누르면 그때의 최신 항목을 찾는다.
        const shown = items.filter(item => !off.has(item.label));
        const key = JSON.stringify(signature(shown));
        if (key !== barKey) {
            barKey = key;
            slots.replaceChildren(...shown.map(item => {
                const button = h('button', {
                    type: 'button', class: `icon${item.on === false || !item.control ? ' off' : ''}`,
                    title: hint(item), 'aria-label': hint(item), onclick: () => run(item.label),
                }, itemIcon(item));
                button.disabled = !item.control;
                if (item.on !== null) button.setAttribute('aria-pressed', String(item.on));
                return button;
            }));
        }
        const hiddenTools = tools.filter(tool => off.has(tool.label)).flatMap(({ label }) => [label, `${label} 열기`, `${label} 닫기`])
            .map(label => `[data-cqs] > button[aria-label="${CSS.escape(label)}"]`);
        const css = hiddenTools.length ? `${hiddenTools.join(', ')} { display: none !important; }` : '';
        if (toolStyle.textContent !== css) toolStyle.textContent = css;
        settingsButton.classList.toggle('float', !!data.float);
        if (group) {
            group.setAttribute('data-cqs', data.float ? 'float' : 'input');
            if (data.float) {
                setFloatWidth(data.float.width);
                placeFloat(data.float);
            }
        }
        renderPop();
    }

    // ───────────────────────── 플로팅 이동 ─────────────────────────
    let drag = null, dragged = false;

    function moveTo(x, y) {
        const rect = group.getBoundingClientRect();
        const pos = {
            x: Math.round(Math.max(0, Math.min(x, innerWidth - rect.width))),
            y: Math.round(Math.max(0, Math.min(y, innerHeight - rect.height))),
        };
        document.documentElement.style.setProperty('--cqs-x', `${pos.x}px`);
        document.documentElement.style.setProperty('--cqs-y', `${pos.y}px`);
        return pos;
    }

    function setFloatWidth(width) {
        const root = document.documentElement.style;
        if (width) root.setProperty('--cqs-w', `${width}px`);
        else root.removeProperty('--cqs-w');
    }

    // 옮긴 적이 없으면 입력창 바로 위에 둔다.
    function placeFloat({ x, y }) {
        if (drag) return;
        const box = group.closest('div.rounded-lg.border').getBoundingClientRect();
        moveTo(x ?? box.left, y ?? box.top - 36);
    }

    settingsButton.addEventListener('pointerdown', e => {
        dragged = false;
        if (e.button !== 0 || !load().float) return;
        const rect = group.getBoundingClientRect();
        drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - rect.left, oy: e.clientY - rect.top, pos: null };
        settingsButton.setPointerCapture(e.pointerId);
    });
    settingsButton.addEventListener('pointermove', e => {
        if (drag?.id !== e.pointerId) return;
        if (!drag.pos && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
        closePop();
        dragged = true;
        drag.pos = moveTo(e.clientX - drag.ox, e.clientY - drag.oy);
    });
    const endDrag = e => {
        if (drag?.id !== e.pointerId) return;
        const { pos } = drag;
        drag = null;
        if (pos) save(data => { Object.assign(data.float, pos); });
    };
    settingsButton.addEventListener('pointerup', endDrag);
    settingsButton.addEventListener('pointercancel', endDrag);

    function onSettingsClick() {
        if (dragged) dragged = false;
        else if (popView) closePop();
        else openPop('list');
    }

    // ───────────────────────── 팝오버 ─────────────────────────
    const pop = document.createElement('div');
    pop.id = 'crack-quick-slot-popover';
    const popRoot = pop.attachShadow({ mode: 'open' });
    const card = h('div', { class: 'card', role: 'dialog', 'aria-label': '퀵슬롯바' });
    popRoot.append(h('style', {}, `${BASE_CSS}
        :host { position: fixed; z-index: 2147483000; width: 280px; max-width: calc(100vw - 16px); }
        .card {
            display: flex; flex-direction: column; max-height: inherit; overflow: hidden;
            border: 1px solid var(--text_disabled, #888); border-radius: 12px;
            background: var(--bg_elevated_primary, #222); box-shadow: 0 8px 28px rgba(0, 0, 0, .35);
            font-size: 14px; line-height: 1.3;
        }
        header { display: flex; align-items: center; gap: 2px; flex: none; min-height: 44px; padding: 4px 6px; }
        header .title { flex: 1; min-width: 0; padding: 0 8px; font-weight: 600; }
        .icon {
            display: inline-flex; align-items: center; justify-content: center; flex: none;
            width: 36px; height: 36px; border-radius: 8px; color: var(--text_secondary, #888);
        }
        .icon:hover, .row.link:hover { background: var(--outline_tertiary, rgba(128, 128, 128, .2)); }
        .icon.alert { color: #f04438; }
        .body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0 6px 6px; }
        .row { display: flex; align-items: center; min-height: 34px; border-radius: 8px; padding-right: 8px; }
        .name { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; min-height: 34px; padding: 0 8px; text-align: left; }
        .name > :last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .name:disabled { opacity: .4; cursor: default; }
        .name .glyph { color: var(--text_secondary, #888); }
        .divider { height: 1px; margin: 4px 8px; background: var(--text_disabled, rgba(128, 128, 128, .4)); }
        .sub { padding: 10px 8px 6px; font-size: 12px; color: var(--text_tertiary, #888); }
        .switch { position: relative; flex: none; width: 34px; height: 20px; border-radius: 10px; background: var(--text_disabled, #888); }
        .switch::after {
            content: ''; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px;
            border-radius: 50%; background: #fff; transition: transform .15s;
        }
        .switch[aria-checked="true"] { background: #12b76a; }
        .switch[aria-checked="true"]::after { transform: translateX(14px); }
        .choices { display: flex; gap: 6px; padding: 0 8px 4px; }
        .choices button { flex: 1; height: 36px; border: 1px solid var(--text_disabled, #888); border-radius: 8px; color: var(--text_secondary, #888); }
        .choices button[aria-checked="true"] { border-color: var(--text_primary, #888); color: var(--text_primary, #888); font-weight: 600; }
        .width { padding: 0 8px 4px; }
        .width[aria-disabled="true"] { opacity: .4; }
        .width label { display: flex; justify-content: space-between; padding: 6px 0 4px; font-size: 12px; color: var(--text_tertiary, #888); }
        .width input { display: block; width: 100%; margin: 0; accent-color: #12b76a; cursor: pointer; }
        .width input:disabled { cursor: default; }
        .delete { flex: none; height: 30px; padding: 0 10px; border: 1px solid var(--text_disabled, #888); border-radius: 8px; font-size: 12px; }
    `), card);

    let popView = '', popKey = '', renderedView = '';

    function openPop(view) {
        popView = view;
        if (!pop.isConnected) document.body.append(pop);
        renderPop();
    }

    function closePop() {
        popView = popKey = renderedView = '';
        pop.remove();
    }

    // 바깥을 누르면 닫는다. 설정 버튼은 자신의 클릭으로 여닫는다.
    document.addEventListener('pointerdown', e => {
        if (!popView) return;
        const path = e.composedPath();
        if (!path.includes(pop) && !path.includes(settingsButton)) closePop();
    }, true);

    function placePop() {
        const rect = settingsButton.getBoundingClientRect();
        const above = rect.top - 16, below = innerHeight - rect.bottom - 16;
        const up = above >= below;
        pop.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - pop.offsetWidth - 8))}px`;
        pop.style.top = up ? 'auto' : `${rect.bottom + 8}px`;
        pop.style.bottom = up ? `${innerHeight - rect.top + 8}px` : 'auto';
        pop.style.maxHeight = `${Math.min(560, up ? above : below)}px`;
    }

    function renderPop() {
        if (!popView) return;
        const data = load(), off = new Set(data.off);
        // 메뉴를 다 읽은 뒤에만 찾지 못했다고 판단한다.
        const missing = settled && items.some(item => item.control) ? [...off].filter(label => !find(label)) : [];
        if (popView === 'missing' && !missing.length) popView = 'list';

        const key = JSON.stringify([popView, data, missing, signature(allItems())]);
        if (key !== popKey) {
            popKey = key;
            const scroll = renderedView === popView ? card.querySelector('.body').scrollTop : 0;
            renderedView = popView;
            const body = h('div', { class: 'body' });
            const header = h('header');
            VIEWS[popView]({ header, body, data, off, missing });
            header.append(iconButton(ICON.close, '닫기', closePop));
            card.replaceChildren(header, body);
            placePop();
            body.scrollTop = scroll;
        } else {
            placePop();
        }
    }

    const title = label => h('span', { class: 'title' }, label);
    const backTitle = label => [iconButton(ICON.back, '뒤로가기', () => openPop('list')), title(label)];
    const nameOf = item => [itemIcon(item), h('span', { title: hint(item) }, item.label)];

    // 플로팅 너비. 오른쪽 끝이 기본값(내용에 맞춤)이며, 움직이는 동안은 화면에만 반영하고 놓을 때 저장한다.
    function widthSlider(float) {
        const max = float ? Math.min(Math.ceil(contentWidth()), innerWidth) : 100;
        const min = Math.min(80, max);
        const value = float?.width ? Math.min(float.width, max) : max;
        const input = h('input', { type: 'range', id: 'width', min, max, value });
        const output = h('span');
        const chosen = () => Number(input.value) < max ? Number(input.value) : undefined;
        const showValue = () => { output.textContent = chosen() ? `${chosen()}px` : '자동'; };
        input.disabled = !float;
        input.addEventListener('input', () => {
            showValue();
            setFloatWidth(chosen());
            placeFloat(load().float);
        });
        input.addEventListener('change', () => save(d => {
            if (chosen()) d.float.width = chosen();
            else delete d.float.width;
        }));
        showValue();
        return h('div', { class: 'width', 'aria-disabled': String(!float) },
            h('label', { for: 'width' }, h('span', {}, '플로팅 너비'), output), input);
    }

    // 구역이 바뀌는 자리에 구분선을 넣는다.
    const rowsOf = makeRow => allItems().flatMap((item, i, all) =>
        i && item.order !== all[i - 1].order ? [h('div', { class: 'divider' }), makeRow(item)] : [makeRow(item)]);

    const VIEWS = {
        list({ header, body, missing }) {
            header.append(title('퀵메뉴'));
            if (missing.length) header.append(iconButton(ICON.alert, '찾지 못한 메뉴', () => openPop('missing'), 'alert'));
            header.append(iconButton(ICON.gear, '설정', () => openPop('settings')));
            body.append(...rowsOf(item => {
                const open = h('button', {
                    type: 'button', class: 'name', onclick: () => { closePop(); run(item.label); },
                }, ...nameOf(item));
                open.disabled = !item.control;
                const row = h('div', { class: item.control ? 'row link' : 'row' }, open);
                if (item.on !== null) row.append(switchButton(item.label, item.on, () => find(item.label)?.toggle?.click()));
                return row;
            }));
        },
        settings({ header, body, data, off }) {
            header.append(...backTitle('설정'));
            const choice = (label, float) => h('button', {
                type: 'button', role: 'radio', 'aria-checked': String(!!data.float === float),
                onclick: () => save(d => {
                    if (float) d.float ??= { x: null, y: null };
                    else delete d.float;
                }),
            }, label);
            body.append(
                h('div', { class: 'sub' }, '위치'),
                h('div', { class: 'choices', role: 'radiogroup', 'aria-label': '위치' }, choice('입력창', false), choice('플로팅', true)),
                widthSlider(data.float),
                h('div', { class: 'sub' }, '퀵슬롯바에 표시'),
                ...rowsOf(item => h('div', { class: 'row' },
                    h('div', { class: 'name' }, ...nameOf(item)),
                    switchButton(item.label, !off.has(item.label), () => setOff(item.label, !off.has(item.label))))),
            );
        },
        missing({ header, body, missing }) {
            header.append(...backTitle('찾지 못한 메뉴'));
            body.append(h('div', { class: 'sub' }, '퀵슬롯바에서 숨긴 메뉴 중 현재 찾을 수 없는 메뉴입니다. 숨김을 해제하면 메뉴가 다시 나타났을 때 퀵슬롯바에 표시됩니다.'), ...missing.map(label => h('div', { class: 'row' },
                h('div', { class: 'name' }, h('span', { title: label }, label)),
                h('button', { type: 'button', class: 'delete', onclick: () => setOff(label, false) }, '숨김 해제'))));
        },
    };

    // ───────────────────────── 시작 ─────────────────────────
    migrate();
    document.head.append(style, toolStyle);
    // 채팅이 출력되는 동안에는 연결 상태만 확인한다. 메뉴 내용은 panelObserver가 따로 감지한다.
    new MutationObserver(() => {
        if (!panel?.isConnected || !barMounted()) schedule();
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', () => {
        const { float } = load();
        if (group && float) placeFloat(float);
        if (popView) placePop();
    });
    sync();
})();
