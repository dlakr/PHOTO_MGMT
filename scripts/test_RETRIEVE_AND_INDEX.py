from RETRIEVE_AND_INDEX import PhotoAnalysis
import unittest
import json
import os


pa = PhotoAnalysis()
test_loc = os.path.abspath(os.path.join(os.getcwd(), "../test_data"))
json_by_type = os.path.join(test_loc, 'temp.json')
csv_paths = os.path.join(test_loc, 'temp.csv')
class TestMain(unittest.TestCase):


	# def test_process_all_img(self):
	# 	result = pa.process_all_img(path=r"C:\Users\DL\Desktop\2022-02-19\2022-02-19 15.48.58.jpg")
	# 	self.assertEqual(result, '')

	def test_csv_to_json(self):
		result = pa.csv_to_json(csv_paths)
		with open(json_by_type, 'r') as f:
			data = json.load(f)
			self.assertEqual(result, data)


if __name__ == "__main__":
	tm = TestMain()