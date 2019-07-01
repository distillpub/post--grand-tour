import numpy as np
from glob import glob
import imageio
import matplotlib.pyplot as plt


def index2rect(i, ncol=100, size=28):
    return [
        [int((i//ncol)*size), int((i//ncol+1)*size)], #row bound
        [int((i%ncol)*size), int(((i%ncol)+1)*size)]
    ]


dataset = 'mnist'
isAdversarial = True
folder_in = 'data/softmax/{}/'.format(dataset)
folder_out = './'
labels = np.fromfile(folder_in + 'labels-test.bin', dtype=np.uint8)

if dataset == 'mnist':
    eight = np.where(labels == 8)[0]
    zero = np.where(labels == 0)[0]
    other = np.where(np.logical_not(np.logical_or(labels==0, labels==8)))[0]
    indices = np.concatenate([zero, eight, other[:500-len(eight)-len(zero)]])
else:
    indices = np.arange(0,1000,2)

# print(indices)
tile = imageio.imread(folder_in + 'input-test.png')
npoint = 500
ncol = 100
size = tile.shape[1] / ncol
res = np.zeros([int(npoint//ncol*size), int(ncol*size), 3])
for j,i in enumerate(indices):
    fr = index2rect(i, ncol, size)
    to = index2rect(j, ncol, size)
    res[to[0][0]:to[0][1], to[1][0]:to[1][1]] = tile[fr[0][0]:fr[0][1], fr[1][0]:fr[1][1]]

if isAdversarial:
    adversarial = imageio.imread('_input_.png')
    startRow = int(size*10)
    for i in range(0,100,2):#epoch index
        res = np.r_[res, adversarial[startRow+int(i*size):startRow+int((i+1)*size),:]]

res = res.astype('uint8')
imageio.imwrite(folder_out+'input.png', res)
# plt.imshow(res/255)
# plt.show()



