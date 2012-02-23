# Down Memory Lane

-- The Spacetime of NITK Surathkal

## Content -- Authoring

The pictures are in the directory named `pictures` 

_Note: keep one of the files in `_pages/` open for reference as you read this._

### Eras, pages and boxes
* An era is a grouping of years with some similarity. Currently there are 4 of them:
** Polaroid: 1960s
** 35mm: 1989-2000
** Bokeh: 2001-2008
** In Gold: 2009-2012
* This classification was based on the amount of graphics and info we had for
  each of these years. An ideal era would span just one year and would have a
  4 digit numeric name. This is the ultimate goal, get enough information and
  media to document each year.
* A page is a leaf in the carousel of an era. Each page is represented by a dot
  at the bottom of the page above the timeline or the title of the era.
* The dot corresponding to the page currently being shown is darkened.
* A page can have boxes which contain text or images or any arbitrary HTML.
* _A comprehensive guide for authoring content for the site keeping in mind these elements follows._

### Authoring
* Use a (preferably) UNIX environment with python installed. You can use your favorite text editor, file manager and terminal.
* All the information required to render one full era in the browser is contained
  in a file inside `_pages/` directory. An example name for the file looks like `03-bokeh`. Here the part before the `-` is the number used for ordering of the era among others. This defines which era is `next` or `prev`ious on the list in the final browser rendition of the site.
* The file contains:
** YAML (Yet Another Markup Language) meta data header. This defines several settings associated with the era file. An example header is shown below.
    title: Wrought In Gold
    from:  2009
    to: 2011
    next: null
    prev: bokeh

** The idea is simple: it is a list of option-value pairs in the format `option: value`. The options available and their possible values are:
*** `title` -- The title of the page
*** `from`  -- 4-digit numeric year marking the start of the era (note: this gets centered in the timeline when you open the era)
*** `to`  -- 4-digit numeric year marking the end of the era
*** `next` -- (optional: this is determined using the numbering in the era file name) the slug (see the bullet point about the file name) of the era you want to indicate as coming next to this one.
*** `prev` -- (optional: see above) indicates the previous era
*** `timeline` -- (optional) whether to show the timeline while viewing this era. Default value is true, setting it to false help in writing pages like the home page where you wish to hide the timeline since showing it has no relevence to the contents of the page.

** the YAML meta data is always followed by three hiphens `---` as one single line. This marks the end of the meta data and beginning of the body of the era.
** The body contains:
*** Pages, which may contain
**** Boxes, which may contain
***** text
***** sets of thumbnails
** These are explained in detail below.

#### A page
* A single page can be shown on the web page at any given time.
* It is of width `900px` and height `480px`. Good for comfortable viewing on most screen resolutions.
* Visualize a page as a graph paper with origin at the top left corner and positive y-axis pointing downward (y increases as you come down on the grid).
 The grid has 15 units along the X axis and 8 along the Y axis. Each `unit` is 60 consecutive pixels on the screen.
This grid system is used in drawing boxes of required dimensions and positioning them.
* A single line in the body of the era which looks like `Page 3` marks the beginning of a page and the end of the previous, if any.
The number after Page is ignored, it's only for your reference while dealing with many pages.
* A page may contain boxes or raw HTML which will appear inside it when it is shown on the screen

#### A box
* Description (the drawing) of a box uses the grid system explained above.
* A single line like `box(1, 2, 4, 6)` will start a box. Here the box is positioned at `(1, 2)` i.e 60 pixels from the left end of the page and 120 from the top end. And is 4 units (240px) wide and 6 units (360px) high. (note: you can use commas or spaces or both to seperate the numbers)
* this can be followed by css style you want to associate with the box. (ignore this if you do not understand and don't put anything after the `box()` clause)
* Whatever comes after this line till a line containing a single `.` appears inside the box.
* This is usually text. Or it can be a set of thumbnails or any arbitrary HTML.

#### Text
All text anywhere in the body that is not syntactically recognized is run through a textile compiler for formatting.
It is not very important, but reading the textile documentation will do a lot of good. For example in textile `*some text*` makes the text bold: *some text*. `_some text_` makes it italicized.
`<h3>Some text</h3>` makes the text the heading of a paragraph. (see an example file)
* Example text:
    page 7
    box(0,0,7,4) text-align: right
    <h3>The global experience</h3>
    A faculty exchange program saw six Canadian professors on campus, very much
    becoming a part of campus life, of academics and the busting social interactions
    alike. Clearly, the global experience that was aimed at had very, very early
    beginnings.
    .


#### Thumbnails
When you have pictures that you want to scale down or up and arrange in rows to display them in the page (or inside a box), you have the following syntax

    box(7.5 0 7.5 8)
        thumbnails(
            1961/01/scan0100.jpg 100 auto 
            1961/01/scan0101.jpg 100 auto 
            1961/01/scan0122.jpg 100 auto
            1961/01/scan0004.jpg 100 auto

            1961/01/scan0116.jpg 100 240
            1961/02/scan0001.jpg 100 240
            1961/02/scan0002.jpg auto 120
            1961/02/scan0004.jpg auto 120
        )
    .

* Notice that these thumbnails are put inside a box.
* each line after the line `thumbnails(` is either a blank line or a line containing 3 fields seperated by a space:
        file_path width height
** File path: the path to the file (case sensitive) relative to the `pictures/` directory.
** Width: width in pixels for the image. (FIXME: Should you make this go with the grid?)
** Height: height in pixels.
*** note: specifying `auto` as the width or height automatically calculates the height or width so as to not loose the height-width ratio of the image. Setting both as auto results in an error.

### Compiling

Once you are done making some change or creating an era file, you need to run a compile script to generate the required html and data for the timeline site. This is done by executing:
    python compile.py
from this folder. This might result in an error, in which case the error message will cryptically contain information about what went wrong.

This script scales the images to the size requested by you in your thumbnail declarations and so sometimes might take a long time. It usually tells you what it is doing instead of staying mute.

## Hacking

_Read the entire document._

* The script `compile.py` takes the pages in `_pages` directory and generates JSON documents and saves them in `pages` directory.
* These files in turn are requested by the browser when it executes `js/timeline.js` as and when required.
* Go through the python file and the javascript file to understand their working before changing either of them.

### TODO
* Slidable timeline.
* Consistency with grids and thumbnail metrics.
* Modes for laying thumbnails.
* Code documentation.
