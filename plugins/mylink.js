const config = require('../config')
const {cmd , commands} = require('../command')
const os = require("os")
const {runtime} = require('../lib/functions')
cmd({
    pattern: "link",
    alias: ["status","botinfo"],
    desc: "check up time , ram usage and more",
    category: "main",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumner, botNumner2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let status = `
☣️ *KAVI-MD GROUP LINKS* ☣️


*⚘━━━━━━━╶╶╶╶━━━━━━━⚘*

 *🖊️ 𝐌𝐎𝐕𝐈𝐄 𝐑𝐄𝐐𝐔𝐄𝐒𝐓 𝐆𝐑𝐎𝐔𝐏 _~➙ https://chat.whatsapp.com/IkQ2yh3qDXG8fTyJdnSKSA~_*

*👀 𝐌𝐎𝐕𝐈𝐄 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 ~_➙ https://whatsapp.com/channel/0029Vb5xFPHGE56jTnm4ZD2k_~*

*👻 𝐌𝐎𝐕𝐈𝐄 𝐆𝐑𝐎𝐔𝐏 ~_➙ https://chat.whatsapp.com/K7UM5Jk6Igu0tnQMPhPRJj_~*

*👽 𝐓𝐕 𝐒𝐄𝐑𝐈𝐄𝐒 𝐆𝐑𝐎𝐔𝐏 ➙ ~_https://chat.whatsapp.com/EThzlx8sOrMKRDkXSHpSqG_~*

*🎠 𝐂𝐀𝐑𝐓𝐎𝐎𝐍 𝐱 𝐀𝐍𝐈𝐌𝐄 𝐆𝐑𝐎𝐔𝐏 ➙ _~https://chat.whatsapp.com/Bd2dcAsJ4zNL9LvmxccVmy~_*

*💬 𝐂𝐇𝐀𝐓 𝐆𝐑𝐎𝐔𝐏 ➙ ~https://chat.whatsapp.com/IU74OirJ5ZC0FMYzO0FkXs~*

*🧑‍💻 𝐁𝐎𝐓 𝐆𝐑𝐎𝐔𝐏 ➙ _~https://chat.whatsapp.com/ETnlbJGBTd13TvGhSUIFSq~_*

> *ᴘᴏᴡᴇʀᴅ ʙʏ  ᴋᴀᴠɪᴅᴜ ʀᴀꜱᴀɴɢᴀ : )*

*⚘━━━━━━━╶╶╶╶━━━━━━━⚘*
`
return reply(`${status}`)

}catch(e){
console.log(e)
reply(`${e}`)

}
})