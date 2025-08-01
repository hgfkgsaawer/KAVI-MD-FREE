const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');

cmd({
  pattern: "tvs",
  desc: "Download Sinhala-subbed TV shows",
  use: '.tvshow2 <name>',
  category: "movie",
  filename: __filename
}, async (conn, msg, m, { args, usedPrefix, command }) => {
  if (!args || !args.length) return msg.reply(`🎬 Use: *${usedPrefix + command} <tv show name>*`);

  const query = args.join(" ");
  const searchUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/search?q=${encodeURIComponent(query)}`;

  const res = await fetchJson(searchUrl);
  if (!res.success || !res.results || !res.results.length) return msg.reply('❌ No TV shows found.');

  let results = res.results.slice(0, 5);
  let listText = `*📺 TV Shows Found:*\n\n`;
  results.forEach((v, i) => {
    listText += `*${i + 1}.* *${v.Title}*\n${v.Desc}\n\n`;
  });
  listText += `_Reply with the number of the TV show you want._`;

  await conn.sendMessage(m.chat, { text: listText }, { quoted: msg });

  conn.ev.once('messages.upsert', async (mek) => {
    try {
      mek = mek.messages[0];
      if (!mek.message) return;
      const selectedNum = parseInt(mek.message.conversation || mek.message.extendedTextMessage?.text);
      if (isNaN(selectedNum) || selectedNum < 1 || selectedNum > results.length) {
        return msg.reply("❌ Invalid number.");
      }

      const selected = results[selectedNum - 1];
      const infoUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/info?url=${encodeURIComponent(selected.Link)}`;
      const infoRes = await fetchJson(infoUrl);

      if (!infoRes.success || !infoRes.results || !infoRes.results.episodes || infoRes.results.episodes.length === 0) {
        return msg.reply(`🚫 No episodes found for *${selected.Title}*.`);
      }

      let episodeList = infoRes.results.episodes
        .map((ep, i) => `*${i + 1}.* ${ep.title} (${ep.date})`)
        .join('\n');

      await conn.sendMessage(m.chat, {
        text: `*🎞️ Episodes for ${selected.Title}:*\n\n${episodeList}\n\n_Reply with a number to download._`
      }, { quoted: msg });

      conn.ev.once('messages.upsert', async (mek2) => {
        try {
          mek2 = mek2.messages[0];
          if (!mek2.message) return;
          let epNum = parseInt(mek2.message.conversation || mek2.message.extendedTextMessage?.text);
          if (isNaN(epNum) || epNum < 1 || epNum > infoRes.results.episodes.length) {
            return msg.reply("❌ Invalid episode number.");
          }

          const ep = infoRes.results.episodes[epNum - 1];
          const dlUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/dl?url=${encodeURIComponent(ep.episode_link)}`;
          const dlRes = await fetchJson(dlUrl);

          if (!dlRes.success || !dlRes.data || !dlRes.data.file) {
            return msg.reply("🚫 Failed to fetch download link.");
          }

          await conn.sendMessage(m.chat, {
            document: { url: dlRes.data.file },
            fileName: `${dlRes.data.title || ep.title}.mp4`,
            mimetype: 'video/mp4',
            caption: `🎬 *${dlRes.data.title || ep.title}*\n📅 ${ep.date}`
          }, { quoted: msg });

        } catch (err) {
          console.error(err);
          msg.reply('❌ Error while fetching or sending episode.');
        }
      });

    } catch (e) {
      console.error(e);
      msg.reply('❌ Error while processing selection.');
    }
  });
});
