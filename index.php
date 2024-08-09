<?php 

function getCalculatePercentageAvailable($weight_all, $weight_used){
    $value = $weight_used / $weight_all;
    return round(100 - $value * 100);
}

function getCalculatePercentageUsed($weight_all, $weight_used){
    $value = $weight_used / $weight_all;
    return round($value * 100);
}

function getWarningUsed($value){
    $warningclass = '';
    if ($value <= 20) {
        $warningclass = 'warn-darkgreen';
    }
    elseif ( ($value > 20) && ($value <= 40) ) {
        $warningclass = 'warn-lightgreen';
    }
    elseif ( ($value > 40) && ($value <= 60) ) {
        $warningclass = 'warn-yellow';
    }
    elseif ( ($value > 60) && ($value <= 80) ) {
        $warningclass = 'warn-orange';
    }
    else {
        $warningclass = 'warn-red';
    }
    return $warningclass;
}

function getIfEmpty($weight_all, $weight_used){
    $class = '';
    $value = $weight_all - $weight_used;
    if ($value < 1) {
        $class = 'linethrough';
    }
    return $class;
}

function getIfEmptyX($weight_all, $weight_used){
    $txt = '';
    $value = $weight_all - $weight_used;
    if ($value < 1) {
        $txt = '<span style="color:#cc3300;text-shadow: 0px 0px 2px #FFFFFF;font-size:30px;"><b>XX</b></span>';
    } else {
        $txt = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    }
    return $txt;
}

$host = "docker.mittelerde.cc"; 
$user = "filamentdb-www"; 
$pass = "filamentdb-www"; 
$db = "filamentdb"; 

$con = pg_connect("host=$host dbname=$db user=$user password=$pass")
    or die("Could not connect to server\n"); 

$query = "SELECT * FROM spools ORDER BY name ASC"; 

$rs = pg_query($con, $query) or die("Cannot execute query: $query\n");

function getMaterial($id){
    global $con;
    $query = "SELECT material FROM profiles WHERE id = ". $id ."";
    $rs = pg_query($con, $query) or die("Cannot execute query: $query\n");
    $value = pg_fetch_result($rs, 0, 0);
    return $value;
}

function getVendor($id){
    global $con;
    $query = "SELECT vendor FROM profiles WHERE id = ". $id ."";
    $rs = pg_query($con, $query) or die("Cannot execute query: $query\n");
    $value = pg_fetch_result($rs, 0, 0);
    return $value;
}

function getInventNumber($name){
    $inventNumber = explode(" ", $name);
    return $inventNumber[0];
}

function getTotalWeightNew($totalWeightNew){
    if (!empty($totalWeightNew)) {
	$value = $totalWeightNew." g";
    } else {
	$value = "";
    }
    return $value;
}

function getInformation($information){
    if (!empty($information)) {
        $value = '<a href="'.$information.'" target="_blank" style="color: white; font-weight: 700; text-decoration: none; ">&#9432;</a>';
    } else {
        $value = "";
    }
    return $value;
}

function getPricePerGram($cost, $weight){
    $value = $cost / $weight;
    return round($value, 2);
}

