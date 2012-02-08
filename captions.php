<?php
    $files = scandir('pages/');

    // . & ..
    array_shift($files);
    array_shift($files);

    $pics = array();
    $captions = array();

    @$file = 'pages/' . $_REQUEST['page'];
    @$caption_file = 'pictures/captions/' . $_REQUEST['page'];

    if (isset($_REQUEST['page']) && !empty($_REQUEST['page'])) {
        if (file_exists($file)) {
            $pics = json_decode(file_get_contents($file))->pics;

            if (file_exists($caption_file)) {
                $captions = json_decode(file_get_contents($caption_file), 1);
            }
        } else {
            $msg = "Invalid file: " . htmlspecialchars($_REQUEST['page']);
        }
    }

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        // save change
        $thumb = $_REQUEST['thumb'];
        $page  = $_REQUEST['page'];

        $text = $_REQUEST['caption'];

        $captions[$thumb] = $text;

        file_put_contents($caption_file, json_encode($captions));
    }
    
?>
<!doctype html>

<html>
<head>
    <title>Edit captions for images</title>

    <style>
        h2 {
            text-align: center;
        }
        .image {
            margin: 10px;
            text-align: center;
        }
        .big img {
            max-height:400px;
            max-width: 400px;
        }
        .image {
            display: table;
            width: 960px;
            margin: 10px auto;
        }
        .thumb, .big, .text {
            display: table-cell;
            text-align: center;
            vertical-align: middle;
        }
    </style>
<script type="text/javascript" language="javascript" src="js/zepto/dist/zepto.js"></script>

<script>
(function ($) {
    $(document).ready(function() {
        $('.caption-submit').click( function() {
            $(this).parents('form').submit();
            return false;
        })
    });
})(Zepto);
</script>

</head>

<body>

<?php if (isset($msg)) { ?>
    <div class="message"><?php echo $msg ?></div>
<?php } ?>

<ul>
<?php foreach ($files as $file) { ?>
    <li><a href="?page=<?php echo $file ?>"><?php echo substr($file, 0, -5) ?></a></li>
<?php } ?>

</ul>
<?php if (!empty($pics)) { ?>
    <h2><?php echo substr($_REQUEST['page'], 0, -5); ?></h2>

    <?php foreach($pics as $pic) { ?>
      <div class="image">
        <div class="thumb">
          <img src="<?php echo $pic->thumb[0] ?>">
        </div>
        <div class="big">
          <img src="<?php echo $pic->original[0] ?>">
        </div>

        <div class="text">
            <div class="caption"><?php
        if (isset($captions[$pic->thumb[0]]))
            echo $captions[$pic->thumb[0]]; ?></div>
            <form class="caption-form" method="post" action="">
            <input type="hidden" name="thumb" value="<?php echo $pic->thumb[0] ?>">
            <input type="hidden" name="page" value="<?php echo $_REQUEST['page'] ?>">
            <textarea name="caption"><?php
        if (isset($captions[$pic->thumb[0]]))
            echo $captions[$pic->thumb[0]]; ?></textarea>
            <input type="submit" class="caption-submit" value="Save">
            </form>
        </div>
       </div>
    <?php } ?>
<?php } ?>

</body>
</html>
