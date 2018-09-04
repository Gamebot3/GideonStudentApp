/******************\
* SITEWIDE MODULE  *
\******************/
var app = angular.module('gideonApp', ['ngAnimate']);


/******************\
* STUDENTLIST.HTML *
\******************/
app.controller('studentCtrl', function($scope, $http, $window) {

	$scope.getStudents = function() {
		$http.get(`http://localhost:8081/${$scope.dataOn ? "dataStudents" : "students"}`)
		.then(function(response) {
			$scope.students = response.data;
		});
		$scope.toggleButtonText = $scope.dataOn ? "Display All Students" : "Display Students with Records";
	}

	$scope.toggleData = function() {
		$scope.dataOn = !$scope.dataOn;
		$scope.getStudents();
	}

	$scope.dataOn = false;
	$scope.active = false;
	$scope.getStudents();

	$scope.manageExpansion = function(student) {
		if ($scope.expandedStudent == student)
			$scope.expandedStudent = null;
		else
			$scope.expandedStudent = student;
	}

	//Function for selecting a student and going to the chart page
	$scope.logStudent = function(id, name) {
		$window.localStorage.setItem(0, id);
		$window.localStorage.setItem(1, name);
		window.location.href = "LineChart.html";
	}

	$scope.editStudent = function(id, name) {
		$window.localStorage.setItem(0, id);
		$window.localStorage.setItem(1, name);
		window.location.href = "EditStudent.html";
	}
});


