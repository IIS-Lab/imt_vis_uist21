const WIDTH = 640;
const HEIGHT = 480;
const IMAGE_INPUT_SIZE = 224;


class Main {
  constructor() {
    // Initiate variables
    this.infoTexts = [];
    this.training = -1; // -1 when no class is being trained
    this.videoPlaying = false;
    this.timenow = gettimestr();

    this.time_cost = {
      "inference": new AverageMeter(),
      "render": new AverageMeter(),
      "delay": new AverageMeter()
    }

    this.mymodel = new myModel()

    // // for demo video
    // let mycv = document.getElementById("original_video")
    // mycv.width = WIDTH; mycv.height = HEIGHT;
    // this.ctx_vid = mycv.getContext("2d")
    // this.ctx_vid_imageData = this.ctx_vid.createImageData(WIDTH, HEIGHT);
    // for (var i=0; i<this.ctx_vid_imageData.data.length; i+=4) {
    //   this.ctx_vid_imageData.data[i+3] = 255
    // }

    this.canvas = document.getElementById("heatmap")
    this.canvas.width = WIDTH
    this.canvas.height = HEIGHT
    this.ctx = this.canvas.getContext("2d")
    this.ctx_imageData = this.ctx.createImageData(WIDTH, HEIGHT);
    for (var i=0; i<this.ctx_imageData.data.length; i+=4) {
      this.ctx_imageData.data[i+3] = 255
    }
    this.mymodel.bindPage(() => this.start())

    this.video = document.getElementById("webcam")
    this.video.setAttribute('autoplay', '');
    this.video.setAttribute('playsinline', '');

    this.trainbox = new TrainBox();

    $("button#add_one_class").on("click", ()=> {
      this.mymodel.add_one_class()
    })
    

    this.btn_photo = document.getElementById("btn_photo");

    this.btn_photo.addEventListener('mousedown', () => {
      if (this.trainbox.class_id_now == null) return
      this.training = this.trainbox.class_id_now - 1;
      this.mymodel.sampling = true;
    });
    this.btn_photo.addEventListener('mouseup', () => 
    {
      this.training = -1;
      if(this.mymodel.ready_for_training()) {
        this.mymodel.train();
        console.log("Finshed training, turn on inference")
        this.test_box = new TestBox("Testing", this.trainbox.get_class_names())
        this.show_test_divs()
      } 
      this.mymodel.sampling = false;
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        this.video.srcObject = stream;
        this.video.width = WIDTH;
        this.video.height = HEIGHT;
        this.video.addEventListener('playing', () => this.videoPlaying = true);
        this.video.addEventListener('paused', () => this.videoPlaying = false);
      })
  }


  start() {
    if (this.timer) {
      this.stop();
    }
    this.video.play();
    this.timer = requestAnimationFrame(this.animate.bind(this));
  }

  stop() {
    this.video.pause();
    cancelAnimationFrame(this.timer);
  }

  start_stop() {
    if (this.video.paused) {
      console.log("start!")
      this.start()
    }
    else {
      console.log("pause!")
      this.stop()
    }
  }

  show_train_divs() {
    $(".train_funcs").show()
    $(".test_funcs").hide()
  }

  show_test_divs() {
    $(".train_funcs").hide()
    $(".test_funcs").show()
  }

  async animate() {
    if (this.videoPlaying) {
      const image = tf.browser.fromPixels(this.video);
      var t00 = performance.now();
      let logits;
      
      if (this.training != -1) {
        console.time('Add data');
        // this.mymodel.add_traindata(image, this.training, this.infoTexts[this.training]);
        this.mymodel.add_traindata(image, this.training);
        this.trainbox.add_one_sample()
        if (document.getElementById("backup").checked) {
          TensorToURLs(image).then((imgurl) => {
            uploadFrame(imgurl, {
              "dir": this.timenow,
              "classid": this.training,
              "imgid": this.mymodel.sample_count[this.training],
            });
            console.timeEnd('Add data and Upload data');
          })
        }
        else {
          sleep(150);
          console.timeEnd('Add data');
        }
      }

      if (this.mymodel.ready_for_inference()) {
        if (this.time_cost["inference"].count % 50 == 1){
          console.log("====================")
          console.log("Inference Time Cost:", this.time_cost["inference"].avg)
          console.log("Render Time Cost:", this.time_cost["render"].avg)
          console.log("Total Time Cost:", this.time_cost["delay"].avg)
          console.log("====================")
        }
        tf.engine().startScope()
        var t0 = performance.now()
        var res = this.mymodel.inference(image, this.test_box.class_id_now - 1);
        var t1 = performance.now()
        this.time_cost["inference"].update(t1-t0)
        var vis_map = tf.add(tf.mul(image, 0.7), tf.image.resizeBilinear(this.mymodel.colormap(res.heatmap), [HEIGHT, WIDTH], true), 0.3*255).clipByValue(0, 255);

        vis_map.data().then((imgarr) => {
          for (var i=0; i<imgarr.length; i += 3) {
            this.ctx_imageData.data[i/3*4+0] = imgarr[i+0]
            this.ctx_imageData.data[i/3*4+1] = imgarr[i+1]
            this.ctx_imageData.data[i/3*4+2] = imgarr[i+2]
          }
          this.ctx.putImageData(this.ctx_imageData, 0, 0);
          var t2 = performance.now()
          this.time_cost["render"].update(t2-t1)
          this.time_cost["delay"].update(t2-t00)
        })

        // image.data().then((imgarr) => {
        //   for (var i=0; i<imgarr.length; i += 3) {
        //     this.ctx_imageData.data[i/3*4+0] = imgarr[i+0]
        //     this.ctx_imageData.data[i/3*4+1] = imgarr[i+1]
        //     this.ctx_imageData.data[i/3*4+2] = imgarr[i+2]
        //   }
        //   this.ctx.putImageData(this.ctx_imageData, 0, 0);
        //   var t2 = performance.now()
        //   this.time_cost["render"].update(t2-t1)
        //   this.time_cost["delay"].update(t2-t00)
        // })

        // // show orginal image without visualization
        // image.data().then((imgarr) => {
        //   for (var i=0; i<imgarr.length; i += 3) {
        //     this.ctx_vid_imageData.data[i/3*4+0] = imgarr[i+0]
        //     this.ctx_vid_imageData.data[i/3*4+1] = imgarr[i+1]
        //     this.ctx_vid_imageData.data[i/3*4+2] = imgarr[i+2]
        //   }
        //   this.ctx_vid.putImageData(this.ctx_vid_imageData, 0, 0);
        // })


        this.test_box.update_conf(res.conf)
        res = null;
        tf.engine().endScope()
      }
      
      // console.log("dispose image")
      // Dispose image when done
      image.dispose();
      if (logits != null) {
        logits.dispose();
      }
    }
    this.timer = requestAnimationFrame(this.animate.bind(this));
  }
}


window.addEventListener('load', () => {
  mymain = new Main();

})

$("#play_pause").click(()=> {
  mymain.start_stop()
})


function sum_array(myarr) {
  function add(accumulator, a) {
    return accumulator + a;
  }
  return myarr.reduce(add, 0) 
}
