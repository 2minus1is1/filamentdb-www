function formatDateTimeInVienna(timeString) {
    // Zeitzone und Formatierungsoptionen definieren
    const options = {
        timeZone: 'Europe/Vienna',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    };

    // Date-Objekt erstellen und in die Zeitzone "Europe/Vienna" konvertieren
    const date = new Date(timeString);
    const formatter = new Intl.DateTimeFormat('de-DE', options);
    const parts = formatter.formatToParts(date);

    // Datum und Uhrzeit extrahieren
    const day = parts.find(part => part.type === 'day').value;
    const month = parts.find(part => part.type === 'month').value;
    const year = parts.find(part => part.type === 'year').value;
    const hour = parts.find(part => part.type === 'hour').value;
    const minute = parts.find(part => part.type === 'minute').value;

    // Gewünschtes Format erstellen und zurückgeben
    return `${day}.${month}.${year} ${hour}:${minute}`;
}




document.addEventListener('DOMContentLoaded', function() {

    document.querySelectorAll('#tablefilament tr').forEach(row => {
        row.addEventListener('click', async function(event) {
            // Überprüfen, ob das geklickte Element nicht die Klasse "picturecell" oder "infocell" hat
            if (!event.target.classList.contains('picturecell') && !event.target.classList.contains('infocell')) {
                const id = this.id.replace('row', ''); // Annahme: Die ID des Elements entspricht der ID in der DB

                try {
                    // Abrufen der Daten vom Server
                    const response = await fetch(`/data/${id}`);
                    const data = await response.json();
                
                    //console.log(data);
                
                    const editview = document.getElementById('editview');
                    const editviewText = document.getElementById('editview-text');
                
                    // Anpassung des Inhalts basierend auf den abgerufenen Daten
                    let editviewContent = `<h2 style='margin-bottom: 0px;'>${data.name} - ${data.material}</h2><strong>von ${data.vendor}</strong><br><img src='pictures/${data.AID}.jpg' style='width: 50%; margin-top: 15px; margin-bottom: 15px;' /><br><strong><span style="font-size: 22px;">Verfügbar: ${Math.round(data.weight - data.used_spooltable)} g</span></strong><br><br>`; 
                
                    if (Array.isArray(data.resultshistory) && data.resultshistory.length > 0) {
                        editviewContent += `<table id='tablehistory' class='center' style='width: 80%; font-size: 18px;'><tbody>`;
                        data.resultshistory.sort((a, b) => b.id - a.id).forEach(item => {
                            editviewContent += `
                                <tr style='cursor: default; border-top: solid 1px #ccc;'>
                                    <td style='text-align: left;'>${formatDateTimeInVienna(item.datetime)}</td>
                                    <td style='text-align: right;'>${item.used} g</td>
                                    <td>&nbsp;</td>
                                    <td><span class="delete-button" data-entry-id="${item.id}" data-used-amount="${item.used}" data-spool-id="${item.spool}" style="cursor: pointer;" title="Löschen">❌</span></td>
                                </tr>`;
                        });
                        editviewContent += `</tbody></table>`; 
                    }
                
                    editviewText.innerHTML = editviewContent;
                    editview.style.display = 'flex'; // Editview anzeigen
                
                } catch (error) {
                    console.error('Fehler beim Abrufen der Daten:', error);
                }
                
                // Funktion zum Löschen eines Eintrags
                async function deleteEntry(entryId, usedAmount, spoolId) {
                    try {
                        const response = await fetch(`/deletehistory/${entryId}/${usedAmount}/${spoolId}`, {
                            method: 'DELETE'
                        });
                
                        if (response.ok) {
                            //alert('Eintrag erfolgreich gelöscht!');
                            // Daten nach dem Löschen erneut abrufen und Ansicht aktualisieren
                            const updatedResponse = await fetch(`/data/${id}`);
                            const updatedData = await updatedResponse.json();
                            const editviewText = document.getElementById('editview-text');
                
                            // Gleicher Inhalt wie oben, nur die Daten werden neu gesetzt
                            let editviewContent = `<h2 style='margin-bottom: 0px;'>${updatedData.name} - ${updatedData.material}</h2><strong>von ${updatedData.vendor}</strong><br><img src='pictures/${updatedData.AID}.jpg' style='width: 50%; margin-top: 15px; margin-bottom: 15px;' /><br><strong><span style="font-size: 22px;">Verfügbar: ${Math.round(updatedData.weight - updatedData.used_spooltable)} g</span></strong><br><br>`; 
                
                            if (Array.isArray(updatedData.resultshistory) && updatedData.resultshistory.length > 0) {
                                editviewContent += `<table id='tablehistory' class='center' style='width: 80%; font-size: 18px;'><tbody>`;
                                updatedData.resultshistory.sort((a, b) => b.id - a.id).forEach(item => {
                                    editviewContent += `
                                        <tr style='cursor: default; border-top: solid 1px #ccc;'>
                                            <td style='text-align: left;'>${formatDateTimeInVienna(item.datetime)}</td>
                                            <td style='text-align: right;'>${item.used} g</td>
                                            <td>&nbsp;</td>
                                            <td><span class="delete-button" data-entry-id="${item.id}" data-used-amount="${item.used}" data-spool-id="${item.spool}" style="cursor: pointer;" title="Löschen">❌</span></td>
                                        </tr>`;
                                });
                                editviewContent += `</tbody></table>`; 
                            }
                
                            //editviewText.innerHTML = editviewContent;
                            location.reload(true); // Seite neuladen damit Tabelle neue Zahlen hat.
                        } else {
                            alert('Fehler beim Löschen des Eintrags.');
                        }
                    } catch (error) {
                        console.error('Fehler beim Löschen des Eintrags:', error);
                    }
                }
                document.querySelector('#editview').addEventListener('click', function(event) {
                    if (event.target.classList.contains('delete-button')) {
                        const entryId = event.target.dataset.entryId;
                        const usedAmount = event.target.dataset.usedAmount;
                        const spoolId = event.target.dataset.spoolId;

                        //console.log("clicked!!! id:" + entryId);
                        deleteEntry(entryId, usedAmount, spoolId);
                    }
                });
            }
        });
    });

    

    document.querySelector('.close-btn').addEventListener('click', function() {
        const editview = document.getElementById('editview');
        editview.style.display = 'none'; // Editview ausblenden
        //location.reload(true); // Seite neuladen damit Tabelle neue Zahlen hat.
    });

    window.onclick = function(event) {
        const editview = document.getElementById('editview');
        if (event.target == editview) {
            editview.style.display = 'none'; // Editview ausblenden, wenn außerhalb des Editviews geklickt wird
            //location.reload(true); // Seite neuladen damit Tabelle neue Zahlen hat.
        }
    }
});
