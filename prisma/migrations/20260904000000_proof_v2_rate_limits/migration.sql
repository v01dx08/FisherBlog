ALTER TABLE "Post"
ADD COLUMN "proofVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "proofPayload" JSONB;

ALTER TABLE "MediaAsset"
ADD COLUMN "sha256" CHAR(64);

ALTER TABLE "MediaAsset"
ADD CONSTRAINT "MediaAsset_sha256_format"
CHECK ("sha256" IS NULL OR "sha256" ~ '^[a-f0-9]{64}$');

CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");
