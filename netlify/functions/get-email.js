const axios = require('axios');

exports.handler = async function(event, context) {
  const { ITERABLE_API_KEY } = process.env;
  const { email, messageId } = event.queryStringParameters;

  if (!email || !messageId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Email and Message ID are required.' })
    };
  }

  try {
    const response = await axios.get('https://api.iterable.com/api/email/viewInBrowser', {
      params: { email, messageId },
      headers: { 'Api-Key': ITERABLE_API_KEY }
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: response.data
    };

  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const message = error.response ? error.response.data.msg : "An internal server error occurred.";
    return {
      statusCode: status,
      body: JSON.stringify({ error: message })
    };
  }
};
