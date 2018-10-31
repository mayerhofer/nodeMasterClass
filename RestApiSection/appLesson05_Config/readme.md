# Lesson 05: Adding Configuration file to Service

This lesson was to show how to setup a configuration file.
To test it, run with different environment setups as described in the [To Run](#To-Run) section.

### To Run
> node index.js
> NODE_ENV=staging node index.js
> NODE_ENV=production node index.js
> NODE_ENV=foo node index.js

Open browser and navigate to http://localhost:(port)

### Observations:
Other way to test is using a tool such as Postman. With it is possible to make requests to different methods than GET. It is possible to call all other HTTP method.

### What you should see with this exercise?
Upon start, we should start being able to choose in witch environment we should run and verify the server uses correct configuration for the selected environment.
