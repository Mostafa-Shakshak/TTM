-- CreateEnum
CREATE TYPE "FollowStatus" AS ENUM ('Accepted', 'Rejected', 'Pending');

-- AlterTable
ALTER TABLE "Follow" ADD COLUMN     "status" "FollowStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;
