import numpy as np
from glob import glob


labels = np.fromfile('labels.bin', dtype=np.uint8)
zero = np.where(labels == 0)[0]
eight = np.where(labels == 8)[0]
adv = np.where(labels == 10)[0]
other = np.where(np.logical_not(np.logical_or(labels==0, labels==8, labels==10)))[0]
indices = np.concatenate([zero, eight, other[:(500-len(eight)-len(zero)-len(adv))], adv])

print(indices)
for fn in glob('d*.bin'):
   data = np.fromfile(fn, dtype=np.float32)
   data = data.reshape([100,1000,-1])
   dataTruncated = data[0::2, indices, :]
   dataTruncated.tofile(fn)


labels = labels[indices].astype('uint8')
labels.tofile('labels.bin')