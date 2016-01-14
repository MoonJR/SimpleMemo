<%@page import="java.nio.channels.FileChannel"%>
<%@page import="java.nio.channels.Channels"%>
<%@page import="java.nio.channels.WritableByteChannel"%>
<%@page import="net.yeonjukko.simplememo.SimpleMemoFilePath"%>
<%@page import="net.yeonjukko.simplememo.SimpleMemoMysqlConnection"%>
<%@page import="java.sql.ResultSet"%>
<%@page import="java.sql.PreparedStatement"%>
<%@page import="java.sql.Connection"%>
<%@page import="java.io.FileNotFoundException"%>
<%@page import="java.io.FileInputStream"%>
<%@page import="java.io.File"%>
<%@page import="java.io.OutputStream"%>
<%@page import="java.io.InputStream"%>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<%
	request.setCharacterEncoding("UTF-8");

	Connection conn = null;
	PreparedStatement state = null;
	ResultSet rs = null;

	File downFile = null;
	Long userId = null;
	try {
		long contentsId = Long.parseLong(request.getParameter("contents_id"));
		userId = (Long) session.getAttribute("user_id");

		conn = SimpleMemoMysqlConnection.getInstance().getConnection();
		String query = "SELECT CONTENTS FROM CONTENTS_DATA WHERE USER_ID=? AND CONTENTS_ID=?";
		state = conn.prepareStatement(query);
		state.setLong(1, userId);
		state.setLong(2, contentsId);
		rs = state.executeQuery();

		if (rs.next()) {
			downFile = new File(new SimpleMemoFilePath(userId).getFile(), rs.getString("CONTENTS"));
		} else {
			throw new NullPointerException();
		}

		query = "UPDATE CONTENTS SET CONTENTS_DOWNLOAD_COUNT = CONTENTS_DOWNLOAD_COUNT + 1";

	
	} catch (ClassCastException e) {
		downFile = null;
	} catch (NumberFormatException e) {
		downFile = null;
	} catch (NullPointerException e) {
		downFile = null;
	} catch (Exception e) {
		e.printStackTrace();
		downFile = null;
	} finally {
		if (rs != null) {
			rs.close();
		}
		if (state != null) {
			state.close();
		}
		if (conn != null) {
			conn.close();
		}
	}

	FileInputStream in = null;
	FileChannel inChannel = null;
	OutputStream os = null;
	WritableByteChannel outChannel = null;

	try {

		if (userId == null) {
			throw new ClassCastException();
		}

		if (downFile == null || !downFile.exists()) {
			throw new FileNotFoundException();
		}
		String contentsType = application.getMimeType(downFile.getAbsolutePath());
		// 파일 다운로드 헤더 지정
		out.clear();
		response.reset();
		if (contentsType != null) {
			response.setContentType(contentsType);
		} else {
			response.setContentType("application/octet-stream");
		}

		response.setHeader("Content-Length", "" + downFile.length());
		response.setHeader("Content-Transfer-Encoding", "binary;");
		// IE
		if (request.getHeader("User-Agent").indexOf("MSIE") != -1) {
			response.setHeader("Content-Disposition",
					"attachment; filename=" + new String(downFile.getName().getBytes("KSC5601"), "ISO8859_1"));
		} else {
			response.setHeader("Content-Disposition", "attachment; filename=\""
					+ new String(downFile.getName().getBytes("utf-8"), "iso-8859-1") + "\"");
			response.setHeader("Content-Type", "application/octet-stream; charset=utf-8");
		}

		in = new FileInputStream(downFile);
		os = response.getOutputStream();
		outChannel = Channels.newChannel(os);
		inChannel = in.getChannel();
		inChannel.transferTo(0, inChannel.size(), outChannel);

	} catch (ClassCastException e) {
		response.setContentType("text/html;charset=UTF-8");
		out.println("<script language='javascript'>alert('로그인 후 이용해 주세요.');history.back();</script>");
	} catch (FileNotFoundException e) {
		response.setContentType("text/html;charset=UTF-8");
		out.println("<script language='javascript'>alert('파일을 찾을 수 없습니다');history.back();</script>");
	} catch (Exception e) {
		response.setContentType("text/html;charset=UTF-8");
		out.println("<script language='javascript'>alert('파일을 찾을 수 없습니다');history.back();</script>");
	} finally {
		if (inChannel != null) {
			inChannel.close();
		}
		if (outChannel != null) {
			outChannel.close();
		}
		if (in != null) {
			in.close();
		}
		if (os != null) {
			os.close();
		}
	}
%>