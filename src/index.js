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

  schedule.scheduleJob(shoutoutRule, async() => {

    // console.log('ran cron job')
    // Send a dail-updaters shoutout
    // dailyUpdaters = dailyUpdaters.map(dailyUpdater => dailyUpdater = getUserFromMention(dailyUpdater))
    // console.log(dailyUpdaters)
 
    dailyUpdaters =  [... new Set(dailyUpdaters)]
    if(dailyUpdaters){
      client.channels.cache.get('1035584676238209055').send({ 
      content: `Today's commiters ${dailyUpdaters}`,
      // embeds: [
      //         new EmbedBuilder()
      //            .setDescription("test")
      //            .setTitle("test title")
      //            .setAuthor({
      //               name: client.users.cache.get('1069641772164206703'),
      //               iconUrl: "https://i.pinimg.com/564x/a3/d6/82/a3d6828d877d4d6fe17c5b2c22ca6b03.jpg"
      //             })
      //            .setColor(0x4778e9)
      //         ]
      });   

    } else if(dailyUpdaters.length == 0) {
      client.channels.cache.get('1035584676238209055').send({
        content: `No commits today :(`
      });
    }

    //emptying the database
    mongoose.connection.db.dropCollection('updaters');
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

      //theAppreciator webhook url
      //https://discord.com/api/webhooks/1074013533576110170/C9tyxYO6j8PC6q-ImS6fVZNMO_fUedrS1UhPYuK-UtnrziIbY2BGg9BUcT8M7twggXES
      await webhook.send({
        content: 'Damnn, You Work too hard !!',
        threadId: threadId,
        files: ['https://i.pinimg.com/564x/7f/52/fb/7f52fb4660263684b4ffd130620736d2.jpg'],
      });

        await new Updaters({
          uid: msg.author.id,
          name: msg.author.username,
        


        }).save()

      //scheduled archive
      schedule.scheduleJob(shoutoutRule, async () => {
        thread.setArchived(true);
      });
      
    }

      (await Updaters.find()).forEach((dailyUpdater)=>{
        
        // console.log(dailyUpdater.name);
        dailyUpdaters.push(client.users.cache.get(dailyUpdater.uid.toString));
      })
      

    
      // console.log(dailyUpdaters);

  } catch(err) {
    console.log(err) 
  }
})

// keepAlive()
client.login(process.env.TOKEN);
