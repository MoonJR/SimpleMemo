<%@page import="net.yeonjukko.simplememo.SimpleMemoErrorFlag"%>
<%@page import="net.yeonjukko.simplememo.SimpleMemoMysqlConnection"%>
<%@page import="java.sql.ResultSet"%>
<%@page import="java.sql.PreparedStatement"%>
<%@page import="java.sql.Connection"%>
<%@page import="javax.net.ssl.HttpsURLConnection"%>
<%@page import="org.json.simple.JSONObject"%>
<%@page import="java.io.InputStreamReader"%>
<%@page import="org.json.simple.JSONValue"%>
<%@page import="java.net.URL"%>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%
	JSONObject result;
	Connection conn = null;
	PreparedStatement state = null;

	try {
		String token = request.getParameter("token");
		String url = "https://graph.facebook.com/me?fields=email&access_token=" + token;

		HttpsURLConnection urlConn = (HttpsURLConnection) (new URL(url).openConnection());
		InputStreamReader reader = new InputStreamReader(urlConn.getInputStream());
		JSONObject facebookResult = (JSONObject) JSONValue.parse(reader);
		reader.close();
		urlConn.disconnect();

		long id = Long.parseLong(facebookResult.get("id").toString());
		String email = facebookResult.get("email").toString();
		long regDate = System.currentTimeMillis();

		conn = SimpleMemoMysqlConnection.getInstance().getConnection();
		String query = "INSERT INTO USER VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE USER_EMAIL=?";
		state = conn.prepareStatement(query);
		state.setLong(1, id);
		state.setString(2, email);
		state.setString(3, "facebook");
		state.setLong(4, regDate);
		state.setString(5, email);
		state.execute();
		session.setAttribute("user_id", id);
		result = SimpleMemoErrorFlag.FLAG_SUCCESS_JSON;
	} catch (NullPointerException e) {
		result = SimpleMemoErrorFlag.FLAG_FACEBOOK_LOGIN_FAIL_JSON;
	} catch (NumberFormatException e) {
		result = SimpleMemoErrorFlag.FLAG_FACEBOOK_LOGIN_FAIL_JSON;
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
	out.println(result.toJSONString());
%>