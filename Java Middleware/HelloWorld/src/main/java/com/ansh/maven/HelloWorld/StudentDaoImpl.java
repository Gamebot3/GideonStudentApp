package com.ansh.maven.HelloWorld;

import java.text.SimpleDateFormat;
import java.util.*;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Transactional
@Repository
public class StudentDaoImpl implements StudentDao {
	
	@Autowired
	@Qualifier("gideon")
	private JdbcTemplate jdbcTemplate;

	private SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	
	// Returns all students in the database
	@Override
	public List<Student> getAllStudents() {
		String sql = "SELECT * FROM demostudents_s ORDER BY Client";
		sql = HelloController.setTargetTable(sql);
		RowMapper<Student> rowMapper = new StudentRowMapper();
		return this.jdbcTemplate.query(sql, rowMapper);
	}

	// Returns a single student with a certain id number
	@Override
	public Student getStudentById(int StudentId) {
		String sql = "SELECT * FROM demostudents_s WHERE StudentId = ?";
		sql = HelloController.setTargetTable(sql);
		RowMapper<Student> rowMapper = new StudentRowMapper();
		return jdbcTemplate.queryForObject(sql, rowMapper, StudentId);
	}

	// Returns students ordered by recently used for the list display, with a specified limit (0 corresponds to no limit)
	@Override
	public List<Student> getStudentsForList(boolean withData, int limit) {
		String sql = "SELECT * FROM demostudents_s ORDER BY LastUsed DESC";
		sql = HelloController.setTargetTable(sql);
		RowMapper<Student> rowMapper = new StudentRowMapper();
			
		// withData check
		if (withData)
			sql = sql.replace("_s", "_withdata");
		
		// limit check
		if (limit > 0) {
			sql += " LIMIT ?";
			return this.jdbcTemplate.query(sql, rowMapper, limit);
		} else
			return this.jdbcTemplate.query(sql, rowMapper);
	}
	
	@Override
	public List<Integer> getStudentIdsWithRecords() {
		String sql = "SELECT StudentId FROM demostudents_withdata";
		sql = HelloController.setTargetTable(sql);
		return jdbcTemplate.queryForList(sql, Integer.class);
	}
	
	// Returns the grade of a single student
	@Override
	public String getGrade(int StudentId) {
		String sql = "SELECT Grade FROM demostudents WHERE StudentId = ? LIMIT 1";
		sql = HelloController.setTargetTable(sql);
		return jdbcTemplate.queryForObject(sql, String.class, StudentId);
	}

	// Returns the categories of books for which a student has records
	@Override
	public List<String> getCategories(int StudentId) {
		String sql = "SELECT DISTINCT Category FROM demorecords_joined WHERE StudentId = ?";
		sql = HelloController.setTargetTable(sql);
		return this.jdbcTemplate.queryForList(sql, String.class, StudentId);
	}
	
	
	
	// Updates student information in the database
	@Override
	public int updateStudent(Student student, boolean isNew) {
		if (isNew) {
			String sql = "INSERT INTO demostudents (Client, Email, Phone, Address, Grade, Gender, CurrentPasses, LastUsed) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
			sql = HelloController.setTargetTable(sql);
			this.jdbcTemplate.update(sql, student.getClient(), student.getEmail(), student.getPhone(), student.getAddress(), student.getGrade(), student.getGender(), student.getCurrentPasses(), dateFormat.format(new Date()));
		}
		else {
			String sql = "UPDATE demostudents SET Client = ?, Email = ?, Phone = ?, Address = ?, Grade = ?, Gender = ?, CurrentPasses = ? WHERE StudentId = ?";
			sql = HelloController.setTargetTable(sql);
			this.jdbcTemplate.update(sql, student.getClient(), student.getEmail(), student.getPhone(), student.getAddress(), student.getGrade(), student.getGender(), student.getCurrentPasses(), student.getStudentId());
		}
		return 0;
	}
	
	
	// Sets the last used date of the student with either a studentId or a recordId
	@Override
	public int updateLastUsed(int id) {
		String sql = "UPDATE demostudents SET LastUsed = ? WHERE StudentId = ?";
		sql = HelloController.setTargetTable(sql);
		this.jdbcTemplate.update(sql, dateFormat.format(new Date()), id);
		return 0;
	}
	
	// Deletes a student and their records using a procedure call
	@Override
	public int removeStudent(int studentId) {
		String sql = "CALL `delete_demostudent` (?)";
		sql = HelloController.setTargetTable(sql);
		return this.jdbcTemplate.update(sql, studentId);
	}
	
	// Shifts all grades up or down
	@Override
	public int shiftGrades(boolean isInc) {
		String sql = "";
		if (isInc)
			sql = "CALL `grade_increment` ()";
		else
			sql = "CALL `grade_decrement` ()";
		
		return this.jdbcTemplate.update(sql);
	}
}
