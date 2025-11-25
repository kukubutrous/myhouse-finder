//backend/src/controllers/messageController.js
import Message from "../models/Message.js";
import { getIo } from "../utils/io.js";
import { Op } from "sequelize";

export const sendFileMessage = async (req, res) => {
    try {
        const { chatId } = req.body;
        const senderId = req.user.id;
        const io = getIo();

        if (!req.file || !chatId) return res.status(400).json({ error: "File and chatId required" });

        const fileType = req.file.mimetype.startsWith("image/")
            ? "image"
            : req.file.mimetype === "application/pdf"
                ? "pdf"
                : req.file.mimetype.startsWith("video/")
                    ? "video"
                    : req.file.mimetype.startsWith("audio/")
                        ? "audio"
                        : "file";

        const fileUrl = `/uploads/${req.file.filename}`;

        const message = await Message.create({
            chatId,
            senderId,
            content: fileUrl,
            type: fileType,
        });

        io.to(`chat_${chatId}`).emit("new_message", message);

        res.status(201).json(message);
    } catch (err) {
        console.error("Error sending file message:", err);
        res.status(500).json({ error: err.message });
    }
};


/**
 * Mark messages as read in a chat.
 */
export const markMessagesAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        const io = getIo();

        // Find unread messages not sent by this user
        const unreadMessages = await Message.findAll({
            where: { chatId, senderId: { [Op.ne]: userId }, status: { [Op.ne]: 'read' } }
        });

        if (unreadMessages.length === 0) return res.json({ updated: 0 });

        // Update them as read
        const now = new Date();
        await Message.update(
            { status: 'read', seenBy: String(userId), seenAt: now },
            { where: { chatId, senderId: { [Op.ne]: userId }, status: { [Op.ne]: 'read' } } }
        );

        // Notify both participants in real time
        io.to(`chat_${chatId}`).emit("messages_read", {
            chatId,
            readerId: userId,
            seenAt: now
        });

        res.json({ success: true, count: unreadMessages.length });
    } catch (err) {
        console.error("Mark Messages Read Error:", err);
        res.status(500).json({ message: "Failed to mark messages as read" });
    }
};

