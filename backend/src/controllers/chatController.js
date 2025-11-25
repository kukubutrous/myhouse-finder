// backend/src/controllers/chatController.js
import { Op } from "sequelize";
import { Chat, Message, User } from "../models/index.js";
import { getIo } from "../utils/io.js";

/**
 * Fetch all chats for the logged-in user
 */
export async function getUserChats(req, res) {
    try {
        const userId = req.user.id;

        // Fetch all chats where user is either user1 or user2
        const chats = await Chat.findAll({
            where: {
                [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
            },
            include: [
                {
                    model: User,
                    as: "user1",
                    attributes: ["id", "firstName", "lastName", "email"],
                },
                {
                    model: User,
                    as: "user2",
                    attributes: ["id", "firstName", "lastName", "email"],
                },
            ],
            order: [["updatedAt", "DESC"]],
        });

        // Get last message for each chat
        const chatsWithLastMessage = await Promise.all(
            chats.map(async (chat) => {
                const latest = await Message.findOne({
                    where: { chatId: chat.id },
                    order: [["createdAt", "DESC"]],
                    include: [
                        {
                            model: User,
                            as: "sender",
                            attributes: ["id", "firstName", "lastName"],
                        },
                    ],
                });
                return {
                    ...chat.toJSON(),
                    latestMessage: latest || null,
                };
            })
        );

        res.json(chatsWithLastMessage);
    } catch (err) {
        console.error("Get Chats Error:", err);
        res.status(500).json({ message: "Failed to fetch chats" });
    }
}

/**
 * Fetch all messages for a given chat
 */
export async function getMessages(req, res) {
    try {
        const { chatId } = req.params;

        const messages = await Message.findAll({
            where: { chatId },
            include: [
                {
                    model: User,
                    as: "sender",
                    attributes: ["id", "firstName", "lastName"],
                },
            ],
            order: [["createdAt", "ASC"]],
        });

        res.json(messages);
    } catch (err) {
        console.error("Get Messages Error:", err);
        res.status(500).json({ message: "Failed to fetch messages" });
    }
}

/**
 * Send a text message
 */
export async function sendMessage(req, res) {
    try {
        const { recipientId, text } = req.body;
        const senderId = req.user.id;

        if (!recipientId || !text?.trim()) {
            return res
                .status(400)
                .json({ message: "Recipient and text are required" });
        }

        // Find or create chat between the two users
        let chat = await Chat.findOne({
            where: {
                [Op.or]: [
                    { user1Id: senderId, user2Id: recipientId },
                    { user1Id: recipientId, user2Id: senderId },
                ],
            },
        });

        if (!chat) {
            chat = await Chat.create({ user1Id: senderId, user2Id: recipientId });
        }

        // Create the message
        const message = await Message.create({
            chatId: chat.id,
            senderId,
            content: text.trim(),
            type: "text",
        });

        // Update chat timestamp
        await chat.update({ updatedAt: new Date() });

        // Emit message in real-time via Socket.io
        const io = getIo();
        io.to(`chat_${chat.id}`).emit("new_message", message);
        io.to(`user_${recipientId}`).emit("new_message", message);

        res.status(201).json(message);
    } catch (err) {
        console.error("Send Message Error:", err);
        res.status(500).json({ message: "Failed to send message" });
    }
}

/**
 * Initialize or get a chat between two users
 */
export async function initChat(req, res) {
    try {
        const senderId = req.user.id;
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({ message: "recipientId is required" });
        }

        // Find existing chat (any order)
        let chat = await Chat.findOne({
            where: {
                [Op.or]: [
                    { user1Id: senderId, user2Id: recipientId },
                    { user1Id: recipientId, user2Id: senderId },
                ],
            },
        });

        // Create new chat if none found
        if (!chat) {
            chat = await Chat.create({ user1Id: senderId, user2Id: recipientId });
        }

        res.json({ chatId: chat.id });
    } catch (err) {
        console.error("Init Chat Error:", err);
        res.status(500).json({ message: "Failed to initialize chat" });
    }
}

