
#!m_venv\Scripts\python3
from bs4 import BeautifulSoup
import os
import re
import csv
import pandas as pd
import PIL
from PIL import Image, ImageFile
from pillow_heif import register_heif_opener
from PIL.ExifTags import TAGS
import sys

ImageFile.LOAD_TRUNCATED_IMAGES = True
register_heif_opener()
location = ''
temp_csv = 'temp.csv'
temp_loc = os.path.abspath(os.path.join(os.getcwd(), '..', "temp_data"))

temp_csv_loc = os.path.join(temp_loc, temp_csv)

test_location = r'F:\Dropbox\pictures_sorted\2009'
if os.name == 'nt':
    desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop')
else:
    desktop = os.path.join(os.path.join(os.path.expanduser('~')), 'Desktop')
try:
    output_folder = os.mkdir(os.path.join(desktop, 'photo_analysis'))
except FileExistsError as error:
    output_folder = os.path.join(desktop, 'photo_analysis')
    print(output_folder)
print(desktop)

class PhotoAnalysis:

    def __init__(self):
        self.directory = ''
        self.buffer = []
        self.counter = 0
        self.fieldnames = ['METADATA', 'PATH']
        self.append = False
        self.dict_update = 0
        self.size_dump = True
        self.date_sorted_csv_output = os.path.join(output_folder, 'date_sorted.csv')
        self.no_date_csv_output = os.path.join(output_folder, 'no_date.csv')
        self.xlsx_index = os.path.join(output_folder, 'index.xlsx')
        self.sorted_result = {}
        if os.path.exists(temp_csv_loc):

            c = input('continue where you left off?(y/n)')
            if c.lower() == 'y':
                self.continue_analysis()
            else:
                self.start_analysis()
        else:
            self.start_analysis()

    def check_temp_csv(self, temp_csv_loc):
        """checks if temp_csv exists and returns its latest entry parent"""

    def write_html(self, data):
        link = """<ul>
        """
        for i in data:
            link = link + f"""<li><b>{i[self.fieldnames[0]]}</b><a href="{i[self.fieldnames[1]]}">{i[self.fieldnames[1]]}
            </a></li>\n"""
        link += "</ul>"
        print(link)
        soup = BeautifulSoup(link, 'html.parser')
        output_loc = os.path.join(output_folder, "output.html")
        with open(output_loc, "w", encoding='utf-8') as file:
            # prettify the soup object and convert it into a string
            file.write(str(soup.prettify()))



    def start_analysis(self):
        """starts a new analysis at the given path"""

        while self.directory != 'q':

            print('s = sort entries and output xlsx index')
            print('r = generate report (csv)')
            print('e = end aquiring process')
            # print('xl = generate excel from csv ')
            print('q = quit')
            self.directory = input('Enter directory:')
            if self.directory == '':
                self.directory = test_location
                self.get_data(self.directory)
            if self.directory == 'e':
                self.end_aquisition()
                self.generate_report(self.sorted_result)
            elif self.directory == 's':
                self.end_aquisition()
                self.sorted_result = self.sort_temp_csv()

            # elif self.directory == 'xl':
            #     self.end_aquisition()
            #     self.generate_xlsx_index()
            elif self.directory == 'r':
                self.end_aquisition()
            else:
                self.get_data(self.directory)


        self.end_aquisition()


    def end_aquisition(self):
        self.write_csv(temp_csv_loc, self.buffer, size_dump=False)
        with open('dir_to_analyse.txt', 'w') as f:
            f.write(self.directory)


    def read_csv(self, csv_loc):
        with open(csv_loc, encoding='utf-8', newline='') as f:
            reader = csv.DictReader(f, delimiter=',')
            result = list(reader)
            return result

    def sort_temp_csv(self):
        """sorts out entries by date to a desktop file and"""
        print('sorting')
        print(temp_csv_loc)
        data = self.read_csv(temp_csv_loc)
        sorted_list = sorted(data, key=lambda d: d[self.fieldnames[0]])
        undated = []
        dated = []

        for i in sorted_list:
            if i[self.fieldnames[0]] == '-not_dated-'  or i[self.fieldnames[0]] == 'UNKNOWN FORMAT':
                undated.append(i)
            else:
                dated.append(i)
        sorted_result = {'dated': dated, 'undated':undated}

        self.split_sorted_result_dated(dated)
        return sorted_result


    def split_sorted_result_dated(self, lod):
        """will group the dated entries by year when supplied a lod (list of dictionaries)"""
        years_dict = {}
        years = []
        for e in lod:
            year = e[self.fieldnames[0]][:4]
            if year not in years:
                years.append(year)
                years_dict[year] = [e]
            else:
                years_dict[year].append(e)
        return years_dict


    def append_year_address(self, year):
        """ will append the location of the html page created"""
        output_path = os.path.join(output_folder, 'pages', f'{year}.html')
        return output_path

    def generate_report(self, sorted_data):
        """generates a report counting files by month"""

        report_dict = {}
        if sorted_data:
            data = sorted_data
        else:
            path = input('what is the sorted data location (enter to use default)')
            if path == '':
                path = self.date_sorted_csv_output
            data = self.read_csv(path)

        for i in data:
            pattern = r'^\d{4}:\d{2}'
            value = i[self.fieldnames[0]]
            month = re.findall(pattern, value)
            if not month:
                month = ['NOT DATED']
            if month[0] in report_dict:
                report_dict[month[0]] += 1
            else:
                report_dict[month[0]] = 1


        output_path = os.path.join(output_folder, 'report.csv')

        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            for i in report_dict.items():

                writer.writerow(i)


    def continue_analysis(self):
        """continues an existing analysys at existing location"""
        self.append = True
        self.dict_update = 1
        self.start_analysis()

    def process_all_img(self, path):
        """retrieves date metadata if file is in HEIC format"""
        print(path)
        r = {self.fieldnames[0]: 'UNKNOWN FORMAT', self.fieldnames[1]: path}
        try:
            img = Image.open(path)
            img_exif = img.getexif()

            if img_exif:
                exif = {TAGS[k]:v for k, v in img_exif.items() if k in TAGS and type(v) is not bytes}
                pattern = r'\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}'
                exif_date = re.findall(pattern, str(exif.get('DateTime')))
                if exif_date:
                    date = exif_date[0]
                else:
                    date = '-not_dated-'
            else:
                date = '-not_dated-'
            return {self.fieldnames[0]: date, self.fieldnames[1]: path}
        except PIL.UnidentifiedImageError as error:
            return r
        except OSError as error:
            r_os = r
            r_os[self.fieldnames[0]] = 'Truncated File'
            return r_os

    def get_data(self, directory):
        """get absolute path of image file in the given formats"""
        pattern = r'\.(jpg|jpeg|heic|png)$'
        if os.path.exists(directory):
            for root, d_names, f_names in os.walk(directory):

                for file in f_names:
                    path = os.path.join(root,file)
                    ext = re.findall(pattern, str(file).lower())
                    if ext:
                        self.buffer.append(self.process_all_img(path))
                        # if ext[0] == 'jpg' or ext[0] == 'bmp':
                        #
                        #     self.buffer.update(self.process_jpg_bmp(path))
                        # elif ext[0] == 'heic':
                        #     self.buffer.update(process_all_img(path))

                self.write_csv(temp_csv_loc, self.buffer, size_dump=True)
        buff = self.remove_duplicate(self.read_csv(temp_csv_loc))
        self.output(temp_csv_loc, buff, append=False)

    def remove_duplicate(self, dictionary):
        new_list = [dict(t) for t in {tuple(d.items()) for d in dictionary}]
        return new_list

    def output(self, file_loc, buffer, append):
        open_type = 'a'
        if not append:
            open_type = 'w'
        with open(file_loc, open_type, encoding='UTF-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=self.fieldnames)
            if open_type == 'w':
                writer.writeheader()
            for i in buffer:

                writer.writerow(i)
            f.close()

    def output_temp(self, file_loc, buffer, append):
        self.output(file_loc, buffer, append)
        self.buffer = []
        self.counter = 0

    def write_csv(self, file_loc, dictionnary, size_dump):
        if size_dump:
            if sys.getsizeof(dictionnary) >= 10000:
                self.dict_update += 1
                if self.dict_update == 1:
                    print('overwriting')
                    self.append = False
                else:
                    print('appending')
                    self.append = True
                self.output_temp(file_loc, dictionnary, self.append)
        else:
            self.output_temp(file_loc, dictionnary, self.append)

    def __exit__(self, exc_type, exc_val, exc_tb):

        self.write_csv(temp_csv_loc, self.buffer, size_dump=False)# the dump is not linked budder_dict size

if __name__ == "__main__":
    pa = PhotoAnalysis()