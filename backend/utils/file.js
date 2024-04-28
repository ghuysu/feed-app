const fs = require("fs");

const deleteFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) {
      err.statusCode = 422;
      throw err;
    } else {
      console.log(`Deleted ${path} successfully`);
    }
  });
};

module.exports = {
    deleteFile
}