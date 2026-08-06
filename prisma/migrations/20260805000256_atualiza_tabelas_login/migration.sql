/*
  Warnings:

  - The primary key for the `Clientes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `adrress` on the `Clientes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `Clientes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `Clientes` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `Clientes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Clientes" DROP CONSTRAINT "Clientes_pkey",
DROP COLUMN "adrress",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET NOT NULL,
ADD CONSTRAINT "Clientes_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Clientes_id_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Clientes_email_key" ON "Clientes"("email");
