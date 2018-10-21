# Lesson 04: Parse Request Header

This lesson was to show how to parse the HTTP request header elements

### To Run
> node index.js

Open browser and navigate to http://localhost:3000/module1/temp.html?param=2&other=test

### Observations:
Other way to test is using a tool such as Postman. With it is possible to make requests to different methods than GET. It is possible to call all other HTTP method.

### What you should see with this exercise?
Upon sending an HTTP request to the service URL, it should return a "Hello World" page, this time with content. Almost all information related to the request (header elements, path, query string, http method) is displayed on the page. If "module1" is not in the base path, it will display an error page, since path was not recognized.
