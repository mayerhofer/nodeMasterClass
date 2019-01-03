# Lesson 10: Managing session tokens

This lesson was to learn how to create and manage session tokens in a NodeJS project.
To test it, run with different environment setups as described in the [To Run](#To-Run) section.

### Requirements
1. NodeJS - [Official WebSite](https://nodejs.org/en/)
2. OpenSSL - [Official WebSite](https://www.openssl.org/)
3. Terminal of choice

### To generate HTTPS certificate
Run the openssl below command in the https folder. Details about openssl tool can be found [here](https://www.openssl.org/).
> mkdir https
> cd https
> openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out
cert.pem
> cd ..

### To Run
> node index.js
> NODE_ENV=staging node index.js
> NODE_ENV=production node index.js

Open browser and navigate to:
https://localhost:3000/sample : A GET to this URL should return a response object with name "https://localhost:3000/hello" and error status 406.
https://localhost:3000/hello : Should return a page with a Hello World message.
https://localhost:3000/users : (using Postman or similar)
 - A GET with "phone" URL parameter should return a JSON with the user data or 404 if not found any with given phone number.
 - A POST should save a new user if there is not already one with the same specified phone number.
 - A PUT with "phone" URL parameter should update the user data of the user with the specified phone number.
 - A DELETE with "phone" URL paramenter should delete the user with the specified phone number.
https://localhost:3000/tokens : (using Postman or similar)
 - A POST with "phone" and "password" as object parameter should return 200 OK and store a token object.
 - A GET with "id" of the token as URL parameters should return the token object.
 - A PUT with "id" of the token and "extend" URL parameters should update the token with an extended expiration time.
 - A DELETE with "id" of the token as URL paramenter should delete the user with the specified phone number.
https://localhost:3000/ {any other path} : Should return a default "Not Found" (404) page.

### Observations:
* Browser will warn with a unsafe certifacate error in witch issuer cannot be verified.
* This happens due the fact we are not using a publicly verified certificate.
* Other way to test is using a tool such as Postman. With it is possible to make requests to different methods than GET. It is possible to call all other HTTP method.
* **Users can only access their information with a valid token!**

### What you should see with this exercise?
Access to this server is now possible using HTTPS (HTTP over SSL) protocol.
