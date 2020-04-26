/**
 * Create and export configuration variables
 * 
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsSecret',
    'maxChecks': 5,
    'twilio': {
        'accountSId': 'AC2bb742cbcabed443a8a1eadbd31ba07a',
        'authToken': '601fa144a4849e954f963dfed5d8076f',
        'fromPhone': '+15343443329'
    }
};
 
// Production environment
environments.production = {
    // Using 5000 on development since standard ports most likely are busy with other resources.
    'httpPort': 5000, // standard prod web app listens to 80
    'httpsPort': 5001, // standard prod web app with SSL listens to 443
    'envName': 'production',
    'hashingSecret': 'thisIsSecret',
    'maxChecks': 5,
    'twilio': {
        'accountSId': process.env.TWILIO_ACCOUNT_ID,
        'authToken': process.env.TWILIO_AUTH_TOKEN,
        'fromPhone': process.env.TWILIO_FROM_PHONE 
    }
};

// Determine witch environment was passed as command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is a implemented one, if not, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

 // Export the module
module.exports = environmentToExport;
