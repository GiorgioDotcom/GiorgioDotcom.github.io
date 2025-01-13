// TODO: AL MOMENTO NON IMPLEMENTATO IN QUANTO NON E' PRESENTE NESSUN ANCHOR IN PAGINA. VALUTARNE L'IMPLEMENTAZIONE
// Scorrimento fluido per i link di navigazione.
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // Aggiunge un evento "click" a tutti i link che iniziano con "#"
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Previene il comportamento predefinito del link (es. salto immediato alla sezione)

        // Recupera l'elemento di destinazione basandosi sull'attributo "href" del link
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth' // Imposta uno scorrimento fluido verso l'elemento
        });
    });
});
