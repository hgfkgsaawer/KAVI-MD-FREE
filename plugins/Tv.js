const { cmd } = require('../command');
const axios = require('axios');

cmd({
  pattern: 'tvs',
  desc: 'Search TV Shows and select episodes',
  category: 'download',
  react: '📺',
  filename: __filename,
}, async (conn, mek, m, { from, q }) => {
  if (!q) {
    await conn.sendMessage(from, { text: 'Usage: .sinhalasub-tvshow <search>' }, { quoted: mek });
    return;
  }

  // 1. Search TV shows
  const searchUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/search?q=${encodeURIComponent(q)}`;
  const searchRes = await axios.get(searchUrl);
  if (!searchRes.data.success || !searchRes.data.results.length) {
    await conn.sendMessage(from, { text: 'No TV shows found.' }, { quoted: mek });
    return;
  }

  // Show list of shows
  let listText = '*TV Shows Found:*\n\n';
  searchRes.data.results.forEach((show, i) => {
    listText += `${i + 1}. *${show.Title}*\n${show.Desc}\n\n`;
  });
  listText += '_Reply with the number of the TV show you want._';

  await conn.sendMessage(from, { text: listText }, { quoted: mek });

  // Save results for next step
  global.tvShowSearchResults = searchRes.data.results;
});

cmd({
  pattern: 'tvss',
  desc: 'Select TV show number to get episodes',
  category: 'download',
  react: '📺',
  filename: __filename,
}, async (conn, mek, m, { from, q }) => {
  if (!global.tvShowSearchResults || !q) {
    await conn.sendMessage(from, { text: 'Please search TV shows first with .sinhalasub-tvshow <query>' }, { quoted: mek });
    return;
  }

  const idx = parseInt(q) - 1;
  if (isNaN(idx) || idx < 0 || idx >= global.tvShowSearchResults.length) {
    await conn.sendMessage(from, { text: 'Invalid selection number.' }, { quoted: mek });
    return;
  }

  const selectedShow = global.tvShowSearchResults[idx];

  // Fetch info with episodes
  const infoUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/info?url=${encodeURIComponent(selectedShow.Link)}`;
  const infoRes = await axios.get(infoUrl);

  if (!infoRes.data.episodes || infoRes.data.episodes.length === 0) {
    await conn.sendMessage(from, { text: 'No episodes found for this TV show.' }, { quoted: mek });
    return;
  }

  let epText = `*Episodes for ${selectedShow.Title}:*\n\n`;
  infoRes.data.episodes.forEach((ep, i) => {
    epText += `${i + 1}. ${ep.title || ep.Title || 'Episode ' + (i + 1)}\n`;
  });
  epText += '\nReply with .episodeselect <number> to download episode.';

  // Save episodes for next step
  global.tvShowEpisodes = infoRes.data.episodes;

  await conn.sendMessage(from, { text: epText }, { quoted: mek });
});

cmd({
  pattern: 'tvsss',
  desc: 'Select episode number to download',
  category: 'download',
  react: '🎬',
  filename: __filename,
}, async (conn, mek, m, { from, q }) => {
  if (!global.tvShowEpisodes || !q) {
    await conn.sendMessage(from, { text: 'Please select a TV show first.' }, { quoted: mek });
    return;
  }

  const epIdx = parseInt(q) - 1;
  if (isNaN(epIdx) || epIdx < 0 || epIdx >= global.tvShowEpisodes.length) {
    await conn.sendMessage(from, { text: 'Invalid episode number.' }, { quoted: mek });
    return;
  }

  const ep = global.tvShowEpisodes[epIdx];

  // Download link API example
  const dlUrl = `https://supun-md-mv.vercel.app/api/sinhalasub-tvshow2/dl?url=${encodeURIComponent(ep.link || ep.Link)}`;

  // Download / send document
  try {
    await conn.sendMessage(from, {
      document: { url: dlUrl },
      mimetype: 'video/mp4',
      fileName: `${(ep.title || ep.Title || 'Episode').replace(/[\\/:*?"<>|]/g, '')}.mp4`,
      caption: `🎬 ${selectedShow.Title} - ${(ep.title || ep.Title || 'Episode')}`
    }, { quoted: mek });
  } catch {
    await conn.sendMessage(from, { text: 'Failed to send episode video.' }, { quoted: mek });
  }
});
