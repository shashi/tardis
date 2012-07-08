(function ($, document, undefined) {
    var TESTING = true;

    var currentLeaf = 1,
        startYear = 999999999,
        currentPage = {'pics': [], 'captions': {}}
        yearSpacing = 300,
        currentPos = 0,
        currentImg = undefined,
        timelineScale = 1;
    var wait_id;

    function nothing() {
    }

    function render(data) {
        var title = $('<h2 class="page-title"></h2>').html(data.title),
            start = $('<span class="page-start"></span>').text(getYear(data.from)),
            to_dt = getYear(data.to);
            end   = $('<span class="page-end"></span>').text(to_dt),
            sep   = $('<span class="year-seperator"> &ndash; </span>'),
            wrap  = $('<div class="page-date"></div>').append(start).append(sep).append(end);

        if (data.title) {
            $('#footer').empty().append(wrap).append(title);
        } else {
            $('#footer').empty();
        }

        $('#page-inner').css('left', 0);
        currentLeaf = 1;
        $('#page-inner').html(data.html);
        var leafs = $('#page-inner').find('.subpage').length;

        $('#seeker').empty();
        if (leafs > 1) {
            for (var i=1; i<=leafs; i++) {
                var href = '#' + data.slug + '/' + i
                var dot = $('<a class="carousel-dot" href="' + href + '">&middot;</a>')
                $('#seeker').append(dot);
            }
        }

    }

    function nextLeaf() {
        if (currentLeaf < $('#page-inner .subpage').length) {
            window.location.hash = window.location.hash.split("/", 1) + "/" +
                    (Number(currentLeaf)+1);
        } else {
            //go to next page
            var next = $('#page').data('next');
            console.log(next);
            if (typeof(next) == 'string' && next != 'null' && next != '') {
                if (!shouldHideTimeline()) {
                    $('#page-inner,#footer').anim({opacity:0},.3,'ease-out', function () {
                        $('#page-inner').css('left', 0);
                        window.location.hash = '#' + next + '/1';
                    });
                } else {
                    window.location.hash = '#' + next + '/1';
                }
            }
        }
    }

    function prevLeaf() {
        if (currentLeaf > 1) {
            window.location.hash = window.location.hash.split("/", 1) + "/" +
                    (Number(currentLeaf)-1);
        } else {
            // go to previous page
            var prev = $('#page').data('prev');
            if (typeof(prev) == 'string' && prev != 'null' && prev != '') {
                if (!shouldHideTimeline()) {
                    $('#page-inner, #footer').anim({opacity:0},.4,'ease-out', function () {
                        $('#page-inner').css('left', 0);
                        window.location.hash = '#' + prev + '/1';
                        $('#page-inner,#footer').anim({opacity:1},.4,'ease-in');
                    });
                } else {
                    window.location.hash = '#' + prev + '/1';
                }
            }
        }
    }

    function loadPage(slug, leaf, params) {
        // do not ask for data again on chrome
        if ($('#page').data('loaded') == slug) {
            if (typeof(leaf) != 'undefined') {
                loadLeaf(leaf);
            }
            return;
        }

        if (typeof(params) == 'undefined') {
            params = {};
        }

        if (TESTING) {
            params.random = Math.random();
        }

        var json_doc = 'pages/' + slug + '.json';
        console.log(slug);
            $.ajax({
                type: 'GET',
                url : json_doc,
                data: params,
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                // TODO: invent events triggered by changing attributes
                    console.log(data.pics)
                    $('#page').data('loaded', slug)
                              .data('date', data.from)
                              .data('next', data.next)
                              .data('prev', data.prev);
                    currentPage.pics = data.pics;
                    currentPage.timeline = data.timeline;
                    render(data);
                    if (typeof(leaf) != 'undefined') {
                        if (leaf == 'last') loadLeaf($('#page .subpage').length);
                        else loadLeaf(leaf, undefined, true);
                    }
                    $('#page-inner,#footer').anim({opacity:1},.6,'ease-in');
                },
                error: function () {
                    alert('Fail happened while loading #' +slug);
                }
            });
    }

    function getPic(thumb, pics, offset) {
        if (typeof(offset) != 'number') offset=0;
        for (p in pics) {
            if (pics[p].thumb[0] == thumb) return pics[Number(p)+offset]
        }
        return undefined;
    }

    function showBigPic(thumb, back, offset) {
        var pic = getPic(thumb, currentPage.pics, offset);
        console.log(thumb);
        console.log(currentPage.pics);
        console.log(pic);

        var width = pic.original[1], height = pic.original[2],
            slug = $('#page').data('loaded');

        function loadCap(thumb) {
            try {
                $('.thickbox .thickbox-text').empty()
                    .html(currentPage.captions[slug][thumb]);
            } catch(e) {}
        }

        loadCaptions(slug, function () { loadCap(thumb); });

        var img = $('<img>').addClass('original')
                .attr('src', pic.original[0])
        $('.cover .thickbox-center').empty().append(img);
        $('.cover').show().anim({opacity:1});
        $('.thickbox').data('thumb', thumb);

        if (typeof(back) == 'string') {
            $('.cover').data('back', back);
        }
    }

    function hideCover() {
        if ($('.cover').css('display') == 'none') return;

        $('.cover').anim({opacity: 0}, 0.4, 'ease', function () {
            $(this).hide();
        });

        window.location.hash = $('#page').data('loaded') + '/' + currentLeaf;
    }

    function loadLeaf(id, cb, noanim) {
        var new_left = -900 * (id-1);
        if (id > $('#page-inner .subpage').length) {
            console.log('Beyond available slides');
            return;
        }
        if (id < 1) {
            console.log('Before the beginning of deck');
            return;
        }

        if (noanim) {
            $('#page-inner').css('left', new_left);
        } else {
            $('#page-inner').anim({left: new_left}, 0.4, 'ease', cb);
        }
        currentLeaf = id;
        $('#seeker').find('.carousel-dot').removeClass('current').eq(id-1)
                .addClass('current');

        var part = $('#page-inner .subpage')[id-1],
            leaf_date = $(part).find('span.date');

        if (leaf_date.length == 0) {
            var y = getYear($('#page').data('date'));
            console.log('current_page', $('#page'), y);
            reposition(y, id==1);
        } else {
            var y = getYear(leaf_date.find('span.date').attr('data-start'));
            reposition(y, id==1);
        }

        // first and last slides hide arrows
        if (id == 1 && ($('#page').data('prev') == 'null' || $('#page').data('prev') == '')) {
            $('#prev-page').anim({opacity: 0});
        }else {
            $('#prev-page').anim({opacity: 1});
        }

        if(id == $('#page-inner .subpage').length && ($('#page').data('next') == 'null' || $('#page').data('next') == '')) {
            $('#next-page').anim({opacity: 0});
        }else {
            $('#next-page').anim({opacity: 1});
        }
    }

    function shouldHideTimeline()
    {
        return $('#timeline-wrap').offset()['top'] - $('#footer').offset()['top']- $('#footer').offset().height < 70;
    }

    function hideTimeline(cb) {
        $('#timeline-wrap').anim({'bottom': -90});
        $('#timeline').anim({opacity: 0.1}, 0.3, 'ease', cb);

        // adjust footer position
        try {
            var t_o = $('#timeline-wrap').offset();
            var t = t_o.top + -1*t_o.bottom + $('#footer').offset().top;
            if (t > 50) {
               $('#footer').css('margin-top', (t - 50) / 2);
            }
        } catch (e) {}

        $('#footer').anim({opacity: 1}, 0.3);
        
    }

    function showTimeline(cb) {
        $('#timeline-wrap').anim({'bottom': 0}, 0.3, 'ease', cb);
        $('#timeline').anim({opacity: 1});

        if (shouldHideTimeline()) {
            $('#footer').anim({opacity: 0});
        }
    }

    function loadTimeline(cb) {
        $.ajax({
            type: 'GET',
            url : 'timeline.json',
            dataType: 'json',
            success: function(data) {
                timelineData(data);

                cb();
                showTimeline();
                if (shouldHideTimeline()) {
                    setTimeout(hideTimeline, 2000);
                }
                $('#page-inner,#footer').anim({opacity:1},.6,'ease-in');
            },
            error: function () {
                console.log('[ERROR] Fail happened while loading timeline');
                cb();
            }
        });
    }

    function loadCaptions (slug, callback) {

        if (typeof(currentPage.captions[slug]) == 'object') {
            callback();
            return currentPage.captions[slug];
        }

        $.ajax({
            type: 'GET',
            url : 'pictures/captions/' + slug + '.json',
            dataType: 'json',
            data: {'random': Math.random()},
            success: function(data) {
                currentPage.captions[slug] = data;
                callback();
                $('#page-inner,#footer').anim({opacity:1},.6,'ease-in');
            },
            error: function () {
                console.log('No captions for images in ' + slug);
            }
        });
    }

    function getYear(dt) {
        console.log(typeof dt);
        if (typeof(dt) == 'number' || typeof(dt) == 'string') {
            if (dt == 'now') dt = new Date();
            dt = Date.parse(dt);
            if (isNaN(dt)) {
                throw "Not cool. Could not parse date: " + dt;
            }

            dt = new Date(dt);
        }

        if (typeof(dt) == 'object' && dt != null) {
            return dt.getFullYear();
        }
    }

    function offset() {
        return $('#timeline-wrap').width() / 2;
     }

    function renderPoint(year, link) {

            // requires yearSpacing and startYear to be set
            var gap = (year - startYear) * yearSpacing;
            console.log(gap);
            var pt = $('<div class="timeline-point-label"></div>');

            if(typeof(link) == 'string') {
                var lnk = $('<a href="#' + link + '/1">' + year + '</a>')
                pt.append(lnk);
            } else {
                pt.text(year);
            }
            pt.attr('id', 'timeline-label-' + year);
            pt.css('left', gap);

            console.log(year);

            $('#timeline-labels').append(pt);

            var line = $('<div class="timeline-point-line">&nbsp;</div>');

            line.css('width', gap);
            $('#timeline-lines').append(line);
    }

    function reposition(date, show) {
        if (typeof(date) == 'number' || typeof(date) == 'string') {
            if ($('#timeline').data('current-year') == date && !show) return;
            clearInterval(wait_id);
            if (currentPage.timeline && show) {
                showTimeline();
            } else {
                hideTimeline();
            }
            $('#timeline').anim({left: -1*(date - startYear) * yearSpacing}, 1, 'ease');
            $('#timeline').data('current-year', date);
            console.log(date-startYear);
            if (shouldHideTimeline()) {
                wait_id = setTimeout(hideTimeline, 2000);
            }

            $('.timeline-point-label').removeClass('current');
            console.log($('#timeline-label-' + date).addClass('current'), date, '#timeline-point-' + date);
        }
    }

    function timelineData(data) {
            // data is an object with page-slugs as keys and with
            // values [title, from, to]

            var points = [];
            for (point in data) {
                if (!data.hasOwnProperty(point)) {
                    continue;
                }
                var y1 = getYear(data[point][1]),
                    y2 = getYear(data[point][2]);

                if (startYear > y1) startYear = y1;
                if (startYear > y2) startYear = y2;
            }

            for (point in data) {
                if (!data.hasOwnProperty(point)) {
                    continue;
                }
                var y1 = getYear(data[point][1]),
                    y2 = getYear(data[point][2]);

                renderPoint(y1, point);
                renderPoint(y2);
            }
            $('#timeline').css('margin-left', offset());

    }

    function loadHashUrl(newUrl, oldUrl) {
        var url = (typeof(newUrl) == 'undefined')
                ? window.location.hash : '#' + newUrl.split('#')[1];
        url = url.substr(1).split('/');

        if (url.length < 2) {
            url.push('1')
        }

        if (url[1].substr(0, 4) == 'pic:') {

            function loadPic() {
                var thumb = window.location.hash.substr(1).split('pic:')[1];
                showBigPic('thumbnails/' + thumb);
            }

            if ($('#page').data('loaded') == url[0]) {
                loadPic();
            } else {
                loadPage(url[0]);
                setTimeout(loadPic, 500);
            }

            return;
        } else {
            hideCover();
        }

        loadPage(url[0], url[1]);
    }

    function getPicUrl(slug, thumb) {
        var _thumb = thumb.replace('thumbnails/', '');
        return '#' +slug + '/pic:' + _thumb;
    }

    function prevPicture() {
        try {
            var cur = $('.thickbox').data('thumb'), slug = $('#page').data('loaded');
            window.location.hash = getPicUrl(slug, getPic(cur, currentPage.pics, -1).thumb[0]);
        } catch (e) {
            console.log("At the first image.");
            // orly?
        }
    }

    function nextPicture() {
        try {
            var cur = $('.thickbox').data('thumb'), slug = $('#page').data('loaded');
            window.location.hash = getPicUrl(slug, getPic(cur, currentPage.pics, 1).thumb[0]);
        } catch (e) {
            console.log("At the end of images");
        }
    }

    $(window).bind('hashchange', function (e) {
        console.log(e);
        loadHashUrl(e.newURL, e.oldURL);
        return false;
    });

    document.loadPage = loadPage;
    document.hideTimeline = hideTimeline;
    document.loadTimeline = loadTimeline;
    document.loadHashUrl = loadHashUrl;
    document.nextLeaf = nextLeaf;
    document.prevLeaf = prevLeaf;

    $(document).ready(function () {
        $('#timeline-wrap').bind('mouseover', function () {
            if (shouldHideTimeline() || !currentPage.timeline) {
                clearInterval(wait_id);
                wait_id = setTimeout(showTimeline, 500);
            }
        }).bind('mouseout', function () {
            if (shouldHideTimeline() || !currentPage.timeline) {
                clearInterval(wait_id);
                wait_id = setTimeout(hideTimeline, 2000);
            }
        }).bind('click tap', function () {
            showTimeline();
        });

        $('#next-page').bind('click tap', function() {
            nextLeaf();
        });

        $('#prev-page').bind('click tap', function() {
            prevLeaf();
        });
        $('img.thumb').live('click tap', function () {
            var slug = $('#page').data('loaded'),
                thumb = $(this).attr('src');
            window.location.hash = getPicUrl(slug, thumb);
            currentImg = thumb;
        });
        $('.thickbox-close').live('click tap', function () {
            hideCover();
        });

        $(window).keydown(function (e) {

            if ($('.cover').css('display') == 'block') {
                switch(e.which) {
                case 27:
                    // escape
                    hideCover();
                    break;
                case 37:
                    // prev image
                    prevPicture();
                    break;
                case 39:
                    // next image
                    nextPicture();
                    break;
                }
                return;
            }

            switch(e.which) {
            case 37:
                prevLeaf();
                break;
            case 39:
                nextLeaf();
                break;
            }
        });
    });
})(Zepto, document)
