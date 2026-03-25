const fs = require('fs');

let content = fs.readFileSync('platform/prisma/seed.ts', 'utf8');

// Add "subjectId: dsaSubject.id," to where the module is created
content = content.replace(
  `const createdModule = await prisma.module.create({
      data: {
        title: seedModule.title,
        description: seedModule.description,
        order: seedModule.order,
      },
    });`,
  `const createdModule = await prisma.module.create({
      data: {
        title: seedModule.title,
        description: seedModule.description,
        order: seedModule.order,
        subjectId: dsaSubject.id,
      },
    });`
);

// Add clear subjects and create subjects block
content = content.replace(
  `await prisma.module.deleteMany();
  await prisma.user.deleteMany();`,
  `await prisma.module.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();`
);

content = content.replace(
  `const moduleMap = new Map<string, string>();`,
  `// Create Subjects
  const dsaSubject = await prisma.subject.create({
    data: {
      title: "Data Structures & Algorithms",
      description: "Master problem solving and core data structures. Complete modules and AI interview.",
      order: 1,
    }
  });
  const osSubject = await prisma.subject.create({
    data: {
      title: "Operating Systems",
      description: "Conceptual and architectural understanding of OS.",
      order: 2,
    }
  });
  const dbmsSubject = await prisma.subject.create({
    data: {
      title: "Database Management Systems",
      description: "SQL, relational models, and database design.",
      order: 3,
    }
  });
  console.log("Created subjects");

  const moduleMap = new Map<string, string>();`
);

fs.writeFileSync('platform/prisma/seed.ts', content);
console.log("seed.ts updated");