/****************\
* LINECHART.HTML *
\****************/
app.controller('chartCtrl', function($scope, $http, $window) {
	$scope.expanded = true;
	$scope.logoDisplay = false;

	$scope.studentId = $window.localStorage.getItem(0);
	$scope.studentName = $window.localStorage.getItem(1);

	// vvvv DATES MANAGEMENT STUFF vvvv
	var zeroDate;
	var n = moment();
	now = {
		month: n.month(),
		year: n.year(),
		date: 0
	}
	let getStartDateAt = function(index) { // function that returns a month/year/floating-point-date object from a specified record, for use in plotting points
		var d = moment($scope.records[index].startDate.split(" ")[0]);
		return {
			month: d.month(),
			year: d.year(),
			date: (d.date() - 1) / d.daysInMonth()
		}
	}
	let dateAdd = function(originalDate, addition) { // function that returns a month/year/floating-point-date object a certain number of months after another one of those objects
		var numeral = originalDate.year * 12 + originalDate.month;
		numeral += addition;
		return {
			month: numeral % 12,
			year: Math.trunc(numeral / 12),
			date: 0
		}
	}
	let dateSubtract = function(originalDate, subtraction) { // function that returns a month/year/floating-point-date object a certain number of months prior to another one of those objects
		return dateAdd(originalDate, -1 * subtraction);
	}
	let dateCompare = function(date1, date2) { // function that returns the month difference between two month/year/floating-point-date objects
		return (date1.year - date2.year) * 12 + (date1.month - date2.month) + (date1.date - date2.date);
	}
	// ^^^^ DATES MANAGEMENT STUFF ^^^^


	//Retrieves all categories the selected student is working in
	$http.get(`http://localhost:8081/categoriesByStudent?Id=${$scope.studentId}`)
	.then(function(response) {
		$scope.categoriesOfStudent = response.data;
	});

	//Retrieves the student's grade level and does time calculations
	$http.get(`http://localhost:8081/gradeOfStudent?Id=${$scope.studentId}`)
	.then(function(response) {
		$scope.currentGrade = response.data;

		zeroDate = {
			month: 7,
			year: now.year - $scope.currentGrade - (now.month < 7 ? 1 : 0), // subtract an extra 1 from the year if it's before august
			date: 0
		}
	});

	//Retrieves all the books for use later in y-axis plotting
	$http.get("http://localhost:8081/books")
	.then(function(response) {
		$scope.allBooks = response.data;
	});

	//Retrieves possible repetition selection options for the selected category
	$scope.getReps = function() {
		if($scope.selectedCategory == "Calculation") {
			$scope.repOptions = ["1", "2", "3", "4", "5"];
		} else {
			$scope.repOptions = ["1", "2"];
		}
	}

	// Pre-generation chart management
	var regen = false;
	var exampleChart;
	let myChart = document.getElementById('lineChart').getContext('2d');

	//Generates the lineChart based on instructor specifications
	$scope.generateChart = function() {
		if ($scope.form.$invalid) { // Ensures form is valid before generation
			$scope.formStatus = 0;
			$scope.formStatusText = "Invalid Form";
			return;
		} else {
			$scope.formStatus = 2;
			$scope.formStatusText = "Processing...";
		}

		var date1 = dateSubtract(now, $scope.months);
		var date2 = dateSubtract(now, $scope.months2);

		//// GIANT CHART GENERATION METHOD ////
		$http.get(`http://localhost:8081/recordsById?StudentId=${$scope.studentId}&Category=${$scope.selectedCategory}&Months=${$scope.months}&Reps=${$scope.selectedRep}&Until=${$scope.months2}`)
		.then(function(response) {
			$scope.records = response.data;
			
			try {
				var lowestDate = dateCompare(date1, zeroDate); // x-axis bounds
				var highestDate = dateCompare(date2, zeroDate);
				var greatestBook = 0; // y-axis bounds
				var leastBook = 999;

				var currentGradeOffset = 0;
				
				var labelDates = []; // main container of x axis labels, labels are objects containing properties "month", "year", and "grade" (also date, but that's irrelevant here)
				var grades = [];
				var points = []; // container with points: x is date, y is bookid
				var points2 = []; 			// currently contains the best fit line
				var points3 = []; 			// currently unused test modification of the data


				//// Maps the internal linear scale of the x axis (lowestDate, ... highestDate) with labels containing dates and grades ////
				for(j = lowestDate; j < highestDate; j++) {
					var currentDate = dateAdd(zeroDate, j);
					labelDates.push(currentDate);

					if(currentDate.month == 7) // grade goes up in August = 7
						currentGradeOffset++;
					grades.push(currentGradeOffset); // maps an offset value for the grade relating to each month, starting from 0 and increasing until the present
				}
				for(j = 0; j < labelDates.length; j++)
					labelDates[j].grade = $scope.currentGrade + grades[j] - currentGradeOffset; // uses the final grade offset and the known current grade to calculate the final grade value for each month
				console.log(labelDates);

				//// Creates a point mapping each record to its respective spot on the x and y axis ////
				var a = 0; // Helps display error message if there is no data, couldn't find a better solution for some reason: this value will increase for every existing record
				for(i = 0; i < $scope.records.length; i++) {
					if($scope.records[i].startDate != null) {
						a++;

						points.push({
							x: dateCompare(getStartDateAt(i), zeroDate),
							y: $scope.records[i].bookId
						})

						if ($scope.records[i].bookId > greatestBook)
							greatestBook = $scope.records[i].bookId;
						if ($scope.records[i].bookId < leastBook)
							leastBook = $scope.records[i].bookId;
					}
				}

				if (a <= 0) { // no data check
					$scope.errorMessage = true;
					$scope.formStatus = 0;
					$scope.formStatusText = "Error: No data";
					return;
				}
				else {
					$scope.errorMessage = false;
				}
				

				//// BEST FIT LINE: least squares method ////
				var metrics = {xmean: 0, ymean: 0, diff: 0, squares: 0};
				for(b = 0; b < points.length; b++) {
					metrics.xmean += points[b].x;
					metrics.ymean += points[b].y;
				}
				metrics.xmean /= points.length;
				metrics.ymean /= points.length;
				for(b = 0; b < points.length; b++) {
					metrics.diff += (points[b].x - metrics.xmean) * (points[b].y - metrics.ymean);
					metrics.squares += (points[b].x - metrics.xmean) * (points[b].x - metrics.xmean);
				}
				metrics.slope = metrics.diff / metrics.squares;
				points2.push({
					x: lowestDate - 1,
					y: metrics.slope * (lowestDate - 1 - metrics.xmean) + metrics.ymean
				});
				points2.push({
					x: highestDate + 1,
					y: metrics.slope * (highestDate + 1 - metrics.xmean) + metrics.ymean
				});


				//// Y-LABEL GENERATION ////
				let labelToBookTitle = function(label, abbreviated) {
					var s = $scope.allBooks[label-1];
					if (s != null && s != undefined && s.category == $scope.selectedCategory) {
						var fullLabel;

						if (abbreviated)
							fullLabel = s.abbreviation;
						else
							if ($scope.selectedCategory == "Comprehension" || $scope.selectedCategory == "Calculation")
								fullLabel = `${s.subcategory} - ${s.title}`;
							else
								fullLabel = s.title;

						return fullLabel;
					}
				}


				//// CHART SPECS ////
				Chart.defaults.global.defaultFontSize = 18;
				Chart.defaults.global.defaultFontColor = '#000';

				if (regen)
					exampleChart.destroy();
				exampleChart = new Chart(myChart,{
					type: 'line',
					data:{
						datasets:[{
							label: $scope.studentName,
							data: points,
							backgroundColor: "rgba(255, 0, 0, 0.4)",
							borderColor: "rgba(255, 0, 0, 0.4)",
							fill: false,
							cubicInterpolationMode: 'monotone',
							hitRadius: 30
						}, {
							label: "Best Fit Line",
							data: points2,
							backgroundColor: "rgba(0, 0, 255, 0.4)",
							borderColor: "rgba(0, 0, 255, 0.4)",
							fill: false,
							borderDash: [5],
							lineTension: 0
						}]
					},
					options: {
						responsive: true,
						title: {
							display: false
						},
						legend: {
							position: 'top'
						},
						tooltips: {
							enabled: true,
							callbacks: {
								title:function(tooltipItem, data) {
									return labelToBookTitle(tooltipItem[0].yLabel, false);
								},
								label:function(tooltipItem, data) { // callback function converts x-axis numeral to MM/DD/YYYY formatted string
									var number = tooltipItem.xLabel;
									var finalMonth = zeroDate.month + Math.trunc(number);
									var finalYear = zeroDate.year + Math.trunc(finalMonth / 12);
									finalMonth = finalMonth % 12 + 1;

									var daysInMonth = moment(`${finalYear} ${finalMonth}`, "YYYY MM").daysInMonth();
									var finalDate = Math.round((number % 1) * daysInMonth) + 1;
									return `started on ${finalMonth}/${finalDate}/${finalYear}`;
								}
							}
						},
						layout: {
							padding: {
								top: 10,
								bottom: 10
							}
						},
						scales: {
							xAxes: [{
								id:"xAxis1",
								type: 'linear',
								scaleLabel: {
									display: false,
									padding: -5
								},
								ticks: {
									dislay: false,
									stepSize: 1,
									autoSkip: true,
									min: lowestDate,
									max: highestDate,
									maxRotation: 0,
									callback:function(label){
										var s = labelDates[label - lowestDate];
										if (s != null && s != undefined)
											return s.month + 1;
									}
								}
							}, {
								id: "xAxis2",
								type: 'linear',
								gridLines: {
									display: false,
									drawBorder: true
								},
								scaleLabel: {
									display: false,
									padding: 0
								},
								ticks: {
									stepSize: 1,
									autoSkip: false,
									min: lowestDate,
									max: highestDate,
									callback:function(label){
										var s = labelDates[label - lowestDate];
										if (s != null && s != undefined) {
											if(s.month == 6) {
												return s.year;
											} else if (s.month == 0){
												return "|";
											}
										}
									},
									maxRotation: 0,
									padding: 0
								}

							}, {
								id: "xAxis3",
								type: 'linear',
								gridLines: {
									display: false,
									drawBorder: true,
									drawOnChartArea: false
								},
								scaleLabel: {
									display: false
								},
								ticks: {
									stepSize: 1,
									autoSkip: false,
									min: lowestDate,
									max: highestDate,
									callback:function(label){
										var s = labelDates[label - lowestDate];
										if (s != null && s != undefined) {
											if(s.month == 1) {
												if(s.grade == 0) {
													return "Kindergarten";
												} else if(s.grade == 1) {
													return "1st Grade";
												} else if(s.grade == 2) {
													return "2nd Grade";
												} else if(s.grade == 3) {
													return "3rd Grade";
												} else if(s.grade <= -1) {
													return "Pre-K";
												} else {
													return `${grade}th Grade`;
												}
											} else if (s.month == 7) {
												return "|";
											}
										}
									},
									maxRotation: 0
								}
							}],
							yAxes: [{
								type: 'linear',
								position: 'left',
								display: true,
								scaleLabel: {
									display: true,
									labelString: $scope.selectedCategory
								},
								ticks: {
									stepSize: 1,
									autoSkip: false,
									min: leastBook - 1,
									max: greatestBook + 3,
									lineHeight: 1,
									callback:function(label) {
										return labelToBookTitle(label, true); // USE "TRUE" INSTEAD OF "FALSE" FOR MULTI-LINE LABELS
									}
								}
							}]
						}
					}
				});

				regen = true;

				$scope.logoDisplay = true;
				$scope.expanded = false;

				$scope.formStatus = 1;
				$scope.formStatusText = "";
			}
			catch (err) {
				console.log(err.message);
				$scope.formStatus = 0;
				$scope.formStatusText = "Error - check console";
			}
		});	
	};

});


