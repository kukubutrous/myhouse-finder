import User from './User.js';
import Chat from './Chat.js';
import Message from './Message.js';

// --- CHAT ASSOCIATIONS ---
// Chat belongs to two users
Chat.belongsTo(User, { as: 'user1', foreignKey: 'user1Id', onDelete: 'CASCADE' });
Chat.belongsTo(User, { as: 'user2', foreignKey: 'user2Id', onDelete: 'CASCADE' });

// --- MESSAGE ASSOCIATIONS ---
// Messages belong to a chat and a sender
Message.belongsTo(Chat, { as: 'chat', foreignKey: 'chatId', onDelete: 'CASCADE' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId', onDelete: 'CASCADE' });

// Chats have many messages
Chat.hasMany(Message, { as: 'messages', foreignKey: 'chatId', onDelete: 'CASCADE' });

// --- USER ASSOCIATIONS ---
// Users have many chats and messages
User.hasMany(Chat, { as: 'chatsAsUser1', foreignKey: 'user1Id', onDelete: 'CASCADE' });
User.hasMany(Chat, { as: 'chatsAsUser2', foreignKey: 'user2Id', onDelete: 'CASCADE' });
User.hasMany(Message, { as: 'sentMessages', foreignKey: 'senderId', onDelete: 'CASCADE' });

// Export models
export { User, Chat, Message };
export default { User, Chat, Message };
