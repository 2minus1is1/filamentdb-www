function sort_filament()
{
 var table=$('#mytable');
 var tbody =$('#tablefilament');

 tbody.find('tr').sort(function(a, b) 
 {
  if($('#filament_order').val()=='asc') 
  {
   return $('td:nth-child(2)', a).text().localeCompare($('td:nth-child(2)', b).text());
  }
  else 
  {
   return $('td:nth-child(2)', b).text().localeCompare($('td:nth-child(2)', a).text());
  }
		
 }).appendTo(tbody);
	
 var sort_order=$('#filament_order').val();
 if(sort_order=="asc")
 {
  document.getElementById("filament_order").value="desc";
 }
 if(sort_order=="desc")
 {
  document.getElementById("filament_order").value="asc";
 }
}

function sort_hersteller()
{
 var table=$('#mytable');
 var tbody =$('#tablefilament');

 tbody.find('tr').sort(function(a, b) 
 {
  if($('#hersteller_order').val()=='asc') 
  {
   return $('td:nth-child(3)', a).text().localeCompare($('td:nth-child(3)', b).text());
  }
  else 
  {
   return $('td:nth-child(3)', b).text().localeCompare($('td:nth-child(3)', a).text());
  }
		
 }).appendTo(tbody);
	
 var sort_order=$('#hersteller_order').val();
 if(sort_order=="asc")
 {
  document.getElementById("hersteller_order").value="desc";
 }
 if(sort_order=="desc")
 {
  document.getElementById("hersteller_order").value="asc";
 }
}

function sort_material()
{
 var table=$('#mytable');
 var tbody =$('#tablefilament');

 tbody.find('tr').sort(function(a, b) 
 {
  if($('#material_order').val()=='asc') 
  {
   return $('td:nth-child(4)', a).text().localeCompare($('td:nth-child(4)', b).text());
  }
  else 
  {
   return $('td:nth-child(4)', b).text().localeCompare($('td:nth-child(4)', a).text());
  }
		
 }).appendTo(tbody);
	
 var sort_order=$('#material_order').val();
 if(sort_order=="asc")
 {
  document.getElementById("material_order").value="desc";
 }
 if(sort_order=="desc")
 {
  document.getElementById("material_order").value="asc";
 }
}

function sort_verfuegbar()
{
 var table=$('#mytable');
 var tbody =$('#tablefilament');

 tbody.find('tr').sort(function(a, b) 
 {
  if($('#verfuegbar_order').val()=='asc') 
  {
   //return $('td:nth-child(6)', a).text().localeCompare($('td:nth-child(6)', b, {'numeric': true}).text());
   return parseInt($('td:nth-child(6)', a).text()) - parseInt($('td:nth-child(6)', b).text());
  }
  else 
  {
   //return $('td:nth-child(6)', b).text().localeCompare($('td:nth-child(6)', a, {'numeric': true}).text());
   return parseInt($('td:nth-child(6)', b).text()) - parseInt($('td:nth-child(6)', a).text());
  }
		
 }).appendTo(tbody);
	
 var sort_order=$('#verfuegbar_order').val();
 if(sort_order=="asc")
 {
  document.getElementById("verfuegbar_order").value="desc";
 }
 if(sort_order=="desc")
 {
  document.getElementById("verfuegbar_order").value="asc";
 }
}
