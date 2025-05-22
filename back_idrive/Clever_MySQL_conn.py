import mysql
import mysql.connector

#Connect to the database
mysqlConn = mysql.connector.Connect(
    host = 'localhost',
    user = 'root', 
    password = '',
    database = 'DataBaseiDrive',
    port = 3306
)

#Create a cursor object
cleverCursor = mysqlConn.cursor()