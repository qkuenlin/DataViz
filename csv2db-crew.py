import csv
import sqlite3


if __name__ == '__main__':
    # connection à la db
    conn = sqlite3.connect('db.sqlite')

    # lecture du fichier sous for de dico
    with open('crew.csv', "r", encoding="utf-8") as csvfile:
        crew = csv.DictReader(csvfile, delimiter=',', quotechar='"')
        # pour chaque ligne
        for row in crew:
            # On test si la personne existe deja
            with conn:
                cursor = conn.cursor()
                # Create a new record
                # dans SQL: raw = formatted et submitted = raw transmise
                sql = "SELECT id FROM Person WHERE id=(?)"
                cursor.execute(sql, (row["id"],))
                result = cursor.fetchall()
            # Si existe pas on la crée
            if len(result)==0:
                with conn:
                    cursor = conn.cursor()
                    sql = "INSERT INTO Person (id, Name, gender) VALUES (?,?,?)"
                    cursor.execute(sql, (row["id"], row["name"], row["gender"]))
                conn.commit()

            # On test si le job existe deja
            with conn:
                cursor = conn.cursor()
                sql = "SELECT id FROM Job WHERE job=(?)"
                cursor.execute(sql, (row["job"],))
                result = cursor.fetchall()
            # creation si existe pas
            if len(result)==0:
                with conn:
                    cursor = conn.cursor()
                    sql = "INSERT INTO Job (job) VALUES (?)"
                    cursor.execute(sql, (row["job"],))
                    job_id = cursor.lastrowid
                conn.commit()
            else:
                job_id = result[0][0] #recup l'id du job

            # Recup la liste des film qui est sous forme de chaine de carac
            row["movie_id"] = list(map(int,row["movie_id"].strip("[").strip("]").split(",")))
            # pour chaque film dans la liste
            for movie in row["movie_id"]:
                # On test si deja une entree dans L_person_movie existe deja
                with conn:
                    cursor = conn.cursor()
                    sql = "SELECT * FROM L_person_movie WHERE id_person = (?) AND id_movie=(?) AND id_job=(?)"
                    cursor.execute(sql, (row["id"], movie, job_id))
                    result = cursor.fetchall()
                # si existe pas...
                if len(result)==0:
                    # Test si film existe deja
                    with conn:
                        cursor = conn.cursor()
                        # Create a new record
                        # dans SQL: raw = formatted et submitted = raw transmise
                        sql = "SELECT id FROM movie WHERE id=(?)"
                        cursor.execute(sql, (movie,))
                        result = cursor.fetchall()
                    # creation du film
                    if len(result) == 0:
                        with conn:
                            cursor = conn.cursor()
                            sql = "INSERT INTO movie (id, title, release_date) VALUES (?,?,?)"
                            cursor.execute(sql, (movie, "test", "test"))
                        conn.commit()
                    # creation de l'entree dans L_person_movie
                    with conn:
                        cursor = conn.cursor()
                        sql = "INSERT INTO L_person_movie (id_person, id_movie, id_job, department) VALUES (?,?,?,?)"
                        cursor.execute(sql, (row["id"], movie, job_id, row["department"]))
                    conn.commit()


