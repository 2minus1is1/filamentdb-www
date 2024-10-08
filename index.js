const express = require('express');
const { Client } = require('pg');
const path = require('path');

const { DateTime } = require('luxon');

const app = express();

// Statische Dateien ausliefern
app.use(express.static(path.join(__dirname)));

app.use(express.json());

const client = new Client({
    host: 'docker.mittelerde.cc',
    user: 'filamentdb-www',
    password: 'filamentdb-www',
    database: 'filamentdb'
});

// Hilfsfunktionen
function getCalculatePercentageAvailable(weight_all, weight_used) {
    const value = weight_used / weight_all;
    return Math.round(100 - value * 100);
}

function getCalculatePercentageUsed(weight_all, weight_used) {
    const value = weight_used / weight_all;
    return Math.round(value * 100);
}

function getWarningUsed(value) {
    if (value <= 20) {
        return 'warn-darkgreen';
    } else if (value > 20 && value <= 40) {
        return 'warn-lightgreen';
    } else if (value > 40 && value <= 60) {
        return 'warn-yellow';
    } else if (value > 60 && value <= 80) {
        return 'warn-orange';
    } else {
        return 'warn-red';
    }
}

function getIfEmpty(weight_all, weight_used) {
    const value = weight_all - weight_used;
    return value < 1 ? 'linethrough' : '';
}

function getIfEmptyX(weight_all, weight_used) {
    const value = weight_all - weight_used;
    return value < 1 ? '<span style="color:#cc3300;text-shadow: 0px 0px 2px #FFFFFF;font-size:30px;"><b>XX</b></span>' : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
}

function getMaterial(id, client) {
    return client.query('SELECT material FROM profiles WHERE id = $1', [id])
        .then(res => res.rows[0]?.material);
}

function getVendor(id, client) {
    return client.query('SELECT vendor FROM profiles WHERE id = $1', [id])
        .then(res => res.rows[0]?.vendor);
}

function getInventNumber(name) {
    return name.split(" ")[0];
}

function getTotalWeightNew(totalWeightNew) {
    return totalWeightNew ? `${totalWeightNew} g` : '';
}

function getPicture(picture) {
    return `🖼️`;
}

function getInformation(information) {
    return information ? `<a href="${information}" target="_blank" style="color: white; font-weight: 700; text-decoration: none;">&#9432;</a>` : '';
}

function getPricePerGram(cost, weight) {
    return (cost / weight).toFixed(2);
}



client.connect();

