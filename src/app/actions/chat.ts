"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function sendMessageAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const roomId = String(formData.get("roomId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!roomId || !content) return;

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room || (room.userAId !== user.id && room.userBId !== user.id)) return;

  await prisma.message.create({ data: { roomId, senderId: user.id, content } });
  revalidatePath(`/chat/${roomId}`);
}
