import * as express from "express";
import * as AWS from "aws-sdk";

let router = express.Router();

AWS.config.update({region: 'us-east-1'});
let sns = new AWS.SNS();

interface SendTextRequest {
    messageChoice: number;
    website: string;
    time: string;
    name: string;
    phoneNumber: string;
}

router.post('/sendtext', (req: express.Request, res: express.Response) => {

    console.log(req.body);

    if (!req.body || 
        typeof req.body.messageChoice !== "number"|| 
        !req.body.website ||
        !req.body.time ||
        !req.body.name ||
        !req.body.phoneNumber || 
        req.body.phoneNumber.length != 12) {
        res.sendStatus(400);
        return;
    }

    let sendTextRequest: SendTextRequest = req.body;

    let message = "";

    // TODO: Add message choice variations
    message = `Your friend, ${sendTextRequest.name}, has spent ${sendTextRequest.time} on ${sendTextRequest.website}... You should hit 'em up!`;

    let params: AWS.SNS.PublishInput = {
        Message: message,
        PhoneNumber: sendTextRequest.phoneNumber
    };

    sns.publish(params, (err, data) => {
        if (err) {
            console.log(err, err.stack);
        } else {
            console.log(data);
        }
    });

    res.sendStatus(200);
});

export = router;