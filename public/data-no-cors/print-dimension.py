from PIL import Image
from glob import glob

dir0 = './data/examples/*/'
for fn in glob(dir0 + '*.png'):
    img = Image.open(fn)
    print(fn)
    print(list(img.size))