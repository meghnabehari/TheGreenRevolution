
$(document).on('click', '#nextButton', function(){
    fullpage_api.moveTo('sixth', 1);
  });

  $(document).on('click', '#americaWaterButton', function(){
    fullpage_api.moveTo('seventh', 1);
  });


  $(document).on('click', '#launchButton', function(){
    fullpage_api.moveTo('fourth', 1);
    
  });


$(document).on('click', '#backButton', function(){
    fullpage_api.moveTo('fourth', 1);
  });


$(document).on('click', '#scoreButton', function(){
    fullpage_api.moveTo('seventh', 1);
  });



  $(document).on('click', '.display-icon', function() {
    $('.display-icon').removeClass('icon-clicked');

    $(this).addClass('icon-clicked');

    let metric;
    if (this.id === 'water_button') {
        metric = "Water Conservation";
    } else if (this.id === 'solar_panels') {
        metric = "Solar Panels";
    } else if (this.id === 'electric_vehicles') {
        metric = "Electric Vehicles";
    }

    updateMetric(metric);
});

  $('#categorySelector').on('change', function() {
    var selectedMetric = $(this).find("option:selected").text();
    updateMetricTitle(selectedMetric);
  });


  function updateMetric(metric) {
    updateMetricTitle(metric);
    $('#categorySelector').val(getDropdownValue(metric)).change();
  }
  
  function updateMetricTitle(metric) {
    $('#metricTitle #metricName').text(metric);
  }
  
  
  function getDropdownValue(metric) {
    switch(metric) {
      case "Water Conservation":
        return "waterUsage";
      case "Solar Panels":
        return "solarCount";
      case "Electric Vehicles":
        return "evCount";
      default:
        return ""; 
    }
  }
