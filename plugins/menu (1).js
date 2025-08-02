const { cmd, commands } = require("../command");
const config = require('../config');
const os = require("os");

const runtime = (seconds) => {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

cmd(
  {
    pattern: "menu",
    alias: ["list"],
    react: "⚔️",
    desc: "get cmd list",
    category: "main",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    {
      from,
      reply,
    }
  ) => {
    try {
      let menu = {};

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        if (cmd.pattern && !cmd.dontAddCommandList) {
          if (!menu[cmd.category]) menu[cmd.category] = "";
          menu[cmd.category] += `${config.PREFIX}${cmd.pattern}\n`;
        }
      }

      let madeMenu = `> *🪝 ᴍᴜʟᴛɪᴅᴇᴠɪᴄᴇ ᴡʜᴀᴛꜱᴀᴘᴘ ʙᴏᴛ*🪝

*╭────── ❖ SYSTEM INFO ❖ ──────╮*
 *❘ 📅 Date Today :* ${new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Colombo" })}
 *❘ ⌚ Time Now :* ${new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Colombo" })}
 *❘ 🍭 Bot Name : ${config.BOT_NAME}*
 *❘ 👾 Prefix : ${config.PREFIX}*
 *❘ 📝 Platform : ${os.platform()}*
 *❘ 🤴 Owner : ${config.OWNER_NAME}*
 *❘ 🔮 Mode : ${config.MODE}*
 *❘ 🍁 Uptime : ${runtime(process.uptime())}*
 *❘ ✨ Mem : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB*
*╰─────────────────────────╯*  

*_🔰 COMMANDS 🔰_*
━━━━━━━━━━━━━━━━
${menu.main || ""}
${menu.download || ""}    
${menu.group || ""}
${menu.convert || ""}
${menu.owner || ""}
${menu.search || ""}

${config.FOOTER || ''}`;

      await robin.sendPresenceUpdate('recording', from);

      await robin.sendMessage(
        from,
        { audio: { url: "https://files.catbox.moe/x1tr4y.mp3" }, mimetype: 'audio/mpeg', ptt: true },
        { quoted: mek }
      );

      await robin.sendMessage(
        from,
        {
          image: { url: config.ALIVE_IMG },
          caption: madeMenu
        },
        { quoted: mek }
      );
    } catch (e) {
      console.log(e);
      reply(`${e}`);
    }
  }
);