app.get('/', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM spools ORDER BY name ASC');
        const rows = result.rows;

        const resultMaterial = await client.query('SELECT * FROM profiles ORDER BY id ASC');
        const materials = resultMaterial.rows;

        const selectionResult = await client.query('SELECT * FROM selection WHERE ID = 1'); // Annahme: du möchtest die erste Zeile bearbeiten
        const selection = selectionResult.rows[0];

        const materialsMap = {};
        materials.forEach(material => {
            materialsMap[material.id] = {
                vendor: material.vendor,
                material: material.material
            };
        });

        rows.forEach(row => {
            const materialInfo = materialsMap[row.profile_id];
            if (materialInfo) {
                row.vendor = materialInfo.vendor;
                row.material = materialInfo.material;
            }
        });

        let htmlOutput = `
        <html>
        <head>
        <title>Filament Database - docker.mittelerde.cc</title>
        <link rel="apple-touch-icon" sizes="180x180" href="www-files/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="www-files/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="www-files/favicon-16x16.png">
        <link rel="manifest" href="www-files/site.webmanifest">
        <link rel="mask-icon" href="www-files/safari-pinned-tab.svg" color="#5bbad5">
        <meta name="msapplication-TileColor" content="#da532c">
        <meta name="theme-color" content="#ffffff">
        <meta name="viewport" content="width=1300, initial-scale=1.0, user-scalable=yes">



        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Work+Sans&display=swap" rel="stylesheet">
        <style>
        html, body {
            font-family: "Work Sans", sans-serif;
            background-color: #181818;
            color: #ffffff;
            margin: 0;
            padding: 0;
            width: 100%;
            overflow-x: hidden;
        }
        .center {
            margin-left: auto;
            margin-right: auto;
            min-width: 50%; /* Dies bedeutet, dass das Element mindestens 50% der Breite einnimmt */
            width: 100%; /* Stellen Sie sicher, dass das Element die volle Breite einnimmt */
            border-collapse: collapse;
        }


        .center td {
            padding: 0 5px;
        }
        .warn-darkgreen {
            background-color:#339900;
            color:#ffffff;
        }
        .warn-lightgreen {
            background-color:#99cc33;
            color:#000000;
        }
        .warn-yellow {
            background-color:#ffcc00;
            color:#000000;
        }
        .warn-orange {
            background-color:#cb5e0b;
            color:#ffffff;
        }
        .warn-red {
            background-color:#cc3300;
            color:#ffffff;
        }
        .linethrough {
            background-color:#cc3300;
        }
        #editview {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .editview-content {
            background-color: #2c2c2c;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            width: 80%;
            max-width: 400px;
        }

        .close-btn {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }

        .close-btn:hover,
        .close-btn:focus {
            color: #fff;
            text-decoration: none;
            cursor: pointer;
        }

        #tablehistory td {
            padding: 10px;
        }

        .btn-eintragen {
            background-color: #007BFF; /* Blau */
            color: white; /* Weiße Schrift */
            padding: 12px 24px; /* Innenabstand */
            font-size: 36px; /* Schriftgröße */
            border: none; /* Keine Umrandung */
            border-radius: 5px; /* Abgerundete Ecken */
            cursor: pointer; /* Zeiger ändern beim Überfahren */
            transition: background-color 0.3s ease; /* Glatter Übergang für Hover-Effekt */
            width: 100%;
            margin-bottom: 20px;
            margin-top: 10px;
        }

        .btn-eintragen:hover {
            background-color: #0056b3; /* Dunkleres Blau bei Hover */
        }

        
        #toggleButton {
            background-color: #007BFF; /* Blau */
            color: white; /* Weiße Schrift */
            font-size: 36px; /* Schriftgröße */
            border: none; /* Keine Umrandung */
            border-radius: 5px; /* Abgerundete Ecken */
            cursor: pointer; /* Zeiger ändern beim Überfahren */
            transition: background-color 0.3s ease; /* Glatter Übergang für Hover-Effekt */
        }

        #toggleButton:hover {
            background-color: #0056b3; /* Dunkleres Blau bei Hover */
        }

        #btn-eintragen-div {
            margin-left: auto;
            margin-right: auto;
        }

        .selection-row {
            display: flex; /* Ordnet die .selection-group-Elemente in einer Zeile an */
            justify-content: space-between; /* Verteilt die Elemente gleichmäßig */
            margin-bottom: 20px; /* Abstand zwischen den Reihen */
        }

        .selection-group {
            flex: 1; /* Macht jede Gruppe gleich breit innerhalb der Zeile */
            /*margin-right: 15px;  Abstand zwischen den Gruppen */
            padding: 5px;
        }

        .selection-group:last-child {
            margin-right: 0; /* Entfernt den rechten Rand bei der letzten Gruppe in der Zeile */
        }

        .selection-group label {
            font-size: 28px;
            text-align: center;
            font-weight: 700;
            display: block; /* Stellt sicher, dass das Label über dem Select-Element steht */
            margin-bottom: 5px; /* Abstand zwischen Label und Select-Element */
        }

        .selection-group select {
            width: 100%; /* Macht das Select-Element genauso breit wie die .selection-group */
            padding: 5px;
        }

        .grey-background {
            background-color: #ccc;
            color: #000;
        }

        .orange-background {
            background-color: #f55e00;
            color: #000;
        }

        .red-background {
            background-color: #db0000;
            color: #000;
        }

        .weight-info {
            font-size: 20px;
            text-align: center;
        }



        </style>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
        <script type="text/javascript" src="www-files/sort.js"></script>
        <script>
        function updateSelection(columnName, spoolId) {
            $.ajax({
                url: '/update-selection',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ column: columnName, spoolId: spoolId }),
                success: function(response) {
                    console.log('Selection updated successfully');
                },
                error: function(error) {
                    console.error('Error updating selection:', error);
                }
            });
        }

        $(document).ready(function() {
            $('.spool-select').on('change', function() {
                const columnName = $(this).attr('name');
                let spoolId = $(this).val();
                    if (spoolId == '') {
                        spoolId = 0;
                    } 


                updateSelection(columnName, spoolId);
            });
        });
        </script>
        <script>
            $(document).ready(function() {
                $('.spool-select').on('change', function() {
                    const selectedOption = $(this).find('option:selected');
                    const availableWeight = selectedOption.data('available-weight');
                    if (availableWeight == "") {
                        $(this).siblings('.weight-info').html('&nbsp;');
                    } else {
                        $(this).siblings('.weight-info').text(availableWeight + ' g');
                    }
                });
                // Initial load to show the weight of the selected option
                $('.spool-select').each(function() {
                    const selectedOption = $(this).find('option:selected');
                    const availableWeight = selectedOption.data('available-weight');
                    if (availableWeight == "") {
                        $(this).siblings('.weight-info').html('&nbsp;');
                    } else {
                        $(this).siblings('.weight-info').text(availableWeight + ' g');
                    }
                    
                });
            });
        </script>
        </head>
        <body>

        <div id="container-select">
            <div class="selection-row">
                <div class="selection-group" style="background-color: #ffffff4a; color: #fff;">
                    <label for="spool-select-s1">S1</label>
                    <select id="spool-select-s1" class="spool-select" name="s1">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.s1 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>

                <div class="selection-group grey-background" style="border-left: solid;">
                    <label for="spool-select-a1">A1</label>
                    <select id="spool-select-a1" class="spool-select" name="a1">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a1 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a2">A2</label>
                    <select id="spool-select-a2" class="spool-select" name="a2">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a2 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a3">A3</label>
                    <select id="spool-select-a3" class="spool-select" name="a3">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a3 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a4">A4</label>
                    <select id="spool-select-a4" class="spool-select" name="a4">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a4 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>

                <div class="selection-group grey-background" style="border-left: solid;">
                    <label for="spool-select-a5">B1</label>
                    <select id="spool-select-a5" class="spool-select" name="a5">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a5 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a6">B2</label>
                    <select id="spool-select-a6" class="spool-select" name="a6">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a6 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a7">B3</label>
                    <select id="spool-select-a7" class="spool-select" name="a7">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a7 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a8">B4</label>
                    <select id="spool-select-a8" class="spool-select" name="a8">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a8 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
            </div>
            <div class="selection-row">
                <div class="selection-group red-background">
                    <label for="spool-select-voron">VORON</label>
                    <select id="spool-select-voron" class="spool-select" name="voron">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.voron === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group orange-background">
                    <label for="spool-select-prusa">PRUSA</label>
                    <select id="spool-select-prusa" class="spool-select" name="prusa">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.prusa === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
            </div>
        </div>
                            <center>
                                <div id="btn-eintragen-div"><button class="btn-eintragen" onclick="location.assign('/add')">Verbrauch eintragen</button></div>
                            </center>
        
        <table id='mytable' class='center'>
        <tr style='cursor: default;'>
        <th>Farbe</th><th align='center' style='cursor: ns-resize;' onclick='sort_filament();'>Filament 🔄</th><th align='left' style='cursor: ns-resize;' onclick='sort_hersteller();'>Hersteller 🔄</th><th style='cursor: ns-resize;' onclick='sort_material();'>Material 🔄</th><th>Preis</th><th style='cursor: ns-resize;' onclick='sort_verfuegbar();'>Verf&uuml;gbar 🔄</th><th>Verbraucht</th><th style='padding: 0 10px 0 10px;'>Gewicht<br>Hersteller</th><th style='padding: 0 10px 0 10px;'>Gewicht<br>gewogen</th><th><button id="toggleButton">🚫</button></th>
        </tr>
        <tbody id='tablefilament'>`;

        for (let ro of rows) {
            const vendor = await getVendor(ro.profile_id, client);
            const material = await getMaterial(ro.profile_id, client);
            const percentageAvailable = getCalculatePercentageAvailable(ro.weight, ro.used);
            const percentageUsed = getCalculatePercentageUsed(ro.weight, ro.used);
            const warningClass = getWarningUsed(percentageUsed);
            const classIfEmpty = getIfEmpty(ro.weight, ro.used);
            const inventNumber = getInventNumber(ro.name);
            const totalWeightNew = getTotalWeightNew(ro.total_weight_new);
            const picture = getPicture(ro.picture);
            const information = getInformation(ro.information);
            const pricePerGram = getPricePerGram(ro.cost, ro.weight);

            htmlOutput += `
            <tr style="border-top: 1px solid #383838; cursor: pointer;" id="${inventNumber}" class="${classIfEmpty}">
                <td align='left' style='background-color: ${ro.color};'>${getIfEmptyX(ro.weight, ro.used)}</td>
                <td align='left'>${ro.name}</td>
                <td align='left'>${vendor}</td>
                <td align='center'>${material}</td>
                <td align='center'>€ ${ro.cost}<br>€ ${pricePerGram}/g</td>
                <td align='right' class='${warningClass}'>${percentageAvailable} %<br>${Math.round(ro.weight - ro.used)} g</td>
                <td align='right' class='${warningClass}'>${percentageUsed} %<br>${Math.round(ro.used)} g</td>
                <td align='center'>${ro.weight} g</td>
                <td align='center'>${totalWeightNew}</td>
                <td align='center' class='infocell' style='cursor: pointer;'>${information}</td>
            </tr>`;
        }

        htmlOutput += `</tbody></table><input type="hidden" id="filament_order" value="asc">
<input type="hidden" id="hersteller_order" value="asc">
<input type="hidden" id="material_order" value="asc">
<input type="hidden" id="verfuegbar_order" value="asc">
<div style="z-index: 10; position: fixed; top: 50%; left: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); display:none; cursor: pointer;" id="popup"></div>

<div id="editview" class="editview">
        <div class="editview-content">
            <span class="close-btn">&times;</span>
            <p id="editview-text">Editview-Inhalt</p>
        </div>
    </div>            
    <script>
        document.getElementById('toggleButton').addEventListener('click', function() {
            var rows = document.querySelectorAll('#tablefilament tr.linethrough');
            rows.forEach(function(row) {
                if (row.style.display === 'none') {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });


    </script>
    <script src="www-files/script.js"></script></body></html>`;

        res.send(htmlOutput);
    } catch (err) {
        res.status(500).send('Internal Server Error');
        console.error(err);
    }
});

