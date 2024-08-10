document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#myTable tr').forEach(row => {
        row.addEventListener('click', async function(event) {
            // Überprüfen, ob das geklickte Element nicht die Klasse "picturecell" oder "infocell" hat
            if (!event.target.classList.contains('picturecell') && !event.target.classList.contains('infocell')) {
                const id = this.id.replace('row', ''); // Annahme: Die ID des Elements entspricht der ID in der DB

                try {
                    // Abrufen der Daten vom Server
                    const response = await fetch(`/data/${id}`);
                    const data = await response.json();

                    console.log(data);

                    const editview = document.getElementById('editview');
                    const editviewText = document.getElementById('editview-text');

                    // Anpassung des Inhalts basierend auf den abgerufenen Daten
                    editviewText.innerHTML = `<h2 style='margin-bottom: 0px;'>${data.name} - ${data.material}</h2><strong>von ${data.vendor}</strong><br><img src='pictures/${data.AID}.jpg' style='width: 50%; margin-top: 15px;' />`; // Beispielhafte Ausgabe

                    editview.style.display = 'flex'; // Editview anzeigen
                } catch (err) {
                    console.error('Fehler beim Abrufen der Daten:', err);
                }
            }
        });
    });

    document.querySelector('.close-btn').addEventListener('click', function() {
        const editview = document.getElementById('editview');
        editview.style.display = 'none'; // Editview ausblenden
    });

    window.onclick = function(event) {
        const editview = document.getElementById('editview');
        if (event.target == editview) {
            editview.style.display = 'none'; // Editview ausblenden, wenn außerhalb des Editviews geklickt wird
        }
    }
});
