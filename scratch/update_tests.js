const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith(".js")) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(path.resolve(__dirname, "../apps/inkwell-api/test"));

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, "utf8");
  if (/require\(["']\.\.\/\.\.\/src\/models\/User["']\)/.test(content)) {
    content = content.replace(/const User = require\(["']\.\.\/\.\.\/src\/models\/User["']\);/g, 'const { User } = require("@vami/identity-service");');
    fs.writeFileSync(filePath, content, "utf8");
    console.log("Updated User import in test file:", path.relative(process.cwd(), filePath));
  }
});
