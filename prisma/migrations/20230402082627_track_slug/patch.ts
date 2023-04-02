import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();

async function main() {
  const tracks = await prisma.track.findMany({
    where: {},
    select: { id: true, title: true },
  });

  for (const { id, title } of tracks) {
    const slug = slugify(title, { lower: true, strict: true });
    await prisma.track.update({ where: { id }, data: { slug } });
    console.log("👾", `Slug added:"${title}" => ${slug}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })

  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