/*******************\
* INSERTRECORD.HTML *
\*******************/
app.controller('insertCtrl', function($scope, $http, $window){

	//Returns a list of all students for easy name selection	
	$http.get("http://localhost:8081/students")
	.then(function(response) {
		$scope.students = response.data;

		$scope.names = [];
		for(i = 0; i < $scope.students.length; i++) {
			var nameWithId = { name: $scope.students[i].client, id: $scope.students[i].studentId };
			$scope.names.push(nameWithId); // names contain ids to make sure every name is distinct - the name will be displayed but the id will be used
		}

	});

	//Returns a list of subcategories based on the selected category
	$scope.getSubcategories = function() {
		$http.get(`http://localhost:8081/subcategories?Category=${$scope.selectedCategory}`)
		.then(function(response) {
			$scope.subcategories = response.data;
		});
	}

	//Returns a list of titles based on the selected subCategory
	$scope.getTitles = function() {
		$http.get(`http://localhost:8081/titles?Subcategory=${$scope.selectedSubCategory}`)
		.then(function(response) {
			$scope.titles = response.data;
		});
	}

	//Returns all books
	$http.get("http://localhost:8081/categories")
	.then(function(response) {
		$scope.categories = response.data
	});

	//Creates JSON for the record based on form data
	$scope.createRecord = function() {
		if ($scope.form.$valid) {
			$scope.formStatus = 2;
			$scope.formStatusText = "Processing...";

			var newRecordDetails = JSON.stringify({
				id: $scope.client.id,
				category: $scope.selectedCategory,
				subcategory: $scope.selectedSubCategory,
				title: $scope.selectedTitle,
				startDate: $scope.startDate,
				testTime: $scope.testTime,
				mistakes: $scope.mistakes,
				rep: $scope.rep
			});
			//Inserts the record with an HTTP post call
			$http({
				url: 'http://localhost:8081/addRecord',
				method: 'POST',
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json"
				},
				data:newRecordDetails
			}).then(function(response) {
				if (response.data == 0) {
					$scope.formStatus = 1;
					$scope.formStatusText = `Successfully added record for ${$scope.client.name}`;
				} else {
					$scope.formStatus = 0;
					$scope.formStatusText = "Error";
				}
			});
		}
		else {
			$scope.formStatus = 0;
			$scope.formStatusText = "Invalid Form";
		}
	}
});


