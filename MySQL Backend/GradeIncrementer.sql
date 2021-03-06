/*
							GRADE INCREMENTER

Bumps up the grade of every student in the database, meant to be used once a year
*/

DELIMITER //
CREATE PROCEDURE `grade_increment` ()
BEGIN
	-- when testing, change this value to any id number representing a test student in the database
	SET @testId := 77;

	-- makes a temporary table to map strings and numbers representing grade levels
	CREATE TABLE `grades` (
		`GradeId` int(11) NOT NULL AUTO_INCREMENT,
		`GradeNumber` int(11) DEFAULT NULL,
		`GradeString` varchar(255) DEFAULT NULL,
		PRIMARY KEY (`GradeId`)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;

	-- manually inserts the 14 values for the table
	INSERT INTO grades (GradeNumber, GradeString)
	VALUES
		(-1, 'PreK (-1)'),
		(0, 'Kinder (0)'),
		(1, '1st'),
		(2, '2nd'),
		(3, '3rd'),
		(4, '4th'),
		(5, '5th'),
		(6, '6th'),
		(7, '7th'),
		(8, '8th'),
		(9, '9th'),
		(10, '10th'),
		(11, '11th'),
		(12, '12th');

	-- increments the grade level for all students, with checks to make sure that grades above 12, below -1, and undefined are accounted for
	UPDATE students s
	SET Grade = CASE
		WHEN s.Grade = null OR s.Grade = ""
		THEN ""
		/*WHEN s.Grade = "PreK (-1)"
		THEN "PreK (-1)"*/
		WHEN
			s.Grade IN (
				SELECT
					GradeString
				FROM grades
			)
			&& NOT s.Grade = "12th"
		THEN (
			SELECT
				GradeString
			FROM grades
			WHERE GradeNumber = (
				SELECT
					g.GradeNumber + 1
				FROM grades g
				WHERE g.GradeString = s.Grade
			)
		)
		ELSE
			CONCAT(CAST(CAST(SUBSTRING(s.Grade, 1, 2) AS SIGNED) + 1 AS CHAR), "th")
	END
	WHERE s.StudentId >= 0; -- replace this line with "WHERE StudentId = @testId" when testing

	-- debug clauses, for use in testing
	/*
	SELECT * FROM grades;
	SELECT StudentId, Client, Grade FROM students;
	SELECT StudentId, Client, Grade FROM students WHERE StudentId = @testId;
	UPDATE students SET Grade = "1st" WHERE StudentID = @testId;
	SELECT StudentId, Client, CAST(CAST(SUBSTRING(students.Grade, 1, 2) AS SIGNED) + 1 AS CHAR) AS castcheck FROM students;
	*/

	-- finally, remove the table
	DROP TABLE grades;

END //
DELIMITER ;


-- NOTE: The grade decrementer is exactly the same as the incrementer except with some changes noted in comments

DELIMITER //
CREATE PROCEDURE `grade_decrement` () -- DIFF: "increment" -> "decrement"
BEGIN
	SET @testId := 77;

	CREATE TABLE `grades` (
		`GradeId` int(11) NOT NULL AUTO_INCREMENT,
		`GradeNumber` int(11) DEFAULT NULL,
		`GradeString` varchar(255) DEFAULT NULL,
		PRIMARY KEY (`GradeId`)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;

	INSERT INTO grades (GradeNumber, GradeString)
	VALUES
		(-1, 'PreK (-1)'),
		(0, 'Kinder (0)'),
		(1, '1st'),
		(2, '2nd'),
		(3, '3rd'),
		(4, '4th'),
		(5, '5th'),
		(6, '6th'),
		(7, '7th'),
		(8, '8th'),
		(9, '9th'),
		(10, '10th'),
		(11, '11th'),
		(12, '12th');

	UPDATE students s
	SET Grade = CASE
		WHEN s.Grade = null OR s.Grade = ""
		THEN ""
		WHEN s.Grade = "PreK (-1)" 	-- DIFF: "/" -> "", "*" -> ""
		THEN "PreK (-1)"
		WHEN
			s.Grade IN (
				SELECT
					GradeString
				FROM grades
			)
			&& NOT s.Grade = "12th"
		THEN (
			SELECT
				GradeString
			FROM grades
			WHERE GradeNumber = (
				SELECT
					g.GradeNumber - 1 -- DIFF: "+" -> "-"
				FROM grades g
				WHERE g.GradeString = s.Grade
			)
		)
		ELSE
			CONCAT(CAST(CAST(SUBSTRING(s.Grade, 1, 2) AS SIGNED) - 1 AS CHAR), "th") -- DIFF: "+" -> "-"
	END
	WHERE s.StudentId >= 0;

	-- debug clauses, for use in testing
	/*
	SELECT * FROM grades;
	SELECT StudentId, Client, Grade FROM students;
	SELECT StudentId, Client, Grade FROM students WHERE StudentId = @testId;
	UPDATE students SET Grade = "1st" WHERE StudentID = @testId;
	SELECT StudentId, Client, CAST(CAST(SUBSTRING(students.Grade, 1, 2) AS SIGNED) + 1 AS CHAR) AS castcheck FROM students;
	*/

	DROP TABLE grades;

END //
DELIMITER ;