/* Ensure all required fields have text in them before submitting */
$(document).ready(field_length);
function field_length(){
	$('#submit').prop("disabled",true); //disable submit button

	$('#submit-box').mouseover(function(){
		var fields_entered = 0;
		var f1 = $('input[name=name]');
		var f2 = $('input[name=ruid]');
		var f3 = $('input[name=email]');

		/* Checks if all fields have at least one non-space character and at least one file is selected*/
		if(f1.val().replace(/ /g,'').length > 0 && f2.val().replace(/ /g,'').length > 0 && f3.val().replace(/ /g,'').length > 0 && $('input[type=file]').val() != ""){ 
			$('#submit').prop("disabled",false); //enable submit button
		}
		else{
			$('#submit').prop("disabled",true);
		}
	});
}