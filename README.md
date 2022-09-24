# E-PRO
 Economical PROcurement system
 
 Service
 https://epro.acdc.dev

Bootstrap 5 
https://getbootstrap.com/

Adminkit
https://github.com/adminkit/adminkit

datatables.js
chart.js

## docker-compose.yml
```yaml
version: '3'
services:
  epro:
    image: puri12/epro-dev:latest
    restart: always
    container_name: epro-dev
    ports:
      - <port>:3000
    environment:
      - MODULE_SECRETS=<SECRETS>
      - MYSQL_HOST=<HOST>
      - MYSQL_PORT=<PORT>
      - MYSQL_USER=<USER>
      - MYSQL_PASSWD=<PASSWORD>
      - MYSQL_DB=<DB>
```
