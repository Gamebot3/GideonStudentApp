package com.ansh.maven.HelloWorld;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.joda.time.DateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class RecordServiceImpl implements RecordService{

	@Autowired
	RecordDao recordDao;
	
	@Autowired
	JdbcTemplate template;
	
	//Returns all records
	@Override
	public List<Record> getAllRecords() {
		// TODO Auto-generated method stub
		return recordDao.getAllRecords();
	}
	
	//Gets all records for a certain student, including time and repetition constraints (NOTE: includes one record preceeding the specified timeframe, used for graphing)
	@Override
	public List<Record> getRecordsById(int RecordId, String category, int months, String whichReps, int until) {
		// TODO Auto-generated method stub
		List<Record> records = recordDao.getRecordsById(RecordId, category, whichReps);
		List<Record> returnRecords = new ArrayList<Record>();
		
		DateTime dt = new DateTime().withTimeAtStartOfDay().withDayOfMonth(1);
		Date monthsAgo = dt.minusMonths(months).toDate();
		Date untilDate = dt.minusMonths(until - 1).toDate(); // subtracting 1 from until in order to display the entire most recent month, rather than just the beginning of it
		System.out.println(monthsAgo.toString() + " , " + untilDate.toString());
		
		boolean firstRecordFlag = true;
		for(int r = 0; r < records.size(); r++) {
			Record currentRecord = records.get(r);
			if(currentRecord.getStartDate().compareTo(monthsAgo) > 0) {
				if (firstRecordFlag && r > 0) {
					returnRecords.add(records.get(r-1));
				}
				returnRecords.add(currentRecord);
				firstRecordFlag = false;
				
				if (currentRecord.getStartDate().compareTo(untilDate) > 0) {
					break;
				}
			}
		}
		
		return returnRecords;
	}
	
	@Override
	public List<Record> getIncompleteRecords() {
		//TODO Auto-generated method stub
		return recordDao.getIncompleteRecords();
	}

	@Override
	public int addRecord(String id, String category, String subcategory, String title, Date startDate, int rep) {
		// TODO Auto-generated method stub
		return recordDao.addRecord(id, category, subcategory, title, startDate, rep);
	}

	@Override
	public int updateRecord(String recordId, Date endDate, int testTime, int minutes) {
		// TODO Auto-generated method stub
		return recordDao.updateRecord(recordId, endDate, testTime, minutes);
	}

	@Override
	public List<Record> getAllRecordsById(int StudentId, String category) {
		// TODO Auto-generated method stub
		return recordDao.getAllRecordsById(StudentId, category);
	}

}