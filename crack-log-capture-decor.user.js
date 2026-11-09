// ==UserScript==
// @name         크랙 로그 캡처&꾸미기
// @namespace    https://crack.wrtn.ai/
// @icon         data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%2218%22%20height%3D%2215%22%20rx%3D%223%22%2F%3E%3Cpath%20d%3D%22m8%205%201-3h6l1%203%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212.5%22%20r%3D%224%22%2F%3E%3C%2Fsvg%3E
// @version      1.1.3
// @description  채팅의 화면 서식을 유지하여 편집하고 이미지로 저장합니다. (version 관리방식: 크랙UI변경.기능추가및수정.버그수정)
// @match        https://crack.wrtn.ai/*
// @run-at       document-idle
// @grant        window.onurlchange
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      self
// @connect      crack-api.wrtn.ai
// @connect      fonts.googleapis.com
// @connect      fonts.gstatic.com
// @connect      fe-web-assets.static.wrtn.ai
// @connect      build-assets.static.wrtn.ai
// @connect      wrtn-image-ai-character.static.wrtn.ai
// @connect      cdn.jsdelivr.net
// @connect      raw.githubusercontent.com
// @connect      *
// @updateURL    https://github.com/hamster4762/crack-extensions/raw/refs/heads/main/crack-log-capture-decor.user.js
// @downloadURL  https://github.com/hamster4762/crack-extensions/raw/refs/heads/main/crack-log-capture-decor.user.js
// ==/UserScript==

