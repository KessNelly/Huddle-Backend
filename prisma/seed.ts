import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create default channels
  const general = await prisma.channel.upsert({
    where: { name: "general" },
    update: {},
    create: { name: "general" },
  });

  const random = await prisma.channel.upsert({
    where: { name: "random" },
    update: {},
    create: { name: "random" },
  });

  const design = await prisma.channel.upsert({
    where: { name: "design" },
    update: {},
    create: { name: "design" },
  });

  console.log("Seeded channels:", general.name, design.name, random.name);

  // Optional: create a couple of test users (password = "password123")
  const passwordHash = await bcrypt.hash("password123", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@huddle.dev" },
    update: {},
    create: {
      email: "alice@huddle.dev",
      name: "Alice",
      password: passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@huddle.dev" },
    update: {},
    create: {
      email: "bob@huddle.dev",
      name: "Bob",
      password: passwordHash,
    },
  });

  console.log("Seeded test users:", alice.email, bob.email);
  console.log('Test password for both users: "password123"');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });