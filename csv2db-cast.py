import csv, sys
import sqlite3


if __name__ == '__main__':
    # connection à la db
    conn = sqlite3.connect('db.sqlite')

    # lecture du fichier sous for de dico
    with open('Data/cast2.csv', "r", encoding="latin-1") as csvfile:
        cast = csv.DictReader(csvfile, delimiter=',', quotechar='"')
        # pour chaque ligne
        for row in cast:

            # On test si le film existe deja
            with conn:
                cursor = conn.cursor()
                # Create a new record
                # dans SQL: raw = formatted et submitted = raw transmise
                sql = "SELECT id FROM Movie WHERE id=(?)"
                cursor.execute(sql, (int(float(row["movie_id"])),))
                result = cursor.fetchall()
            # Si existe passe au suivant
            if len(result)==0:
                continue
            # verif si personne existe
            with conn:
                cursor = conn.cursor()
                # Create a new record
                # dans SQL: raw = formatted et submitted = raw transmise
                sql = "SELECT id FROM person WHERE id=(?)"
                cursor.execute(sql, (row["id"],))
                result = cursor.fetchall()
            if len(result) == 0:
                with conn:
                    cursor = conn.cursor()
                    sql = "INSERT INTO Person (id, Name, gender) VALUES (?,?,?)"
                    cursor.execute(sql, (row["id"], row["name"], row["gender"]))

            # On test si deja une entree dans L_person_movie existe deja
            with conn:
                cursor = conn.cursor()
                sql = "SELECT * FROM L_person_movie WHERE id_person = (?) AND id_movie=(?) AND id_job=(?)"
                cursor.execute(sql, (row["id"], int(float(row["movie_id"])), 1))
                result = cursor.fetchall()
            if len(result) == 0:
                with conn:
                    cursor = conn.cursor()
                    sql = "INSERT INTO L_person_movie (id_person, id_movie, id_job, department, rôle) VALUES (?,?,?,?,?)"
                    cursor.execute(sql, (row["id"], int(float(row["movie_id"])), 1, "Cast", row["character"]))
            else:
                print((row["id"], row["movie_id"], row["character"]))

    conn.commit()


