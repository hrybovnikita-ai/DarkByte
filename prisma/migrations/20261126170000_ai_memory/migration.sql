-- AI memory (pgvector optional; embeddings also stored as JSON for Prisma)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "MemoryKind" AS ENUM ('FACT', 'PREFERENCE', 'EPISODE');

CREATE TABLE "UserMemoryProfile" (
    "userId" TEXT NOT NULL,
    "narrative" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserMemoryProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "sourceConversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationMemory" (
    "conversationId" TEXT NOT NULL,
    "summary" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConversationMemory_pkey" PRIMARY KEY ("conversationId")
);

CREATE TABLE "MemoryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "MemoryKind" NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "embedding" JSONB,
    "sourceConversationId" TEXT,
    "sourceMessageId" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MemoryEntry_pkey" PRIMARY KEY ("id")
);

-- Optional pgvector column for Neon similarity (synced from JSON embeddings in app code)
ALTER TABLE "MemoryEntry" ADD COLUMN IF NOT EXISTS "embeddingVec" vector(384);

CREATE INDEX IF NOT EXISTS "MemoryEntry_embeddingVec_idx"
ON "MemoryEntry" USING hnsw ("embeddingVec" vector_cosine_ops);

CREATE UNIQUE INDEX "UserPreference_userId_key_key" ON "UserPreference"("userId", "key");
CREATE INDEX "UserPreference_userId_idx" ON "UserPreference"("userId");
CREATE INDEX "MemoryEntry_userId_idx" ON "MemoryEntry"("userId");
CREATE INDEX "MemoryEntry_userId_kind_idx" ON "MemoryEntry"("userId", "kind");
CREATE INDEX "MemoryEntry_userId_contentHash_idx" ON "MemoryEntry"("userId", "contentHash");
CREATE INDEX "MemoryEntry_userId_importance_idx" ON "MemoryEntry"("userId", "importance");

ALTER TABLE "UserMemoryProfile" ADD CONSTRAINT "UserMemoryProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationMemory" ADD CONSTRAINT "ConversationMemory_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemoryEntry" ADD CONSTRAINT "MemoryEntry_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;