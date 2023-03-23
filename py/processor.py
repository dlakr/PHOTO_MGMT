#!/usr/bin/env python
import os
import json
import re
import shutil
from pathlib import Path
from db import create_connection, create_file_entry

# formats_path = '../format.json'
formats_path = r"F:\Dropbox\_Programming\PHOTO_MGMT\py\format.json"
with open(formats_path, 'r') as f:
	formats = json.load(f)['formats']
all_formats = formats['images'] + formats['videos']


class PhotoProcessor:

	def __init__(self):


		self.buffer_json = []
		self.counter = 0
		self.buffer_update = 0
		self.json_loc = ''
		self.copied_status = False
		self.vol_name = ''
		self.vol_path = ""

	def get_paths_to_DB(self):
		"""get absolute path of image file in the given formats"""

		vol_name = self.get_vol_name(self.vol_path)

		# with open(self.json_loc, "w+", encoding='UTF-8') as file:
		#
		# 	data = {vol_name: {self.copied_status: []}}
		# 	json.dump(data, file, indent=4)

		# pattern = r'\.(jpg|jpeg|heic|png)$'
		pattern = r'\.('
		for index, value in enumerate(all_formats):
			if index < len(all_formats) - 1:
				pattern += f'{value}|'
			else:
				pattern += f'{value})$'

		if os.path.exists(self.vol_path):
			count = 0

			for root, d_names, f_names in os.walk(self.vol_path):
				for file in f_names:

					path = os.path.join(root, file)
					self.buffer_json.append(path)
					# ext = re.findall(pattern, str(file).lower())
					# if ext:
					# 	self.buffer_json.append(path)
			self.write_database(self.buffer_json, self.vol_name)

	def write_database(self, buffer, v_name):
		# todo add extension to extension table

		database = "pm_database.db"
		conn = create_connection(database)
		for path in buffer:
			try:
				extension = os.path.splitext(os.path.split(path)[1])[1].lower()

			except IndexError as error:
				print(error)
				extension = 'n/a'
			entry = {'vo': v_name, "path": path, "ex": extension, "cp": False}
			entry_id = create_file_entry(conn, entry)

	def get_vol_name(self, path):

		exp = '[\w]*'	
		vn = re.findall(exp, os.path.split(path)[0])
		while("" in vn):
			vn.remove("")
		vol_name = vn[1]
		self.vol_name = vol_name
		return vol_name
		#todo: add volume name to volumes table

	# def write_json(self,path, data):
	#
	# 	with open(path, 'w') as f:
	# 		js = {self.vol_name: {self.copied_status: []}}
	# 		for i in data:
	# 			js[self.vol_name][self.copied_status].append(i)
	# 		json.dump(js, f, indent=4)
	# 		self.buffer_json = []



	def copy_from_json(self, dest):

		"""copy files to folder and update the json report"""

		log = ''
		with open(self.json_loc, 'r+', encoding='utf-8') as f:
			reader = json.load(f)
			vol_name = [k for k in reader.keys()][0]
			print(vol_name)
			vol_dest = os.path.join(dest, vol_name)
			log = os.path.join(dest, f'errors.csv')
			paths = reader[vol_name][self.copied_status]
			if not os.path.isdir(Path(vol_dest)):
				os.mkdir(vol_dest)
			for i in paths:
				fname = os.path.split(i)[1]
				dest_path = os.path.join(dest, fname)
				try:
					shutil.copy(i, dest_path)

				except Exception as error:
					#todo: add etrror name to error table
					with open(log, 'r+', encoding='utf-8') as f:

						data = json.load(f)
						err = {error: i}
						data.append(err)
						f.write(data)

	def copy_from_db(self, dest):

		"""copy files to folder and update the json report"""

		vol_dest = os.path.join(dest, vol_name)
		log = os.path.join(dest, f'errors.csv')
		paths = reader[vol_name][self.copied_status]
		if not os.path.isdir(Path(vol_dest)):
			os.mkdir(vol_dest)
		for i in paths:
			fname = os.path.split(i)[1]
			dest_path = os.path.join(dest, fname)
			try:
				shutil.copy(i, dest_path)

			except Exception as error:
				with open(log, 'r+', encoding='utf-8') as f:
					data = json.load(f)
					err = {error: i}
					data.append(err)
					f.write(data)

