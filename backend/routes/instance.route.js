const express = require('express');
const app = express();
const instanceRoute = express.Router();
var docker = require('../engine/docker');
let mongoose = require('mongoose');
// Instance model
let Instance = require('../models/Instance');
let Flow = require('../models/Flow');
let Flowviz = require('../models/Flowviz');
const auth = require("../middleware/auth");
instanceRoute.use(auth)
// Add Instance
instanceRoute.route('/create').post((req, res, next) => {
  Instance.create(req.body, (error, data) => {
    if (error) {
      res.status(400).json(error)
      return next(error)
    } else {
      res.json(data)
    }
  })
});

// Get All Instances
instanceRoute.route('/').get((req, res,next) => {
  Instance.find().populate({
    path: 'block',
    model: 'Block' 
    }).exec(function(error, data){
    if (error) {
      return next(error)
    } else {
      Flow.find((error,flows)=>{
        Flowviz.find((error,flows_viz)=>{
          res.json(data.map(instance=>
            ({...instance.toJSON(),flow_count: flows.filter(flow=>
              flow.steps.flat().map(step=>step.id).includes(instance._id.toString())
            ).length,flowviz_count: flows_viz.filter(flow=>
              flow.nodes.map(node=>node.data.name).includes(instance.name)
            ).length})
          ))
        })
      })
    }
  })
})

// Get All Instances
instanceRoute.route('/block/read/:id').get((req, res,next) => {
  Instance.find({ block: req.params.id }).sort({_id: -1}).exec(function(error,data)
  { 
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }    
  });
})


// Get single instance
instanceRoute.route('/read/:id').get((req, res,next) => {
  Instance.findById(req.params.id, (error, data) => {
    if (error) {
      return next(error)
    } else {
      res.json(data)
    }
  })
})

// Update instance
instanceRoute.route('/update/:id').put((req, res, next) => {
  Instance.findByIdAndUpdate(req.params.id, {
    $set: req.body
  }, (error, data) => {
    if (error) {
      res.error(error)
      return next(error);
    } else {
      res.json(data)
      console.log('Data updated successfully')
    }
  })
})

// Delete instance
instanceRoute.route('/delete/:id').delete((req, res, next) => {

 Instance.findById(req.params.id).exec().then(inst=>{
  Flow.find().exec(async function(error,flows){
    Flowviz.find().exec(async function(error,flows_viz){
      const flowLength = flows.filter(flow=>
        flow.steps.flat().map(step=>step.id).includes(req.params.id.toString())
      ).length
      const flowvizLength = flows_viz.filter(flow=>
        flow.nodes.map(node=>node.data.name).includes(inst.name)
      ).length
    if (error) {
      return next(error);
    } else {
      console.log(flowLength,flowvizLength)
      if (flowLength == 0 && flowvizLength == 0){
        Instance.findByIdAndRemove(req.params.id, (error, data) => {
          console.log("Removing: " + req.params.id)
          if (error) {
            res.status(500).json({
              msg: error
            })
            return next(error);
          } else {
            res.status(200).json({
              msg: data
            })
          }
        })
      }
      else
      {
        res.status(406).json({
          msg: "Instance Has Flow Attached"
        })
      }
    }
    });
  });
 })



})

instanceRoute.route('/run').post((req, res) => {
  
  Instance.findById(req.body.id).populate({
    path: 'block',
    model: 'Block' 
    }).exec(function(error, data){
      if (error) {
        return next(error)
      } else {
        
        // childProcess.exec('ls -l', { shell: '/bin/bash' }, 
        // (error, stdout, stderr) => {
        //   res.json({ error, stdout, stderr });
        //   process.exit();
        // });
        const custom_id = new mongoose.Types.ObjectId().toHexString()
        docker.run(data,custom_id)
        res.json(custom_id)
      }
  });
})

module.exports = instanceRoute;