// Route to handle the update request
app.post('/update-selection', async (req, res) => {
    const { column, spoolId } = req.body;

    try {
        // Update the appropriate column in the selection table
        await client.query(`UPDATE selection SET ${column} = $1 WHERE id = 1`, [spoolId]);

        res.status(200).send('Selection updated successfully');
    } catch (error) {
        console.error('Error updating selection:', error);
        res.status(500).send('Error updating selection');
    }
});



// Route zum Abrufen der Daten aus der Datenbank
app.get('/data/:id', async (req, res) => {
    const id = req.params.id+'%';
    try {
        const resultspool = await client.query('SELECT * FROM spools WHERE name LIKE $1', [id]);
        const resultprofile = await client.query('SELECT * FROM profiles WHERE id = $1', [resultspool.rows[0].profile_id]);
        const resultshistory = await client.query('SELECT * FROM history WHERE spool = $1', [resultspool.rows[0].id]);
        

        const mergedResult = {
            ...resultspool.rows[0],
            ...resultprofile.rows[0],
            id_spooltable: resultspool.rows[0].id,
            id_profiletable: resultprofile.rows[0].id,
            used_spooltable: resultspool.rows[0].used,
            resultshistory: resultshistory.rows
        };

        delete mergedResult.id;
        delete mergedResult.profile_id;
        delete mergedResult.used;

        mergedResult["AID"] = req.params.id;

        res.json(mergedResult);
    } catch (err) {
        console.error(err);
        res.status(500).send('Fehler beim Abrufen der Daten');
    }
});

