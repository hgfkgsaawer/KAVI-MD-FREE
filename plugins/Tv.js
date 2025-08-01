const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
  pattern: 'tvs',
  desc: 'Search and download Sinhala Subbed TV Shows',
  category: 'download',
  filename: __filename,
  use: '.tvshow <search>'
}, async (conn, mek, m, { from, q }) => {
  if (!q) {
    return await conn.sendMessage(from, { text: '📺 *Usage:* .tvshow <search term>\n\nExample: `.tvshow Money Heist`' }, { quoted: mek });
  }

  try {
    // 1. SEARCH SHOWS
    const searchUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/search?q=${encodeURIComponent(q)}`;
    const searchRes = await axios.get(searchUrl);
    const results = searchRes.data.results;

    if (!results || results.length === 0) {
      return await conn.sendMessage(from, { text: '❌ No shows found.' }, { quoted: mek });
    }

    let txt = '*📺 TV Shows Found:*\n\n';
    results.slice(0, 10).forEach((s, i) => {
      txt += `${i + 1}. *${s.title}*\n${s.link}\n\n`;
    });
    txt += '_Reply with a number to select_';

    const sent = await conn.sendMessage(from, { text: txt }, { quoted: mek });

    const handler = async ({ messages }) => {
      const msg = messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;
      const text = msg.message.extendedTextMessage.text.trim();
      const replyTo = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (replyTo !== sent.key.id) return;

      const num = parseInt(text);
      const selected = results[num - 1];
      if (!selected) {
        await conn.sendMessage(from, { text: '❌ Invalid selection.' }, { quoted: msg });
        return;
      }

      // 2. GET INFO / EPISODES
      const infoUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/info?url=${encodeURIComponent(selected.link)}`;
      const infoRes = await axios.get(infoUrl);
      const eps = infoRes.data.episodes;

      if (!eps || eps.length === 0) {
        await conn.sendMessage(from, { text: '❌ No episodes found.' }, { quoted: msg });
        return;
      }

      let epList = `*🎞️ Episodes of ${selected.title}:*\n\n`;
      eps.slice(0, 15).forEach((ep, i) => {
        epList += `${i + 1}. ${ep.title}\n${ep.link}\n\n`;
      });
      epList += '_Reply with an episode number to download_';

      const listEp = await conn.sendMessage(from, { text: epList }, { quoted: msg });

      const epHandler = async ({ messages }) => {
        const emsg = messages?.[0];
        if (!emsg?.message?.extendedTextMessage) return;
        const replyToEp = emsg.message.extendedTextMessage.contextInfo?.stanzaId;
        const epNum = parseInt(emsg.message.extendedTextMessage.text.trim());

        if (replyToEp !== listEp.key.id) return;

        const ep = eps[epNum - 1];
        if (!ep) {
          await conn.sendMessage(from, { text: '❌ Invalid episode number.' }, { quoted: emsg });
          return;
        }

        // 3. DOWNLOAD EPISODE
        const dlUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/dl?url=${encodeURIComponent(ep.link)}`;
        const dlRes = await axios.get(dlUrl);
        const file = dlRes.data;

        if (!file?.url) {
          await conn.sendMessage(from, { text: '❌ Download link not found.' }, { quoted: emsg });
          return;
        }

        const fname = `${selected.title} - ${ep.title}.mp4`.replace(/[\\/:*?"<>|]/g, '');

        await conn.sendMessage(
          from,
          {
            document: { url: file.url },
            mimetype: 'video/mp4',
            fileName: fname,
            caption: `🎞️ *${selected.title}*\n📺 *${ep.title}*\n📥 Size: ${file.size || 'Unknown'}\n\n${config.MOVIE_FOOTER || ''}`
          },
          { quoted: emsg }
        );
        conn.ev.off('messages.upsert', epHandler);
      };

      conn.ev.on('messages.upsert', epHandler);
      conn.ev.off('messages.upsert', handler);
    };

    conn.ev.on('messages.upsert', handler);
  } catch (e) {
    console.error(e);
    await conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: mek });
  }
});
