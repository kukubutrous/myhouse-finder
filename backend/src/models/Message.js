import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Message = sequelize.define('Message', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    chatId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    type: {
        type: DataTypes.ENUM('text', 'image', 'file', 'video', 'audio', 'pdf'),
        defaultValue: 'text'
    },
    // New fields for read receipts
    status: {
        type: DataTypes.ENUM('sent', 'delivered', 'read'),
        defaultValue: 'sent'
    },
    seenBy: {
        type: DataTypes.STRING,
        allowNull: true
    },
    seenAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'messages',
});

export default Message;

