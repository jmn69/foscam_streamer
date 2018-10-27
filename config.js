const Joi = require('joi');

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  PORT: Joi.number().default(9990),
  STREAM_URL: Joi.string()
    .required()
    .description('rstp stream url'),
  NAME: Joi.string()
    .required()
    .description('websocket stream name'),
})
  .unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  port: envVars.PORT,
  streamUrl: envVars.STREAM_URL,
  name: envVars.Name,
};

module.exports = config;
