#!/usr/bin/env python
from processor import *
# todo: make a simple terminal interface to test process on remote computer.
pr = PhotoProcessor()


class TUI:

	def __init__(self):
		self.input = ""

	def menu(self):
		# todo prepare an input to remove a volume from the ignored list
		self.input = input("""
		index = i
		copy = c
		list initial volumes = l
		""")
		while self.input != "q":
			# print("""
			# index = i
			# copy = c
			# """)

			if self.input == 'c':
				pass
			elif self.input == 'i':
				pass
			elif self.input == 'l':
				pass
			elif self.input == 'r':
				pass
				# next input gives a list of ignored volumes to trigger a "remove" function on.
			elif self.input == 'q':
				pass


tui = TUI()
# if __name__ == "__main__":
# 	TUI().run()