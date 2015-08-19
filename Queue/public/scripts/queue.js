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
function remove(id){
	/* this check allows an item to be deleted even if it wasnt clicked on  */
	if(id != undefined){
		var url = '/queue?id=' + id;

		var done = function(){
			$(this).siblings('.loading').hide();
			location.reload(true);
		}

		var settings = {
		method: 'DELETE',
		success: done
		};
		$.ajax(url, settings);
	}

	/* delete an item when clicked on */
	$('#all_jobs').on('click', '.remove', function(){
		var sure = window.confirm("Are you sure?");
		if(!sure){
			return;
		}

		$(this).siblings('.loading').show();

		var url = '/queue?id=' + $(this).parent().siblings('.info').children('.id').text().substring(4);

		var done = function(){
			$(this).siblings('.loading').hide();
			location.reload(true);
		}

		var settings = {
		method: 'DELETE',
		success: done
		};
		$.ajax(url, settings);
	});
}

/* This function requests a .zip of the print job to the browser */
function download(){
	$('#all_jobs').on('click', '.download', function(){
		$(this).siblings('.loading').show();

		var url = '/queue/download?id=' + $(this).parent().siblings('.info').children('.id').text().substring(4);
		window.open(url); //open download window

		$(this).siblings('.loading').hide();
	});
}


/* This function notifies the recipient that their print is finished */
function notify(){
	$('#all_jobs').on('click', '.done', function(){
		var sure = window.confirm("Are you sure?");
		if(!sure){
			return;
		}

		var id = $(this).parent().siblings('.info').children('.id').text().substring(4);
		var name = $(this).parent().parent().siblings('.job_title').text();
		var email = $(this).parent().siblings('.info').children('.email').text().substring(7);

		$(this).siblings('.loading').show();

		var url = '/queue?' + 'name=' + name + '&email=' + email;

		var done = function(){
			$(this).siblings('.loading').hide();
			remove(id); //remove item
		}

		var settings = {
		method: 'POST',
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

		/* get time created so the queue can be sorted */
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
						queue += '<p class="color">Color: ' + print_job['color'] + '</p>';
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

	var url = '/queue';
	var settings = {
		method: 'GET',
		success: add_to_page
	};
	$.ajax(url, settings);

	/* call the listeners for all button clicks */
	active_item();
	remove();
	download();
	notify();
}

$(document).ready(populate_page);
