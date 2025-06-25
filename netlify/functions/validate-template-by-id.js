const axios = require('axios');

// This helper function remains the same
function formatErrorMessage(iterableErrorMsg) {
    let friendlyHint = "";
    if (iterableErrorMsg.includes("Unclosed")) {
        friendlyHint = "<span class='hint'>Hint: This often means a `{{#if ...}}`, `{{#each ...}}`, or other block helper is missing its closing tag like `{{/if}}` or `{{/each}}`. Check your code for matching pairs.</span>";
    } else if (iterableErrorMsg.includes("is not a valid property")) {
        friendlyHint = "<span class='hint'>Hint: This usually means a variable in your template (like `{{user.firstName}}`) doesn't exist in the data, or you made a typo. Double-check your variable names.</span>";
    }
    const formattedError = `<code>${iterableErrorMsg}</code>`;
    return `${formattedError}<br><br>${friendlyHint}`;
}

exports.handler = async function(event, context) {
    const { ITERABLE_API_KEY } = process.env;
    const providedId = event.queryStringParameters.id;

    if (!providedId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Template ID is required.' }) };
    }

    let htmlContent;
    let templateName;
    try {
        // STEP 1: Fetch the master list of ALL templates
        const allTemplatesResponse = await axios.get('https://api.iterable.com/api/templates', {
            headers: { 'Api-Key': ITERABLE_API_KEY }
        });

        const allTemplates = allTemplatesResponse.data.templates;
        
        // STEP 2: Find the specific template from the master list by its ID.
        // We use '==' because the providedId is a string and the template.templateId is a number.
        const foundTemplate = allTemplates.find(template => template.templateId == providedId);

        if (!foundTemplate) {
            throw new Error(`Template with ID '${providedId}' could not be found in the project's master list.`);
        }
        
        // Optional: Check if it's an email template before proceeding
        if (foundTemplate.channelName !== 'Email') {
             throw new Error(`Template ID '${providedId}' was found, but it is a '${foundTemplate.channelName}' template, not an Email template.`);
        }

        htmlContent = foundTemplate.html;
        templateName = foundTemplate.name;

    } catch (error) {
        // This catch block now handles errors from fetching or finding the template
        return { statusCode: 404, body: JSON.stringify({ error: error.message }) };
    }

    // STEP 3: Use the fetched HTML to perform the validation via upsert
    const clientTemplateId = "api-validator-temp-template-for-upsert";
    const payload = {
        name: "API-Template-Validator",
        fromName: "Validator",
        fromEmail: "validator@example.com",
        subject: "Validation Test",
        html: htmlContent,
        clientTemplateId: clientTemplateId
    };

    try {
        await axios.post('https://api.iterable.com/api/templates/email/upsert', payload, {
            headers: { 'Api-Key': ITERABLE_API_KEY, 'Content-Type': 'application/json' }
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `✅ Success! The content of template "${templateName}" (ID: ${providedId}) is valid.` })
        };
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data.msg : "An internal server error occurred.";
        const formattedMessage = formatErrorMessage(message);
        return {
            statusCode: status,
            body: JSON.stringify({ error: formattedMessage })
        };
    }
};
