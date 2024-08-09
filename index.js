const express = require('express');
const { Client } = require('pg');
const path = require('path');

const app = express();

// Statische Dateien ausliefern
app.use(express.static(path.join(__dirname)));

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

const client = new Client({
    host: 'docker.mittelerde.cc',
    user: 'filamentdb-www',
    password: 'filamentdb-www',
    database: 'filamentdb'
});

client.connect();

app.get('/', async (req, res) => {
    try {
            const result = await client.query('SELECT * FROM spools ORDER BY name ASC');
            const rows = result.rows;

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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Work+Sans&display=swap" rel="stylesheet">
            <style>
            body {
                font-family: "Work Sans", sans-serif;
                align: center;
                background-color: #181818;
                color: #ffffff;
            }
            .center {
            margin-left: auto;
            margin-right: auto;
            min-width: 50%;
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
                /*text-decoration: line-through;
                text-decoration-color:#cc3300;
                text-decoration-thickness: 15%;*/
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
            </style>
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
            <script type="text/javascript" src="www-files/sort.js"></script>
            <script>
            $(document).ready(function(){
            $(".picturecell").not(".infocell").click(function(){
                $("#popup").hide();
                $("#popup img:last-child").remove();
                //$(this).closest("tr").next("tr.picture").toggle();
                rowid = $(this).parent().attr("id");
                $("#popup").prepend(\'<img id="theImg" style="width: 100%" src="pictures/\'+rowid+\'.jpg" />\');
                $("#popup").show();
            });
            $("#popup").click(function(){
                $("#popup").hide();
                $("#popup img:last-child").remove();
            });
            });
            </script>

            </head>
            <body>
            <table id='mytable' class='center'>
            <tr style='cursor: default;'>
            <th>Farbe</th><th align='center' style='cursor: ns-resize;' onclick='sort_filament();'>Filament 🔄</th><th align='left' style='cursor: ns-resize;' onclick='sort_hersteller();'>Hersteller 🔄</th><th style='cursor: ns-resize;' onclick='sort_material();'>Material 🔄</th><th>Preis</th><th style='cursor: ns-resize;' onclick='sort_verfuegbar();'>Verf&uuml;gbar 🔄</th><th>Verbraucht</th><th style='padding: 0 10px 0 10px;'>Gewicht<br>Hersteller</th><th style='padding: 0 10px 0 10px;'>Gewicht<br>gewogen</th><th>&nbsp;</th><th>&nbsp;</th>
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
                    <td align='center' class='picturecell' style='cursor: pointer;'>${picture}</td>
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
    <script src="www-files/script.js"></script></body></html>`;

            res.send(htmlOutput);
        } catch (err) {
            res.status(500).send('Internal Server Error');
            console.error(err);
        }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
    client.end();
    process.exit();
});