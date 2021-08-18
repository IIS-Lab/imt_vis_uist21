class myModel{

     constructor(num_classes=2, epochs=10){
          this.epochs = epochs
          this.sampling = true;
          // this.linearModel = this.LinearModel();
          this.dataset = {
               "inputs": tf.zeros([0, 1024]),
               "labels": tf.zeros([0], "int32")
          };
          this.num_classes = num_classes
          this.sample_count = new Array(num_classes).fill(0);
     }
     
     async bindPage(callbacks) {
          this.mobilenet = await mobilenet.load();
          // console.log(this)
          callbacks();
     }

     LinearModel(){
       const model = tf.sequential();
       // model.add(tf.layers.globalAveragePooling2d('channelsLast'));
       model.add(tf.layers.dense({units: this.num_classes, activation: "softmax", useBias: false, inputShape: [1024]}));
       model.compile({
         optimizer: "adam",
         loss: "categoricalCrossentropy",
         metrics: ["accuracy"]
       });
       console.log(model.summary())
       return model
     }
     
     add_one_class() {
          this.sample_count.push(0)
          this.num_classes += 1
     }

     add_traindata(img_tf, label) {
          // freeze all the weights before global average pooling
          var img_tf = tf.image.resizeBilinear(tf.div(img_tf, 255), [IMAGE_INPUT_SIZE, IMAGE_INPUT_SIZE], true)
          var feats = this.get_mobilenet_feat(img_tf, true)

          this.dataset["inputs"] = tf.concat([this.dataset["inputs"], feats], 0)
          // this.dataset["labels"] = tf.concat([this.dataset["labels"], tf.oneHot([label], NUM_CLASSES)], 0)
          // console.log(label);
          this.dataset["labels"] = tf.concat([this.dataset["labels"], tf.tensor(label, [1], "int32")], 0)
          this.sample_count[label] += 1;
          console.log("label:", label, "NumSample:", this.sample_count[label])
          // await new Promise(resolve => setTimeout(resolve, 1000));
          // txt.innerText = ` ${this.sample_count[label]} examples - Waiting for Training`
     }

     ready_for_training() {
          let ready = true;
          for ( let el of this.sample_count) {
               if (el == 0) {
                    ready = false;
                    break;
               }
          }
          return ready
     }

     ready_for_inference() {
          if (this.ready_for_training() && !this.sampling && !this.is_training){
               return true
          }
          else {
               return false
          }
     }


     get_mobilenet_feat(img_tf, pooling=true) {
          var mymap = this.mobilenet.model.execute(
               img_tf.expandDims(0), 
               'module_apply_default/MobilenetV1/MobilenetV1/Conv2d_13_pointwise/Relu6')
          if (pooling) {
               return mymap.mean([1, 2])
          }
          else {
               return mymap
          }
     }

     train() {
          var t0 = performance.now()
          this.linearModel = this.LinearModel();
          this.is_training = true;
          
          let labels_onehot = tf.oneHot(this.dataset["labels"], this.num_classes);
          // var inputs = this. 
          function onBatchEnd(batch, logs) {
          console.log('Accuracy', logs.acc);
          }
     
          this.linearModel.fit(this.dataset["inputs"], labels_onehot, {
          epochs: this.epochs,
          callbacks: {onBatchEnd}
          }).then(info => {
               var t1 = performance.now()
               console.log("====================")
               console.log("Training prcoess takes " + (t1 - t0) + " milliseconds.")
               console.log('Final accuracy', info.history);
               console.log("All Training Info: ", info);
               console.log("====================")
               this.is_training = false;
          })
     }

     inference(img_tf, classid=-1) {
          // var logits = this.mobilenet.infer(img_tf, 'global_average_pooling2d_1');
          var img_tf = tf.image.resizeBilinear(tf.div(img_tf, 255), [IMAGE_INPUT_SIZE, IMAGE_INPUT_SIZE], true)
          var featmaps = this.get_mobilenet_feat(img_tf, false)
          var conf = this.linearModel.predict(featmaps.mean([1, 2])).arraySync()[0];
          if (classid == -1) {
               classid = tf.argMax(conf).arraySync();
          }
          // var classid = tf.argMax(conf).arraySync();

          // var heatmap = tf.add(tf.mul(img_tf, 0.4), tf.mul(this.heatmapCAM(featmaps, classid).pad([[0, 0], [0, 0], [0, 2]]), 0.6));
          var heatmap = this.heatmapCAM(featmaps, classid);
          return {
               "conf": conf,
               "pred": classid,
               "heatmap": heatmap,
          }
          
     }

     heatmapCAM(featmaps, classid) {
          var weights = mymain.mymodel.linearModel.getWeights()[0].slice([0, classid], [-1, 1]).squeeze()
          var feat_ave = tf.mul(featmaps, weights).sum(3).squeeze()
          // var cam = tf.image.resizeBilinear(feat_ave.expandDims(2), [IMAGE_INPUT_SIZE, IMAGE_INPUT_SIZE], true)
          var cam = feat_ave.expandDims(2)
          return tf.div(cam, cam.max())
     }
     
     colormap(mymap) {
          let color_max = tf.tensor([223, 31, 25])
          let color_min = tf.tensor([27, 33, 44])

          let min_map = tf.mul(tf.ones(mymap.shape), color_min.expandDims(0).expandDims(0))
          return tf.add(min_map, tf.mul(tf.sub(color_max, color_min), mymap.clipByValue(0, 1)))
     }
   }

