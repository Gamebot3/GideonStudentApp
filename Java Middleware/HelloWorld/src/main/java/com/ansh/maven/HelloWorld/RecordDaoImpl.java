package com.ansh.maven.HelloWorld;

import java.util.*;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Transactional
@Repository
public class RecordDaoImpl implements RecordDao{

	@Autowired
	@Qualifier("gideon")
	private JdbcTemplate jdbcTemplate;

	//Retrieves all records from every student in the database
	@Override
	public List<Record> getAllRecords() {
		String sql = "SELECT * FROM demorecords_joined";
		sql = HelloController.setTargetTable(sql);
		RowMapper<Record> rowMapper = new RecordRowMapper();
		return this.jdbcTemplate.query(sql, rowMapper);
	}
	
	//Returns all records that have start dates, but do not have end dates
	@Override
	public List<Record> getIncompleteRecords() {
		String sql = "SELECT * FROM demorecords_joined WHERE EndDate IS NULL";
		sql = HelloController.setTargetTable(sql);
		RowMapper<Record> rowMapper = new RecordRowMapper();
		return this.jdbcTemplate.query(sql, rowMapper);
	}

	//Returns all records for a certain student and a certain category
	@Override
	public List<Record> getAllRecordsById(int StudentId) {
		String sql = "SELECT * FROM demorecords_joined WHERE StudentId = ?";
		sql = HelloController.setTargetTable(sql);
		RowMapper<Record> rowMapper = new RecordRowMapper();
		return this.jdbcTemplate.query(sql, rowMapper, StudentId);
	}
	
	// Returns records for a student within a certain range, plus or minus one record, with a specific category and rep count
	@Override
	public List<Record> getRecordsForChart(int StudentId, String category, int months, int until, String whichReps) {
		String sql = "SELECT * FROM demorecords_joined WHERE StudentId = ? AND Category = ? # AND StartDate IS NOT NULL ORDER BY StartDate ASC";
		sql = HelloController.setTargetTable(sql);
		RowMapper<Record> rowMapper = new RecordRowMapper();
		
		if(whichReps.equalsIgnoreCase("All")) {		// Content of query depends on repetition selection
			sql = sql.replace("#", "");
			return this.jdbcTemplate.query(sql, rowMapper, StudentId, category);
		} else {
			sql = sql.replace("#", "AND Rep = ?");
			return this.jdbcTemplate.query(sql, rowMapper, StudentId, category, whichReps);
		}
	}
	
	// Gathers international goal line
	@Override
	public List<Data> getInternationalData(String category) {
		String sql = "SELECT * FROM demointernationaldata_joined WHERE Category = ?";
		sql = HelloController.setTargetTable(sql);
		RowMapper<Data> rowMapperD = new DataRowMapper();
		return this.jdbcTemplate.query(sql, rowMapperD, category);
	}
	
	

	//Updates a record that either already exists or is completely new
	@Override
	public int updateRecord(Record record, Book book, boolean isNew) {
		if (isNew) {
			String sql = "INSERT INTO demorecords (StudentId, BookId, StartDate, EndDate, Rep, Test, TestTime, Mistakes, Notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
			sql = HelloController.setTargetTable(sql);
			this.jdbcTemplate.update(sql, record.getStudentId(), book.getBookId(), record.getStartDate(), record.getEndDate(), record.getRep(), book.getTest(), record.getTestTime(), record.getMistakes(), record.getNotes());
		}
		else {
			String sql = "UPDATE demorecords SET StudentId = ?, BookId = ?, StartDate = ?, EndDate = ?, Rep = ?, Test = ?, TestTime = ?, Mistakes = ?, Notes = ? WHERE RecordId = ?";
			sql = HelloController.setTargetTable(sql);
			this.jdbcTemplate.update(sql, record.getStudentId(), book.getBookId(), record.getStartDate(), record.getEndDate(), record.getRep(), book.getTest(), record.getTestTime(), record.getMistakes(), record.getNotes(), record.getRecordId());
		}
		return 0;
	}
	
	// Removes a record from the database with an id
	@Override
	public int removeRecord(int id) {
		String sql = "DELETE FROM demorecords WHERE RecordId = ?";
		sql = HelloController.setTargetTable(sql);
		return this.jdbcTemplate.update(sql, id);
	}
	
}
