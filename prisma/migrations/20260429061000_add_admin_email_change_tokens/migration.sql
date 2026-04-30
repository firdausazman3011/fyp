-- CreateTable
CREATE TABLE "AdminEmailChangeToken" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminEmailChangeToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminEmailChangeToken_tokenHash_key" ON "AdminEmailChangeToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminEmailChangeToken_adminId_idx" ON "AdminEmailChangeToken"("adminId");

-- CreateIndex
CREATE INDEX "AdminEmailChangeToken_expiresAt_idx" ON "AdminEmailChangeToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "AdminEmailChangeToken" ADD CONSTRAINT "AdminEmailChangeToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
