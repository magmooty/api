const startIndex = process.argv.findIndex((arg) => arg === __filename);

const args = process.argv.slice(startIndex + 1);

require(`./seed-${args[0]}.ts`);
