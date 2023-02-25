//for a connection with discord
const { Client, GatewayIntentBits, messageLink, EmbedBuilder, MessageAttachment  } = require("discord.js");
const dotenv = require("dotenv");
const schedule = require('node-schedule');
let dailyUpdaters = [];
let shoutoutRule = new schedule.RecurrenceRule()
shoutoutRule.tz = 'Asia/Kolkata'
shoutoutRule.hour = 23;
shoutoutRule.minute = 58;
shoutoutRule.second = 0;
const mongoose = require('mongoose');
const Updaters = require('../models/updaters-schema')
// const getUserFromMention = require('../functions/getUserId')
// const axios = require("axios"); 
dotenv.config();
const keepAlive = require('./serverWake')
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]});





// const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

//bot redy test
client.on("ready", () => {
  let uri = 'mongodb+srv://elonTuskBot:'+process.env.MONGO_PASS+'@cluster0.ak5numc.mongodb.net/?retryWrites=true&w=majority'
  mongoose.connect(uri, {
    keepAlive:true
  })

  console.log("Bot is ready!");

  schedule.scheduleJob('*/7 * * * * *', async() => {


 
    dailyUpdaters =  [... new Set(dailyUpdaters)]

    if(dailyUpdaters.length > 0){
      client.channels.cache.get('1035584676238209055').send({ 

      embeds: [
        new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle("Today's Updaters")
            .setDescription(`${dailyUpdaters}`)
            .setAuthor({ name: 'Baburao', iconURL: 'https://pbs.twimg.com/profile_images/1251244594966040576/v-b1F6AM_400x400.jpg' })
            .setThumbnail('https://www.mirchiplay.com/wp-content/uploads/2020/06/akshay-kumar-scheme-pose.jpg')
     ]  
      });   

    } else {
      client.channels.cache.get('1035584676238209055').send({
        content: `No commits today :(`
      });
    }

    //emptying the database
    // mongoose.connection.db.dropCollection('updaters');
    dailyUpdaters = [];
  })
});

client.on('messageCreate', async (msg)=>{
  try{
    
    if(msg.author.bot) return //bot dont get in loop

    let cmtLnk = /https:\/\/github\.com\/.*\/.*\/commit\/[0-9a-f]{40}/;
  
    if(msg.content.match(cmtLnk) !== null){
      
      msg.react('🔥');
      const thread = await msg.startThread({
        name: `${msg.author.username}'s AppreciationThread`,
        // autoArchiveDuration: 60, 
      });

      const threadId = thread.id;
      const webhooks = await msg.channel.fetchWebhooks('1050650744635785266', 'HvHCwilgtWUDi0Fy5jiXmWq1nE0FVvGRxZ6tWdYClxweFPLQRwAG0RkHif3W3hisTRsq');
      const webhook = webhooks.first();

      await webhook.send({
        content: 'Damnn, You Work too hard !!',
        threadId: threadId,
        files: ['https://i.pinimg.com/564x/7f/52/fb/7f52fb4660263684b4ffd130620736d2.jpg'],
      });

        // await new Updaters({
        //   uid: msg.author.id,
        //   name: msg.author.username,

        // }).save()
      await Updaters.findOneAndUpdate(
        {uid: msg.author.id},
        {
          streakCount: {
                  $cond: {
                        if: {done: {$eq: true}},
                        then: {$inc: {count: 1}},
                        else: {$set: {count: 0}}
                        }
                      },
          $inc: {noOfCommits: 1}
        }
      ),  (err,docs) => {
        if(docs.length){
          console.log("Already Exists")
          console.log(docs)
        } else {
          console.log(err)
          console.log("here")
           new Updaters({
            uid: msg.author.id,
            name: msg.author.username,
            streakCount: {
              count: 1,
              done: true,
            },
            noOfCommits: 1
          }).save()
        }
      }
      //scheduled archive

      
    }

      (await Updaters.find()).forEach((dailyUpdater)=>{
        dailyUpdaters.push('<@!' + dailyUpdater.uid + '>');
      })
      

    

      //Deleting the appreciation threads
      schedule.scheduleJob(shoutoutRule, async () => {
        thread.setArchived(true);
      });

  } catch(err) {
    console.log(err) 
  }
})

keepAlive()
client.login(process.env.TOKEN);
