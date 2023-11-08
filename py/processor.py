#!/usr/bin/env python
import os
import json
import re
import shutil
from pathlib import Path
# from db import create_connection, create_file_entry, query_db
from db import DB
db = DB()

# formats_path = '../format.json'
wd =os.getcwdb().decode('utf-8')
formats_path = os.path.join(wd, "format.json")

with open(formats_path, 'r') as f:
	formats = json.load(f)['formats']
all_formats = formats['images'] + formats['videos']
# copies_dest = "~/Desktop"
copies_dest = r"C:\Users\DL\Desktop"
database = "pm_database.db"
class PhotoProcessor:

	def __init__(self):


		self.buffer = []
		self.counter = 0
		self.buffer_update = 0
		self.json_loc = ''
		self.copied_status = False
		self.vol_name = ''
		self.vol_path = ""

	def get_paths_to_DB(self):
		"""get absolute path of image file in the given formats"""

		vol_name = self.get_vol_name(self.vol_path)

		if os.path.exists(self.vol_path):
			count = 0

			for root, d_names, f_names in os.walk(self.vol_path):
				for file in f_names:

					path = os.path.join(root, file)
					self.buffer.append(path)
			self.write_database(self.buffer, self.vol_name)

	def write_database(self, buffer, v_name):

		conn = db.create_connection(database)
		for path in buffer:
			try:
				extension = os.path.splitext(os.path.split(path)[1])[1].lower()

			except IndexError as error:
				print(error)
				extension = 'n/a'
			entry = {'vo': v_name, "path": path, "ex": extension, "cp": False}
			print(f"appending -- {path}")
			entry_id = db.create_file_entry(conn, entry)


	def get_vol_name(self, path):

		exp = '[\w]*'	
		vn = re.findall(exp, os.path.split(path)[0])
		while("" in vn):
			vn.remove("")
		vol_name = vn[1]
		self.vol_name = vol_name
		return vol_name

	def find_pattern(self, path):

		pattern = r'\.('
		for index, value in enumerate(all_formats):
			if index < len(all_formats) - 1:
				pattern += f'{value}|'
			else:
				pattern += f'{value})$'
		ext = re.findall(pattern, str(path).lower())
		if ext:
			match = True
		else:
			match = False
		return match

	def copy(self):

		"""copy files to folder and update the json report"""
		# todo: if i use the buffer as a source i will be able to concurrent.futures to thread the process

		# todo: must check if volume is in database, if so load data in buffer - check is done at plugin

		error_count = 0
		errors = {}
		copied = 0
		copied_type = {}
		skipped = 0
		skipped_type = {}


		dest = os.path.join(copies_dest, "copies", self.vol_name)
		if not os.path.isdir(Path(dest)):
			os.makedirs(dest)
		for i in self.buffer:
			ext = os.path.splitext(os.path.split(i)[1])[1].lower()
			if self.find_pattern(i):
				conn = db.create_connection(database)
				fname = os.path.split(i)[1]
				dest_path = os.path.join(dest, fname)
				try:
					shutil.copy(i, dest_path)

					info = ('path', "status", True, i)
					db.update_db(conn, info)
					copied_type[ext] = copied_type.get(ext, 1) + 1
					copied += 1
					print(info)
				except Exception as error:
					info = ('path', "err", error, i)
					errors.update({error, i})
					db.update_db(conn, info)
					error_count += 1
			else:
				skipped_type[ext] = skipped_type.get(ext, 1) + 1
				skipped += 1
		e = self.format_report(errors)
		c = self.format_report(copied_type)
		s = self.format_report(skipped_type)
		report = f"""
		{copied} files copied:
		{c}
		{skipped} files skipped:
		{s}
		{error_count} errors:
		{e}
		"""
		return report


	def format_report(self, dic):
		lst = ''
		for k, v in dic.items():
			lst += f"   {k}: {v}\n"
		return lst