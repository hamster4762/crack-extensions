// ==UserScript==
// @name         크랙 입력창 버튼 플로팅바
// @namespace    https://crack.wrtn.ai/
// @version      1.0.0
// @description  입력창 왼쪽 아래 버튼 그룹을 접고 펼 수 있는 플로팅바로 바꿉니다. (version 관리방식: 크랙UI변경.기능추가및수정.버그수정)
// @match        https://crack.wrtn.ai/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 입력창 왼쪽 아래 버튼 그룹. 안에 무엇이 있든(다른 확장 버튼 포함) 그룹 단위로만 다룬다.
    const GROUP = 'div.rounded-lg.border:has(.ProseMirror) > div > div.justify-between > div:first-child';
    const ROOT = document.documentElement;

    // DOM은 건드리지 않고 CSS로만 모양을 바꾼다. 그룹이 다시 그려져도 자동 적용된다.
    // cfb-open: 펼침 / cfb-moved: 원래 자리에서 끌어 옮겨 화면에 떠 있음
    const style = document.createElement('style');
    style.textContent = `
        ${GROUP} {
            gap: 4px !important;
            touch-action: none;
        }
        ${GROUP} > * { zoom: .88; }
        ${GROUP}::before {
            content: '⋯';
            display: flex; align-items: center; justify-content: center;
            width: 24px; height: 24px;
            border-radius: 9999px;
            font-size: 16px; line-height: 1;
            cursor: grab;
            opacity: .75;
        }
        ${GROUP}:hover::before { opacity: 1; }
        html:not(.cfb-open) ${GROUP} > * { display: none !important; }
        html.cfb-moved ${GROUP} {
            position: fixed !important;
            left: var(--cfb-x); top: var(--cfb-y);
            z-index: 2147483000;
            padding: 3px;
            border-radius: 9999px;
            border: 1px solid var(--cfb-border);
            background: var(--cfb-bg);
            box-shadow: 0 4px 14px rgba(0, 0, 0, .35);
        }
        /* 그룹이 떠나도 오른쪽 그룹은 오른쪽에 남게 한다 */
        div.rounded-lg.border:has(.ProseMirror) > div > div.justify-between > div:last-child { margin-left: auto; }
    `;
    ROOT.appendChild(style);

    let drag = null;

    // 펼침 버튼(::before)과 그룹의 빈 영역은 이벤트 대상이 그룹 자신이다. 안의 버튼 클릭은 건드리지 않는다.
    document.addEventListener('pointerdown', (e) => {
        const group = e.target;
        if (e.button !== 0 || !(group instanceof Element) || !group.matches(GROUP)) return;
        const rect = group.getBoundingClientRect();
        drag = { group, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - rect.left, oy: e.clientY - rect.top, moved: false };
        group.setPointerCapture(e.pointerId);
        e.preventDefault();
    });

    document.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moved) {
            if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
            drag.moved = true;
            // 떠 있는 동안 입력창과 같은 색을 쓰도록 현재 테마 색을 가져온다.
            const box = drag.group.closest('div.rounded-lg.border');
            const cs = getComputedStyle(box);
            ROOT.style.setProperty('--cfb-bg', cs.backgroundColor);
            ROOT.style.setProperty('--cfb-border', cs.borderTopColor);
            ROOT.classList.add('cfb-moved');
        }
        const w = drag.group.offsetWidth, h = drag.group.offsetHeight;
        const x = Math.min(Math.max(0, e.clientX - drag.ox), innerWidth - w);
        const y = Math.min(Math.max(0, e.clientY - drag.oy), innerHeight - h);
        ROOT.style.setProperty('--cfb-x', `${x}px`);
        ROOT.style.setProperty('--cfb-y', `${y}px`);
    });

    const end = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moved && e.type === 'pointerup') ROOT.classList.toggle('cfb-open');
        drag = null;
    };
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
})();