echo '<html>
<head>
<title>Filament Database - docker.mittelerde.cc</title>
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
<link rel="manifest" href="site.webmanifest">
<link rel="mask-icon" href="safari-pinned-tab.svg" color="#5bbad5">
<meta name="msapplication-TileColor" content="#da532c">
<meta name="theme-color" content="#ffffff">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Work+Sans&display=swap" rel="stylesheet">
<style>
body {
    font-family: "Work Sans", sans-serif;
    align: center;
    background-color: #181818;
    color: #ffffff;
}
.center {
  margin-left: auto;
  margin-right: auto;
  min-width: 50%;
  border-collapse: collapse;
}
.center td {
  padding: 0 5px;
}
.warn-darkgreen {
    background-color:#339900;
    color:#ffffff;
}
.warn-lightgreen {
    background-color:#99cc33;
    color:#000000;
}
.warn-yellow {
    background-color:#ffcc00;
    color:#000000;
}
.warn-orange {
    background-color:#cb5e0b;
    color:#ffffff;
}
.warn-red {
    background-color:#cc3300;
    color:#ffffff;
}
.linethrough {
    /*text-decoration: line-through;
    text-decoration-color:#cc3300;
    text-decoration-thickness: 15%;*/
    background-color:#cc3300;
}
</style>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script type="text/javascript" src="sort.js"></script>
<script>
$(document).ready(function(){
  $("#tablefilament td").not(".infocell").click(function(){
    $("#popup").hide();
    $("#popup img:last-child").remove();
    //$(this).closest("tr").next("tr.picture").toggle();
    rowid = $(this).parent().attr("id");
    $("#popup").prepend(\'<img id="theImg" src="pictures/\'+rowid+\'.jpg" />\');
    $("#popup").show();
  });
  $("#popup").click(function(){
    $("#popup").hide();
    $("#popup img:last-child").remove();
  });
});
</script>
</head>
<body>';

echo "<table id='mytable' class='center'>";
echo "<tr style='cursor: default;'>";
echo "<th>Farbe</th><th align='center' style='cursor: ns-resize;' onclick='sort_filament();'>Filament 🔄</th><th align='left' style='cursor: ns-resize;' onclick='sort_hersteller();'>Hersteller 🔄</th><th style='cursor: ns-resize;' onclick='sort_material();'>Material 🔄</th><th>Preis</th><th style='cursor: ns-resize;' onclick='sort_verfuegbar();'>Verf&uuml;gbar 🔄</th><th>Verbraucht</th><th style='padding: 0 10px 0 10px;'>Gewicht<br>Hersteller</th><th style='padding: 0 10px 0 10px;'>Gewicht<br>gewogen</th><th>&nbsp;</th>";
echo "</tr><tbody id='tablefilament'>";
while ($ro = pg_fetch_object($rs)) {
    echo '<tr style="border-top: 1px solid #383838; cursor: pointer;" id="'.getInventNumber($ro->name).'" class="'. getIfEmpty($ro->weight, $ro->used) .'">';
    	echo "<td align='left' style='background-color: ".$ro->color.";'>". getIfEmptyX($ro->weight, $ro->used) ."</td>";
	echo "<td align='left'>".$ro->name."</td>";
	echo "<td align='left'>".getVendor($ro->profile_id)."</td>";
	echo "<td align='center'>".getMaterial($ro->profile_id)."</td>";
    	echo "<td align='center'>€ ".$ro->cost."<br>€ ".getPricePerGram($ro->cost, $ro->weight)."/g</td>";
//	echo "<td align='right' class='". getWarningUsed(getCalculatePercentageUsed($ro->weight, $ro->used)). "'>".getCalculatePercentageAvailable($ro->weight, $ro->used) ." %</td>";
    	echo "<td align='right' class='". getWarningUsed(getCalculatePercentageUsed($ro->weight, $ro->used)). "'>".getCalculatePercentageAvailable($ro->weight, $ro->used) ." %<br>".round($ro->weight - $ro->used)." g</td>";
	echo "<td align='right' class='". getWarningUsed(getCalculatePercentageUsed($ro->weight, $ro->used)). "'>".getCalculatePercentageUsed($ro->weight, $ro->used)." %<br>".round($ro->used)." g</td>";
    	echo "<td align='center'>".$ro->weight." g</td>";
	echo "<td align='center'>".getTotalWeightNew($ro->total_weight_new)."</td>";
	echo "<td align='center' class='infocell'>".getInformation($ro->information)."</td>";
    echo "</tr>";
//    echo "<tr id='row-".$ro->id."-picture' class='picture' style='display:none;'>";
//	echo "<td colspan='8' align='center'><img src='pictures/".getInventNumber($ro->name).".jpg' /></td>";
//    echo "</tr>";
}

echo '</tbody></table>
<input type="hidden" id="filament_order" value="asc">
<input type="hidden" id="hersteller_order" value="asc">
<input type="hidden" id="material_order" value="asc">
<input type="hidden" id="verfuegbar_order" value="asc">
<div style="z-index: 10; position: fixed; top: 50%; left: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); display:none; cursor: pointer;" id="popup"></div>
</body></html>';
pg_close($con); 

?>
