package com.ansh.maven.HelloWorld;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {
	
	@Autowired
	private UserDao userDao;

	@Override
	public User getLogIn(String user, String pass) {
		return userDao.getLogIn(user, pass);
	}
	
	@Override
	public boolean checkIfTerminated(String user) {
		return userDao.checkIfTerminated(user);
	}

	@Override
	public int terminateAccount(String username) {
		return userDao.terminateAccount(username);
	}
}