(() => {
    'use strict';

    const BUBBLE = '.wrtn-markdown';
    const FONT_KEY = 'rokku_user_fonts_v1';
    const STICKER_KEY = 'rokku_user_stickers_v1';
    const THEME_KEY = 'rokku_user_themes_v1';
    const THEME_KEYS = ['showUser', 'showCode', 'showImages', 'showDividers', 'showRoles', 'user', 'character', 'divider', 'paper', 'pattern', 'patternColor', 'patternOpacity', 'photo', 'font', 'narrationColor', 'dialogueColor', 'fontSize', 'letterSpacing', 'lineHeight', 'paragraphSpacing', 'padding'];
    const GM_RESOURCE_HOSTS = new Set(['crack-api.wrtn.ai', 'fonts.googleapis.com', 'fonts.gstatic.com', 'fe-web-assets.static.wrtn.ai', 'build-assets.static.wrtn.ai', 'wrtn-image-ai-character.static.wrtn.ai', 'cdn.jsdelivr.net', 'raw.githubusercontent.com']);
    const MAX_HISTORY = 20;
    const ICONS = {
        capture: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="m8 5 1-3h6l1 3"/><circle cx="12" cy="12.5" r="4"/>',
        close: '<path d="m6 6 12 12M18 6 6 18"/>',
        undo: '<path d="m8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12"/>',
        redo: '<path d="m16 4 5 5-5 5M21 9H10a6 6 0 0 0 0 12"/>',
        theme: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        source: '<path d="M4 3h16v14H9l-5 4zM8 7h8M8 11h6"/>',
        paper: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
        font: '<path d="m3 19 6-14 6 14M5 15h8M17 12h4M19 10v9"/>',
        title: '<path d="M4 3v9M11 3v9M4 7.5h7M16 4h5M16 9h4M4 17h17M4 21h13"/>',
        sticker: '<path d="M14 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8zM14 21v-5a2 2 0 0 1 2-2h5"/><path d="M8 8h.01M15 8h.01M8 11q3.5 4 7 0"/>',
        text: '<rect x="3" y="4" width="18" height="16" rx="2" stroke-dasharray="2 3"/><path d="M8 8h8M12 8v8M9 16h6"/>',
        download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        minus: '<path d="M5 12h14"/>',
        reset: '<path d="M3 4v6h6M3 10a9 9 0 1 1 1 7"/>',
        image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m21 15-6-6L3 21"/>',
        highlight: '<path d="m14 3 7 7-9 9H5v-7zM12 5l7 7M5 19l-2 2h7"/>',
        underline: '<path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16"/>',
        mask: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M3 14h18M8 5v14M16 5v14"/>',
        replace: '<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/>',
        eraser: '<path d="m15 3 6 6-10 11H6l-4-4zM8 10l7 7M11 20h11"/>',
        trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
        front: '<path d="M8 8V3h13v13h-5M3 8h13v13H3z"/>',
        back: '<path d="M8 8V3h13v13h-5M3 8h13v13H3zM8 8h8v8H8z"/>',
    };
    const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
    const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n)));
    const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
    const svgData = markup => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    const svg = (body, width = 100, height = width) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;

    const FONTS = {
        source: { label: '원문 유지', group: '본문', family: '"Noto Serif KR", "AppleMyungjo", "Batang", serif' },
        serif: { label: '본명조', group: '본문', web: 'Noto Serif KR', family: '"Noto Serif KR", "AppleMyungjo", "Batang", serif' },
        sans: { label: '본고딕', group: '본문', web: 'Noto Sans KR', family: '"Noto Sans KR", sans-serif' },
        batang: { label: '고운바탕', group: '본문', web: 'Gowun Batang', family: '"Gowun Batang", serif' },
        story: { label: '푸어스토리', group: '손글씨', web: 'Poor Story', family: '"Poor Story", cursive' },
    };
    // The bundled choices use Google Fonts' SIL OFL families. Fonts are loaded only when used.
    const NARRATION_COLOR = '#a3a3a8', DIALOGUE_COLOR = '#f4f2ed';
    const TEXT_COLORS = [DIALOGUE_COLOR, '#d4d4d8', NARRATION_COLOR, '#7b7b83', '#55555d', '#34363b', '#17191c'];
    const PATTERNS = { plain: '무지', ruled: '줄노트', fineRuled: '좁은 줄', vertical: '세로줄', grid: '모눈', fineGrid: '작은 모눈', dots: '도트', gingham: '깅엄 체크', check: '체커보드', diagonal: '사선', stripe: '스트라이프', diamond: '다이아몬드', cross: '십자', grain: '종이 질감' };
    let customFonts = [];
    try {
        const value = GM_getValue(FONT_KEY, []);
        if (Array.isArray(value)) customFonts = value.filter(item => item && /^u_[a-z0-9]+$/.test(item.id) && typeof item.name === 'string' && typeof item.source === 'string');
    } catch { /* A missing font library does not prevent capture. */ }
    let customStickers = [];
    try {
        const value = GM_getValue(STICKER_KEY, []);
        if (Array.isArray(value)) customStickers = value.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && /^data:image\/png;base64,/.test(item.data));
    } catch { /* A missing sticker library does not prevent capture. */ }
    function installFont(item) {
        FONTS[item.id] = { label: item.name, group: '추가한 글꼴', family: `"Rokku_${item.id}", sans-serif`, custom: item };
    }
    customFonts.forEach(installFont);

    let customThemes = [];
    try {
        const value = GM_getValue(THEME_KEY, []);
        if (Array.isArray(value)) customThemes = value.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && item.settings && THEME_KEYS.every(key => Object.hasOwn(item.settings, key)));
    } catch { /* A missing theme library does not prevent capture. */ }

    const resourceCache = new Map();
    async function requestResource(url, responseType = 'blob', useGM = false) {
        const parsed = new URL(url, location.href);
        if (!['http:', 'https:', 'data:', 'blob:'].includes(parsed.protocol)) throw new Error('지원하지 않는 리소스 주소입니다.');
        const gm = /^https?:$/.test(parsed.protocol) && (useGM || parsed.hostname === location.hostname || GM_RESOURCE_HOSTS.has(parsed.hostname));
        const key = `${gm ? 'gm' : 'fetch'}:${responseType}:${parsed.href}`;
        if (!resourceCache.has(key)) {
            const promise = !gm
                ? fetch(parsed.href, { credentials: 'omit' }).catch(error => { throw new Error(`파일을 가져오지 못했습니다 (${error.message}; 오류 코드 확인 불가) · ${parsed.href}`); }).then(response => {
                    if (!response.ok) throw new Error(`파일 요청 실패 (HTTP ${response.status}) · ${parsed.href}`);
                    return responseType === 'text' ? response.text() : response.blob();
                })
                : new Promise((resolve, reject) => GM_xmlhttpRequest({
                    method: 'GET', url: parsed.href, responseType, timeout: 20000,
                    onload: response => response.status >= 200 && response.status < 300
                        ? resolve(responseType === 'text' ? response.responseText : response.response)
                        : reject(new Error(`파일 요청 실패 (HTTP ${response.status}) · ${parsed.href}`)),
                    onerror: response => reject(new Error(`파일 연결 실패 (${response.status || '오류 코드 확인 불가'}${response.error ? `: ${response.error}` : ''}) · ${parsed.href}`)),
                    ontimeout: () => reject(new Error(`파일 응답 시간 초과 (20초) · ${parsed.href}`)),
                }));
            resourceCache.set(key, promise.catch(error => { resourceCache.delete(key); throw error; }));
        }
        return resourceCache.get(key);
    }
    const blobData = blob => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('리소스를 읽지 못했습니다.')); reader.readAsDataURL(blob);
    });
    async function dataResource(url, useGM = false) {
        if (url.startsWith('data:')) return url;
        const blob = await requestResource(url, 'blob', useGM);
        if (!blob?.size) throw new Error('빈 리소스가 반환되었습니다.');
        return blobData(blob);
    }
    async function imageDataResource(url) {
        try { return await dataResource(url, true); }
        catch (directError) {
            const source = new URL(url, location.href);
            if (!/^https?:$/.test(source.protocol) || /\.svg$/i.test(source.pathname) || source.hostname === 'wsrv.nl') throw directError;
            const key = `image-proxy:${source.href}`;
            if (!resourceCache.has(key)) {
                const pending = (async () => {
                    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000);
                    try {
                        const response = await fetch(`https://wsrv.nl/?url=${encodeURIComponent(source.href)}&output=png`, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal });
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const blob = await response.blob();
                        if (!blob.size || !blob.type.startsWith('image/')) throw new Error('이미지 데이터가 아닌 응답');
                        return await blobData(blob);
                    } catch (error) { throw new Error(`${directError.message} / 이미지 프록시 요청이 실패했습니다 (${error.name === 'AbortError' ? '20초 시간 초과' : error.message})`); }
                    finally { clearTimeout(timer); }
                })();
                resourceCache.set(key, pending.catch(error => { resourceCache.delete(key); throw error; }));
            }
            return resourceCache.get(key);
        }
    }
    async function replaceURLs(value, base, useGM = false, imageProxy = false) {
        const matches = [...value.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)];
        let result = value;
        for (const match of matches) {
            if (!match[2] || match[2].startsWith('#')) continue;
            const url = new URL(match[2], base).href;
            const data = await (imageProxy ? imageDataResource(url) : dataResource(url, useGM));
            result = result.replace(match[0], `url("${data}")`);
        }
        return result;
    }

    const STYLE_PROPERTIES = ('display visibility position box-sizing margin-top margin-right margin-bottom margin-left padding-top padding-right padding-bottom padding-left min-height max-height color background-color background-image background-size background-position background-repeat background-origin background-clip border-top border-right border-bottom border-left border-radius box-shadow opacity filter transform transform-origin text-align text-decoration text-transform white-space word-break overflow-wrap overflow-x overflow-y vertical-align flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items align-self justify-content gap column-gap row-gap grid-template-columns grid-template-rows grid-column grid-row list-style-type list-style-position list-style-image top right bottom left z-index float clear object-fit object-position clip-path fill fill-opacity fill-rule stroke stroke-width stroke-opacity stroke-dasharray stroke-linecap stroke-linejoin text-anchor dominant-baseline paint-order text-shadow font-feature-settings font-kerning font-variant text-indent text-underline-offset text-decoration-thickness isolation mix-blend-mode backdrop-filter mask-image mask-size mask-position mask-repeat content').split(' ');
    function svgID(id, source, context) {
        if (!context.svgIDs) { context.svgIDs = new WeakMap(); context.svgIDCount = 0; }
        const root = source.getRootNode();
        if (!context.svgIDs.has(root)) context.svgIDs.set(root, new Map());
        const ids = context.svgIDs.get(root);
        if (!ids.has(id)) ids.set(id, `rk-svg-${++context.svgIDCount}`);
        return ids.get(id);
    }
    function svgReferences(value, source, context) {
        return value.replace(/url\(\s*(['"]?)[^#)]*#([^)'"\s]+)\1\s*\)/g, (match, quote, id) => source.getRootNode().getElementById?.(id) ? `url("#${svgID(id, source, context)}")` : match);
    }
    function compatibleColors(value, context) {
        if (!/(?:oklab|oklch|lab|lch|color|color-mix)\(/i.test(value)) return value;
        if (!context.colors) { context.colors = new Map(); const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1; context.colorContext = canvas.getContext('2d'); }
        let result = value, offset = 0;
        while (offset < result.length) {
            const match = /(?:oklab|oklch|lab|lch|color|color-mix)\(/i.exec(result.slice(offset));
            if (!match) break;
            const start = offset + match.index; let end = start + match[0].length, depth = 1;
            while (end < result.length && depth) { if (result[end] === '(') depth++; if (result[end] === ')') depth--; end++; }
            const color = result.slice(start, end);
            if (!context.colors.has(color)) {
                const ctx = context.colorContext; ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
                const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; context.colors.set(color, `rgba(${r},${g},${b},${a / 255})`);
            }
            const replacement = context.colors.get(color); result = result.slice(0, start) + replacement + result.slice(end); offset = start + replacement.length;
        }
        return result;
    }
    function copyStyle(source, target, styles, context, pseudo = false) {
        for (const name of STYLE_PROPERTIES) {
            if (name === 'content') continue;
            const value = styles.getPropertyValue(name);
            if (value) target.style.setProperty(name, svgReferences(compatibleColors(value, context), source, context));
        }
        const decorated = source.getRootNode() instanceof ShadowRoot || !!source.shadowRoot;
        if (styles.backgroundColor !== 'transparent' && !/rgba\([^)]*,\s*0\s*\)/.test(styles.backgroundColor)) target.style.backgroundColor = `var(--paper-color, ${compatibleColors(styles.backgroundColor, context)})`;
        const family = styles.fontFamily;
        family.split(',').forEach(part => context.families.add(part.trim().replace(/^['"]|['"]$/g, '').toLowerCase()));
        target.style.fontFamily = `var(--log-font, ${family})`;
        const headingScale = { H1: 2, H2: 1.5, H3: 1.25, H4: 1.125, H5: 1, H6: .875 }[source.tagName] || 1;
        target.style.fontSize = `calc(var(--log-size, 16px) * ${decorated ? (parseFloat(styles.fontSize) || 16) / 16 : headingScale})`;
        target.style.fontWeight = styles.fontWeight;
        target.style.fontStyle = styles.fontStyle;
        target.style.lineHeight = decorated ? `var(--decor-line-height, ${styles.lineHeight})` : 'var(--log-line-height, 1.5)';
        target.style.letterSpacing = decorated ? `var(--decor-letter-spacing, ${styles.letterSpacing})` : 'var(--log-letter-spacing, -.01em)';
        target.style.transition = 'none'; target.style.animation = 'none';
        const vector = source.namespaceURI === 'http://www.w3.org/2000/svg';
        const graphic = pseudo || vector || ['absolute', 'fixed'].includes(styles.position);
        if (graphic) {
            target.style.width = styles.width; target.style.height = styles.height;
            if (pseudo || vector) { target.style.fontSize = styles.fontSize; target.style.lineHeight = styles.lineHeight; target.style.letterSpacing = styles.letterSpacing; }
            if (vector && source.localName === 'svg' && !source.ownerSVGElement) {
                const width = source.getAttribute('width'), height = source.getAttribute('height');
                const fixed = /^\d+(?:\.\d+)?(?:px|em|rem)?$/.test(width || '');
                const small = parseFloat(styles.width) <= 64 && parseFloat(styles.height) <= 64;
                target.style.width = fixed ? (/^\d+(?:\.\d+)?$/.test(width) ? `${width}px` : width) : small ? styles.width : '100%';
                target.style.height = fixed && height && !/%|vh|vw/.test(height) ? (/^\d+(?:\.\d+)?$/.test(height) ? `${height}px` : height) : small ? styles.height : 'auto';
                target.style.maxWidth = '100%';
            }
        } else {
            Object.assign(target.style, { width: decorated && ['flex', 'inline-flex', 'grid', 'inline-grid'].includes(styles.display) ? '100%' : 'auto', maxWidth: '100%', minWidth: '0', height: 'auto', minHeight: '0', maxHeight: 'none', flexBasis: 'auto', boxSizing: 'border-box' });
            target.style.overflowY = 'visible';
            if (!decorated && /^(DIV|SECTION|ARTICLE|MAIN|P|H[1-6])$/.test(source.tagName)) {
                target.style.display = 'block';
                target.style.marginLeft = target.style.marginRight = '0';
                target.style.marginTop = '0';
                target.style.marginBottom = /^(P|H[1-6])$/.test(source.tagName) ? 'var(--log-paragraph-spacing, 1.2em)' : '0';
                const painted = styles.backgroundImage !== 'none' || (styles.backgroundColor !== 'transparent' && !/rgba\([^)]*,\s*0\s*\)/.test(styles.backgroundColor)) || styles.boxShadow !== 'none' || ['Top', 'Right', 'Bottom', 'Left'].some(side => parseFloat(styles[`border${side}Width`]) > 0);
                if (!painted) target.style.padding = '0';
            }
            if (/^(UL|OL)$/.test(source.tagName)) { target.style.margin = '0 0 .8em'; target.style.padding = '0 0 0 1.5em'; }
            if (/^(PRE|TABLE)$/.test(source.tagName)) target.style.overflowX = 'auto';
        }
        if (styles.position === 'fixed') target.style.position = 'absolute';
    }
    function pseudoContent(value) {
        if (value === 'none' || value === 'normal') return null;
        return [...value.matchAll(/"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g)].map(match => (match[1] ?? match[2]).replace(/\\([0-9a-f]{1,6})\s?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16))).replace(/\\(["'\\])/g, '$1')).join('');
    }
    function cloneDisplayed(node, context, definition = false, narration = false, selected = false) {
        selected = selected || !!context.units?.has(node);
        if (!definition && context.units && !selected && !context.branches.has(node)) return null;
        if (node.nodeType === Node.TEXT_NODE) {
            const value = node.nodeValue;
            if (!value.trim() || definition) return document.createTextNode(value);
            const vector = node.parentElement?.namespaceURI === 'http://www.w3.org/2000/svg';
            if (vector && !['text', 'tspan'].includes(node.parentElement.localName)) return document.createTextNode(value);
            const text = vector ? document.createElementNS('http://www.w3.org/2000/svg', 'tspan') : document.createElement('span');
            text.dataset.rkText = narration ? 'narration' : 'dialogue'; text.textContent = value; return text;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return null;
        const tag = node.tagName.toLowerCase();
        const fontRoot = node.getRootNode();
        if (!context.fontRoots.has(fontRoot)) {
            context.fontRoots.add(fontRoot);
            fontRoot.querySelectorAll('style,link[rel="stylesheet"]').forEach(element => { if (element.sheet) context.sheets.add(element.sheet); });
            (fontRoot.adoptedStyleSheets || []).forEach(sheet => context.sheets.add(sheet));
        }
        const inDefinition = definition || (node.namespaceURI === 'http://www.w3.org/2000/svg' && ['defs', 'symbol', 'clippath', 'mask', 'filter', 'pattern', 'lineargradient', 'radialgradient', 'marker'].includes(tag));
        if (['script', 'style', 'link', 'button', 'input', 'textarea', 'select', 'noscript'].includes(tag)) return null;
        const view = node.ownerDocument.defaultView;
        const styles = view.getComputedStyle(node);
        const isNarration = narration || tag === 'em' || tag === 'i' || /^(italic|oblique)/.test(styles.fontStyle);
        if (!inDefinition && (styles.display === 'none' || styles.visibility === 'hidden' || styles.visibility === 'collapse')) return null;
        if (tag === 'slot') {
            const fragment = document.createDocumentFragment();
            const children = node.assignedNodes({ flatten: true });
            (children.length ? children : [...node.childNodes]).forEach(child => { const clone = cloneDisplayed(child, context, definition, isNarration, selected); if (clone) fragment.appendChild(clone); });
            return fragment;
        }
        if (tag === 'iframe' || tag === 'object' || tag === 'embed') {
            const note = document.createElement('span'); note.textContent = '[외부 임베드]'; context.notes.add('외부 임베드는 직접 캡처할 수 없습니다.'); return note;
        }
        let clone;
        if (tag === 'canvas' || tag === 'video') {
            clone = document.createElement('img');
            try {
                if (tag === 'canvas') clone.src = node.toDataURL('image/png');
                else if (node.poster) clone.src = node.poster;
                else { context.notes.add('포스터 없는 동영상은 캡처에서 제외됩니다.'); return null; }
            } catch { context.notes.add('읽기가 제한된 캔버스는 캡처에서 제외됩니다.'); return null; }
        } else if (node.namespaceURI === 'http://www.w3.org/2000/svg') {
            clone = document.createElementNS(node.namespaceURI, node.localName);
            for (const attribute of [...node.attributes]) {
                if (/^on/i.test(attribute.name) || ['class', 'style'].includes(attribute.name) || /^javascript:/i.test(attribute.value)) continue;
                let value = svgReferences(attribute.value, node, context);
                if (attribute.name === 'id') value = svgID(value, node, context);
                if (['href', 'xlink:href'].includes(attribute.name) && value.startsWith('#')) value = '#' + svgID(value.slice(1), node, context);
                clone.setAttribute(attribute.name, value);
            }
        } else {
            const safeTag = tag.includes('-') ? 'div' : tag;
            clone = document.createElement(safeTag);
            for (const name of ['colspan', 'rowspan', 'start', 'reversed', 'value', 'dir', 'lang', 'alt']) if (node.hasAttribute(name)) clone.setAttribute(name, node.getAttribute(name));
            if (tag === 'a') clone.removeAttribute('href');
            if (tag === 'img') clone.src = node.src || node.currentSrc;
        }
        copyStyle(node, clone, styles, context);
        if (isNarration) clone.style.opacity = `var(--narration-opacity, ${styles.opacity})`;
        if (inDefinition) clone.style.removeProperty('display');
        const previousSVG = context.svgClone, previousSourceSVG = context.svgSource;
        if (tag === 'svg') { context.svgClone = clone; context.svgSource = node; }
        if (tag === 'use' && context.svgClone) {
            const reference = node.getAttribute('href') || node.getAttribute('xlink:href') || '';
            const target = reference.startsWith('#') ? node.getRootNode().getElementById?.(reference.slice(1)) : null;
            if (!context.importedSVG) context.importedSVG = new WeakSet();
            if (target && !context.svgSource?.contains(target) && !context.importedSVG.has(target)) {
                context.importedSVG.add(target);
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                const copied = cloneDisplayed(target, context, true);
                if (copied) { defs.appendChild(copied); context.svgClone.appendChild(defs); }
            }
        }
        if (tag === 'img' || tag === 'canvas' || tag === 'video') {
            clone.dataset.rkImage = 'true'; clone.style.maxWidth = '100%'; clone.style.height = 'auto'; clone.loading = 'eager';
        }
        if (tag === 'pre' || node.matches('.wrtn-codeblock') || (node.matches('.not-wrtn-markdown') && node.querySelector('pre,code'))) {
            clone.dataset.rkCode = 'true';
            if (!node.parentElement?.closest('.wrtn-codeblock,.not-wrtn-markdown,pre')) {
                const decorated = node.getRootNode() instanceof ShadowRoot || !!node.shadowRoot;
                if (!decorated) clone.style.marginTop = clone.style.marginBottom = 'var(--log-paragraph-spacing, 1.2em)';
            }
        }
        if (tag === 'hr') clone.dataset.rkSourceDivider = 'true';
        const appendPseudo = name => {
            const computed = view.getComputedStyle(node, name);
            const text = pseudoContent(computed.content);
            if (text === null || computed.display === 'none') return;
            const decoration = document.createElement('span');
            copyStyle(node, decoration, computed, context, true);
            decoration.textContent = text; decoration.dataset.rkPseudo = 'true'; clone.appendChild(decoration);
        };
        if (node.namespaceURI !== 'http://www.w3.org/2000/svg') appendPseudo('::before');
        if (node.shadowRoot) {
            node.shadowRoot.querySelectorAll('style,link[rel="stylesheet"]').forEach(element => { if (element.sheet) context.sheets.add(element.sheet); });
            (node.shadowRoot.adoptedStyleSheets || []).forEach(sheet => context.sheets.add(sheet));
        }
        const children = node.shadowRoot ? [...node.shadowRoot.childNodes] : [...node.childNodes];
        children.forEach(child => { const copied = cloneDisplayed(child, context, inDefinition, isNarration, selected); if (copied) clone.appendChild(copied); });
        if (node.namespaceURI !== 'http://www.w3.org/2000/svg') appendPseudo('::after');
        context.svgClone = previousSVG; context.svgSource = previousSourceSVG;
        return clone;
    }
    async function messageRoles(entries) {
        const ids = new Map(entries.map(({ bubble }) => [bubble, bubble.closest('[data-message-group-id]')?.getAttribute('data-message-group-id')?.replace(/^search:/, '')]));
        if ([...ids.values()].some(id => !id)) throw new Error('대화의 메시지 ID를 찾지 못했습니다. 페이지를 새로고침해주세요.');
        const chatId = location.pathname.match(/\/(?:episodes|chats)\/([a-f0-9]{24})(?:\/|$)/i)?.[1];
        if (!chatId) throw new Error('현재 채팅방 ID를 찾지 못했습니다.');
        const token = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('access_token='));
        const headers = { accept: 'application/json', platform: 'web', 'wrtn-locale': 'ko-KR' };
        if (token) headers.authorization = `Bearer ${decodeURIComponent(token.slice('access_token='.length))}`;
        const pending = new Set(ids.values()), roles = new Map();
        let cursor = '';
        while (pending.size) {
            const url = new URL(`https://crack-api.wrtn.ai/crack-gen/v3/chats/${chatId}/messages`);
            url.searchParams.set('limit', '100'); if (cursor) url.searchParams.set('cursor', cursor);
            const response = await fetch(url, { headers, credentials: 'include' });
            if (!response.ok) throw new Error(`메시지 역할을 확인하지 못했습니다 (${response.status}).`);
            const json = await response.json();
            const messages = Array.isArray(json?.data?.messages) ? json.data.messages : Array.isArray(json?.data) ? json.data : [];
            for (const message of messages) {
                if (!pending.has(message._id)) continue;
                const value = String(message.role).toLowerCase();
                const role = ['user', 'human'].includes(value) ? 'user' : ['character', 'assistant', 'bot', 'model'].includes(value) ? 'character' : null;
                if (role) { roles.set(message._id, role); pending.delete(message._id); }
            }
            const next = json?.data?.nextCursor || json?.meta?.nextCursor || json?.nextCursor;
            if (!messages.length || !next || next === cursor) break;
            cursor = next;
        }
        if (pending.size) throw new Error('선택한 메시지의 실제 역할을 확인하지 못했습니다. 페이지를 새로고침한 뒤 다시 선택해주세요.');
        return new Map([...ids].map(([bubble, id]) => [bubble, roles.get(id)]));
    }

    function markContentBlocks(root) {
        function imageOnly(element) {
            if (!element.matches('[data-rk-image]') && !element.querySelector('[data-rk-image]')) return false;
            if (element.querySelector('[data-rk-code],table,hr')) return false;
            const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            for (let node; (node = walker.nextNode());) if (node.textContent.replace(/[\s\u200b\u00a0]/g, '') && !node.parentElement.closest('figcaption,[data-rk-pseudo]')) return false;
            return true;
        }
        for (const image of root.querySelectorAll('[data-rk-image]')) {
            for (let parent = image.parentElement; parent && root.contains(parent); parent = parent.parentElement) {
                if (!imageOnly(parent)) break;
                parent.dataset.rkImageBlock = 'true';
                if (parent === root) break;
            }
        }
        if (imageOnly(root)) return 'image';
        const remainder = root.cloneNode(true);
        if (remainder.matches('[data-rk-code]')) return 'code';
        remainder.querySelectorAll('[data-rk-code],[data-rk-pseudo]').forEach(node => node.remove());
        return root.querySelector('[data-rk-code]') && !remainder.textContent.trim() && !remainder.querySelector('img,svg,table,hr') ? 'code' : '';
    }
    function composedParent(node) { return node.assignedSlot || node.parentNode?.host || node.parentNode; }
    function withinBubble(bubble, node) {
        for (let current = node; current; current = composedParent(current)) if (current === bubble) return true;
        return false;
    }
    function paragraphUnits(bubble) {
        const units = [];
        let text = [];
        function flush() {
            const first = text.find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            if (first) units.push({ node: first, nodes: text });
            text = [];
        }
        function visit(node) {
            if (node.nodeType === Node.TEXT_NODE) { text.push(node); return; }
            if (node.nodeType !== Node.ELEMENT_NODE || node.matches('script,style,link,button,input,textarea,select')) return;
            const style = getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return;
            const codeBlock = node.matches('.not-wrtn-markdown,.wrtn-codeblock') && node.querySelector('pre,code');
            if (!node.shadowRoot && (codeBlock || node.matches('pre,table,hr,img,svg,canvas,video,iframe'))) {
                flush();
                if (node.getClientRects().length) units.push({ node, nodes: [node] });
                return;
            }
            if (node.localName === 'br') { text.push(node); return; }
            const boundary = node.shadowRoot || node.matches('p,div,section,article,li,h1,h2,h3,h4,h5,h6') || ['block', 'flex', 'grid', 'list-item'].includes(style.display);
            if (boundary) flush();
            const assigned = node.localName === 'slot' ? node.assignedNodes({ flatten: true }) : [];
            const children = assigned.length ? assigned : node.shadowRoot ? [...node.shadowRoot.childNodes] : [...node.childNodes];
            children.forEach(visit);
            if (boundary) flush();
        }
        visit(bubble); flush();
        return units;
    }
    function paragraphRects(unit) {
        const rects = unit.nodes.flatMap(node => {
            if (node.nodeType !== Node.TEXT_NODE) return [...node.getClientRects()];
            const range = node.ownerDocument.createRange(); range.selectNodeContents(node);
            return [...range.getClientRects()];
        }).filter(rect => rect.width > 0 && rect.height > 0);
        if (!rects.length) return [];
        const left = Math.min(...rects.map(rect => rect.left)), top = Math.min(...rects.map(rect => rect.top));
        const right = Math.max(...rects.map(rect => rect.right)), bottom = Math.max(...rects.map(rect => rect.bottom));
        return [{ left, top, right, bottom, width: right - left, height: bottom - top }];
    }

    let picking = null;
    let editor = null;
    let pickerPopup = null;
    const launch = document.createElement('button');
    launch.type = 'button'; launch.setAttribute('aria-label', '로그 캡처'); launch.title = '로그 캡처'; launch.innerHTML = icon('capture');
    const compact = matchMedia('(max-width:650px)').matches;
    launch.style.cssText = `position:fixed;left:10px;bottom:14px;box-sizing:border-box;width:${compact ? 26 : 30}px;height:${compact ? 26 : 30}px;border:1px solid #d6dfd0;border-radius:9px;background:#fbfcf8;color:#4b6550;z-index:2147483645;display:grid;place-items:center;cursor:pointer;box-shadow:0 2px 8px #0001;padding:5px;`;
    launch.querySelector('svg').style.cssText = 'width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;';
    matchMedia('(max-width:650px)').addEventListener('change', event => { launch.style.width = launch.style.height = `${event.matches ? 26 : 30}px`; });
    function bubbles() {
        return [...document.querySelectorAll(BUBBLE)].filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden').sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    }
    function stopPicking() {
        if (!picking) return;
        picking.controller.abort(); picking.hud.remove(); picking.outline.remove(); picking = null;
    }
    function closePickerPopup() { pickerPopup?.controller.abort(); pickerPopup?.element.remove(); pickerPopup = null; launch.setAttribute('aria-expanded', 'false'); }
    function showPickerPopup(event) {
        if (editor) return;
        if (pickerPopup) { closePickerPopup(); return; }
        stopPicking();
        const menu = document.createElement('div'), controller = new AbortController();
        menu.setAttribute('role', 'group'); menu.setAttribute('aria-label', '캡처 선택 방식');
        menu.style.cssText = 'position:fixed;display:flex;gap:3px;padding:4px;background:#fffefa;border:1px solid #d9e1d1;border-radius:9px;box-shadow:0 3px 14px #0002;z-index:2147483647;font:12px/1.5 sans-serif;';
        for (const [mode, label] of [['block', '블록 선택'], ['paragraph', '문단 선택']]) {
            const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
            button.style.cssText = 'border:0;background:transparent;color:#4d6547;border-radius:5px;padding:7px 10px;font:inherit;cursor:pointer;white-space:nowrap;';
            button.addEventListener('pointerdown', e => e.preventDefault());
            button.addEventListener('click', () => { closePickerPopup(); startPicking(mode); }); menu.appendChild(button);
        }
        document.body.appendChild(menu);
        const rect = launch.getBoundingClientRect(), x = event.clientX || rect.left, y = event.clientY || rect.top;
        menu.style.left = `${clamp(x, 6, Math.max(6, innerWidth - menu.offsetWidth - 6))}px`;
        menu.style.top = `${clamp(y - menu.offsetHeight - 7, 6, Math.max(6, innerHeight - menu.offsetHeight - 6))}px`;
        pickerPopup = { element: menu, controller }; launch.setAttribute('aria-expanded', 'true');
        document.addEventListener('pointerdown', e => { if (!menu.contains(e.target) && !launch.contains(e.target)) closePickerPopup(); }, { capture: true, signal: controller.signal });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') closePickerPopup(); }, { signal: controller.signal });
        window.addEventListener('resize', closePickerPopup, { signal: controller.signal });
    }
    function startPicking(mode) {
        if (editor) return;
        if (picking) { stopPicking(); return; }
        if (!bubbles().length) { alert('현재 화면에서 채팅 로그를 찾지 못했습니다. 대화가 로딩된 뒤 다시 선택해주세요.'); return; }
        const controller = new AbortController();
        const hud = document.createElement('div');
        hud.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:10px 12px 10px 18px;background:#fdfef9;color:#384d37;border:1px solid #d6dfd0;border-radius:12px;box-shadow:0 5px 20px #0002;z-index:2147483647;font:13px/1.5 sans-serif;white-space:nowrap;';
        const unitLabel = mode === 'paragraph' ? '문단' : '블록';
        const label = document.createElement('span'); label.textContent = `시작 ${unitLabel}을 선택하세요`;
        const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = '취소'; cancel.style.cssText = 'border:0;border-radius:6px;background:#edf2e5;color:#4a6542;padding:7px 10px;font:12px sans-serif;cursor:pointer;';
        cancel.onclick = stopPicking; hud.append(label, cancel);
        const outline = document.createElement('div'); outline.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #76906c;border-radius:8px;z-index:2147483646;background:#96ac8012;display:none;';
        document.body.append(hud, outline); picking = { controller, hud, outline, start: null, hover: null };
        const positionOutline = () => {
            const target = picking?.hover || picking?.start;
            if (!target?.node.isConnected) { outline.style.display = 'none'; return; }
            const rects = paragraphRects(target.unit);
            if (!rects.length) { outline.style.display = 'none'; return; }
            const left = Math.min(...rects.map(rect => rect.left)), top = Math.min(...rects.map(rect => rect.top));
            const right = Math.max(...rects.map(rect => rect.right)), bottom = Math.max(...rects.map(rect => rect.bottom));
            Object.assign(outline.style, { display: 'block', left: `${left - 3}px`, top: `${top - 3}px`, width: `${right - left + 6}px`, height: `${bottom - top + 6}px` });
        };
        const targetFromEvent = event => {
            const path = event.composedPath(), bubble = path.find(node => node.nodeType === Node.ELEMENT_NODE && node.matches?.(BUBBLE));
            if (!bubble) return null;
            if (mode === 'block') return { node: bubble, unit: { node: bubble, nodes: [bubble] }, bubble };
            const units = paragraphUnits(bubble);
            const unit = units.find(unit => unit.nodes.length === 1 && unit.node.nodeType === Node.ELEMENT_NODE && path.some(target => target.nodeType === Node.ELEMENT_NODE && (unit.node === target || unit.node.contains(target)))) ||
                units.reduce((closest, unit) => {
                    const rect = paragraphRects(unit)[0];
                    if (!rect) return closest;
                    const distance = Math.hypot(Math.max(rect.left - event.clientX, event.clientX - rect.right, 0), Math.max(rect.top - event.clientY, event.clientY - rect.bottom, 0));
                    return !closest || distance < closest.distance ? { unit, distance } : closest;
                }, null)?.unit;
            return unit ? { node: unit.node, unit, bubble } : null;
        };
        document.addEventListener('pointermove', event => { if (!picking) return; picking.hover = targetFromEvent(event); positionOutline(); }, { signal: controller.signal });
        window.addEventListener('scroll', positionOutline, { passive: true, capture: true, signal: controller.signal });
        document.addEventListener('keydown', event => { if (event.key === 'Escape') stopPicking(); }, { signal: controller.signal });
        document.addEventListener('click', async event => {
            if (!picking || hud.contains(event.target) || launch.contains(event.target)) return;
            const target = targetFromEvent(event);
            if (!target) return;
            event.preventDefault(); event.stopImmediatePropagation();
            if (!picking.start) { picking.start = target; label.textContent = `끝 ${unitLabel}을 선택하세요`; positionOutline(); return; }
            const all = bubbles().flatMap(bubble => (mode === 'block' ? [{ node: bubble, nodes: [bubble] }] : paragraphUnits(bubble)).map(unit => ({ ...unit, bubble })));
            const start = all.findIndex(unit => unit.node === picking.start.node), end = all.findIndex(unit => unit.node === target.node);
            if (start < 0 || end < 0) { stopPicking(); alert('선택한 대화가 화면에서 사라졌습니다. 로딩된 대화 구간을 다시 선택해주세요.'); return; }
            const selected = [];
            for (const unit of all.slice(Math.min(start, end), Math.max(start, end) + 1)) {
                let entry = selected[selected.length - 1];
                if (!entry || entry.bubble !== unit.bubble) { entry = { bubble: unit.bubble, units: mode === 'paragraph' ? [] : null }; selected.push(entry); }
                entry.units?.push(...unit.nodes);
            }
            stopPicking(); launch.disabled = true;
            try { await openEditor(selected); }
            catch (error) { alert(`편집기를 열지 못했습니다. ${error.message}`); }
            finally { launch.disabled = false; }
        }, { capture: true, signal: controller.signal });
    }
    launch.setAttribute('aria-expanded', 'false');
    launch.addEventListener('pointerdown', event => event.preventDefault());
    launch.addEventListener('click', showPickerPopup);
    document.body.appendChild(launch);
    function syncLaunch() {
        launch.style.display = !editor && /^\/stories\/[^/]+\/(?:episodes|chats)\/[a-f0-9]{24}(?:\/|$)/i.test(location.pathname) ? 'grid' : 'none';
    }
    window.addEventListener('urlchange', () => { stopPicking(); closePickerPopup(); syncLaunch(); });
    syncLaunch();

    function fontBlocks(css, base) {
        return [...css.matchAll(/@font-face\s*\{([^}]+)\}/gi)].map(match => ({ body: match[1], base }));
    }
    function cssField(body, name) {
        const match = new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*`, 'i').exec(body);
        if (!match) return '';
        const start = match.index + match[0].length;
        let end = start, depth = 0, quote = '';
        for (; end < body.length; end++) {
            const character = body[end];
            if (character === '\\') { end++; continue; }
            if (quote) { if (character === quote) quote = ''; continue; }
            if (character === '"' || character === "'") quote = character;
            else if (character === '(') depth++;
            else if (character === ')') depth--;
            else if (character === ';' && !depth) break;
        }
        return body.slice(start, end).trim();
    }
    function neededUnicode(ranges, text) {
        if (!ranges) return true;
        const points = [...new Set([...text].map(char => char.codePointAt(0)))];
        return ranges.split(',').some(range => {
            const value = range.trim().replace(/^U\+/i, '');
            const [a, b = a] = value.includes('?') ? [value.replace(/\?/g, '0'), value.replace(/\?/g, 'F')] : value.split('-');
            const low = parseInt(a, 16), high = parseInt(b, 16);
            return points.some(point => point >= low && point <= high);
        });
    }
    async function embeddedFont(block, text, alias = '', useGM = false) {
        const family = alias || cssField(block.body, 'font-family').replace(/^['"]|['"]$/g, '');
        let source = cssField(block.body, 'src');
        if (/url\(/i.test(source)) source = source.replace(/local\(\s*(?:"[^"]*"|'[^']*'|[^)]*)\s*\)\s*,?\s*/gi, '').replace(/,\s*$/, '');
        if (!family || !source || !neededUnicode(cssField(block.body, 'unicode-range'), text)) return '';
        const localized = await replaceURLs(source, block.base, useGM);
        const descriptors = ['font-style', 'font-weight', 'font-stretch', 'unicode-range'].map(name => {
            const value = cssField(block.body, name);
            return value ? `${name}:${value};` : '';
        }).join('');
        return `@font-face{font-family:${JSON.stringify(family)};src:${localized};font-display:swap;${descriptors}}`;
    }
    async function sourceFontCSS(context, text, useGM = false) {
        const blocks = [], seen = new Set();
        async function importedCSS(css, base) {
            blocks.push(...fontBlocks(css, base));
            for (const match of css.matchAll(/@import\s+(?:url\(\s*)?(['"]?)([^'"\s);]+)\1/gi)) {
                const url = new URL(match[2], base).href;
                if (seen.has(url)) continue;
                seen.add(url);
                await importedCSS(await requestResource(url, 'text', useGM), url);
            }
        }
        async function sheetRules(sheet) {
            if (!sheet || seen.has(sheet)) return;
            seen.add(sheet);
            try {
                const walk = async rules => {
                    for (const rule of [...rules]) {
                        if (rule.type === 5) blocks.push(...fontBlocks(rule.cssText, sheet.href || location.href));
                        else if (rule.type === 3) await sheetRules(rule.styleSheet);
                        else if (rule.cssRules) await walk(rule.cssRules);
                    }
                };
                await walk(sheet.cssRules);
            } catch {
                if (sheet.href) {
                    try { await importedCSS(await requestResource(sheet.href, 'text', useGM), sheet.href); }
                    catch { context.notes.add('일부 원문 글꼴의 스타일시트에 접근하지 못했습니다.'); }
                }
            }
        }
        for (const sheet of context.sheets) { if (context.cancelled) break; await sheetRules(sheet); }
        const relevant = blocks.filter(block => context.families.has(cssField(block.body, 'font-family').replace(/^['"]|['"]$/g, '').toLowerCase()));
        const result = [];
        for (const block of relevant) {
            if (context.cancelled) break;
            try { result.push(await embeddedFont(block, text, '', useGM)); }
            catch { context.notes.add('일부 원문 글꼴 파일을 불러오지 못했습니다. 기본 대체 글꼴이 사용될 수 있습니다.'); }
        }
        return result.join('\n');
    }
    async function loadUsedFonts(root, doc) {
        const samples = new Map(), walker = doc.createTreeWalker(root, 4);
        for (let node; (node = walker.nextNode());) {
            if (!node.textContent.trim() || !node.parentElement.getClientRects().length) continue;
            const style = doc.defaultView.getComputedStyle(node.parentElement);
            const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            if (!samples.has(font)) samples.set(font, new Set());
            for (const character of node.textContent) samples.get(font).add(character);
        }
        const faces = (await Promise.all([...samples].map(([font, characters]) => doc.fonts.load(font, [...characters].join(''))))).flat();
        await doc.fonts.ready;
        return faces;
    }
    async function localizeImages(root) {
        for (const image of root.querySelectorAll('img')) {
            if (!image.getClientRects().length) continue;
            if (!image.getAttribute('src')) continue;
            image.src = await imageDataResource(image.src);
            image.removeAttribute('srcset'); image.removeAttribute('sizes');
            try { await image.decode(); } catch { throw new Error('이미지를 해석하지 못했습니다. 이미지 표시를 끄거나 해당 구간을 제외해주세요.'); }
        }
        for (const element of root.querySelectorAll('*')) {
            if (!element.getClientRects().length) continue;
            for (const property of ['background-image', 'mask-image']) {
                const value = element.style.getPropertyValue(property);
                if (value && /url\(/i.test(value)) element.style.setProperty(property, await replaceURLs(value, location.href, true, true));
            }
            if (element.namespaceURI === 'http://www.w3.org/2000/svg' && element.localName === 'image') {
                const url = element.getAttribute('href') || element.getAttribute('xlink:href');
                if (url && !url.startsWith('#')) { element.setAttribute('href', await imageDataResource(new URL(url, location.href).href)); element.removeAttribute('xlink:href'); }
            }
        }
    }
    function patternTile(kind, color, opacity = 1) {
        if (kind === 'plain') return '';
        const stroke = `stroke="${color}" stroke-opacity=".35" fill="none" stroke-width="1"`;
        const fill = `fill="${color}" fill-opacity=".2"`;
        let size = 24, body = '';
        if (kind === 'ruled' || kind === 'fineRuled') { size = kind === 'ruled' ? 32 : 20; body = `<path d="M0 ${size - .5}H${size}" ${stroke}/>`; }
        if (kind === 'vertical') body = `<path d="M23.5 0V24" ${stroke}/>`;
        if (kind === 'grid' || kind === 'fineGrid') { size = kind === 'grid' ? 24 : 12; body = `<path d="M0 .5H${size}M.5 0V${size}" ${stroke}/>`; }
        if (kind === 'dots') { size = 18; body = `<circle cx="9" cy="9" r=".8" fill="${color}" fill-opacity=".5"/>`; }
        if (kind === 'gingham') { size = 36; body = `<rect width="18" height="36" ${fill}/><rect width="36" height="18" ${fill}/>`; }
        if (kind === 'check') { size = 36; body = `<rect width="18" height="18" ${fill}/><rect x="18" y="18" width="18" height="18" ${fill}/>`; }
        if (kind === 'diagonal' || kind === 'stripe') {
            body = kind === 'diagonal' ? `<path d="M-12 12 12-12M0 24 24 0M12 36 36 12" ${stroke}/>` : `<rect width="12" height="24" ${fill}/>`;
        }
        if (kind === 'diamond') body = `<path d="M12 0 24 12 12 24 0 12Z" ${stroke}/>`;
        if (kind === 'cross') body = `<path d="M9 12h6m-3-3v6" ${stroke}/>`;
        if (kind === 'grain') {
            size = 64;
            body = Array.from({ length: 64 }, (_, i) => `<circle cx="${(i * 29 + 7) % 64}" cy="${(i * 37 + 11) % 64}" r="${i % 3 ? .35 : .6}" fill="${color}" fill-opacity=".17"/>`).join('');
        }
        return svgData(svg(`<g opacity="${opacity}">${body}</g>`, size));
    }
    const STICKERS = {
        flower: { label: '꽃', group: '도형', body: '<g fill="#b5aacd"><ellipse cx="50" cy="27" rx="13" ry="20"/><ellipse cx="50" cy="27" rx="13" ry="20" transform="rotate(72 50 50)"/><ellipse cx="50" cy="27" rx="13" ry="20" transform="rotate(144 50 50)"/><ellipse cx="50" cy="27" rx="13" ry="20" transform="rotate(216 50 50)"/><ellipse cx="50" cy="27" rx="13" ry="20" transform="rotate(288 50 50)"/></g><circle cx="50" cy="50" r="12" fill="#f7e4a8"/>' },
        daisy: { label: '데이지', group: '도형', body: Array.from({ length: 9 }, (_, i) => `<ellipse cx="50" cy="26" rx="8" ry="21" transform="rotate(${i * 40} 50 50)" fill="#fffdf0" stroke="#ded9c1"/>`).join('') + '<circle cx="50" cy="50" r="13" fill="#e5c271"/>' },
        star: { label: '별', group: '도형', body: '<path d="m50 8 10 29 31 12-31 11-10 31-11-31L9 49l30-12Z" fill="#eacb88"/>' },
        sparkle: { label: '반짝임', group: '도형', body: '<path d="m37 13 8 24 25 8-25 8-8 26-8-26-25-8 25-8Zm42 39 4 13 13 4-13 4-4 14-4-14-13-4 13-4Z" fill="#b7c7ab"/>' },
        heart: { label: '하트', group: '도형', body: '<path d="M50 85S9 59 9 34C9 9 40 7 50 29 60 7 91 9 91 34 91 59 50 85 50 85Z" fill="#d8a3a5"/><path d="M23 33q0-13 14-10" stroke="#f6d8d2" stroke-width="4" fill="none" stroke-linecap="round"/>' },
        ribbon: { label: '리본', group: '도형', body: '<path d="M46 47C5-4-3 73 44 51L25 92l23-12 7 13 3-42c50 22 40-57-3-5Z" fill="#cba8ad" stroke="#b58e95"/><ellipse cx="51" cy="49" rx="9" ry="11" fill="#b98e98"/>' },
        moon: { label: '달', group: '도형', body: '<path d="M73 17C29 13 23 70 68 81 11 97-9 20 43 8 54 5 65 9 73 17Z" fill="#e4cf91"/><path d="m78 33 3 9 10 3-10 4-3 9-3-9-9-4 9-3Z" fill="#bdc7b4"/>' },
        leaf: { label: '잎', group: '도형', body: '<path d="M20 87Q40 49 76 10" fill="none" stroke="#8e9c7a" stroke-width="2"/><g fill="#a9b798"><ellipse cx="34" cy="68" rx="8" ry="16" transform="rotate(-38 34 68)"/><ellipse cx="55" cy="57" rx="8" ry="16" transform="rotate(42 55 57)"/><ellipse cx="47" cy="42" rx="8" ry="16" transform="rotate(-38 47 42)"/><ellipse cx="69" cy="28" rx="8" ry="16" transform="rotate(42 69 28)"/></g>' },
        cat: { label: '고양이', group: '도형', body: '<path d="m19 46-2-30 25 16h17l24-16-2 30c24 47-85 47-62 0Z" fill="#ddd0b8" stroke="#b4a58d" stroke-width="2"/><path d="M33 55h1m32 0h1M45 64q5 8 10 0M13 63l17 1m-14 9 16-4m39-5 17-1m-15 6 15 4" stroke="#7d7365" stroke-width="3" stroke-linecap="round" fill="none"/>' },
        cloud: { label: '구름', group: '도형', body: '<path d="M24 74C0 74 0 43 22 43 21 13 60 8 69 34c31-8 46 37 13 40Z" fill="#e8edf2" stroke="#c1cfda" stroke-width="2"/>' },
        tapeSage: { label: '연두 테이프', group: '테이프', body: '<path d="m5 30 8-4 5 5 9-5 8 5 8-5 8 5 8-5 8 5 8-5 8 5 10-4-3 44-9-4-8 4-8-4-8 4-8-4-8 4-8-4-8 4-8-4-10 4Z" fill="#b9c8a2" fill-opacity=".82"/>' },
        tapeRose: { label: '분홍 테이프', group: '테이프', body: '<path d="m5 30 8-4 5 5 9-5 8 5 8-5 8 5 8-5 8 5 8-5 8 5 10-4-3 44-9-4-8 4-8-4-8 4-8-4-8 4-8-4-8 4-8-4-10 4Z" fill="#dab0ae" fill-opacity=".8"/><path d="M10 39h78M9 52h78M8 65h78" stroke="#f7e4db" stroke-width="2"/>' },
        tapeCheck: { label: '체크 테이프', group: '테이프', body: '<defs><pattern id="c" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#f0e9df"/><path d="M0 4h16M4 0v16" stroke="#b69885" stroke-opacity=".45" stroke-width="8"/></pattern></defs><path d="m5 28 90 5-5 42-87-5Z" fill="url(#c)"/>' },
        tapeDots: { label: '도트 테이프', group: '테이프', body: '<defs><pattern id="d" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#d7d8e6"/><circle cx="6" cy="6" r="1.5" fill="#8f92ad"/></pattern></defs><path d="m4 27 90 6-4 42-87-5Z" fill="url(#d)"/>' },
        frame: { label: '사진 프레임', group: '프레임', body: '<path d="m13 8 76 7-7 77-76-7Z" fill="#fffdf6" stroke="#d6d0c3"/><path d="m23 19 54 5-4 47-54-5Z" fill="none" stroke="#b5c4b2" stroke-width="2"/>' },
        noteYellow: { label: '노란 포스트잇', group: '프레임', body: '<path d="M9 8h82v67L75 92H9Z" fill="#f4df99" stroke="#d9c27e"/><path d="M9 8h82v18H9Z" fill="#d3b860" fill-opacity=".2"/><path d="m75 92 1-17h15Z" fill="#d5bc71"/>' },
        noteBlue: { label: '파란 포스트잇', group: '프레임', body: '<path d="M9 8h82v67L75 92H9Z" fill="#c5dce8" stroke="#a6bfce"/><path d="M9 8h82v18H9Z" fill="#8bafc5" fill-opacity=".2"/><path d="m75 92 1-17h15Z" fill="#a2bdce"/>' },
        notePink: { label: '분홍 포스트잇', group: '프레임', body: '<path d="M9 8h82v67L75 92H9Z" fill="#efd0d8" stroke="#d4adb9"/><path d="M9 8h82v18H9Z" fill="#cd97aa" fill-opacity=".2"/><path d="m75 92 1-17h15Z" fill="#d0a4b2"/>' },
        label: { label: '라벨', group: '프레임', body: '<path d="M8 25h73l13 25-13 25H8Z" fill="#e9d9b9" stroke="#c5b18a"/><circle cx="79" cy="50" r="4" fill="#fffdf8"/><path d="M23 39h39M23 52h32M23 64h39" stroke="#baa987"/>' },
        circle: { label: '원형 스티커', group: '프레임', body: '<circle cx="50" cy="50" r="38" fill="#e4d3d4"/><circle cx="50" cy="50" r="30" fill="none" stroke="#ba979b" stroke-dasharray="3 3"/>' },
        bookmark: { label: '북마크', group: '프레임', body: '<path d="M27 5h46v88L50 77 27 93Z" fill="#9fb6ae"/><path d="M37 18h26M37 28h26" stroke="#e1ece4" stroke-width="2"/>' },
        arrow: { label: '화살표', group: '손그림', body: '<path d="M12 73Q34 36 81 28M61 15l22 12-13 24" fill="none" stroke="#b98a72" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' },
        ring: { label: '동그라미 표시', group: '손그림', body: '<path d="M67 13C10-2-12 76 37 86c59 13 77-53 32-68C26 3 2 54 29 75" fill="none" stroke="#bb8d8f" stroke-width="3" stroke-linecap="round"/>' },
        checkmark: { label: '체크 표시', group: '손그림', body: '<path d="m16 52 22 25 47-59" fill="none" stroke="#86a083" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' },
        underline: { label: '손그림 밑줄', group: '손그림', body: '<path d="M6 43q43-10 88-2M12 55q40-7 75-1" fill="none" stroke="#d2b16f" stroke-width="4" stroke-linecap="round"/>' },
        stars: { label: '별 낙서', group: '손그림', body: '<path d="m36 15 7 22 24 1-19 14 7 23-19-14-20 14 7-23L4 38l24-1Zm45 41 3 10 11 1-9 6 3 11-9-7-9 7 4-11-9-6 11-1Z" fill="none" stroke="#b1a0c2" stroke-width="2" stroke-linejoin="round"/>' },
        pin: { label: '압정', group: '도형', body: '<path d="M49 51v40" stroke="#8c8c90" stroke-width="3"/><ellipse cx="50" cy="52" rx="20" ry="7" fill="#a78280"/><path d="M36 22h28l-5 30H41Z" fill="#cda4a0"/><ellipse cx="50" cy="22" rx="17" ry="8" fill="#ddbdb4"/>' },
    };

    const EDITOR_CSS = `
        :root{color-scheme:light;--ui:-apple-system,BlinkMacSystemFont,"Segoe UI","Malgun Gothic",sans-serif;--accent:#637565;--line:#dfe5db;--ink:#344036}
        *{box-sizing:border-box}
        body{margin:0;background:#eef0eb;color:var(--ink);font:13px/1.5 var(--ui);overflow:hidden}
        button,input,textarea,select{font:inherit}
        button{border:0;background:none;color:inherit;cursor:pointer}
        button:disabled,input:disabled,select:disabled,fieldset:disabled{opacity:.4;cursor:default}
        [hidden]{display:none!important}
        svg{display:block}
        button svg,.icon svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
        button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #90a985;outline-offset:3px}
        .icon{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;flex-shrink:0}
        .icon:hover{background:#e9eee3}
        .floating{position:fixed;z-index:20;top:14px;width:32px;height:32px;border:1px solid var(--line);background:#fdfef9;box-shadow:0 2px 8px #24331b12;border-radius:9px}
        .floating svg{width:17px;height:17px}
        .close-editor{left:8px;z-index:90}
        .save{right:8px;background:var(--accent);color:#fff;border-color:transparent}
        .dock{position:fixed;left:50%;top:10px;max-width:calc(100vw - 88px);transform:translateX(-50%);z-index:25}
        .toolbar{display:flex;gap:1px;align-items:center;width:max-content;max-width:100%;padding:4px 5px;height:40px;background:#fdfef9f5;border:1px solid var(--line);border-radius:11px;box-shadow:0 2px 10px #24331b12;backdrop-filter:blur(15px);overflow-x:auto;scrollbar-width:none}
        .toolbar::-webkit-scrollbar{display:none}
        .tool{width:30px;height:30px;display:grid;place-items:center;border-radius:7px;color:#66765d;flex-shrink:0}
        .tool svg{width:18px;height:18px}
        .tool:hover,.tool[aria-expanded=true]{background:#e9eee3;color:#445e41}
        .separator{width:1px;height:18px;background:var(--line);margin:0 4px;flex-shrink:0}
        .stage{position:fixed;inset:62px 0 0;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding:0 12px 60px;overflow-anchor:none}
        .sizer{position:relative;margin:0 auto;overflow:hidden}
        .page{position:absolute;left:0;top:0;transform-origin:top left;background-color:var(--paper-color,#fff);background-repeat:repeat;box-shadow:0 3px 8px #19231314,0 18px 45px #1923130d;color:var(--body-color,#333);--body-font:"Noto Serif KR","AppleMyungjo","Batang",serif}
        .page-body{position:relative;padding:var(--page-padding,24px);font:16px/1.5 var(--body-font);min-height:150px;overflow-wrap:anywhere}
        .log,.log *{user-select:text!important;-webkit-user-select:text!important}
        .page-body,.page-body *{-webkit-touch-callout:none!important}
        .message{position:relative;margin:0 0 24px;min-width:0}
        .message:last-child{margin-bottom:0}
        .role{display:block;width:fit-content;font:10px/1.6 var(--ui);letter-spacing:1px;color:var(--role-color,#8a9684);margin:0 0 10px}
        .message[data-role=user]>.role{margin-left:auto}
        .rule,.divider-sample{--rule-color:#a4ada0;display:block;height:1px;background:var(--rule-color);position:relative}
        .rule{width:96px;max-width:100%;margin:22px auto}
        .divider-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
        .divider-choice{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-width:0;padding:9px 6px;border:1px solid var(--line);border-radius:7px;font-size:10px;color:#66765d}
        .divider-choice[aria-pressed=true]{border-color:var(--accent);background:#eef3e8}
        .divider-preview{display:flex;align-items:center;width:100%;height:12px}
        .divider-sample{width:100%}
        [data-divider=double] .rule,[data-divider=double] .divider-sample{height:5px;background:none;border-top:1px solid var(--rule-color);border-bottom:1px solid var(--rule-color)}
        [data-divider=dashed] .rule,[data-divider=dashed] .divider-sample{background:none;border-top:1px dashed var(--rule-color)}
        [data-divider=diamond] .rule:after,[data-divider=diamond] .divider-sample:after{content:"";position:absolute;left:calc(50% - 3px);top:-2px;width:6px;height:6px;background:var(--rule-color);transform:rotate(45deg)}
        .page.colored-paper [data-rk-code]{border:1px solid var(--dialogue-color,var(--body-color))!important;border-radius:5px}
        .page.colored-paper [data-rk-code] [data-rk-code]{border:0!important}
        .page.hide-user .message[data-role=user],.page.hide-code [data-rk-code],.page.hide-code .message[data-rk-only=code],.page.hide-images [data-rk-image],.page.hide-images [data-rk-image-block],.page.hide-images .message[data-rk-only=image],.page.hide-dividers .rule,.page.hide-dividers [data-rk-source-divider],.page.hide-roles .role{display:none!important}
        [data-rk-text=narration]{color:var(--narration-color,inherit);fill:var(--narration-color,inherit)}
        [data-rk-text=dialogue]{color:var(--dialogue-color,inherit);fill:var(--dialogue-color,inherit)}
        .heading{font-family:var(--body-font);white-space:pre-wrap;text-align:center;font-size:24px;line-height:1.55;margin:0 0 24px;overflow-wrap:anywhere}
        .popover{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);width:334px;max-width:calc(100vw - 20px);max-height:calc(100dvh - 88px);overflow-y:auto;background:#fffefa;border:1px solid var(--line);border-radius:12px;padding:15px 18px 18px;box-shadow:0 8px 28px #24331b1c}
        .panel-head,.dialog-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:15px}
        .panel-head h2{font-size:13px;font-weight:600;margin:0}
        .panel-head .icon{width:28px;height:28px}
        .panel-head svg{width:16px;height:16px}
        .actions{display:flex;gap:3px}
        .toggle{position:relative;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #edf0e7;font-size:12px;cursor:pointer}
        .toggle input{position:absolute;right:0;opacity:0;width:34px;height:24px}
        .switch{width:32px;height:19px;padding:3px;border-radius:20px;background:#dce3d4;pointer-events:none}
        .switch:before{content:"";display:block;width:13px;height:13px;border-radius:50%;background:#fff}
        .toggle input:checked+.switch{background:var(--accent)}
        .toggle input:checked+.switch:before{transform:translateX(13px)}
        .toggle input:focus-visible+.switch{outline:2px solid #90a985;outline-offset:3px}
        .field{display:block;font-size:11px;color:#7e8a72;margin:13px 0 7px}
        .input{display:block;width:100%;padding:10px 11px;background:#fff;color:#344036;border:1px solid #d9e1d0;border-radius:7px;min-width:0}
        textarea.input{resize:vertical}
        .row{display:flex;gap:8px;align-items:center}
        .row>.input{flex:1}
        .range-label{display:flex;justify-content:space-between;margin:17px 0 6px;font-size:11px;color:#7b8770}
        input[type=range]{accent-color:var(--accent);width:100%;height:20px;margin:0}
        input[type=color]{width:30px;height:30px;padding:2px;background:#fff;border:1px solid var(--line);border-radius:6px;cursor:pointer}
        .primary,.secondary,.upload{display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 12px;border-radius:8px;font-size:12px}
        .primary{background:var(--accent);color:#fff}
        .secondary,.upload{border:1px solid var(--line);background:#f5f8f0;color:#6e7e61}
        .upload{cursor:pointer}
        .upload svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6}
        .wide{width:100%;margin-top:14px}
        .theme-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 10px}
        .theme-tile{position:relative;min-width:0}
        .theme-tile .theme-card{width:100%}
        .theme-delete{position:absolute;right:3px;top:3px;display:flex;align-items:center;justify-content:center;min-width:24px;height:24px;padding:4px 6px;border:1px solid var(--line);border-radius:5px;background:#fffefa;color:#7c4d45;font-size:10px}
        .theme-delete svg{width:14px;height:14px}
        .theme-card{display:flex;flex-direction:column;gap:7px;min-width:0;text-align:left;font-size:11px;color:var(--ink)}
        .theme-card>span:last-child{width:100%;overflow-wrap:anywhere}
        .theme-sample{display:flex;flex-direction:column;justify-content:center;gap:5px;width:100%;height:86px;padding:10px 12px;overflow:hidden;border:1px solid var(--line);border-radius:7px;background-repeat:repeat}
        .theme-sample small{font-size:9px;letter-spacing:1px}
        .theme-sample strong{font-weight:400;font-size:12px;white-space:nowrap}
        .theme-card[aria-pressed=true] .theme-sample{outline:2px solid #7c926e;outline-offset:2px}
        .pattern-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 10px;margin-bottom:18px}
        .choice{display:flex;flex-direction:column;align-items:center;gap:7px;font-size:10px;color:#7e8b70;padding:0}
        .sample{display:block;width:100%;height:52px;border:1px solid var(--line);border-radius:5px;background-color:#fffaf1;background-repeat:repeat}
        .choice[aria-pressed=true] .sample{outline:2px solid #7c926e;outline-offset:2px}
        .swatches{display:flex;flex-wrap:nowrap;align-items:center;gap:8px;margin:0 0 15px}
        .swatches input[type=color]{margin-left:auto;flex-shrink:0}
        .swatch{width:24px;height:24px;flex-shrink:0;border-radius:50%;background:var(--color);border:1px solid #0002}
        .swatches .swatch{flex-shrink:1;min-width:16px;height:auto;aspect-ratio:1}
        .swatch[data-color="null"]{background:linear-gradient(135deg,transparent 46%,#b68b87 47%,#b68b87 53%,transparent 54%)}
        .swatch[aria-pressed=true]{outline:1.5px solid #7c926e;outline-offset:3px}
        fieldset{border:0;padding:0;margin:0;min-width:0}
        .settings-section{border-top:1px solid var(--line);margin-top:14px;padding-top:14px}
        legend{padding:0}
        .font-preview{padding:12px;border-radius:6px;background:#f1f5e9;text-align:center;margin-top:8px;font-size:17px;color:#687b58}
        .status-text{font-size:11px;color:#819173;line-height:1.6;overflow-wrap:anywhere;margin-top:8px}
        .error{color:#a74f41}
        .tabs{display:flex;gap:3px;background:#eef2e8;padding:3px;border-radius:7px;margin-bottom:14px}
        .tabs button{flex:1;font-size:10px;padding:7px 3px;border-radius:5px;color:#849177}
        .tabs button[aria-pressed=true]{background:#fffefa;color:#526d45;box-shadow:0 1px 3px #0001}
        .stickers{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
        .sticker-choice{height:76px;border:1px solid #e5eade;border-radius:8px;background:#f6f8f1;display:grid;place-items:center}
        .sticker-choice:hover{border-color:#8fa67d}
        .sticker-choice img{width:59px;height:59px;object-fit:contain}
        .sticker-tile{position:relative}
        .sticker-tile .sticker-choice{width:100%}
        .sticker-delete{position:absolute;right:2px;top:2px;width:23px;height:23px;background:#fffefa;border:1px solid var(--line);border-radius:6px}
        .sticker-delete svg{width:13px;height:13px}
        .layers{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:5}
        .item{position:absolute;pointer-events:auto;touch-action:none;user-select:none;cursor:grab;padding:0;border:1px solid transparent;display:flex;align-items:center;justify-content:center;background:none}
        .item img{width:100%;height:100%;object-fit:contain;pointer-events:none}
        .item.selected{border:1px dashed #819c6e;border-radius:3px}
        .item:active{cursor:grabbing}
        .item.text-box{height:auto!important;min-height:0;min-width:0;max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere;text-align:left;justify-content:flex-start;font-family:var(--body-font);line-height:1.5;padding:0;background:none}
        .item.text-box>span:first-child{width:100%;pointer-events:none}
        .text-resize{display:none;position:absolute;top:0;bottom:0;width:10px;cursor:ew-resize;touch-action:none}
        .selected>.text-resize{display:block}
        .text-resize[data-side=left]{left:-5px}
        .text-resize[data-side=right]{right:-5px}
        .text-resize:after{content:"";position:absolute;left:3px;top:calc(50% - 7px);width:4px;height:14px;background:#76906c;border:1px solid #fff;border-radius:3px}
        .selection-menu{position:fixed;z-index:40;background:#fffefa;border:1px solid var(--line);border-radius:11px;padding:6px;box-shadow:0 5px 22px #29391e26;max-width:calc(100vw - 16px)}
        .selection-actions{display:flex;gap:1px}
        .selection-actions button{display:flex;flex-direction:column;align-items:center;gap:5px;justify-content:center;width:56px;height:51px;font-size:10px;color:#66785a;border-radius:6px}
        .selection-actions button:hover{background:#eef4e6}
        .selection-actions svg{width:18px;height:18px}
        .selection-colors{display:flex;gap:12px;align-items:center;border-top:1px solid var(--line);padding:10px 7px 4px;margin-top:4px}
        .selection-colors .swatch{width:17px;height:17px}
        .selection-colors span{font-size:9px;color:#8d997e}
        .selection-count{margin-left:auto}
        [data-rk-mark=highlight]{background:var(--mark-wash);box-decoration-break:clone;-webkit-box-decoration-break:clone}
        [data-rk-mark=underline]{text-decoration:underline;text-decoration-color:var(--mark-color);text-decoration-thickness:1.5px;text-underline-offset:4px}
        [data-rk-mark=mask]{color:transparent!important;fill:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;background-image:var(--mask-pattern);border-radius:2px}
        [data-rk-mark=mask] *{color:transparent!important;fill:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}
        .item-controls{position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:24;display:flex;align-items:center;gap:12px;background:#fffefa;border:1px solid var(--line);padding:9px 11px;border-radius:11px;box-shadow:0 3px 18px #29391e15}
        .item-controls label{display:flex;align-items:center;gap:7px;font-size:10px;color:#829172;white-space:nowrap}
        .item-controls input{width:62px}
        .item-controls .icon{width:27px;height:27px}
        .item-controls svg{width:16px;height:16px}
        .zoom{position:fixed;right:14px;bottom:12px;z-index:20;display:flex;align-items:center;padding:1px 3px;background:#fffefaeb;border:1px solid var(--line);border-radius:8px}
        .zoom .icon{width:30px;height:30px}
        .zoom svg{width:14px;height:14px}
        .zoom-value{width:48px;font-size:11px;font-variant-numeric:tabular-nums;color:#758567}
        .notice{position:fixed;top:auto;right:auto;margin:0;overflow:visible;bottom:15px;left:50%;transform:translateX(-50%);z-index:100;max-width:calc(100vw - 170px);display:flex;align-items:center;gap:12px;border:1px solid #d9e2ce;padding:10px 13px;border-radius:9px;background:#fffefa;color:#6b7d5d;box-shadow:0 3px 18px #24331b14;font-size:12px;overflow-wrap:anywhere}
        .notice.error{border-color:#e4bdb4;color:#994a3a}
        .notice button{flex-shrink:0;width:22px;height:22px;padding:3px}
        .notice svg{width:16px;height:16px}
        .busy{position:fixed;inset:0;display:grid;place-items:center;z-index:80;background:#eff3e8;font-size:13px;color:#5b7350}
        .busy>div{padding:18px 24px;background:#fffefa;border:1px solid var(--line);border-radius:12px}
        .dialog{width:390px;max-width:calc(100vw - 24px);max-height:calc(100dvh - 30px);overflow:auto;border:1px solid var(--line);border-radius:15px;padding:23px;background:#fffefa;color:var(--ink);box-shadow:0 20px 80px #14210b30}
        .dialog::backdrop{background:#24311c44;backdrop-filter:blur(3px)}
        .dialog-head h2{font-size:16px;font-weight:600;margin:0}
        .quote{max-height:100px;overflow:auto;background:#eef3e7;padding:12px;border-radius:6px;font-size:12px;color:#7a8c6d;overflow-wrap:anywhere}
        .check{display:flex;gap:7px;align-items:center;font-size:11px;color:#839274;margin-top:12px}
        .check input{accent-color:var(--accent)}
        .result{width:490px}
        #download,#copy-image{position:relative;padding-left:38px;padding-right:38px}
        #download[aria-busy=true]:after,#copy-image[aria-busy=true]:after{content:"";position:absolute;right:13px;width:14px;height:14px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:output-spin .7s linear infinite}
        @keyframes output-spin{to{transform:rotate(360deg)}}
        .output-details{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:center;margin-top:15px}
        .output-details .status-text{min-width:0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
        .result-preview{height:310px;background:#e8ede2;border-radius:8px;padding:12px;display:flex;align-items:center;justify-content:center}
        .result-preview canvas{display:block;max-width:100%;max-height:100%;object-fit:contain}
        .number{width:60px;padding:4px 6px;border:1px solid var(--line);border-radius:5px;background:#fff;color:var(--ink)}
        .library-row{display:flex;gap:9px;align-items:center;padding-top:10px;font-size:11px;color:#869778}
        .library-row span{flex:1;overflow-wrap:anywhere}
        
        @media(max-width:650px){.dock{top:8px;max-width:calc(100vw - 72px)}
        .toolbar{height:38px;gap:0;padding:2px 3px}
        .tool{width:30px;height:32px}
        .tool svg{width:19px;height:19px}
        .separator{margin:0 3px;height:17px}
        .floating{top:12px;width:30px;height:30px;border-radius:8px}
        .floating svg{width:18px;height:18px}
        .close-editor{left:5px}
        .save{right:5px}
        .stage{top:58px;padding:0 6px 60px}
        .popover{max-height:calc(100dvh - 62px)}
        .item-controls{gap:7px;padding:8px;max-width:calc(100vw - 16px);flex-wrap:wrap;justify-content:center}
        .item-controls input{width:52px}
        .notice{bottom:58px;max-width:calc(100vw - 20px);width:max-content}
        .page-body{overflow-wrap:anywhere}
        }
        @media(max-width:350px){.tool{width:28px}.separator{margin:0 3px}}
        @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}
        }
        
    `;

    function editorHTML() {
        const tool = (id, label, name = id) => `<button class="tool" id="${id}" ${['undo', 'redo'].includes(id) ? 'disabled' : `data-panel="${id}" aria-expanded="false" aria-controls="panel-${id}"`} aria-label="${label}" title="${label}">${icon(name)}</button>`;
        const head = (label, extra = '') => `<div class="panel-head"><h2>${label}</h2><div class="actions">${extra}<button class="icon" data-close-panel aria-label="닫기">${icon('close')}</button></div></div>`;
        const toggle = (id, label, checked = true) => `<label class="toggle"><span>${label}</span><input id="${id}" type="checkbox" ${checked ? 'checked' : ''}><span class="switch" aria-hidden="true"></span></label>`;
        const range = (id, label, min, max, step) => `<label class="range-label" for="${id}"><span>${label}</span><output id="${id}-value"></output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}">`;
        const swatches = (target, colors, label) => `<div class="swatches">${(target !== 'pattern' && target !== 'text' ? [null, ...colors] : colors).map(color => `<button type="button" class="swatch" data-color-target="${target}" data-color="${color}" style="--color:${color || 'transparent'}" aria-label="${color ? `${label} ${color}` : '지정 안 함'}" title="${color || '지정 안 함'}" aria-pressed="false"></button>`).join('')}<input type="color" id="${target}-color" aria-label="${label} 직접 지정" title="직접 지정"></div>`;
        const textColor = (target, label) => `<div class="field">${label}</div>${swatches(target, TEXT_COLORS, label)}`;
        return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>로그 편집</title><style>${EDITOR_CSS}</style><style id="source-fonts"></style><style id="loaded-fonts"></style></head><body>
            <button class="icon floating close-editor" id="close-editor" aria-label="편집기 닫기" title="편집기 닫기">${icon('close')}</button>
            <button class="icon floating save" id="export" aria-label="이미지 저장" title="이미지 저장">${icon('download')}</button>
            <div class="dock"><nav class="toolbar" aria-label="편집 도구">${tool('undo', '실행 취소')}${tool('redo', '다시 실행')}<span class="separator"></span>${tool('theme', '테마')}${tool('source', '대화')}${tool('paper', '배경')}${tool('font', '글자')}<span class="separator"></span>${tool('title', '제목')}${tool('sticker', '스티커')}${tool('text', '텍스트 상자')}</nav>
            <section class="popover" id="panel-theme" hidden>${head('테마')}<div class="field">기본 테마</div><div class="theme-grid" id="default-themes"></div><div class="settings-section"><div class="panel-head"><h2>사용자 테마</h2><button class="icon" id="add-theme" aria-label="현재 설정을 테마로 등록" title="현재 설정을 테마로 등록">${icon('plus')}</button></div><form id="theme-form" hidden><label class="field" for="theme-name">테마 이름</label><input class="input" id="theme-name" maxlength="60" required><div class="row" style="margin:10px 0"><button class="secondary" id="cancel-theme" type="button">취소</button><button class="primary" type="submit">등록</button></div></form><div class="status-text" id="empty-themes">등록한 테마가 없습니다.</div><div class="theme-grid" id="user-themes"></div></div></section>
            <section class="popover" id="panel-source" hidden>${head('대화')}${toggle('show-user', '유저 입력')}${toggle('show-code', '코드블럭')}${toggle('show-images', '이미지')}${toggle('show-dividers', '가름선')}${toggle('show-roles', '역할명')}<div class="settings-section"><label class="field" for="user-label">유저 문구</label><input class="input" id="user-label" maxlength="60"><label class="field" for="character-label">캐릭터 문구</label><input class="input" id="character-label" maxlength="60"><div class="field" id="divider-label">가름선 디자인</div><div class="divider-options" id="divider-options" role="group" aria-labelledby="divider-label">${[['line', '실선'], ['double', '이중선'], ['dashed', '점선'], ['diamond', '다이아몬드']].map(([id, label]) => `<button type="button" class="divider-choice" data-divider-choice="${id}" data-divider="${id}" aria-pressed="false"><span class="divider-preview" aria-hidden="true"><span class="divider-sample"></span></span><span>${label}</span></button>`).join('')}</div></div></section>
            <section class="popover" id="panel-paper" hidden>${head('배경')}<div class="pattern-grid" id="patterns"></div><div class="field">종이 색</div>${swatches('paper', ['#17191c', '#fff8e6', '#ffffff', '#edf2e9', '#f7e9e5'], '종이 색')}<fieldset id="pattern-colors"><legend class="field">무늬 색</legend>${swatches('pattern', ['#91ac98', '#9eb9d4', '#cd9f8b', '#b3a0c2', '#b6a084'], '무늬 색')}${range('pattern-opacity', '무늬 농도', 0, 1, .05)}</fieldset><label class="upload">${icon('image')}배경 사진<input id="background-file" type="file" accept="image/*" hidden></label><button class="secondary wide" id="remove-background" hidden>사진 제거</button></section>
            <section class="popover" id="panel-font" hidden>${head('글자·간격·여백', `<button class="icon" id="reset-font" aria-label="글자·간격·여백 초기화" title="글자·간격·여백 초기화">${icon('reset')}</button>`)}<label class="field" for="font-family">본문 글꼴</label><div class="row"><select id="font-family" class="input"></select><button class="icon" id="add-font" aria-label="웹폰트 추가" title="웹폰트 추가">${icon('plus')}</button></div><div class="font-preview" id="font-preview">가나다라마바사 ABC 123</div><div class="status-text" id="font-status" role="status"></div>${textColor('narration', '지문 색')}${textColor('dialogue', '대사 색')}${range('font-size', '글자 크기', 12, 30, 1)}${range('letter-spacing', '자간', -.05, .15, .01)}${range('line-height', '줄 간격', 1.2, 2.8, .05)}${range('paragraph-spacing', '문단 간격', 0, 2.4, .05)}${range('page-padding', '종이 여백', 0, 80, 1)}</section>
            <section class="popover" id="panel-title" hidden>${head('제목')}<form id="title-form"><label class="field" for="title-value">제목</label><textarea id="title-value" class="input" rows="4" placeholder="제목 입력"></textarea><div class="row" style="margin-top:14px"><button class="secondary" id="remove-title" type="button">${icon('trash')}삭제</button><button class="primary" type="submit" style="flex:1">적용</button></div></form></section>
            <section class="popover" id="panel-sticker" hidden>${head('스티커')}<div class="tabs" id="sticker-tabs"></div><div class="stickers" id="stickers"></div><label class="upload wide">${icon('plus')}스티커 등록<input id="sticker-file" type="file" accept="image/*" hidden></label></section>
            <section class="popover" id="panel-text" hidden>${head('텍스트 상자')}<form id="text-form"><label class="field" for="text-value">내용</label><textarea class="input" id="text-value" rows="3" placeholder="텍스트 입력" required></textarea>${textColor('text', '글자색')}${range('text-size', '글자 크기', 12, 60, 1)}<button class="primary wide" id="text-apply" type="submit">추가</button><button class="secondary wide" id="new-text" type="button" hidden>새 텍스트 추가</button></form></section></div>
            <main class="stage" id="stage"><div class="sizer" id="sizer"><article class="page" id="page"><div class="page-body" id="page-body"><h1 class="heading" id="heading" hidden></h1><div id="messages"></div></div><div class="layers" id="layers"></div></article></div></main>
            <div class="zoom"><button class="icon" id="zoom-out" aria-label="축소">${icon('minus')}</button><button class="zoom-value" id="zoom-fit" title="화면 맞춤">100%</button><button class="icon" id="zoom-in" aria-label="확대">${icon('plus')}</button></div>
            <div class="selection-menu" id="selection-menu" hidden role="toolbar" aria-label="선택한 텍스트 편집"><div class="selection-actions">${[['highlight', '형광펜'], ['underline', '밑줄'], ['mask', '가리기'], ['replace', '치환'], ['clear', '지우기']].map(([id, label]) => `<button data-mark-action="${id}">${icon(id === 'clear' ? 'eraser' : id)}${label}</button>`).join('')}</div><div class="selection-colors"><span>색상</span>${['#efd67b', '#a8c7a1', '#deb0bd', '#abc8df', '#c3b1dc', '#246b65', '#354b87'].map((color, i) => `<button class="swatch" data-mark-color="${color}" style="--color:${color}" aria-label="${color}" aria-pressed="${i === 0}"></button>`).join('')}<span class="selection-count" id="selection-count"></span></div></div>
            <div class="item-controls" id="item-controls" hidden><label>크기<input id="item-size" type="range" min="32" max="240"></label><label>회전<input id="item-rotation" type="range" min="-180" max="180"></label><button class="icon" id="edit-text" aria-label="텍스트 편집" title="텍스트 편집" hidden>${icon('text')}</button><button class="icon" id="item-front" aria-label="앞으로" title="앞으로">${icon('front')}</button><button class="icon" id="item-back" aria-label="뒤로" title="뒤로">${icon('back')}</button><button class="icon" id="item-delete" aria-label="삭제" title="삭제">${icon('trash')}</button><button class="icon" id="item-deselect" aria-label="선택 해제">${icon('close')}</button></div>
            <dialog class="dialog" id="replace-dialog"><form id="replace-form"><div class="dialog-head"><h2>치환</h2><button class="icon" type="button" data-close-dialog aria-label="닫기">${icon('close')}</button></div><div class="quote" id="replace-original"></div><label class="field" for="replace-value">바꿀 말</label><input class="input" id="replace-value" autocomplete="off"><label class="check"><input id="replace-all" type="checkbox">같은 말 모두 바꾸기</label><button class="primary wide" type="submit">적용</button></form></dialog>
            <dialog class="dialog" id="font-dialog"><div class="dialog-head"><h2>웹폰트 추가</h2><button class="icon" data-close-dialog aria-label="닫기">${icon('close')}</button></div><form id="font-form"><label class="field" for="font-name">이름</label><input class="input" id="font-name" required maxlength="60"><label class="field" for="font-source">폰트 파일 URL 또는 @font-face</label><textarea class="input" id="font-source" rows="4" required placeholder="https://…/font.woff2"></textarea><button class="primary wide" id="font-submit" type="submit">추가·적용</button><div class="status-text" id="font-form-status" role="status"></div></form><div id="font-library"></div></dialog>
            <dialog class="dialog result" id="result-dialog"><div class="dialog-head"><h2>이미지 저장</h2><button class="icon" data-close-dialog aria-label="닫기">${icon('close')}</button></div><div class="result-preview" id="result-preview"></div>${range('output-scale', '이미지 크기', 50, 200, 5)}<div class="output-details"><select class="input" id="output-format"><option value="webp">WebP · 용량 절약</option><option value="png">PNG · 무손실</option></select><span class="status-text" id="output-size"></span></div><button class="primary wide" id="download">${icon('download')}이미지 저장</button><button class="secondary wide" id="copy-image">클립보드 복사</button></dialog>
            <div class="notice" id="notice" hidden popover="manual" role="status"><span id="notice-value"></span><button data-dismiss-notice aria-label="알림 닫기">${icon('close')}</button></div><div class="busy" id="busy" hidden><div id="busy-value">준비 중…</div></div>
            </body></html>`;
    }

    async function openEditor(entries) {
        if (editor) return;
        const frame = document.createElement('iframe'); frame.title = '로그 편집기';
        frame.style.cssText = 'position:fixed;left:50%;top:48px;transform:translateX(-50%);width:min(880px,calc(100% - clamp(16px,4vw,48px)));height:calc(100% - 48px - clamp(8px,2vw,24px));box-sizing:border-box;border:1px solid #cad3c3;border-radius:14px;box-shadow:0 8px 45px #0004;z-index:2147483647;background:#eef0eb;';
        const previousOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden'; document.body.appendChild(frame); editor = frame; syncLaunch();
        const d = frame.contentDocument, w = frame.contentWindow;
        d.open(); d.write(editorHTML()); d.close();
        const $ = selector => d.querySelector(selector), $$ = selector => [...d.querySelectorAll(selector)];
        const page = $('#page'), messages = $('#messages'), layers = $('#layers'), stage = $('#stage');
        const controller = new AbortController();
        let busy = false, activeItem = null, selectedRange = null, zoom = 1, fit = true, fontGeneration = 0, exported = false, selectionPointer = '';
        let resultMarkup = '', resultHeight = 0, resultBlob = null, resultURL = '', markColor = '#efd67b', selectionTimer, historyTimer, noticeTimer, resizeTimer, outputGeneration = 0, zoomFrame = 0;
        const context = { families: new Set(), fontRoots: new WeakSet([document]), sheets: new Set([...document.styleSheets, ...(document.adoptedStyleSheets || [])]), notes: new Set() };
        const loadedFontRules = new Set(), fontPromises = new Map();
        const sharedSourceFaces = [];
        let sourcePaper = '#ffffff';
        for (let node = entries[0].bubble; node; node = node.parentElement) {
            const color = getComputedStyle(node).backgroundColor;
            if (color !== 'transparent' && !/rgba\([^)]*,\s*0\s*\)/.test(color)) { sourcePaper = compatibleColors(color, context); break; }
        }
        const sourceInk = compatibleColors(getComputedStyle(entries[0].bubble).color, context);
        const baseFontSize = 16, originalLineHeight = 1.5, width = 760;
        const config = {
            paper: null, narrationColor: null, dialogueColor: null, pattern: 'plain', patternColor: '#8f9d91', patternOpacity: 1, photo: '',
            font: 'source', fontSize: baseFontSize, lineHeight: originalLineHeight, letterSpacing: -.01, paragraphSpacing: 1.2, padding: 46,
            user: 'USER', character: 'CHARACTER', divider: 'line', showUser: true, showCode: true, showImages: true, showDividers: true, showRoles: true,
            title: '',
        };
        const themeDefaults = themeSettings(config);
        const defaultThemes = [
            { name: '미지정 · 원문 유지', settings: { ...themeDefaults } },
            { name: '크림 노트', settings: { ...themeDefaults, paper: '#fff8e6', pattern: 'ruled', patternColor: '#b6a084', patternOpacity: .5, font: 'serif', narrationColor: '#7b7063', dialogueColor: '#3f362d', showRoles: false, padding: 50 } },
            { name: '장미 편지', settings: { ...themeDefaults, paper: '#f7e9e5', pattern: 'plain', patternColor: '#cd9f8b', font: 'batang', narrationColor: '#98736f', dialogueColor: '#593b40', divider: 'double', showRoles: false, padding: 54 } },
            { name: '밤의 서재', settings: { ...themeDefaults, paper: '#17191c', pattern: 'grain', patternColor: '#91ac98', patternOpacity: .4, font: 'serif', narrationColor: '#a3a3a8', dialogueColor: '#f4f2ed', divider: 'line', lineHeight: 1.7, padding: 50 } },
        ];
        const themeCards = new Map();
        const history = []; let historyIndex = -1;
        function on(element, name, action, options = {}) { element.addEventListener(name, action, { ...options, signal: controller.signal }); }
        function raiseNotice() {
            const notice = $('#notice'), parent = $$('dialog[open]').at(-1) || d.body;
            if (notice.parentElement !== parent) parent.appendChild(notice);
            if (notice.matches(':popover-open')) notice.hidePopover();
            if (!notice.hidden) notice.showPopover();
        }
        function showDialog(dialog) { dialog.showModal(); raiseNotice(); }
        function notify(text, error = false, duration = 0) {
            clearTimeout(noticeTimer); $('#notice-value').textContent = text; $('#notice').classList.toggle('error', error); $('#notice').hidden = !text; raiseNotice();
            if (duration) noticeTimer = setTimeout(() => { if (frame.isConnected) { $('#notice').hidden = true; raiseNotice(); } }, duration);
        }
        function setBusy(value, text = '') { busy = value; $('#busy').hidden = !value; $('#busy-value').textContent = text; $('#export').disabled = value; }
        function close(force = false) {
            if (!force && historyIndex > 0 && !exported && !w.confirm('이미지로 저장하지 않은 편집 내용은 사라집니다. 닫을까요?')) return;
            ++fontGeneration; ++outputGeneration; controller.abort(); clearTimeout(selectionTimer); clearTimeout(historyTimer); clearTimeout(noticeTimer); clearTimeout(resizeTimer);
            resizeObserver.disconnect(); w.cancelAnimationFrame(zoomFrame); if (resultURL) URL.revokeObjectURL(resultURL);
            resultMarkup = ''; resultBlob = null;
            context.cancelled = true;
            frame.remove(); editor = null; syncLaunch(); launch.disabled = false; resourceCache.clear(); document.documentElement.style.overflow = previousOverflow;
        }
        function updateZoom() {
            if (!frame.isConnected || zoomFrame) return;
            zoomFrame = w.requestAnimationFrame(() => {
                zoomFrame = 0;
                if (!frame.isConnected) return;
                const padding = w.getComputedStyle(stage);
                if (fit) zoom = Math.max(.1, Math.floor(Math.min(1, (stage.clientWidth - parseFloat(padding.paddingLeft) - parseFloat(padding.paddingRight) - 2) / width) * 10000) / 10000);
                const transform = `scale(${zoom})`, scaledWidth = `${Math.ceil(width * zoom)}px`, scaledHeight = `${Math.ceil(page.offsetHeight * zoom)}px`;
                const sizer = $('#sizer');
                if (page.style.transform === transform && sizer.style.width === scaledWidth && sizer.style.height === scaledHeight) return;
                page.style.transform = transform; sizer.style.width = scaledWidth; sizer.style.height = scaledHeight;
                $('#zoom-fit').textContent = `${Math.round(zoom * 100)}%`;
                hideSelection();
            });
        }
        const resizeObserver = new ResizeObserver(updateZoom); resizeObserver.observe(page); resizeObserver.observe(stage);
        function selectButtons(container, selector, value, key) {
            container.querySelectorAll(selector).forEach(button => button.setAttribute('aria-pressed', String(button.dataset[key] === value)));
        }
        function refreshControls() {
            for (const [button, settings] of themeCards) button.setAttribute('aria-pressed', String(THEME_KEYS.every(key => config[key] === settings[key])));
            selectButtons($('#patterns'), '[data-pattern]', config.pattern, 'pattern');
            for (const [name, color] of [['paper', config.paper], ['pattern', config.patternColor], ['narration', config.narrationColor], ['dialogue', config.dialogueColor]]) {
                $(`#${name}-color`).value = color || (name === 'paper' ? sourcePaper : name === 'narration' ? NARRATION_COLOR : DIALOGUE_COLOR);
                $$(`[data-color-target="${name}"]`).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === String(color))));
            }
            $('#pattern-colors').disabled = config.pattern === 'plain' || !!config.photo;
            $('#remove-background').hidden = !config.photo;
            $('#font-family').value = config.font;
            $('#font-preview').style.fontFamily = FONTS[config.font]?.family || FONTS.serif.family;
            const values = { 'font-size': config.fontSize, 'line-height': config.lineHeight ?? originalLineHeight, 'letter-spacing': config.letterSpacing ?? 0, 'pattern-opacity': config.patternOpacity, 'paragraph-spacing': config.paragraphSpacing, 'page-padding': config.padding };
            for (const [id, value] of Object.entries(values)) { $(`#${id}`).value = value; $(`#${id}-value`).textContent = Number(Number(value).toFixed(2)); }
            for (const [id, key] of [['show-user', 'showUser'], ['show-code', 'showCode'], ['show-images', 'showImages'], ['show-dividers', 'showDividers'], ['show-roles', 'showRoles']]) $(`#${id}`).checked = config[key];
            $('#user-label').value = config.user; $('#character-label').value = config.character;
            selectButtons($('#divider-options'), '[data-divider-choice]', config.divider, 'dividerChoice');
            $('#title-value').value = config.title; $('#remove-title').disabled = !config.title;
        }
        function render() {
            const value = config;
            page.classList.toggle('colored-paper', !!value.paper);
            page.dataset.divider = value.divider; page.style.width = `${width}px`;
            if (value.paper) page.style.setProperty('--paper-color', value.paper); else page.style.removeProperty('--paper-color');
            page.style.backgroundColor = value.paper || sourcePaper;
            page.style.setProperty('--body-color', value.dialogueColor || sourceInk);
            page.style.setProperty('--body-font', FONTS[value.font]?.family || FONTS.serif.family);
            if (value.font === 'source') page.style.removeProperty('--log-font'); else page.style.setProperty('--log-font', FONTS[value.font].family);
            page.style.setProperty('--log-size', `${value.fontSize}px`);
            for (const kind of ['narration', 'dialogue']) {
                const color = value[`${kind}Color`];
                if (color) page.style.setProperty(`--${kind}-color`, color); else page.style.removeProperty(`--${kind}-color`);
            }
            if (value.narrationColor) page.style.setProperty('--narration-opacity', '1'); else page.style.removeProperty('--narration-opacity');
            page.style.setProperty('--log-line-height', String(value.lineHeight));
            page.style.setProperty('--log-letter-spacing', `${value.letterSpacing}em`);
            if (value.lineHeight === originalLineHeight) page.style.removeProperty('--decor-line-height'); else page.style.setProperty('--decor-line-height', String(value.lineHeight));
            if (value.letterSpacing === -.01) page.style.removeProperty('--decor-letter-spacing'); else page.style.setProperty('--decor-letter-spacing', `${value.letterSpacing}em`);
            page.style.setProperty('--log-paragraph-spacing', `${value.paragraphSpacing}em`);
            page.style.setProperty('--page-padding', `${value.padding}px`);
            const tile = patternTile(value.pattern, value.patternColor, value.patternOpacity);
            page.style.backgroundImage = value.photo ? `url("${value.photo}")` : tile ? `url("${tile}")` : 'none';
            page.style.backgroundSize = value.photo ? 'cover' : 'auto';
            for (const [className, key] of [['hide-user', 'showUser'], ['hide-code', 'showCode'], ['hide-images', 'showImages'], ['hide-dividers', 'showDividers'], ['hide-roles', 'showRoles']]) page.classList.toggle(className, !config[key]);
            $('#heading').textContent = config.title; $('#heading').hidden = !config.title.trim();
            messages.querySelectorAll('.role').forEach(label => { label.textContent = label.parentElement.dataset.role === 'user' ? value.user : value.character; label.hidden = !label.textContent; });
            let firstVisible = true;
            for (const section of messages.children) {
                if (!config.showUser && section.dataset.role === 'user') continue;
                if (!config.showImages && section.dataset.rkOnly === 'image') continue;
                if (!config.showCode && section.dataset.rkOnly === 'code') continue;
                const rule = section.querySelector(':scope > .rule'); if (rule) rule.hidden = firstVisible;
                firstVisible = false;
            }
            refreshControls(); updateZoom(); constrainItems();
        }
        function snapshot() {
            const clone = layers.cloneNode(true); clone.querySelectorAll('.selected').forEach(item => item.classList.remove('selected'));
            return { config: JSON.parse(JSON.stringify(config)), messages: messages.innerHTML, items: clone.innerHTML };
        }
        function commit() {
            clearTimeout(historyTimer);
            const value = JSON.stringify(snapshot());
            historyTimer = null;
            if (history[historyIndex] === value) return;
            history.splice(historyIndex + 1); history.push(value); exported = false;
            while (history.length > 1 && (history.length > MAX_HISTORY || history.reduce((sum, item) => sum + item.length * 2, 0) > 16000000)) history.shift();
            historyIndex = history.length - 1; historyButtons();
        }
        function scheduleHistory() { clearTimeout(historyTimer); historyTimer = setTimeout(commit, 350); }
        function historyButtons() { $('#undo').disabled = historyIndex <= 0; $('#redo').disabled = historyIndex >= history.length - 1; }
        function restore(index) {
            const state = JSON.parse(history[index]); Object.assign(config, state.config); messages.innerHTML = state.messages; layers.innerHTML = state.items;
            if (!FONTS[config.font]) config.font = 'source';
            historyIndex = index; exported = false; deselectItem(); selectedRange = null; w.getSelection()?.removeAllRanges(); render(); historyButtons(); prepareFont(config.font);
        }
        function closePanels() { $$('.popover').forEach(panel => { panel.hidden = true; }); $$('[data-panel]').forEach(button => button.setAttribute('aria-expanded', 'false')); }
        function openPanel(name) {
            const panel = $(`#panel-${name}`), opening = panel.hidden; closePanels(); hideSelection();
            if (name === 'text') textControls(); else deselectItem();
            panel.hidden = !opening; $(`[data-panel="${name}"]`).setAttribute('aria-expanded', String(opening));
        }
        async function prepareFont(id) {
            const generation = ++fontGeneration;
            $('#font-status').textContent = '글꼴을 불러오는 중…';
            try {
                await ensureFont(id);
                if (frame.isConnected && generation === fontGeneration) { $('#font-status').textContent = ''; updateZoom(); }
            } catch (error) { if (frame.isConnected && generation === fontGeneration) notify(error.message, true); }
        }
        async function selectFont(id) {
            const generation = ++fontGeneration;
            $('#font-status').textContent = '글꼴을 불러오는 중…';
            try {
                await ensureFont(id);
                if (!frame.isConnected || generation !== fontGeneration) return;
                choose('font', id); $('#font-status').textContent = '';
            } catch (error) {
                if (frame.isConnected && generation === fontGeneration) { $('#font-family').value = config.font; $('#font-status').textContent = ''; notify(error.message, true); }
            }
        }
        async function ensureFont(id, record = null, useGM = false) {
            const font = record ? { family: `"Rokku_${record.id}",sans-serif`, custom: record } : FONTS[id];
            if (!font || id === 'source') return;
            const text = page.textContent + '가나다라마바사 ABC 123';
            const key = `${id}:${useGM ? 'gm:' : ''}${[...new Set([...text])].sort().join('')}`;
            if (!fontPromises.has(key)) fontPromises.set(key, (async () => {
                let blocks;
                if (font.web) {
                    const url = `https://fonts.googleapis.com/css2?family=${font.web.split(' ').join('+')}:wght@400&display=swap`;
                    blocks = fontBlocks(await requestResource(url, 'text', useGM), url);
                } else {
                    const source = font.custom.source.trim();
                    if (/^https?:\/\//i.test(source)) {
                        const url = new URL(source); blocks = [{ body: `src:url("${url.href.replace(/"/g, '%22')}");`, base: url.href }];
                    } else blocks = fontBlocks(source, location.href);
                    if (!blocks.length) throw new Error('폰트 파일 URL 또는 @font-face CSS를 입력해주세요.');
                }
                const rules = (await Promise.all(blocks.map(block => embeddedFont(block, text, font.custom ? `Rokku_${font.custom.id}` : '', useGM)))).filter(Boolean);
                if (!record && font.custom && !FONTS[id]) return;
                if (!rules.length) throw new Error('입력한 CSS에서 사용할 수 있는 글꼴을 찾지 못했습니다.');
                const fresh = rules.filter(rule => !loadedFontRules.has(rule));
                if (fresh.length) { $('#loaded-fonts').appendChild(d.createTextNode(fresh.join('\n'))); fresh.forEach(rule => loadedFontRules.add(rule)); }
                const family = font.custom ? `Rokku_${font.custom.id}` : font.web;
                const loaded = await Promise.all(['normal 400', 'normal 700', 'italic 400'].map(style => d.fonts.load(`${style} 16px ${JSON.stringify(family)}`, text)));
                if (!loaded.some(faces => faces.length)) throw new Error('글꼴을 불러오지 못했습니다. 폰트 파일 주소를 확인해주세요.');
                await d.fonts.ready;
            })().catch(error => { fontPromises.delete(key); throw error; }));
            return fontPromises.get(key);
        }
        function fontOptions() {
            $('#font-family').replaceChildren(); const groups = new Map();
            for (const [id, font] of Object.entries(FONTS)) {
                if (!groups.has(font.group)) { const group = d.createElement('optgroup'); group.label = font.group; groups.set(font.group, group); $('#font-family').appendChild(group); }
                const option = d.createElement('option'); option.value = id; option.textContent = font.label; groups.get(font.group).appendChild(option);
            }
            $('#font-family').value = config.font;
            $('#font-library').replaceChildren();
            for (const record of customFonts) {
                const row = d.createElement('div'); row.className = 'library-row';
                const name = d.createElement('span'); name.textContent = record.name;
                const remove = d.createElement('button'); remove.className = 'icon'; remove.type = 'button'; remove.setAttribute('aria-label', `${record.name} 삭제`); remove.innerHTML = icon('trash');
                on(remove, 'click', () => {
                    try {
                        const next = customFonts.filter(item => item.id !== record.id); GM_setValue(FONT_KEY, next); customFonts = next;
                        ++fontGeneration; $('#font-status').textContent = '';
                        delete FONTS[record.id];
                        for (const key of fontPromises.keys()) if (key.startsWith(`${record.id}:`)) fontPromises.delete(key);
                        const family = JSON.stringify(`Rokku_${record.id}`);
                        for (const rule of loadedFontRules) if (rule.includes(family)) loadedFontRules.delete(rule);
                        for (const node of [...$('#loaded-fonts').childNodes]) if (node.textContent.includes(family)) node.remove();
                        if (config.font === record.id) { config.font = 'source'; render(); commit(); }
                        fontOptions();
                    } catch (error) { notify(`글꼴 목록을 변경하지 못했습니다. ${error.message}`, true); }
                });
                row.append(name, remove); $('#font-library').appendChild(row);
            }
        }
        function choose(key, value) { config[key] = value; render(); commit(); }
        function themeSettings(value) {
            return Object.fromEntries(THEME_KEYS.map(key => [key, value[key]]));
        }
        async function applyTheme(theme) {
            const settings = themeSettings(theme.settings);
            const missingFont = !FONTS[settings.font];
            if (missingFont) settings.font = 'source';
            const generation = ++fontGeneration;
            try {
                await ensureFont(settings.font);
                if (!frame.isConnected || generation !== fontGeneration) return;
                if (historyTimer) commit();
                Object.assign(config, settings); render(); commit();
                if (missingFont) notify('테마의 글꼴이 삭제되어 원문 유지로 적용했습니다.');
            } catch (error) { if (frame.isConnected) notify(`테마를 적용하지 못했습니다. ${error.message}`, true); }
        }
        function themeChoices() {
            themeCards.clear(); $('#default-themes').replaceChildren(); $('#user-themes').replaceChildren();
            $('#empty-themes').hidden = customThemes.length > 0;
            for (const [container, themes] of [[$('#default-themes'), defaultThemes], [$('#user-themes'), customThemes]]) {
                for (const theme of themes) {
                    const value = theme.settings;
                    const button = d.createElement('button'); button.type = 'button'; button.className = 'theme-card';
                    const sample = d.createElement('span'); sample.className = 'theme-sample'; sample.setAttribute('aria-hidden', 'true');
                    sample.style.backgroundColor = value.paper || sourcePaper;
                    const tile = patternTile(value.pattern, value.patternColor, value.patternOpacity);
                    sample.style.backgroundImage = value.photo ? `url("${value.photo}")` : tile ? `url("${tile}")` : 'none';
                    if (value.photo) sample.style.backgroundSize = 'cover';
                    sample.style.fontFamily = FONTS[value.font]?.family || FONTS.source.family;
                    const role = d.createElement('small'); role.textContent = value.character; role.hidden = !value.showRoles; role.style.color = value.narrationColor || sourceInk;
                    const text = d.createElement('strong'); text.textContent = '오늘의 이야기를 담아'; text.style.color = value.dialogueColor || sourceInk;
                    const narration = d.createElement('strong'); narration.textContent = '오래 간직할 한 장'; narration.style.color = value.narrationColor || sourceInk;
                    const name = d.createElement('span'); name.textContent = theme.name;
                    sample.append(role, text, narration); button.append(sample, name);
                    button.setAttribute('aria-pressed', String(THEME_KEYS.every(key => config[key] === value[key])));
                    on(button, 'click', () => applyTheme(theme)); themeCards.set(button, value);
                    if (themes === customThemes) {
                        const tile = d.createElement('div'); tile.className = 'theme-tile';
                        const remove = d.createElement('button'); remove.type = 'button'; remove.className = 'theme-delete';
                        remove.innerHTML = icon('trash'); remove.setAttribute('aria-label', `${theme.name} 삭제`); remove.title = '삭제';
                        let confirming = false;
                        on(remove, 'blur', () => { confirming = false; remove.innerHTML = icon('trash'); remove.setAttribute('aria-label', `${theme.name} 삭제`); remove.title = '삭제'; });
                        on(remove, 'click', () => {
                            if (!confirming) { confirming = true; remove.textContent = '삭제할까요?'; remove.setAttribute('aria-label', `${theme.name} 삭제할까요?`); remove.title = '한 번 더 누르면 삭제됩니다'; return; }
                            try {
                                const next = customThemes.filter(item => item.id !== theme.id);
                                GM_setValue(THEME_KEY, next); customThemes = next; themeChoices();
                            } catch (error) { notify(`테마를 삭제하지 못했습니다. ${error.message}`, true); }
                        });
                        tile.append(button, remove); container.appendChild(tile);
                    } else container.appendChild(button);
                }
            }
        }
        on($('#add-theme'), 'click', () => { $('#theme-form').hidden = false; $('#theme-name').focus(); });
        on($('#cancel-theme'), 'click', () => { $('#theme-form').hidden = true; $('#theme-form').reset(); });
        on($('#theme-form'), 'submit', event => {
            event.preventDefault(); const name = $('#theme-name').value.trim(); if (!name) return;
            const theme = { id: `t_${Date.now().toString(36)}`, name, settings: themeSettings(config) };
            try {
                const next = [...customThemes, theme]; GM_setValue(THEME_KEY, next); customThemes = next;
                $('#theme-form').reset(); $('#theme-form').hidden = true; themeChoices();
                notify('현재 설정을 테마로 등록했습니다.', false, 2000);
            } catch (error) { notify(`테마를 등록하지 못했습니다. ${error.message}`, true); }
        });
        function makeChoices() {
            for (const [id, label] of Object.entries(PATTERNS)) {
                const button = d.createElement('button'); button.className = 'choice'; button.dataset.pattern = id; button.setAttribute('aria-pressed', String(id === 'plain'));
                const sample = d.createElement('span'); sample.className = 'sample'; const tile = patternTile(id, '#98ad9a'); if (tile) sample.style.backgroundImage = `url("${tile}")`;
                const text = d.createElement('span'); text.textContent = label; button.append(sample, text);
                on(button, 'click', () => { config.photo = ''; choose('pattern', id); }); $('#patterns').appendChild(button);
            }
        }

        function hideSelection() { $('#selection-menu').hidden = true; }
        function selection() {
            if (busy || [...d.querySelectorAll('dialog')].some(dialog => dialog.open)) return;
            const value = w.getSelection();
            if (!value?.rangeCount || value.isCollapsed || !value.toString().trim()) { hideSelection(); return; }
            const range = value.getRangeAt(0);
            if (!$('#page-body').contains(range.startContainer) || !$('#page-body').contains(range.endContainer)) { hideSelection(); return; }
            selectedRange = range.cloneRange(); closePanels(); deselectItem();
            const rects = [...range.getClientRects()].filter(rect => rect.width && rect.height);
            if (!rects.length) return;
            const first = rects[0], last = rects[rects.length - 1], menu = $('#selection-menu');
            menu.hidden = false;
            const toolbarBottom = $('.toolbar').getBoundingClientRect().bottom + 8;
            const top = first.top - menu.offsetHeight - 10 > toolbarBottom ? first.top - menu.offsetHeight - 10 : last.bottom + 10;
            menu.style.left = `${clamp((first.left + first.right) / 2 - menu.offsetWidth / 2, 8, w.innerWidth - menu.offsetWidth - 8)}px`;
            menu.style.top = `${clamp(top, toolbarBottom, Math.max(toolbarBottom, w.innerHeight - menu.offsetHeight - 52))}px`;
            $('#selection-count').textContent = `${range.toString().length}자`;
        }
        function textSlices(range) {
            const walker = d.createTreeWalker($('#page-body'), w.NodeFilter.SHOW_TEXT), result = [];
            for (let node; (node = walker.nextNode());) {
                if (!node.length || !range.intersectsNode(node) || !node.parentElement.getClientRects().length || node.parentElement.closest('.role,[data-rk-pseudo]')) continue;
                const start = node === range.startContainer ? range.startOffset : 0, end = node === range.endContainer ? range.endOffset : node.length;
                if (end > start) result.push({ node, start, end });
            }
            return result;
        }
        function finishEdit() { selectedRange = null; w.getSelection()?.removeAllRanges(); hideSelection(); commit(); updateZoom(); }
        function annotate(kind) {
            if (!selectedRange) return;
            textSlices(selectedRange).reverse().forEach(({ node, start, end }) => {
                const range = d.createRange(); range.setStart(node, start); range.setEnd(node, end);
                const mark = node.parentElement.namespaceURI === 'http://www.w3.org/2000/svg' ? d.createElementNS('http://www.w3.org/2000/svg', 'tspan') : d.createElement('span'); mark.dataset.rkMark = kind;
                mark.style.setProperty('--mark-color', markColor); mark.style.setProperty('--mark-wash', `${markColor}7a`); range.surroundContents(mark);
            });
            finishEdit();
        }
        function splitParent(parent, selected, keep) {
            const before = parent.cloneNode(false), after = parent.cloneNode(false);
            while (parent.firstChild && parent.firstChild !== selected) before.appendChild(parent.firstChild);
            while (selected.nextSibling) after.appendChild(selected.nextSibling);
            const middle = keep ? parent.cloneNode(false) : selected;
            if (keep) middle.appendChild(selected);
            const nodes = []; if (before.hasChildNodes()) nodes.push(before); nodes.push(middle); if (after.hasChildNodes()) nodes.push(after);
            parent.replaceWith(...nodes); return middle;
        }
        function clearMarks() {
            if (!selectedRange) return;
            textSlices(selectedRange).reverse().forEach(({ node, start, end }) => {
                node.splitText(end); const selectedText = node.splitText(start);
                for (let mark; (mark = selectedText.parentElement.closest('[data-rk-mark]'));) {
                    let branch = selectedText;
                    while (branch.parentElement !== mark) branch = splitParent(branch.parentElement, branch, true);
                    splitParent(mark, branch, false);
                }
            });
            finishEdit();
        }
        function allMatches(text) {
            const result = [];
            for (const root of messages.querySelectorAll('.log')) {
                const walker = d.createTreeWalker(root, w.NodeFilter.SHOW_TEXT), nodes = []; let full = '';
                for (let node; (node = walker.nextNode());) {
                    if (node.parentElement.closest('[data-rk-pseudo]')) continue;
                    nodes.push({ node, start: full.length }); full += node.data;
                }
                let at = 0;
                while ((at = full.indexOf(text, at)) !== -1) {
                    const start = nodes.find(entry => at >= entry.start && at < entry.start + entry.node.length);
                    const endAt = at + text.length;
                    const end = nodes.find(entry => endAt > entry.start && endAt <= entry.start + entry.node.length);
                    if (start && end) { const range = d.createRange(); range.setStart(start.node, at - start.start); range.setEnd(end.node, endAt - end.start); result.push(range); }
                    at += text.length;
                }
            }
            return result;
        }
        function deselectItem() { activeItem?.classList.remove('selected'); activeItem = null; $('#item-controls').hidden = true; }
        function selectItem(item) {
            deselectItem(); activeItem = item; item.classList.add('selected'); $('#item-controls').hidden = false;
            const isText = item.dataset.kind === 'text';
            $('#item-size').min = isText ? 12 : 32; $('#item-size').max = isText ? 60 : 240;
            $('#item-size').value = isText ? parseFloat(item.style.fontSize) : item.offsetWidth;
            $('#item-rotation').value = item.dataset.rotation || 0; $('#edit-text').hidden = !isText; hideSelection();
        }
        function constrainItems() {
            for (const item of layers.children) {
                item.style.left = `${clamp(parseFloat(item.style.left) || 0, 0, Math.max(0, page.offsetWidth - item.offsetWidth))}px`;
                item.style.top = `${clamp(parseFloat(item.style.top) || 0, 0, Math.max(0, page.offsetHeight - item.offsetHeight))}px`;
            }
        }
        function addItem(kind, value, options = {}) {
            const item = d.createElement('button'); item.type = 'button'; item.className = kind === 'text' ? 'item text-box' : 'item'; item.dataset.kind = kind;
            item.setAttribute('aria-label', kind === 'text' ? '텍스트 상자' : options.label || '스티커');
            if (kind === 'text') { const span = d.createElement('span'); span.textContent = value; item.appendChild(span); styleText(item, options); }
            else { const image = d.createElement('img'); image.src = value; image.alt = ''; image.draggable = false; item.appendChild(image); }
            item.style.width = kind === 'text' ? 'max-content' : '88px'; item.style.height = kind === 'text' ? 'auto' : '88px';
            item.dataset.rotation = kind === 'text' ? '0' : '-6'; item.style.transform = `rotate(${item.dataset.rotation}deg)`;
            layers.appendChild(item);
            if (kind === 'text') {
                for (const side of ['left', 'right']) {
                    const handle = d.createElement('span'); handle.className = 'text-resize'; handle.dataset.side = side; handle.setAttribute('aria-hidden', 'true'); item.appendChild(handle);
                }
            }
            item.style.left = `${Math.max(8, page.offsetWidth - item.offsetWidth - 24)}px`;
            item.style.top = `${clamp((w.innerHeight * .45 - page.getBoundingClientRect().top) / zoom, 10, Math.max(10, page.offsetHeight - item.offsetHeight - 10))}px`;
            closePanels(); selectItem(item); constrainItems(); commit();
            if (kind === 'text' && config.font === 'source') prepareFont('serif');
        }
        function styleText(item, options) {
            item.dataset.color = options.color;
            item.style.color = options.color; item.style.fontSize = `${options.size}px`;
        }
        function textControls(fresh = false) {
            const target = !fresh && activeItem?.dataset.kind === 'text' ? activeItem : null;
            $('#text-value').value = target?.textContent || ''; $('#text-color').value = target?.dataset.color || DIALOGUE_COLOR;
            $$('[data-color-target="text"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === $('#text-color').value)));
            $('#text-size').value = target ? parseFloat(target.style.fontSize) : 20; $('#text-size-value').textContent = $('#text-size').value;
            $('#text-apply').textContent = target ? '적용' : '추가'; $('#new-text').hidden = !target;
        }
        function editText() { closePanels(); textControls(); $('#panel-text').hidden = false; $('[data-panel="text"]').setAttribute('aria-expanded', 'true'); $('#text-value').focus(); }
        function showStickers(group) {
            $('#stickers').replaceChildren(); selectButtons($('#sticker-tabs'), '[data-group]', group, 'group');
            const stickers = group === '내 스티커' ? customStickers.map(item => ({ ...item, label: item.name })) : Object.values(STICKERS).filter(item => item.group === group);
            for (const sticker of stickers) {
                const button = d.createElement('button'); button.className = 'sticker-choice'; button.title = sticker.label; button.setAttribute('aria-label', sticker.label);
                const image = d.createElement('img'); image.src = sticker.data || svgData(svg(sticker.body)); image.alt = ''; button.appendChild(image);
                on(button, 'click', () => addItem('sticker', image.src, { label: sticker.label }));
                if (group === '내 스티커') {
                    const tile = d.createElement('div'); tile.className = 'sticker-tile';
                    const remove = d.createElement('button'); remove.className = 'icon sticker-delete'; remove.setAttribute('aria-label', `${sticker.label} 삭제`); remove.title = '삭제'; remove.innerHTML = icon('trash');
                    on(remove, 'click', () => {
                        try {
                            const next = customStickers.filter(item => item.id !== sticker.id); GM_setValue(STICKER_KEY, next); customStickers = next; showStickers(group);
                        } catch (error) { notify(`스티커를 삭제하지 못했습니다. ${error.message}`, true); }
                    });
                    tile.append(button, remove); $('#stickers').appendChild(tile);
                } else $('#stickers').appendChild(button);
            }
        }
        async function readImageFile(input) {
            const file = input.files?.[0]; input.value = '';
            if (!file) return null;
            if (!file.type.startsWith('image/')) throw new Error('이미지 파일을 선택해주세요.');
            const url = URL.createObjectURL(file), image = new w.Image(); image.src = url;
            let canvas;
            try {
                await image.decode();
                canvas = d.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
                canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                return canvas.toDataURL('image/png');
            } catch (error) { throw new Error(`이미지를 불러오지 못했습니다. ${error.message}`); }
            finally { if (canvas) canvas.width = canvas.height = 1; image.removeAttribute('src'); URL.revokeObjectURL(url); }
        }

        $$('dialog').forEach(dialog => on(dialog, 'close', raiseNotice));
        on($('#result-dialog'), 'close', () => {
            ++outputGeneration; clearTimeout(resizeTimer); resultMarkup = ''; resultBlob = null;
            $('#result-preview').replaceChildren();
            if (resultURL) URL.revokeObjectURL(resultURL); resultURL = '';
        });
        on($('#close-editor'), 'click', () => close());
        on(window, 'popstate', () => close(true));
        on($('[data-dismiss-notice]'), 'click', () => { $('#notice').hidden = true; raiseNotice(); });
        $$('[data-panel]').forEach(button => on(button, 'click', () => openPanel(button.dataset.panel)));
        $$('[data-close-panel]').forEach(button => on(button, 'click', closePanels));
        $$('[data-close-dialog]').forEach(button => on(button, 'click', () => button.closest('dialog').close()));
        on(d, 'pointerdown', event => {
            if (!event.target.closest('.dock')) closePanels();
            if (!event.target.closest('.item,.item-controls,.dock')) deselectItem();
            if (!event.target.closest('#page-body,.selection-menu,#replace-dialog')) hideSelection();
        });
        on($('#undo'), 'click', () => { if (historyTimer) commit(); if (historyIndex > 0) restore(historyIndex - 1); });
        on($('#redo'), 'click', () => { if (historyIndex < history.length - 1) restore(historyIndex + 1); });
        on($('#zoom-out'), 'click', () => { fit = false; zoom = clamp(zoom - .1, .25, 2); updateZoom(); });
        on($('#zoom-in'), 'click', () => { fit = false; zoom = clamp(zoom + .1, .25, 2); updateZoom(); });
        on($('#zoom-fit'), 'click', () => { fit = true; updateZoom(); });
        on(stage, 'scroll', hideSelection, { passive: true });
        on(w, 'resize', updateZoom);
        on(d, 'keydown', event => {
            const editing = event.target.closest('input,textarea,select,dialog');
            if (event.key === 'Escape') {
                if ([...d.querySelectorAll('dialog')].some(dialog => dialog.open)) return;
                closePanels(); hideSelection(); deselectItem();
            }
            if (!editing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
                event.preventDefault(); if (historyTimer) commit();
                if (event.shiftKey) { if (historyIndex < history.length - 1) restore(historyIndex + 1); }
                else if (historyIndex > 0) restore(historyIndex - 1);
            }
            if (!editing && activeItem && event.key === 'Delete') { event.preventDefault(); activeItem.remove(); deselectItem(); commit(); }
            if (!editing && activeItem && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault(); const step = event.shiftKey ? 10 : 1;
                activeItem.style.left = `${activeItem.offsetLeft + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0)}px`;
                activeItem.style.top = `${activeItem.offsetTop + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)}px`; constrainItems(); scheduleHistory();
            }
        });
        for (const [id, key] of [['show-user', 'showUser'], ['show-code', 'showCode'], ['show-images', 'showImages'], ['show-dividers', 'showDividers'], ['show-roles', 'showRoles']]) on($(`#${id}`), 'change', event => choose(key, event.target.checked));
        for (const [id, key] of [['user-label', 'user'], ['character-label', 'character']]) {
            on($(`#${id}`), 'input', event => { config[key] = event.target.value; render(); scheduleHistory(); });
            on($(`#${id}`), 'change', commit);
        }
        $$('[data-divider-choice]').forEach(button => on(button, 'click', () => choose('divider', button.dataset.dividerChoice)));
        const colorKeys = { paper: 'paper', pattern: 'patternColor', narration: 'narrationColor', dialogue: 'dialogueColor' };
        $$('[data-color-target]').forEach(button => on(button, 'click', () => {
            const target = button.dataset.colorTarget;
            if (target === 'text') {
                $('#text-color').value = button.dataset.color;
                $$('[data-color-target="text"]').forEach(swatch => swatch.setAttribute('aria-pressed', String(swatch === button)));
            } else choose(colorKeys[target], button.dataset.color === 'null' ? null : button.dataset.color);
        }));
        on($('#text-size'), 'input', () => { $('#text-size-value').textContent = $('#text-size').value; });
        on($('#text-color'), 'input', () => { $$('[data-color-target="text"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === $('#text-color').value))); });
        for (const [target, key] of Object.entries(colorKeys)) {
            on($(`#${target}-color`), 'input', event => { config[key] = event.target.value; render(); scheduleHistory(); }); on($(`#${target}-color`), 'change', commit);
        }
        on($('#background-file'), 'change', async event => { try { const data = await readImageFile(event.target); if (data) choose('photo', data); } catch (error) { notify(error.message, true); } });
        on($('#remove-background'), 'click', () => choose('photo', ''));
        on($('#font-family'), 'change', event => selectFont(event.target.value));
        for (const [id, key] of [['pattern-opacity', 'patternOpacity'], ['font-size', 'fontSize'], ['line-height', 'lineHeight'], ['letter-spacing', 'letterSpacing'], ['paragraph-spacing', 'paragraphSpacing'], ['page-padding', 'padding']]) {
            on($(`#${id}`), 'input', event => { config[key] = Number(event.target.value); render(); scheduleHistory(); }); on($(`#${id}`), 'change', commit);
        }
        on($('#reset-font'), 'click', () => {
            ++fontGeneration; $('#font-status').textContent = '';
            Object.assign(config, { font: 'source', fontSize: baseFontSize, lineHeight: originalLineHeight, letterSpacing: -.01, paragraphSpacing: 1.2, padding: 46, narrationColor: null, dialogueColor: null });
            render(); commit();
        });
        on($('#add-font'), 'click', () => { fontOptions(); showDialog($('#font-dialog')); });
        on($('#font-form'), 'submit', async event => {
            event.preventDefault(); const name = $('#font-name').value.trim(), source = $('#font-source').value.trim(); if (!name || !source) return;
            const item = { id: `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, name, source };
            const status = $('#font-form-status'); $('#font-submit').disabled = true; status.textContent = '글꼴을 확인하는 중…'; status.classList.remove('error');
            try {
                await ensureFont(item.id, item);
                if (!frame.isConnected) return;
                const next = [...customFonts, item]; GM_setValue(FONT_KEY, next); customFonts = next; installFont(item); fontOptions(); choose('font', item.id);
                status.textContent = ''; $('#font-form').reset(); $('#font-dialog').close();
            } catch (error) { if (frame.isConnected) { status.textContent = `글꼴을 추가하지 못했습니다. ${error.message}`; status.classList.add('error'); } }
            finally { if (frame.isConnected) $('#font-submit').disabled = false; }
        });
        on($('#title-form'), 'submit', event => { event.preventDefault(); choose('title', $('#title-value').value); closePanels(); if (config.font === 'source' && config.title.trim()) prepareFont('serif'); });
        on($('#remove-title'), 'click', () => choose('title', ''));
        for (const group of [...new Set(Object.values(STICKERS).map(item => item.group)), '내 스티커']) {
            const button = d.createElement('button'); button.textContent = group; button.dataset.group = group; button.setAttribute('aria-pressed', 'false'); on(button, 'click', () => showStickers(group)); $('#sticker-tabs').appendChild(button);
        }
        on($('#sticker-file'), 'change', async event => {
            const name = event.target.files?.[0]?.name.replace(/\.[^.]+$/, '') || '스티커';
            try {
                const data = await readImageFile(event.target); if (!data || !frame.isConnected) return;
                const next = [...customStickers, { id: `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, name, data }];
                GM_setValue(STICKER_KEY, next); customStickers = next; showStickers('내 스티커');
            } catch (error) { if (frame.isConnected) notify(`스티커를 등록하지 못했습니다. ${error.message}`, true); }
        });
        on($('#text-form'), 'submit', event => {
            event.preventDefault(); const value = $('#text-value').value; if (!value.trim()) return;
            const options = { color: $('#text-color').value, size: clamp($('#text-size').value, 12, 60) };
            if (activeItem?.dataset.kind === 'text') { activeItem.firstChild.textContent = value; styleText(activeItem, options); closePanels(); selectItem(activeItem); constrainItems(); commit(); }
            else addItem('text', value, options);
        });
        on($('#new-text'), 'click', () => { deselectItem(); textControls(true); $('#text-value').focus(); });
        on($('#edit-text'), 'click', editText);
        let drag = null;
        on(layers, 'pointerdown', event => {
            const item = event.target.closest('.item'); if (!item || !event.isPrimary || event.button !== 0) return;
            event.preventDefault(); selectItem(item); drag = { item, id: event.pointerId, x: event.clientX, y: event.clientY, left: item.offsetLeft, top: item.offsetTop, width: item.offsetWidth, side: event.target.closest('.text-resize')?.dataset.side, angle: (Number(item.dataset.rotation) || 0) * Math.PI / 180 }; item.setPointerCapture(event.pointerId);
        });
        on(layers, 'pointermove', event => {
            if (!drag || drag.id !== event.pointerId) return;
            if (drag.side) {
                const cosine = Math.cos(drag.angle), sine = Math.sin(drag.angle);
                const delta = ((event.clientX - drag.x) * cosine + (event.clientY - drag.y) * sine) / zoom;
                const width = clamp(drag.width + (drag.side === 'left' ? -delta : delta), 20, page.offsetWidth);
                const change = width - drag.width, direction = drag.side === 'left' ? -1 : 1;
                drag.item.style.width = `${width}px`;
                drag.item.style.left = `${drag.left + change * (direction * cosine - 1) / 2}px`;
                drag.item.style.top = `${drag.top + change * direction * sine / 2}px`;
                constrainItems(); return;
            }
            drag.item.style.left = `${drag.left + (event.clientX - drag.x) / zoom}px`; drag.item.style.top = `${drag.top + (event.clientY - drag.y) / zoom}px`; constrainItems();
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(layers, type, () => { if (drag) { drag = null; commit(); } });
        on(layers, 'click', event => { const item = event.target.closest('.item'); if (item) selectItem(item); });
        on(layers, 'dblclick', event => { const item = event.target.closest('.text-box'); if (item) { selectItem(item); editText(); } });
        on($('#item-size'), 'input', event => {
            if (!activeItem) return;
            if (activeItem.dataset.kind === 'text') activeItem.style.fontSize = `${event.target.value}px`;
            else activeItem.style.width = activeItem.style.height = `${event.target.value}px`;
            constrainItems(); scheduleHistory();
        });
        on($('#item-rotation'), 'input', event => { if (activeItem) { activeItem.dataset.rotation = event.target.value; activeItem.style.transform = `rotate(${event.target.value}deg)`; scheduleHistory(); } });
        for (const id of ['item-size', 'item-rotation']) on($(`#${id}`), 'change', commit);
        on($('#item-front'), 'click', () => { if (activeItem) { layers.appendChild(activeItem); commit(); } });
        on($('#item-back'), 'click', () => { if (activeItem) { layers.prepend(activeItem); commit(); } });
        on($('#item-delete'), 'click', () => { activeItem?.remove(); deselectItem(); commit(); }); on($('#item-deselect'), 'click', deselectItem);
        on(d, 'selectionchange', () => { clearTimeout(selectionTimer); selectionTimer = setTimeout(selection, 180); });
        on($('#page-body'), 'pointerdown', event => { selectionPointer = event.pointerType; });
        on($('#page-body'), 'contextmenu', event => {
            if (event.pointerType !== 'touch' && selectionPointer !== 'touch') return;
            const value = w.getSelection();
            if (!value?.rangeCount || value.isCollapsed || !$('#page-body').contains(value.anchorNode)) return;
            event.preventDefault();
            clearTimeout(selectionTimer); selectionTimer = setTimeout(selection, 0);
        });
        on($('#page-body'), 'pointerup', () => { clearTimeout(selectionTimer); selectionTimer = setTimeout(selection, 80); });
        on($('#selection-menu'), 'pointerdown', event => event.preventDefault());
        $$('[data-mark-color]').forEach(button => on(button, 'click', () => { markColor = button.dataset.markColor; selectButtons($('#selection-menu'), '[data-mark-color]', markColor, 'markColor'); }));
        $$('[data-mark-action]').forEach(button => on(button, 'click', () => {
            if (!selectedRange) return; const action = button.dataset.markAction;
            if (['highlight', 'underline', 'mask'].includes(action)) annotate(action);
            else if (action === 'clear') clearMarks();
            else {
                $('#replace-original').textContent = selectedRange.toString(); $('#replace-value').value = ''; $('#replace-all').checked = false; hideSelection(); showDialog($('#replace-dialog')); $('#replace-value').focus();
            }
        }));
        on($('#replace-form'), 'submit', event => {
            event.preventDefault(); if (!selectedRange) return;
            const original = selectedRange.toString(), value = $('#replace-value').value;
            const ranges = $('#replace-all').checked ? allMatches(original) : [selectedRange];
            if (!ranges.length) { notify('일치하는 원문을 찾지 못했습니다.', true); return; }
            ranges.reverse().forEach(range => {
                const parent = range.startContainer.nodeType === w.Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentElement;
                const kind = parent.closest('[data-rk-text]')?.dataset.rkText || (parent.closest('em,i') ? 'narration' : 'dialogue');
                const text = parent.namespaceURI === 'http://www.w3.org/2000/svg' ? d.createElementNS('http://www.w3.org/2000/svg', 'tspan') : d.createElement('span'); text.dataset.rkText = kind; text.textContent = value;
                range.deleteContents(); range.insertNode(text);
            });
            $('#replace-dialog').close(); finishEdit();
        });

        function snapshotCapture(capture) {
            const copy = capture.cloneNode(true);
            Object.assign(copy.style, { position: 'relative', left: '0', top: '0', transform: 'none', zIndex: '0', opacity: '1', margin: '0' });
            const html = d.createElement('div'); html.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
            const style = d.createElement('style');
            style.textContent = EDITOR_CSS + '\n' + $('#source-fonts').textContent + '\n' + $('#loaded-fonts').textContent;
            html.append(style, copy);
            return new XMLSerializer().serializeToString(html);
        }
        async function rasterize(pixelWidth, pixelHeight, generation) {
            const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelWidth}" height="${pixelHeight}" viewBox="0 0 ${width} ${resultHeight}"><foreignObject width="${width}" height="${resultHeight}">${resultMarkup}</foreignObject></svg>`;
            const image = new w.Image(); image.src = svgData(markup);
            let canvas;
            try {
                await image.decode();
                if (!frame.isConnected || generation !== outputGeneration) throw new Error('이미지 크기 설정이 변경되었습니다.');
                canvas = d.createElement('canvas'); canvas.width = pixelWidth; canvas.height = pixelHeight;
                const drawing = canvas.getContext('2d');
                if (!drawing) throw new Error('이미지를 만들 메모리가 부족합니다. 배율을 낮춰주세요.');
                drawing.drawImage(image, 0, 0, pixelWidth, pixelHeight);
                return canvas;
            } catch (error) { if (canvas) canvas.width = canvas.height = 1; throw error; }
            finally { image.removeAttribute('src'); }
        }
        async function stripMetadata(blob) {
            const bytes = new Uint8Array(await blob.arrayBuffer()), view = new DataView(bytes.buffer);
            const parts = [], name = offset => String.fromCharCode(...bytes.subarray(offset, offset + 4));
            if (blob.type === 'image/png') {
                if (bytes.length < 8 || bytes[0] !== 137 || name(1) !== 'PNG\r') throw new Error('PNG 이미지 형식이 올바르지 않습니다.');
                parts.push(bytes.slice(0, 8));
                for (let offset = 8; offset < bytes.length;) {
                    if (offset + 12 > bytes.length) throw new Error('PNG 데이터가 잘렸습니다.');
                    const end = offset + view.getUint32(offset) + 12;
                    if (end > bytes.length) throw new Error('PNG 데이터가 잘렸습니다.');
                    if (['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS'].includes(name(offset + 4))) parts.push(bytes.slice(offset, end));
                    offset = end;
                }
            } else if (blob.type === 'image/webp') {
                if (bytes.length < 12 || name(0) !== 'RIFF' || name(8) !== 'WEBP') throw new Error('WebP 이미지 형식이 올바르지 않습니다.');
                const header = bytes.slice(0, 12); parts.push(header);
                for (let offset = 12; offset < bytes.length;) {
                    if (offset + 8 > bytes.length) throw new Error('WebP 데이터가 잘렸습니다.');
                    const size = view.getUint32(offset + 4, true), end = offset + 8 + size + (size & 1);
                    if (end > bytes.length) throw new Error('WebP 데이터가 잘렸습니다.');
                    const type = name(offset);
                    if (['VP8X', 'ALPH', 'VP8 ', 'VP8L'].includes(type)) {
                        const chunk = bytes.slice(offset, end);
                        if (type === 'VP8X') chunk[8] &= ~0x2c;
                        parts.push(chunk);
                    }
                    offset = end;
                }
                new DataView(header.buffer).setUint32(4, parts.reduce((sum, part) => sum + part.length, 0) - 8, true);
            } else throw new Error('지원하지 않는 이미지 형식입니다.');
            return new Blob(parts, { type: blob.type });
        }
        function outputSizeWarning(format, pixelWidth, pixelHeight) {
            const limit = format === 'webp' ? 16383 : 65535;
            if (pixelWidth <= limit && pixelHeight <= limit) return '';
            return format === 'webp'
                ? 'WebP는 한 변이 16,383px를 넘으면 잘립니다. PNG를 선택해주세요.'
                : 'PNG도 한 변이 65,535px를 넘으면 잘립니다. 이미지 배율을 낮춰주세요.';
        }
        function encode(canvas, format) {
            return new Promise((resolve, reject) => {
                const warning = outputSizeWarning(format, canvas.width, canvas.height);
                if (warning) { reject(new Error(warning)); return; }
                try { canvas.toBlob(blob => blob?.size ? resolve(stripMetadata(blob)) : reject(new Error('이미지 인코딩에 실패했습니다. PNG 형식 또는 더 낮은 배율로 저장해주세요.')), format === 'webp' ? 'image/webp' : 'image/png', .94); }
                catch (error) { reject(new Error(`이미지 변환 실패: ${error.message}`)); }
            });
        }
        async function encodedOutput(format, generation, preview = null) {
            const factor = clamp($('#output-scale').value, 50, 200) / 100;
            const canvas = await rasterize(Math.max(1, Math.round(width * factor)), Math.max(1, Math.round(resultHeight * factor)), generation);
            try {
                if (preview) {
                    const scale = Math.min(1, 380 / canvas.width, 380 / canvas.height);
                    preview.width = Math.max(1, Math.round(canvas.width * scale));
                    preview.height = Math.max(1, Math.round(canvas.height * scale));
                    const drawing = preview.getContext('2d');
                    if (!drawing) throw new Error('미리보기 그리기를 초기화하지 못했습니다.');
                    drawing.drawImage(canvas, 0, 0, preview.width, preview.height);
                }
                return await encode(canvas, format);
            }
            finally { canvas.width = canvas.height = 1; }
        }
        let outputTask = null, resultGeneration = -1;
        async function outputBlob(immediate = false) {
            clearTimeout(resizeTimer);
            while (resultMarkup && frame.isConnected) {
                const generation = outputGeneration;
                if (resultGeneration === generation) return resultBlob;
                if (outputTask) {
                    await outputTask;
                    if (!immediate && generation !== outputGeneration) return null;
                    continue;
                }
                const format = $('#output-format').value;
                const factor = clamp($('#output-scale').value, 50, 200) / 100;
                $('#output-scale-value').textContent = `${Math.round(factor * 100)}%`;
                const warning = outputSizeWarning(format, Math.round(width * factor), Math.round(resultHeight * factor));
                if (warning) { $('#output-size').textContent = warning; return null; }
                outputTask = (async () => {
                    try {
                        const preview = $('#result-preview').querySelector('canvas') ? null : d.createElement('canvas');
                        const blob = await encodedOutput(format, generation, preview);
                        if (!frame.isConnected || generation !== outputGeneration) return;
                        if (format === 'webp' && blob.type !== 'image/webp') { $('#output-format').value = 'png'; notify('이 브라우저가 WebP를 지원하지 않아 PNG로 준비했습니다.'); }
                        resultBlob = blob; resultGeneration = generation;
                        if (resultURL) URL.revokeObjectURL(resultURL); resultURL = URL.createObjectURL(blob);
                        if (preview) {
                            preview.setAttribute('role', 'img'); preview.setAttribute('aria-label', '저장할 이미지'); $('#result-preview').replaceChildren(preview);
                        }
                        $('#output-size').textContent = `${Math.round(width * factor)} × ${Math.round(resultHeight * factor)} · ${(blob.size / 1048576).toFixed(1)} MB`;
                    } catch (error) { if (frame.isConnected && generation === outputGeneration) throw error; }
                })();
                try { await outputTask; }
                finally { outputTask = null; }
                if (!immediate && generation !== outputGeneration) return null;
            }
            return null;
        }
        async function exportImage() {
            if (busy) return;
            if (historyTimer) commit(); closePanels(); deselectItem(); selectedRange = null; w.getSelection()?.removeAllRanges(); hideSelection();
            setBusy(true, '이미지와 글꼴을 준비하는 중…'); let capture = null;
            try {
                const value = config;
                await ensureFont(value.font, null, true);
                if (value.font === 'source' && (config.title.trim() || layers.querySelector('.text-box'))) await ensureFont('serif', null, true);
                const sourceCSS = await sourceFontCSS(context, page.textContent, true);
                if (!frame.isConnected) return;
                if (sourceCSS) $('#source-fonts').textContent = sourceCSS;
                await d.fonts.ready;
                capture = page.cloneNode(true); capture.dataset.rkCapture = 'true'; capture.removeAttribute('id'); capture.querySelectorAll('[id]').forEach(node => { if (node.namespaceURI !== 'http://www.w3.org/2000/svg') node.removeAttribute('id'); });
                Object.assign(capture.style, { position: 'fixed', left: '0', top: '0', transform: 'none', boxShadow: 'none', zIndex: '-1', opacity: '0', pointerEvents: 'none' });
                capture.querySelectorAll('.text-resize').forEach(node => node.remove());
                capture.querySelectorAll('.selected').forEach(node => node.classList.remove('selected'));
                if (!config.showUser) capture.querySelectorAll('.message[data-role="user"]').forEach(node => node.remove());
                if (!config.showCode) capture.querySelectorAll('[data-rk-code],.message[data-rk-only=code]').forEach(node => node.remove());
                if (!config.showImages) capture.querySelectorAll('[data-rk-image],[data-rk-image-block],.message[data-rk-only=image]').forEach(node => node.remove());
                capture.querySelectorAll('button.item').forEach(button => { const replacement = d.createElement('div'); for (const attr of [...button.attributes]) replacement.setAttribute(attr.name, attr.value); replacement.append(...button.childNodes); button.replaceWith(replacement); });
                d.body.appendChild(capture);
                await localizeImages(capture);
                const faces = await loadUsedFonts(capture, d);
                const embeddedFamilies = new Set(fontBlocks($('#source-fonts').textContent + $('#loaded-fonts').textContent, location.href).map(block => cssField(block.body, 'font-family').replace(/^['"]|['"]$/g, '').toLowerCase()));
                const missing = faces.find(face => sharedSourceFaces.includes(face) && !embeddedFamilies.has(face.family.replace(/^['"]|['"]$/g, '').toLowerCase()));
                if (missing) throw new Error(`현재 사용 중인 원문 글꼴 ${missing.family}의 파일 정의에 접근할 수 없습니다. 본문 글꼴을 선택한 뒤 저장해주세요.`);
                await nextFrame(); await nextFrame();
                resultHeight = Math.ceil(capture.scrollHeight); resultMarkup = snapshotCapture(capture);
                capture.remove(); capture = null;
                $('#output-scale').value = 150; ++outputGeneration; await outputBlob(); showDialog($('#result-dialog'));
            } catch (error) { resultMarkup = ''; if (frame.isConnected) notify(`이미지를 만들지 못했습니다. ${error.message}`, true); }
            finally { capture?.remove(); if (frame.isConnected) setBusy(false); }
        }
        on($('#export'), 'click', exportImage);
        const resizeOutput = () => { outputBlob().catch(error => { if (frame.isConnected) notify(error.message, true); }); };
        const scheduleOutput = () => {
            ++outputGeneration; clearTimeout(resizeTimer);
            const factor = clamp($('#output-scale').value, 50, 200) / 100;
            const warning = outputSizeWarning($('#output-format').value, Math.round(width * factor), Math.round(resultHeight * factor));
            $('#output-size').textContent = warning || '…';
            if (!warning) resizeTimer = setTimeout(resizeOutput, 500);
        };
        on($('#output-format'), 'change', scheduleOutput);
        on($('#output-scale'), 'input', event => {
            $('#output-scale-value').textContent = `${event.target.value}%`; scheduleOutput();
        });
        async function outputAction(button, action) {
            if (button.getAttribute('aria-busy') === 'true') return;
            button.setAttribute('aria-busy', 'true');
            try { await action(); }
            catch (error) { if (frame.isConnected) notify(error.message, true); }
            finally { button.removeAttribute('aria-busy'); }
        }
        on($('#copy-image'), 'click', event => outputAction(event.currentTarget, async () => {
            if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') { notify('이 브라우저는 이미지 클립보드 복사를 지원하지 않습니다.', true); return; }
            try {
                const png = (async () => {
                    const blob = await outputBlob(true);
                    if (!blob) throw new Error('저장할 이미지가 없습니다.');
                    if (blob.type === 'image/png') return blob;
                    return encodedOutput('png', outputGeneration);
                })();
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
                notify('이미지를 복사했습니다.', false, 2000);
            } catch (error) { notify(`이미지를 복사하지 못했습니다. ${error.message}`, true); }
        }));
        on($('#download'), 'click', event => outputAction(event.currentTarget, async () => {
            const blob = await outputBlob(true);
            if (!blob || !resultURL) return;
            const label = (config.title.split('\n').find(line => line.trim()) || '로그').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0, 40);
            const link = document.createElement('a'); link.href = resultURL; link.download = `${label}_${Date.now()}.${blob.type === 'image/webp' ? 'webp' : 'png'}`;
            document.body.appendChild(link); link.click(); link.remove(); exported = true;
        }));

        setBusy(true, '선택한 대화의 화면 서식을 가져오는 중…');
        try {
            await document.fonts.ready;
            if (!frame.isConnected) return;
            const roles = await messageRoles(entries);
            if (!frame.isConnected) return;
            for (const entry of entries) {
                const bubble = entry.bubble;
                if (!bubble.isConnected) throw new Error('선택한 대화가 사라졌습니다. 다시 구간을 선택해주세요.');
                const section = d.createElement('section'); section.className = 'message'; section.dataset.role = roles.get(bubble);
                const label = d.createElement('span'); label.className = 'role';
                const wrapper = d.createElement('div'); wrapper.className = 'log';
                context.units = null; context.branches = null;
                if (entry.units) {
                    if (entry.units.some(node => !node.isConnected || !withinBubble(bubble, node))) throw new Error('선택한 문단이 사라졌습니다. 다시 선택해주세요.');
                    context.units = new Set(entry.units); context.branches = new WeakSet();
                    for (const unit of entry.units) for (let node = unit; node; node = composedParent(node)) {
                        context.branches.add(node);
                        if (node === bubble) break;
                    }
                }
                const clone = cloneDisplayed(bubble, context); if (clone) wrapper.appendChild(d.importNode(clone, true));
                context.units = null; context.branches = null;
                if (!wrapper.textContent.trim() && !wrapper.querySelector('img,svg,hr,pre,table')) continue;
                const only = markContentBlocks(wrapper); if (only) section.dataset.rkOnly = only;
                if (messages.children.length) { const rule = d.createElement('div'); rule.className = 'rule'; section.appendChild(rule); }
                section.append(label, wrapper); messages.appendChild(section);
            }
            if (!messages.children.length) throw new Error('선택한 구간에 표시할 내용이 없습니다.');
            const maskTile = svgData(svg('<path d="M0 0h4v4H0zM4 4h4v4H4z" fill="#000" fill-opacity=".04"/><path d="M4 0h4v4H4zM0 4h4v4H0z" fill="#fff" fill-opacity=".04"/>', 8));
            page.style.setProperty('--mask-pattern', `url("${maskTile}")`);
            for (const face of document.fonts) {
                if (!context.families.has(face.family.replace(/^['"]|['"]$/g, '').toLowerCase())) continue;
                try { d.fonts.add(face); sharedSourceFaces.push(face); } catch { /* CSS-connected faces are copied below. */ }
            }
            $('#source-fonts').textContent = await sourceFontCSS(context, messages.textContent);
            if (!frame.isConnected) return;
            await d.fonts.ready;
            // Images remain available for a later visibility toggle; output localizes only visible content.
            const decodes = [...messages.querySelectorAll('img')].map(image => image.decode().catch(() => {}));
            await Promise.all(decodes);
            if (!frame.isConnected) return;
            fontOptions(); makeChoices(); themeChoices(); showStickers('도형'); render();
            await loadUsedFonts(page, d);
            if (!frame.isConnected) return;
            updateZoom(); commit();
            if (context.notes.size) notify([...context.notes].join(' '));
        } catch (error) { close(true); throw error; }
        finally { if (frame.isConnected) setBusy(false); }
    }
})();
