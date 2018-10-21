# Lesson 03: Parse method and query string

This lesson was to show how to parse from the HTTP request the method and query string.

### To Run
> node index.js
> curl "http://localhost:3000/foo/bar/?version=3&param=teste"

### Observations:
Other way to test is using a tool such as Postman. With it is possible to make requests to different methods than GET. It is possible to call all other HTTP method.

### What you should see with this exercise?
Upon sending an HTTP request to the service URL, it should return a "Hello World" page. In terminal/server console, should be logged the parsed path, the method requested and the parameters in the query string.
