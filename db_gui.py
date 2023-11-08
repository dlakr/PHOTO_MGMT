import sqlite3


def create_tables(conn, tname, columns, foreign_tables):
	# Example of foreign_tables = {"ext": 'extensions', "err": 'errors'}
	# Example of columns = {"path_file": "text NOT NULL UNIQUE", "path_rep": "text", "copied": "bool"}
	sql_foreign = ""
	t = []
	col_idx = 0
	for k, v in foreign_tables.items():
		sql_foreign = f"""CREATE TABLE IF NOT EXISTS {v} (
		id integer PRIMARY KEY, 
		{k} text NOT NULL UNIQUE);\n"""

		t.append(sql_foreign)
	main = f"""CREATE TABLE IF NOT EXISTS {tname} (\n	id integer PRIMARY KEY,"""

	for k, v in columns.items():
		col = f"	{k} {v},\n"
		main += col

	if foreign_tables.items():
		for k, v in foreign_tables.items():
			main += f"	{k} integer, \n"


		for k, v in foreign_tables.items():
			f = f"""	FOREIGN KEY ({k}) REFERENCES {v} ({k})"""
			if col_idx < len(columns)-1:
				f += ", \n"
			else:
				f += "\n"
			main += f
			col_idx += 1
		main += ");"

	else:
		main += ");"
	t.append(main)
	cur = conn.cursor()

	for tbl in t:
		print(tbl)
		cur.execute(tbl)
	print(t)
	with open("sql_cmd.txt", "a") as f:
		for i in t:
			f.write(i)
	return t


def create_foreign_entry(conn, value, k, v):
	sql = f"""INSERT or IGNORE INTO {v}({k}) VALUES(?)"""
	row = f"SELECT id FROM {v} WHERE {k} = ?"
	cur = conn.cursor()
	cur.execute(sql, (value,))
	cur.execute(row, (value,))
	row_id = cur.fetchall()[0][0]
	conn.commit()
	return row_id


def create_file_entry(conn,  selected_table, entry, columns, foreign_tables):
	# Example of foreign_tables = {"ext": 'extensions', "err": 'errors'}
	# Example of columns = {"path_file": "text NOT NULL UNIQUE", "path_rep": "text", "copied": "bool"}
	cols = []
	for i in columns:
		cols.append(i)
	for k, v in foreign_tables.items():
		cols.append(k)
		entry[k] = create_foreign_entry(conn, entry[k], k, v)
	cur = conn.cursor()
	# sql_files = f"""INSERT OR IGNORE INTO files(vol, path, ext, status) VALUES(?,?,?,?)"""
	sql_files = f"INSERT OR IGNORE INTO {selected_table}("
	l = len(cols)-1
	for idx, val in enumerate(cols):
		if idx < l:
			sql_files += val + ", "
		else:
			sql_files += val + ") VALUES("
	for idx, val in enumerate(cols):
		if idx < l:
			sql_files += "?,"
		else:
			sql_files += "?)"
	print(sql_files)
	# values = [v for v in entry.values()]
	# cur.execute(sql_files, values)
	#
	# conn.commit()


def create_foreign_entry_ex_err(conn, value, tname):
	sql = f"""INSERT or IGNORE INTO {tname}({tname[:3]}) VALUES(?)"""
	row = f"SELECT id FROM {tname} WHERE {tname[:3]} = ?"
	cur = conn.cursor()
	cur.execute(sql, (value,))
	cur.execute(row, (value,))

	row_id = cur.fetchall()[0][0]

	conn.commit()

	return row_id

def create_foreign_entry_volumes(conn, volume, ignored_status):
	sql = f"""INSERT or IGNORE INTO volumes (vol, ignored) VALUES(?,?)"""
	row = f"SELECT id FROM volumes WHERE vol = ?"
	cur = conn.cursor()
	cur.execute(sql, (volume, ignored_status))
	cur.execute(row, (volume,))

	row_id = cur.fetchall()[0][0]

	conn.commit()

	return row_id

def query_db(conn, tname, col, query):
	cur = conn.cursor()
	cur.execute(f"SELECT * FROM {tname} WHERE {col}", (query,))
	rows = cur.fetchall()

	return rows

def query_LIKE_db(conn, tname, col, query):
	cur = conn.cursor()
	cur.execute(f"SELECT * FROM {tname} WHERE {col} LIKE '{query}%'" )
	rows = cur.fetchall()

	return rows
def update_file_status(conn, path):
	"""
	row = the value that is looked for
	col = the column in which the value is looked for
	value = the value that the update will put in
	"""
	cur = conn.cursor()
	print(f'changing status of: {path}')
	cur.execute(f"UPDATE files SET status = True WHERE path = ?", (path,))
	conn.commit()


def update_db(conn, info):

	col_lookup = info[0]
	col_change = info[1]
	val_change = info[2]
	val_lookup = info[3]
	cur = conn.cursor()

	cur.execute(f"UPDATE files SET {col_change} = ? WHERE {col_lookup} = ?", (val_change, val_lookup))
	conn.commit()


