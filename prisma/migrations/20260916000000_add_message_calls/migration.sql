CREATE TABLE "CallSession" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "CallSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CallSignal" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallSignal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CallSession_conversationId_status_createdAt_idx" ON "CallSession"("conversationId", "status", "createdAt");
CREATE INDEX "CallSession_callerId_createdAt_idx" ON "CallSession"("callerId", "createdAt");
CREATE INDEX "CallSignal_sessionId_createdAt_idx" ON "CallSignal"("sessionId", "createdAt");
CREATE INDEX "CallSignal_senderId_createdAt_idx" ON "CallSignal"("senderId", "createdAt");

ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallSignal" ADD CONSTRAINT "CallSignal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CallSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallSignal" ADD CONSTRAINT "CallSignal_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
