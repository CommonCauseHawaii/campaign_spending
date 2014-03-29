// General initialization for candidate spending
var init = function() {
  console.log('init running');
  $('.top-bar-section li').removeClass('active');
  var page = $('#app-info').data('page')
  console.log('page');
  console.log(page);
  $('.top-bar-section [data-page=' + page + ']').addClass('active');
}
$(document).ready(init);
