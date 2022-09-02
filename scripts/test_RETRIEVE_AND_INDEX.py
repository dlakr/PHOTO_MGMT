from RETRIEVE_AND_INDEX import PhotoAnalysis
import unittest


pa = PhotoAnalysis()


class TestMain(unittest.TestCase):

	def test_process_all_img(self):
		result = pa.process_all_img(path=r"C:\Users\DL\Desktop\2022-02-19\2022-02-19 15.48.58.jpg")
		self.assertEqual(result, '')
