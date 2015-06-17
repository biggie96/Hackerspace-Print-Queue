/* This function displays the description for the active list item */
function active_item(){
$('#all_jobs').on('click', '.job_title', function(){ 
	console.log('here');
	if($(this).hasClass('active')){ // its already active so now I'll hide the description and deactivate it
		$(this).removeClass('active');
		$('.description').hide();
		return;
	}

	/* hide the previously active item's description */
	$('.active').removeClass('active');
	$('.description').hide();

	/* make this item the active one */
	$(this).addClass('active');
	$(this).siblings('.description').show();
});

}

/* stuff */
function populate_page(){
	function add_to_page(res){
		var times = [];

		for(var time in res){
			if(res.hasOwnProperty(time)){
				times.push(parseInt(time));
			}
		}

		times.sort();
		var queue = '';

		for(var i = 0; i < times.length; i++){
			if(i == 0){
				queue += '<div class="active job">';
			}
			else{
				queue += '<div class="job">';
			}

				queue += '<li class="job_title">' + res[String(times[i])]['name'] + '</li>';
				queue += '<div class="description">';

					queue += '<div class="info">';
						queue += '<p>RUID: ' + res[String(times[i])]['ruid'] + '</p>';
						queue += '<p>Email: ' + res[String(times[i])]['email'] + '</p>';
						queue += '<p>Notes: ' + res[String(times[i])]['notes'] + '</p>';
					queue += '</div>';

					queue += '<div class="action"> <button>Done</button> <button>Remove</button> <img src="images/ajax-loader.gif"> </div>';

				queue += '</div>'

			queue += '</div>';

			$('#all_jobs').html(queue);
		}
	}

	var url = '/data';
	var settings = {
		method: 'GET',
		success: add_to_page
	};
	$.ajax(url, settings);

	active_item();
}

$(document).ready(populate_page);
