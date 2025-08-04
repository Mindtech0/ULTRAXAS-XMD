sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return;
  const msg = messages[0];
  if (!msg.message || msg.key.fromMe) return;

  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  
  // Detect .ping command
  if (text.startsWith('.ping')) {
    const [_, groupName, ...msgParts] = text.split(' ');
    const message = msgParts.join(' ');

    try {
      const groups = await sock.groupFetchAllParticipating();
      const targetGroup = Object.values(groups).find(g => g.subject.toLowerCase().includes(groupName.toLowerCase()));

      if (!targetGroup) {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Group "${groupName}" not found.` });
        return;
      }

      const metadata = await sock.groupMetadata(targetGroup.id);
      await sock.sendMessage(msg.key.remoteJid, { text: `💥 Sending message to ${metadata.participants.length} members...` });

      for (const participant of metadata.participants) {
        if (participant.id !== sock.user.id) {
          await sock.sendMessage(participant.id, { text: message });
          console.log("✅ Sent to", participant.id);
        }
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Bulk message sent successfully!` });

    } catch (err) {
      console.error("❌ Error in .ping command", err);
      await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ Error: ${err.message}` });
    }
  }
});
