var app=angular.module('appWeather', ['nvd3']);

app.value("appid","db88cb593c1449d65d857b10900d15fa");

app.run(function($rootScope) {
    /*
        Receive emitted message and broadcast it.
        Event names must be distinct or browser will blow up!
        */
        $rootScope.$on('handleLocationEmit', function(event, args) {
        	$rootScope.$broadcast('handleLocationBroadcast', args);
        });
        $rootScope.$on('handleJsonEmit', function(event, args) {
        	$rootScope.$broadcast('handleJsonBroadcast', args);
        });
        
        
    });

app.controller("autoCompleteLocation",function($scope,$http,shareDataService,dataService){
	
	var forecastList=[];


				//console.log ('loading first time from autoCompleteLocation');
				//var currentLocation=loadCurrentLocation();
					// This service's function returns a promise, but we'll deal with that shortly
					dataService.getCurrentLocation()
                	// then() called when son gets back
                	.then(function(responseData) {
                    		// promise fulfilled
                    		if (responseData!=null) {
					//console.log('city,country:'+responseData.city+','+responseData.country);
					loadWeatherData(responseData.city+','+responseData.country);
					
					//$scope.$emit('handleLocationEmit', {location:responseData.city+','+responseData.country});

					
					
				}
			}, function(error) {
                    		// promise rejected, could log the error with: console.log('error', error);
                    		alert("Error occured from current location.");
                    	}
                    	);
                	
				//use google cities
				google.maps.event.addDomListener(window, 'load', function () {
					var places = new google.maps.places.Autocomplete(document.getElementById('txtPlaces'));
					google.maps.event.addListener(places, 'place_changed', function () {
						var place = places.getPlace();
						var address = place.formatted_address;

						//console.log("Autocomplete Test");
						console.log(address);
						/*
						var latitude = place.geometry.location.lat();
						var longitude = place.geometry.location.lng();
						var mesg = "Address: " + address;
						mesg += "\nLatitude: " + latitude;
						mesg += "\nLongitude: " + longitude;
						alert(mesg);*/
						//Broadcast event with new location
						loadWeatherData(address);
						$scope.$emit('handleLocationEmit', {location:address});  
						$scope.placeName='';                    
						
					});
				});

				
				var loadWeatherData=function(location){
				// This service's function returns a promise, but we'll deal with that shortly
				dataService.getWeather(location)
		        	// then() called when son gets back
		        	.then(function(responseData) {
		            		// promise fulfilled
		            		if (responseData!=null) {
		            			$scope.$emit('handleJsonEmit', {json:responseData});
		                		// use fromJson to convert a JSON string to an object 
		                		var jsonObj= angular.fromJson(responseData);
		                		var getIcon="images/weather_icons/"+jsonObj.list[0].weather[0]
		                		.icon.match(/\d+/g)+".png";
		                		var temp = jsonObj.list[0].temp.day;
		                		var desc = jsonObj.list[0].weather[0].description;
		                		var city = jsonObj.city.name+","+jsonObj.city.country;
		                		console.log(temp+","+desc);
		                		$scope.icon=getIcon;
		                		$scope.temperature= jsonObj.list[0].temp.day+'\xB0'+'C';
		                		$scope.desc=jsonObj.list[0].weather[0].description;             
		                		$scope.location=jsonObj.city.name+","+jsonObj.city.country;
		                	} else {
		                		alert("No data fetched.");
		                	}
		                }, function(error) {
		            		// promise rejected, could log the error with: console.log('error', error);
		            		alert("Error occured from openweather.");
		            	}
		            	);
		        	
			};//loadWeatherData

		});
app.factory('dataService', function ($http,$q) {


	return {
		getCurrentLocation:function(){
			
			return $http.get('http://ipinfo.io')
			.then(function(response) {
				if ( response!=null) {
		//console.log('FromDataService:'+response.data.country);
		return response.data;
	} else {
                            // invalid response
                            return $q.reject(response.data);
                        }

                    }, function(response) {
                        // something went wrong
                        return $q.reject(response.data);
                    });




		},
		getWeather: function(location) {
                // the $http API is based on the deferred/promise APIs exposed by the $q service
                // so it returns a promise for us by default
                return $http.get('http://api.openweathermap.org/data/2.5/forecast/daily?q='+location+'&appid=db88cb593c1449d65d857b10900d15fa&cnt=8&units=metric')
                .then(function(response) {
                	if (typeof response.data === 'object') {
                		return response.data;
                	} else {
                            // invalid response
                            return $q.reject(response.data);
                        }

                    }, function(response) {
                        // something went wrong
                        return $q.reject(response.data);
                    });
            }
        };//return
    });





