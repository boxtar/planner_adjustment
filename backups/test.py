import csv

VERSION_INDEX = 0
RESBUD_INDEX = 1
RESBUD_T_INDEX = 2
SUB_PROJECT_INDEX = 3
PERIOD_INDEX = 4
DESC_INDEX = 5
AMOUNT_INDEX = 6
CURR_AMOUNT_INDEX = 7
PCB_BUDGET_INDEX = 8
AMENDMENT_INDEX = 9
FEC_LABEL = 'PBFEC'
PRICE_LABEL = 'PBPRICE';

FILENAME = 'test.csv'

def add_row_to_data(row, data):
    data.append([
        row[RESBUD_INDEX],
        row[RESBUD_T_INDEX],
        row[PERIOD_INDEX],
        row[DESC_INDEX],
        row[CURR_AMOUNT_INDEX],
        row[PCB_BUDGET_INDEX],
    ])

with open(FILENAME, newline='') as datafile:
    FEC_DATA = []
    PRICE_DATA = []
    SUB_PROJECT = ''
    
    reader = csv.reader(datafile, delimiter=',')
    for i, row in enumerate(reader):
        if i == 0:
            continue; # Skip header
            
        if i == 1:
            SUB_PROJECT = row[SUB_PROJECT_INDEX] # Save sub-project
            
        if row[VERSION_INDEX] == FEC_LABEL:
            add_row_to_data(row, FEC_DATA)
        elif row[VERSION_INDEX] == PRICE_LABEL:
            add_row_to_data(row, PRICE_DATA)


resbud_being_processed = ''            
for record in FEC_DATA:
    print(record)

