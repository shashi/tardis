(function ($, document, undefined) {
    var TESTING = true;

    var currentLeaf = 1,
        startYear = 999999999,
        yearSpacing = 300,
        currentPos = 0,
        timelineScale = 1;
    var wait_id;

    function render(data) {
        var title = $('<h2 class="page-title"></h2>').html(data.title),
            start = $('<span class="page-start"></span>').text(getYear(data.from)),
            to_dt = (typeof data.to == 'string') ? getYear(data.to) : 'today',
            end   = $('<span class="page-end"></span>').text(to_dt),
            sep   = $('<span class="year-seperator"> &ndash; </span>'),
            wrap  = $('<div class="page-date"></div>').append(start).append(sep).append(end);

        $('#footer').empty().append(wrap).append(title);

        $('#page-inner').css('left', 0);
        currentLeaf = 1;
        $('#page-inner').html(data.html);
        var leafs = $('#page-inner').find('.subpage').length;

        $('#seeker').empty();
        for (var i=1; i<=leafs; i++) {
            var href = '#' + data.slug + '/' + i
            var dot = $('<a class="carousel-dot" href="' + href + '">&middot;</a>')
            $('#seeker').append(dot);
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
                $('#page-inner').anim({opacity:0},.4,'ease-out', function () {
                    $('#page-inner').css('left', 0);
                    window.location.hash = '#' + next + '/1';
                    $('#page-inner').anim({opacity:1},.4,'ease-in');
                });
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
                $('#page-inner').anim({opacity:0},.4,'ease-out', function () {
                    $('#page-inner').css('left', 0);
                    window.location.hash = '#' + prev + '/1';
                    $('#page-inner').anim({opacity:1},.4,'ease-in');
                });
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
                    $('#page').data('loaded', slug)
                              .data('date', data.from)
                              .data('next', data.next)
                              .data('prev', data.prev);
                    render(data);
                    if (typeof(leaf) != 'undefined') {
                        if (leaf == 'last') loadLeaf($('#page .subpage').length);
                        else loadLeaf(leaf, true);
                    }

                },
                error: function () {
                    alert('Fail happened while loading #' +slug);
                }
            });
    }

    function loadLeaf(id, noanim) {
        var new_left = -960 * (id-1);
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
            $('#page-inner').anim({left: new_left});
        }
        currentLeaf = id;
        $('#seeker').find('.carousel-dot').removeClass('current').eq(id-1)
                .addClass('current');

        var part = $('#page-inner .subpage')[id-1],
            leaf_date = $(part).find('span.date');

        if (leaf_date.length == 0) {
            var y = getYear($('#page').data('date'));
            console.log('current_page', $('#page'), y);
            reposition(y);
        } else {
            var y = getYear(leaf_date.find('span.date').attr('data-start'));
            reposition(y);
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

    function hideTimeline(id, params) {
        $('#timeline-wrap').anim({'bottom': -100});
        $('#timeline').anim({opacity: 0.1});

        $('#footer').anim({opacity: 1}, 0.3);
        
    }

    function showTimeline(id, params) {
        $('#timeline-wrap').anim({'bottom': 0});
        $('#timeline').anim({opacity: 1});
        $('#footer').anim({opacity: 0})
    }

    function loadTimeline() {
        $.ajax({
            type: 'GET',
            url : 'timeline.json',
            dataType: 'json',
            success: function(data) {
                timelineData(data);

                showTimeline();
                setTimeout(hideTimeline, 5000);
            },
            error: function () {
                alert('Fail happened while loading #' +slug);
            }
        });
    }

    function getYear(dt) {
        console.log(typeof dt);
        if (typeof(dt) == 'number' || typeof(dt) == 'string') {
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

    function reposition(date) {
        if (typeof(date) == 'number' || typeof(date) == 'string') {
            if ($('#timeline').data('current-year') == date) return;
            clearInterval(wait_id);
            showTimeline();
            $('#timeline').anim({left: -1*(date - startYear) * yearSpacing}, 1, 'ease');
            $('#timeline').data('current-year', date);
            console.log(date-startYear);
            wait_id = setTimeout(hideTimeline, 5000);

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

    function loadHashUrl() {
        var url = window.location.hash.substr(1).split('/');

        if (url.length < 2) {
            url.push('1')
        }

        loadPage(url[0], url[1]);
    }

    $(window).bind('hashchange', function (e) {
        loadHashUrl();
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
            clearInterval(wait_id);
            wait_id = setTimeout(showTimeline, 500);
        }).bind('mouseout', function () {
            clearInterval(wait_id);
            wait_id = setTimeout(hideTimeline, 5000);
        }).bind('click tap', function () {
            showTimeline();
        });

        $('#next-page').bind('click tap', function() {
            nextLeaf();
        });

        $('#prev-page').bind('click tap', function() {
            prevLeaf();
        });

        $('body').keydown(function (e) {
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
