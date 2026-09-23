// ==UserScript==
// @name         Easy Kurs BaseALT
// @namespace    http://tampermonkey.net
// @version      3.8
// @description  Улучшает навигацию на kurs.basealt.ru: закрепляет кнопки, выбор ответов (1-9), авто-пропуск теории (Shift+Enter) до появления вопросов.
// @author       sanbobsan
// @match        *://*.basealt.ru/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/sanbob-vault/easy-kurs-basealt/refs/heads/main/script.user.js
// @updateURL    https://raw.githubusercontent.com/sanbob-vault/easy-kurs-basealt/refs/heads/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Единый блок стилей
    const style = document.createElement('style');
    style.innerHTML = `
        .fixed-btn-submit, .fixed-btn-continue, .skip-theory-btn {
            position: fixed !important;
            top: 15px !important;
            padding: 14px 30px !important;
            font-size: 18px !important;
            font-weight: bold !important;
            border-radius: 5px !important;
            box-shadow: 0 5px 25px rgba(0,0,0,0.5) !important;
            cursor: pointer !important;
            transition: background-color 0.2s !important;
        }
        .fixed-btn-submit {
            z-index: 999999 !important;
            background-color: #007bff !important;
            color: #ffffff !important;
            border: 2px solid #0056b3 !important;
        }
        .fixed-btn-continue {
            z-index: 999998 !important;
            background-color: #28a745 !important;
            color: #ffffff !important;
            border: 2px solid #1e7e34 !important;
        }
        .skip-theory-btn {
            z-index: 999997 !important;
            background-color: #ffc107 !important;
            color: #212529 !important;
            border: 2px solid #d39e00 !important;
        }
        .skip-theory-btn:hover {
            background-color: #e0a800 !important;
        }
        .script-number {
            color: #dc3545;
            font-weight: bold;
            margin-right: 8px;
        }
    `;
    document.head.appendChild(style);

    const targetTexts = ['далее', 'continue', "yes, i'd like to try again", "продолжить", "да, мне хотелось бы попробовать еще раз", "следующий вопрос"];

    // Предохранитель (убиваем флаг автоскипа через 3 секунды простоя, чтобы не зависнуть, если кнопок нет)
    let autoSkipTimeout = null;
    if (sessionStorage.getItem('easyKurs_autoSkip') === 'true') {
        autoSkipTimeout = setTimeout(() => sessionStorage.removeItem('easyKurs_autoSkip'), 3000);
    }

    // --- ФУНКЦИЯ ДЛЯ ЗАПУСКА ПРОПУСКА ТЕОРИИ ---
    function triggerSkipTheory() {
        sessionStorage.setItem('easyKurs_autoSkip', 'true');

        const menuWrapper = document.querySelector('.menuwrapper');
        if (menuWrapper) {
            const links = document.querySelectorAll('.menuwrapper ul li a');
            if (links.length > 0) {
                const lastLinkHref = links[links.length - 1].href.split('#')[0];
                const currentHref = window.location.href.split('#')[0];

                if (currentHref !== lastLinkHref) {
                    // Мы не на последней странице оглавления — летим туда
                    window.location.href = lastLinkHref;
                    return;
                }
            }
        }
        // Если мы уже на последней странице оглавления (или его нет), запускаем прокликивание
        processAutoSkip();
    }

    // --- ЛОГИКА АВТОМАТИЧЕСКОГО ПРОКЛИКИВАНИЯ "ДАЛЕЕ" ---
    function processAutoSkip() {
        if (sessionStorage.getItem('easyKurs_autoSkip') !== 'true') return false;

        const submitButton = document.getElementById('id_submitbutton');
        if (submitButton) {
            // Нашли Submit — значит мы дошли до вопросов! Останавливаем автоскип.
            sessionStorage.removeItem('easyKurs_autoSkip');
            if (autoSkipTimeout) clearTimeout(autoSkipTimeout);
            return false; // Возвращаем false, чтобы fixUI продолжил работу и применил стили к кнопке
        }

        const continueButtons = document.querySelectorAll('form[action*="continue.php"] button[type="submit"], form[action*="view.php"] button[type="submit"]');
        for (const button of continueButtons) {
            if (targetTexts.includes(button.textContent.trim().toLowerCase())) {
                button.click(); // Жмем "Далее" и ждем следующей загрузки страницы (флаг остается)
                return true; 
            }
        }
        return false;
    }

    function fixUI() {
        // 1. Отрабатываем авто-скип. Если он нажал "Далее", прерываем функцию, страница сейчас перезагрузится
        if (processAutoSkip()) return;

        let currentRightOffset = 15;

        // 2. БЛОК КНОПКИ SUBMIT
        const submitButton = document.getElementById('id_submitbutton');
        if (submitButton) {
            if (!submitButton.classList.contains('fixed-btn-submit')) {
                submitButton.classList.add('fixed-btn-submit');
            }
            submitButton.style.right = currentRightOffset + 'px';
            currentRightOffset += 160; 
        }

        // 3. БЛОК КНОПОК ДАЛЕЕ / CONTINUE
        const continueButtons = document.querySelectorAll('form[action*="continue.php"] button[type="submit"], form[action*="view.php"] button[type="submit"]');
        continueButtons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();
            if (targetTexts.includes(text)) {
                if (!button.classList.contains('fixed-btn-continue')) {
                    button.classList.add('fixed-btn-continue');
                }
                button.style.right = currentRightOffset + 'px';
                
                if (text.includes('again')) {
                    currentRightOffset += 320; 
                } else {
                    currentRightOffset += 160;
                }
            }
        });

        // 4. КНОПКА "ПРОПУСТИТЬ ТЕОРИЮ"
        const menuWrapper = document.querySelector('.menuwrapper');
        if (menuWrapper) {
            let skipBtn = document.getElementById('skip-theory-btn');
            
            if (!skipBtn) {
                skipBtn = document.createElement('button');
                skipBtn.id = 'skip-theory-btn';
                skipBtn.textContent = '⏩ Пропустить теорию';
                skipBtn.className = 'skip-theory-btn';
                
                skipBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    triggerSkipTheory();
                });
                
                document.body.appendChild(skipBtn);
            }
            skipBtn.style.right = currentRightOffset + 'px';
        }

        // 5. НУМЕРАЦИЯ ВАРИАНТОВ ОТВЕТА
        const labels = document.querySelectorAll('.answeroption label.form-check-label');
        labels.forEach((label, index) => {
            if (!label.querySelector('.script-number')) {
                const pTag = label.querySelector('p');
                if (pTag) {
                    pTag.insertAdjacentHTML('afterbegin', `<span class="script-number">[${index + 1}]</span> `);
                }
            }
        });
    }

    // --- БЛОК ГОРЯЧИХ КЛАВИШ ---
    window.addEventListener('keydown', function(event) {
        const tag = event.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return;

        // Выбор вариантов ответа 1-9
        if (event.key >= '1' && event.key <= '9') {
            const index = parseInt(event.key, 10) - 1;
            const radioButtons = document.querySelectorAll('.answeroption input[type="radio"]');
            if (radioButtons[index]) {
                radioButtons[index].checked = true;
                radioButtons[index].dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // Обработка Enter и Shift+Enter
        if (event.key === 'Enter') {
            if (event.shiftKey) {
                event.preventDefault();
                triggerSkipTheory(); // Запускаем автоскип
                return;
            }

            const submitButton = document.getElementById('id_submitbutton');
            if (submitButton) {
                submitButton.click();
                return;
            }
            const continueButtons = document.querySelectorAll('form[action*="continue.php"] button[type="submit"], form[action*="view.php"] button[type="submit"]');
            for (const button of continueButtons) {
                if (targetTexts.includes(button.textContent.trim().toLowerCase())) {
                    button.click();
                    break;
                }
            }
        }
    });

    // Запуск и слежение за изменениями
    fixUI();
    const observer = new MutationObserver(() => fixUI());
    observer.observe(document.body, { childList: true, subtree: true });

})();
