CREATE TABLE "MessagePin" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "pinnedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessagePin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MessagePin_messageId_key" ON "MessagePin"("messageId");
CREATE INDEX "MessagePin_conversationId_createdAt_idx" ON "MessagePin"("conversationId", "createdAt");
CREATE INDEX "MessagePin_pinnedById_createdAt_idx" ON "MessagePin"("pinnedById", "createdAt");

ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
