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

/* This function remove an item from the queue and reloads it */
function remove(){
	$('#all_jobs').on('click', '.remove', function(){ 
		$(this).siblings('.loading').show();

		var url = '/data/' + $(this).parent().siblings('.info').children('.id').text().substring(4);

		var done = function(){
			$(this).siblings('.loading').hide();

			populate_page();
		}

		var settings = {
		method: 'DELETE',
		success: done
		};
		$.ajax(url, settings);

	});
}

/* This functions populates the queue */
function populate_page(){
	function add_to_page(res){
		if(jQuery.isEmptyObject(res)){
			$('#all_jobs').html('No print jobs.');
			return;
		}

		var times = [];

		for(var time in res){
			if(res.hasOwnProperty(time)){
				times.push(parseInt(time));
			}
		}

		times.sort();
		var queue = '';

		for(var i = 0; i < times.length; i++){
			var print_job = res[String(times[i])];

			queue += '<div class="job">';

				queue += '<li class="job_title">' + print_job['name'] + '</li>';
				queue += '<div class="description">';

					queue += '<div class="info">';
						queue += '<p class="ruid">RUID: ' + print_job['ruid'] + '</p>';
						queue += '<p class="email">Email: ' + print_job['email'] + '</p>';
						queue += '<p class="notes">Notes: ' + print_job['notes'] + '</p>';
						queue += '<p class="id">ID: ' + String(times[i]) + '</p>';
					queue += '</div>';

					queue += '<div class="action">';  
						queue += '<button class="download">Download Files</button>';
						queue += '<button class="done">Done</button>';
						queue += '<button class="remove">Remove</button>';
						queue += '<img src="images/ajax-loader.gif" class="loading">';
					queue += '</div>';


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
	remove();
}

$(document).ready(populate_page);
