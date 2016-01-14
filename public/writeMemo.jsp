<%@page import="javax.sql.PooledConnection"%>
<%@page import="java.sql.SQLException"%>
<%@page import="org.json.simple.JSONObject"%>
<%@page import="net.yeonjukko.simplememo.SimpleMemoErrorFlag"%>
<%@page import="net.yeonjukko.simplememo.SimpleMemoMysqlConnection"%>
<%@page import="java.sql.PreparedStatement"%>
<%@page import="java.sql.Connection"%>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%
	Connection conn = null;
	PreparedStatement state = null;

	JSONObject result;

	try {
		Long id = (Long) session.getAttribute("user_id");
		long regDate = System.currentTimeMillis();
		String contents = request.getParameter("contents");
		conn = SimpleMemoMysqlConnection.getInstance().getConnection();
		String query = "INSERT INTO CONTENTS_DATA VALUES(?,?,?,?,?)";
		state = conn.prepareStatement(query);
		state.setLong(1, id);
		state.setLong(2, regDate);
		state.setString(3, contents);
		state.setInt(4, SimpleMemoErrorFlag.FLAG_CONTENTS_TYPE_STRING);
		state.setInt(5, 0);
		state.execute();

		result = SimpleMemoErrorFlag.FLAG_SUCCESS_JSON;
	} catch (NullPointerException e) {
		result = SimpleMemoErrorFlag.FLAG_SESSION_FAIL_JSON;
	} catch (ClassCastException e) {
		result = SimpleMemoErrorFlag.FLAG_SESSION_FAIL_JSON;
	} catch (Exception e) {
		e.printStackTrace();
		result = SimpleMemoErrorFlag.FLAG_ERROR_JSON;
	} finally {
		if (state != null) {
			state.close();
		}
		if (conn != null) {
			conn.close();
		}
	}

	out.print(result.toJSONString());
%>