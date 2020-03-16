import numpy as np
from glob import glob

#for fn in glob('d*.bin'):
#    data = np.fromfile(fn, dtype=np.float32)
#    data = data.reshape([100,1000,-1])
#    dataTruncated = data[::2, ::2, :]
#    dataTruncated.tofile(fn)


labels = np.fromfile('labels.bin', dtype=np.uint8)
labels = labels[::2]
labels.tofile('labels.bin')
