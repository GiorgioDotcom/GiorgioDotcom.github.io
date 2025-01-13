document.addEventListener("DOMContentLoaded", () => {
    // Recupera il selettore della lingua e gli elementi associati alle lingue
    const languageSelector = document.getElementById("language-selector"); // Selettore della lingua (dropdown)
    const elementsEn = document.querySelectorAll(".lang.en"); // Elementi associati alla lingua inglese
    const elementsIt = document.querySelectorAll(".lang.it"); // Elementi associati alla lingua italiana

    // Funzione per attivare la lingua selezionata
    const setActiveLanguage = (language) => {
        if (language === "en") {
            // Mostra gli elementi in inglese e nasconde quelli in italiano
            elementsEn.forEach((el) => {
                el.classList.add("active"); // Aggiunge la classe "active" per attivare gli elementi
            });
            elementsIt.forEach((el) => {
                el.classList.remove("active"); // Rimuove la classe "active" dagli elementi italiani
            });
        } else if (language === "it") {
            // Mostra gli elementi in italiano e nasconde quelli in inglese
            elementsIt.forEach((el) => {
                el.classList.add("active"); // Aggiunge la classe "active" per attivare gli elementi
            });
            elementsEn.forEach((el) => {
                el.classList.remove("active"); // Rimuove la classe "active" dagli elementi inglesi
            });
        }
    };

    // Imposta la lingua iniziale in base al valore selezionato nel dropdown
    setActiveLanguage(languageSelector.value);

    // Listener per il cambio di lingua
    languageSelector.addEventListener("change", (event) => {
        setActiveLanguage(event.target.value); // Cambia la lingua in base al valore selezionato
    });
});
