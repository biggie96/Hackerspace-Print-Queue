/* Ensure all required fields have text in them before submitting */
$(document).ready(field_validate);
function field_validate(){
	$('#submit').prop("disabled",true); //disable submit button

	$('#submit-box').mouseover(function(){

		var fields_entered = 0;
		var f1 = $('input[name=name]');
		var f2 = $('input[name=ruid]');
		var f3 = $('input[name=email]');
		var f4 = document.getElementById("files");

		/* Checks if all fields have at least one non-space character and (0 < number of files < max) */
		if(f1.val().replace(/ /g,'').length > 0 && f2.val().replace(/ /g,'').length > 0 && f3.val().replace(/ /g,'').length > 0 && 
		(f4.files.length > 0 && f4.files.length <4)){ 

			$('#submit').prop("disabled",false); //enable submit button

		}
		else{
			$('#submit').prop("disabled",true);
		}
	});
}