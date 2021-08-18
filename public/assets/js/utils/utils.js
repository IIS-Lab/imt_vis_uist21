// const { transformFile } = require("babel-core");

transpose = m => m[0].map((x,i) => m.map(x => x[i]))

function sleep(milliseconds) {
     const date = Date.now();
     let currentDate = null;
     do {
          currentDate = Date.now();
     } while (currentDate - date < milliseconds);
}


function gettimestr() {
     var date = new Date()
     var datevalues = [
          date.getFullYear(),
          date.getMonth()+1,
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
          date.getSeconds(),
     ];
     return datevalues.join('_')
}

async function videoFrameToArrayBuffer(video) {
     const cv=document.createElement("canvas");
     cv.width=video.width;
     cv.height=video.height;
     const ctx=cv.getContext("2d");
     ctx.drawImage(video,0,0);


     const blob=await new Promise(res=>{
          cv.toBlob(blob=>res(blob),'image/png');
     });
     // return await blob.arrayBuffer();
     return blob
}


async function TensorToURLs(mytensor) {
     const cv=document.createElement("canvas");
     cv.width=mytensor.shape[1];
     cv.height=mytensor.shape[0];

     // const ctx=cv.getContext("2d");
     // ctx.drawImage(myframe,0,0);
     await tf.browser.toPixels(mytensor, cv)
     return cv.toDataURL();
}


function VideoFrameToURLs(myframe) {
     const cv=document.createElement("canvas");
     cv.width=myframe.width;
     cv.height=myframe.height;
     const ctx=cv.getContext("2d");
     ctx.drawImage(myframe,0,0);
     return cv.toDataURL();
}


class AverageMeter {
     constructor() {
          this.reset()
     }

     reset() {
          this.val = 0
          this.avg = 0
          this.sum = 0
          this.count = 0
     }

     update(val, n=1) {
          this.val = val
          this.sum += val * n
          this.count += n
          this.avg = this.sum / this.count
     }

}