#!/usr/bin/python

import os
from PIL import Image

MAX_WIDTH = 1024
MAX_HEIGHT = 768

lst = open('/tmp/list').read().split("\n")

def scale_down(img):
    full_scale = Image.open('pictures/' + img)

    o_w, o_h = full_scale.size

    def isInt(h): return h != 'auto'

    if o_w < o_h: w, h = 'auto', MAX_HEIGHT
    if o_w > o_h: w, h = MAX_WIDTH, 'auto'

    if w == 'auto' and isInt(h):
        w = int(int(h) * o_w / o_h);
    if h == 'auto' and isInt(w):
        h = int(int(w) * o_h / o_w);
    if h == 'auto' and w == 'auto':
        # bone-head-ness
        raise "both height and width cannot be auto"

    w, h = int(w), int(h)

    try:
        os.makedirs('scaled_pictures/'+'/'.join(img.split('/')[:-1]))
    except:
        pass

    scaled_name = 'scaled_pictures/' + img

    scaled_file = open(scaled_name, 'w')
                # resample and resize
    scaled_data = full_scale.resize((w, h), 1)
    scaled_data.save(scaled_file, 'JPEG', quality=80)

cnt = len(lst)
i=0

def ifExists(fn):
    try:
        open(fn, 'r')
        return True
    except:
        return False

for l in lst:
    i += 1
    print "%d/%d: %s" % (i, cnt, l)
    try:
        if not ifExists('scaled_pictures/%s' % l):
            scale_down(l)
    except:
        print "ERROR SCALING: %s" % l

