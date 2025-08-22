

#  ScannerHS - Der Scanner für HS



##  TODO
- [ ] Set-Up professional backend structure
- [ ] Rest-API conform
- [ ] Dokumentation
- [ ] Web-Frontend
- [ ] Setup DB structure
- [ ] Setup standart values
- [ ] Docker-Setup


## Aktuelle Funktionen


- **User anlegen** (`POST /users`)  
- **Logging** (`POST /logs`)  
- **Login** und JWT-Token holen (`POST /login`)  
- **Aktuellen User** abrufen (`GET /users/me`)  
- **User nach ID** abrufen (`GET /user/{user_id}`)  
- **Inventar anzeigen** (`GET /inventory`)  
- **Bestand setzen** (`POST /set_amount`)  
- **Gesamtes Inventar leeren** (`DELETE /clear_inventory`)  








# Examples


1. `example_user_create.json` → Payload für `POST /users`
2. `example_user_login.json` → Payload für `POST /login`
3. `example_inventory_set.json` → Payload für `POST /set_amount`
4. `example_inventory_list_response.json` → Beispiel-Response für `GET /inventory`
5. `example_inventory_clear_response.json` → Beispiel-Response für `DELETE /clear_inventory`
6. `test_requests.http` → VSCode/Insomnia Requests mit `@include`
7. `example_curl.sh` → Bash-Skript mit curl-Beispielen (jq für JWT)


