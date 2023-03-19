const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");
const schedule = require("node-schedule");

let dailyUpdaters = [];
let shoutoutRule = new schedule.RecurrenceRule();
shoutoutRule.tz = "Asia/Kolkata";
shoutoutRule.hour = 23;
shoutoutRule.minute = 58;
shoutoutRule.second = 0;
const mongoose = require("mongoose");
const Updaters = require("../models/updaters-schema");
dotenv.config();
const keepAlive = require("./server");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

//bot redy test
client.on("ready", () => {
  let uri =
    "mongodb+srv://elonTuskBot:" +
    process.env.MONGO_PASS +
    "@cluster0.ak5numc.mongodb.net/?retryWrites=true&w=majority";
  mongoose.connect(uri, {
    keepAlive: true,
  });

  console.log("Bot is ready!");

  schedule.scheduleJob(shoutoutRule, async () => {
    // Send a daily-updater shoutout
    dailyUpdaters = [...new Set(dailyUpdaters)];

    if (dailyUpdaters.length > 0) {
      client.channels.cache.get("1035584676238209055").send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Today's Updaters")
            .setDescription(`${dailyUpdaters}`)
            .setAuthor({
              name: "Elon Tusk Bot",
              iconURL:
                "https://i.pinimg.com/564x/22/6e/d8/226ed8295c412bdaf8787b04d91e732d.jpg",
            }),
        ],
      });
    } else {
      client.channels.cache.get("1035584676238209055").send({
        content: `No commits today :(`,
      });
    }

    dailyUpdaters = [];
  });
});

client.on("messageCreate", async (msg) => {
  try {
    if (msg.author.bot) return; //bot dont get in loop

    let cmtLnk = /https:\/\/github\.com\/.*\/.*\/commit\/[0-9a-f]{40}/;

    if (msg.content.match(cmtLnk) !== null) {
      msg.react("🔥");
      const thread = await msg.startThread({
        name: `${msg.author.username}'s AppreciationThread`,
        // autoArchiveDuration: 60,
      });

      const threadId = thread.id;
      const webhooks = await msg.channel.fetchWebhooks(
        "1050650744635785266",
        "HvHCwilgtWUDi0Fy5jiXmWq1nE0FVvGRxZ6tWdYClxweFPLQRwAG0RkHif3W3hisTRsq"
      );
      const webhook = webhooks.first();

      await webhook.send({
        content: "Are Baas yaar kitna kaam karoge",
        threadId: threadId,
        files: [
          "https://i.pinimg.com/564x/7f/52/fb/7f52fb4660263684b4ffd130620736d2.jpg",
        ],
      });

      await Updaters.findOneAndUpdate({ uid: msg.author.id }, [
        {
          $set: {
            dates: {
              $cond: [
                { $eq: [new Date().getDate(), { $first: "$dates" }] },
                "$dates",
                {
                  $cond: [
                    { $eq: [new Date().getDate() - 1, { $first: "$dates" }] },
                    { $concatArrays: [[new Date().getDate()], "$dates"] },
                    [new Date().getDate()],
                  ],
                },
              ],
            },
          },
        },
      ]).then((doc) => {
        if (doc) {
          console.log(doc); //Document just before updation
          console.log("Done");
        } else {
          new Updaters({
            uid: msg.author.id,
            name: msg.author.username,
            dates: [new Date().getDate()],
            noOfCommits: 1,
          }).save();
          console.log(doc);
          console.log("Made new user");
        }
      });

      //scheduled archive
      schedule.scheduleJob(shoutoutRule, async () => {
        thread.setArchived(true);
      });
    }

    (await Updaters.find()).forEach((dailyUpdater) => {
      dailyUpdaters.push(
        "<@!" +
          dailyUpdater.uid +
          ">\n" +
          "Streak Count: " +
          dailyUpdater.dates.length +
          "\n"
      );
    });
  } catch (err) {
    console.log(err);
  }
});

keepAlive();
client.login(process.env.TOKEN);
