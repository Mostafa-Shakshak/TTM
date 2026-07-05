-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('Private', 'Group');

-- CreateEnum
CREATE TYPE "ConversationRole" AS ENUM ('Admin', 'Member');

-- CreateEnum
CREATE TYPE "messageStatus" AS ENUM ('Sent', 'Delivered', 'Seen');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'Private',
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversationMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ConversationRole" NOT NULL DEFAULT 'Member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "mutedUntil" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mesaage" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "image" TEXT,
    "attachment" TEXT,
    "senderId" TEXT NOT NULL,
    "convId" TEXT NOT NULL,
    "replyToId" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mesaage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messageReciept" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "messageStatus" NOT NULL DEFAULT 'Sent',
    "seenAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messageReciept_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversationMember_userId_idx" ON "conversationMember"("userId");

-- CreateIndex
CREATE INDEX "conversationMember_conversationId_idx" ON "conversationMember"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "conversationMember_userId_conversationId_key" ON "conversationMember"("userId", "conversationId");

-- CreateIndex
CREATE INDEX "Mesaage_senderId_idx" ON "Mesaage"("senderId");

-- CreateIndex
CREATE INDEX "Mesaage_convId_idx" ON "Mesaage"("convId");

-- CreateIndex
CREATE INDEX "Mesaage_replyToId_idx" ON "Mesaage"("replyToId");

-- CreateIndex
CREATE INDEX "messageReciept_messageId_idx" ON "messageReciept"("messageId");

-- CreateIndex
CREATE INDEX "messageReciept_userId_idx" ON "messageReciept"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "messageReciept_messageId_userId_key" ON "messageReciept"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "conversationMember" ADD CONSTRAINT "conversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversationMember" ADD CONSTRAINT "conversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesaage" ADD CONSTRAINT "Mesaage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesaage" ADD CONSTRAINT "Mesaage_convId_fkey" FOREIGN KEY ("convId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mesaage" ADD CONSTRAINT "Mesaage_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Mesaage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messageReciept" ADD CONSTRAINT "messageReciept_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Mesaage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messageReciept" ADD CONSTRAINT "messageReciept_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
