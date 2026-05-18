import http from "node:http";
import { URL } from "node:url";
import fs from "node:fs";
import Debug from "debug";

const debug = Debug("server2");

const GUESTBOOK_FILE = "guestbook.json";

/**
 * Odczytuje wpisy z pliku JSON.
 * @returns {Array} Tablica obiektów z wpisami.
 */
function getEntries() {
    try {
        if (fs.existsSync(GUESTBOOK_FILE)) {
            const data = fs.readFileSync(GUESTBOOK_FILE, "utf-8");
            return JSON.parse(data);
        }
    } catch (err) {
        debug("Błąd podczas odczytu księgi gości:", err);
    }
    return [];
}

/**
 * Zapisuje nowy wpis do pliku JSON.
 * @param {string} name - Imię i nazwisko
 * @param {string} message - Treść wpisu
 */
function saveEntry(name, message) {
    const entries = getEntries();
    entries.push({ name, message });
    fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

/**
 * Funkcja ucieczkowa (escape) dla znaków specjalnych HTML, zapobiega atakom XSS.
 */
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function requestListener(request, response) {
    debug(`Żądanie: ${request.method} ${request.url}`);
    const url = new URL(request.url, `http://${request.headers.host}`);
    const route = [request.method, url.pathname].join(" ");

    switch (route) {
        case "GET /": {
            // 1. Odczytaj wszystkie wpisy
            const entries = getEntries();
            
            // 2. Wygeneruj kod HTML dla wpisów
            const entriesHTML = entries.map(entry => `
                <div style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                    <strong>${escapeHTML(entry.name)}</strong><br>
                    <p style="white-space: pre-wrap; margin: 5px 0;">${escapeHTML(entry.message)}</p>
                </div>
            `).join('');

            // 3. Zwróć stronę HTML z formularzem i wpisami
            response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            response.write(`
<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Księga gości</title>
    <style>
      body { font-family: sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
      textarea { width: 100%; box-sizing: border-box; }
      input[type="text"] { width: 100%; box-sizing: border-box; padding: 5px;}
      button { padding: 10px 15px; background-color: #007bff; color: white; border: none; cursor: pointer; }
      button:hover { background-color: #0056b3; }
    </style>
  </head>
  <body>
    <main>
      <h1>Księga gości</h1>
      
      <section>
        <h2>Poprzednie wpisy</h2>
        ${entriesHTML || "<p>Brak wpisów. Bądź pierwszy!</p>"}
      </section>

      <hr>

      <section>
        <h2>Nowy wpis:</h2>
        <!-- Używamy metody POST do wysyłania danych na serwer -->
        <form method="POST" action="/submit">
          <label for="name">Twoje imię i nazwisko</label><br>
          <input type="text" id="name" name="name" required><br><br>
          
          <label for="message">Treść wpisu</label><br>
          <textarea id="message" name="message" rows="4" required></textarea><br><br>
          
          <button type="submit">Dodaj wpis</button>
        </form>
      </section>
    </main>
  </body>
</html>`);
            response.end();
            break;
        }

        case "POST /submit": {
            // 1. Odbiór danych wysłanych z formularza za pomocą metody POST
            let body = '';
            
            // Zdarzenie 'data' jest emitowane, gdy przychodzą kolejne fragmenty (chunks) danych
            request.on('data', chunk => {
                body += chunk.toString();
            });
            
            // Zdarzenie 'end' jest emitowane po odebraniu całych danych
            request.on('end', () => {
                // Dekodowanie danych typu 'application/x-www-form-urlencoded' (domyślny typ formularzy)
                const params = new URLSearchParams(body);
                const name = params.get("name");
                const message = params.get("message");
                
                // Jeśli przysłano wymagane pola, zapisz wpis
                if (name && message) {
                    saveEntry(name, message);
                }

                // Przekieruj z powrotem na stronę główną
                response.writeHead(302, { "Location": "/" });
                response.end();
            });
            break;
        }

        default:
            response.writeHead(501, { "Content-Type": "text/plain; charset=utf-8" });
            response.write("Błąd 501: Nie zaimplementowano");
            response.end();
    }
}

const server = http.createServer(requestListener);
server.listen(8000, () => {
    debug("Księga gości została uruchomiona na porcie 8000");
    debug("Sprawdź: http://localhost:8000/");
    debug('Aby zatrzymać serwer, naciśnij "CTRL + C"');
});
