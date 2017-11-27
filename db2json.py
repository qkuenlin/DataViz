import sqlite3, json

if __name__ == '__main__':
    conn = sqlite3.connect('db.sqlite')
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    sql = "SELECT id_person, Name, id_movie, title, release_date,\
  keywords, overview, populatiry, production_companies, runtime,\
  revenue, Budget, tagline, vote_average, vote_count, id_job, job, department, rôle \
  FROM L_person_movie as lpm\
    JOIN Person as p ON lpm.id_person=p.id\
    JOIN Movie as m ON lpm.id_movie= m.id\
    JOIN Job as j ON lpm.id_job= j.id\
  WHERE m.populatiry>=50;"

    cursor.execute(sql)

    result = cursor.fetchall()
    d_pid={}
    d_job={}
    for x in result:
        if x["id_person"] in d_pid.keys():
            d_pid[x["id_person"]] += 1
        else:
            d_pid[x["id_person"]] = 1

        if x["job"] in d_job.keys():
            d_job[x["job"]] += 1
        else:
            d_job[x["job"]] = 1


    l_movie = []
    l_mid = []
    l_person = []
    l_pid = []
    l_lien = []

    for r in result:
        if d_pid[r["id_person"]] > 1 and d_job[r["job"]] > 10:
            r= dict(r)
            if r["id_person"] not in l_pid:
                d_person = {"id_person": r["id_person"], "name": r["Name"]}
                l_person.append(d_person)
                l_pid.append(r["id_person"])

            d_lien = {"id_person": r["id_person"], "id_movie": r["id_movie"],
                      "job": r["job"], "department": r["department"], "role": r["rôle"]}
            l_lien.append(d_lien)

            if r["id_movie"] not in l_mid:
                r.pop("id_person")
                r.pop("department")
                r.pop("job")
                r.pop("id_job")
                r.pop("rôle")
                l_movie.append(r)
                l_mid.append(r["id_movie"])

    print(len(l_person), len(l_movie), len(l_lien))
    counter={}
    temp=[]
    for x in l_lien:
        if x["department"] == "Crew":
            if x["job"] in counter.keys():
                counter[x["job"]] += 1
            else:
                counter[x["job"]] = 1
        else:
            temp.append(x["job"])

    print("\n".join(map(lambda x: "{} : {} ({})".format(x[0],x[1], True if x[0] in temp else False), counter.items())))

    l_lien = list(filter(lambda x: x["department"] != "Crew", l_lien))

    print(len(l_lien))

    with open("movie2.json", "w") as f:
        json.dump(l_movie, f, indent=4)
    with open("people.json", "w") as f:
        json.dump(l_person, f, indent=4)
    with open("lien.json", "w") as f:
        json.dump(l_lien, f, indent=4)
