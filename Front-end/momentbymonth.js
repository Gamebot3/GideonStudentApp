/*
 * MOMENT BY MONTH
 * A super simple utility file containing methods meant to manipulate objects with month, year, and date properties.
 * Other variables exist specifically to faciliate the x-axis on the graph
 *
 * NOTES:
 * - The date objects that are manipulated by the methods are formatted: {month: m, year: y, date: d}. m is an integer from 0-11, y is an integer from 0-xxxx, and d is a decimal from 0-1
 * - A "month index" is a single number that encapsulates the entire object. 0 is the object corresponding to August of Kindergarten. Each additional month from there is +1.
 * - Months are numbered 0 through 11 instead of 1 through 12 for easy calculations. When displaying, you should use month + 1.
 * - Because the exact month value is not always needed in a calculation, sometimes the "date" property is ignored and simply set to be 0. This is for simplicity
 * - Dates requires knowledge about whether or not the user is logged in (see variable "loggedIn") - this requires gideonApp.js
 */


// Custom extension to the Math class: modN is the same as % but loops around for negative numbers
Math.modN = (x, n) => (x % n + n) % n;


let Dates = {
	// INIT FUNCTION: creates the object
	init() {
		// Sets the date corresponding to August of Kindergarten given the student's current grade level
		this.setZeroDate = (currentGrade) => {
			this.zeroDate = {
				month: 7,
				year: this.now.year - currentGrade - (this.now.month < 7 ? 1 : 0), // Subtract an extra 1 from the year if it is currently before August
				date: 0
			};
		};

		// Returns a date object a certain number of months after another one of those objects (note: object loses floating point day)
		this.dateAdd = (originalDate, addition) => {
			let numeral = (originalDate.year * 12 + originalDate.month) + addition;
			return {
				month: Math.modN(numeral, 12),
				year: Math.floor(numeral / 12),
				date: 0
			};
		};

		// Returns a date object a certain number of months prior to another one of those objects (note: object loses floating point day)
		this.dateSubtract = (originalDate, subtraction) => this.dateAdd(originalDate, -subtraction);

		// Returns the difference between two date objects, in months
		this.dateCompare = (date1, date2) => (date1.year - date2.year) * 12 + (date1.month - date2.month) + (date1.date - date2.date);

		// Converts a Date string or DateTime string into a date object
		this.stringToDateObject = (startDate) => {
			let d = moment(startDate.split(" ")[0]);
			return {
				month: d.month(),
				year: d.year(),
				date: (d.date() - 1) / d.daysInMonth()
			};
		};

		// Converts a month index into a date object
		this.indexToDateObject = (index) => {
			let theDate = this.dateAdd(this.zeroDate, Math.floor(index));

			// Gets the date float (date index / month length)
			let daysInMonth = moment(`${theDate.year} ${theDate.month + 1}`, "YYYY MM").daysInMonth();
			theDate.date = Math.round(Math.modN(index, 1) * daysInMonth) + 1;

			return theDate;
		};

		// Converts a date object into a month index
		this.dateToMonthIndex = (date) => this.dateCompare(date, this.zeroDate);

		// Converts an input index (based on months in the past) to a month index
		this.monthsAgoToMonthIndex = (months) => this.dateToMonthIndex(this.dateSubtract(this.now, months));

		// Variables
		let n = moment();
		this.now = {
			month: n.month(),
			year: n.year(),
			date: (n.date() - 1) / n.daysInMonth()
		};

		this.zeroDate = this.setZeroDate(0);

		delete this.init; // remove this function from the object, to avoid clutter
		return this;
	}
}.init();

