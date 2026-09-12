// ==UserScript==
// @name         Фиксация кнопок Moodle + Enter (Классическая рабочая версия)
// @namespace    http://tampermonkey.net
// @version      3.0
// @description  Возврат к первому полностью рабочему варианту нумерации и горячих клавиш + Try again
// @match        *://*.basealt.ru/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/sanbob-vault/easy-kurs-basealt/refs/heads/main/script.js
// @updateURL    https://raw.githubusercontent.com/sanbob-vault/easy-kurs-basealt/refs/heads/main/script.js
// ==/UserScript==

(function() {
    'use strict';

    function fixNextButton() {
        // --- 1. БЛОК КНОПКИ SUBMIT ---
        const submitButton = document.getElementById('id_submitbutton');
        let hasSubmit = false;

        if (submitButton) {
            hasSubmit = true;
            if (submitButton.style.position !== 'fixed') {
                submitButton.style.position = 'fixed';
                submitButton.style.top = '15px';
                submitButton.style.right = '15px';
                submitButton.style.zIndex = '999999';

                submitButton.style.backgroundColor = '#007bff';
                submitButton.style.color = '#ffffff';
                submitButton.style.padding = '14px 30px';
                submitButton.style.fontSize = '18px';
                submitButton.style.fontWeight = 'bold';
                submitButton.style.border = '2px solid #0056b3';
                submitButton.style.borderRadius = '5px';
                submitButton.style.boxShadow = '0 5px 25px rgba(0,0,0,0.5)';
                submitButton.style.cursor = 'pointer';
            }
        }

        // --- 2. БЛОК КНОПОК ДАЛЕЕ / CONTINUE / TRY AGAIN ---
        const buttons = document.querySelectorAll('form[action*="continue.php"] button[type="submit"], form[action*="view.php"] button[type="submit"]');

        buttons.forEach(button => {
            const text = button.textContent.trim().toLowerCase();

            // Добавили проверку точного текста новой кнопки в условие
            if (text === 'далее' || text === 'continue' || text === "yes, i'd like to try again") {
                const targetRight = hasSubmit ? '170px' : '15px';

                if (button.style.position !== 'fixed' || button.style.right !== targetRight) {
                    button.style.position = 'fixed';
                    button.style.top = '15px';
                    button.style.right = targetRight;
                    button.style.zIndex = '999998';

                    button.style.backgroundColor = '#28a745';
                    button.style.color = '#ffffff';
                    button.style.padding = '14px 30px';
                    button.style.fontSize = '18px';
                    button.style.fontWeight = 'bold';
                    button.style.border = '2px solid #1e7e34';
                    button.style.borderRadius = '5px';
                    button.style.boxShadow = '0 5px 25px rgba(0,0,0,0.5)';
                    button.style.cursor = 'pointer';
                }
            }
        });

        // --- 3. ИСХОДНЫЙ РАБОЧИЙ БЛОК НУМЕРАЦИИ ВАРИАНТОВ ---
        const labels = document.querySelectorAll('.answeroption label.form-check-label');
        labels.forEach((label, index) => {
            if (!label.innerHTML.includes('class="script-number"')) {
                const pTag = label.querySelector('p');
                if (pTag) {
                    pTag.insertAdjacentHTML('afterbegin', `<span class="script-number" style="color: #dc3545; font-weight: bold; margin-right: 8px;">[${index + 1}]</span> `);
                }
            }
        });
    }

    // --- 4. БЛОК ГОРЯЧИХ КЛАВИШ ---
    window.addEventListener('keydown', function(event) {
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

            const buttons = document.querySelectorAll('form[action*="continue.php"] button[type="submit"], form[action*="view.php"] button[type="submit"]');
            for (let i = 0; i < buttons.length; i++) {
                const text = buttons[i].textContent.trim().toLowerCase();
                // Сюда тоже добавили обработку нажатия Enter для новой кнопки
                if (text === 'далее' || text === 'continue' || text === "yes, i'd like to try again") {
                    buttons[i].click();
                    break;
                }
            }
        }
    });

    // Проверяем страницу каждые 300мс
    fixNextButton();
    setInterval(fixNextButton, 300);
})();
