const { cmd } = require('../command');
const axios = require('axios');

cmd(
  {
    pattern: 'sin',
    desc: 'Search and download Sinhala TV Shows',
    category: 'download',
    filename: __filename,
  },
  async (conn, mek, m, { from, q }) => {
    if (!q) {
      return await conn.sendMessage(
        from,
        {
          text:
            '*📺 TV Show Search*\n\n' +
            'Usage: .sinhalasub-tvshow <search term>\n' +
            'Example: .sinhalasub-tvshow gaalivaana',
        },
        { quoted: mek }
      );
    }

    try {
      // 1. Search TV Shows
      const searchUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/search?q=${encodeURIComponent(q)}`;
      const searchRes = await axios.get(searchUrl);

      if (!searchRes.data || !searchRes.data.results || searchRes.data.results.length === 0)
        return await conn.sendMessage(from, { text: '❌ No TV Shows found.' }, { quoted: mek });

      // Build list of shows for user
      let listText = '*📺 TV Shows Found:*\n\n';
      const shows = searchRes.data.results;
      for (let i = 0; i < shows.length; i++) {
        const show = shows[i];
        listText += `${i + 1}. *${show.Title}*\n${show.Desc}\n\n`;
      }
      listText += '_Reply with the number of the TV show you want._';

      await conn.sendMessage(from, { text: listText }, { quoted: mek });

      // Wait for user reply to select TV show
      const handler = async (update) => {
        const msg = update.messages?.[0];
        if (!msg || !msg.message || !msg.message.conversation) return;
        if (msg.key.fromMe) return;

        if (msg.key.remoteJid !== from) return;

        const reply = msg.message.conversation.trim();

        if (reply.toLowerCase() === 'cancel') {
          conn.ev.off('messages.upsert', handler);
          return await conn.sendMessage(from, { text: '❌ Cancelled.' });
        }

        const num = parseInt(reply);
        if (!num || num < 1 || num > shows.length) {
          return await conn.sendMessage(from, { text: '❌ Invalid selection. Reply with a valid number or "cancel".' }, { quoted: msg });
        }

        const selectedShow = shows[num - 1];

        conn.ev.off('messages.upsert', handler); // Stop listening further

        // 2. Get episodes info
        const infoUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/info?url=${encodeURIComponent(selectedShow.Link)}`;
        const infoRes = await axios.get(infoUrl);

        if (!infoRes.data || !infoRes.data.episodes || infoRes.data.episodes.length === 0) {
          return await conn.sendMessage(from, { text: '❌ No episodes found for this TV show.' });
        }

        // Build episode list text
        let epText = `*📺 Episodes for ${selectedShow.Title}:*\n\n`;
        const episodes = infoRes.data.episodes;
        for (let i = 0; i < episodes.length; i++) {
          const ep = episodes[i];
          epText += `${i + 1}. *${ep.title || ep.name || 'Episode ' + (i+1)}*\n${ep.date || ''}\n\n`;
        }
        epText += '_Reply with the episode number to download or "cancel"._';

        await conn.sendMessage(from, { text: epText });

        // 3. Wait for episode selection
        const epHandler = async (epUpdate) => {
          const epMsg = epUpdate.messages?.[0];
          if (!epMsg || !epMsg.message || !epMsg.message.conversation) return;
          if (epMsg.key.fromMe) return;
          if (epMsg.key.remoteJid !== from) return;

          const epReply = epMsg.message.conversation.trim();

          if (epReply.toLowerCase() === 'cancel') {
            conn.ev.off('messages.upsert', epHandler);
            return await conn.sendMessage(from, { text: '❌ Cancelled.' });
          }

          const epNum = parseInt(epReply);
          if (!epNum || epNum < 1 || epNum > episodes.length) {
            return await conn.sendMessage(from, { text: '❌ Invalid episode number. Reply with valid number or "cancel".' }, { quoted: epMsg });
          }

          conn.ev.off('messages.upsert', epHandler); // Stop listening

          const epSelected = episodes[epNum - 1];

          // 4. Get download links for episode
          const dlUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/dl?url=${encodeURIComponent(epSelected.link || epSelected.Link)}`;
          const dlRes = await axios.get(dlUrl);

          if (!dlRes.data || !dlRes.data.status) {
            return await conn.sendMessage(from, { text: '❌ Failed to fetch download links.' });
          }

          // Pick best direct download link (assuming first in array)
          const links = dlRes.data.episode.download_links || dlRes.data.download_links || [];
          if (!links.length) {
            return await conn.sendMessage(from, { text: '❌ No download links available.' });
          }

          const directLink = links.find(l => l.direct_download) || links[0];

          // Send document video to user
          await conn.sendMessage(
            from,
            {
              document: { url: directLink.direct_download || directLink.url },
              mimetype: 'video/mp4',
              fileName: `${selectedShow.Title} - ${epSelected.title || 'Episode'}.mp4`,
              caption: `🎬 *${selectedShow.Title} - ${epSelected.title || 'Episode'}*\n\n${directLink.size || ''}`
            }
          );
        };

        conn.ev.on('messages.upsert', epHandler);
      };

      conn.ev.on('messages.upsert', handler);
    } catch (e) {
      console.error(e);
      await conn.sendMessage(from, { text: '❌ Error: ' + e.message }, { quoted: mek });
    }
  }
);
