// ==UserScript==
// @name         Easy Kurs BaseALT
// @namespace    http://tampermonkey.net
// @version      3.4
// @description  Улучшает навигацию на kurs.basealt.ru: закрепляет кнопки перехода, добавляет выбор ответов цифрами (1-9) и пропуск теории.
// @author       sanbobsan
// @match        *://*.basealt.ru/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/sanbob-vault/easy-kurs-basealt/refs/heads/main/script.user.js
// @updateURL    https://raw.githubusercontent.com/sanbob-vault/easy-kurs-basealt/refs/heads/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 1. Единый блок стилей для всех кнопок
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

    const targetTexts = ['далее', 'continue', "yes, i'd like to try again"];

    // Предохранитель для автоскипа на случай сбоя
    if (sessionStorage.getItem('easyKurs_autoSkip') === 'true') {
        setTimeout(() => sessionStorage.removeItem('easyKurs_autoSkip'), 3000);
    }

    function fixUI() {
        // --- 1. АВТО-СКИП (Отрабатывает при загрузке страницы, если мы в процессе скипа) ---
        if (sessionStorage.getItem('easyKurs_autoSkip') === 'true') {
            const continueButtons = document.querySelectorAll('form[action*="continue.php"] button[type="submit"], form[action*="view.php"] button[type="submit"]');
            for (const button of continueButtons) {
                if (targetTexts.includes(button.textContent.trim().toLowerCase())) {
                    sessionStorage.removeItem('easyKurs_autoSkip');
                    button.click();
                    return; 
                }
            }
        }

        // Динамический отсчет позиции справа (чтобы кнопки строились в ряд и не перекрывали друг друга)
        let currentRightOffset = 15;

        // --- 2. БЛОК КНОПКИ SUBMIT ---
        const submitButton = document.getElementById('id_submitbutton');
        if (submitButton) {
            if (!submitButton.classList.contains('fixed-btn-submit')) {
                submitButton.classList.add('fixed-btn-submit');
            }
            submitButton.style.right = currentRightOffset + 'px';
            currentRightOffset += 160; // Резервируем ширину для следующей кнопки
        }

        // --- 3. БЛОК КНОПОК ДАЛЕЕ / CONTINUE ---
        const continueButtons = document.querySelectorAll('form[action*="continue.php"] button[type="submit"], form[action*="view.php"] button[type="submit"]');
        continueButtons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();
            if (targetTexts.includes(text)) {
                if (!button.classList.contains('fixed-btn-continue')) {
                    button.classList.add('fixed-btn-continue');
                }
                button.style.right = currentRightOffset + 'px';
                
                // Если текст длинный ("Try again"), отступаем больше
                if (text.includes('again')) {
                    currentRightOffset += 320; 
                } else {
                    currentRightOffset += 160;
                }
            }
        });

        // --- 4. КНОПКА "ПРОПУСТИТЬ ТЕОРИЮ" ---
        const menuWrapper = document.querySelector('.menuwrapper');
        // Проверяем наличие оглавления. Если его нет - мы не в теории, кнопку не выводим
        if (menuWrapper) {
            let skipBtn = document.getElementById('skip-theory-btn');
            
            if (!skipBtn) {
                skipBtn = document.createElement('button');
                skipBtn.id = 'skip-theory-btn';
                skipBtn.textContent = '⏩ Пропустить теорию';
                skipBtn.className = 'skip-theory-btn';
                
                skipBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Ищем все ссылки в оглавлении
                    const links = document.querySelectorAll('.menuwrapper ul li a');
                    
                    if (links.length > 0) {
                        const lastLinkHref = links[links.length - 1].href.split('#')[0];
                        const currentHref = window.location.href.split('#')[0];

                        if (currentHref === lastLinkHref) {
                            // Если мы и так на последней странице, просто жмем "Далее"
                            const btns = document.querySelectorAll('form[action*="continue.php"] button[type="submit"], form[action*="view.php"] button[type="submit"]');
                            for (const btn of btns) {
                                if (targetTexts.includes(btn.textContent.trim().toLowerCase())) {
                                    btn.click();
                                    return;
                                }
                            }
                        } else {
                            // Если страницы остались - ставим флаг в память и летим на последнюю
                            sessionStorage.setItem('easyKurs_autoSkip', 'true');
                            window.location.href = lastLinkHref;
                        }
                    }
                });
                
                // Добавляем кнопку прямо в тело страницы, а не в сайдбар
                document.body.appendChild(skipBtn);
            }
            
            // Назначаем кнопке позицию левее всех остальных кнопок
            skipBtn.style.right = currentRightOffset + 'px';
        }

        // --- 5. НУМЕРАЦИЯ ВАРИАНТОВ ОТВЕТА ---
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

        if (event.key >= '1' && event.key <= '9') {
            const index = parseInt(event.key, 10) - 1;
            const radioButtons = document.querySelectorAll('.answeroption input[type="radio"]');
            if (radioButtons[index]) {
                radioButtons[index].checked = true;
                radioButtons[index].dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        if (event.key === 'Enter') {
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