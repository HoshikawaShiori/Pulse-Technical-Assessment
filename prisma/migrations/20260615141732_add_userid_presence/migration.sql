-- AlterTable
ALTER TABLE "Presence" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Presence_userId_idx" ON "Presence"("userId");
