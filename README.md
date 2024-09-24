docker commands

sudo docker run --name postgres-db -e POSTGRES_PASSWORD=password -e POSTGRES_USER=test1user -e POSTGRES_DB=test1db -p 5432:5432 -d postgres

sudo docker exec -it postgres-db psql -U test1user -d test1db
