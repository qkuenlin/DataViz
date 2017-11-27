import sqlite3, csv

if __name__ == '__main__':
    # connection à la db
    conn = sqlite3.connect('db.sqlite')
    with open('Data/movie.csv', "r") as csvfile:
        movie = csv.DictReader(csvfile, delimiter=',', quotechar='"')

        for row in movie:
            cursor = conn.cursor()

            sql = "UPDATE Movie SET Budget=(?) WHERE id=(?)"
            cursor.execute(sql, (row["budget"], row["id"]))
        conn.commit()