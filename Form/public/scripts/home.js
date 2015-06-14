/* This function submits the form as a post request */
function save_form(){
	function start(){
		$('figure').show();
	}

	function done(resText){
		$('figure').hide();

		var response = '<h2>' + resText + '</h2>';
		response += '<a href="https://hackerspace-print-form.herokuapp.com/">Back</a>';
		$('#print_form').html(response);
	}

	function progress(e, position, total, percent){
		$('figcaption').text(String(percent) + '%');
	}

	$('form').submit(function(e){ 
		console.log('got submit')
		var options = {
		resetForm: true,
		beforeSubmit: start,
		success: done,
		uploadProgress: progress
		};
		$(this).ajaxSubmit(options); //setup ajax request

		return false; //prevents page navigation and default browser submit
	});
}

/* This function ensures all required fields have valid inputs before submitting */
function field_validate(){
	$('#submit').prop("disabled",true); //disable submit button

	/* these two booleans represent validity of field inputs */
	var name = false;
	var ruid = false;

	/* validates name field */
	$('input[name=name]').keyup(function(e){ 
		if($(this).val().indexOf(' ') != -1 && $(this).val().replace(/ /g,'').length > 0){
			$('#valid_name').prop('src', 'images/good.png'); //put a checkmark next to field
			name = true;
		}
		else{
			$('#valid_name').attr('src', 'images/bad.png'); //put an x next to field
			name = false;
		}
	});

	/* validates ruid field */
	$('input[name=ruid]').keyup(function(e){ 
		if($(this).val().length < 11){
			$('#valid_ruid').prop('src', 'images/bad.png');
			ruid = false;
			return;
		}

		var pieces = $(this).val().split('-');
		if(pieces.length == 3){
			var str = pieces[0] + pieces[1] + pieces[2];

			for(var i = 0; i < str.length; i++){
				if(isNaN(str[i])){
					$('#valid_ruid').prop('src', 'images/bad.png');
					ruid = false;
					return;
				}
			}

			$('#valid_ruid').prop('src', 'images/good.png');
			ruid = true;
		}
		else{
			$('#valid_ruid').prop('src', 'images/bad.png');
			ruid = false;
		}

		return;
	});

	$('#submit-box').mouseover(function(){
		var files = document.getElementById("files");

		/* Checks if all fields are valid and (0 < number of files < max) */
		if(name == true && ruid == true && (files.files.length > 0 && files.files.length < 4)){ 
			$('#submit').prop("disabled",false); //enable submit button
			save_form();
		}
		else{
			$('#submit').prop("disabled",true);
		}
	});
}

$(document).ready(field_validate);//validate inputs when document is fully loaded
