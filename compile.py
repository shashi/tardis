#!/usr/bin/python

# scan the _pages directory, compile them to json used by the main app
# also generate timeline.json which is like a blueprint for drawing the
# timeline at the bottom of the app.

import os
import re
import time
import yaml
import json
from textile import textile
from PIL import Image

GRID_COLUMN_WIDTH = 60
GRID_ROW_HEIGHT   = 60

class BoxError(Exception):
    def __init__(self, msg):
        self.msg = msg
    def __str__():
        return self.msg

def get_slug(fn):
    return '-'.join(fn.split('-')[1:])

def box_div(dimensions, style):
    try:
        x, y, height, width = [float(i) for i in re.split(r'[\s,]+', dimensions.strip())]
    except:
        print 'Wrongly formatted box(%s)' % dimensions
        raise
    x *= GRID_COLUMN_WIDTH
    y *= GRID_ROW_HEIGHT

    width  *= GRID_COLUMN_WIDTH
    height *= GRID_ROW_HEIGHT

    s = '<div class="box" style="padding:5px; left:%dpx; top: %dpx; width: %dpx; height: %dpx;%s">'
    return s % (x, y, width-10, height-10, style)

def isInt(i):
    try:
        int(i)
        return True
    except:
        return False

def thumbnail(spec):

    splitter = re.compile('\s+')
    s = splitter.split(spec.strip())
    img = s[0]
    w = 'auto'
    h = 'auto'
    if (len(s) == 3):
        w,h = s[1:]
    if (len(s) == 2):
        w = s[1]
        h = 'auto'

    # do the resizing

    full_scale = Image.open('pictures/' + img)

    o_w, o_h = full_scale.size
    if w == 'auto' and isInt(h):
        w = int(int(h) * o_w / o_h);
    if h == 'auto' and isInt(w):
        h = int(int(w) * o_h / o_w);
    if h == 'auto' and w == 'auto':
        # bone-head-ness
        return '<img class="thumb" "width="%s" height="%s" src="pictures/%s">' %(w,h,img)

    w, h = int(w), int(h)

    print "    resizing %s to (%sx%s)" % (img, w, h)

    try:
        os.makedirs('thumbnails/'+'/'.join(img.split('/')[:-1]))
    except:
        pass

    parts = img.split('.')
    thumb_name = 'thumbnails/' + '.'.join(parts[:-1])+'_%d_%d.' % (w, h)+parts[-1]

    thumb_file = open(thumb_name, 'w')
                # resample and resize
    thumb_data = full_scale.resize((w, h), 1)
    thumb_data.save(thumb_file)
    w, h = str(w), str(h)

    return '<img class="thumb" "width="%s" height="%s" src="%s">' % (w,h,thumb_name)

def thumbs(p):
    thumbs_re = re.compile('^\s*thumbnails\(\s*$')
    # each line will contain the path to the image
    # and optionally dimensions width, height

    lines = p.split('\n')
    new_lines = []

    scan_thumbs = False

    imgs = ''
    for l in lines:
        matches = thumbs_re.match(l)
        if matches != None:
            scan_thumbs = True
            continue
        elif l.strip() == ')':
            if len(imgs) > 0:
                new_lines.append(imgs)
            scan_thumbs = False
            continue

        if scan_thumbs:
            k = l.strip()
            if k != '':
                imgs += thumbnail(l)
            else:
                imgs += '<br style="clear:both">'
        else:
            new_lines.append(l)
    return '\n'.join(new_lines)


def boxes(p):
    box_re = re.compile('^\s*box\(([^\)]+)\)\s*(.*)\s*$')
    lines = p.split('\n')
    new_lines = []
    balance = 0
    for l in lines:
        matches = box_re.match(l)
        if matches != None:
            new_lines.append(
                box_div(matches.group(1), matches.group(2))
            )
            balance += 1
        elif l.strip() == '.':
            new_lines.append('</div>')
            balance -= 1
        else:
            new_lines.append(l)

        if balance < 0:
            raise BoxError('Unbalanced box.')
    if balance != 0:
            raise BoxError('boxes not balanced')
    return '\n'.join(new_lines)

def get_date_string(y):
    if len(y) == 2:
        if int(y) > 20:
            y = '19' + y
        else: y = '20' + y
    elif len(y) == 3:
        raise

    return y + '-01-01'

def sub_dates(text):
    date_range_re = re.compile('^\s*\[\s*([0-9]{2,4})\s*\-\s*([0-9]{2,4})\s*\]\s*$')
    date_re = re.compile('^\s*\[\s*([0-9]{2,4})\s*\]\s*$')
    lines = text.split('\n')
    new_lines = []
    s = '<span class="date" data-start="%s" data-end="%s"></span>'
    for line in lines:
        matches_range = date_range_re.match(line)
        matches = date_re.match(line)
        if matches_range != None:
            dt_start = get_date_string(matches_range.group(1))
            dt_end = get_date_string(matches_range.group(2))
            new_lines.append(s % (dt_start, dt_end))
        elif matches != None:
            dt_start = get_date_string(matches.group(1))
            dt_end = dt_start
            new_lines.append(s % (dt_start, dt_end))
        else:
            new_lines.append(line)
    return '\n'.join(new_lines)

def parse(text):
    page_re = re.compile('^[P|p]age[\s\-]*[0-9]*\s*$', re.MULTILINE)
    text = sub_dates(text)
    subpages = [s.strip() for s in page_re.split(text)]
    subpages.remove('')

    html = ''
    i = 1
    for p in subpages:
        html += '<div class="subpage" id="leaf-%d">' % i
        html += textile(boxes(thumbs(p)), 1, 'html')
        html += '</div>'
        i += 1
    return html

def process_page(fn):
    page = {}
    page['slug'] = get_slug(fn)


    parts = open('_pages/' + fn).read().split('---')
    try:
        meta = yaml.load(parts[0])
        for key, default in [('title', ''), ('from', ''), ('to',''),
                             ('next', None), ('prev', None), ('timeline', True),
                             ('timeline_title', '')]:
            if meta.has_key(key):
                page[key] = meta[key]
            else: page[key] = default

        if page['timeline_title'] == '':
            page['timeline_title'] = page['title']


        try:
            page['from'] = get_date_string(str(page['from']))
            page['to'] = get_date_string(str(page['to']))
        except:
            pass

        text = parts[1]
        page['html'] = parse(text)
        return page
    except IndexError:
        print "Meta data not formatted correctly?"
        return page
    except:
        print "There was an error parsing", fn
        raise
        return page

pg = sorted(os.listdir('_pages/'))
print 'Found', len(pg), 'pages:'
print '\n'.join(pg)

pages = []

for fn in pg:
    pages.append(process_page(fn))
i=0
cnt = len(pages)

timeline = {}
for p in pages:
    timeline[p['slug']] = (p['timeline_title'], p['from'], p['to'])
    if not p.has_key('prev') or p['prev'] == None:
        if i == 0:
            p['prev'] = None
        else: p['prev'] = pages[i-1]['slug']
    if not p.has_key('next') or p['next'] == None:
        if i+1 == cnt:
            p['next'] = None
        else:
            p['next'] = pages[i+1]['slug']
    i += 1

for p in pages:
    p_file = open('pages/%s.json' % p['slug'], 'w')
    json.dump(p, p_file)
    p_file.close()

t_file = open('timeline.json', 'w')
json.dump(timeline, t_file)
t_file.close()


print 'Done compiling.'
