// backend/src/models/Chat.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Chat = sequelize.define('Chat', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user1Id: { type: DataTypes.INTEGER, allowNull: false },
    user2Id: { type: DataTypes.INTEGER, allowNull: false },
}, {
    timestamps: true,
    tableName: 'chats',
    indexes: [
        { unique: true, fields: ['user1Id', 'user2Id'] }, 
    ],
});

export default Chat;
