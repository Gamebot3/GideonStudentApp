package com.ansh.maven.HelloWorld;

import java.util.*;

import org.joda.time.DateTime;
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
	// Logic has been returned back to Java, because the SQL logic had significant problems with repetition
	@Override
	public List<Record> getRecordsForChart(int StudentId, String category, int months, int until, String whichReps) {
		studentDao.updateLastUsed(StudentId);
		List<Record> allRecords = recordDao.getRecordsForChart(StudentId, category, months, until, whichReps);
		List<Record> returnRecords = new ArrayList<Record>();
		
		// Pruning list to include just the time period
		DateTime dt = new DateTime().withTimeAtStartOfDay().withDayOfMonth(1);
		Date monthsDate = dt.minusMonths(months).toDate(),
		     untilDate  = dt.minusMonths(until).toDate();
		
		for(int r = 0; r < allRecords.size(); r++) {
			Record currR = allRecords.get(r);
			
			if(currR.getStartDate().compareTo(monthsDate) >= 0) {
				if (returnRecords.isEmpty() && r > 0)
					returnRecords.add(allRecords.get(r-1)); // adds one record before the timeframe, if possible
				if (currR.getStartDate().compareTo(untilDate) > 0) {
					if (!returnRecords.isEmpty())
						returnRecords.add(currR); // adds one record after the timeframe, if possible
					break;
				}
				returnRecords.add(currR);
			}
		}
		
		return returnRecords;
	}
	
	// Gets records to include in a progress chart for a given student
	@Override
	public List<Record> getAllRecordsById(int StudentId) {
		return recordDao.getAllRecordsById(StudentId);
	}
	
	// Returns records without an end date
	@Override
	public List<Record> getIncompleteRecords() {
		return recordDao.getIncompleteRecords();
	}
	
	// Gathers international goal line
	@Override
	public List<Data> getInternationalData(String category) {
		return recordDao.getInternationalData(category);
	}
	

	// NOTE: Anything that modifies data in the database will do nothing if the user is accessing the demo database: 1 will be returned

	// Updates a record in the database with an end date
	@Override
	public int updateRecord(Record record, boolean isNew) {
		if (!HelloController.isLoggedIn())
			return 1;
		
		Book book = bookDao.getBookByName(record.getCategory(), record.getSubcategory(), record.getTitle());
		return recordDao.updateRecord(record, book, isNew) + studentDao.updateLastUsed(record.getStudentId());
	}
	
	// Removes a record from the database with an id
	@Override
	public int removeRecord(int id) {
		if (!HelloController.isLoggedIn())
			return 1;
		
		return recordDao.removeRecord(id);
	}

}
