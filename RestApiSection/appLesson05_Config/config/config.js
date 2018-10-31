/**
 * Create and export configuration variables
 * 
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
    'port': 3000,
    'envName': 'staging'
}

// Production environment
environments.production = {
    'port': 5000,
    'envName': 'production'
}

// Determine witch environment was passed as command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is a implemented one, if not, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

 // Export the module
module.exports = environmentToExport;