/*******************\
* UPDATERECORD.HTML *
\*******************/		
app.controller('updateCtrl', function($scope, $http, $window){

	//Returns all student names for easy selection
	$http.get("http://localhost:8081/students")
	.then(function(response) {
		$scope.students = response.data;
		$scope.names = [];
		for(i = 0; i < $scope.students.length; i++) {
			$scope.names.push($scope.students[i].client);
		}
	});

	//Retrieves incomplete records for instructors to choose from
	$http.get("http://localhost:8081/incompleteRecords")
	.then(function(response) {
		$scope.records = response.data;
		$scope.displayRecords = [];
		for(i = 0; i < $scope.records.length; i++) {
			var splitDate = $scope.records[i].startDate.split('-');

			var year = parseInt(splitDate[0]);
			var month = parseInt(splitDate[1]);
			var day = parseInt(splitDate[2]);

			var startDate = new Date(year, month-1, day).toISOString();

			//Formats date for readability
			var formattedDate = `${month}/${day}/${year}`;

			var displayRecord = `${$scope.records[i].name} started book ${$scope.records[i].bookTitle} on ${formattedDate} | RecordId: ${$scope.records[i].recordId}`;

			$scope.displayRecords.push({ name: $scope.records[i].name, id: $scope.records[i].recordId, date: startDate, display: displayRecord }); // "display" for the shown selections, everything else is actual data
		}
	});

	//Updates an incomplete record based on instructor data
	$scope.updateRecord = function() {
		if ($scope.form.$valid) {
			$scope.formStatus = 2;
			$scope.formStatusText = "Processing...";

			$http.get(`http://localhost:8081/updateRecord?recordId=${$scope.selectedRecord.id}&endDate=${$scope.endDate}&testTime=${$scope.testTime}&mistakes=${$scope.mistakes}`)
			.then(function(response) {
				if (response.data == 0) {
					$scope.formStatus = 1;
					$scope.formStatusText = `Successfully updated record for ${$scope.selectedRecord.name}`;
				} else {
					$scope.formStatus = 0;
					$scope.formStatusText = "Error";
				}
			});	
		}
		else {
			$scope.formStatus = 0;
			$scope.formStatusText = "Invalid Form";
		}
	}
});


