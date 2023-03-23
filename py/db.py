import sqlite3

tables = {"vo": 'volumes', "ex": 'extensions', "er": 'errors'}

def create_tables(t_names):

	tables = [f""" CREATE TABLE IF NOT EXISTS files (
	id integer PRIMARY KEY, 
	vol integer NOT NULL, 
	path text NOT NULL UNIQUE,
	ext integer NOT NULL,
	err integer,
	status bool,
	FOREIGN KEY (vol) REFERENCES volumes (vol),
	FOREIGN KEY (ext) REFERENCES extensions (ext)
	FOREIGN KEY (err) REFERENCES errors (err)
	); """]

	for k, v in t_names.items():
		print(k, v)
		if k == 'vo':
			sql_foreign = f""" CREATE TABLE IF NOT EXISTS {v} (id integer PRIMARY KEY, {v[:3]} text NOT NULL UNIQUE, ignored bool NOT NULL); """
		else:
			sql_foreign = f""" CREATE TABLE IF NOT EXISTS {v} (id integer PRIMARY KEY, {v[:3]} text NOT NULL UNIQUE); """

		tables.append(sql_foreign)


	return tables

def create_connection(db_file):
	conn = None

	sql_tables = create_tables(tables)

	try:
		conn = sqlite3.connect(db_file)
		c = conn.cursor()

		for t in sql_tables:
			c.execute(t)

	except Exception as e:
		print(e)
	return conn

def create_file_entry(conn, entry):

	entry["ex"] = create_foreign_entry_ex_err(conn, entry["ex"], tables["ex"])
	entry["vo"] = create_foreign_entry_volumes(conn, entry["vo"], tables["vo"])
	cur = conn.cursor()
	print(f"entry:{entry}")
	sql_files = f"""INSERT INTO files(vol, path, ext, status) VALUES(?,?,?,?)"""
	values = [v for v in entry.values()]
	cur.execute(sql_files, values)

	conn.commit()

def create_foreign_entry_ex_err(conn, value, tname):
	sql = f"""INSERT or IGNORE INTO {tname}({tname[:3]}) VALUES(?)"""
	row = f"SELECT id FROM {tname} WHERE {tname[:3]} = ?"
	cur = conn.cursor()
	cur.execute(sql, (value,))
	cur.execute(row, (value,))

	row_id = cur.fetchall()[0][0]

	conn.commit()
	return row_id

def create_foreign_entry_volumes(conn, value, tname):
	sql = f"""INSERT or IGNORE INTO {tname}({tname[:3]}, ignored) VALUES(?, False)"""
	row = f"SELECT id FROM {tname} WHERE {tname[:3]} = ?"
	cur = conn.cursor()
	cur.execute(sql, (value,))
	cur.execute(row, (value,))

	row_id = cur.fetchall()[0][0]

	conn.commit()
	return row_id

