const fs = require('fs');
let content = fs.readFileSync('prisma/seed.ts', 'utf8');
content = content.replace(
  'import { PrismaClient } from "../generated/prisma/client/index.js";',
  'import { PrismaClient } from "../generated/prisma/client";'
);
fs.writeFileSync('prisma/seed.ts', content);
