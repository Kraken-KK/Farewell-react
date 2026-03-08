/**
 * Appwrite Function: Send WhatsApp RSVP Confirmation via AiSensy
 * 
 * Triggers when a new document is created in the RSVP collection
 * Sends a WhatsApp template message to the user with event details
 */

// Event details for the template
const EVENT_DETAILS = {
    date: 'March 1, 2026',
    time: '6:00 PM onwards',
    venue: 'Luft, Jubilee Hills, Hyderabad'
};

module.exports = async function (context) {
    const { req, res, log, error } = context;

    // AiSensy configuration from environment variables
    const AISENSY_API_KEY = process.env.AISENSY_API_KEY;
    const TEMPLATE_NAME = process.env.TEMPLATE_NAME || 'marketing_english_19_01_2026_5844';

    log('WhatsApp RSVP Function triggered');
    log('Payload received: ' + JSON.stringify(req.body));

    // Ensure we have the API key
    if (!AISENSY_API_KEY) {
        error('AISENSY_API_KEY environment variable not set');
        return res.json({ success: false, message: 'API key not configured' });
    }

    try {
        // Parse the event - Appwrite sends the document data directly
        let document;

        if (typeof req.body === 'string') {
            document = JSON.parse(req.body);
        } else {
            document = req.body;
        }

        // Extract user details from the RSVP document
        const userName = document.fullName || document.name || 'Guest';
        const userPhone = document.phone;

        if (!userPhone) {
            log('No phone number found in document');
            return res.json({ success: false, message: 'No phone number in RSVP' });
        }

        // Format phone number - AiSensy expects format like "919876543210" (without +)
        let formattedPhone = userPhone.replace(/[^0-9]/g, '');

        // Ensure it has country code
        if (!formattedPhone.startsWith('91') && formattedPhone.length === 10) {
            formattedPhone = '91' + formattedPhone;
        }

        log(`Sending WhatsApp to: ${userName} at ${formattedPhone}`);
        log(`Using template: ${TEMPLATE_NAME}`);

        // AiSensy API v2 payload with template name
        const payload = {
            apiKey: AISENSY_API_KEY,
            campaignName: 'RSVP_Confirmation_' + Date.now(),
            destination: formattedPhone,
            userName: userName.split(' ')[0], // First name for personalization
            templateName: TEMPLATE_NAME,
            templateParams: [
                userName,                    // {{1}} - Full name
                EVENT_DETAILS.date,          // {{2}} - Event date
                EVENT_DETAILS.time,          // {{3}} - Event time
                EVENT_DETAILS.venue          // {{4}} - Venue
            ],
            source: 'Farewell-Website',
            buttons: [],
            carouselCards: [],
            location: {}
        };

        log('Sending to AiSensy: ' + JSON.stringify(payload));

        // Make API request to AiSensy
        const response = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        log('AiSensy Raw Response: ' + responseText);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            result = { raw: responseText };
        }

        if (response.ok) {
            log('WhatsApp message sent successfully!');
            return res.json({
                success: true,
                message: `WhatsApp confirmation sent to ${userName}`,
                phone: formattedPhone,
                response: result
            });
        } else {
            error('AiSensy API Error: ' + JSON.stringify(result));
            return res.json({
                success: false,
                message: 'AiSensy API returned error',
                error: result,
                statusCode: response.status
            });
        }

    } catch (err) {
        error('Function execution error: ' + err.message);
        error('Stack trace: ' + err.stack);
        return res.json({
            success: false,
            message: 'Function error: ' + err.message
        });
    }
};
