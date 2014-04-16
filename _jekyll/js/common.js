// General initialization for candidate spending
var init = function() {
  $('.top-bar-section li').removeClass('active');
  var page = $('#app-info').data('page')
  $('.top-bar-section [data-page=' + page + ']').addClass('active');
}
$(document).ready(init);