app.controller("forecastWeather",function($scope,shareDataService,dataService){

	$scope.$on('handleJsonBroadcast', function(event, args) {
		var responseData=args.json;
		console.log(responseData);
		var listOfDataObjects=[];
		if (responseData!=null) {
                        // use fromJson to convert a JSON string to an object 
                        var jsonObj= angular.fromJson(responseData);
					//create a list of object in order to share with another controller through shareDataService 
					for(var i=1;i<jsonObj.list.length;i++){
						var getIcon="images/weather_icons/"+jsonObj.list[i].weather[0]
						.icon.match(/\d+/g)+".png";
						
						
						var date = new Date( jsonObj.list[i].dt *1000);
    					date=date.toGMTString();//+"<br>"+myDate.toLocaleString();
    					date=date.substr(0, 11);
    					
    					var  desc=jsonObj.list[i].weather[0].description;
    					
    					var  temp= jsonObj.list[i].temp.day;

    					
    					var obj={date:date,temperature:temp,icon:getIcon,description:desc};

              				//shareDataService.addList(obj);					
              				listOfDataObjects.push(obj);
              			} 
              			$scope.records =listOfDataObjects;
              			
              			
              		} else {
              			alert("No data fetched.");
              		}


              	});  

});






app.controller('graphController', function($scope, shareDataService) {

	$scope.$on('handleJsonBroadcast', function(event, args) {
		var responseData=args.json;
		console.log(responseData);
		
		var listOfDataObjects=[];
		var graphData=[];
		if (responseData!=null) {
                        // use fromJson to convert a JSON string to an object 
                        var jsonObj= angular.fromJson(responseData);
				//create a list of object in order to share with another controller through shareDataService 
				for(var i=1;i<jsonObj.list.length;i++){
              				//var getIcon="images/icons/"+jsonObj.list[i].weather[0]
                        	        	//.icon.match(/\d+/g)+".png";
                        	        	
                        	        	
                        	        	var date = new Date( jsonObj.list[i].dt *1000);
    					date=date.toGMTString();//+"<br>"+myDate.toLocaleString();
    					date=date.substr(0, 11);
    					
               				//var  desc=jsonObj.list[i].weather[0].description;
               				
               				var  temp= jsonObj.list[i].temp.day;
               				
               				var obj={date:date,temperature:temp};

              				//shareDataService.addList(obj);					
              				listOfDataObjects.push(obj);
              				
              				
              			} 
				//Need to improve this part,should not be hardcoded.
				/*
				graphData.push({values:[
							listOfDataObjects[0],
							listOfDataObjects[1],
							listOfDataObjects[2],
							listOfDataObjects[3],
							listOfDataObjects[4],
							listOfDataObjects[5],
							listOfDataObjects[6]



							]});*/
				//Improvement
				var DataToString='{"values":'+JSON.stringify(listOfDataObjects)+'}';
				graphData.push(JSON.parse(DataToString));

				$scope.options = {
					chart: {
						type: 'discreteBarChart',
						height: 450,
						margin : {
							top: 20,
							right: 20,
							bottom: 50,
							left: 55
						},
						x: function(d){return d.date;},
						y: function(d){return d.temperature;},
						showValues: true,
						valueFormat: function(d){
							return d3.format(',.4f')(d);
						},
						duration: 500,
						xAxis: {
							axisLabel: 'Date',
							rotateLabels: -10
						},
						yAxis: {
							axisLabel: 'Temperature',
							axisLabelDistance: -10
						}
					}
				};
				$scope.data=graphData;
			}	


	}); //$scope.$on 
	




});

app.service('shareDataService', function() {

	var myList = [];

	var jsonObject={};
	
	

	var addList = function(newObj) {
		myList.push(newObj);
	}

	var getList = function(){
		console.log(myList.length);
      		//console.log(myList);
      		return myList;
      	}

      	return {
      		
      		addList: addList,
      		getList: getList
      	};

      });
app.factory('Data', function(){
	var data = [];
	var service = {};
	
	service.updateData = function(dataObj){
		data.push(dataObj);
	    //$rootScope.$broadcast("valuesUpdated");
	}

	service.getData = function(){
		return data;
	   // $rootScope.$broadcast("valuesUpdated");
	}

	

	return service;
	
});

