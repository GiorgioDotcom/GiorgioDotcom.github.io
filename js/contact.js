document.addEventListener("DOMContentLoaded", () => {
    // Recupera il modulo e il messaggio di risposta
    const form = document.getElementById("contactForm"); // Modulo di contatto
    const responseMessage = document.getElementById("responseMessage"); // Elemento per mostrare i messaggi di risposta

    // Aggiunge un evento "submit" al modulo
    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // Previene il comportamento predefinito (invio del modulo e ricaricamento della pagina)

        // Recupera i valori inseriti dall'utente nei campi del modulo
        const name = document.getElementById("name").value; // Nome dell'utente
        const email = document.getElementById("email").value; // Email dell'utente
        const message = document.getElementById("message").value; // Messaggio dell'utente

        try {
            // Simula una richiesta POST a un server
            const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
                method: "POST", // Metodo HTTP utilizzato
                headers: {
                    "Content-Type": "application/json", // Tipo di contenuto inviato (JSON)
                },
                body: JSON.stringify({ name, email, message }), // Converte i dati in formato JSON
            });

            // Verifica se la richiesta è andata a buon fine
            if (response.ok) {
                // Mostra un messaggio di successo all'utente
                responseMessage.innerHTML = `
                    <p style="color: green;">Thank you, ${name}! Your message has been sent successfully.</p>
                `;
                form.reset(); // Resetta i campi del modulo
            } else {
                // Lancia un'eccezione se la richiesta non è andata a buon fine
                throw new Error("Failed to send message. Please try again.");
            }
        } catch (error) {
            // Mostra un messaggio di errore all'utente
            responseMessage.innerHTML = `
                <p style="color: red;">${error.message}</p>
            `;
        }
    });
});
