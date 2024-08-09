document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('#myTable tr').forEach(row => {
        row.addEventListener('click', function() {
            const editview = document.getElementById('editview');
            const editviewText = document.getElementById('editview-text');
            
            editviewText.textContent = `Details für ${this.id}`; // Anpassung des Inhalts basierend auf der Zeile
            editview.style.display = 'flex'; // Editview anzeigen
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
