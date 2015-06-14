$('.job').click(function(){ 
	$('.active').removeClass('active');
	$('.description').hide();
	
	$(this).addClass('active');
	$(this).children('.description').show();
});