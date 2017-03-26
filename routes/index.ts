import * as express from "express";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";

let router = express.Router();

AWS.config.update({region: 'us-west-2'});
let sns = new AWS.SNS();
let rekognition = new AWS.Rekognition({apiVersion: '2016-06-27'});
let s3 = new AWS.S3();

interface SendTextRequest {
    messageChoice: number;
    website: string;
    time: string;
    name: string;
    phoneNumber: string;
}

function badTime(time: string): boolean {
  let splitTime: string[] = time.split(" ");
  return splitTime[0] === "0h" && splitTime[1] == "0m";
}

router.post('/sendtext', (req: express.Request, res: express.Response) => {

    console.log(req.body);

    if (!req.body ||
        typeof req.body.messageChoice !== "number"||
        !req.body.website ||
        !req.body.time ||
        badTime(req.body.time) ||
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

interface SadFaceRequest {
  name: string;
  phoneNumber: string;
  image: string;
}

router.post('/processface', (req: express.Request, res: express.Response) => {

  if (!req.body ||
      !req.body.name ||
      !req.body.phoneNumber ||
      req.body.phoneNumber.length != 12 ||
      !req.body.image) {
        console.log(req.body);
        res.sendStatus(400);
        return;
  }

  let sadFaceRequest: SadFaceRequest = req.body;

  var rekognitionParams: AWS.Rekognition.DetectFacesRequest = {
    Image: {
      Bytes: new Buffer(sadFaceRequest.image, 'base64')
    },
    Attributes: [
      'ALL'
    ]
  }
  rekognition.detectFaces(rekognitionParams, (err, data) => {
    if (err != null) {
      console.log(err);
      res.sendStatus(500);
      return;
    }

    var sendText = false;

    const confidenceThreshold: number = 75;

    for (var i = 0; i < data.FaceDetails.length; i++) {
      var face: AWS.Rekognition.FaceDetail = data.FaceDetails[i];

      var emotionTypes: string[] = face.Emotions.map((e) => e.Type);

      var checkEmotion = (emotion: string) => {
        var index = emotionTypes.indexOf(emotion);
        return index != -1 && face.Emotions[index].Confidence > confidenceThreshold;
      };

      var happy: boolean = checkEmotion("HAPPY");
      var sad: boolean = checkEmotion("SAD");
      var angry: boolean = checkEmotion("ANGRY");
      var confused: boolean = checkEmotion("CONFUSED");
      var disgusted: boolean = checkEmotion("DISGUSTED");
      var calm: boolean = checkEmotion("CALM");

      if (face.Smile.Value == false && face.Smile.Confidence > confidenceThreshold) {
        sendText = sendText || !(calm || happy);
      }

      sendText = sendText || (!happy && (sad || angry || confused || disgusted));
    }

    console.log(JSON.stringify(data.FaceDetails));

    let message = "";

    // TODO: Add message choice variations
    message = `A photo of your friend, ${sadFaceRequest.name}, we just took showed him looking unhappy... You should hit 'em up!`;

    let params: AWS.SNS.PublishInput = {
        Message: message,
        PhoneNumber: sadFaceRequest.phoneNumber
    };

    if (sendText) {
      sns.publish(params, (err, data) => {
          if (err) {
            console.log(err, err.stack);
            res.sendStatus(500);
            return;
          } else {
            console.log(data);
          }
      });
    }

    res.sendStatus(200);
  });
});

export = router;
