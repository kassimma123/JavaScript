import fs from 'node:fs';
import { argv, stdin, stdout } from 'node:process';
import { exec } from 'node:child_process';
import readline from 'node:readline';

// Ścieżka do pliku, w którym trzymamy licznik
const COUNTER_FILE = 'counter.txt';

// argv[2] to pierwszy argument po wywołaniu "node nazwa_skryptu.js"
const mode = argv[2]; 

// Inicjalizacja pliku licznika, jeśli jeszcze nie istnieje (używamy trybu sync dla uproszczenia startu)
if (!fs.existsSync(COUNTER_FILE)) {
    fs.writeFileSync(COUNTER_FILE, '0');
}

// ŚCIEŻKA 1: Tryb Synchroniczny
if (mode === '--sync') {
    // 1. Odczyt synchroniczny
    let count = parseInt(fs.readFileSync(COUNTER_FILE, 'utf-8'), 10);
    if (isNaN(count)) count = 0;
    
    // 2. Inkrementacja
    count++;
    
    // 3. Zapis synchroniczny
    fs.writeFileSync(COUNTER_FILE, count.toString());
    console.log(`  Liczba uruchomień: ${count}`);

// ŚCIEŻKA 2: Tryb Asynchroniczny (Callback-based)
} else if (mode === '--async') {
    // 1. Odczyt asynchroniczny poprzez Callback
    fs.readFile(COUNTER_FILE, 'utf-8', (err, data) => {
        if (err) throw err; // Obsługa błędu odczytu
        
        let count = parseInt(data, 10);
        if (isNaN(count)) count = 0;
        
        // 2. Inkrementacja
        count++;
        
        // 3. Zapis asynchroniczny poprzez Callback (zagnieżdżony w callbacku odczytu!)
        fs.writeFile(COUNTER_FILE, count.toString(), (err) => {
            if (err) throw err; // Obsługa błędu zapisu
            console.log(`  Liczba uruchomień: ${count}`);
        });
    });

// ŚCIEŻKA 3: Brak argumentów - tryb powłoki systemowej
} else if (!mode) {
    console.log('Wprowadź komendy — naciśnięcie Ctrl+D kończy wprowadzanie danych');
    
    // Używamy modułu readline do czytania wejścia linia po linii
    const rl = readline.createInterface({
        input: stdin,
        output: stdout,
        terminal: false
    });

    // Event 'line' uruchamia się po każdym wciśnięciu Enter przez użytkownika
    rl.on('line', (line) => {
        if (line.trim() === '') return;
        
        // Funkcja exec z modułu child_process odpala komendę w systemie operacyjnym
        exec(line, (error, stdout_data, stderr_data) => {
            if (error) {
                console.error(`Błąd wykonania: ${error.message}`);
                return;
            }
            if (stderr_data) {
                console.error(`Błąd wyjścia: ${stderr_data}`);
                return;
            }
            // Wypisujemy wynik komendy na ekran (np. listę plików po wpisaniu 'ls')
            console.log(stdout_data.trim());
        });
    });

} else {
    console.log('Nieznany argument. Użyj --sync, --async lub uruchom bez argumentów.');
}