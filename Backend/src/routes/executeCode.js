import express from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

const router = express.Router();

const tempDir = path.join(process.cwd(), "temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

router.post("/", async (req, res) => {
  const { language, code } = req.body;

  try {
    let fileName = "";
    let command = "";

    switch (language) {
      case "javascript":
        fileName = "temp.js";

        fs.writeFileSync(
          path.join(tempDir, fileName),
          code
        );

        command = `node ${path.join(
          tempDir,
          fileName
        )}`;
        break;

      case "python":
        fileName = "temp.py";

        fs.writeFileSync(
          path.join(tempDir, fileName),
          code
        );

        command = `python ${path.join(
          tempDir,
          fileName
        )}`;
        break;

      case "cpp":
        fileName = "temp.cpp";

        fs.writeFileSync(
          path.join(tempDir, fileName),
          code
        );

        command =
          `g++ ${path.join(
            tempDir,
            fileName
          )} -o ${path.join(
            tempDir,
            "temp.exe"
          )} && ${path.join(
            tempDir,
            "temp.exe"
          )}`;
        break;

      case "java":
        fileName = "Main.java";

        fs.writeFileSync(
          path.join(tempDir, fileName),
          code
        );

        command =
          `javac ${path.join(
            tempDir,
            fileName
          )} && java -cp ${tempDir} Main`;
        break;

      default:
        return res.status(400).json({
          success: false,
          output: "Unsupported language",
        });
    }

    exec(
      command,
      (error, stdout, stderr) => {
        if (error) {
          return res.json({
            success: false,
            output: stderr,
          });
        }

        res.json({
          success: true,
          output: stdout,
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      output: error.message,
    });
  }
});

export default router;