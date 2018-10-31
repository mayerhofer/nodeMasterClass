# Lesson 06: Adding HTTPS support to Service

This lesson was to show how to add HTTPS support in a NodeJS project.
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

Open browser and navigate to https://localhost:(port)

### Observations:
* Browser will warn with a unsafe certifacate error in witch issuer cannot be verified.
* This happens due the fact we are not using a publicly verified certificate.
* Other way to test is using a tool such as Postman. With it is possible to make requests to different methods than GET. It is possible to call all other HTTP method.

### What you should see with this exercise?
Access to this server is now possible using HTTPS (HTTP over SSL) protocol.
