//backend/src/utils/io.js
import Message from "../models/Message.js";
import { Op } from "sequelize";

let ioInstance = null;

export function setIo(io) {
    ioInstance = io;

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Join chat rooms dynamically
        socket.on("join_chat", (chatId) => {
            socket.join(`chat_${chatId}`);
        });

        socket.on("leave_chat", (chatId) => {
            socket.leave(`chat_${chatId}`);
        });

        // 🟢 Handle marking messages as read
        socket.on("mark_read", async ({ chatId, userId }) => {
            try {
                const now = new Date();
                await Message.update(
                    { status: "read", seenBy: String(userId), seenAt: now },
                    { where: { chatId, senderId: { [Op.ne]: userId }, status: { [Op.ne]: "read" } } }
                );

                io.to(`chat_${chatId}`).emit("messages_read", {
                    chatId,
                    readerId: userId,
                    seenAt: now
                });
            } catch (err) {
                console.error("Socket read mark error:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });
}

export function getIo() {
    if (!ioInstance) {
        throw new Error("Socket.io not initialized yet!");
    }
    return ioInstance;
}