/********************\
* INSERTSTUDENT.HTML *
\********************/
app.controller('insertStudentCtrl', function($scope, $http, $window) {

	//Creates JSON for the student based on form data
	$scope.createStudent = function() {
		if ($scope.form.$valid){
			$scope.formStatus = 2;
			$scope.formStatusText = "Processing...";

			var newStudentDetails = JSON.stringify({
				client: $scope.Client,
				grade: $scope.Grade,
				gender: $scope.Gender
			});
			//Inserts the record with an HTTP post call
			$http({
				url: 'http://localhost:8081/addStudent',
				method: 'POST',
				headers: {
					"Content-Type": "application/json",
					"Accept": "application/json"
				},
				data:newStudentDetails
			}).then(function(response) {
				if (response.data == 0) {
					$scope.formStatus = 1;
					$scope.formStatusText = `Successfully added ${$scope.Client}`;
				} else {
					$scope.formStatus = 0;
					$scope.formStatusText = "Error";
				}
			});
		}
		else {
			$scope.formStatus = 0;
			$scope.formStatusText = "Invalid Form";
		}
	}
});


/******************\
* EDITSTUDENT.HTML *
\******************/
app.controller('editStudentCtrl', function($scope, $http, $window) {
	$http.get(`http://localhost:8081/student?Id=${$window.localStorage.getItem(0)}`)
	.then(function(response) {
		$scope.student = response.data;
		$scope.Id = $scope.student.studentId;
		$scope.Client = $scope.student.client;
		$scope.Email = $scope.student.email;
		$scope.Phone = $scope.student.phone;
		$scope.Address = $scope.student.address;
		$scope.Grade = $scope.student.grade;
		$scope.Gender = $scope.student.gender;
		$scope.CurrentPasses = $scope.student.currentPasses;
	});

	$scope.updateStudent = function() {
		if ($scope.form.$valid) {
			$scope.formStatus = 2;
			$scope.formStatusText = "Processing...";

			$http.get(`http://localhost:8081/updateStudent?studentId=${$scope.Id}&client=${$scope.Client}&email=${$scope.Email}&phone=${$scope.Phone}&address=${$scope.Address}&grade=${$scope.Grade}&gender=${$scope.Gender}&currentPasses=${$scope.CurrentPasses}`)
			.then(function(response) {
				if (response.data == 0) {
					window.location.href = "StudentList.html";
				} else {
					$scope.formStatus = 0;
					$scope.formStatusText = "Error";
				}
			});
		}
		else {
			$scope.formStatus = 0;
			$scope.formStatusText = "Invalid Form";
		}
	}
});