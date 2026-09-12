// ==UserScript==
// @name         BaseALT Easy Course Fixer
// @namespace    http://tampermonkey.net
// @version      3.2
// @description  Улучшает навигацию на kurs.basealt.ru: закрепляет кнопки перехода, добавляет выбор ответов цифрами (1-9) и отправку по Enter.
// @author       sanbobsan
// @match        *://*.basealt.ru/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/sanbob-vault/easy-kurs-basealt/refs/heads/main/script.user.js
// @updateURL    https://raw.githubusercontent.com/sanbob-vault/easy-kurs-basealt/refs/heads/main/script.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 1. Выносим стили в отдельный блок. Браузеру проще применять классы, чем инлайн-стили в цикле.
    const style = document.createElement('style');
    style.innerHTML = `
        .fixed-btn-submit {
            position: fixed !important;
            top: 15px !important;
            right: 15px !important;
            z-index: 999999 !important;
            background-color: #007bff !important;
            color: #ffffff !important;
            padding: 14px 30px !important;
            font-size: 18px !important;
            font-weight: bold !important;
            border: 2px solid #0056b3 !important;
            border-radius: 5px !important;
            box-shadow: 0 5px 25px rgba(0,0,0,0.5) !important;
            cursor: pointer !important;
        }
        .fixed-btn-continue {
            position: fixed !important;
            top: 15px !important;
            z-index: 999998 !important;
            background-color: #28a745 !important;
            color: #ffffff !important;
            padding: 14px 30px !important;
            font-size: 18px !important;
            font-weight: bold !important;
            border: 2px solid #1e7e34 !important;
            border-radius: 5px !important;
            box-shadow: 0 5px 25px rgba(0,0,0,0.5) !important;
            cursor: pointer !important;
        }
        .script-number {
            color: #dc3545;
            font-weight: bold;
            margin-right: 8px;
        }
    `;
    document.head.appendChild(style);

    // Массив целевых текстов кнопок для удобного масштабирования
    const targetTexts = ['далее', 'continue', "yes, i'd like to try again"];

    function fixUI() {
        // --- БЛОК КНОПКИ SUBMIT ---
        const submitButton = document.getElementById('id_submitbutton');
        if (submitButton && !submitButton.classList.contains('fixed-btn-submit')) {
            submitButton.classList.add('fixed-btn-submit');
        }

        // --- БЛОК КНОПОК ДАЛЕЕ / CONTINUE / TRY AGAIN ---
        const continueButtons = document.querySelectorAll('form[action*="continue.php"] button[type="submit"], form[action*="view.php"] button[type="submit"]');
        
        continueButtons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();
            
            if (targetTexts.includes(text)) {
                if (!button.classList.contains('fixed-btn-continue')) {
                    button.classList.add('fixed-btn-continue');
                }
                // Динамическое позиционирование в зависимости от наличия кнопки Submit
                button.style.right = submitButton ? '170px' : '15px';
            }
        });

        // --- БЛОК НУМЕРАЦИИ ВАРИАНТОВ ---
        const labels = document.querySelectorAll('.answeroption label.form-check-label');
        labels.forEach((label, index) => {
            // Используем querySelector вместо проверки строкового innerHTML (работает быстрее и точнее)
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
        // ЗАЩИТА: Игнорируем нажатия, если фокус находится в текстовом поле или редакторе
        const tag = event.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) {
            return;
        }

        // Обработка цифр 1-9
        if (event.key >= '1' && event.key <= '9') {
            const index = parseInt(event.key, 10) - 1;
            const radioButtons = document.querySelectorAll('.answeroption input[type="radio"]');

            if (radioButtons[index]) {
                radioButtons[index].checked = true;
                radioButtons[index].dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // Обработка Enter
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

    // Первичный запуск
    fixUI();

    // Вместо setInterval используем MutationObserver
    // Следит за изменениями DOM и вызывает функцию только при реальной перерисовке интерфейса (например, подгрузке ajax-ом)
    const observer = new MutationObserver(() => fixUI());
    observer.observe(document.body, { childList: true, subtree: true });

})();