app.delete('/deletehistory/:id/:used/:spool', async (req, res) => {
    const entryId = req.params.id;
    const usedAmount = req.params.used;
    const spoolId = req.params.spool;

    try {
        await client.query('UPDATE spools SET used = used - $1 WHERE id = $2', [usedAmount, spoolId]);

        // Hier SQL-Query zum Löschen des Eintrags ausführen
        await client.query('DELETE FROM history WHERE id = $1', [entryId]);

        res.status(200).send('Eintrag erfolgreich gelöscht');
    } catch (error) {
        console.error('Fehler beim Löschen des Eintrags:', error);
        res.status(500).send('Fehler beim Löschen des Eintrags');
    }
});





app.get('/add', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM spools ORDER BY name ASC');
        const rows = result.rows;  // Alle Einträge aus der Datenbank abrufen

        const resultMaterial = await client.query('SELECT * FROM profiles ORDER BY id ASC');
        const materials = resultMaterial.rows;

        const selectionResult = await client.query('SELECT * FROM selection WHERE ID = 1'); // Annahme: du möchtest die erste Zeile bearbeiten
        const selection = selectionResult.rows[0];


        const materialsMap = {};
        materials.forEach(material => {
            materialsMap[material.id] = {
                vendor: material.vendor,
                material: material.material
            };
        });

        rows.forEach(row => {
            const materialInfo = materialsMap[row.profile_id];
            if (materialInfo) {
                row.vendor = materialInfo.vendor;
                row.material = materialInfo.material;
            }
        });

        let htmlOutput = `
        <html>
        <head>
        <title>Verbrauch Eintragen / Filament Database - docker.mittelerde.cc</title>
        <link rel="apple-touch-icon" sizes="180x180" href="www-files/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="32x32" href="www-files/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="www-files/favicon-16x16.png">
        <link rel="manifest" href="www-files/site.webmanifest">
        <link rel="mask-icon" href="www-files/safari-pinned-tab.svg" color="#5bbad5">
        <meta name="msapplication-TileColor" content="#da532c">
        <meta name="theme-color" content="#ffffff">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Work+Sans&display=swap" rel="stylesheet">

        <style>
        html, body {
            font-family: "Work Sans", sans-serif;
            background-color: #181818;
            color: #ffffff;
            margin: 0;
            padding: 0;
            width: 100%;
            overflow-x: hidden;
        }
        .center {
            margin-left: auto;
            margin-right: auto;
            min-width: 50%; /* Dies bedeutet, dass das Element mindestens 50% der Breite einnimmt */
            width: 100%; /* Stellen Sie sicher, dass das Element die volle Breite einnimmt */
            border-collapse: collapse;
        }

        #container {
            text-align: center;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .spool-select {
            margin-right: 10px;
            padding: 5px;
        }

        .spool-input {
            padding: 5px;
            margin-right: 10px;
            width: 100px;
        }

        .reset-button, #add-element, #submit-element, #back-element {
            padding: 5px 10px;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .reset-button {
            background-color: #ff0000;
            color: #ffffff;
        }

        .reset-button:hover {
            background-color: #cc0000;
        }

        #add-element {
            background-color: #00cc00;
            color: #ffffff;
            margin-top: 20px; /* Abstand zum vorherigen Element */
        }

        #add-element:hover {
            background-color: #009900;
        }

        #submit-element {
            background-color: #0066cc;
            color: #ffffff;
            margin-left: 10px;
            margin-top: 20px;
        }

        #submit-element:hover {
            background-color: #004c99;
        }

        #back-element {
            background-color: #242424;
            color: #ffffff;
            margin-left: 10px;
            margin-top: 20px;
        }

        #back-element:hover {
            background-color: #000;
        }

        #total {
            margin-top: 20px;
            font-size: 1.2em;
        }

        .selection-row {
            display: flex; /* Ordnet die .selection-group-Elemente in einer Zeile an */
            justify-content: space-between; /* Verteilt die Elemente gleichmäßig */
            margin-bottom: 20px; /* Abstand zwischen den Reihen */
        }

        .selection-group {
            flex: 1; /* Macht jede Gruppe gleich breit innerhalb der Zeile */
            /*margin-right: 15px;  Abstand zwischen den Gruppen */
            padding: 5px;
        }

        .selection-group:last-child {
            margin-right: 0; /* Entfernt den rechten Rand bei der letzten Gruppe in der Zeile */
        }

        .selection-group label {
            font-size: 28px;
            text-align: center;
            font-weight: 700;
            display: block; /* Stellt sicher, dass das Label über dem Select-Element steht */
            margin-bottom: 5px; /* Abstand zwischen Label und Select-Element */
        }

        .selection-group select {
            width: 100%; /* Macht das Select-Element genauso breit wie die .selection-group */
            padding: 5px;
            pointer-events: none;
            background-color: #e9ecef;
            color: #6c757d;
        }

        .grey-background {
            background-color: #ccc;
            color: #000;
        }

        .orange-background {
            background-color: #f55e00;
            color: #000;
        }

        .red-background {
            background-color: #db0000;
            color: #000;
        }

        .weight-info {
            font-size: 20px;
            text-align: center;
        }
        </style>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
        <script>
            $(document).ready(function() {
                $('.spool-select').on('change', function() {
                    const selectedOption = $(this).find('option:selected');
                    const availableWeight = selectedOption.data('available-weight');
                    if (availableWeight == "") {
                        $(this).siblings('.weight-info').html('&nbsp;');
                    } else {
                        $(this).siblings('.weight-info').text(availableWeight + ' g');
                    }
                });
                // Initial load to show the weight of the selected option
                $('.spool-select').each(function() {
                    const selectedOption = $(this).find('option:selected');
                    const availableWeight = selectedOption.data('available-weight');
                    if (availableWeight == "") {
                        $(this).siblings('.weight-info').html('&nbsp;');
                    } else {
                        $(this).siblings('.weight-info').text(availableWeight + ' g');
                    }
                    
                });
            });
        </script>
        </head>
        <body>
        <div id="container-select">
            <div class="selection-row">
                <div class="selection-group" style="background-color: #ffffff4a; color: #fff;">
                    <label for="spool-select-s1">S1</label>
                    <select id="spool-select-s1" class="spool-select" name="s1">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.s1 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>

                <div class="selection-group grey-background" style="border-left: solid;">
                    <label for="spool-select-a1">A1</label>
                    <select id="spool-select-a1" class="spool-select" name="a1">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a1 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a2">A2</label>
                    <select id="spool-select-a2" class="spool-select" name="a2">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a2 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a3">A3</label>
                    <select id="spool-select-a3" class="spool-select" name="a3">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a3 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a4">A4</label>
                    <select id="spool-select-a4" class="spool-select" name="a4">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a4 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>

                <div class="selection-group grey-background" style="border-left: solid;">
                    <label for="spool-select-a5">B1</label>
                    <select id="spool-select-a5" class="spool-select" name="a5">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a5 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a6">B2</label>
                    <select id="spool-select-a6" class="spool-select" name="a6">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a6 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a7">B3</label>
                    <select id="spool-select-a7" class="spool-select" name="a7">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a7 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group grey-background">
                    <label for="spool-select-a8">B4</label>
                    <select id="spool-select-a8" class="spool-select" name="a8">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.a8 === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
            </div>
            <div class="selection-row">
                <div class="selection-group red-background">
                    <label for="spool-select-voron">VORON</label>
                    <select id="spool-select-voron" class="spool-select" name="voron">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.voron === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
                <div class="selection-group orange-background">
                    <label for="spool-select-prusa">PRUSA</label>
                    <select id="spool-select-prusa" class="spool-select" name="prusa">
                        <option value="" data-available-weight="">--- LEER ---</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-available-weight="${Math.round(row.weight - row.used)}" ${selection.prusa === row.id ? 'selected' : ''}>[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <div class="weight-info"></div>
                </div>
            </div>
        </div>
        <br>
        <div id="container">
            <div class="form-group">
                <label for="spool-select-0">Spool 1</label>
                <select id="spool-select-0" name="spool" class="spool-select">
                    <option value="">-- Select a Filament --</option>
                    ${rows.map(row => `
                        <option value="${row.id}" data-used="${row.used}" data-color="${row.color}">[${row.material}] - ${row.name} (${row.vendor})</option>
                    `).join('')}
                </select>
                <input type="text" id="input-0" class="spool-input" placeholder="Enter grams" />
                <button type="button" class="reset-button" onclick="resetFields(0)">🔄</button>
            </div>
            <div id="total">Total Grams: 0.00</div>
            <button type="button" id="add-element">+</button>
            <button type="button" id="submit-element">Eintragen</button>
            <button type="button" id="back-element" onclick="window.location.href='/'">Zurück</button>
        </div>
        <script>
            let elementIndex = 0;

            function resetFields(index) {
                document.getElementById(\`spool-select-\${index}\`).selectedIndex = 0;
                document.getElementById(\`input-\${index}\`).value = '';
                calculateTotal(); // Gesamtberechnung nach Zurücksetzen
            }

            function addElement() {
                elementIndex++;
                const container = document.getElementById('container');

                const newElement = document.createElement('div');
                newElement.className = 'form-group';
                newElement.innerHTML = \`
                    <label for="spool-select-\${elementIndex}">Spool \${elementIndex + 1}</label>
                    <select id="spool-select-\${elementIndex}" name="spool" class="spool-select">
                        <option value="">-- Select a Filament --</option>
                        ${rows.map(row => `
                            <option value="${row.id}" data-used="${row.used}" data-color="${row.color}">[${row.material}] - ${row.name} (${row.vendor})</option>
                        `).join('')}
                    </select>
                    <input type="text" id="input-\${elementIndex}" class="spool-input" placeholder="Enter grams" />
                    <button type="button" class="reset-button" onclick="resetFields(\${elementIndex})">🔄</button>
                \`;

                container.insertBefore(newElement, document.getElementById('total'));

                // Füge den Event-Listener für das neu hinzugefügte Input-Feld hinzu
                document.getElementById(\`input-\${elementIndex}\`).addEventListener('input', validateInput);
            }

            function validateInput(event) {
                // Erlaubt nur Zahlen, Punkte und Kommas
                const value = event.target.value;
                event.target.value = value.replace(/[^0-9.,]/g, '');
                calculateTotal(); // Aktualisiert die Gesamtsumme bei Eingabe
            }

            function calculateTotal() {
                let total = 0;
                for (let i = 0; i <= elementIndex; i++) {
                    const value = document.getElementById(\`input-\${i}\`).value.replace(',', '.');
                    if (!isNaN(parseFloat(value))) {
                        total += parseFloat(value);
                    }
                }
                document.getElementById('total').textContent = 'Total Grams: ' + total.toFixed(2);
            }

            async function submitData() {
                let data = [];
                for (let i = 0; i <= elementIndex; i++) {
                    const selectElement = document.getElementById(\`spool-select-\${i}\`);
                    const inputValue = parseFloat(document.getElementById(\`input-\${i}\`).value.replace(',', '.'));
                    const selectedOption = selectElement.options[selectElement.selectedIndex];
                    const spoolId = selectedOption.value;
                    const used = parseFloat(selectedOption.getAttribute('data-used'));

                    if (spoolId && !isNaN(inputValue)) {
                        data.push({
                            id: +spoolId,
                            usage: inputValue,  // Input-Feld Wert
                            new_used: used + inputValue
                        });
                    }
                }

                // Überprüfe, ob Daten korrekt erstellt wurden

                sendData(data);
            }

            async function sendData(data) {

            // Sende die Daten an den Server zur Datenbankaktualisierung
                try {
                    const response = await fetch('/update', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    });

                    if (response.ok) {
                        //alert('Daten erfolgreich eingetragen!');
                        location.href = "/";
                    } else {
                        alert('Fehler beim Eintragen der Daten.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Fehler beim Eintragen der Daten.');
                }
            }

            // Event-Listener für das erste Input-Feld und Buttons hinzufügen
            document.addEventListener('DOMContentLoaded', function() {
                document.getElementById('input-0').addEventListener('input', validateInput);
                document.getElementById('add-element').addEventListener('click', addElement);
                document.getElementById('submit-element').addEventListener('click', submitData);
            });
        </script>
        </body>
        </html>`;

        res.send(htmlOutput);
    } catch (err) {
        res.status(500).send('Internal Server Error');
        console.error(err);
    }
});

app.post('/update', async (req, res) => {

    try {
        
        const data = req.body;

        const dateTimeInVienna = DateTime.now().setZone('Europe/Vienna').toFormat("yyyy-LL-dd HH:mm:ss 'Europe/Vienna'");



        // Beginne eine Transaktion
        await client.query('BEGIN');

        for (const item of data) {
            const { id, usage, new_used } = item;

            // Aktualisiere die Tabelle "spools"
            await client.query('UPDATE spools SET used = $1 WHERE id = $2', [new_used, id]);

            // Füge einen neuen Eintrag in die Tabelle "history" hinzu
            await client.query(
                'INSERT INTO history (spool, used, datetime) VALUES ($1, $2, $3)',
                [id, usage, dateTimeInVienna]
            );
        }

        // Commit der Transaktion
        await client.query('COMMIT');

        res.status(200).send('Daten erfolgreich eingetragen');
    } catch (err) {
        // Falls ein Fehler auftritt, rolle die Transaktion zurück
        if (client) await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Fehler beim Eintragen der Daten');
    }
});










const PORT = 80;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
    client.end();
    process.exit();
});

