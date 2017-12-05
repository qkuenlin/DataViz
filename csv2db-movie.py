import csv
import sqlite3

#TODO mettre le budget
if __name__ == '__main__':
    # connection à la db
    conn = sqlite3.connect('db.sqlite')

    with open("Data/genre.csv", "r", encoding="utf-8") as csvfile:
        genre_dico = csv.DictReader(csvfile, delimiter=",", quotechar='"')
        genre_dico = {int(l["id"]):l["name"] for l in genre_dico}
    print(genre_dico)



    # lecture du fichier sous for de dico
    with open('Data/movie.csv', "r") as csvfile:

        movie = csv.DictReader(csvfile, delimiter=',', quotechar='"')
        # pour chaque ligne
        for row in movie:
            with conn:
                cursor = conn.cursor()
                sql = "SELECT * FROM Movie WHERE id=(?)"
                cursor.execute(sql, (row["id"],))
                result = cursor.fetchall()
            if len(result) == 0:
                with conn:
                    cursor = conn.cursor()
                    try:
                        float(row["vote_average"])
                    except:
                        row["vote_average"] = row["vote_count"]
                        row["vote_count"] = row["Unnamed: 20"]
                    sql = "INSERT INTO Movie (id, title, release_date, homepage, keywords, original_language,\
 original_title, overview, populatiry, production_companies, production_countries, revenue, runtime,\
  spoken_language, status, tagline, vote_average, vote_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
                    cursor.execute(sql, (row["id"], row["title"], row["release_date"], row["homepage"], \
                                         row["keywords"],row["original_language"],row["original_title"], \
                                         row["overview"], int(float(row["popularity"])), row["production_companies"],\
                                         row["production_countries"], int(row["revenue"]),\
                                         int(float(row["runtime"])) if row["runtime"] != '' else 0,\
                                         row["spoken_languages"], row["status"], row["tagline"],\
                                         float(row["vote_average"]), int(float(row["vote_count"]))))

            row["genres"] = [ int(g) for g in row["genres"].strip("[").strip("]").split(",") if g!= '']
            for genre in row["genres"]:
                # On test si le genre existe deja
                with conn:
                    cursor = conn.cursor()
                    sql = "SELECT * FROM Genre WHERE id=(?)"
                    cursor.execute(sql, (genre,))
                    result = cursor.fetchall()
                # creation si existe pas
                if len(result)==0:
                    with conn:
                        cursor = conn.cursor()
                        sql = "INSERT INTO Genre (id,genre) VALUES (?,?)"
                        cursor.execute(sql, (genre, genre_dico[genre]))
                    conn.commit()

                # Ajout du lien
                with conn:
                    cursor = conn.cursor()
                    # Create a new record
                    # dans SQL: raw = formatted et submitted = raw transmise
                    sql = "SELECT * FROM L_movie_genre WHERE id_movie=(?) AND id_genre=(?)"
                    cursor.execute(sql, (row["id"],genre))
                    result = cursor.fetchall()
                # Si existe pas on la crée
                if len(result)==0:
                    with conn:
                        cursor = conn.cursor()
                        sql = "INSERT INTO L_movie_genre (id_movie, id_genre) VALUES (?,?)"
                        cursor.execute(sql, (row["id"], genre))
                    conn.commit()


