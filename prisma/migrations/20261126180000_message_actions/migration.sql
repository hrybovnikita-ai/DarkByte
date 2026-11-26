-- CreateEnum
CREATE TYPE "MessageFeedbackRating" AS ENUM ('GOOD', 'BAD');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "branchedFromId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "branchedFromMessageId" TEXT;

-- CreateTable
CREATE TABLE "MessageFeedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" "MessageFeedbackRating" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationShare" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_branchedFromId_idx" ON "Conversation"("branchedFromId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageFeedback_messageId_userId_key" ON "MessageFeedback"("messageId", "userId");

-- CreateIndex
CREATE INDEX "MessageFeedback_userId_idx" ON "MessageFeedback"("userId");

-- CreateIndex
CREATE INDEX "MessageFeedback_messageId_idx" ON "MessageFeedback"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationShare_token_key" ON "ConversationShare"("token");

-- CreateIndex
CREATE INDEX "ConversationShare_conversationId_idx" ON "ConversationShare"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationShare_createdById_idx" ON "ConversationShare"("createdById");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_branchedFromId_fkey" FOREIGN KEY ("branchedFromId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageFeedback" ADD CONSTRAINT "MessageFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationShare" ADD CONSTRAINT "ConversationShare_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationShare" ADD CONSTRAINT "ConversationShare_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;