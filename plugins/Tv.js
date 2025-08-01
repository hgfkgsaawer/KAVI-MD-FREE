const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
  pattern: 'tvs',
  desc: 'Search and download SinhalaSub TV Shows',
  category: 'download',
  react: '📺',
  filename: __filename
}, async (conn, mek, m, { from, q }) => {
  if (!q) {
    await conn.sendMessage(from, { text: 'Usage: .tvshow <search term>\nExample: .tvshow Gaalivaana' }, { quoted: mek });
    return;
  }

  try {
    // 1. Search TV Shows
    const searchUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/search?q=${encodeURIComponent(q)}`;
    const searchRes = await axios.get(searchUrl);
    const shows = searchRes.data.results;

    if (!shows || shows.length === 0) {
      await conn.sendMessage(from, { text: 'No TV shows found.' }, { quoted: mek });
      return;
    }

    // 2. Send list of TV shows
    let text = '*TV Shows Found:*\n\n';
    shows.forEach((show, i) => {
      text += `${i + 1}. *${show.Title}*\n${show.Desc}\n\n`;
    });
    text += '_Reply with the number of the TV show you want._';

    const listMsg = await conn.sendMessage(from, {
      image: { url: shows[0].Img },
      caption: text
    }, { quoted: mek });

    // 3. Listen for user's reply with TV show number
    const handleShowChoice = async ({ messages }) => {
      const reply = messages?.[0];
      if (!reply?.message?.extendedTextMessage) return;
      const replyText = reply.message.extendedTextMessage.text.trim();
      const replyId = reply.message.extendedTextMessage.contextInfo?.stanzaId;

      // Check if reply is to our list message
      if (replyId !== listMsg.key.id) return;

      const choice = parseInt(replyText);
      const selectedShow = shows[choice - 1];

      if (!selectedShow) {
        await conn.sendMessage(from, { text: 'Invalid selection.' }, { quoted: reply });
        return;
      }

      // 4. Fetch episodes list
      const infoUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/info?url=${encodeURIComponent(selectedShow.Link)}`;
      const infoRes = await axios.get(infoUrl);
      const episodes = infoRes.data.episodes;

      if (!episodes || episodes.length === 0) {
        await conn.sendMessage(from, { text: 'No episodes found.' }, { quoted: reply });
        return;
      }

      // 5. Send episode list
      let epText = `*${selectedShow.Title}*\n\nEpisodes:\n\n`;
      episodes.forEach((ep, i) => {
        epText += `${i + 1}. *${ep.Title}*\n\n`;
      });
      epText += '_Reply with the episode number to download._';

      const epListMsg = await conn.sendMessage(from, {
        image: { url: selectedShow.Img },
        caption: epText
      }, { quoted: reply });

      // 6. Listen for episode selection
      const handleEpisodeChoice = async ({ messages }) => {
        const epReply = messages?.[0];
        if (!epReply?.message?.extendedTextMessage) return;
        const epReplyText = epReply.message.extendedTextMessage.text.trim();
        const epReplyId = epReply.message.extendedTextMessage.contextInfo?.stanzaId;

        if (epReplyId !== epListMsg.key.id) return;

        const epChoice = parseInt(epReplyText);
        const selectedEp = episodes[epChoice - 1];

        if (!selectedEp) {
          await conn.sendMessage(from, { text: 'Invalid episode number.' }, { quoted: epReply });
          return;
        }

        // 7. Download link
        const dlUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/dl?url=${encodeURIComponent(selectedEp.Link)}`;
        const dlRes = await axios.get(dlUrl);
        const links = dlRes.data.movie?.download_links || [];

        const pick = links.find(x => x.direct_download);
        if (!pick) {
          await conn.sendMessage(from, { text: 'Download link not found.' }, { quoted: epReply });
          return;
        }

        // 8. Send video document
        const fileName = `KAVI ツ • ${selectedEp.Title.replace(/[\\/:*?"<>|]/g, '')}.mp4`;

        try {
          await conn.sendMessage(from, {
            document: { url: pick.direct_download },
            mimetype: 'video/mp4',
            fileName,
            caption: `🎬 ${selectedEp.Title}\nSize: ${pick.size || 'Unknown'}\n\n${config.MOVIE_FOOTER || ''}`
          }, { quoted: epReply });

          await conn.sendMessage(from, { react: { text: '✅', key: epReply.key } });
        } catch {
          await conn.sendMessage(from, { text: `Failed to send video.\nDirect link:\n${pick.direct_download}` }, { quoted: epReply });
        }

        conn.ev.off('messages.upsert', handleEpisodeChoice);
      };

      conn.ev.on('messages.upsert', handleEpisodeChoice);
      conn.ev.off('messages.upsert', handleShowChoice);
    };

    conn.ev.on('messages.upsert', handleShowChoice);

  } catch (error) {
    console.error(error);
    await conn.sendMessage(from, { text: `Error: ${error.message}` }, { quoted: mek });
  }
});
