const fetch = require('node-fetch');
console.log('Starting Foundry VTT Package Release Process...');
async function releaseFoundryPackage() {
    const apiToken = process.env.FOUNDRY_API_TOKEN;
    const packageId = process.env.PACKAGE_ID;
    const packageVersion = process.env.PACKAGE_VERSION;
    const manifestUrl = process.env.MANIFEST_URL;
    const releaseNotesUrl = process.env.RELEASE_NOTES_URL;
    const foundryMinVersion = process.env.FOUNDRY_MIN_VERSION;
    const foundryVerifiedVersion = process.env.FOUNDRY_VERIFIED_VERSION;
    const foundryMaxVersion = process.env.FOUNDRY_MAX_VERSION;
    console.log(`Releasing package: ${packageId}, version: ${packageVersion}`);
    const body = {
        id: packageId,
        release: {
            version: packageVersion,
            manifest: manifestUrl,
            notes: releaseNotesUrl,
            compatibility: {
                minimum: foundryMinVersion,
                verified: foundryVerifiedVersion,
                maximum: foundryMaxVersion
            }
        }
    };

    console.log(`Request body: ${JSON.stringify(body, null, 2)}`);

    try {
        console.log('Sending request to Foundry VTT API...');
        const response = await fetch('https://api.foundryvtt.com/_api/packages/release_version', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${apiToken}`
            },
            body: JSON.stringify(body)
        });

        // Log the raw response and status code
        const responseText = await response.text();
        console.log(`Response Status Code: ${response.status}`);
        console.log(`Raw Response Text: ${responseText}`);

        // Try parsing the response text as JSON
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            throw new Error(`Invalid JSON response: ${parseError.message}`);
        }

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${JSON.stringify(responseData)}`);
        }

        console.log('Foundry VTT Package Released Successfully:', responseData);
    } catch (error) {
        console.error('Failed to release Foundry VTT package:', error);
    }
}

releaseFoundryPackage();