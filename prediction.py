import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelBinarizer
from keras.models import load_model
import argparse
import json

ap = argparse.ArgumentParser()
ap.add_argument("--d", required=True, help="Day")
ap.add_argument("--m", required=True, help="Month")
ap.add_argument("--p", required=True,
                help="Province")
args = vars(ap.parse_args())

model = load_model(r'/home/ubuntu/docs/nethravi-codes/data/model.hdf5')
df = pd.read_csv(r'/home/ubuntu/docs/nethravi-codes/data/data2.csv')
savefile = r'/home/ubuntu/docs/nethravi-codes/data/results.json'

month = df["Month"].tolist()
monthBinarizer = LabelBinarizer().fit(month)
trainMonthCategorical = monthBinarizer.transform([args["m"]])

day = df["Day"].tolist()
dayBinarizer = LabelBinarizer().fit(day)
trainDayCategorical = dayBinarizer.transform([args["d"]])

province = df["Province"].tolist()
provinceBinarizer = LabelBinarizer().fit(province)
trainProvinceCategorical = provinceBinarizer.transform([args["p"]])

testcase = np.hstack([trainMonthCategorical, trainDayCategorical, trainProvinceCategorical])
p = model.predict(testcase)
print(args["d"], args["m"], args["p"])
val = None
out = None
if (p[0][0] > p[0][1]):
    out = 'Kidnapping,Rape,Assault,Accident - '
    val = str(p[0][0]) + "%"
else:
    out = 'Murder,Robbery, Drug Dealing - '
    val = str(p[0][1]) + "%"

print("Result - ", out)

my_details = {
    'class': out,
    'accuracy': val
}

with open(savefile, 'w') as json_file:
    json.dump(my_details, json_file)
    savefile = r'/home/ubuntu/docs/nethravi-codes/data/results.json'

month = df["Month"].tolist()
monthBinarizer = LabelBinarizer().fit(month)
trainMonthCategorical = monthBinarizer.transform([args["m"]])

day = df["Day"].tolist()
dayBinarizer = LabelBinarizer().fit(day)
trainDayCategorical = dayBinarizer.transform([args["d"]])

province = df["Province"].tolist()
provinceBinarizer = LabelBinarizer