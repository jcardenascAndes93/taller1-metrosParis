(function() {
    'use strict';

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container')
    };

    let db = null;

    const openReq = indexedDB.open('stationPreferences', 1);

    openReq.onupgradeneeded = e => {
        db = e.target.result;
        db.createObjectStore('stations', { keyPath: 'key' });
    }

    openReq.onsuccess = e => {
        db = e.target.result;
        app.updateSchedules();
    }

    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function() {
        // Refresh all of the metro stations
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function() {
        // Open/show the add new station dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function() {
        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        app.getScheduleFromNetwork(key)
            .then((response) => {
                if (!response) {
                    return;
                }
                var result = {};
                result.key = key;
                result.label = label;
                result.created = response._metadata.date;
                result.schedules = response.result.schedules;
                app.updateTimetableCard(result);
            });
        var tx = db.transaction(["stations"], "readwrite");

        // Informa sobre el éxito de la inicio de la transacción
        tx.oncomplete = function(event) {
            console.log('agregado con exito');
        };

        // Crea una almacén de objetos en la transacción
        var objectStore = tx.objectStore("stations");

        // Agrega nuestro objeto newItem al almacén de objetos
        var objectStoreRequest = objectStore.add({ key: key, label: label });

        objectStoreRequest.onsuccess = function(event) {
            console.log('agregado con exito');
        };

        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function() {
        // Close the add new station dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new station dialog.
    app.toggleAddDialog = function(visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a timestation card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function(data) {
        var key = data.key;
        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

        if (!card) { // creating
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
            //window.cardLoadTime = performance.now();
        } else { // updating
            var lastUpdated = card.querySelector('.card-last-updated').textContent
                // If the data on the element is newer, skip the update.
            if (lastUpdated >= dataLastUpdated) {
                return;
            }
        }
        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for (var i = 0; i < 4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if (schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            window.cardLoadTime = performance.now();
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/

    /**
     * Get's the cached schedule data from the caches object.
     *
     * @param {string} key station reference.
     * @return {Object} The schedule of the station, if the request fails, return null.
     */
    app.getScheduleFromCache = function(key) {
        if (!('caches' in window)) {
            return null;
        }
        const url = `/v4/schedules/${key}`;
        return caches.match(url)
            .then((response) => {
                if (response) {
                    return response.json();
                }
                return null;
            })
            .catch((err) => {
                console.error('Error getting data from cache', err);
                return null;
            });
    }


    app.getScheduleFromNetwork = function(key, label) {
        return fetch(`https://api-ratp.pierre-grimaud.fr/v4/schedules/${key}`)
            .then((response) => {
                window.cardAPITime = performance.now();
                return response.json();
            })
            .catch(() => {
                return null;
            });
    };

    // Iterate all of the cards and attempt to get the latest timetable data
    app.updateSchedules = function() {
        var transaction = db.transaction(['stations'], "readonly");
        var objectStore = transaction.objectStore('stations');
        objectStore.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                var item = cursor.value;
                var key = item.key;
                var label = item.label;
                // Get the schedule data from the cache.
                app.getScheduleFromCache(key)
                    .then((response) => {
                        if (!response) {
                            return;
                        }
                        var result = {};
                        result.key = key;
                        result.label = label;
                        result.created = response._metadata.date;
                        result.schedules = response.result.schedules;
                        app.updateTimetableCard(result);
                    });
                // Get the schedule data from the network.
                app.getScheduleFromNetwork(key)
                    .then((response) => {
                        if (!response) {
                            return;
                        }
                        var result = {};
                        result.key = key;
                        result.label = label;
                        result.created = response._metadata.date;
                        result.schedules = response.result.schedules;
                        app.updateTimetableCard(result);
                    });
                cursor.continue();
            } else {
                console.log('Entries all displayed.');
            }
        };
    };

    app.getScheduleFromCache('metros/1/bastille/A')
        .then((response) => {
            if (!response) {
                return;
            }
            var result = {};
            result.key = 'metros/1/bastille/A';
            result.label = 'Bastille, Direction La Défense';
            result.created = response._metadata.date;
            result.schedules = response.result.schedules;
            app.updateTimetableCard(result);
        });

    app.getScheduleFromNetwork('metros/1/bastille/A')
        .then((response) => {
            if (!response) {
                return;
            }
            var result = {};
            result.key = 'metros/1/bastille/A';
            result.label = 'Bastille, Direction La Défense';
            result.created = response._metadata.date;
            result.schedules = response.result.schedules;
            window.FirstGetAPI = performance.now();
            app.updateTimetableCard(result);
        });

})();