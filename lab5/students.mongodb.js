// MongoDB Playground dla VS Code
//
// Jak tego użyć w VS Code:
// 1. Otwórz to rozszerzenie MongoDB po lewej stronie VS Code (ikonka z liściem/bazą danych).
// 2. Połącz się z lokalną bazą (Add Connection -> kliknij "Connect" na domyślnym adresie mongodb://localhost:27017).
// 3. Po połączeniu kliknij przycisk odtwarzania "Play" (Run Playground) w prawym górnym rogu tego pliku,
//    aby wykonać poniższe instrukcje.

// 1. Utworzenie / przełączenie na bazę danych o nazwie 'AGH'
use('AGH');

// Opcjonalne wyczyszczenie kolekcji 'students' przed wstawieniem danych (żeby nie dublować przy każdym uruchomieniu)
db.students.drop();

// 2. Utworzenie kolekcji 'students' oraz wstawienie kilku rekordów
db.students.insertMany([
  { name: "Jan Kowalski", faculty: "WIET" },
  { name: "Anna Nowak", faculty: "WMS" },
  { name: "Piotr Wiśniewski", faculty: "WI" },
  { name: "Katarzyna Wójcik", faculty: "WIET" },
  { name: "Tomasz Kowalczyk", faculty: "WMS" },
  { name: "Maria Kamińska", faculty: "WI" }
]);

// 3. Wyszukanie studentów konkretnego wydziału (np. "WIET")
// (Wynik tego zapytania pojawi się w nowej karcie po prawej stronie pod nazwą "Playground Result")
db.students.find({ faculty: "WIET" });
