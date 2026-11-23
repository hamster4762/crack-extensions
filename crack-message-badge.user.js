// ==UserScript==
// @name         크랙 메시지 배지
// @namespace    crack-message-badge
// @version      1.0.0
// @description  크랙 메시지의 글자수·생성 시각·모델 아이콘과 새 답변의 사용 크래커를 표시합니다. 사용 크래커는 새로고침하면 초기화됩니다. (version 관리방식: 크랙UI변경.기능추가및수정.버그수정)
// @match        https://crack.wrtn.ai/*
// @run-at       document-start
// @noframes
// @grant        none
// @updateURL    https://github.com/hamster4762/crack-extensions/raw/refs/heads/main/crack-message-badge.js
// @downloadURL  https://github.com/hamster4762/crack-extensions/raw/refs/heads/main/crack-message-badge.js
// ==/UserScript==

(() => {
    'use strict';

    const api = 'https://crack-api.wrtn.ai';
    const messagePath = /^\/crack-gen\/v3\/chats\/[^/]+\/messages(?:\/[^/]+\/around)?\/?$/;
    const preloadedPagePath = /^\/_next\/data\/[^/]+\/stories\/[^/]+\/episodes\/[^/]+\.json(?:[?#]|$)/;
    const preloadedMessagesKey = /^\$inf\$\/v3\/chats\/[^/?]+\/messages(?:\?|$)/;
    const deletePath = /^\/crack-gen\/v3\/chats\/[^/]+\/messages\/([a-f0-9]{24})\/?$/i;
    const socketPath = /^wss:\/\/crack-api\.wrtn\.ai\/character-chat\/socket\.io\/?(?:\?|$)/;
    const socketEventPrefix = '42/v3/chats,';
    const generatedPrefix = `${socketEventPrefix}["characterMessageGenerated",`;
    const groupSelector = '[data-message-group-id]';
    const novelActionsSelector = '.flex.items-center.justify-between.mt-2 > .flex.flex-row.gap-2.items-center';
    const comparePattern = /답변\s*비교\s*(\d+)\s*\/\s*(\d+)/;
    const objectIdPattern = /^[a-f0-9]{24}$/i;
    const userRoles = new Set(['user', 'human', 'member', 'owner']);
    const numberFormat = new Intl.NumberFormat('ko-KR');
    const messages = new Map();
    const answersByTurn = new Map();
    const deletedMessages = new Set();
    const models = new Map();
    const badges = new WeakMap();
    const pendingGroups = new Set();
    let refreshAll = false;
    let frame = 0;
    let popover;
    let popoverButton;
    let observer;

    function responseTarget(url, method) {
        if (typeof url !== 'string') return null;
        if (!url.startsWith(`${api}/`)) {
            const path = url.startsWith(`${location.origin}/`) ? url.slice(location.origin.length) : url;
            return preloadedPagePath.test(path) ? { kind: 'preloaded' } : null;
        }
        const path = url.slice(api.length).split(/[?#]/, 1)[0];
        if (typeof method === 'string' && method.toUpperCase() === 'DELETE') {
            const match = path.match(deletePath);
            return match ? { kind: 'delete', id: match[1] } : null;
        }
        if (/^\/crack-gen\/v[23]\/chat-models\/?$/.test(path)) return { kind: 'models' };
        return messagePath.test(path) ? { kind: 'messages' } : null;
    }

    function isJson(contentType) {
        return !contentType || /(?:\/|\+)json\b/i.test(contentType);
    }

    const fetchFromPage = window.fetch;
    window.fetch = function (input, ...args) {
        const result = fetchFromPage.call(this, input, ...args);
        const url = typeof input === 'string' ? input : input?.url ?? input?.href;
        const target = responseTarget(url, args[0]?.method ?? input?.method);
        if (target) {
            result.then(response => {
                if (response.ok && isJson(response.headers.get('content-type'))) {
                    return response.clone().json().then(data => readResponse(target, data));
                }
            }).catch(() => {});
        }
        return result;
    };

    const xhrTargets = new WeakMap();
    const xhrOpen = XMLHttpRequest.prototype.open;
    const xhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        const result = xhrOpen.call(this, method, url, ...args);
        const target = responseTarget(typeof url === 'string' ? url : url?.href, method);
        if (target) xhrTargets.set(this, target);
        else xhrTargets.delete(this);
        return result;
    };
    XMLHttpRequest.prototype.send = function (...args) {
        const target = xhrTargets.get(this);
        if (!target) return xhrSend.apply(this, args);

        const read = () => {
            if (this.status < 200 || this.status >= 300) return;
            try {
                if (this.responseType === 'json') readResponse(target, this.response);
                else if ((!this.responseType || this.responseType === 'text') && isJson(this.getResponseHeader('content-type'))) {
                    readResponse(target, JSON.parse(this.responseText));
                }
            } catch {
                // 페이지가 받은 응답은 그대로 두고 이 응답의 배지만 갱신하지 않습니다.
            }
        };
        this.addEventListener('loadend', read, { once: true });
        try {
            return xhrSend.apply(this, args);
        } catch (error) {
            this.removeEventListener('loadend', read);
            throw error;
        }
    };

    window.WebSocket = new Proxy(window.WebSocket, {
        construct(target, args, newTarget) {
            const socket = Reflect.construct(target, args, newTarget);
            if (socketPath.test(socket.url)) socket.addEventListener('message', readGeneratedMessage);
            return socket;
        }
    });

    function readGeneratedMessage(event) {
        if (typeof event.data !== 'string' || !event.data.startsWith(generatedPrefix)) return;

        let payload;
        try {
            [, payload] = JSON.parse(event.data.slice(socketEventPrefix.length));
        } catch {
            return;
        }
        if (payload?.result === 'SUCCESS' && readMessage(payload.data, true)) scheduleRender(true);
    }

    function firstString(...values) {
        return values.find(value => typeof value === 'string' && value.trim()) ?? '';
    }

    function readModel(record) {
        const keys = [record.crackerModel, record.cracker_model, record.chatModel, record.chatModelId,
            record.modelId, record.model, record.key, record.code, record.id, record._id, record.name, record.modelName];
        const name = firstString(record.displayName, record.display_name, record.label, record.name, record.modelName, record.title);
        const icon = firstString(record.assets?.icon?.default, record.iconUrl, record.icon_url, record.iconImageUrl, record.imageUrl,
            record.icon?.url, record.image?.url, record.icon, record.image);
        if (!name && !icon) return false;

        const src = /^https:\/\//i.test(icon) ? icon : '';
        let changed = false;
        for (const key of keys) {
            if (typeof key !== 'string' || !key.trim()) continue;
            const previous = models.get(key);
            const meta = { name: name || previous?.name || '', src: src || previous?.src || '' };
            if (previous?.name === meta.name && previous?.src === meta.src) continue;
            models.set(key, meta);
            changed = true;
        }
        return changed;
    }

    function textOf(value) {
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.map(textOf).join('');
        if (value && typeof value === 'object') {
            const text = value.text ?? value.content ?? value.value;
            return typeof text === 'string' ? text : '';
        }
        return '';
    }

    function formatTime(raw, id) {
        let date = new Date(raw ?? NaN);
        if (Number.isNaN(date.getTime())) {
            if (!objectIdPattern.test(id)) return '';
            date = new Date(parseInt(id.slice(0, 8), 16) * 1000);
        }
        const pad = value => String(value).padStart(2, '0');
        return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}. ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function readMessage(record, generated = false) {
        const id = firstString(record?._id, record?.id, record?.messageId, record?.message_id);
        if (!id || deletedMessages.has(id)) return false;

        const previous = messages.get(id);
        const role = firstString(record.role, record.sender).toLowerCase() || previous?.role || '';
        const model = userRoles.has(role) ? '' : firstString(record.crackerModel, record.cracker_model,
            record.chatModel, record.model, record.modelId, record.model_id) || previous?.model || '';
        const content = record.content ?? record.text ?? record.message ?? record.answer ?? record.response;
        let count = previous?.count ?? null;
        if (content != null) {
            count = 0;
            for (const char of textOf(content)) count++;
        }
        const createdAt = record.createdAt ?? record.created_at ?? previous?.createdAt;
        const parentTurnId = role === 'assistant' ? record.parentTurnId ?? previous?.parentTurnId : undefined;
        const cashTotal = record.cashUsage?.total;
        const cash = generated && !userRoles.has(role) && Number.isFinite(cashTotal) && cashTotal >= 0
            ? cashTotal : previous?.cash ?? null;
        if (previous && previous.role === role && previous.model === model && previous.count === count &&
            previous.createdAt === createdAt && previous.cash === cash && previous.parentTurnId === parentTurnId) return false;

        const time = formatTime(createdAt, id);
        const countLabel = count === null ? '' : `${numberFormat.format(count)}자`;
        const cashLabel = cash === null ? '' : `${numberFormat.format(cash)}크래커`;
        const label = [countLabel, time, cashLabel].filter(Boolean).join(' · ');
        messages.set(id, { role, model, count, createdAt, cash, label, parentTurnId });
        if (previous?.parentTurnId && previous.parentTurnId !== parentTurnId) {
            answersByTurn.get(previous.parentTurnId)?.delete(id);
        }
        if (parentTurnId) {
            if (!answersByTurn.has(parentTurnId)) answersByTurn.set(parentTurnId, new Set());
            answersByTurn.get(parentTurnId).add(id);
        }
        return true;
    }

    function readPreloadedMessages(pageProps) {
        for (const [key, pages] of Object.entries(pageProps?.fallback ?? {})) {
            if (!preloadedMessagesKey.test(key) || !Array.isArray(pages)) continue;
            for (const page of pages) readResponse({ kind: 'messages' }, page);
        }
    }

    function readResponse({ kind, id }, data) {
        if (kind === 'preloaded') {
            readPreloadedMessages(data?.pageProps);
            return;
        }
        if (kind === 'delete') {
            if (data?.result === 'SUCCESS') {
                deletedMessages.add(id);
                const parentTurnId = messages.get(id)?.parentTurnId;
                if (parentTurnId) answersByTurn.get(parentTurnId)?.delete(id);
                if (messages.delete(id)) scheduleRender(true);
            }
            return;
        }

        let changed = false;
        if (kind === 'models') {
            function visit(value) {
                if (!value || typeof value !== 'object') return;
                if (!Array.isArray(value) && readModel(value)) changed = true;
                for (const child of Object.values(value)) visit(child);
            }
            visit(data);
        } else {
            const records = data?.data?.messages ?? data?.messages ?? data?.data ?? data;
            if (!Array.isArray(records)) return;
            for (const record of records) {
                if (readMessage(record)) changed = true;
            }
        }
        if (changed) scheduleRender(true);
    }

    function selectedAnswer(group, id) {
        const first = messages.get(id);
        if (!first?.parentTurnId) return first;

        for (const button of group.querySelectorAll('button')) {
            const compare = button.textContent.match(comparePattern);
            if (!compare) continue;
            observer.observe(button, { characterData: true, subtree: true });
            const index = Number(compare[1]) - 1;
            const total = Number(compare[2]);
            if (index < 0 || index >= total) return;
            if (index === 0) return first;
            const answers = answersByTurn.get(first.parentTurnId);
            if (!answers) return;

            // 크랙은 같은 턴의 답변들을 오래된 순서로 표시하고 첫 답변 ID를 그룹에 붙입니다.
            const ids = [...answers].sort();
            const start = ids.indexOf(id);
            if (start >= 0 && ids.length - start === total) return messages.get(ids[start + index]);
            return;
        }
        return first;
    }

    function modelIcon(src) {
        if (!src) return document.createTextNode('?');
        const image = document.createElement('img');
        image.width = 16;
        image.height = 16;
        image.alt = '';
        image.decoding = 'async';
        image.addEventListener('error', () => image.replaceWith(document.createTextNode('?')), { once: true });
        image.src = src;
        return image;
    }

    function showModel(event) {
        event.stopPropagation();
        const button = event.currentTarget;
        if (!popover) {
            popover = document.createElement('div');
            popover.className = 'crack-message-model-popover';
            popover.popover = 'auto';
            document.body.append(popover);
        }
        if (popover.matches(':popover-open')) {
            popover.hidePopover();
            if (popoverButton === button) return;
        }
        popoverButton = button;
        popover.replaceChildren(modelIcon(button.dataset.icon), document.createTextNode(button.getAttribute('aria-label')));
        popover.showPopover({ source: button });
    }

    function renderGroup(group) {
        const rawId = group.getAttribute('data-message-group-id') || '';
        const search = rawId.startsWith('search:');
        const id = search ? rawId.slice(7) : rawId;
        const message = selectedAnswer(group, id);
        const label = message?.label ?? '';
        const novelActions = group.querySelector(novelActionsSelector);
        const model = (novelActions || search) && message?.model;
        const meta = model ? models.get(model) : null;
        const name = model ? meta?.name || model : '';
        const src = meta?.src || '';
        let badge = badges.get(group);
        if (!label && !name) {
            if (badge) {
                if (badge.button && popoverButton === badge.button && popover.matches(':popover-open')) popover.hidePopover();
                badge.root.remove();
                badges.delete(group);
            }
            return;
        }
        if (!badge) {
            const root = document.createElement('span');
            root.className = 'crack-message-badge';
            const text = document.createElement('span');
            root.append(text);
            badge = { root, text };
            badges.set(group, badge);
        }
        if (badge.text.textContent !== label) badge.text.textContent = label;
        if (name && !badge.button) {
            badge.button = document.createElement('button');
            badge.button.type = 'button';
            badge.button.className = 'crack-message-model';
            badge.button.addEventListener('click', showModel);
            badge.root.prepend(badge.button);
        }
        if (badge.button && (badge.name !== name || badge.src !== src)) {
            if (popoverButton === badge.button && popover.matches(':popover-open')) popover.hidePopover();
            if (name) {
                badge.button.setAttribute('aria-label', name);
                badge.button.dataset.icon = src;
                if (!badge.name || badge.src !== src) badge.button.replaceChildren(modelIcon(src));
            } else {
                badge.button.remove();
                badge.button = null;
            }
        }
        badge.name = name;
        badge.src = src;

        const option = group.querySelector('button[aria-label="메시지 옵션"]');
        const user = userRoles.has(message.role);
        const userBox = user ? group.querySelector('.border-y.border-outline_tertiary.py-5') : null;
        const userBubble = user && !userBox ? group.querySelector('.relative.mb-5.items-end') : null;
        const action = option?.closest('.dropdown-button') || option;
        const host = userBox?.parentElement || userBubble || novelActions || action?.parentElement || group;
        const anchor = userBox ? userBox.nextSibling : host === novelActions ? novelActions.firstElementChild :
            action?.parentElement === host ? action : null;
        badge.root.classList.toggle('crack-message-badge-row', !!(userBox || userBubble || host === group));
        if (badge.root.parentElement !== host || (anchor && badge.root !== anchor && badge.root.nextSibling !== anchor)) {
            host.insertBefore(badge.root, anchor);
        }
    }

    function scheduleRender(all = false) {
        refreshAll ||= all;
        if (frame || !document.body) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            const groups = refreshAll ? document.querySelectorAll(groupSelector) : [...pendingGroups];
            refreshAll = false;
            pendingGroups.clear();
            for (const group of groups) {
                if (group.isConnected) renderGroup(group);
            }
        });
    }

    function observeMessages() {
        const style = document.createElement('style');
        style.textContent = `
            .crack-message-badge { display: inline-flex; align-items: center; gap: 6px; color: hsl(var(--line-gray-2, 0 0% 48%)); font-size: 12px; white-space: nowrap; }
            .crack-message-badge-row { display: flex; justify-content: flex-end; width: 100%; }
            .crack-message-model { display: inline-grid; place-items: center; flex: none; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 4px; background: transparent; color: inherit; cursor: pointer; }
            .crack-message-model img, .crack-message-model-popover img { object-fit: contain; }
            .crack-message-model-popover { position: fixed; inset: auto; position-area: block-start; position-try-fallbacks: flip-block; margin: 4px; border: 1px solid GrayText; border-radius: 6px; padding: 5px 8px; background: Canvas; color: CanvasText; font: 12px/1.4 system-ui, sans-serif; max-width: calc(100vw - 16px); overflow-wrap: anywhere; }
            .crack-message-model-popover:popover-open { display: flex; align-items: center; gap: 6px; }
        `;
        document.head.append(style);

        observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                const target = mutation.target.nodeType === Node.ELEMENT_NODE ? mutation.target : mutation.target.parentElement;
                if (target?.closest('.crack-message-badge, .crack-message-model-popover, .wrtn-markdown')) continue;
                const group = target?.closest(groupSelector);
                if (group) pendingGroups.add(group);
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE || node.classList.contains('crack-message-badge')) continue;
                    if (node.matches(groupSelector)) pendingGroups.add(node);
                    for (const child of node.querySelectorAll(groupSelector)) pendingGroups.add(child);
                }
            }
            if (pendingGroups.size) scheduleRender();
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-message-group-id'] });
        scheduleRender(true);
    }

    function start() {
        const initial = window.__NEXT_DATA__?.props?.pageProps;
        if (initial) readPreloadedMessages(initial);
        else if (document.readyState !== 'complete') {
            window.addEventListener('load', () => readPreloadedMessages(window.__NEXT_DATA__?.props?.pageProps), { once: true });
        }
        observeMessages();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
