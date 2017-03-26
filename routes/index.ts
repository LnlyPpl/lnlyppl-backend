import * as express from "express";
import * as AWS from "aws-sdk";
import * as uuid from "uuid";

let router = express.Router();

AWS.config.update({region: 'us-east-1'});
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

router.post('/processface', (req: express.Request, res: express.Response) => {
  var imageKey: string = uuid.v4();

  var s3Params: AWS.S3.PutObjectRequest = {
    Bucket: "lnlypplphotos",
    Key: imageKey,
    Body: req.body.image
  }

  s3.upload(s3Params, (err, data) => {
    if (err != null) {
      res.sendStatus(500);
      console.log(err);
      return;
    }
  })

  var rekognitionParams: AWS.Rekognition.DetectFacesRequest = {
    Image: {
      S3Object: {
        Bucket: 'lnlypplphotos',
        Name: imageKey
      }
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

    const confidenceThreshold: number = 0.75;

    for (var i = 0; i < data.FaceDetails.length; i++) {
      var face: AWS.Rekognition.FaceDetail = data.FaceDetails[i];

      var emotionTypes: string[] = face.Emotions.map((e) => e.Type);

      var checkEmotion = (emotion: string) => {
        var index = emotionTypes.indexOf(emotion);
        return index == -1 || face.Emotions[index].Confidence > confidenceThreshold;
      };

      var sad: boolean = checkEmotion("SAD");
      var angry: boolean = checkEmotion("ANGRY");
      var confused: boolean = checkEmotion("CONFUSED");
      var disgusted: boolean = checkEmotion("DISGUSTED");
      var calm: boolean = checkEmotion("CALM");

      if (face.Smile.Value == false && face.Smile.Confidence > confidenceThreshold) {
        if (!calm) {
          sendText = true;
        }
      }

      sendText = sendText || sad || angry || confused || disgusted;
    }

    res.sendStatus(200);
  });
});

export = router;
