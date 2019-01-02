# Lesson 09: Storing data - user objects

This lesson was to show how to store JSON objects using file storage.
To test it, you may run with different environment setups as described in the [To Run](#To-Run) section.

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
https://localhost:3000/ {any other path} : Should return a default "Not Found" (404) page.

### Observations:
* Browser will warn with a unsafe certifacate error in witch issuer cannot be verified.
* This happens due the fact we are not using a publicly verified certificate.
* One way to test is using a tool such as Postman. With it is possible to make requests to different methods than GET. It is possible to call all other HTTP method.

### What you should see with this exercise?
Access to this server is now possible using HTTPS (HTTP over SSL) protocol.
