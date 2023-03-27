import sqlite3


class DB:
	def __init__(self):
		self.tables = {"vo": 'volumes', "ex": 'extensions', "er": 'errors'}

	def create_tables(self, conn):

		t = [f""" CREATE TABLE IF NOT EXISTS files (
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

		for k, v in self.tables.items():

			if k == 'vo':
				sql_foreign = f""" CREATE TABLE IF NOT EXISTS {v} (id integer PRIMARY KEY, {v[:3]} text NOT NULL UNIQUE, ignored bool NOT NULL); """
			else:
				sql_foreign = f""" CREATE TABLE IF NOT EXISTS {v} (id integer PRIMARY KEY, {v[:3]} text NOT NULL UNIQUE); """

			t.append(sql_foreign)
		cur = conn.cursor()
		for tbl in t:
			cur.execute(tbl)



	def create_connection(self, db_file):

		conn = sqlite3.connect(db_file)
		return conn


	def create_file_entry(self, conn, entry):

		entry["ex"] = self.create_foreign_entry_ex_err(conn, entry["ex"], self.tables["ex"])
		entry["vo"] = self.create_foreign_entry_volumes(conn, entry["vo"], False)
		cur = conn.cursor()

		sql_files = f"""INSERT OR IGNORE INTO files(vol, path, ext, status) VALUES(?,?,?,?)"""
		values = [v for v in entry.values()]
		cur.execute(sql_files, values)

		conn.commit()


	def create_foreign_entry_ex_err(self, conn, value, tname):
		sql = f"""INSERT or IGNORE INTO {tname}({tname[:3]}) VALUES(?)"""
		row = f"SELECT id FROM {tname} WHERE {tname[:3]} = ?"
		cur = conn.cursor()
		cur.execute(sql, (value,))
		cur.execute(row, (value,))

		row_id = cur.fetchall()[0][0]

		conn.commit()

		return row_id

	def create_foreign_entry_volumes(self, conn, volume, ignored_status):
		sql = f"""INSERT or IGNORE INTO volumes (vol, ignored) VALUES(?,?)"""
		row = f"SELECT id FROM volumes WHERE vol = ?"
		cur = conn.cursor()
		cur.execute(sql, (volume, ignored_status))
		cur.execute(row, (volume,))

		row_id = cur.fetchall()[0][0]

		conn.commit()

		return row_id

	def query_db(self, conn, tname, col, query):
		cur = conn.cursor()
		cur.execute(f"SELECT * FROM {tname} WHERE {col}", (query,))
		rows = cur.fetchall()

		return rows

	def query_LIKE_db(self, conn, tname, col, query):
		cur = conn.cursor()
		cur.execute(f"SELECT * FROM {tname} WHERE {col} LIKE '{query}%'" )
		rows = cur.fetchall()

		return rows
	def update_file_status(self, conn, path):
		"""
		row = the value that is looked for
		col = the column in which the value is looked for
		value = the value that the update will put in
		"""
		cur = conn.cursor()
		print(f'changing status of: {path}')
		cur.execute(f"UPDATE files SET status = True WHERE path = ?", (path,))
		conn.commit()


	def update_db(self, conn, info):

		col_lookup = info[0]
		col_change = info[1]
		val_change = info[2]
		val_lookup = info[3]
		cur = conn.cursor()

		cur.execute(f"UPDATE files SET {col_change} = ? WHERE {col_lookup} = ?", (val_change, val_lookup))
		conn.commit()


