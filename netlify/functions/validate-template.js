const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { ITERABLE_API_KEY } = process.env;
  const { html } = JSON.parse(event.body);

  if (!html) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'HTML content is required.' })
    };
  }

  const clientTemplateId = "api-validator-temp-template-for-upsert";

  const payload = {
    name: "API-Template-Validator",
    fromName: "Validator",
    fromEmail: "validator@example.com",
    subject: "Validation Test",
    html: html,
    clientTemplateId: clientTemplateId
  };

  try {
    await axios.post('https://api.iterable.com/api/templates/email/upsert', payload, {
      headers: {
        'Api-Key': ITERABLE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success! Template HTML and Handlebars syntax are valid.' })
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
