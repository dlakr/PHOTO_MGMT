from RETRIEVE_AND_INDEX import PhotoAnalysis as pa
import unittest
class TestMain(unittest.TestCase):
	def test_process_all_img(self):
		self.assertEqual(pa.process_all_img(path=r"C:\Users\DL\Desktop\2022-02-19\2022-02-19 15.48.58.jpg"),{'result':'result'}, f'should be something')