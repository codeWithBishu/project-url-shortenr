const Url=require("../models/urlModel")
var validUrl = require('valid-url')
const shortid = require('shortid')
const mongoose = require('mongoose')

const redis = require("redis");


const  { promisify }  = require("util");

/*...............+++++++++++++-------------Connect to redis------------+++++++++++++................*/

const redisClient = redis.createClient(
    15299,
  "redis-15299.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("v12G8BVygfk4R1rXA1j4DIlF1W5rXVGZ", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});


/*........++++++++++++------------------+++++++++++++.........*/



const body = (ele) => {
    if (Object.keys(ele).length) return;
    return `Please send some valid data in request body`;
  };
  
  const check = (ele) => {
    if (ele == undefined) {
      return `is missing`;
    }
    if (typeof ele !== "string") {
      return `should must be a string`;
    }
    ele = ele.trim();
    if (!ele.length) {
      return `can not be empty`;
    }

  };

  const isValid = function (value) {
     let reg = /^(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*$)/gmi
     return reg.test(value)
 }

const baseUrl = 'http://localhost:3000'

const urlShorten= async (req, res) => {
    let message;

    let requestbody=req.body
    if((message = body(requestbody))) {return res.status(400).send({status:false, messege:`${message}`})}

    let {longUrl} = requestbody
    longUrl = longUrl.trim()


    if((message = check(longUrl))) {return res.status(400).send({status:false, message:`longUrl ${message}`})}

    if(!isValid(longUrl)) {return res.status(400).send({status:false, message:"Entered longUrl is invalid "})}

    

    if (!validUrl.isUri(baseUrl)) {
        
        return res.status(400).send({status:false, message:'Invalid base URL'})
    }
    
    const urlCode = shortid.generate().toLowerCase()

    if (validUrl.isUri(longUrl)) {
        
        try {

            let url = await Url.findOne({ longUrl }).select({__v:0,createdAt:0,updatedAt:0,_id:0})

            if (url) 
            { 
                res.status(200).send({status:true, message:"This url is already shorten", data:url}) 
            } else {
                const shortUrl = baseUrl + '/' + urlCode

                url = new Url({
                    longUrl,
                    shortUrl,
                    urlCode
                })
                await url.save()
                res.status(201).send({status:true, data:{longUrl:url.longUrl,shortUrl:url.shortUrl,urlCode:url.urlCode}})
            }
        }
        
        catch (err) {
            console.log(err)
            res.status(500).send({status:false, message:'Server Error'})
        }

    } else {
        res.status(400).send({status:false, message:'Invalid longUrl'})
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////




const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);

const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const getUrl =  async (req, res) => {
    try {

        let cacheUrlData = await GET_ASYNC(`${req.params.urlCode}`)
        let parsedData = JSON.parse(cacheUrlData)
        if(cacheUrlData){
            return res.status(302).redirect(parsedData)
        }else{

        const url = await Url.findOne({urlCode: req.params.urlCode})
        if (url) {
            await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(url.longUrl),"Ex",100)
            return res.status(302).redirect(url.longUrl)
        } else {
            return res.status(404).send({status:false,message:'No URL Found'})
        }
    }

    }
    catch (err) {
        console.error(err)
        res.status(500).send({status:false,message:'Server Error'})
    }
}


module.exports.urlShorten = urlShorten

module.exports.getUrl = getUrl




