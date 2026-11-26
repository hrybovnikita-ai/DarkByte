-- Chat AI: model selection on conversations, optional model tag on assistant messages.
ALTER TABLE "Conversation" ADD COLUMN "modelId" TEXT NOT NULL DEFAULT 'gemini-2.0-flash';

CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");

ALTER TABLE "Message" ADD COLUMN "modelId" TEXT;

CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");