package com.ansh.maven.HelloWorld;

import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RecordServiceImpl implements RecordService{

	@Autowired
	RecordDao recordDao;
	
	@Autowired
	BookDao bookDao;
	
	@Autowired
	StudentDao studentDao;
	
	//Returns all records
	@Override
	public List<Record> getAllRecords() {
		return recordDao.getAllRecords();
	}
	
	// Returns records for a student within a certain range, plus or minus one record, with a specific category and rep count
	@Override
	public List<Record> getRecordsForChart(int StudentId, String category, int months, int until, String whichReps) {
		studentDao.updateLastUsed(StudentId, false);
		return recordDao.getRecordsForChart(StudentId, category, months, until, whichReps);
	}
	
	// Gets records to include in a progress chart for a given student
	@Override
	public List<Record> getAllRecordsById(int StudentId, String category) {
		return recordDao.getAllRecordsById(StudentId, category);
	}
	
	// Returns records without an end date
	@Override
	public List<Record> getIncompleteRecords() {
		return recordDao.getIncompleteRecords();
	}

	// Adds a record to the database
	@Override
	public int addRecord(int studentId, String category, String subcategory, String title, Date startDate, int rep) {
		Book book = bookDao.getBookByName(category, subcategory, title);
		return recordDao.addRecord(studentId, book, startDate, rep) + studentDao.updateLastUsed(studentId, false);
	}

	// Updates a record in the database with an end date
	@Override
	public int updateRecord(int recordId, Date endDate, int testTime, int minutes) {
		return recordDao.updateRecord(recordId, endDate, testTime, minutes) + studentDao.updateLastUsed(recordId, true);
	}
	
	
	
	// Gathers international goal line
	@Override
	public List<Data> getInternationalData(String category) {
		return recordDao.getInternationalData(category);
	}

}
