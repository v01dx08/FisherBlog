CREATE TABLE "PostPublication" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostPublication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PostPublication_postId_url_key" ON "PostPublication"("postId", "url");
CREATE INDEX "PostPublication_postId_createdAt_idx" ON "PostPublication"("postId", "createdAt");

ALTER TABLE "PostPublication"
ADD CONSTRAINT "PostPublication_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
