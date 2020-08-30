const { workingColor, errorColor, successColor, neutralColor } = require("../config.json");
const Discord = require("discord.js");
const { GoogleSpreadsheet } = require('google-spreadsheet')
const creds = require('../service-account.json')

module.exports = {
    name: "poll",
    description: "Creates a poll in the current channel.",
    usage: "poll <role to ping|'none'>/<question>/<a1 emoji>-<a1 text>/<a2 emoji>-<a2 text>[/...-...]",
    cooldown: 30,
    execute(strings, message) {
        const executedBy = strings.executedBy.replace("%%user%%", message.author.tag)
        const args = message.content.slice(6).split("/")
        message.delete()
        const pingRole = args[0]
        const question = args[1]
        var remove = args.shift()
        remove = args.shift()

        const embed = new Discord.MessageEmbed()
            .setColor(workingColor)
            .setTitle(question)
            .setDescription("One second...")
            .setFooter("Poll created by " + message.author.tag + " | This message will update to reflect the poll's status.");


        args.forEach(arg => {
            const option = arg.split("-")
            const emoji = option[0]
            const text = option[1]
            embed.addField((emoji + " — " + text), "\u200b")
        })

        message.channel.send(embed).then(msg => {
            var emojis = []
            var itemsProcessed = 0

            args.forEach(async (arg) => {
                const option = arg.split("-")
                const emoji = option[0].replace(/\s+/g, '')
                await msg.react(emoji).catch(err => {
                    const embedTwo = new Discord.MessageEmbed()
                        .setColor(errorColor)
                        .setTitle("Poll")
                        .setDescription("Couldn't react with  `" + emoji + "`. Make sure to not type the emoji name, but the actual emoji. The emoji needs to either be a default Discord emoji or it needs to be in this server.\n\nError message:\n> " + err)
                        .setFooter("Executed by " + message.author.tag);
                    msg.edit(embedTwo)
                })
                await emojis.push(emoji)
                await itemsProcessed++
                if (itemsProcessed === args.length) {
                    await addToSpreadsheet(msg, emojis)
                    embed
                        .setColor(neutralColor)
                        .setDescription("To vote, react to this message.")
                    msg.edit(embed)
                }
            })
        })
    }
}

async function addToSpreadsheet(msg, emojis) {
    const doc = new GoogleSpreadsheet('1MYEHIdzLVXVJyzDaNIknYlmSKjg7lxO15prLfAod3kI')
    await doc.useServiceAccountAuth(creds)

    await doc.loadInfo()
    console.log(doc.title)

    const sheet = doc.sheetsByIndex[0]
    console.log(sheet.title)

    const msgID = msg.id
    const emojiList = emojis
    
    var toAdd = { messageID: msgID, emojis: emojiList }

    const result = await sheet.addRow(toAdd)
    console.log(result)
}