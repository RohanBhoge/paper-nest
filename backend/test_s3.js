const https = require('https');

const url = "https://papernest-logo.s3.ap-south-1.amazonaws.com/Questions_Image_Data/CET/11/Physics/2.%20Mathematical%20Methods/1_qu_1.png";

https.get(url, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.log(`BODY: ${body.substring(0, 500)}`);
        } else {
            console.log('Success, image data received.');
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
