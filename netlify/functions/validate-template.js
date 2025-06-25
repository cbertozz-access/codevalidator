const axios = require('axios');

// A helper function to make error messages more user-friendly
function formatErrorMessage(iterableErrorMsg) {
    let friendlyHint = "";
    if (iterableErrorMsg.includes("Unclosed")) {
        friendlyHint = "<span class='hint'>Hint: This often means a `{{#if ...}}`, `{{#each ...}}`, or other block helper is missing its closing tag like `{{/if}}` or `{{/each}}`. Check your code for matching pairs.</span>";
    } else if (iterableErrorMsg.includes("is not a valid property")) {
        friendlyHint = "<span class='hint'>Hint: This usually means a variable in your template (like `{{user.firstName}}`) doesn't exist in the data, or you made a typo. Double-check your variable names.</span>";
    }
    // The original error message from Iterable, wrapped for formatting
    const formattedError = `<code>${iterableErrorMsg}</code>`;
    return `${formattedError}<br><br>${friendlyHint}`;
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { ITERABLE_API_KEY } = process.env;
  const { html } = JSON.parse(event.body);

  if (!html) {
    return { statusCode: 400, body: JSON.stringify({ error: 'HTML content is required.' }) };
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
      headers: { 'Api-Key': ITERABLE_API_KEY, 'Content-Type': 'application/json' }
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success! Template HTML and Handlebars syntax are valid.' })
    };
  } catch (error) {
    const status = error.response ? error.response.status : 500;
    const message = error.response ? error.response.data.msg : "An internal server error occurred.";
    const formattedMessage = formatErrorMessage(message); // Format the error here
    return {
      statusCode: status,
      body: JSON.stringify({ error: formattedMessage })
    };
  }
};
