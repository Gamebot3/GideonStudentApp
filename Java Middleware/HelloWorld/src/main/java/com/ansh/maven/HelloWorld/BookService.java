package com.ansh.maven.HelloWorld;

import java.util.*;


public interface BookService {

	List<Book> getAllBooks();
	Book getBookById(int book_id);
	List<String> getCategories();
	List<String> getSubcategories(String category);
	List<String> getTitles(String subcategory);
	List<Book> getBooksInRange(String category, int startSequence, int endSequence);
}
