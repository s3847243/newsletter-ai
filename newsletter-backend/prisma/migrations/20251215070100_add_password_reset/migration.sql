-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetTokenExp" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" TEXT;
